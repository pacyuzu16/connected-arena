"""
predict/handler.py
------------------
Handles a fan's prediction for an upcoming event.

WebSocket message format (client → server):
{
  "action": "predict",
  "eventId": "18902400000050",
  "prediction": "yes" | "no",
  "playerId": "player-abc123"
}

Response to client:
{
  "type": "PREDICTION_ACK",
  "predictionId": "...",
  "message": "Prediction locked in! 🔒"
}
"""

import json
import uuid
import time
from arena import db, ws, responses


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    body       = json.loads(event.get("body", "{}"))
    event_id   = body.get("eventId", "")
    event_type = body.get("eventType", "")   # stored so resolution can filter by type
    prediction = body.get("prediction", "")   # "yes" or "no"
    player_id  = body.get("playerId", connection_id)

    if not event_id or prediction not in ("yes", "no"):
        return responses.bad_request("Invalid prediction")

    prediction_id = str(uuid.uuid4())
    timestamp     = int(time.time())

    db.predictions_table().put_item(Item={
        "predictionId": prediction_id,
        "eventId":      event_id,
        "eventType":    event_type,   # needed by event_emitter for correct resolution
        "playerId":     player_id,
        "prediction":   prediction,
        "timestamp":    timestamp,
        "resolved":     False,
        "correct":      None,
        "pointsEarned": 0,
    })

    # Increment prediction count for player
    db.players_table().update_item(
        Key={"playerId": player_id},
        UpdateExpression="ADD predictions :one",
        ExpressionAttributeValues={":one": 1},
    )

    apigw = ws.get_apigw_client(event)
    ws.send_message(apigw, connection_id, {
        "type":         "PREDICTION_ACK",
        "predictionId": prediction_id,
        "message":      f"Prediction locked in! {'✅ Yes' if prediction == 'yes' else '❌ No'} 🔒",
    })

    return responses.ok()
