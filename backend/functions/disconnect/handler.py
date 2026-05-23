"""
disconnect/handler.py
---------------------
WebSocket $disconnect handler.
Removes the connection from DynamoDB.
"""

from arena import db, responses


def lambda_handler(event, context):
    connection_id = event["requestContext"]["connectionId"]

    db.connections_table().delete_item(Key={"connectionId": connection_id})
    print(f"Disconnected: {connection_id}")

    return responses.ok("Disconnected")
