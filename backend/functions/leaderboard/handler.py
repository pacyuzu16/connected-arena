"""
leaderboard/handler.py
----------------------
Returns the live leaderboard to the requesting fan, including
accuracy %, level (derived from score), and current win streak.

WebSocket message (client → server):
{ "action": "leaderboard" }

Response to client:
{
  "type": "LEADERBOARD",
  "players": [
    {
      "rank": 1, "name": "Fan_abc", "score": 350,
      "predictions": 5, "correct": 3,
      "accuracy": 60, "level": 3, "winStreak": 2,
      "persona": "stats_nerd"
    },
    ...
  ]
}
"""

from arena import db, ws, responses


def get_level(score: int) -> int:
    """Convert a raw score into a display level (1–5)."""
    if score >= 1000: return 5
    if score >= 600:  return 4
    if score >= 300:  return 3
    if score >= 100:  return 2
    return 1


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    # Scan all players and sort by score descending
    result  = db.players_table().scan()
    players = result.get("Items", [])
    players.sort(key=lambda p: int(p.get("score", 0)), reverse=True)

    leaderboard = []
    for rank, player in enumerate(players[:20], start=1):
        # totalPredictions is incremented at resolution time (reliable).
        # Fall back to predictions (incremented at submit time) for older records.
        total    = int(player.get("totalPredictions", 0)) or int(player.get("predictions", 0))
        correct  = int(player.get("correctPredictions", 0))
        score    = int(player.get("score", 0))
        accuracy = round(correct / total * 100) if total > 0 else 0

        leaderboard.append({
            "rank":        rank,
            "playerId":    player.get("playerId", ""),   # ← crucial for client-side identity
            "name":        player.get("name", "Unknown Fan"),
            "score":       score,
            "predictions": total,
            "correct":     correct,
            "persona":     player.get("persona", "casual"),
            "level":       get_level(score),
            "winStreak":   int(player.get("winStreak", 0)),
            "accuracy":    accuracy,
            # extra fields used by achievement checks
            "achievements": list(player.get("achievements", [])),
        })

    apigw = ws.get_apigw_client(event)
    ws.send_message(apigw, connection_id, {
        "type":    "LEADERBOARD",
        "players": leaderboard,
    })

    return responses.ok()
