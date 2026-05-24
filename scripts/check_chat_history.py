"""Quick diagnostic: is chat history actually being stored in DynamoDB?"""
import boto3

db = boto3.resource("dynamodb", region_name="eu-central-1")
room = db.Table("ConnectedArena-GameRoom").get_item(Key={"roomId": "main"}).get("Item")

if not room:
    print("❌ GameRoom 'main' item DOES NOT EXIST")
else:
    print(f"✓ GameRoom item exists, keys: {list(room.keys())}")
    history = room.get("chatHistory", [])
    print(f"✓ chatHistory length: {len(history)}")
    print()
    if history:
        print("Last 5 messages:")
        for m in history[-5:]:
            print(f"  [{m.get('time')}] {m.get('name')}: {m.get('message')}")
    else:
        print("⚠️  chatHistory is empty — chat handler is not persisting messages")
