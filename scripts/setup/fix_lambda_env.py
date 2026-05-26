"""
Add missing env vars to AdminAction and Chat Lambdas.
The deploy script created them with only REGION, but they need 6 more.
"""
import boto3

REGION = "eu-central-1"
lam = boto3.client("lambda", region_name=REGION)

ENV = {"Variables": {
    "REGION":              REGION,
    "CONNECTIONS_TABLE":   "ConnectedArena-Connections",
    "PLAYERS_TABLE":       "ConnectedArena-Players",
    "PREDICTIONS_TABLE":   "ConnectedArena-Predictions",
    "MATCH_EVENTS_TABLE":  "ConnectedArena-MatchEvents",
    "GAME_ROOM_TABLE":     "ConnectedArena-GameRoom",
    "WS_ENDPOINT":         "https://wjhaqx0d53.execute-api.eu-central-1.amazonaws.com/prod",
}}

for fn in ["connected-arena-AdminActionFunction", "connected-arena-ChatFunction"]:
    resp = lam.update_function_configuration(FunctionName=fn, Environment=ENV)
    n = len(resp["Environment"]["Variables"])
    s = resp["LastUpdateStatus"]
    print(f"{fn}: vars={n} state={s}")

print("DONE")
