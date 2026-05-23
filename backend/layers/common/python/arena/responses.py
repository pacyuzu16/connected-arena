"""
arena/responses.py
------------------
Standard Lambda HTTP response builders.

WebSocket Lambda handlers must return a dict with at least
{"statusCode": int} — these helpers keep that consistent.
"""


def ok(body: str = "OK") -> dict:
    """200 success response."""
    return {"statusCode": 200, "body": body}


def bad_request(body: str = "Bad Request") -> dict:
    """400 client error response."""
    return {"statusCode": 400, "body": body}


def error(body: str = "Internal Server Error") -> dict:
    """500 server error response."""
    return {"statusCode": 500, "body": body}
