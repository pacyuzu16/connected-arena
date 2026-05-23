"""
leaderboard/handler.py
----------------------
Returns the live leaderboard to the requesting fan, including
accuracy %, level (derived from score), and current win streak.

The top-20 players are always returned. In addition, if the caller
is ranked > 20, their own entry is appended so the client can always
find `myPlayer` for the profile panel.

WebSocket message (client → server):
{ "action": "leaderboard" }

Response to client:
{
  "type": "LEADERBOARD",
  "players": [
    { "rank": 1, "playerId": "...", "name": "...", "score": 350,
      "predictions": 5, "correct": 3, "accuracy": 60, "level": 3,
      "winStreak": 2, "persona": "stats_nerd" },
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


def _format_entry(rank, player):
    total    = int(player.get("totalPredictions", 0)) or int(player.get("predictions", 0))
    correct  = int(player.get("correctPredictions", 0))
    score    = int(player.get("score", 0))
    accuracy = round(correct / total * 100) if total > 0 else 0
    return {
        "rank":         rank,
        "playerId":     player.get("playerId", ""),
        "name":         player.get("name", "Unknown Fan"),
        "score":        score,
        "predictions":  total,
        "correct":      correct,
        "persona":      player.get("persona", "casual"),
        "level":        get_level(score),
        "winStreak":    int(player.get("winStreak", 0)),
        "accuracy":     accuracy,
        "achievements": list(player.get("achievements", [])),
    }


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    # Resolve the caller's playerId so we can guarantee their own entry is
    # included even if they're ranked > 20. This is what keeps the profile
    # panel name / score in sync after a name change for low-XP players.
    caller_player_id = None
    try:
        conn = db.connections_table().get_item(
            Key={"connectionId": connection_id}
        ).get("Item", {})
        caller_player_id = conn.get("playerId")
    except Exception as exc:
        print(f"could not resolve caller playerId: {exc}")

    # Scan all players and sort by score descending
    result  = db.players_table().scan()
    players = result.get("Items", [])
    players.sort(key=lambda p: int(p.get("score", 0)), reverse=True)

    # Build the top-20 leaderboard preserving ranks
    leaderboard = [_format_entry(r, p) for r, p in enumerate(players[:20], start=1)]
    top20_ids   = {p.get("playerId") for p in players[:20]}

    # Always append the caller's own entry if they're outside the top 20.
    if caller_player_id and caller_player_id not in top20_ids:
        for rank, p in enumerate(players, start=1):
            if p.get("playerId") == caller_player_id:
                leaderboard.append(_format_entry(rank, p))
                break

    apigw = ws.get_apigw_client(event)
    ws.send_message(apigw, connection_id, {
        "type":    "LEADERBOARD",
        "players": leaderboard,
    })

    return responses.ok()
