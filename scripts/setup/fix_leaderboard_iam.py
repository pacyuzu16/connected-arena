"""
Grant the Leaderboard Lambda's IAM role read access to the Connections
and GameRoom tables so it can:
  1. Resolve the caller's playerId from their connection record
  2. Read chatHistory and forward it as CHAT_HISTORY to the client
"""
import boto3, json

REGION  = "eu-central-1"
ACCOUNT = "759601070592"
ROLE    = "connected-arena-LeaderboardFunctionRole-r5bKBaalKbbL"
POLICY  = "LeaderboardExtraReads"

iam = boto3.client("iam")

policy_doc = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid":    "ReadConnectionsAndGameRoom",
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
            ],
            "Resource": [
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-Connections",
                f"arn:aws:dynamodb:{REGION}:{ACCOUNT}:table/ConnectedArena-GameRoom",
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
print("Granted GetItem/Query/Scan on:")
print("  • ConnectedArena-Connections")
print("  • ConnectedArena-GameRoom")
