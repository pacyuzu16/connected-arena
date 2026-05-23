# Connected Arena — North Star Vision

## A Connected Fan Ecosystem Spanning Matchday, Mid-Week, and Every Touchpoint

---

## 1. The Vision

Connected Arena is not a single app — it is an **engagement ecosystem** where every fan interaction, across every device and environment, builds toward a persistent identity. A fan's XP, tier, achievements, and reputation travel with them from their phone to the stadium jumbotron to their smartwatch to mid-week training challenges.

**One fan. One identity. Every touchpoint connected.**

---

## 2. Touchpoint Map

### 2.1 Mobile (LIVE — Fully Built)

The core experience. Fans join via their phone's browser (no app install), pick a persona, and engage with the full arena:
- Real-time match event feed over WebSocket
- YES/NO prediction modals with countdown timers
- Personalized AI commentary via Amazon Bedrock (3 personas)
- XP, levels, tier badges, win streaks, achievements
- Live leaderboard (Global / Friends / Regional)
- Live chat with other fans
- Pre-match predictions, half-time AI summary, post-match report

### 2.2 Stadium Big Screen Mode (BUILT — `/stadium`)

A full-screen, high-contrast interface designed for jumbotrons, LED boards, and watch-party projectors:
- Giant scoreboard readable from 50+ feet
- Live match event feed with large typography
- Real-time crowd voting bars (YES/NO percentages) — fans see their collective voice
- Top 5 fan leaderboard displayed prominently
- QR code overlay — fans scan to join instantly on their phones
- AI commentary overlay for high-impact moments
- Auto-connects via WebSocket, no login needed

**Use case:** A sports bar projects `/stadium` on their TV. Fans at the bar scan the QR code, make predictions on their phones, and see the crowd vote shift on the big screen in real time.

### 2.3 Watch Party Mode (BUILT — Watch Tab)

The in-app companion for group viewing:
- Fan count (scaled to show community size)
- Shared prediction challenge with live crowd vote bars
- Top fan rankings
- QR code for easy sharing
- Crowd reaction animations

### 2.4 AR In-Stadium Experience (CONCEPT)

Using the phone camera as a window into augmented match data:
- **Live stat overlays:** Point phone at the pitch to see possession heat maps, player movement trails, and expected goals (xG) floating above the action
- **Player badges:** AR badges showing each player's form rating, recent goals, and prediction accuracy hover near players on the field
- **Section challenges:** Location-aware challenges based on which stadium section you're in — "Section 12 vs Section 15: who predicts more goals correctly?"
- **Proximity fan matching:** Discover fans near you with similar personas or tier levels — unlock "Stadium Squad" achievements when you predict together
- **Post-goal AR celebration:** When your team scores, the phone screen erupts with confetti, your XP gain floats up, and nearby fans' reactions appear as emoji clusters in AR space

**Technical path:** WebSocket delivers real-time data; ARKit/ARCore renders overlays; location from GPS + BLE beacons; same DynamoDB identity.

### 2.5 Wearable Companion (CONCEPT)

Apple Watch / Wear OS extension:
- **Haptic buzz** when a prediction window opens — fan can feel the moment without looking at their phone
- **Tap YES/NO** directly on the watch face — two big buttons, no scrolling
- **Win streak vibration patterns** — a special haptic sequence when you hit 3, 5, 10 correct in a row
- **Glanceable stats:** Current XP, rank, and match score on the watch face complication
- **Heart rate challenges:** "Your heart rate spiked at 142 BPM during that goal — earn +10 bonus XP for genuine excitement!"
- **Cross-device sync via Cognito:** Same fan identity on phone, watch, and stadium screen

---

## 3. Fan Journey: Beyond the 90 Minutes

### Pre-Match (hours before kickoff)
- Predict first scorer (+50 XP)
- Predict final result (+30 XP)
- View team lineups
- Review your weekly league standings
- Receive push notification: "Match starts in 1 hour — lock in your predictions!"

### Live Match (90 minutes)
- Real-time event feed
- Prediction windows on shots, penalties, free kicks, corners
- XP awards on correct predictions
- Win streak tracking (3+ = fire icon)
- AI commentary personalized to your persona
- Live leaderboard competition
- Crowd reactions (emoji waves)

### Half-Time (15 minutes)
- AI-generated half-time summary
- Score snapshot
- 4-stat performance grid (XP, accuracy, rank, correct picks)
- Leaderboard snapshot
- "Second half prediction challenge" teaser

### Post-Match (immediate)
- Full-time banner with final score
- Pre-match prediction resolution (scorer + result)
- Performance report card
- Weekly league standings
- "Challenge a friend" share link

### Mid-Week (between matchdays)
- Streak protection: "Don't break your 5-game streak — next matchday is Saturday!"
- Comeback challenges: "Score 3 correct in a row to earn +200 bonus XP"
- Squad builder: Unlock player slots by leveling up
- Countdown to next match
- Training challenges: Historical match quizzes, stat puzzles
- Social: See friends' recent activity, send challenges

### Seasonal (long-term retention)
- Seasonal leagues with reset + rewards
- Tier progression across the season (ROOKIE → APEX journey)
- Achievement hunting (12 unlockable badges)
- All-time stats and career record
- Exclusive content for high-tier fans

---

## 4. Cross-Platform Identity Architecture

```
                    ┌─────────────────────────┐
                    │    Amazon Cognito        │
                    │    User Pool             │
                    │    (Federated Identity)  │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                     │
     ┌──────┴──────┐    ┌───────┴───────┐    ┌───────┴───────┐
     │  Mobile Web  │    │  Stadium Mode  │    │   Wearable    │
     │  (Browser)   │    │  (Big Screen)  │    │  (Watch App)  │
     └──────┬──────┘    └───────┬───────┘    └───────┬───────┘
            │                    │                     │
            └────────────────────┼────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    API Gateway           │
                    │    WebSocket API         │
                    │    (shared session)      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │    DynamoDB              │
                    │    Players Table         │
                    │    (single source of     │
                    │     truth for XP, tier,  │
                    │     predictions, streak) │
                    └─────────────────────────┘
```

Every touchpoint resolves to the same `playerId` in DynamoDB. XP earned on the watch counts on the phone. The stadium screen shows the same leaderboard the phone sees. One fan, one identity, everywhere.

---

## 5. AWS Services in the North Star

| Service | Current Use | North Star Extension |
|---|---|---|
| API Gateway WebSocket | Fan connections | Multi-device sessions per identity |
| Lambda | Business logic | Wearable-specific handlers |
| DynamoDB | Player data | Cross-device session merge |
| Bedrock | AI commentary | AR narration, wearable summaries |
| Cognito | Guest + OAuth | Federated identity across all devices |
| SNS | — | Push notifications (mobile + wearable) |
| SES | — | Post-match email summaries |
| IoT Core | — | Wearable WebSocket via MQTT |
| Location Service | — | Stadium section detection for AR |
| Rekognition | — | Camera-based player identification for AR overlays |

---

## 6. Summary

Connected Arena today is a fully functional real-time multiplayer platform with mobile, stadium screen, and watch party modes. Our north star extends this into AR stadium experiences, wearable companions, and a persistent cross-device identity — transforming every fan moment into a connected, rewarding experience that extends far beyond the 90 minutes.
