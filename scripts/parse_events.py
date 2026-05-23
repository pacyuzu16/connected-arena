"""
parse_events.py
---------------
Parses Events_Anonym.xml from S3 and loads key match events
into DynamoDB (ConnectedArena-MatchEvents table).

Only stores "trigger" events that drive in-app moments.
Skips high-frequency play-by-play events to keep costs low.

Usage:
    python parse_events.py --bucket hackathon-data-<account-id> --region eu-central-1
"""

import boto3
import xml.etree.ElementTree as ET
import argparse
import json
import sys
from datetime import datetime

# Event types that trigger in-app moments
TRIGGER_EVENTS = {
    "SuccessfulShot": {"type": "GOAL",         "points": 100, "window": 0},
    "ShotAtGoal":     {"type": "SHOT",          "points": 50,  "window": 10},
    "Penalty":        {"type": "PENALTY",       "points": 150, "window": 30},
    "Caution":        {"type": "YELLOW_CARD",   "points": 30,  "window": 0},
    "FreeKick":       {"type": "FREE_KICK",     "points": 40,  "window": 8},
    "VideoAssistantAction": {"type": "VAR",     "points": 75,  "window": 20},
    "Substitution":   {"type": "SUBSTITUTION",  "points": 20,  "window": 0},
    "FinalWhistle":   {"type": "WHISTLE",       "points": 0,   "window": 0},
    "CornerKick":     {"type": "CORNER",        "points": 25,  "window": 8},
    "KickOff":        {"type": "KICKOFF",       "points": 0,   "window": 0},
}

MATCH_ID = "DFL-MAT-111111"
CHALLENGE = "Challenge 4 – Connected Arena - A Real-Time Multiplayer Fan Engagement Ecosystem"


def parse_and_load(bucket: str, region: str):
    print(f"Connecting to AWS (region: {region})...")
    s3 = boto3.client("s3", region_name=region)
    dynamodb = boto3.resource("dynamodb", region_name=region)
    table = dynamodb.Table("ConnectedArena-MatchEvents")

    key = f"{CHALLENGE}/data/Match-Events/Events_Anonym.xml"
    print(f"Downloading s3://{bucket}/{key} ...")

    response = s3.get_object(Bucket=bucket, Key=key)
    xml_content = response["Body"].read().decode("utf-8")

    print("Parsing XML...")
    root = ET.fromstring(xml_content)

    events_loaded = 0
    events_skipped = 0

    with table.batch_writer() as batch:
        for event_elem in root.findall("Event"):
            event_id   = event_elem.get("EventId", "")
            event_time = event_elem.get("EventTime", "")
            x_pos      = event_elem.get("X-Position", "0")
            y_pos      = event_elem.get("Y-Position", "0")

            # Find which trigger event type this is
            trigger_type = None
            trigger_meta = None
            for child in event_elem.iter():
                if child.tag in TRIGGER_EVENTS:
                    trigger_type = child.tag
                    trigger_meta = TRIGGER_EVENTS[child.tag]
                    break

            if not trigger_type:
                events_skipped += 1
                continue

            # Get team info from Play element if available
            team = ""
            player = ""
            play_elem = event_elem.find(".//Play")
            if play_elem is not None:
                team   = play_elem.get("Team", "")
                player = play_elem.get("Player", "")

            item = {
                "matchId":        MATCH_ID,
                "eventTime":      event_time,
                "eventId":        event_id,
                "eventType":      trigger_meta["type"],
                "rawType":        trigger_type,
                "xPosition":      x_pos,
                "yPosition":      y_pos,
                "team":           team,
                "player":         player,
                "pointsAvailable": trigger_meta["points"],
                "predictionWindow": trigger_meta["window"],
                "processed":      False,
            }

            batch.put_item(Item=item)
            events_loaded += 1
            print(f"  ✓ {trigger_type} at {event_time} (team: {team})")

    print(f"\nDone! Loaded {events_loaded} trigger events, skipped {events_skipped} non-trigger events.")
    return events_loaded


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse DFL match events into DynamoDB")
    parser.add_argument("--bucket",  required=True, help="S3 bucket name (hackathon-data-<account-id>)")
    parser.add_argument("--region",  default="eu-central-1", help="AWS region")
    args = parser.parse_args()

    count = parse_and_load(args.bucket, args.region)
    print(f"\n{count} events ready in DynamoDB. Connected Arena is ready to run!")
