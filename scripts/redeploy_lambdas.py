"""
Force-redeploy Connect, Chat, AdminAction Lambdas from current source.
Verifies the deployed code matches local after upload.
"""
import boto3, io, zipfile, os, time, hashlib

REGION = "eu-central-1"
BASE   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lam    = boto3.client("lambda", region_name=REGION)

TARGETS = [
    ("connected-arena-ConnectFunction-awNwDl8qumo5",        "connect"),
    ("connected-arena-ChatFunction",                        "chat"),
    ("connected-arena-AdminActionFunction",                 "admin_action"),
    ("connected-arena-LeaderboardFunction-QbaN0npDCkUD",    "leaderboard"),
]

def zip_handler(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, "handler.py")
    buf.seek(0)
    return buf.read()

def local_sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()[:12]

def deployed_sha(fn_name):
    import urllib.request
    url = lam.get_function(FunctionName=fn_name)["Code"]["Location"]
    data = urllib.request.urlopen(url).read()
    z = zipfile.ZipFile(io.BytesIO(data))
    src = z.read("handler.py")
    return hashlib.sha256(src).hexdigest()[:12]

for fn_name, folder in TARGETS:
    src_path = os.path.join(BASE, "backend", "functions", folder, "handler.py")
    print(f"\n── {fn_name}")
    local = local_sha(src_path)
    print(f"   local source sha:  {local}")
    before = deployed_sha(fn_name)
    print(f"   deployed (before): {before}")
    if local == before:
        print(f"   ✓ already up to date — skipping")
        continue
    lam.update_function_code(FunctionName=fn_name, ZipFile=zip_handler(src_path))
    # Wait for it to be active
    for _ in range(15):
        s = lam.get_function_configuration(FunctionName=fn_name)["LastUpdateStatus"]
        if s == "Successful": break
        time.sleep(2)
    after = deployed_sha(fn_name)
    print(f"   deployed (after):  {after}")
    print(f"   {'✓ MATCH' if after == local else '✗ MISMATCH'}")
print("\nDONE")
