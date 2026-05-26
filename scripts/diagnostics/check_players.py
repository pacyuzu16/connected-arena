"""Show all player records with their names and XP."""
import boto3

db = boto3.resource("dynamodb", region_name="eu-central-1")
items = db.Table("ConnectedArena-Players").scan().get("Items", [])
print(f"Total players: {len(items)}")
items.sort(key=lambda x: int(x.get("score", 0)), reverse=True)
print(f"{'playerId':<30}  {'name':<25}  score  preds  email")
print("-" * 100)
for p in items[:25]:
    pid   = p.get("playerId", "?")[:28]
    name  = p.get("name", "?")[:23]
    score = int(p.get("score", 0))
    preds = int(p.get("predictions", 0) or p.get("totalPredictions", 0))
    email = p.get("email", "")
    print(f"{pid:<30}  {name:<25}  {score:>5}  {preds:>5}  {email}")
