"""
chat/handler.py
---------------
Broadcasts a fan's chat message to every connected fan in real time
AND persists it to DynamoDB so users joining later see the history.

History is stored on the GameRoom item as a bounded list (`chatHistory`)
capped at the last MAX_HISTORY messages. This avoids creating a new
table while keeping the demo experience continuous.

WebSocket message (client → server):
{
  "action":   "chat",
  "message":  "What a save!",
  "name":     "GoalHunter",
  "playerId": "fan-abc123"
}

Broadcast to all fans:
{
  "type":     "CHAT_MESSAGE",
  "id":       "conn123-1748000000000",
  "name":     "GoalHunter",
  "message":  "What a save!",
  "time":     1748000000000,
  "xpEarned": 5   ← only present when a milestone is hit
}
"""

import json
import time
from decimal import Decimal
from arena import db, ws, responses

ROOM_ID     = "main"
MAX_LEN     = 200   # maximum message length
XP_PER_MSGS = 5     # award XP every N messages
XP_REWARD   = 5     # XP per milestone
MAX_HISTORY = 100   # keep the most recent N messages on disk


def append_to_history(message_item):
    """
    Append a chat message to the GameRoom.chatHistory list and trim to
    the most recent MAX_HISTORY entries. Two DynamoDB round-trips —
    fine for a hackathon demo, and never blocks the broadcast above.
    """
    table = db.game_room_table()

    # Convert ms-timestamp int → Decimal for DynamoDB
    safe_item = {
        "id":       str(message_item["id"]),
        "name":     str(message_item["name"]),
        "message":  str(message_item["message"]),
        "time":     Decimal(str(message_item["time"])),
    }
    if message_item.get("xpEarned"):
        safe_item["xpEarned"] = Decimal(str(message_item["xpEarned"]))

    try:
        # 1. Append the new item
        table.update_item(
            Key={"roomId": ROOM_ID},
            UpdateExpression=(
                "SET chatHistory = list_append("
                "  if_not_exists(chatHistory, :empty),"
                "  :new"
                ")"
            ),
            ExpressionAttributeValues={
                ":empty": [],
                ":new":   [safe_item],
            },
        )

        # 2. Read back and trim if oversized (only when we'd exceed cap)
        item = table.get_item(Key={"roomId": ROOM_ID}).get("Item", {})
        history = item.get("chatHistory", []) or []
        if len(history) > MAX_HISTORY:
            trimmed = history[-MAX_HISTORY:]
            table.update_item(
                Key={"roomId": ROOM_ID},
                UpdateExpression="SET chatHistory = :h",
                ExpressionAttributeValues={":h": trimmed},
            )
    except Exception as e:
        print(f"chat: failed to persist message: {e}")


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    body          = json.loads(event.get("body", "{}"))

    raw_message = (body.get("message") or "").strip()
    player_name = (body.get("name")    or "Fan").strip()[:30]
    player_id   = (body.get("playerId") or connection_id)

    if not raw_message:
        return responses.ok("empty")

    message = raw_message[:MAX_LEN]

    # ── Increment chat message count + optionally award XP ──────────────────
    player_table = db.players_table()
    xp_earned    = 0

    try:
        resp = player_table.update_item(
            Key={"playerId": player_id},
            UpdateExpression=(
                "ADD chatMessages :one, score :xp "
                "SET #name = :name"
            ),
            ExpressionAttributeNames={"#name": "name"},
            ExpressionAttributeValues={
                ":one":  1,
                ":xp":   0,       # start with 0; we'll check milestone below
                ":name": player_name,
            },
            ReturnValues="ALL_NEW",
        )
        chat_count = int(resp["Attributes"].get("chatMessages", 0))

        # Award XP on milestone (every XP_PER_MSGS messages)
        if chat_count % XP_PER_MSGS == 0:
            player_table.update_item(
                Key={"playerId": player_id},
                UpdateExpression="ADD score :xp",
                ExpressionAttributeValues={":xp": XP_REWARD},
            )
            xp_earned = XP_REWARD
    except Exception as e:
        print(f"DB update error for {player_id}: {e}")

    # ── Build the message payload ────────────────────────────────────────────
    msg_id  = f"{connection_id}-{int(time.time() * 1000)}"
    msg_ts  = int(time.time() * 1000)
    payload = {
        "type":    "CHAT_MESSAGE",
        "id":      msg_id,
        "name":    player_name,
        "message": message,
        "time":    msg_ts,
    }
    if xp_earned:
        payload["xpEarned"] = xp_earned

    # ── Persist to history BEFORE broadcasting so a race-condition where
    #    a new user connects after the broadcast still sees the message ──
    append_to_history({
        "id":       msg_id,
        "name":     player_name,
        "message":  message,
        "time":     msg_ts,
        "xpEarned": xp_earned or None,
    })

    # ── Broadcast to all fans ────────────────────────────────────────────────
    apigw = ws.get_apigw_client(event)
    ws.broadcast(apigw, db.connections_table(), payload)
    return responses.ok("sent")
