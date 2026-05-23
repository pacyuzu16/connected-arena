"""
demo_reset.py
-------------
Run ONCE before every demo session.

Default behaviour (preserves player XP and stats):
  1. Pauses the EventBridge auto-scheduler so it stops eating events
  2. Resets all 91 match events back to unprocessed
  3. Deletes open predictions so the scoreboard starts clean
  ✅ Player XP, accuracy, streaks and levels are KEPT — they accumulate
     across every match replay, just like a real season.

Use --full-reset only if you want to wipe everything (scores too):
    python demo_reset.py --full-reset

Restore the auto-scheduler after the demo:
    python demo_reset.py --restore
"""

import boto3, argparse
from boto3.dynamodb.conditions import Key

MATCH_ID       = "DFL-MAT-111111"
REGION         = "eu-central-1"
EMITTER_PREFIX = "connected-arena-EventEmitterFunction"


def get_session():
    return boto3.Session(region_name=REGION)


def find_emitter(lc):
    for page in lc.get_paginator("list_functions").paginate():
        for fn in page["Functions"]:
            if fn["FunctionName"].startswith(EMITTER_PREFIX):
                return fn["FunctionName"]
    return None


def pause_emitter(lc):
    fn = find_emitter(lc)
    if not fn:
        print("  ⚠  EventEmitter Lambda not found — skipping pause")
        return
    lc.put_function_concurrency(FunctionName=fn, ReservedConcurrentExecutions=0)
    print(f"  ⏸  EventEmitter paused: {fn}")


def restore_emitter(lc):
    fn = find_emitter(lc)
    if not fn:
        print("  ⚠  EventEmitter not found")
        return
    lc.delete_function_concurrency(FunctionName=fn)
    print(f"  ▶  EventEmitter restored (auto-schedule running again): {fn}")


def reset_events(dynamo):
    """Mark all match events as unprocessed so they can be replayed."""
    table  = dynamo.Table("ConnectedArena-MatchEvents")
    result = table.query(KeyConditionExpression=Key("matchId").eq(MATCH_ID))
    items  = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result = table.query(
            KeyConditionExpression=Key("matchId").eq(MATCH_ID),
            ExclusiveStartKey=result["LastEvaluatedKey"],
        )
        items.extend(result.get("Items", []))

    for item in items:
        table.update_item(
            Key={"matchId": MATCH_ID, "eventTime": item["eventTime"]},
            UpdateExpression="SET #p = :f",
            ExpressionAttributeNames={"#p": "processed"},
            ExpressionAttributeValues={":f": False},
        )
    print(f"  🔄 {len(items)} match events reset to unprocessed")


def delete_predictions(dynamo):
    """Delete all pending/resolved predictions so this replay starts fresh."""
    table  = dynamo.Table("ConnectedArena-Predictions")
    result = table.scan(ProjectionExpression="predictionId")
    items  = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result = table.scan(
            ProjectionExpression="predictionId",
            ExclusiveStartKey=result["LastEvaluatedKey"],
        )
        items.extend(result.get("Items", []))

    with table.batch_writer() as bw:
        for r in items:
            bw.delete_item(Key={"predictionId": r["predictionId"]})
    print(f"  🗑  {len(items)} old predictions deleted")


def full_reset_players(dynamo):
    """Wipe all player XP, streaks and stats (only used with --full-reset)."""
    table  = dynamo.Table("ConnectedArena-Players")
    result = table.scan()
    items  = list(result.get("Items", []))
    while "LastEvaluatedKey" in result:
        result = table.scan(ExclusiveStartKey=result["LastEvaluatedKey"])
        items.extend(result.get("Items", []))

    for p in items:
        table.update_item(
            Key={"playerId": p["playerId"]},
            UpdateExpression=(
                "SET score = :z, winStreak = :z, "
                "correctPredictions = :z, totalPredictions = :z, predictions = :z"
            ),
            ExpressionAttributeValues={":z": 0},
        )
    print(f"  👤 {len(items)} player records wiped (score, streak, accuracy all zeroed)")


def main():
    parser = argparse.ArgumentParser(description="Connected Arena demo reset")
    parser.add_argument("--restore",    action="store_true",
                        help="Re-enable the EventBridge auto-scheduler")
    parser.add_argument("--full-reset", action="store_true",
                        help="Also wipe all player XP and stats (scoreboard to zero)")
    args = parser.parse_args()

    session  = get_session()
    lc       = session.client("lambda")
    dynamo   = session.resource("dynamodb")

    if args.restore:
        print("Re-enabling EventEmitter auto-scheduler...")
        restore_emitter(lc)
        print("Done.")
        return

    print("── Step 1: Pause EventBridge scheduler ──────────────────")
    pause_emitter(lc)

    print("\n── Step 2: Reset match events ───────────────────────────")
    reset_events(dynamo)

    print("\n── Step 3: Delete old predictions ───────────────────────")
    delete_predictions(dynamo)

    if args.full_reset:
        print("\n── Step 4 (--full-reset): Wipe player scores ────────────")
        full_reset_players(dynamo)
        print("\n✅ Full reset complete — leaderboard is at zero.")
    else:
        print("\n✅ Ready for demo!  (Player XP from previous matches preserved)")

    print()
    print("   Run immediately (before EventBridge wakes up):")
    print("   python emit_events.py --region eu-central-1 --speedup 30")
    print()
    print("   Restore auto-scheduler after the demo:")
    print("   python demo_reset.py --restore")


if __name__ == "__main__":
    main()
