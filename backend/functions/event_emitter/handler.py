"""
event_emitter/handler.py
------------------------
Scheduled Lambda (runs every minute via EventBridge).

Reads the next unprocessed match event from DynamoDB (MatchEvents table),
broadcasts it to all connected fans via BroadcastFunction, and — for
high-impact events — also invokes BedrockCommentaryFunction.

For events that resolve a prediction window (GOAL resolves prior SHOT/PENALTY/
FREE_KICK predictions), predictions are scored inline before broadcasting.

Flow:
  EventBridge (rate 1 min)
      → EventEmitterFunction
          → resolve_predictions()  (awards points for correct predictions)
          → BroadcastFunction      (sends MATCH_EVENT to all WebSocket fans)
          → BedrockCommentaryFunction  (sends AI_COMMENTARY for GOAL/PENALTY/etc.)

The MatchEvents table uses (matchId, eventTime) as the composite key.
Events are sorted by eventTime and processed one per tick so the feed
feels live rather than dumping everything at once.

To replay a match from scratch, set all items' `processed` attribute
back to False in DynamoDB and reset Players scores.
"""

import json
import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from arena import db

lambda_client = boto3.client("lambda")

MATCH_ID         = os.environ.get("MATCH_ID", "DFL-MAT-111111")
BROADCAST_FN     = os.environ["BROADCAST_FUNCTION_NAME"]
COMMENTARY_FN    = os.environ["COMMENTARY_FUNCTION_NAME"]

# Event types that warrant AI commentary (high-impact moments)
COMMENTARY_EVENTS = {"GOAL", "PENALTY", "VAR", "YELLOW_CARD", "WHISTLE"}

# When one of these events fires, resolve open predictions for the
# listed trigger event types (the ones that opened a prediction window).
# e.g. a GOAL resolves all open SHOT, PENALTY, FREE_KICK predictions.
RESOLVES_PREDICTIONS_FOR = {
    "GOAL":    {"SHOT", "PENALTY", "FREE_KICK", "CORNER"},
    "WHISTLE": {"SHOT", "PENALTY", "FREE_KICK", "CORNER", "VAR"},
}


def get_next_event(table) -> dict | None:
    """
    Query the MatchEvents table for the earliest unprocessed event
    for the current match.  Returns None if everything is processed.
    """
    result = table.query(
        KeyConditionExpression=Key("matchId").eq(MATCH_ID),
        FilterExpression=Attr("processed").eq(False),
        ScanIndexForward=True,   # ascending eventTime → oldest first
        Limit=1,
    )
    items = result.get("Items", [])
    return items[0] if items else None


def mark_processed(table, event_time: str):
    """Mark a single event as processed so it won't be emitted again."""
    table.update_item(
        Key={"matchId": MATCH_ID, "eventTime": event_time},
        UpdateExpression="SET #p = :t",
        ExpressionAttributeNames={"#p": "processed"},   # 'processed' is a reserved word
        ExpressionAttributeValues={":t": True},
    )


def resolve_predictions_for_event(event_item: dict):
    """
    When a resolving event fires (e.g. GOAL), find all open predictions
    whose eventType is in the resolution set and award points.

    outcome=True  → "yes" predictions were correct (shot became a goal)
    outcome=False → "no" predictions were correct (shot did not score)

    For GOAL: outcome is True (the shot/penalty DID result in a goal).
    For WHISTLE (end of half/match): outcome is False for any still-open
    predictions (the event did NOT result in a goal before the whistle).
    """
    event_type = event_item.get("eventType", "")
    resolvable = RESOLVES_PREDICTIONS_FOR.get(event_type)
    if not resolvable:
        return

    outcome = event_type == "GOAL"   # True for GOAL, False for WHISTLE
    points  = int(event_item.get("pointsAvailable", 0))

    pred_table   = db.predictions_table()
    player_table = db.players_table()

    # Scan for unresolved predictions, then filter in Python to those
    # whose eventType matches the resolvable set for this resolving event.
    # (DynamoDB cannot filter on a set membership directly.)
    result = pred_table.scan(
        FilterExpression=Attr("resolved").eq(False)
    )
    raw_preds = list(result.get("Items", []))

    # Handle pagination
    while "LastEvaluatedKey" in result:
        result = pred_table.scan(
            FilterExpression=Attr("resolved").eq(False),
            ExclusiveStartKey=result["LastEvaluatedKey"],
        )
        raw_preds.extend(result.get("Items", []))

    # ── KEY FIX: only resolve predictions for the correct event types ──
    # Predictions store `eventType` (the type of event they predicted on,
    # e.g. SHOT or PENALTY). Only resolve those in the resolvable set.
    open_preds = [
        p for p in raw_preds
        if p.get("eventType") in resolvable
    ]

    resolved_count = 0
    for pred in open_preds:
        correct = (pred["prediction"] == "yes") == outcome
        earned  = points if correct else 0

        pred_table.update_item(
            Key={"predictionId": pred["predictionId"]},
            UpdateExpression="SET resolved = :t, correct = :c, pointsEarned = :p",
            ExpressionAttributeValues={":t": True, ":c": correct, ":p": earned},
        )

        if earned > 0:
            # Correct — add points, increment win streak and resolved count
            player_table.update_item(
                Key={"playerId": pred["playerId"]},
                UpdateExpression="ADD score :p, correctPredictions :one, winStreak :one, totalPredictions :one",
                ExpressionAttributeValues={":p": earned, ":one": 1},
            )
        else:
            # Wrong — reset win streak, still count the resolved prediction
            player_table.update_item(
                Key={"playerId": pred["playerId"]},
                UpdateExpression="SET winStreak = :zero ADD totalPredictions :one",
                ExpressionAttributeValues={":zero": 0, ":one": 1},
            )

        resolved_count += 1

    if resolved_count:
        print(f"Resolved {resolved_count} predictions for {event_type} (outcome={outcome}, pts={points})")


def invoke_broadcast(event_item: dict):
    """
    Invoke BroadcastFunction with the match event payload.
    BroadcastFunction expects: { "event": { ...match event fields... } }
    """
    payload = {
        "event": {
            "eventId":          event_item.get("eventId", ""),
            "eventType":        event_item.get("eventType", ""),
            "team":             event_item.get("team", ""),
            "player":           event_item.get("player", ""),
            "eventTime":        event_item.get("eventTime", ""),
            "pointsAvailable":  int(event_item.get("pointsAvailable", 0)),
            "predictionWindow": int(event_item.get("predictionWindow", 0)),
            "xPosition":        event_item.get("xPosition", "0"),
            "yPosition":        event_item.get("yPosition", "0"),
        }
    }
    lambda_client.invoke(
        FunctionName=BROADCAST_FN,
        InvocationType="Event",   # async — don't wait for response
        Payload=json.dumps(payload).encode(),
    )
    print(f"Broadcast invoked for event {payload['event']['eventId']} ({payload['event']['eventType']})")


def invoke_commentary(event_item: dict):
    """
    Invoke BedrockCommentaryFunction for high-impact events.
    Passes the WS_ENDPOINT env var so commentary can reach fans.
    """
    payload = {
        "eventType":  event_item.get("eventType", ""),
        "team":       event_item.get("team", ""),
        "wsEndpoint": os.environ.get("WS_ENDPOINT", ""),
    }
    lambda_client.invoke(
        FunctionName=COMMENTARY_FN,
        InvocationType="Event",   # async
        Payload=json.dumps(payload).encode(),
    )
    print(f"Commentary invoked for {payload['eventType']} by {payload['team']}")


def lambda_handler(event, context):
    table      = db.match_events_table()
    next_event = get_next_event(table)

    if not next_event:
        print(f"No unprocessed events for match {MATCH_ID}. Nothing to emit.")
        return {"statusCode": 200, "body": "no_events"}

    event_type = next_event.get("eventType", "")
    event_time = next_event.get("eventTime", "")

    print(f"Emitting: {event_type} at {event_time}")

    # 1. Resolve any open predictions this event closes (e.g. GOAL scores fans)
    resolve_predictions_for_event(next_event)

    # 2. Broadcast to all fans
    invoke_broadcast(next_event)

    # 3. Trigger AI commentary for high-impact events
    if event_type in COMMENTARY_EVENTS:
        invoke_commentary(next_event)

    # 4. Mark as processed so next tick moves on
    mark_processed(table, event_time)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "emitted":    event_type,
            "eventTime":  event_time,
            "commentary": event_type in COMMENTARY_EVENTS,
        }),
    }
