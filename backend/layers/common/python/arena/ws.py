"""
arena/ws.py
-----------
WebSocket helpers shared across all Lambda handlers.
"""

import json
import boto3
import logging

logger = logging.getLogger(__name__)


def get_apigw_client(event: dict | None = None, endpoint_url: str | None = None):
    """
    Build an API Gateway Management API client.

    Priority:
      1. Explicit endpoint_url argument
      2. Derived from requestContext in the Lambda event dict
      3. WS_ENDPOINT environment variable (fallback for direct invocations)
    """
    import os

    if not endpoint_url:
        if event:
            ctx = event.get("requestContext", {})
            domain = ctx.get("domainName", "")
            stage  = ctx.get("stage", "prod")
            if domain:
                endpoint_url = f"https://{domain}/{stage}"

    if not endpoint_url:
        endpoint_url = os.environ.get("WS_ENDPOINT", "")

    return boto3.client("apigatewaymanagementapi", endpoint_url=endpoint_url)


def send_message(apigw_client, connection_id: str, message: dict) -> bool:
    """
    Send a JSON message to a single WebSocket connection.

    Returns True on success, False if the connection is gone (stale).
    Stale connections are NOT deleted here — callers decide whether to clean up.
    """
    try:
        apigw_client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(message).encode("utf-8"),
        )
        return True
    except apigw_client.exceptions.GoneException:
        logger.warning("Stale connection: %s", connection_id)
        return False
    except Exception as exc:
        logger.error("Failed to send to %s: %s", connection_id, exc)
        return False


def broadcast(apigw_client, connections_table, message: dict) -> dict:
    """
    Send a message to every connection in the connections table.
    Automatically removes stale (GoneException) connections.

    Returns {"sent": int, "removed": int}.
    """
    result = connections_table.scan(ProjectionExpression="connectionId")
    items  = result.get("Items", [])

    sent = removed = 0
    for item in items:
        conn_id = item["connectionId"]
        ok = send_message(apigw_client, conn_id, message)
        if ok:
            sent += 1
        else:
            connections_table.delete_item(Key={"connectionId": conn_id})
            removed += 1

    logger.info("Broadcast: sent=%d removed=%d", sent, removed)
    return {"sent": sent, "removed": removed}
