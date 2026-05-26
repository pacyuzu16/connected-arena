"""Dump the latest Connect Lambda log stream as raw text."""
import boto3

logs = boto3.client("logs", region_name="eu-central-1")
GROUP = "/aws/lambda/connected-arena-ConnectFunction-awNwDl8qumo5"
streams = logs.describe_log_streams(
    logGroupName=GROUP, orderBy="LastEventTime", descending=True, limit=1
)["logStreams"]
events = logs.get_log_events(
    logGroupName=GROUP, logStreamName=streams[0]["logStreamName"], limit=15, startFromHead=False
)["events"]
print(f"--- last 15 messages ---")
for e in events:
    print(e["message"].rstrip())
