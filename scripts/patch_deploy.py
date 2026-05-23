"""
patch_deploy.py
---------------
Surgically patches the live S3 bucket with:
  1. Mobile-responsive CSS additions
  2. Time-display fix (ISO string slice instead of toLocaleTimeString)
  3. CloudFront invalidation

Run with fresh credentials set as env vars:
  $env:AWS_ACCESS_KEY_ID     = "..."
  $env:AWS_SECRET_ACCESS_KEY = "..."
  $env:AWS_SESSION_TOKEN     = "..."
  python scripts/patch_deploy.py
"""

import boto3, os, re, time, sys

REGION   = "eu-central-1"
BUCKET   = "connected-arena-frontend-759601070592"
DIST_ID  = "EKWCHZT2LA4NX"

KEY_ID  = os.environ.get("AWS_ACCESS_KEY_ID")
KEY_SEC = os.environ.get("AWS_SECRET_ACCESS_KEY")
TOK     = os.environ.get("AWS_SESSION_TOKEN")

if not all([KEY_ID, KEY_SEC, TOK]):
    print("ERROR: Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN as env vars first.")
    sys.exit(1)

session = boto3.Session(
    aws_access_key_id=KEY_ID,
    aws_secret_access_key=KEY_SEC,
    aws_session_token=TOK,
    region_name=REGION,
)
s3 = session.client("s3")

# ── 1. Find and patch the CSS file ───────────────────────────────
print("Step 1: Finding CSS file...")
pager = s3.get_paginator("list_objects_v2")
css_key = None
for page in pager.paginate(Bucket=BUCKET, Prefix="_next/static/css/"):
    for obj in page.get("Contents", []):
        if obj["Key"].endswith(".css"):
            css_key = obj["Key"]
            break

if not css_key:
    print("  No CSS file found — skipping CSS patch")
else:
    print(f"  Found: {css_key}")
    resp    = s3.get_object(Bucket=BUCKET, Key=css_key)
    css     = resp["Body"].read().decode("utf-8")

    MOBILE_CSS = """
/* ── Mobile / Responsive ── */
@media (max-width:600px){
  .hdr{height:52px;padding:0 14px;gap:8px}
  .hdr-logo{font-size:14px;gap:6px}
  .hdr-logo span:first-child{font-size:20px}
  .hdr-logo span:last-child{display:none}
  .hdr-level{display:none}
  .hdr-streak{display:none}
  .hdr-score{font-size:12px;padding:4px 10px}
  .status{font-size:10px;padding:4px 9px;gap:4px}
  .profile-btn{width:32px;height:32px;font-size:15px}
}
@media (min-width:361px) and (max-width:600px){
  .status span:last-child{display:inline}
}
@media (max-width:760px){
  .main{padding:12px 12px 80px;gap:12px}
}
@media (max-width:480px){
  .ev-item{padding:10px 14px;gap:10px}
  .ev-icon{width:38px;height:38px;font-size:17px}
  .ev-type{font-size:13px}
  .ev-meta{font-size:11px}
  .ev-pts{font-size:11px;padding:2px 8px}
  .card-hdr{padding:11px 14px;font-size:13px}
  .empty{padding:36px 16px}
}
@media (max-width:600px){
  .profile-overlay{align-items:flex-end;justify-content:stretch}
  .profile-panel{width:100%;max-width:100%;height:88vh;border-left:none;border-top:1px solid var(--border);border-radius:20px 20px 0 0;animation:slideUpSheet .28s ease;padding:20px 20px 40px}
  @keyframes slideUpSheet{from{transform:translateY(100%);opacity:.6}to{transform:none;opacity:1}}
  .profile-panel::before{content:'';display:block;width:40px;height:4px;border-radius:2px;background:var(--border);margin:0 auto 16px;flex-shrink:0}
}
@media (max-width:480px){
  .pred-card{padding:28px 20px 22px;border-radius:20px}
  .pred-q{font-size:17px}
  .pred-yes,.pred-no{padding:14px 8px;font-size:14px}
  .pred-btn-icon{font-size:18px}
  .pred-ring-wrap{width:82px;height:82px}
  .pred-ring-num{font-size:24px}
  .cbar{padding:10px 14px;gap:10px}
  .cbar-icon{width:36px;height:36px;font-size:18px;border-radius:10px}
  .cbar-text{font-size:13px}
  .lb-row{padding:8px 12px;gap:8px}
  .lb-name{font-size:12px}
  .lb-score{font-size:11px;min-width:26px}
  .lb-acc-bar{width:28px}
  .podium-row{padding:12px 10px 6px;gap:6px}
  .podium-name{font-size:10px;max-width:64px}
  .lb-table-hdr{padding:5px 12px}
  .join-card{padding:32px 20px;border-radius:16px}
  .join-logo{font-size:56px}
  .join-title{font-size:22px}
  .persona-btn{padding:10px 4px;font-size:11px}
  .persona-em{font-size:18px}
}
"""

    # Only add if not already patched
    if "slideUpSheet" in css:
        print("  CSS already patched — skipping")
    else:
        patched_css = css + MOBILE_CSS
        s3.put_object(
            Bucket=BUCKET, Key=css_key,
            Body=patched_css.encode("utf-8"),
            ContentType="text/css",
            CacheControl="public, max-age=31536000, immutable",
        )
        print(f"  Patched CSS ({len(css)} → {len(patched_css)} bytes)")

# ── 2. Patch the JS bundle: fix time display ─────────────────────
print("\nStep 2: Patching JS bundle for time fix...")
print("  Searching for JS bundle containing GOAL/leaderboard logic...")
js_key = None
js     = None
for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix="_next/static/chunks/"):
    for obj in page.get("Contents", []):
        if obj["Key"].endswith(".js"):
            body = s3.get_object(Bucket=BUCKET, Key=obj["Key"])["Body"].read()
            if b'"GOAL"' in body and b'leaderboard' in body:
                js_key = obj["Key"]
                js     = body.decode("utf-8")
                break
    if js_key:
        break

if not js_key:
    print("  ⚠  Could not find JS bundle with GOAL+leaderboard — skipping JS patch")
else:
    print(f"  Found: {js_key}")
    # Find the toLocaleTimeString call (minified)
    OLD_TIME = 'new Date(e.eventTime).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})'
    NEW_TIME = '(e.eventTime?e.eventTime.slice(11,16):"--:--")'

    if OLD_TIME not in js:
        # Try alternate minification (single quotes or different spacing)
        alt = js.find("toLocaleTimeString")
        if alt != -1:
            print(f"  Found toLocaleTimeString at offset {alt}, context:")
            print("  " + js[max(0,alt-40):alt+80])
            print("  Manual patch needed — check the bundle")
        else:
            print("  Time pattern not found — already patched or different bundle")
    else:
        patched_js = js.replace(OLD_TIME, NEW_TIME, 1)
        s3.put_object(
            Bucket=BUCKET, Key=js_key,
            Body=patched_js.encode("utf-8"),
            ContentType="application/javascript",
            CacheControl="public, max-age=31536000, immutable",
        )
        print(f"  Patched JS ({len(js)} → {len(patched_js)} bytes)")

# ── 3. Deploy Lambda backend fixes ───────────────────────────────
print("\nStep 3: Deploying Lambda backend fixes...")
import zipfile, io, pathlib

BACKEND = pathlib.Path(__file__).parent.parent / "backend"
LAYER_ZIP = BACKEND / "layer" / "common.zip"  # existing layer zip if present

lambda_client = session.client("lambda")

def deploy_function(fn_prefix, handler_path):
    """Zip a single handler.py + arena layer and update Lambda."""
    # Find function name
    fn_name = None
    for page in lambda_client.get_paginator("list_functions").paginate():
        for fn in page["Functions"]:
            if fn["FunctionName"].startswith(fn_prefix):
                fn_name = fn["FunctionName"]
                break
        if fn_name:
            break
    if not fn_name:
        print(f"  ⚠  Function starting with '{fn_prefix}' not found")
        return

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(handler_path, "handler.py")
        # Include arena layer modules inline (layers/common/python/arena/)
        arena_dir = BACKEND / "layers" / "common" / "python" / "arena"
        if arena_dir.exists():
            for f in arena_dir.glob("*.py"):
                zf.write(f, f"arena/{f.name}")
    buf.seek(0)
    lambda_client.update_function_code(FunctionName=fn_name, ZipFile=buf.read())
    print(f"  ✅ {fn_name}")

deploy_function(
    "connected-arena-EventEmitterFunction",
    BACKEND / "functions" / "event_emitter" / "handler.py",
)
deploy_function(
    "connected-arena-LeaderboardFunction",
    BACKEND / "functions" / "leaderboard" / "handler.py",
)

# ── 4. CloudFront invalidation ────────────────────────────────────
print("\nStep 4: Invalidating CloudFront...")
cf = boto3.Session(
    aws_access_key_id=KEY_ID,
    aws_secret_access_key=KEY_SEC,
    aws_session_token=TOK,
    region_name="us-east-1",
).client("cloudfront")

inv = cf.create_invalidation(
    DistributionId=DIST_ID,
    InvalidationBatch={
        "Paths": {"Quantity": 1, "Items": ["/*"]},
        "CallerReference": str(int(time.time())),
    },
)["Invalidation"]
print(f"  Invalidation: {inv['Id']} — {inv['Status']}")
print("\n✅ Done! All fixes deployed.")
print("   Frontend live in ~1-2 min at https://d1706ex99mjina.cloudfront.net")
print("   Lambda fixes are immediate.")
