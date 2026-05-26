# Connected Arena

**Watch the match. Predict the action. Earn your place.**

Connected Arena is a real-time fan engagement platform built for the AWS Sports AI Innovation Cup 2026 (Challenge 4). It turns passive football viewers into active competitors — predicting events as they happen, chatting with other fans, and climbing a live leaderboard.

🌐 **Live site:** https://d1706ex99mjina.cloudfront.net
🛠️ **Admin dashboard:** https://d1706ex99mjina.cloudfront.net/admin
📺 **Big-screen / watch-party view:** https://d1706ex99mjina.cloudfront.net/stadium

---

## What it does

While a football match is happening, fans open the website on their phone, tablet, or computer. As the match plays out:

- **Every shot, penalty, and free kick** triggers a YES / NO prediction pop-up with a 10-second countdown.
- **Correct predictions earn XP.** Surprise goals (low-chance shots that go in) reward triple.
- **Personal AI commentary** reacts to every goal — different style for casual fans, passionate fans, and data nerds.
- **Live chat** runs alongside the match so fans can react together in real time and earn XP for being active.
- **The leaderboard updates instantly** as fans climb from Rookie → Pro → Elite → Legend → Apex.

## The four screens

| Tab | What's there |
|------|---------------|
| **Home** | Team lineups, live score, win probability, daily missions, recent activity |
| **Arena** | The live match feed with prediction pop-ups and AI commentary |
| **Leaderboard** | Global rankings, friend squads, tier badges, crowd reactions |
| **Chat** | YouTube-style live fan chat with emoji reactions and XP rewards |

Each fan also has a **profile** with stats, badges, avatar, settings (mute toggles + 4 languages) and squad management.

## Three ways to use it

1. **Guest** — pick a name and jump in instantly. Your XP saves to your device.
2. **Member** — sign up with email and password (Amazon Cognito). Your XP follows you everywhere.
3. **Admin** — sign in as `admin@gmail.com` / `123456789` to see live engagement stats and manage users.

---

## 🎮 How to use the system

### As a fan — playing the game

1. **Open** [https://d1706ex99mjina.cloudfront.net](https://d1706ex99mjina.cloudfront.net)
2. Click **"Start playing"** (or pick a stadium from the *Stadiums* tab)
3. On the login screen, you have three options:
   - **Sign up** — quick email + password account (your progress follows you anywhere you sign in)
   - **Sign in** — if you already have an account
   - **Continue as Guest** — fastest path, type a name and you're in (progress saves to that device)
4. Pick your persona — *Casual*, *Passionate* or *Stats Nerd*. This is what flavours the AI commentary.
5. You're in the arena. Wait for the next match event:
   - **Shot / penalty / free kick** → a yellow YES/NO pop-up with a 10-second countdown — tap your call
   - **Goal** → AI commentary slides up at the bottom, your XP jumps, the leaderboard reshuffles
   - **Chat tab** → join the conversation; every 5 messages earns +5 XP
6. Want to play with friends? Open the **Leaderboard** tab → **Create Squad** → share the 6-character code with mates → see a private squad leaderboard alongside the global one.

### As the admin — watching what's happening

1. Visit [https://d1706ex99mjina.cloudfront.net/admin](https://d1706ex99mjina.cloudfront.net/admin)
2. The demo credentials are shown right on the login screen — click **"Use these credentials →"** to autofill, then **Sign In**:
   - Email: `admin@gmail.com`
   - Password: `123456789`
3. From the sidebar, you can switch between:
   - **Overview** — live KPI cards, charts (top players, accuracy distribution, engagement), ML insights
   - **User Management** — every connected fan, search, suspend / unsuspend troublemakers
   - **Leaderboard** — full live ranking (top 50)
   - **Match Status** — score, event distribution, real-time activity log
4. Sidebar footer has a **Stadium View** link — pops open the big-screen / watch-party view in a new tab. Project it on a TV.

### As a watch-party host — using the big screen

1. Open [https://d1706ex99mjina.cloudfront.net/stadium](https://d1706ex99mjina.cloudfront.net/stadium) on any TV, projector or big monitor
2. Click the fullscreen icon (top-right) for a full-bleed experience
3. The display shows:
   - Massive live scoreboard with match minute
   - Top-3 fan podium (winner card highlighted)
   - Rolling event ticker at the bottom
   - **Big screen-filling alerts** every time a goal, penalty or VAR check happens

No login is needed for the stadium view — anyone with the URL can watch.

---

## 🔧 Running a live match (for the team behind the demo)

The platform is live but the football match itself is a recorded Bundesliga match that the team **replays on demand**. To start a fresh match (or run the demo for judges), use the scripts below.

### Prerequisites
- Python 3.10+
- AWS credentials for the project's account (region: `eu-central-1`)
- `pip install boto3`

### 1. Reset the match (optional but recommended before each demo)

```bash
cd scripts
python demo_reset.py
```

This pauses the auto-scheduler, marks all 91 match events as **unprocessed**, and wipes any open predictions so the scoreboard starts fresh. Player XP and ranks are kept (they accumulate across replays like a real season). Add `--full-reset` if you want to wipe XP too.

### 2. Emit the match events

```bash
python emit_events.py --speedup 60
```

This streams the 91 match events to every connected fan via WebSockets. The `--speedup` value controls match speed:

| Value | Effect |
|-------|--------|
| `--speedup 60`  | ~1.5-minute compressed demo (good for judging) |
| `--speedup 30`  | ~3-minute demo (more breathing room) |
| `--speedup 1`   | Real-time (90 minutes — the real thing) |
| `--speedup 0`   | Instant fire — every event back-to-back (stress-test) |

While the script runs, every fan with the site open sees prediction windows pop up, the score change, AI commentary slide in, and the leaderboard reshuffle live.

### 3. Restore auto-mode (after the demo)

```bash
python demo_reset.py --restore
```

Re-enables the EventBridge scheduler so events emit automatically every minute again.

---

## What makes it special

- **Real machine learning.** The Expected Goals (xG) model was trained on **57,000 shots from 1,569 professional matches** (StatsBomb open data). When a shot fires, the model predicts how likely it is to score. Fans see a colour-coded bar — and surprise goals reward triple XP.
- **Personal AI commentary.** Amazon Bedrock writes a unique reaction message for every fan based on their persona. Same goal, three completely different feeds for casual / passionate / stats-nerd viewers.
- **Truly real-time.** No refreshing. Predictions, chat, and leaderboard updates push via WebSockets the instant they happen.
- **Stadium gateway.** Six real venues let fans "enter" a stadium (scan a QR at the gate, or click from the venues directory) to access the match scoped to that ground.
- **No servers to babysit.** Everything runs on AWS Lambda, DynamoDB, and CloudFront. Scales from 10 fans to 10 million without changing a line of code.

## The team — CHAMPS

| Names |
|------|
| Carine UMUGABEKAZE |
| ISHIMWE Ami Paradis |
| CYUZUZO Pacifique |

---

*AWS Sports AI Innovation Cup 2026 — Challenge 4: Connected Arena — A Real-Time Multiplayer Fan Engagement Ecosystem*
