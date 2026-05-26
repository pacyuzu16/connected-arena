# Connected Arena — PRFAQ

**Press Release + Frequently Asked Questions**
AWS Sports AI Innovation Cup 2026 · Challenge 4
*Team: Carine UMUGABEKAZE · ISHIMWE Ami Paradis · CYUZUZO Pacifique*

---

## PRESS RELEASE

### *adidas and AWS unveil Connected Arena — a real-time platform that lets every football fan play the match they're watching*

**BERLIN, 22 February 2026** — adidas, in partnership with AWS, today launched **Connected Arena**, a real-time multiplayer experience that turns every Bundesliga match into something fans actively compete in — not just watch. The platform is live for the 2025/26 second half of the season, open to fans worldwide, free of charge, and works on any phone, tablet, laptop, or TV.

For the first time, opening the website during a live match feels less like watching highlights and more like being on the pitch. Every shot, penalty, and free-kick triggers a ten-second yes/no prediction window. Correct calls earn XP. Surprise goals — the ones the live ML model rates below ten percent likely — reward triple. The leaderboard reshuffles in real time. Friends form private squads with a six-character code. Live chat runs alongside the action so fans can react together, argue together, celebrate together. And an AI commentator powered by Amazon Bedrock writes a unique reaction for every single fan based on their persona — same goal, three completely different feeds for casual, passionate, and tactical viewers.

> *"Watching football used to be a one-way experience. Connected Arena flips that on its head — and it does it on the matchday hardware fans already own,"* said the team.
> *"We wanted to build something a fan would actually pull out their phone for during a match — not in spite of the match."*

The platform is built entirely on AWS — Lambda, DynamoDB, API Gateway WebSockets, Amazon Bedrock, CloudFront, and Cognito — with zero servers to provision and pay-per-request billing that scales from 10 fans to 10 million without a line-of-code change. A custom Expected Goals (xG) model trained on **57,000 shots from 1,569 professional matches** runs in under a millisecond inside every event, surfacing the danger of every shot to fans live.

Fans walking into a real stadium can scan a QR code on their match ticket to land directly in the venue's live experience — the first step of a longer roadmap that extends Connected Arena into AR overlays, smartwatches, and venue-specific shared experiences.

**Connected Arena is live now at https://d1706ex99mjina.cloudfront.net.**

---

## FAQ

### For fans

**What is Connected Arena, in one sentence?**
A free, real-time platform where you predict football events as they happen, earn points, climb a leaderboard, and chat with other fans — all while the actual match is being played.

**Do I need an account?**
No. Three ways in: continue as a guest (your progress saves to that device), sign up with email (your progress follows you anywhere), or scan the QR code on a real match ticket to land in your stadium automatically.

**What devices does it work on?**
Any modern browser — phone, tablet, laptop, TV. No app store, no install, nothing to update. There's also a dedicated "watch-party" big-screen view designed for TVs and projectors.

**What happens during a match?**
Every shot, penalty, and free-kick fires a ten-second yes/no prediction window. Tap your call. Correct picks earn XP, surprise goals pay triple. A live AI commentary slides in after every important moment, written specifically for your persona (casual, hyped, or tactical). The leaderboard updates in real time. You can chat with other fans worldwide. You can form private squads with friends.

**Will my progress survive if I refresh or change devices?**
Yes if you signed up — your XP and badges follow your account. Yes for guests too, as long as you stay on the same device.

**Is the chat moderated?**
Yes. A house-rules banner appears on first visit, and a permanent "Chat is monitored" pill stays visible. Inappropriate content can be removed and accounts suspended by an admin moderator.

**What's the "stadium" mode for?**
It's the big-screen view designed for projectors, TVs, and watch-party hosts. Massive scoreboard, top-three podium, rolling event ticker, and full-screen splash overlays on every goal. No login needed — just open the link on a TV.

**Does Connected Arena store my personal data?**
Only what you sign up with (email + a display name, via AWS Cognito). Guests are completely anonymous. Match-ticket scans are processed entirely on your device — the ticket payload never reaches our servers.

### For the press / partners

**Why does this matter for adidas and the Bundesliga?**
Modern fans expect to participate, not just consume. The same fans who'd never sit through 90 minutes of passive viewing on a phone will happily play a 90-minute prediction game with their friends in a group chat. Connected Arena turns viewership into engaged, measurable matchday behaviour — which is exactly what a brand-data partnership needs.

**What's the retention story?**
Daily missions reset every midnight (five quick objectives — make three predictions, send five chat messages, get a three-prediction win streak, earn 100 XP, predict a long-shot goal correctly). Five progression tiers from Rookie to Apex, twelve unlockable badges, weekly leagues on the roadmap. The reason to return on matchday two is the reason fans return to Wordle: a tiny daily ritual with a steady drip of progression.

**How does it scale?**
The architecture is 100% serverless — AWS Lambda, DynamoDB, API Gateway WebSockets, CloudFront. There are no provisioned servers anywhere. From ten concurrent fans to ten million, the only thing that changes is the AWS bill. We've validated the pipeline end-to-end against the real DFL match-event feed schema, with a recorded match replay system that can compress 90 minutes into 90 seconds for testing.

**What's the next phase?**
Three north-star expansions:
1. **AR in-stadium** — phone camera at the actual pitch with live player stats overlaid on the players you can see.
2. **Wearable companions** — tap YES or NO on your wrist during prediction windows without pulling out your phone.
3. **Cross-match continuity** — weekly leagues, fantasy-style season layer, and persistent rival relationships across matches.

### For the judges (technical)

**What's actually on AWS?**
Eight services in production: CloudFront, S3, API Gateway (WebSocket), Lambda (ten functions), DynamoDB (five tables), Amazon Cognito (user pool), Amazon Bedrock (Claude Haiku for commentary), and EventBridge (event scheduling). Zero EC2.

**Is the AI personalisation real?**
Yes — every goal, penalty, and VAR check invokes the Bedrock Lambda once per connected fan, with a system prompt customised to that fan's chosen persona. Same in-match event, three completely different commentary messages. If Bedrock is unavailable (rate limit, account SCP, model outage) the same Lambda transparently falls back to rich pre-written persona templates with the same xG-aware variability — so the user-visible experience never breaks.

**Is the ML real?**
Yes. We trained our own logistic-regression Expected Goals model on **57,763 shots from 1,569 professional matches** of StatsBomb open data. AUC 0.75 — competitive with published research on simple xG models. The model lives in-process inside the event-emitter Lambda (no scikit-learn at runtime — we extracted the coefficients into pure Python). When a shot fires, the model evaluates in microseconds and the result rides along on the WebSocket broadcast, where the client renders a colour-coded danger bar in the prediction window. Low-xG goals predicted correctly pay triple XP — a real incentive to find the surprises.

**How does multiplayer state stay consistent?**
A single live WebSocket pipeline. Every fan opens a connection on visit. Match events fire from the EventEmitter Lambda, which calls the Broadcast Lambda asynchronously. Broadcast scans the Connections table and pushes the event to every active socket. Predictions resolve in DynamoDB conditional writes. Stale connections are removed lazily on the next broadcast. No central server to bottleneck — every Lambda invocation is independent and the messaging layer is API Gateway's managed WebSocket fan-out.

**What about the spatial / cross-platform requirement?**
Three concrete touchpoints shipped:
1. **Big-screen view at `/stadium`** — designed for landscape 1920×1080 TVs and projectors.
2. **Stadium gateways at `/venues/[code]`** — six real Bundesliga and international venues each have a deep-link URL judges can scan via QR.
3. **Match-ticket QR scan** — fans scan a QR on their physical ticket (we ship six sample QR codes under `docs/tickets/`) and land in the venue's experience automatically, with name and seat pre-filled.

**Why does this win Challenge 4?**
We hit all six required objectives, score 🟢 strong on five of six rubric criteria, and our weakest area (Spatial Vision) shipped two distinct working touchpoints rather than just mockups. The platform is live, the multiplayer is real, the AI personalisation is real per-user, the ML model is real and trained on real data, and the demo can be triggered with one command (`python scripts/emit_events.py --speedup 60`).

---

## Appendix — quick links

| What | Where |
|---|---|
| Live fan app | https://d1706ex99mjina.cloudfront.net |
| Admin dashboard | https://d1706ex99mjina.cloudfront.net/admin |
| Big-screen / watch-party mode | https://d1706ex99mjina.cloudfront.net/stadium |
| Venue directory (stadium picker) | https://d1706ex99mjina.cloudfront.net/venues |
| Source code | https://github.com/pacyuzu16/connected-arena |
| Architecture diagram | `docs/architecture.png` |
| Demo video script | `docs/video_script.md` |

**Admin demo credentials** are displayed on the admin login screen itself, with a one-click "Use these credentials →" button.

*Connected Arena · AWS Sports AI Innovation Cup 2026 · Challenge 4*
