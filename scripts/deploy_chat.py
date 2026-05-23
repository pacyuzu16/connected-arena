"""
deploy_chat.py
--------------
Deploys the chat Lambda and wires its API Gateway WebSocket route.
Run after setting fresh AWS credentials.

What it does:
  1. Zips and creates/updates  connected-arena-ChatFunction
  2. Adds Lambda resource policy so API Gateway can invoke it
  3. Creates the 'chat' integration in the WebSocket API
  4. Creates the 'chat' route pointing at that integration
  5. Deploys the prod stage so the route goes live
"""

import boto3, io, os, time, zipfile

REGION     = "eu-central-1"
API_ID     = "wjhaqx0d53"
STAGE      = "prod"
CHAT_FN    = "connected-arena-ChatFunction"
CONNECT_FN = "connected-arena-ConnectFunction-awNwDl8qumo5"
BASE       = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

lam   = boto3.client("lambda",       region_name=REGION)
apigw = boto3.client("apigatewayv2", region_name=REGION)
sts   = boto3.client("sts")


def zip_handler(path):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(path, "handler.py")
    buf.seek(0)
    return buf.read()


def get_or_create_chat_lambda():
    handler_path = os.path.join(BASE, "backend", "functions", "chat", "handler.py")
    code = zip_handler(handler_path)

    try:
        lam.update_function_code(FunctionName=CHAT_FN, ZipFile=code)
        fn  = lam.get_function_configuration(FunctionName=CHAT_FN)
        arn = fn["FunctionArn"]
        print(f"  Updated existing Lambda: {arn}")
        return arn
    except lam.exceptions.ResourceNotFoundException:
        pass

    # Get role + layer from the connect Lambda (same permissions needed)
    cfg   = lam.get_function_configuration(FunctionName=CONNECT_FN)
    role  = cfg["Role"]
    layer = (cfg.get("Layers") or [{}])[0].get("Arn")

    create_args = dict(
        FunctionName = CHAT_FN,
        Runtime      = "python3.12",
        Role         = role,
        Handler      = "handler.lambda_handler",
        Code         = {"ZipFile": code},
        Timeout      = 15,
        Environment  = {"Variables": {"REGION": REGION}},
    )
    if layer:
        create_args["Layers"] = [layer]

    fn  = lam.create_function(**create_args)
    arn = fn["FunctionArn"]
    print(f"  Created new Lambda: {arn}")
    time.sleep(8)   # wait for Lambda to become Active
    return arn


def add_invoke_permission(fn_arn):
    account  = sts.get_caller_identity()["Account"]
    source   = f"arn:aws:execute-api:{REGION}:{account}:{API_ID}/*/*"
    stmt_id  = "AllowApiGatewayInvoke"
    try:
        lam.add_permission(
            FunctionName = CHAT_FN,
            StatementId  = stmt_id,
            Action       = "lambda:InvokeFunction",
            Principal    = "apigateway.amazonaws.com",
            SourceArn    = source,
        )
        print(f"  Added invoke permission for API Gateway")
    except lam.exceptions.ResourceConflictException:
        print(f"  Invoke permission already exists")


def find_existing_chat_route():
    routes = apigw.get_routes(ApiId=API_ID)["Items"]
    return next((r for r in routes if r["RouteKey"] == "chat"), None)


def create_chat_route(fn_arn):
    existing = find_existing_chat_route()
    if existing:
        print(f"  chat route already exists: {existing['RouteId']}")
        return

    # Create integration
    integ = apigw.create_integration(
        ApiId               = API_ID,
        IntegrationType     = "AWS_PROXY",
        IntegrationUri      = (
            f"arn:aws:apigateway:{REGION}:lambda:path/2015-03-31"
            f"/functions/{fn_arn}/invocations"
        ),
        IntegrationMethod   = "POST",
        PayloadFormatVersion= "1.0",
    )
    integ_id = integ["IntegrationId"]
    print(f"  Created integration: {integ_id}")

    # Create route
    route = apigw.create_route(
        ApiId    = API_ID,
        RouteKey = "chat",
        Target   = f"integrations/{integ_id}",
    )
    print(f"  Created route: {route['RouteId']}  (key=chat)")


def deploy_stage():
    apigw.create_deployment(ApiId=API_ID, StageName=STAGE)
    print(f"  Deployed stage '{STAGE}'")


def main():
    print("\n=== Deploying chat Lambda + API Gateway route ===\n")

    print("1. Lambda")
    fn_arn = get_or_create_chat_lambda()

    print("2. IAM permission")
    add_invoke_permission(fn_arn)

    print("3. API Gateway route")
    create_chat_route(fn_arn)

    print("4. Deploy stage")
    deploy_stage()

    print("\n✅ Chat route is live!")
    print("   Test: open the arena, go to Chat tab, type a message.")
    print("   It should appear for every connected fan in real time.")


if __name__ == "__main__":
    main()
