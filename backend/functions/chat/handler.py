"""
chat/handler.py
---------------
Broadcasts a fan's chat message to every connected fan in real time.
Awards XP for active chatters: +5 XP every 5 messages sent.

WebSocket message (client → server):
{
  "action":   "chat",
  "message":  "What a save!",
  "name":     "GoalHunter",
  "playerId": "fan-abc123"
}

Broadcast to all fans:
{
  "type":       "CHAT_MESSAGE",
  "id":         "conn123-1748000000000",
  "name":       "GoalHunter",
  "message":    "What a save!",
  "time":       1748000000000,
  "xpEarned":  5    ← only present when a milestone is hit
}
"""

import json
import time
from arena import db, ws, responses

MAX_LEN        = 200   # maximum message length
XP_PER_MSGS    = 5     # award XP every N messages
XP_REWARD      = 5     # XP per milestone


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

    # ── Broadcast to all fans ────────────────────────────────────────────────
    apigw   = ws.get_apigw_client(event)
    payload = {
        "type":    "CHAT_MESSAGE",
        "id":      f"{connection_id}-{int(time.time() * 1000)}",
        "name":    player_name,
        "message": message,
        "time":    int(time.time() * 1000),
    }
    if xp_earned:
        payload["xpEarned"] = xp_earned

    ws.broadcast(apigw, db.connections_table(), payload)
    return responses.ok("sent")
