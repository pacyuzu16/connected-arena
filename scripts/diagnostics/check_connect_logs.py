"""See what the Connect Lambda actually does on each fan connection."""
import boto3

logs = boto3.client("logs", region_name="eu-central-1")
GROUP = "/aws/lambda/connected-arena-ConnectFunction-awNwDl8qumo5"

streams = logs.describe_log_streams(
    logGroupName=GROUP, orderBy="LastEventTime", descending=True, limit=2
)["logStreams"]

for s in streams:
    print(f"\n=== {s['logStreamName']} ===")
    events = logs.get_log_events(
        logGroupName=GROUP, logStreamName=s["logStreamName"],
        limit=40, startFromHead=False,
    )["events"]
    for e in events[-30:]:
        msg = e["message"].rstrip()
        if msg.startswith(("START Request", "END Request", "REPORT Request", "INIT_START")):
            continue
        print(msg[:600])
