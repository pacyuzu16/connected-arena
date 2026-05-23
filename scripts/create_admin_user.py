"""
create_admin_user.py
--------------------
Creates the admin Cognito user with the specified credentials.
Run once with fresh AWS credentials.

Usage:
    python scripts\create_admin_user.py
"""

import boto3

REGION    = "eu-central-1"
POOL_ID   = "eu-central-1_HzdOR3DlT"
EMAIL     = "admin@gmail.com"
PASSWORD  = "123456789"

idp = boto3.client("cognito-idp", region_name=REGION)


def main():
    print(f"Creating admin user: {EMAIL}")

    # 1. Create the user (admin-created users are already confirmed)
    try:
        idp.admin_create_user(
            UserPoolId=POOL_ID,
            Username=EMAIL,
            UserAttributes=[
                {"Name": "email",          "Value": EMAIL},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "name",           "Value": "Admin"},
            ],
            TemporaryPassword=PASSWORD,
            MessageAction="SUPPRESS",   # don't send a welcome email
        )
        print("  User created")
    except idp.exceptions.UsernameExistsException:
        print("  User already exists — resetting password")

    # 2. Set permanent password (so user doesn't have to change it on first login)
    idp.admin_set_user_password(
        UserPoolId=POOL_ID,
        Username=EMAIL,
        Password=PASSWORD,
        Permanent=True,
    )
    print("  Password set (permanent)")

    # 3. Confirm the user (skip FORCE_CHANGE_PASSWORD state)
    try:
        idp.admin_confirm_sign_up(UserPoolId=POOL_ID, Username=EMAIL)
        print("  Email confirmed")
    except Exception:
        pass  # already confirmed

    print(f"\n✅ Admin user ready:")
    print(f"   Email:    {EMAIL}")
    print(f"   Password: {PASSWORD}")
    print(f"   URL:      https://d1706ex99mjina.cloudfront.net/admin")


if __name__ == "__main__":
    main()
