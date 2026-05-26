"""Show the inline policies on the Connect Lambda's IAM role."""
import boto3, json

iam = boto3.client("iam")
ROLE = "connected-arena-ConnectFunctionRole-BMybW9sWGFDx"

print(f"=== Role: {ROLE} ===")
print("\n--- Inline policies ---")
for name in iam.list_role_policies(RoleName=ROLE)["PolicyNames"]:
    pol = iam.get_role_policy(RoleName=ROLE, PolicyName=name)["PolicyDocument"]
    print(f"\n[{name}]")
    print(json.dumps(pol, indent=2)[:3000])

print("\n--- Attached managed policies ---")
for pol in iam.list_attached_role_policies(RoleName=ROLE)["AttachedPolicies"]:
    print(f"  - {pol['PolicyName']} ({pol['PolicyArn']})")
