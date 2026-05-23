"""
arena/db.py
-----------
DynamoDB table accessors shared across all Lambda handlers.

All tables are resolved from environment variables so the same
layer works in every environment (dev / staging / prod).
"""

import os
import boto3

_dynamodb = boto3.resource("dynamodb")


def _table(env_var: str):
    """Return a DynamoDB Table object for the given env-var name."""
    return _dynamodb.Table(os.environ[env_var])


# ── Table accessors ────────────────────────────────────────────────
# Each property is a thin wrapper so the Table object is created
# lazily (once per Lambda container) and callers never hard-code
# table names.

def connections_table():
    return _table("CONNECTIONS_TABLE")


def players_table():
    return _table("PLAYERS_TABLE")


def predictions_table():
    return _table("PREDICTIONS_TABLE")


def match_events_table():
    return _table("MATCH_EVENTS_TABLE")


def game_room_table():
    return _table("GAME_ROOM_TABLE")


# ── Convenience helpers ────────────────────────────────────────────

def get_all_connections(table=None):
    """
    Return a list of all connectionId strings from the Connections table.
    Pass an explicit table object to reuse an existing reference.
    """
    tbl    = table or connections_table()
    result = tbl.scan(ProjectionExpression="connectionId")
    return [item["connectionId"] for item in result.get("Items", [])]


def get_all_connections_with_players(conn_table=None):
    """
    Return a list of dicts with connectionId + playerId from the
    Connections table.  Used by commentary to look up personas.
    """
    tbl    = conn_table or connections_table()
    result = tbl.scan(ProjectionExpression="connectionId, playerId")
    return result.get("Items", [])
