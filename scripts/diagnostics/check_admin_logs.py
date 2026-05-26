"""Show recent AdminAction Lambda logs."""
import boto3

logs = boto3.client("logs", region_name="eu-central-1")
streams = logs.describe_log_streams(
    logGroupName="/aws/lambda/connected-arena-AdminActionFunction",
    orderBy="LastEventTime", descending=True, limit=2,
)["logStreams"]

for s in streams:
    print(f"\n=== stream: {s['logStreamName']} ===")
    events = logs.get_log_events(
        logGroupName="/aws/lambda/connected-arena-AdminActionFunction",
        logStreamName=s["logStreamName"], limit=30, startFromHead=False,
    )["events"]
    for e in events[-20:]:
        msg = e["message"].rstrip()
        # Skip the noisy START/END/REPORT lines unless they're the only thing
        if msg.startswith(("START Request", "END Request", "REPORT Request", "INIT_START")):
            continue
        print(msg[:400])
