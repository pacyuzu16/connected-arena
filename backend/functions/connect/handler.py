"""
connect/handler.py
------------------
WebSocket $connect handler.
Registers the new connection in DynamoDB.
After connecting:
  - Returns 200 so the WebSocket handshake completes.
  - Sends the player their ACCOUNT_STATUS (including suspended flag).
  - Suspended players can view but their predict/chat actions will be blocked
    at the Lambda level.
"""

import time, json, os
from arena import db, ws, responses

ADMIN_EMAIL = "admin@gmail.com"


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]
    query_params  = event.get("queryStringParameters") or {}

    authorizer  = event.get("requestContext", {}).get("authorizer", {})

    # Identity resolution
    player_id   = (authorizer.get("sub")
                   or query_params.get("playerId")
                   or connection_id)
    player_name = (query_params.get("name")
                   or authorizer.get("name")
                   or f"Fan_{connection_id[:6]}")
    # Email: JWT authorizer claim preferred; fall back to query param so the
    # admin dashboard (which connects without a JWT) can still be verified.
    player_email = (authorizer.get("email") or query_params.get("email", ""))
    persona      = query_params.get("persona", "casual")
    is_admin     = (player_email == ADMIN_EMAIL)

    ttl = int(time.time()) + 7200

    # Store connection (include email so admin_action can verify caller)
    db.connections_table().put_item(Item={
        "connectionId": connection_id,
        "playerId":     player_id,
        "playerName":   player_name,
        "email":        player_email,
        "isAdmin":      is_admin,
        "ttl":          ttl,
    })

    # Upsert player — always update name, never overwrite XP/stats
    db.players_table().update_item(
        Key={"playerId": player_id},
        UpdateExpression=(
            "SET #name = :name, "
            "persona = if_not_exists(persona, :persona), "
            "score = if_not_exists(score, :zero), "
            "predictions = if_not_exists(predictions, :zero), "
            "correctPredictions = if_not_exists(correctPredictions, :zero), "
            "winStreak = if_not_exists(winStreak, :zero), "
            "achievements = if_not_exists(achievements, :emptyList), "
            "suspended = if_not_exists(suspended, :notSuspended)"
        ),
        ExpressionAttributeNames={"#name": "name"},
        ExpressionAttributeValues={
            ":name":         player_name,
            ":persona":      persona,
            ":zero":         0,
            ":emptyList":    [],
            ":notSuspended": False,
        },
    )

    # Fetch the player record to get their suspended status
    record = db.players_table().get_item(
        Key={"playerId": player_id}
    ).get("Item", {})

    suspended = bool(record.get("suspended", False))

    # Send account status immediately after the handshake
    try:
        apigw = ws.get_apigw_client(event)
        ws.send_message(apigw, connection_id, {
            "type":      "ACCOUNT_STATUS",
            "suspended": suspended,
            "isAdmin":   is_admin,
            "playerId":  player_id,
        })
    except Exception as e:
        print(f"Could not send ACCOUNT_STATUS to {connection_id}: {e}")

    print(f"Connected: {connection_id} → {player_id} ({player_name}) "
          f"suspended={suspended} admin={is_admin}")
    return responses.ok("Connected")
