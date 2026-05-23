"""
broadcast/handler.py
--------------------
Broadcasts a match event to ALL connected fans.
Called by the event emitter (scheduled Lambda or manual trigger).

Payload sent to each client:
{
  "type": "MATCH_EVENT",
  "event": {
    "eventType": "GOAL" | "SHOT" | "PENALTY" | ...,
    "team": "DFL-CLU-000001",
    "eventTime": "2025-01-01T16:30:17.210+02:00",
    "pointsAvailable": 100,
    "predictionWindow": 10   // seconds fans have to predict
  }
}
"""

import json
from arena import db, ws, responses

ROOM_ID = "main"


def lambda_handler(event, context):
    # Support both WebSocket invocation and direct Lambda invocation.
    # WebSocket (API GW): event has a "body" string key.
    # Direct invocation (EventEmitter / emit_events.py): event IS the payload dict.
    if "body" in event:
        body = event["body"]
        if isinstance(body, str):
            body = json.loads(body)
        match_event = body.get("event", body)
    else:
        match_event = event.get("event", event)

    # Allow caller to pass an explicit WS endpoint (used by emit_events.py)
    endpoint_url = event.get("WS_ENDPOINT") or None
    apigw = ws.get_apigw_client(event, endpoint_url=endpoint_url)

    # Update shared game room state
    db.game_room_table().update_item(
        Key={"roomId": ROOM_ID},
        UpdateExpression="SET currentEvent = :e, lastUpdated = :t",
        ExpressionAttributeValues={
            ":e": match_event,
            ":t": match_event.get("eventTime", ""),
        },
    )

    stats = ws.broadcast(apigw, db.connections_table(), {"type": "MATCH_EVENT", "event": match_event})

    return responses.ok(json.dumps(stats))
