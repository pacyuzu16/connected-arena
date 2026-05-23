"""
deploy_auth_update.py
---------------------
Deploys all backend changes from the Cognito/chat update in one shot.

Run after setting fresh AWS credentials:
    python scripts\deploy_auth_update.py

What it does:
  1. Updates connect Lambda      (name priority fix + achievements field)
  2. Updates leaderboard Lambda  (returns playerId + achievements)
  3. Creates / updates chat Lambda (new: live fan chat)
  4. Wires chat Lambda to API Gateway WebSocket (action = "chat")
  5. Redeploys API Gateway prod stage
  6. Syncs frontend/out to S3 and invalidates CloudFront
"""

import boto3, subprocess, sys, time, zipfile, io, os, json

REGION         = "eu-central-1"
API_ID         = "wjhaqx0d53"
STAGE          = "prod"
S3_BUCKET      = "connected-arena-frontend-759601070592"
CF_DIST        = "EKWCHZT2LA4NX"
BASE           = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CONNECT_FN     = "connected-arena-ConnectFunction-awNwDl8qumo5"
LEADERBOARD_FN = "connected-arena-LeaderboardFunction-QbaN0npDCkUD"
CHAT_FN_NAME   = "connected-arena-ChatFunction"

lam  = boto3.client("lambda",              region_name=REGION)
apigw= boto3.client("apigatewayv2",        region_name=REGION)
s3   = boto3.client("s3",                  region_name=REGION)
cf   = boto3.client("cloudfront")


def zip_file(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, os.path.basename(path))
    buf.seek(0)
    return buf.read()


def update_lambda(fn_name, handler_path):
    print(f"  Updating {fn_name}...", end=" ")
    lam.update_function_code(
        FunctionName=fn_name,
        ZipFile=zip_file(handler_path),
    )
    print("done")


def get_or_create_chat_lambda(role_arn, layer_arn):
    handler_path = os.path.join(BASE, "backend", "functions", "chat", "handler.py")
    try:
        fn = lam.get_function(FunctionName=CHAT_FN_NAME)
        print(f"  Updating {CHAT_FN_NAME}...", end=" ")
        lam.update_function_code(
            FunctionName=CHAT_FN_NAME,
            ZipFile=zip_file(handler_path),
        )
        print("done")
        return fn["Configuration"]["FunctionArn"]
    except lam.exceptions.ResourceNotFoundException:
        print(f"  Creating {CHAT_FN_NAME}...", end=" ")
        resp = lam.create_function(
            FunctionName=CHAT_FN_NAME,
            Runtime="python3.12",
            Role=role_arn,
            Handler="handler.lambda_handler",
            Code={"ZipFile": zip_file(handler_path)},
            Layers=[layer_arn] if layer_arn else [],
            Environment={"Variables": {"REGION": REGION}},
            Timeout=15,
        )
        time.sleep(5)
        print("done")
        return resp["FunctionArn"]


def wire_chat_route(chat_fn_arn):
    """Create API Gateway route 'chat' → chat Lambda if it doesn't exist."""
    routes = apigw.get_routes(ApiId=API_ID)["Items"]
    if any(r["RouteKey"] == "chat" for r in routes):
        print("  chat route already exists, skipping")
        return

    # Add resource-based permission for API Gateway to invoke the Lambda
    account = boto3.client("sts").get_caller_identity()["Account"]
    try:
        lam.add_permission(
            FunctionName=CHAT_FN_NAME,
            StatementId="AllowApiGatewayInvoke",
            Action="lambda:InvokeFunction",
            Principal="apigateway.amazonaws.com",
            SourceArn=f"arn:aws:execute-api:{REGION}:{account}:{API_ID}/*/*",
        )
    except lam.exceptions.ResourceConflictException:
        pass  # permission already exists

    # Create integration
    print("  Creating chat integration...", end=" ")
    integ = apigw.create_integration(
        ApiId=API_ID,
        IntegrationType="AWS_PROXY",
        IntegrationUri=(
            f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31"
            f"/functions/{chat_fn_arn}/invocations"
        ),
        IntegrationMethod="POST",
        PayloadFormatVersion="1.0",
    )
    integ_id = integ["IntegrationId"]
    print(f"integ={integ_id}", end=" ")

    # Create route
    apigw.create_route(
        ApiId=API_ID,
        RouteKey="chat",
        Target=f"integrations/{integ_id}",
    )
    print("route created")


def deploy_api():
    print("  Deploying API Gateway stage...", end=" ")
    apigw.create_deployment(ApiId=API_ID, StageName=STAGE)
    print("done")


def sync_s3():
    out_dir = os.path.join(BASE, "frontend", "out")
    print(f"  Syncing {out_dir} → s3://{S3_BUCKET}...", end=" ")
    subprocess.run(
        ["aws", "s3", "sync", out_dir, f"s3://{S3_BUCKET}",
         "--delete", "--region", REGION],
        check=True, capture_output=True,
    )
    print("done")


def invalidate_cf():
    print(f"  Invalidating CloudFront {CF_DIST}...", end=" ")
    cf.create_invalidation(
        DistributionId=CF_DIST,
        InvalidationBatch={
            "Paths": {"Quantity": 1, "Items": ["/*"]},
            "CallerReference": str(int(time.time())),
        },
    )
    print("done")


def main():
    print("=== Connected Arena — Backend + Frontend Deploy ===\n")

    # Get role + layer from existing connect Lambda
    cfg      = lam.get_function_configuration(FunctionName=CONNECT_FN)
    role_arn = cfg["Role"]
    layers   = cfg.get("Layers", [])
    layer_arn= layers[0]["Arn"] if layers else None
    print(f"Role  : {role_arn}")
    print(f"Layer : {layer_arn}\n")

    print("── Lambdas ──────────────────────────────────────────────")
    update_lambda(CONNECT_FN,
        os.path.join(BASE, "backend", "functions", "connect", "handler.py"))
    update_lambda(LEADERBOARD_FN,
        os.path.join(BASE, "backend", "functions", "leaderboard", "handler.py"))
    chat_fn_arn = get_or_create_chat_lambda(role_arn, layer_arn)

    print("\n── API Gateway ──────────────────────────────────────────")
    wire_chat_route(chat_fn_arn)
    deploy_api()

    print("\n── Frontend ─────────────────────────────────────────────")
    sync_s3()
    invalidate_cf()

    print("\n✅ Deploy complete!")
    print("   Live URL : https://d1706ex99mjina.cloudfront.net")
    print("   Admin    : https://d1706ex99mjina.cloudfront.net/admin")


if __name__ == "__main__":
    main()
