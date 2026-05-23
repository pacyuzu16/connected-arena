"""
deploy_roles_update.py
----------------------
Deploys all changes from the roles/user-management update.

What it does:
  1. Creates admin Cognito user (admin@gmail.com / 123456789)
  2. Updates connect Lambda (stores email, sends ACCOUNT_STATUS)
  3. Deploys admin_action Lambda (new - suspend/unsuspend)
  4. Wires adminAction WebSocket route in API Gateway
  5. Syncs frontend to S3 + invalidates CloudFront

Run:
    python -X utf8 scripts\deploy_roles_update.py
"""

import boto3, io, zipfile, time, os, subprocess

REGION         = "eu-central-1"
API_ID         = "wjhaqx0d53"
STAGE          = "prod"
POOL_ID        = "eu-central-1_HzdOR3DlT"
S3_BUCKET      = "connected-arena-frontend-759601070592"
CF_DIST        = "EKWCHZT2LA4NX"
ADMIN_EMAIL    = "admin@gmail.com"
ADMIN_PASSWORD = "123456789"
BASE           = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONNECT_FN    = "connected-arena-ConnectFunction-awNwDl8qumo5"
ADMIN_ACT_FN  = "connected-arena-AdminActionFunction"

lam  = boto3.client("lambda",       region_name=REGION)
apigw= boto3.client("apigatewayv2", region_name=REGION)
idp  = boto3.client("cognito-idp",  region_name=REGION)
s3   = boto3.client("s3",           region_name=REGION)
cf   = boto3.client("cloudfront")


def zip_handler(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, "handler.py")
    buf.seek(0)
    return buf.read()


def create_admin_user():
    print("── Cognito admin user ────────────────────────────────────")
    try:
        idp.admin_create_user(
            UserPoolId=POOL_ID,
            Username=ADMIN_EMAIL,
            UserAttributes=[
                {"Name": "email",          "Value": ADMIN_EMAIL},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name",           "Value": "Admin"},
            ],
            TemporaryPassword=ADMIN_PASSWORD,
            MessageAction="SUPPRESS",
        )
        print(f"  Created: {ADMIN_EMAIL}")
    except idp.exceptions.UsernameExistsException:
        print(f"  Already exists: {ADMIN_EMAIL}")

    idp.admin_set_user_password(
        UserPoolId=POOL_ID, Username=ADMIN_EMAIL,
        Password=ADMIN_PASSWORD, Permanent=True,
    )
    print(f"  Password set (permanent): {ADMIN_PASSWORD}")


def update_connect_lambda():
    print("\n── connect Lambda ────────────────────────────────────────")
    path = os.path.join(BASE, "backend", "functions", "connect", "handler.py")
    lam.update_function_code(FunctionName=CONNECT_FN, ZipFile=zip_handler(path))
    print(f"  Updated: {CONNECT_FN}")


def deploy_admin_action_lambda():
    print("\n── admin_action Lambda ───────────────────────────────────")
    path = os.path.join(BASE, "backend", "functions", "admin_action", "handler.py")

    # Get role + layer from connect Lambda
    cfg      = lam.get_function_configuration(FunctionName=CONNECT_FN)
    role_arn = cfg["Role"]
    layers   = [l["Arn"] for l in cfg.get("Layers", [])]

    try:
        lam.get_function(FunctionName=ADMIN_ACT_FN)
        lam.update_function_code(FunctionName=ADMIN_ACT_FN, ZipFile=zip_handler(path))
        print(f"  Updated: {ADMIN_ACT_FN}")
    except lam.exceptions.ResourceNotFoundException:
        resp = lam.create_function(
            FunctionName=ADMIN_ACT_FN,
            Runtime="python3.12",
            Role=role_arn,
            Handler="handler.lambda_handler",
            Code={"ZipFile": zip_handler(path)},
            Layers=layers,
            Environment={"Variables": {"REGION": REGION}},
            Timeout=15,
        )
        time.sleep(5)
        print(f"  Created: {resp['FunctionArn']}")

    fn_arn = lam.get_function(FunctionName=ADMIN_ACT_FN)["Configuration"]["FunctionArn"]
    return fn_arn


def wire_admin_action_route(fn_arn):
    print("\n── API Gateway adminAction route ─────────────────────────")
    routes = apigw.get_routes(ApiId=API_ID)["Items"]
    if any(r["RouteKey"] == "adminAction" for r in routes):
        print("  Route already exists — skipping")
        return

    # Add Lambda permission
    account = boto3.client("sts").get_caller_identity()["Account"]
    try:
        lam.add_permission(
            FunctionName=ADMIN_ACT_FN,
            StatementId="AllowApiGatewayAdminAction",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{account}:{API_ID}/*/*",
        )
    except lam.exceptions.ResourceConflictException:
        pass

    integ = apigw.create_integration(
        ApiId=API_ID,
        IntegrationType="AWS_PROXY",
        IntegrationUri=f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31/functions/{fn_arn}/invocations",
        IntegrationMethod="POST",
        PayloadFormatVersion="1.0",
    )
    apigw.create_route(
        ApiId=API_ID,
        RouteKey="adminAction",
        Target=f"integrations/{integ['IntegrationId']}",
    )
    print("  Route adminAction created")


def deploy_api_stage():
    print("\n── Deploying API Gateway stage ───────────────────────────")
    apigw.create_deployment(ApiId=API_ID, StageName=STAGE)
    print(f"  Deployed to: {STAGE}")


def sync_frontend():
    print("\n── Frontend → S3 ────────────────────────────────────────")
    out_dir = os.path.join(BASE, "frontend", "out")
    subprocess.run(
        ["aws", "s3", "sync", out_dir, f"s3://{S3_BUCKET}", "--delete", "--region", REGION],
        check=True, capture_output=True,
    )
    print("  Synced")


def invalidate_cf():
    print("\n── CloudFront invalidation ───────────────────────────────")
    cf.create_invalidation(
        DistributionId=CF_DIST,
        InvalidationBatch={
            "Paths": {"Quantity": 1, "Items": ["/*"]},
            "CallerReference": str(int(time.time())),
        },
    )
    print("  Invalidation started")


def main():
    print("=== Connected Arena — Roles & User Management Deploy ===\n")
    create_admin_user()
    update_connect_lambda()
    fn_arn = deploy_admin_action_lambda()
    wire_admin_action_route(fn_arn)
    deploy_api_stage()
    sync_frontend()
    invalidate_cf()
    print(f"""
✅ Done!

Admin credentials:
  Email:    {ADMIN_EMAIL}
  Password: {ADMIN_PASSWORD}
  URL:      https://d1706ex99mjina.cloudfront.net/admin

Regular users → https://d1706ex99mjina.cloudfront.net
""")


if __name__ == "__main__":
    main()
