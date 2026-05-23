"""
reset_match.py
--------------
Resets the Connected Arena match so it can be replayed from scratch.

  - Sets all 88 MatchEvents → processed = False
  - Zeros all Player scores, streaks, predictions
  - Deletes all Predictions

Usage:
    python scripts\reset_match.py
"""

import boto3
from boto3.dynamodb.conditions import Key, Attr

REGION   = "eu-central-1"
MATCH_ID = "DFL-MAT-111111"

ddb = boto3.resource("dynamodb", region_name=REGION)

events_tbl      = ddb.Table("ConnectedArena-MatchEvents")
players_tbl     = ddb.Table("ConnectedArena-Players")
predictions_tbl = ddb.Table("ConnectedArena-Predictions")

# ── 1. Reset MatchEvents → processed = False ──────────────────────────────────
print("Resetting MatchEvents...")
resp  = events_tbl.query(KeyConditionExpression=Key("matchId").eq(MATCH_ID))
items = resp.get("Items", [])
while "LastEvaluatedKey" in resp:
    resp  = events_tbl.query(
        KeyConditionExpression=Key("matchId").eq(MATCH_ID),
        ExclusiveStartKey=resp["LastEvaluatedKey"]
    )
    items.extend(resp.get("Items", []))

for item in items:
    events_tbl.update_item(
        Key={"matchId": item["matchId"], "eventTime": item["eventTime"]},
        UpdateExpression="SET #p = :f",
        ExpressionAttributeNames={"#p": "processed"},
        ExpressionAttributeValues={":f": False},
    )
print(f"  ✓ Reset {len(items)} events → processed=False")

# ── 2. Reset Players → zero everything ───────────────────────────────────────
print("Resetting Players...")
resp = players_tbl.scan()
pls  = resp.get("Items", [])
while "LastEvaluatedKey" in resp:
    resp = players_tbl.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
    pls.extend(resp.get("Items", []))

for p in pls:
    players_tbl.update_item(
        Key={"playerId": p["playerId"]},
        UpdateExpression=(
            "SET score = :z, winStreak = :z, predictions = :z, "
            "correctPredictions = :z, accuracy = :z"
        ),
        ExpressionAttributeValues={":z": 0},
    )
print(f"  ✓ Reset {len(pls)} players to zero")

# ── 3. Delete all Predictions ─────────────────────────────────────────────────
print("Deleting Predictions...")
resp  = predictions_tbl.scan()
preds = resp.get("Items", [])
while "LastEvaluatedKey" in resp:
    resp = predictions_tbl.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
    preds.extend(resp.get("Items", []))

with predictions_tbl.batch_writer() as batch:
    for pr in preds:
        batch.delete_item(Key={"predictionId": pr["predictionId"]})
print(f"  ✓ Deleted {len(preds)} predictions")

print("\n✅ Match reset complete — ready to demo!")
