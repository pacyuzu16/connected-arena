# Connected Arena — 3-Minute Demo Video Script

**Max duration:** 3 minutes | **Resolution:** <720p | **Format:** .mp4

---

## Recording Setup

1. Use **OBS Studio** (free) or built-in screen recorder (Windows: Win+G, Mac: Cmd+Shift+5)
2. Open **two browser windows** side by side (this proves multiplayer)
3. Have the terminal ready for the match replay command
4. Resolution: 1280x720 (720p) or lower

---

## Script (timestamps)

### [0:00 – 0:20] INTRO — Landing Page

**Show:** Open https://d1706ex99mjina.cloudfront.net in browser

**Say:**
> "Connected Arena is a real-time multiplayer fan engagement platform built for the AWS Sports AI Innovation Cup. Fans join a shared match room, make live predictions on Bundesliga events, earn XP, and receive personalized AI commentary — all powered by WebSocket and Amazon Bedrock."

**Action:** Scroll the landing page briefly to show features grid.

---

### [0:20 – 0:45] JOIN — Two Players

**Action:**
1. Click "Enter the Arena" → pick name "Fan_Alpha", persona "Passionate" → join
2. Open second browser window → go to same URL → "Enter the Arena" → name "Fan_Beta", persona "Stats Nerd" → join

**Say:**
> "Multiple fans can join simultaneously. Each picks a name and fan persona — Casual, Passionate, or Stats Nerd. This persona drives personalized AI commentary later."

**Show:** Both windows side by side showing the arena, both connected (green LIVE dot).

---

### [0:45 – 1:00] START THE MATCH

**Action:** In terminal, run:
```
python scripts/emit_events.py --region eu-central-1 --speedup 60
```

**Say:**
> "We replay a real DFL Bundesliga match — Hamburg vs Bayern — at accelerated speed. EventBridge and Lambda process one event per tick, broadcasting to all fans over WebSocket."

---

### [1:00 – 1:40] LIVE PREDICTIONS + XP

**Show:** Wait for a prediction-eligible event (SHOT, FREE_KICK, PENALTY). The prediction modal will pop up in both windows with a countdown timer.

**Action:**
1. In window 1 (Fan_Alpha): click "YES"
2. In window 2 (Fan_Beta): click "NO"

**Say:**
> "When a shot or free kick happens, fans get a prediction window with a countdown. They predict YES or NO — will this become a goal? When the next GOAL event fires, correct fans earn XP, their win streak increments, and the leaderboard updates live."

**Show:** After a GOAL event fires:
- Score updates in the header
- Leaderboard shifts (point to the XP change)
- AI commentary bar slides in at the bottom

**Say:**
> "Notice the AI commentary — Fan_Alpha, our passionate fan, gets dramatic text. Fan_Beta, the stats nerd, gets tactical analysis. Same goal, completely different experiences — powered by Amazon Bedrock."

---

### [1:40 – 2:10] LEADERBOARD + GAMIFICATION

**Action:** Click the "Leaders" tab in one window.

**Say:**
> "The leaderboard shows Global, Friends, and Regional views. Players earn tier badges from ROOKIE to APEX based on XP. Win streaks show a fire icon. Accuracy percentage tracks prediction skill."

**Show:** Point out podium, tier badges, accuracy bars.

**Action:** Click "Profile" tab.

**Say:**
> "Each fan has a persistent profile with stats, achievements, and recent activity. Identity persists across sessions via localStorage — and we support Cognito for cross-device sync."

---

### [2:10 – 2:35] STADIUM MODE — Spatial Proof of Concept

**Action:** Open a new tab → go to https://d1706ex99mjina.cloudfront.net/stadium

**Say:**
> "This is our spatial proof-of-concept — Stadium Big Screen Mode. Designed for jumbotrons, sports bars, and projectors. It shows a giant scoreboard, live events, crowd voting percentages, and a QR code for fans to scan and join on their phones. It connects via the same WebSocket pipeline — fully live."

**Show:** Point out the large score, event feed, prediction bars, QR code.

---

### [2:35 – 3:00] CLOSING — Architecture + North Star

**Say:**
> "Under the hood: 100% serverless on AWS. CloudFront, API Gateway WebSocket, 9 Lambda functions, 5 DynamoDB tables, EventBridge for scheduling, and Bedrock for AI. Zero EC2 instances."

> "Our north star vision: a persistent fan identity that travels across mobile, stadium screens, wearables, and AR overlays — every interaction earns XP, every touchpoint is connected."

> "Thank you — Connected Arena."

---

## Tips

- Keep energy up — judges watch many videos
- Use mouse cursor to point at key UI elements
- Don't worry about perfect narration — enthusiasm > polish
- Make sure the terminal command is running so events keep flowing during recording
- If a GOAL fires during recording, that's perfect — capture the goal flash animation!
