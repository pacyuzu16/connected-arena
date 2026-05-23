"""
quick_deploy.py
---------------
Fast deploy — skips the frontend build (already built).
Does ONLY what's broken right now:

  1. Creates admin Cognito user  (admin@gmail.com / 123456789)
  2. Deploys chat Lambda         (+ API Gateway route + permission)
  3. Deploys admin_action Lambda (+ API Gateway route + permission)
  4. Redeploys API Gateway prod stage
  5. Syncs pre-built frontend to S3 + CloudFront invalidation

Run:
    python -X utf8 scripts\\quick_deploy.py
"""

import boto3, io, zipfile, time, os, subprocess, sys

REGION         = "eu-central-1"
API_ID         = "wjhaqx0d53"
STAGE          = "prod"
POOL_ID        = "eu-central-1_HzdOR3DlT"
S3_BUCKET      = "connected-arena-frontend-759601070592"
CF_DIST        = "EKWCHZT2LA4NX"
ADMIN_EMAIL    = "admin@gmail.com"
ADMIN_PASSWORD = "123456789"
CONNECT_FN     = "connected-arena-ConnectFunction-awNwDl8qumo5"
CHAT_FN        = "connected-arena-ChatFunction"
ADMIN_ACT_FN   = "connected-arena-AdminActionFunction"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

lam  = boto3.client("lambda",       region_name=REGION)
apigw= boto3.client("apigatewayv2", region_name=REGION)
idp  = boto3.client("cognito-idp",  region_name=REGION)
s3   = boto3.client("s3",           region_name=REGION)
cf   = boto3.client("cloudfront")
sts  = boto3.client("sts")


def ok(msg):   print(f"  ✓ {msg}")
def step(msg): print(f"\n── {msg} {'─'*(55-len(msg))}")

def zip_handler(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, "handler.py")
    buf.seek(0)
    return buf.read()

def wait_active(fn_name, retries=15):
    for _ in range(retries):
        state = lam.get_function(FunctionName=fn_name)["Configuration"]["State"]
        if state == "Active": return
        time.sleep(2)

def get_or_create_lambda(fn_name, handler_path, role_arn, layers):
    code = zip_handler(handler_path)
    try:
        lam.get_function(FunctionName=fn_name)
        lam.update_function_code(FunctionName=fn_name, ZipFile=code)
        ok(f"Updated {fn_name}")
    except lam.exceptions.ResourceNotFoundException:
        lam.create_function(
            FunctionName=fn_name,
            Runtime="python3.12",
            Role=role_arn,
            Handler="handler.lambda_handler",
            Code={"ZipFile": code},
            Layers=layers,
            Environment={"Variables": {
                # The arena.db layer reads table names from these env vars.
                # Without them every DynamoDB call raises KeyError. Bug found
                # in production on AdminAction + Chat — keep this complete.
                "REGION":              REGION,
                "CONNECTIONS_TABLE":   "ConnectedArena-Connections",
                "PLAYERS_TABLE":       "ConnectedArena-Players",
                "PREDICTIONS_TABLE":   "ConnectedArena-Predictions",
                "MATCH_EVENTS_TABLE":  "ConnectedArena-MatchEvents",
                "GAME_ROOM_TABLE":     "ConnectedArena-GameRoom",
                "WS_ENDPOINT":         f"https://{API_ID}.execute-api.{REGION}.amazonaws.com/{STAGE}",
            }},
            Timeout=15,
        )
        wait_active(fn_name)
        ok(f"Created {fn_name}")
    return lam.get_function(FunctionName=fn_name)["Configuration"]["FunctionArn"]

def add_permission(fn_name, sid, api_id, account):
    try:
        lam.add_permission(
            FunctionName=fn_name, StatementId=sid,
            Action="lambda:InvokeFunction", Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{account}:{api_id}/*/*",
        )
    except lam.exceptions.ResourceConflictException:
        pass  # already there

def create_route_if_missing(route_key, fn_arn):
    routes = apigw.get_routes(ApiId=API_ID)["Items"]
    if any(r["RouteKey"] == route_key for r in routes):
        ok(f"Route '{route_key}' already exists")
        return
    integ = apigw.create_integration(
        ApiId=API_ID, IntegrationType="AWS_PROXY",
        IntegrationUri=f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{fn_arn}/invocations",
        IntegrationMethod="POST", PayloadFormatVersion="1.0",
    )
    apigw.create_route(ApiId=API_ID, RouteKey=route_key,
                       Target=f"integrations/{integ['IntegrationId']}")
    ok(f"Created route '{route_key}'")


# ── 1. Cognito admin user ─────────────────────────────────────────────────────
step("Cognito admin user")
try:
    idp.admin_create_user(
        UserPoolId=POOL_ID, Username=ADMIN_EMAIL,
        UserAttributes=[
            {"Name": "email",          "Value": ADMIN_EMAIL},
            {"Name": "email_verified", "Value": "true"},
            {"Name": "name",           "Value": "Admin"},
        ],
        TemporaryPassword="TempPass1!", MessageAction="SUPPRESS",
    )
    ok(f"Created {ADMIN_EMAIL}")
except idp.exceptions.UsernameExistsException:
    ok(f"Already exists: {ADMIN_EMAIL}")

idp.admin_set_user_password(
    UserPoolId=POOL_ID, Username=ADMIN_EMAIL,
    Password=ADMIN_PASSWORD, Permanent=True,
)
ok(f"Password set: {ADMIN_PASSWORD}")


# ── 2 & 3. Lambda functions ──────────────────────────────────────────────────
step("Lambda functions")
identity = sts.get_caller_identity()
account  = identity["Account"]
cfg      = lam.get_function_configuration(FunctionName=CONNECT_FN)
role_arn = cfg["Role"]
layers   = [l["Arn"] for l in cfg.get("Layers", [])]

# Also update connect Lambda (stores email in query params)
lam.update_function_code(
    FunctionName=CONNECT_FN,
    ZipFile=zip_handler(os.path.join(BASE, "backend", "functions", "connect", "handler.py"))
)
ok(f"Updated {CONNECT_FN}")

chat_arn = get_or_create_lambda(
    CHAT_FN,
    os.path.join(BASE, "backend", "functions", "chat", "handler.py"),
    role_arn, layers,
)
add_permission(CHAT_FN, "AllowApiGatewayChat", API_ID, account)

adm_arn = get_or_create_lambda(
    ADMIN_ACT_FN,
    os.path.join(BASE, "backend", "functions", "admin_action", "handler.py"),
    role_arn, layers,
)
add_permission(ADMIN_ACT_FN, "AllowApiGatewayAdminAction", API_ID, account)


# ── 4. API Gateway routes ─────────────────────────────────────────────────────
step("API Gateway routes")
create_route_if_missing("chat",        chat_arn)
create_route_if_missing("adminAction", adm_arn)
apigw.create_deployment(ApiId=API_ID, StageName=STAGE)
ok(f"Deployed stage '{STAGE}'")


# ── 5. Sync frontend (use pre-built 'out' folder) ────────────────────────────
step("Sync frontend to S3")
out_dir = os.path.join(BASE, "frontend", "out")
if not os.path.isdir(out_dir):
    sys.exit(f"ERROR: {out_dir} not found — run 'npm run build' first")

result = subprocess.run(
    ["aws", "s3", "sync", out_dir, f"s3://{S3_BUCKET}", "--delete", "--region", REGION],
    capture_output=True, text=True,
)
if result.returncode != 0:
    print(result.stderr)
    sys.exit("S3 sync failed")
ok(f"Synced to s3://{S3_BUCKET}")

step("CloudFront invalidation")
cf.create_invalidation(
    DistributionId=CF_DIST,
    InvalidationBatch={
        "Paths": {"Quantity": 1, "Items": ["/*"]},
        "CallerReference": str(int(time.time())),
    },
)
ok("Invalidation started (~30s to propagate)")


print(f"""
{'='*60}
  ✅ Deploy complete!
{'='*60}

  Admin URL : https://d1706ex99mjina.cloudfront.net/admin
  Email     : {ADMIN_EMAIL}
  Password  : {ADMIN_PASSWORD}

  Arena URL : https://d1706ex99mjina.cloudfront.net

  Note: Wait ~30s for CloudFront to propagate, then hard-refresh (Ctrl+Shift+R).
""")
