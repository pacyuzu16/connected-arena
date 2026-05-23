# Connected Arena

**Watch the match. Predict the action. Earn your place.**

Connected Arena is a real-time fan engagement platform built for the AWS Sports AI Innovation Cup 2026 (Challenge 4). It turns passive football viewers into active competitors — predicting events as they happen, chatting with other fans, and climbing a live leaderboard.

🌐 **Live site:** https://d1706ex99mjina.cloudfront.net
🛠️ **Admin dashboard:** https://d1706ex99mjina.cloudfront.net/admin

---

## What it does

While a football match is happening, fans open the website on their phone, tablet, or computer. As the match plays out:

- **Every shot, penalty, and free kick** triggers a YES / NO prediction pop-up with a 10-second countdown.
- **Correct predictions earn XP.** Surprise goals (low-chance shots that go in) reward even more.
- **Personal AI commentary** reacts to every goal — different style for casual fans, passionate fans, and data nerds.
- **Live chat** runs alongside the match so fans can react together in real time and earn XP for being active.
- **The leaderboard updates instantly** as fans climb from Rookie → Pro → Elite → Legend → Apex.

## The four screens

| Tab | What's there |
|------|---------------|
| **Home** | Team lineups, live score, win probability bar, recent activity |
| **Arena** | The live match feed with prediction pop-ups and AI commentary |
| **Leaderboard** | Global rankings, tier badges, crowd reactions |
| **Chat** | YouTube-style live fan chat with emoji reactions and XP rewards |

Each fan also has a **profile** with their stats, badges, and avatar.

## Three ways to use it

1. **Guest** — pick a name and jump in instantly. Your XP saves to your device.
2. **Member** — sign up with email and password (handled by Amazon Cognito). Your XP follows you everywhere.
3. **Admin** — sign in as `admin@gmail.com` to see live engagement stats and manage users (suspend / unsuspend troublemakers).

## What makes it special

- **Real machine learning.** We trained our own Expected Goals (xG) model on **57,000 shots from 1,569 real professional matches** (StatsBomb open data). When a shot fires during a match, the model predicts how likely it is to score. Fans see a colour-coded bar — and rare goals reward triple XP.
- **Personal AI commentary.** Amazon Bedrock writes a unique reaction message for every single fan based on their persona. The casual fan, the loud passionate fan, and the data nerd all see completely different commentary for the exact same goal.
- **Truly real-time.** No refreshing. Predictions, chat, and leaderboard updates push to every fan the instant they happen using WebSockets.
- **No servers to babysit.** Everything runs on AWS Lambda, DynamoDB, and CloudFront. Scales from 10 fans to 10 million without changing a line of code.

## Try the live demo

1. Open the [live site](https://d1706ex99mjina.cloudfront.net) in two browser tabs.
2. Sign in with different names in each tab.
3. Watch predictions, chat, and leaderboard updates flow between them in real time.
4. Visit the [admin dashboard](https://d1706ex99mjina.cloudfront.net/admin) to see live stats.

## The team

| Name |
|------|
| Carine UMUGABEKAZE |
| ISHIMWE Ami Paradis |
| CYUZUZO Pacifique |

---

*AWS Sports AI Innovation Cup 2026 — Challenge 4: Connected Arena — A Real-Time Multiplayer Fan Engagement Ecosystem*
