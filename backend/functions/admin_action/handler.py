"""
admin_action/handler.py
------------------------
Admin-only WebSocket actions. Verifies the caller is the admin
(by checking the stored email in the Connections table), then
performs the requested action and sends results back.

Supported actions:

  Suspend a player:
    { "action": "adminAction", "type": "suspend",   "playerId": "<id>" }

  Unsuspend a player:
    { "action": "adminAction", "type": "unsuspend", "playerId": "<id>" }

  Get full player list (with suspended status):
    { "action": "adminAction", "type": "getUsers" }

Response (sent to admin connection):
  {
    "type":     "ADMIN_ACTION_RESULT",
    "ok":       true,
    "action":   "suspend",
    "playerId": "<id>",
    "players":  [ ... ]   ← refreshed list after action
  }
"""

import json
from arena import db, ws, responses

ADMIN_EMAIL = "admin@gmail.com"


def get_level(score: int) -> int:
    if score >= 1000: return 5
    if score >= 600:  return 4
    if score >= 300:  return 3
    if score >= 100:  return 2
    return 1


def all_players():
    """Return all players sorted by score, including suspended flag."""
    result  = db.players_table().scan()
    players = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result  = db.players_table().scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        players += result.get("Items", [])

    players.sort(key=lambda p: int(p.get("score", 0)), reverse=True)
    out = []
    for rank, p in enumerate(players, 1):
        total    = int(p.get("totalPredictions", 0)) or int(p.get("predictions", 0))
        correct  = int(p.get("correctPredictions", 0))
        score    = int(p.get("score", 0))
        accuracy = round(correct / total * 100) if total > 0 else 0
        out.append({
            "rank":      rank,
            "playerId":  p.get("playerId", ""),
            "name":      p.get("name", "Unknown"),
            "email":     p.get("email", ""),
            "score":     score,
            "predictions": total,
            "correct":   correct,
            "accuracy":  accuracy,
            "level":     get_level(score),
            "winStreak": int(p.get("winStreak", 0)),
            "suspended": bool(p.get("suspended", False)),
        })
    return out


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    body = json.loads(event.get("body", "{}"))

    # ── Verify caller is admin ────────────────────────────────────────────────
    conn_record = db.connections_table().get_item(
        Key={"connectionId": connection_id}
    ).get("Item", {})

    caller_email = conn_record.get("email", "")
    if caller_email != ADMIN_EMAIL and not conn_record.get("isAdmin"):
        print(f"Unauthorised adminAction from {connection_id} ({caller_email})")
        return responses.ok("unauthorized")

    action_type = body.get("type", "")
    target_id   = body.get("playerId", "")
    apigw       = ws.get_apigw_client(event)

    # ── Handle action ─────────────────────────────────────────────────────────
    if action_type in ("suspend", "unsuspend"):
        if not target_id:
            return responses.ok("missing playerId")

        suspended = (action_type == "suspend")
        db.players_table().update_item(
            Key={"playerId": target_id},
            UpdateExpression="SET suspended = :s",
            ExpressionAttributeValues={":s": suspended},
        )
        print(f"Admin {action_type}d player {target_id}")

        # If suspending: kick any active connections for that player
        if suspended:
            conns = db.connections_table().scan(
                FilterExpression="playerId = :pid",
                ExpressionAttributeValues={":pid": target_id},
            ).get("Items", [])
            for conn in conns:
                try:
                    ws.send_message(apigw, conn["connectionId"], {
                        "type":    "ACCOUNT_STATUS",
                        "suspended": True,
                        "message": "Your account has been suspended by an admin.",
                    })
                except Exception:
                    pass

    elif action_type == "getUsers":
        pass  # just returns the player list below

    else:
        return responses.ok(f"unknown action: {action_type}")

    # ── Send refreshed player list to admin ────────────────────────────────────
    ws.send_message(apigw, connection_id, {
        "type":     "ADMIN_ACTION_RESULT",
        "ok":       True,
        "action":   action_type,
        "playerId": target_id,
        "players":  all_players(),
    })

    return responses.ok()
