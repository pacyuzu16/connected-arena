"""
bedrock_commentary/handler.py
------------------------------
Generates personalized AI match commentary using Amazon Bedrock (Claude Haiku).
Triggered after high-impact events (goals, cards, penalties).

Broadcasts a personalized message to each connected fan
based on their persona (casual / passionate / stats_nerd).

If Bedrock is unavailable (e.g. account SCP restriction), falls back to
rich pre-written persona-matched templates that vary by team and event context.
"""

import json
import os
import random
import boto3
from arena import db, ws, responses

bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("REGION", "eu-central-1"))

MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID",
    "eu.anthropic.claude-haiku-4-5-20251001-v1:0"
)

TEAM_NAMES = {
    "DFL-CLU-000001": "Hamburg",
    "DFL-CLU-000002": "Bayern",
}

PERSONA_PROMPTS = {
    "casual":     "You are a fun, friendly football commentator. Keep it short (2 sentences), exciting, and simple. Use emojis.",
    "passionate": "You are a passionate, emotional football fan. React dramatically to match events. Use emojis and strong language (keep it clean). Max 2 sentences.",
    "stats_nerd": "You are a football analytics expert. Briefly mention a relevant stat or tactical insight about this event. Max 2 sentences. Use one emoji.",
}

# ── Fallback templates (used when Bedrock is unavailable) ────────────────────
# Each list has multiple variants so consecutive events feel different.

FALLBACK = {
    "casual": {
        "GOAL": [
            "⚽ {team} scores! What a moment — the crowd goes absolutely wild! 🎉",
            "🔥 GOAL! {team} puts it in the net! This match just got electric! ⚡",
            "🎊 {team} finds the back of the net! Pure magic from the attacking line!",
            "💥 {team} SCORES! Don't blink or you'll miss the celebrations!",
        ],
        "SHOT": [
            "🎯 {team} fires at goal — keeper has to be sharp here!",
            "⚡ Close chance for {team}! The tension in this stadium is unreal!",
            "🔥 {team} pulls the trigger! Every shot could change this game!",
        ],
        "PENALTY": [
            "😮 Penalty to {team}! Step up and make it count — no pressure! 🎯",
            "⚖️ The referee points to the spot for {team}! Huge moment coming up!",
            "🔴 Penalty! {team} gets the chance from 12 yards — nail-biting stuff!",
        ],
        "YELLOW_CARD": [
            "🟨 Yellow card! A {team} player is on a warning now. One more and they're gone!",
            "⚠️ The referee shows yellow to {team}. They'll need to be careful!",
        ],
        "VAR": [
            "📺 VAR is checking the decision! Everyone holds their breath... 👀",
            "🖥️ The video assistant referee steps in — this could change everything!",
        ],
        "FREE_KICK": [
            "🎯 Free kick for {team} in a dangerous area! Set piece time! ⚽",
            "📐 {team} line up the wall — this is a golden opportunity!",
        ],
        "WHISTLE": [
            "🏁 That's the final whistle! What a match this has been — incredible scenes!",
            "🎊 Full time! The fans will be talking about this one for a long time!",
        ],
    },
    "passionate": {
        "GOAL": [
            "YESSSSS! {team} SCORES!! I can't breathe right now — THIS IS EVERYTHING!! 🔥🔥🔥",
            "OH MY GOD!! {team} puts it AWAY! I'm losing my mind! GET IN THERE!! 💥⚽💥",
            "UNBELIEVABLE!! {team} GOAAAAAL!! The roof is coming off this place!! 🎊🔥",
            "THAT'S WHAT I'M TALKING ABOUT!! {team} in front! My heart can't take this!! ❤️‍🔥",
        ],
        "SHOT": [
            "SO CLOSE!! {team} nearly had it — my heart literally stopped!! 😱🔥",
            "COME ON {team}!! Drive at them! Every shot is a chance to win this!! 💪",
            "SHOOT!! Oh the tension — {team} going for it with everything they've got!! ⚡",
        ],
        "PENALTY": [
            "PENALTY!! YES!! {team} deserved that — now PLEASE just score it!! 🙏😤",
            "SPOT KICK!! {team} steps up to the plate — I can barely watch!! 😰🔥",
        ],
        "YELLOW_CARD": [
            "BOOKED! Referee had no choice there. {team} better watch themselves now! 🟨😤",
            "Yellow card! That was reckless — {team} will need to stay disciplined! ⚠️",
        ],
        "VAR": [
            "Oh come ON! VAR again?! Let the game breathe! My nerves are absolutely shot!! 😤📺",
            "VAR CHECK! I swear this technology will be the death of me!! 😩🖥️",
        ],
        "FREE_KICK": [
            "FREEKICK IN A DANGEROUS AREA!! {team} — CURL IT INTO THE TOP CORNER!! 🎯🙏",
            "Set piece time for {team}!! This is EXACTLY what we've been waiting for!! 💥",
        ],
        "WHISTLE": [
            "FULL TIME!! What a rollercoaster! My voice is completely gone — worth it!! 🏁❤️",
            "IT'S OVER!! I need a minute... that was the most intense match of my life!! 😤🎊",
        ],
    },
    "stats_nerd": {
        "GOAL": [
            "📊 {team} convert — their pressing stats have been exceptional all half, winning the ball back in the final third 4 times.",
            "📈 Goal for {team}. Their shot accuracy this half sits at 67% — well above the 42% league average.",
            "🔢 {team} score from a high-press turnover. Teams pressing at this intensity convert 23% more goals in similar scenarios.",
            "📉 {team} find the net — their xG return is now outperforming their shots-on-target ratio by 0.15, suggesting clinical finishing.",
        ],
        "SHOT": [
            "🎯 {team} attempt logged — their total shot volume this match now sits 18% above their seasonal average.",
            "📊 Shot on target for {team}. Keeper positioning and shot placement metrics suggest this came from a high-probability zone.",
            "🔢 {team} test the keeper. Based on distance and angle, this shot fell in the 12-18% conversion probability range.",
        ],
        "PENALTY": [
            "📊 Penalty awarded to {team}. Historical data shows penalties are converted at a 75-80% rate — a major momentum shift.",
            "🎯 Spot kick for {team}. In elite football, 78.4% of penalties are scored — the keeper's dive direction is the key variable.",
        ],
        "YELLOW_CARD": [
            "🟨 Yellow card for {team}. Studies show booked players commit 31% fewer tackles in the remaining minutes — tactical impact ahead.",
            "📊 Caution issued to {team}. Disciplinary pressure often shifts team shape — expect a more conservative defensive block.",
        ],
        "VAR": [
            "🖥️ VAR review — the system has an 89% accuracy rate on offsides but only 71% on subjective handball calls. Interesting case here.",
            "📊 Video review initiated. VAR interventions take an average of 93 seconds and overturn the on-field decision 43% of the time.",
        ],
        "FREE_KICK": [
            "📐 {team} free kick in the danger zone — dead-ball situations in this area convert at roughly 9% directly, 23% after second phase.",
            "📊 Set piece opportunity for {team}. Their dead-ball delivery has created 2.3 xG this season — above the 1.8 average.",
        ],
        "WHISTLE": [
            "🏁 Full time. The xG tallies will tell the real story of who controlled this match — watch for the post-game analytics breakdown.",
            "📊 Final whistle. Possession, press intensity, and transition speed were the decisive factors — the numbers will confirm it.",
        ],
    },
}


def fallback_commentary(event_type: str, team: str, persona: str, xg: float = None) -> str:
    """Generate rich template-based commentary when Bedrock is unavailable."""
    team_name = TEAM_NAMES.get(team, "the team")
    persona_map = FALLBACK.get(persona, FALLBACK["casual"])
    templates = persona_map.get(event_type, [f"⚡ {team_name} — what a moment in this match!"])
    text = random.choice(templates).format(team=team_name)

    # Inject xG context for stats nerds
    if xg is not None and persona == "stats_nerd" and event_type in ("GOAL", "SHOT"):
        xg_pct = int(xg * 100)
        if event_type == "GOAL" and xg < 0.10:
            text += f" Remarkably, our ML xG model (trained on 57k StatsBomb shots) gave this only a {xg_pct}% probability — a truly low-probability conversion."
        elif event_type == "GOAL":
            text += f" The xG for this chance was {xg:.2f} ({xg_pct}%) — {'well above' if xg > 0.25 else 'around'} average for this shot location."
        elif event_type == "SHOT":
            text += f" Shot xG: {xg:.2f} — {'high-danger' if xg > 0.25 else 'moderate'} opportunity based on position and angle."
    elif xg is not None and event_type == "GOAL" and xg < 0.10:
        text += f" Only a {int(xg*100)}% chance from there — what a finish! 🤯"

    return text


def generate_commentary(event_type: str, team: str, persona: str, xg: float = None) -> str:
    """Try Bedrock first; fall back to templates if unavailable."""
    team_name     = TEAM_NAMES.get(team, "the team")
    system_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["casual"])
    event_desc    = {
        "GOAL":        "{team} just scored a goal!",
        "SHOT":        "{team} just had a shot at goal!",
        "PENALTY":     "A penalty has been awarded to {team}!",
        "YELLOW_CARD": "A {team} player just received a yellow card!",
        "FREE_KICK":   "{team} has a free kick in a dangerous position!",
        "VAR":         "VAR is reviewing an incident involving {team}!",
        "SUBSTITUTION":"{team} is making a substitution!",
        "WHISTLE":     "The referee has blown the final whistle!",
    }
    user_message = event_desc.get(event_type, f"A {event_type} event just happened!").format(team=team_name)

    if xg is not None and event_type in ("GOAL", "SHOT", "PENALTY"):
        xg_pct = int(xg * 100)
        if persona == "stats_nerd":
            user_message += f" The shot had an Expected Goals (xG) value of {xg:.2f} ({xg_pct}% chance of scoring, from our ML model trained on 57,000 StatsBomb shots)."
        elif event_type == "GOAL" and xg < 0.10:
            user_message += f" That was a stunner — only a {xg_pct}% chance of scoring from there!"

    try:
        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 100,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_message}],
            }),
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
    except Exception:
        # Bedrock unavailable (SCP restriction, quota, etc.) — use rich templates
        return fallback_commentary(event_type, team, persona, xg)


def lambda_handler(event, context):
    body        = event if isinstance(event, dict) else json.loads(event)
    event_type  = body.get("eventType", "GOAL")
    team        = body.get("team", "")
    ws_endpoint = body.get("wsEndpoint", os.environ.get("WS_ENDPOINT", ""))
    xg          = body.get("xg")

    apigw      = ws.get_apigw_client(endpoint_url=ws_endpoint)
    conn_table = db.connections_table()
    player_tbl = db.players_table()
    connections = db.get_all_connections_with_players(conn_table)

    sent = 0
    for conn in connections:
        conn_id   = conn["connectionId"]
        player_id = conn.get("playerId", "")
        try:
            player  = player_tbl.get_item(Key={"playerId": player_id}).get("Item", {})
            persona = player.get("persona", "casual")
        except Exception:
            persona = "casual"

        try:
            commentary = generate_commentary(event_type, team, persona, xg=xg)
            ws.send_message(apigw, conn_id, {
                "type":       "AI_COMMENTARY",
                "commentary": commentary,
                "eventType":  event_type,
                "team":       TEAM_NAMES.get(team, team),
                "persona":    persona,
            })
            sent += 1
        except Exception as exc:
            print(f"Commentary failed for {player_id}: {exc}")

    print(f"Commentary sent to {sent} fans for {event_type}")
    return responses.ok(f"Commentary sent to {sent} fans")
