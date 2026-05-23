"""
deploy_all.py
-------------
One script that fixes everything:
  1. Creates admin Cognito user  (admin@gmail.com / 123456789)
  2. Deploys updated connect Lambda
  3. Deploys chat Lambda + wires API Gateway route
  4. Deploys admin_action Lambda + wires API Gateway route
  5. Deploys updated leaderboard Lambda
  6. Redeploys API Gateway prod stage
  7. Builds frontend, syncs to S3, invalidates CloudFront

Run with fresh AWS credentials:
    python -X utf8 scripts\\deploy_all.py
"""

import boto3, io, zipfile, time, os, subprocess, sys

# ── Config ────────────────────────────────────────────────────────────────────
REGION         = "eu-central-1"
API_ID         = "wjhaqx0d53"
STAGE          = "prod"
POOL_ID        = "eu-central-1_HzdOR3DlT"
S3_BUCKET      = "connected-arena-frontend-759601070592"
CF_DIST        = "EKWCHZT2LA4NX"
ADMIN_EMAIL    = "admin@gmail.com"
ADMIN_PASSWORD = "123456789"

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Existing Lambda function names (CloudFormation-generated)
CONNECT_FN     = "connected-arena-ConnectFunction-awNwDl8qumo5"
LEADERBOARD_FN = "connected-arena-LeaderboardFunction-QbaN0npDCkUD"
CHAT_FN        = "connected-arena-ChatFunction"
ADMIN_ACT_FN   = "connected-arena-AdminActionFunction"

lam  = boto3.client("lambda",       region_name=REGION)
apigw= boto3.client("apigatewayv2", region_name=REGION)
idp  = boto3.client("cognito-idp",  region_name=REGION)
s3   = boto3.client("s3",           region_name=REGION)
cf   = boto3.client("cloudfront")
sts  = boto3.client("sts")


# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(msg): print(f"  ✓ {msg}")
def step(msg): print(f"\n── {msg} {'─'*(55-len(msg))}")

def zip_handler(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, "handler.py")
    buf.seek(0)
    return buf.read()

def update_lambda(fn_name, handler_path):
    lam.update_function_code(FunctionName=fn_name, ZipFile=zip_handler(handler_path))
    ok(f"Updated {fn_name}")

def get_or_create_lambda(fn_name, handler_path, role_arn, layers):
    code = zip_handler(handler_path)
    try:
        lam.get_function(FunctionName=fn_name)
        lam.update_function_code(FunctionName=fn_name, ZipFile=code)
        ok(f"Updated {fn_name}")
    except lam.exceptions.ResourceNotFoundException:
        resp = lam.create_function(
            FunctionName=fn_name,
            Runtime="python3.12",
            Role=role_arn,
            Handler="handler.lambda_handler",
            Code={"ZipFile": code},
            Layers=layers,
            Environment={"Variables": {"REGION": REGION}},
            Timeout=15,
        )
        # Wait for function to be active
        for _ in range(10):
            state = lam.get_function(FunctionName=fn_name)["Configuration"]["State"]
            if state == "Active": break
            time.sleep(2)
        ok(f"Created {fn_name}: {resp['FunctionArn']}")
    return lam.get_function(FunctionName=fn_name)["Configuration"]["FunctionArn"]

def add_permission(fn_name, statement_id, api_id, account):
    try:
        lam.add_permission(
            FunctionName=fn_name,
            StatementId=statement_id,
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{account}:{api_id}/*/*",
        )
    except lam.exceptions.ResourceConflictException:
        pass  # already exists

def create_route_if_missing(route_key, fn_arn):
    routes = apigw.get_routes(ApiId=API_ID)["Items"]
    if any(r["RouteKey"] == route_key for r in routes):
        ok(f"Route '{route_key}' already exists")
        return
    integ = apigw.create_integration(
        ApiId=API_ID,
        IntegrationType="AWS_PROXY",
        IntegrationUri=f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{fn_arn}/invocations",
        IntegrationMethod="POST",
        PayloadFormatVersion="1.0",
    )
    apigw.create_route(
        ApiId=API_ID,
        RouteKey=route_key,
        Target=f"integrations/{integ['IntegrationId']}",
    )
    ok(f"Created route '{route_key}'")


# ── Steps ─────────────────────────────────────────────────────────────────────

def step_cognito():
    step("Cognito admin user")
    try:
        idp.admin_create_user(
            UserPoolId=POOL_ID,
            Username=ADMIN_EMAIL,
            UserAttributes=[
                {"Name": "email",          "Value": ADMIN_EMAIL},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name",           "Value": "Admin"},
            ],
            TemporaryPassword="TempPass1!",
            MessageAction="SUPPRESS",
        )
        ok(f"Created user: {ADMIN_EMAIL}")
    except idp.exceptions.UsernameExistsException:
        ok(f"User already exists: {ADMIN_EMAIL}")

    idp.admin_set_user_password(
        UserPoolId=POOL_ID,
        Username=ADMIN_EMAIL,
        Password=ADMIN_PASSWORD,
        Permanent=True,
    )
    ok(f"Password set permanently: {ADMIN_PASSWORD}")


def step_lambdas(role_arn, layers, account):
    step("Lambda functions")

    # connect (updated: reads email from query param)
    update_lambda(CONNECT_FN,
        os.path.join(BASE, "backend", "functions", "connect", "handler.py"))

    # leaderboard (updated: returns playerId + achievements)
    update_lambda(LEADERBOARD_FN,
        os.path.join(BASE, "backend", "functions", "leaderboard", "handler.py"))

    # chat (new or update)
    chat_arn = get_or_create_lambda(
        CHAT_FN,
        os.path.join(BASE, "backend", "functions", "chat", "handler.py"),
        role_arn, layers,
    )
    add_permission(CHAT_FN, "AllowApiGatewayChat", API_ID, account)

    # admin_action (new or update)
    adm_arn = get_or_create_lambda(
        ADMIN_ACT_FN,
        os.path.join(BASE, "backend", "functions", "admin_action", "handler.py"),
        role_arn, layers,
    )
    add_permission(ADMIN_ACT_FN, "AllowApiGatewayAdminAction", API_ID, account)

    return chat_arn, adm_arn


def step_api_routes(chat_arn, adm_arn):
    step("API Gateway routes")
    create_route_if_missing("chat",        chat_arn)
    create_route_if_missing("adminAction", adm_arn)

    apigw.create_deployment(ApiId=API_ID, StageName=STAGE)
    ok(f"Deployed to stage '{STAGE}'")


def step_frontend():
    step("Frontend build")
    fe_dir = os.path.join(BASE, "frontend")
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=fe_dir, capture_output=True, text=True,
        encoding="utf-8", errors="replace",
    )
    if result.returncode != 0:
        print(result.stdout[-2000:])
        print(result.stderr[-1000:])
        sys.exit("Frontend build failed")
    ok("Build complete")

    step("Sync to S3")
    out = os.path.join(fe_dir, "out")
    subprocess.run(
        ["aws", "s3", "sync", out, f"s3://{S3_BUCKET}", "--delete", "--region", REGION],
        check=True, capture_output=True,
    )
    ok(f"Synced to s3://{S3_BUCKET}")

    step("CloudFront invalidation")
    cf.create_invalidation(
        DistributionId=CF_DIST,
        InvalidationBatch={
            "Paths": {"Quantity": 1, "Items": ["/*"]},
            "CallerReference": str(int(time.time())),
        },
    )
    ok("Invalidation started (takes ~30s to propagate)")


def main():
    print("=" * 60)
    print("  Connected Arena — Full Deploy")
    print("=" * 60)

    # Verify credentials
    identity = sts.get_caller_identity()
    print(f"  Account : {identity['Account']}")
    print(f"  User    : {identity['UserId']}")

    # Get role + layers from existing connect Lambda
    cfg      = lam.get_function_configuration(FunctionName=CONNECT_FN)
    role_arn = cfg["Role"]
    layers   = [l["Arn"] for l in cfg.get("Layers", [])]
    account  = identity["Account"]

    step_cognito()
    chat_arn, adm_arn = step_lambdas(role_arn, layers, account)
    step_api_routes(chat_arn, adm_arn)
    step_frontend()

    print("\n" + "=" * 60)
    print("  ✅ All done!")
    print("=" * 60)
    print(f"""
  Arena  : https://d1706ex99mjina.cloudfront.net
  Admin  : https://d1706ex99mjina.cloudfront.net/admin
           Email:    {ADMIN_EMAIL}
           Password: {ADMIN_PASSWORD}

  Local  : http://localhost:3000
""")


if __name__ == "__main__":
    main()
