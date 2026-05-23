"""
emit_events.py
--------------
Manual match-replay script for demo / testing.

Reads unprocessed events from DynamoDB (ConnectedArena-MatchEvents),
broadcasts each one via BroadcastFunction, triggers AI commentary for
high-impact events, resolves open predictions (GOAL/WHISTLE), and marks
each event processed so the EventBridge-scheduled Lambda skips it.

Run this OR let the EventBridge scheduler run — not both at the same time.

Usage:
    python emit_events.py --region eu-central-1 --speedup 60   # ~1.5-min demo
    python emit_events.py --region eu-central-1 --speedup 1    # real-time
    python emit_events.py --region eu-central-1 --speedup 0    # instant fire
"""

import boto3
import json
import time
import argparse
import sys
import os
from decimal import Decimal
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr

# xG model (trained on StatsBomb open data, 57k shots, AUC=0.753)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
try:
    from backend.ml.xg import compute_xg_from_dfl, xg_label, xg_xp_multiplier
    XG_AVAILABLE = True
except Exception as e:
    print(f"⚠  xG module not loaded: {e}")
    XG_AVAILABLE = False

MATCH_ID    = "DFL-MAT-111111"
WS_ENDPOINT = "https://wjhaqx0d53.execute-api.eu-central-1.amazonaws.com/prod"

# High-impact event types that warrant AI commentary
COMMENTARY_EVENTS = {"GOAL", "PENALTY", "VAR", "YELLOW_CARD", "WHISTLE"}

# When these events fire, resolve open predictions for the listed types
RESOLVES_PREDICTIONS_FOR = {
    "GOAL":    {"SHOT", "PENALTY", "FREE_KICK", "CORNER"},
    "WHISTLE": {"SHOT", "PENALTY", "FREE_KICK", "CORNER", "VAR"},
}


# ── helpers ────────────────────────────────────────────────────────────

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    raise TypeError


def find_function(lambda_client, prefix):
    """Resolve a Lambda function name from a CloudFormation-suffixed prefix."""
    for page in lambda_client.get_paginator("list_functions").paginate():
        for fn in page["Functions"]:
            if fn["FunctionName"].startswith(prefix):
                return fn["FunctionName"]
    raise RuntimeError(f"Lambda starting with '{prefix}' not found — is the stack deployed?")


def load_unprocessed_events(dynamodb):
    """Load unprocessed match events in chronological order."""
    table = dynamodb.Table("ConnectedArena-MatchEvents")
    result = table.query(
        KeyConditionExpression=Key("matchId").eq(MATCH_ID),
        FilterExpression=Attr("processed").eq(False),
        ScanIndexForward=True,
    )
    events = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result = table.query(
            KeyConditionExpression=Key("matchId").eq(MATCH_ID),
            FilterExpression=Attr("processed").eq(False),
            ScanIndexForward=True,
            ExclusiveStartKey=result["LastEvaluatedKey"],
        )
        events.extend(result.get("Items", []))
    return events


def mark_processed(dynamodb, event_time: str):
    """Mark event as processed so EventBridge Lambda skips it."""
    dynamodb.Table("ConnectedArena-MatchEvents").update_item(
        Key={"matchId": MATCH_ID, "eventTime": event_time},
        UpdateExpression="SET #p = :t",
        ExpressionAttributeNames={"#p": "processed"},
        ExpressionAttributeValues={":t": True},
    )


def resolve_predictions(dynamodb, event_item: dict):
    """
    When a GOAL or WHISTLE fires, resolve open predictions for the correct
    event types and award points to fans who predicted correctly.
    """
    event_type = event_item.get("eventType", "")
    resolvable = RESOLVES_PREDICTIONS_FOR.get(event_type)
    if not resolvable:
        return 0

    outcome = (event_type == "GOAL")  # True=yes was correct, False=no was correct
    points  = int(event_item.get("pointsAvailable", 0))

    pred_table   = dynamodb.Table("ConnectedArena-Predictions")
    player_table = dynamodb.Table("ConnectedArena-Players")

    # Scan all unresolved predictions, filter by eventType in Python
    result    = pred_table.scan(FilterExpression=Attr("resolved").eq(False))
    all_preds = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result = pred_table.scan(
            FilterExpression=Attr("resolved").eq(False),
            ExclusiveStartKey=result["LastEvaluatedKey"],
        )
        all_preds.extend(result.get("Items", []))

    # Only resolve predictions whose stored eventType is in the resolvable set
    open_preds = [p for p in all_preds if p.get("eventType") in resolvable]

    resolved = 0
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
        resolved += 1

    if resolved:
        print(f"  🏅 Resolved {resolved} prediction(s) for {event_type} (outcome={'yes' if outcome else 'no'}, pts={points})")
    return resolved


def compute_event_xg(event_item):
    """Compute xG for shot/goal events using StatsBomb-trained model."""
    if not XG_AVAILABLE:
        return None
    ev_type = event_item.get("eventType", "")
    if ev_type not in ("SHOT", "GOAL", "PENALTY"):
        return None
    try:
        x = float(event_item.get("xPosition", 0))
        y = float(event_item.get("yPosition", 0))
        # DFL positions are 0-100; penalty is a special case (~xG 0.77)
        if ev_type == "PENALTY":
            return 0.77  # statsbomb average for penalties
        xg = compute_xg_from_dfl(x, y)
        return xg
    except Exception:
        return None


def invoke_broadcast(lambda_client, fn_name, event_item):
    """Async invoke BroadcastFunction."""
    xg = compute_event_xg(event_item)

    ev = {
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
    if xg is not None:
        ev["xg"]          = xg
        ev["xgLabel"]     = xg_label(xg)
        ev["xgMultiplier"] = xg_xp_multiplier(xg)

    payload = {
        "event":       ev,
        "WS_ENDPOINT": WS_ENDPOINT,
    }
    resp = lambda_client.invoke(
        FunctionName=fn_name,
        InvocationType="Event",
        Payload=json.dumps(payload, default=decimal_default).encode(),
    )
    return resp["StatusCode"]  # 202 = accepted


def invoke_commentary(lambda_client, fn_name, event_item):
    """Async invoke BedrockCommentaryFunction for high-impact events."""
    payload = {
        "eventType":  event_item.get("eventType", ""),
        "team":       event_item.get("team", ""),
        "wsEndpoint": WS_ENDPOINT,
    }
    # Pass xG so commentary can reference it (especially for stats_nerd persona)
    xg = compute_event_xg(event_item)
    if xg is not None:
        payload["xg"] = xg
    lambda_client.invoke(
        FunctionName=fn_name,
        InvocationType="Event",
        Payload=json.dumps(payload).encode(),
    )


# ── main ───────────────────────────────────────────────────────────────

def emit(region: str, speedup: float):
    print(f"Region: {region}  |  Speed-up: {speedup}x\n")

    dynamodb      = boto3.resource("dynamodb", region_name=region)
    lambda_client = boto3.client("lambda",     region_name=region)

    print("Resolving Lambda function names...")
    broadcast_fn  = find_function(lambda_client, "connected-arena-BroadcastFunction")
    commentary_fn = find_function(lambda_client, "connected-arena-BedrockCommentaryFunction")
    print(f"  Broadcast  → {broadcast_fn}")
    print(f"  Commentary → {commentary_fn}\n")

    print("Loading unprocessed events from DynamoDB...")
    events = load_unprocessed_events(dynamodb)
    print(f"  → {len(events)} events ready\n")

    if not events:
        print("No unprocessed events found.")
        print("Tip: run parse_events.py first, or reset processed=False in DynamoDB to replay.")
        return

    prev_time = None

    for i, ev in enumerate(events):
        ev_time = ev.get("eventTime", "")
        ev_type = ev.get("eventType", "?")
        team    = ev.get("team", "?")
        pts     = int(ev.get("pointsAvailable", 0))
        window  = int(ev.get("predictionWindow", 0))

        # ── sleep to simulate real match timing ──────────────────────
        if speedup > 0 and prev_time and ev_time:
            try:
                t1        = datetime.fromisoformat(prev_time)
                t2        = datetime.fromisoformat(ev_time)
                sleep_sec = max(0, (t2 - t1).total_seconds() / speedup)
                if sleep_sec > 0.5:
                    print(f"  ⏱  {sleep_sec:.1f}s pause...")
                    time.sleep(sleep_sec)
            except Exception:
                pass

        pred_tag = f"  🎯 predict:{window}s" if window > 0 else ""
        print(f"[{i+1:>3}/{len(events)}] {ev_type:<14} team={team:<22} +{pts:>3}pts{pred_tag}")

        # ── 1. Resolve predictions (GOAL/WHISTLE) ───────────────────
        resolve_predictions(dynamodb, ev)

        # ── 2. Broadcast match event to all fans ─────────────────────
        status = invoke_broadcast(lambda_client, broadcast_fn, ev)
        if status != 202:
            print(f"  ⚠  Broadcast returned HTTP {status}")

        # ── 3. AI commentary for high-impact events ──────────────────
        if ev_type in COMMENTARY_EVENTS:
            invoke_commentary(lambda_client, commentary_fn, ev)
            print(f"  🎙  AI commentary triggered")

        # ── 4. Mark processed so EventBridge scheduler skips it ──────
        mark_processed(dynamodb, ev_time)

        prev_time = ev_time

    print("\n✅ All events emitted! Match complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Emit DFL match events to Connected Arena")
    parser.add_argument("--region",  default="eu-central-1")
    parser.add_argument("--speedup", type=float, default=60.0,
                        help="Time compression: 60=60x faster, 1=real-time, 0=instant")
    args = parser.parse_args()
    emit(args.region, args.speedup)
