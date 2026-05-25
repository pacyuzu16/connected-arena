# 🎬 Connected Arena — 3-Minute Demo Video Script

**Target:** ≤ 3 minutes · ≤ 720p (per Challenge 4 brief) · `.mp4`
**Recording tool:** OBS, Loom, or built-in Win+G (Game Bar)
**Audio:** clear voice, no background music (judges need to hear you)

---

## 🪟 Pre-flight setup (before you hit record)

1. **Browser window A** (fan view) — `https://d1706ex99mjina.cloudfront.net/`
2. **Browser window B** (admin, already signed in) — `https://d1706ex99mjina.cloudfront.net/admin`
3. **Browser window C** (stadium / watch-party) — `https://d1706ex99mjina.cloudfront.net/stadium`
4. **Terminal** sitting in `scripts/` with the command **typed but not yet run**:
   ```powershell
   python emit_events.py --speedup 60
   ```
5. **Pre-run** `python demo_reset.py` so the scoreboard starts at 0-0

---

## 🎯 The 3-minute cut (talk track + cues)

### **0:00 – 0:20 · Hook + landing** *(20 s)*

**Show:** the landing page (`/`)

> "Hi, I'm [name]. This is **Connected Arena** — a real-time platform that turns watching football into something you actually play."
>
> "Built for the AWS Sports AI Innovation Cup — Challenge 4 — real-time multiplayer fan engagement."

*(Scroll the landing slowly so the features grid and the stadium tiles flash by.)*

---

### **0:20 – 0:35 · Pick a stadium** *(15 s)*

**Show:** click "Stadiums" in the top nav → `/venues`

> "Fans walk in by picking a stadium — or scanning a QR at the actual gate. Each venue is its own gateway into the live match."

*(Click on **Försterei** or **Yellow Wall** — the two LIVE ones.)*

---

### **0:35 – 0:50 · Sign in & enter the arena** *(15 s)*

**Show:** `/venues/FORSTEREI` → "Enter the stadium" → quick sign-in → arena loads

> "Sign up with email, or jump in as a guest. Pick your persona — casual, hyped, or stats nerd — and that flavours the AI commentary you'll get on every goal."

---

### **0:50 – 2:00 · THE BIG MOMENT — run a live match** *(70 s)*

**Switch focus** to the terminal — hit **Enter** on the `emit_events.py` command.

> "I'm starting a live Bundesliga match replay. Speed-up 60 means a 90-minute game compressed to 90 seconds — perfect for a demo."

*(Pause 5–8 s to let the first events fire. Watch for a SHOT or PENALTY.)*

**Switch to the fan browser** when a prediction pop-up appears.

> "A shot just fired. I get 10 seconds to predict whether it'll be a goal."
>
> "The bar at the bottom is our ML model — trained on **fifty-seven thousand professional shots** — telling me this one has a thirty-four percent chance."
>
> "Low-probability picks pay triple XP, so I'm going YES."

*(Tap YES. Wait for resolution. When a goal hits, the orange XP flash fires.)*

> "Goal! Look at the AI commentary that slides up — every fan gets a personalised reaction. Mine matches my persona."

**Quick cut to Window C (stadium view)** when the next goal hits:

> "Same moment on the watch-party screen — the big-screen mode for TVs and projectors."

---

### **2:00 – 2:30 · Multiplayer + admin** *(30 s)*

**Switch to Window B (admin):**

> "On the admin side — live KPIs, charts, every connected fan, suspend / unsuspend, ML insights. All updating real-time as the match plays out."

**Click User Management** — point at the list growing.

> "An admin can moderate chat and keep the experience clean."

---

### **2:30 – 2:55 · Squads + chat** *(25 s)*

**Back to the fan browser** — open the Chat tab.

> "Friends? Create a squad in two seconds — share a six-character code — compete on your own private leaderboard. The chat is persistent, so users who join late see the history."

*(Send a quick chat message live. If time, hint at the daily missions card.)*

---

### **2:55 – 3:00 · Outro** *(5 s)*

**Show:** landing page or the Stadiums grid as your final frame.

> "Real-time. Multiplayer. AI-personalised. ML-powered. Open it on a phone, project it in a stadium. **Connected Arena.**"

---

## 📋 Pre-flight checklist

- [ ] `python demo_reset.py` ran — scoreboard at 0-0
- [ ] Admin already signed in (no time to type creds on camera)
- [ ] Fan signed in with name + persona (**"Hyped"** for the most screen-worthy AI commentary)
- [ ] Two browser windows arranged side-by-side or quick-switch reach
- [ ] Terminal in `scripts/` with `python emit_events.py --speedup 60` pre-typed
- [ ] Mic test — 5 s recording, play back, voice clear
- [ ] Resolution set to **720p or lower** (brief requires <720p — 720p = OK)
- [ ] File saved as **`presentation_video.mp4`** (exact name per brief)

## 🛟 If something breaks on camera

| Issue | Fix |
|---|---|
| No events firing | Re-run `python demo_reset.py && python emit_events.py --speedup 60` |
| Old UI showing | `Ctrl+Shift+R` to hard refresh |
| Prediction window doesn't appear | Wait — shots fire every 10-15 s at speedup 60 |
| AI commentary missing | Falls back to templates silently — don't dwell on it |

## 🎬 Recording tips

- **Don't read line-by-line** — internalise, riff naturally. Sounds way more confident.
- **Cursor movement matters** — slow, deliberate. No flailing.
- **Talk at the screen** — you're showing a product, not pitching to a person.
- **First take is rarely the keeper** — do 2-3 takes, stitch the best chunks (free editors: DaVinci Resolve, CapCut, Shotcut).
- **Background noise** — close the door, turn off notifications (Win: Focus Assist).

---

## 🧰 Quick recording options

**OBS — minimal scene:**
1. Sources: Display Capture + Audio Input Capture
2. Output → Recording → MP4 → 1280×720 (or 854×480 for safety margin)
3. "Start Recording" → demo → "Stop Recording"

**Windows Game Bar:**
1. `Win+G` → record button → demo
2. Saves to `Videos/Captures/`

**Loom (browser, free up to 3 min):**
1. loom.com → New Recording → Screen + Camera + Mic
2. Download as MP4

---

## ✂️ If your first cut is over 3 minutes

Cut these in order until under 3:00:
1. **Squads + chat section (2:30–2:55)** — save it for the executive summary slides
2. **The "stadium view" cut at 1:55** — only if slow to load
3. **Shorten 0:00–0:20** to a single tight sentence

**Don't cut:** the live match run (0:50–2:00). That IS the demo.

---

*Last updated: ready for final submission*
