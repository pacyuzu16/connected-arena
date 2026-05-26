"""Inspect the deployed Leaderboard Lambda + its recent logs."""
import boto3, zipfile, io, urllib.request

lam = boto3.client("lambda", region_name="eu-central-1")
logs = boto3.client("logs", region_name="eu-central-1")

# 1. Verify CHAT_HISTORY logic is in the deployed code
fn = "connected-arena-LeaderboardFunction-QbaN0npDCkUD"
url = lam.get_function(FunctionName=fn)["Code"]["Location"]
data = urllib.request.urlopen(url).read()
z = zipfile.ZipFile(io.BytesIO(data))
src = z.read("handler.py").decode("utf-8")
print(f"══════ Deployed Leaderboard code ══════")
hits = 0
for i, line in enumerate(src.splitlines(), 1):
    if "CHAT_HISTORY" in line or "chatHistory" in line or "chat history" in line.lower() or "_clean" in line:
        print(f"  {i:3}: {line}")
        hits += 1
print(f"  ({hits} relevant lines found)")

# 2. Get recent logs to see if it's running CHAT_HISTORY branch
GROUP = f"/aws/lambda/{fn}"
streams = logs.describe_log_streams(
    logGroupName=GROUP, orderBy="LastEventTime", descending=True, limit=2
)["logStreams"]
print(f"\n══════ Last log stream ══════")
for s in streams[:1]:
    events = logs.get_log_events(
        logGroupName=GROUP, logStreamName=s["logStreamName"],
        limit=30, startFromHead=False,
    )["events"]
    for e in events[-25:]:
        m = e["message"].rstrip()
        if m.startswith(("INIT_START", "REPORT")):
            continue
        print(m[:400])
