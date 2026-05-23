"""Inspect what's actually stored in the Connections table for admin sessions."""
import boto3

db = boto3.resource("dynamodb", region_name="eu-central-1")
t  = db.Table("ConnectedArena-Connections")
items = t.scan().get("Items", [])
print(f"Total connections: {len(items)}")

admin_conns = [i for i in items if i.get("playerId") == "admin-dashboard"]
print(f"admin-dashboard connections: {len(admin_conns)}")
for c in admin_conns[:10]:
    print("---")
    for k in ["connectionId","playerId","playerName","email","isAdmin"]:
        v = c.get(k, "(MISSING)")
        print(f"  {k}: {v}")

# Also look for ANY connection with email set
with_email = [i for i in items if i.get("email")]
print(f"\nConnections with non-empty email: {len(with_email)}")
for c in with_email[:5]:
    print(f"  {c.get('connectionId')}  playerId={c.get('playerId')}  email={c.get('email')}  isAdmin={c.get('isAdmin')}")
