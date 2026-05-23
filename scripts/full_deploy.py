"""
full_deploy.py
--------------
One-shot deploy script. Run this whenever you want to push everything live.

Steps:
  1. Deploy Lambda backend fixes (EventEmitter accuracy + Leaderboard accuracy)
  2. Build Next.js frontend  (npm run build)
  3. Upload frontend/out/ to S3 (full sync with correct content-types)
  4. CloudFront invalidation

Prerequisites:
  - Node.js + npm installed
  - AWS credentials set as env vars:
      $env:AWS_ACCESS_KEY_ID     = "..."
      $env:AWS_SECRET_ACCESS_KEY = "..."
      $env:AWS_SESSION_TOKEN     = "..."

Usage:
  cd C:\\Users\\Administrator\\Desktop\\y3\\THINGS\\AWS\\connected-arena
  python scripts/full_deploy.py
"""

import boto3, os, sys, subprocess, pathlib, zipfile, io, time, mimetypes

# ── Config ────────────────────────────────────────────────────────────────────
REGION   = "eu-central-1"
BUCKET   = "connected-arena-frontend-759601070592"
DIST_ID  = "EKWCHZT2LA4NX"
ROOT     = pathlib.Path(__file__).parent.parent          # project root
FRONTEND = ROOT / "frontend"
OUT_DIR  = FRONTEND / "out"
BACKEND  = ROOT / "backend"

KEY_ID  = os.environ.get("AWS_ACCESS_KEY_ID")
KEY_SEC = os.environ.get("AWS_SECRET_ACCESS_KEY")
TOK     = os.environ.get("AWS_SESSION_TOKEN")

if not all([KEY_ID, KEY_SEC, TOK]):
    print("❌  Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN first.")
    sys.exit(1)

session        = boto3.Session(aws_access_key_id=KEY_ID, aws_secret_access_key=KEY_SEC,
                               aws_session_token=TOK, region_name=REGION)
s3             = session.client("s3")
lambda_client  = session.client("lambda")


# ── Step 1: Deploy Lambda fixes ───────────────────────────────────────────────
print("=" * 60)
print("Step 1: Deploying Lambda backend fixes")
print("=" * 60)

def find_function(prefix):
    for page in lambda_client.get_paginator("list_functions").paginate():
        for fn in page["Functions"]:
            if fn["FunctionName"].startswith(prefix):
                return fn["FunctionName"]
    return None

def deploy_lambda(fn_prefix, handler_path):
    fn_name = find_function(fn_prefix)
    if not fn_name:
        print(f"  ⚠  Function '{fn_prefix}*' not found — skipping")
        return False

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(handler_path, "handler.py")
        arena_dir = BACKEND / "layers" / "common" / "python" / "arena"
        if arena_dir.exists():
            for f in arena_dir.glob("*.py"):
                zf.write(f, f"arena/{f.name}")
    buf.seek(0)
    lambda_client.update_function_code(FunctionName=fn_name, ZipFile=buf.read())
    print(f"  ✅  {fn_name}")
    return True

deploy_lambda("connected-arena-EventEmitterFunction",
              BACKEND / "functions" / "event_emitter" / "handler.py")
deploy_lambda("connected-arena-LeaderboardFunction",
              BACKEND / "functions" / "leaderboard" / "handler.py")


# ── Step 2: Build Next.js frontend ────────────────────────────────────────────
print()
print("=" * 60)
print("Step 2: Building Next.js frontend (this takes ~1–2 min)")
print("=" * 60)

result = subprocess.run(
    ["npm", "run", "build"],
    cwd=str(FRONTEND),
    shell=True,          # needed on Windows
    capture_output=False,
)
if result.returncode != 0:
    print("❌  Frontend build failed — check output above.")
    sys.exit(1)

if not OUT_DIR.exists():
    print(f"❌  Build output not found at {OUT_DIR}")
    sys.exit(1)

print(f"  ✅  Build complete — output at {OUT_DIR}")


# ── Step 3: Upload to S3 ──────────────────────────────────────────────────────
print()
print("=" * 60)
print("Step 3: Uploading to S3")
print("=" * 60)

# Content-type map for Next.js static exports
CONTENT_TYPES = {
    ".html":  "text/html; charset=utf-8",
    ".css":   "text/css",
    ".js":    "application/javascript",
    ".json":  "application/json",
    ".png":   "image/png",
    ".jpg":   "image/jpeg",
    ".jpeg":  "image/jpeg",
    ".svg":   "image/svg+xml",
    ".ico":   "image/x-icon",
    ".woff":  "font/woff",
    ".woff2": "font/woff2",
    ".ttf":   "font/ttf",
    ".txt":   "text/plain",
    ".xml":   "application/xml",
    ".webmanifest": "application/manifest+json",
}

uploaded = 0
for local_path in OUT_DIR.rglob("*"):
    if not local_path.is_file():
        continue

    s3_key = local_path.relative_to(OUT_DIR).as_posix()
    ext    = local_path.suffix.lower()

    # HTML files get no-cache so browsers always fetch fresh
    if ext == ".html":
        cache_control = "public, max-age=0, must-revalidate"
    # Hashed static assets get long cache
    elif "_next/static/" in s3_key:
        cache_control = "public, max-age=31536000, immutable"
    else:
        cache_control = "public, max-age=3600"

    content_type = CONTENT_TYPES.get(ext, mimetypes.guess_type(str(local_path))[0] or "application/octet-stream")

    s3.upload_file(
        str(local_path), BUCKET, s3_key,
        ExtraArgs={"ContentType": content_type, "CacheControl": cache_control},
    )
    uploaded += 1
    if uploaded % 20 == 0:
        print(f"  ... {uploaded} files uploaded")

print(f"  ✅  {uploaded} files uploaded to s3://{BUCKET}/")


# ── Step 4: CloudFront invalidation ──────────────────────────────────────────
print()
print("=" * 60)
print("Step 4: CloudFront invalidation")
print("=" * 60)

cf = boto3.Session(
    aws_access_key_id=KEY_ID, aws_secret_access_key=KEY_SEC,
    aws_session_token=TOK, region_name="us-east-1",
).client("cloudfront")

inv = cf.create_invalidation(
    DistributionId=DIST_ID,
    InvalidationBatch={
        "Paths": {"Quantity": 1, "Items": ["/*"]},
        "CallerReference": str(int(time.time())),
    },
)["Invalidation"]
print(f"  ✅  Invalidation {inv['Id']} — {inv['Status']}")

print()
print("=" * 60)
print("✅  DEPLOY COMPLETE!")
print(f"   Lambda fixes:  live immediately")
print(f"   Frontend:      live in ~1–2 min")
print(f"   URL:           https://d1706ex99mjina.cloudfront.net")
print("=" * 60)
print()
print("Next steps:")
print("  1. Reset match:   python scripts/demo_reset.py")
print("  2. Replay match:  python scripts/emit_events.py --region eu-central-1 --speedup 30")
print("  3. Restore auto:  python scripts/demo_reset.py --restore")
