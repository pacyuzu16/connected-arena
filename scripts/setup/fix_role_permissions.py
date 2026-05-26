"""
Add the missing IAM permissions to the Lambda role so AdminAction and Chat
can send WebSocket messages back to fans and access all required tables.

Adds an inline policy granting:
  - execute-api:ManageConnections on the WebSocket API
  - DynamoDB access to Predictions, MatchEvents, GameRoom tables
"""
import boto3, json

REGION   = "eu-central-1"
ACCOUNT  = "759601070592"
API_ID   = "wjhaqx0d53"
ROLE     = "connected-arena-ConnectFunctionRole-BMybW9sWGFDx"
POLICY   = "ArenaSharedExtraPermissions"

iam = boto3.client("iam")

policy_doc = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid":      "WebSocketSendMessages",
            "Effect":   "Allow",
            "Action":   "execute-api:ManageConnections",
            "Resource": f"arn:aws:execute-api:{REGION}:{ACCOUNT}:{API_ID}/*",
        },
        {
            "Sid":    "ExtraTableAccess",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem",
                "dynamodb:DeleteItem", "dynamodb:Scan", "dynamodb:Query",
                "dynamodb:BatchWriteItem", "dynamodb:BatchGetItem",
                "dynamodb:DescribeTable", "dynamodb:ConditionCheckItem",
            ],
            "Resource": [
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-Predictions",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-Predictions/index/*",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-MatchEvents",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-MatchEvents/index/*",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-GameRoom",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-GameRoom/index/*",
            ],
        },
    ],
}

iam.put_role_policy(
    RoleName=ROLE,
    PolicyName=POLICY,
    PolicyDocument=json.dumps(policy_doc),
)
print(f"✓ Attached inline policy '{POLICY}' to role '{ROLE}'")
print()
print("Permissions added:")
print("  • execute-api:ManageConnections (lets Lambdas send WebSocket messages)")
print("  • DynamoDB R/W on Predictions, MatchEvents, GameRoom tables")
