"""
avatar_upload/handler.py
------------------------
Returns a presigned S3 PUT URL so the browser can upload a profile photo
directly to S3 without routing the bytes through Lambda.

WebSocket action:  { "action": "avatarUpload" }

Response (sent back to the calling connection):
{
  "type": "AVATAR_UPLOAD_URL",
  "url":  "https://s3.amazonaws.com/...?presigned...",
  "avatarUrl": "https://d1706ex99mjina.cloudfront.net/avatars/{sub}.jpg"
}
"""

import json
import os
import boto3
from arena import db, ws, responses

BUCKET      = os.environ.get("FRONTEND_BUCKET", "connected-arena-frontend-759601070592")
CDN_BASE    = os.environ.get("CDN_BASE", "https://d1706ex99mjina.cloudfront.net")
REGION      = os.environ.get("REGION", "eu-central-1")

s3 = boto3.client("s3", region_name=REGION)


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    # Resolve player identity (Cognito sub preferred, fallback to query string)
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    body       = json.loads(event.get("body", "{}"))
    player_id  = (authorizer.get("sub")
                  or body.get("playerId")
                  or connection_id)

    # Generate a presigned PUT URL valid for 5 minutes
    key = f"avatars/{player_id}.jpg"
    presigned_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket":      BUCKET,
            "Key":         key,
            "ContentType": "image/jpeg",
        },
        ExpiresIn=300,
    )

    avatar_url = f"{CDN_BASE}/{key}"

    # Send the URL back to the requesting fan only
    apigw = ws.get_apigw_client(event)
    ws.send_message(apigw, connection_id, {
        "type":      "AVATAR_UPLOAD_URL",
        "url":       presigned_url,
        "avatarUrl": avatar_url,
        "key":       key,
    })

    return responses.ok("presigned URL sent")
