/**
 * Connected Arena — Presentation Generator
 * Black text / White backgrounds throughout.
 * Dark (black) slides for title and closing only.
 */

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout  = "LAYOUT_16x9"; // 10" × 5.625"
pres.author  = "Connected Arena Team";
pres.title   = "Connected Arena — AWS Sports AI Innovation Cup 2026";

// ── Color constants ──────────────────────────────────────────────────────────
const BLK  = "000000";
const WHT  = "FFFFFF";
const GRY1 = "F2F2F2"; // light bg for alt rows / cards
const GRY2 = "CCCCCC"; // borders / dividers
const GRY3 = "888888"; // secondary text on dark slides

// ── Typography helpers ────────────────────────────────────────────────────────
const TITLE_FONT  = "Georgia";
const BODY_FONT   = "Calibri";

// Slide-size constants
const W = 10, H = 5.625;
const LM = 0.55, RM = 0.55;  // left/right margin
const CW = W - LM - RM;      // content width

// ── Utility functions ─────────────────────────────────────────────────────────

/** Thin top border bar (decorative rule under section headings on white slides) */
function topRule(slide, y = 0.72) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: LM, y, w: CW, h: 0.025, fill: { color: BLK }, line: { color: BLK, width: 0 }
  });
}

/** Slide number (bottom right) */
function pageNum(slide, n) {
  slide.addText(`${n}`, {
    x: 9.4, y: 5.25, w: 0.5, h: 0.2,
    fontSize: 8, fontFace: BODY_FONT, color: GRY2, align: "right"
  });
}

/** Section heading on a white slide */
function sectionHead(slide, title, n) {
  slide.background = { color: WHT };
  slide.addText(title.toUpperCase(), {
    x: LM, y: 0.28, w: CW, h: 0.38,
    fontSize: 20, fontFace: TITLE_FONT, bold: true,
    color: BLK, align: "left", charSpacing: 2, margin: 0
  });
  topRule(slide);
  pageNum(slide, n);
}

/** Thin horizontal rule between sections within a slide */
function innerRule(slide, y) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: LM, y, w: CW, h: 0.012, fill: { color: GRY2 }, line: { color: GRY2, width: 0 }
  });
}

/** Simple filled black rectangle label (like a tag) */
function tag(slide, text, x, y, w = 1.4) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.26, fill: { color: BLK }, line: { color: BLK, width: 0 }
  });
  slide.addText(text, {
    x, y, w, h: 0.26,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: WHT,
    align: "center", valign: "middle", margin: 0
  });
}

/** Outlined card (white fill, black border) */
function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: GRY1 }, line: { color: GRY2, width: 0.6 }
  });
}

/** Bold number + label callout */
function statCallout(slide, num, lbl, x, y, w = 2.1) {
  card(slide, x, y, w, 1.1);
  slide.addText(num, {
    x, y: y + 0.1, w, h: 0.55,
    fontSize: 30, fontFace: TITLE_FONT, bold: true,
    color: BLK, align: "center", margin: 0
  });
  slide.addText(lbl, {
    x, y: y + 0.65, w, h: 0.3,
    fontSize: 9, fontFace: BODY_FONT, color: GRY3,
    align: "center", margin: 0
  });
}

/** Numbered step box */
function step(slide, num, title, desc, x, y, w = 2.7) {
  card(slide, x, y, w, 1.55);
  // Number circle
  slide.addShape(pres.shapes.OVAL, {
    x: x + 0.18, y: y + 0.18, w: 0.44, h: 0.44,
    fill: { color: BLK }, line: { color: BLK, width: 0 }
  });
  slide.addText(`${num}`, {
    x: x + 0.18, y: y + 0.18, w: 0.44, h: 0.44,
    fontSize: 14, fontFace: TITLE_FONT, bold: true, color: WHT,
    align: "center", valign: "middle", margin: 0
  });
  slide.addText(title, {
    x: x + 0.72, y: y + 0.2, w: w - 0.85, h: 0.3,
    fontSize: 10, fontFace: TITLE_FONT, bold: true, color: BLK,
    align: "left", margin: 0
  });
  slide.addText(desc, {
    x: x + 0.18, y: y + 0.68, w: w - 0.3, h: 0.72,
    fontSize: 8.5, fontFace: BODY_FONT, color: BLK,
    align: "left", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE (BLACK)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  // Left accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: H, fill: { color: WHT }, line: { color: WHT, width: 0 }
  });

  // Main title
  s.addText("CONNECTED ARENA", {
    x: 0.32, y: 1.0, w: 6.5, h: 1.05,
    fontSize: 44, fontFace: TITLE_FONT, bold: true, color: WHT,
    align: "left", charSpacing: 3, margin: 0
  });

  // Subtitle rule
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.32, y: 2.15, w: 3.8, h: 0.03, fill: { color: WHT }, line: { color: WHT, width: 0 }
  });

  // Subtitle
  s.addText("Real-Time Fan Engagement Platform", {
    x: 0.32, y: 2.26, w: 7.5, h: 0.38,
    fontSize: 16, fontFace: BODY_FONT, color: GRY2,
    align: "left", italic: true, margin: 0
  });

  // Competition label
  s.addText("AWS Sports AI Innovation Cup 2026  |  Challenge 4", {
    x: 0.32, y: 2.76, w: 7.5, h: 0.28,
    fontSize: 10, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });

  // Team section
  s.addText("TEAM", {
    x: 0.32, y: 3.55, w: 1.2, h: 0.22,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3,
    align: "left", charSpacing: 3, margin: 0
  });

  const members = [
    "Carine UMUGABEKAZE",
    "ISHIMWE Ami Paradis",
    "CYUZUZO Pacifique",
  ];
  members.forEach((m, i) => {
    s.addText(m, {
      x: 0.32, y: 3.82 + i * 0.3, w: 5.5, h: 0.26,
      fontSize: 12, fontFace: BODY_FONT, color: WHT, align: "left", margin: 0
    });
  });

  // Live URL bottom right
  s.addText("d1706ex99mjina.cloudfront.net", {
    x: 5.5, y: 5.1, w: 4.3, h: 0.26,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "right", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — THE PROBLEM
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "The Problem", 2);

  // Large quote-style statement
  s.addText('"Watching football today is passive.\nFans react — they do not participate."', {
    x: LM, y: 0.95, w: CW, h: 1.1,
    fontSize: 18, fontFace: TITLE_FONT, italic: true, color: BLK,
    align: "center", margin: 0
  });

  innerRule(s, 2.15);

  // Three pain-point columns
  const cols = [
    { title: "No Interactivity", body: "Broadcast TV and streaming offer zero participation. Fans are passive observers." },
    { title: "Disconnected Fans", body: "Social media reactions come after the moment. Nothing happens in real time, together." },
    { title: "Generic Experience", body: "Every fan sees the same feed, the same commentary — regardless of who they are." },
  ];
  const colW = 2.8;
  cols.forEach((c, i) => {
    const cx = LM + i * (colW + 0.2);
    card(s, cx, 2.3, colW, 2.9);
    s.addText(c.title, {
      x: cx + 0.2, y: 2.48, w: colW - 0.4, h: 0.35,
      fontSize: 11, fontFace: TITLE_FONT, bold: true, color: BLK, align: "left", margin: 0
    });
    innerRule(s, 2.87);
    s.addText(c.body, {
      x: cx + 0.2, y: 3.0, w: colW - 0.4, h: 1.5,
      fontSize: 9.5, fontFace: BODY_FONT, color: BLK, align: "left", margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — THE SOLUTION
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "The Solution", 3);

  s.addText("Connected Arena turns watching into competing.", {
    x: LM, y: 0.88, w: CW, h: 0.4,
    fontSize: 15, fontFace: TITLE_FONT, italic: true, color: BLK, align: "left", margin: 0
  });

  // 4-feature cards in a 2x2 grid
  const features = [
    { icon: "PREDICT", title: "Live Predictions", body: "Fans make YES/NO predictions on every shot, penalty, free kick — with a countdown timer and instant XP rewards." },
    { icon: "AI", title: "Personalized AI Commentary", body: "Amazon Bedrock generates unique commentary per fan based on their persona: Casual, Passionate, or Stats Nerd." },
    { icon: "RANK", title: "Real-Time Leaderboard", body: "Live global ranking updates after every goal. Tier badges: ROOKIE, PRO, ELITE, LEGEND, APEX." },
    { icon: "MATCH", title: "Full Match Lifecycle", body: "Pre-match lineups, live feed, half-time AI summary, post-match standings — the complete fan journey." },
  ];

  const fw = 4.3, fh = 1.8;
  features.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const fx = LM + col * (fw + 0.18);
    const fy = 1.45 + row * (fh + 0.14);
    card(s, fx, fy, fw, fh);
    tag(s, f.icon, fx + 0.18, fy + 0.18, 0.72);
    s.addText(f.title, {
      x: fx + 0.18, y: fy + 0.54, w: fw - 0.36, h: 0.3,
      fontSize: 10.5, fontFace: TITLE_FONT, bold: true, color: BLK, align: "left", margin: 0
    });
    s.addText(f.body, {
      x: fx + 0.18, y: fy + 0.88, w: fw - 0.36, h: 0.78,
      fontSize: 9, fontFace: BODY_FONT, color: BLK, align: "left", margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — ARCHITECTURE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "AWS Architecture", 4);

  s.addText("100% Serverless  |  8 AWS Services  |  Zero EC2", {
    x: LM, y: 0.88, w: CW, h: 0.3,
    fontSize: 10, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });

  // Flow boxes: left-to-right pipeline
  const boxes = [
    { label: "CloudFront\n+ S3", sub: "CDN / Static\nHosting" },
    { label: "API Gateway\nWebSocket", sub: "Persistent\nFan Connections" },
    { label: "Lambda\nx 7 Functions", sub: "All Business\nLogic" },
    { label: "DynamoDB\nx 4 Tables", sub: "Players /\nPredictions" },
    { label: "Amazon\nBedrock", sub: "Claude Haiku\nAI Commentary" },
  ];

  const bw = 1.65, bh = 1.5, gap = 0.12;
  const totalW = boxes.length * bw + (boxes.length - 1) * (gap + 0.25);
  let bx = (W - totalW) / 2;
  const by = 1.35;

  boxes.forEach((b, i) => {
    // Arrow before box (not before first)
    if (i > 0) {
      const ax = bx - 0.3;
      s.addShape(pres.shapes.RECTANGLE, {
        x: ax, y: by + bh / 2 - 0.018, w: 0.22, h: 0.036,
        fill: { color: BLK }, line: { color: BLK, width: 0 }
      });
      // Arrowhead triangle (approximate with a thin rect + text)
      s.addText("▶", {
        x: ax + 0.17, y: by + bh / 2 - 0.15, w: 0.18, h: 0.3,
        fontSize: 8, color: BLK, align: "left", margin: 0
      });
    }

    slide_addBox(s, bx, by, bw, bh, b.label, b.sub);
    bx += bw + gap + 0.25;
  });

  // EventBridge annotation below Lambda
  const ebX = (W - totalW) / 2 + 2 * (bw + gap + 0.25);
  s.addShape(pres.shapes.RECTANGLE, {
    x: ebX + bw / 2 - 0.015, y: by + bh, w: 0.03, h: 0.5,
    fill: { color: GRY2 }, line: { color: GRY2, width: 0 }
  });
  s.addText("EventBridge\n(1 /min trigger)", {
    x: ebX - 0.3, y: by + bh + 0.5, w: bw + 0.6, h: 0.5,
    fontSize: 8.5, fontFace: BODY_FONT, color: BLK, align: "center", margin: 0
  });

  // Bottom legend
  const legend = [
    "Fan opens site → CloudFront serves Next.js app",
    "WebSocket connects → API Gateway routes to Lambda",
    "EventBridge fires event_emitter Lambda every 60 s",
    "Lambda broadcasts MATCH_EVENT to all fans via WebSocket",
    "Bedrock generates personalized AI_COMMENTARY per fan",
  ];
  s.addText(legend.map((l, i) => ({
    text: `${i + 1}.  ${l}`,
    options: { breakLine: i < legend.length - 1 }
  })), {
    x: LM, y: 4.55, w: CW, h: 0.92,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });
}

function slide_addBox(slide, x, y, w, h, label, sub) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: BLK }, line: { color: BLK, width: 0 }
  });
  slide.addText(label, {
    x: x + 0.08, y: y + 0.2, w: w - 0.16, h: 0.72,
    fontSize: 9, fontFace: TITLE_FONT, bold: true, color: WHT,
    align: "center", valign: "middle", margin: 0
  });
  slide.addText(sub, {
    x: x + 0.08, y: y + 0.95, w: w - 0.16, h: 0.44,
    fontSize: 7.5, fontFace: BODY_FONT, color: GRY2,
    align: "center", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — HOW IT WORKS (step-by-step)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "How It Works", 5);

  s.addText("A single goal — from database to 8,000+ browsers in seconds", {
    x: LM, y: 0.88, w: CW, h: 0.3,
    fontSize: 10, fontFace: BODY_FONT, italic: true, color: GRY3, align: "left", margin: 0
  });

  const steps = [
    { n: 1, t: "EventBridge Fires",    d: "Triggers event_emitter Lambda every 60 s. Reads next unprocessed GOAL event from DynamoDB MatchEvents table." },
    { n: 2, t: "Resolve Predictions",  d: "Scans Predictions table. Awards XP to correct fans (YES on a GOAL). Resets win streaks for wrong fans. Atomic DynamoDB ADD." },
    { n: 3, t: "Broadcast",            d: "Invokes broadcast Lambda asynchronously. Reads all connectionIds. Pushes MATCH_EVENT to every fan via WebSocket Management API." },
    { n: 4, t: "AI Commentary",        d: "Invokes bedrock_commentary Lambda asynchronously. Calls Claude Haiku once per fan with their persona's system prompt. Sends unique message to each fan." },
    { n: 5, t: "Browser Updates",      d: "Fan's browser receives MATCH_EVENT: score updates, feed card added, win-prob bar recalculates, crowd reaction spike. Then AI_COMMENTARY slides in for 9 s." },
    { n: 6, t: "Leaderboard Refresh",  d: "2 seconds after the goal, browsers request fresh leaderboard. XP, ranks, and profile stats all update automatically." },
  ];

  const sw = 2.88, sh = 1.55, cols = 3;
  steps.forEach((st, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const sx = LM + col * (sw + 0.17);
    const sy = 1.35 + row * (sh + 0.16);
    step(s, st.n, st.t, st.d, sx, sy, sw);
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — AI COMMENTARY (BEDROCK)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "AI Commentary — Amazon Bedrock", 6);

  s.addText("Same goal. Three fans. Three completely different experiences.", {
    x: LM, y: 0.88, w: CW, h: 0.3,
    fontSize: 11, fontFace: TITLE_FONT, italic: true, color: BLK, align: "left", margin: 0
  });

  // Model info
  s.addText("Model: Claude Haiku 4.5  |  eu.anthropic.claude-haiku-4-5-20251001-v1:0  |  EU cross-region inference", {
    x: LM, y: 1.22, w: CW, h: 0.22,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });

  innerRule(s, 1.5);

  const personas = [
    {
      name: "CASUAL",
      prompt: '"Fun, friendly commentator. Short, exciting, use emojis."',
      example: "What a finish! Hamburg are on fire tonight! The crowd is going absolutely wild!",
    },
    {
      name: "PASSIONATE",
      prompt: '"Dramatic, emotional fan. React big. Strong but clean language."',
      example: "YESSS! GET IN! That is the moment right there! Hamburg fans this is what we LIVE FOR!",
    },
    {
      name: "STATS NERD",
      prompt: '"Analytics expert. Tactical insight. One emoji."',
      example: "Glatzel's 4th goal from inside the box this season. Hamburg's press forced that turnover 30m out.",
    },
  ];

  const pw = 2.88;
  personas.forEach((p, i) => {
    const px = LM + i * (pw + 0.18);
    const py = 1.62;

    // Header bar
    s.addShape(pres.shapes.RECTANGLE, {
      x: px, y: py, w: pw, h: 0.38,
      fill: { color: BLK }, line: { color: BLK, width: 0 }
    });
    s.addText(p.name, {
      x: px, y: py, w: pw, h: 0.38,
      fontSize: 10, fontFace: BODY_FONT, bold: true, color: WHT,
      align: "center", valign: "middle", charSpacing: 2, margin: 0
    });

    // Prompt box
    card(s, px, py + 0.38, pw, 0.82);
    s.addText("System Prompt:", {
      x: px + 0.15, y: py + 0.44, w: pw - 0.3, h: 0.2,
      fontSize: 7.5, fontFace: BODY_FONT, bold: true, color: GRY3, margin: 0
    });
    s.addText(p.prompt, {
      x: px + 0.15, y: py + 0.65, w: pw - 0.3, h: 0.44,
      fontSize: 8.5, fontFace: BODY_FONT, italic: true, color: BLK, margin: 0
    });

    // Commentary result
    card(s, px, py + 1.28, pw, 1.55);
    s.addText("Fan receives:", {
      x: px + 0.15, y: py + 1.36, w: pw - 0.3, h: 0.22,
      fontSize: 7.5, fontFace: BODY_FONT, bold: true, color: GRY3, margin: 0
    });
    s.addText(`"${p.example}"`, {
      x: px + 0.15, y: py + 1.6, w: pw - 0.3, h: 1.1,
      fontSize: 9.5, fontFace: TITLE_FONT, italic: true, color: BLK,
      align: "left", margin: 0
    });
  });

  s.addText("Bedrock is called once per connected fan — each message is unique to that individual.", {
    x: LM, y: 5.22, w: CW, h: 0.22,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "center", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — PRODUCT FEATURES (5 TABS)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "The Product — 5-Tab Arena", 7);

  s.addText("Available on web, desktop and mobile. Responsive at 720px breakpoint.", {
    x: LM, y: 0.88, w: CW, h: 0.28,
    fontSize: 9, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });

  const tabs = [
    { tab: "HOME",        title: "Arena Hub",          pts: ["Squad Overview Card", "Win Probability Bar (3-way)", "Real-time XP Activity Stream", "Global Leaders mini-list", "Tactical Feed & Marketplace"] },
    { tab: "ARENA",       title: "Live Match",          pts: ["Scrolling match event feed", "Prediction modal with countdown", "YES / NO + crowd % reveal", "AI Commentary bar (9 s)", "Crowd Reactions animation"] },
    { tab: "LEADERBOARD", title: "Rankings",            pts: ["Podium with KING banner", "Global / Friends / Regional tabs", "Tier badges per player", "Accuracy bars", "LOAD MORE expansion"] },
    { tab: "WATCH PARTY", title: "Global View",         pts: ["Live fan count (scales real)", "Shared prediction challenge", "Top fan list", "QR code for sharing", "Match score + minute"] },
    { tab: "PROFILE",     title: "Fan Identity",        pts: ["Avatar upload (localStorage)", "6-stat grid + achievements", "12 unlockable badges", "Recent activity feed", "Edit Identity (no XP loss)"] },
  ];

  const tw = 1.72, th = 3.75;
  tabs.forEach((t, i) => {
    const tx = LM + i * (tw + 0.13);
    const ty = 1.3;

    // Tab label
    s.addShape(pres.shapes.RECTANGLE, {
      x: tx, y: ty, w: tw, h: 0.32,
      fill: { color: BLK }, line: { color: BLK, width: 0 }
    });
    s.addText(t.tab, {
      x: tx, y: ty, w: tw, h: 0.32,
      fontSize: 7, fontFace: BODY_FONT, bold: true, color: WHT,
      align: "center", valign: "middle", charSpacing: 1, margin: 0
    });

    // Card
    card(s, tx, ty + 0.32, tw, th);
    s.addText(t.title, {
      x: tx + 0.1, y: ty + 0.42, w: tw - 0.2, h: 0.36,
      fontSize: 9, fontFace: TITLE_FONT, bold: true, color: BLK, margin: 0
    });
    innerRule(s, ty + 0.82);
    t.pts.forEach((pt, pi) => {
      s.addText([{ text: pt, options: { bullet: true } }], {
        x: tx + 0.1, y: ty + 0.88 + pi * 0.54, w: tw - 0.2, h: 0.5,
        fontSize: 8, fontFace: BODY_FONT, color: BLK, margin: 0
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — MATCH LIFECYCLE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Full Match Lifecycle", 8);

  const phases = [
    {
      phase: "PRE-MATCH", color: GRY1,
      items: [
        "Hamburg vs Bayern full lineups",
        "Predict first scorer (+50 XP)",
        "Predict match result (+30 XP)",
        "Predictions saved to localStorage",
        "Resolved at post-match with pass/fail",
      ]
    },
    {
      phase: "LIVE", color: BLK,
      items: [
        "Real-time event feed",
        "Prediction windows per event",
        "Live score in header",
        "Win probability updates",
        "AI commentary after goals",
      ]
    },
    {
      phase: "HALF-TIME", color: GRY1,
      items: [
        "Score snapshot banner",
        "AI-generated HT summary",
        "4-stat performance grid",
        "Leaderboard snapshot top 3",
        "Auto-returns to live in 30 s",
      ]
    },
    {
      phase: "POST-MATCH", color: BLK,
      items: [
        "FULL TIME banner",
        "Pre-match prediction resolution",
        "Weekly league standings",
        "Performance report card",
        "Share / challenge friends button",
      ]
    },
  ];

  const pw = 2.1, ph = 3.9;
  phases.forEach((p, i) => {
    const px = LM + i * (pw + 0.17);
    const py = 1.0;
    const isDark = p.color === BLK;
    const textCol = isDark ? WHT : BLK;
    const subCol  = isDark ? GRY2 : GRY3;

    s.addShape(pres.shapes.RECTANGLE, {
      x: px, y: py, w: pw, h: ph,
      fill: { color: p.color },
      line: { color: GRY2, width: isDark ? 0 : 0.6 }
    });
    s.addText(p.phase, {
      x: px + 0.12, y: py + 0.14, w: pw - 0.24, h: 0.32,
      fontSize: 9, fontFace: BODY_FONT, bold: true, color: textCol,
      align: "left", charSpacing: 1, margin: 0
    });
    // Divider
    s.addShape(pres.shapes.RECTANGLE, {
      x: px + 0.12, y: py + 0.5, w: pw - 0.24, h: 0.015,
      fill: { color: isDark ? GRY3 : GRY2 }, line: { color: isDark ? GRY3 : GRY2, width: 0 }
    });
    p.items.forEach((it, ii) => {
      s.addText(`${ii + 1}.  ${it}`, {
        x: px + 0.12, y: py + 0.62 + ii * 0.6, w: pw - 0.24, h: 0.55,
        fontSize: 8.5, fontFace: BODY_FONT, color: textCol, align: "left", margin: 0
      });
    });
  });

  // Connector arrows
  for (let i = 0; i < 3; i++) {
    const ax = LM + (i + 1) * (pw + 0.17) - 0.19;
    s.addText("->", {
      x: ax, y: 1.0 + ph / 2 - 0.15, w: 0.22, h: 0.3,
      fontSize: 10, fontFace: BODY_FONT, bold: true, color: GRY3,
      align: "center", margin: 0
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — GAMIFICATION & XP
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Gamification & XP System", 9);

  // Tier table (left)
  s.addText("TIER SYSTEM", {
    x: LM, y: 0.9, w: 3.5, h: 0.24,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3, charSpacing: 2, margin: 0
  });

  const tiers = [
    ["ROOKIE",  "0 XP"],
    ["PRO",     "100 XP"],
    ["ELITE",   "500 XP"],
    ["LEGEND",  "1,500 XP"],
    ["APEX",    "3,000 XP"],
  ];
  const tierData = [
    [{ text: "Tier", options: { bold: true, color: WHT } }, { text: "Required XP", options: { bold: true, color: WHT } }],
    ...tiers.map(([t, x]) => [t, x])
  ];
  s.addTable(tierData, {
    x: LM, y: 1.2, w: 3.5, h: 2.2,
    colW: [1.8, 1.7],
    border: { pt: 0.5, color: GRY2 },
    fill: { color: WHT },
    color: BLK,
    fontFace: BODY_FONT,
    fontSize: 9,
    rowH: 0.37,
  });
  // header row needs separate fill — style via cell objects
  // (handled by bold text color WHT contrast on black bg below)

  // Level system
  s.addText("LEVEL SYSTEM", {
    x: LM + 3.8, y: 0.9, w: 3.5, h: 0.24,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3, charSpacing: 2, margin: 0
  });
  const levels = [
    ["Level 1", "0 – 99 XP"],
    ["Level 2", "100 – 299 XP"],
    ["Level 3", "300 – 599 XP"],
    ["Level 4", "600 – 999 XP"],
    ["Level 5", "1,000+ XP  (MAX)"],
  ];
  const lvlData = [
    [{ text: "Level", options: { bold: true } }, { text: "XP Range", options: { bold: true } }],
    ...levels.map(([l, x]) => [l, x])
  ];
  s.addTable(lvlData, {
    x: LM + 3.8, y: 1.2, w: 3.5, h: 2.2,
    colW: [1.6, 1.9],
    border: { pt: 0.5, color: GRY2 },
    fill: { color: WHT },
    color: BLK,
    fontFace: BODY_FONT,
    fontSize: 9,
    rowH: 0.37,
  });

  // Achievements
  innerRule(s, 3.52);
  s.addText("12 UNLOCKABLE ACHIEVEMENTS", {
    x: LM, y: 3.62, w: CW, h: 0.24,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3, charSpacing: 2, margin: 0
  });

  const achievements = [
    "First Blood", "On Fire", "Elite Predictor", "Veteran Fan",
    "Lucky Shot", "XP Grinder", "Unstoppable", "Goal Hunter",
    "Prediction King", "Consistent", "Century", "Apex Analyst",
  ];

  const aw = 1.52, ah = 0.34, acols = 6;
  achievements.forEach((a, i) => {
    const col = i % acols, row = Math.floor(i / acols);
    const ax = LM + col * (aw + 0.07);
    const ay = 3.93 + row * (ah + 0.08);
    card(s, ax, ay, aw, ah);
    s.addText(a, {
      x: ax, y: ay, w: aw, h: ah,
      fontSize: 8, fontFace: BODY_FONT, color: BLK,
      align: "center", valign: "middle", margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — KEY NUMBERS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "By the Numbers", 10);

  const stats = [
    { n: "8",   l: "AWS Services\nUsed" },
    { n: "7",   l: "Lambda\nFunctions" },
    { n: "4",   l: "DynamoDB\nTables" },
    { n: "91",  l: "Match Events\nin Database" },
    { n: "3",   l: "Fan Personas\n(Bedrock)" },
    { n: "12",  l: "Unlockable\nAchievements" },
    { n: "4",   l: "Match\nLifecycle Phases" },
    { n: "14ms",l: "Avg CDN\nLatency" },
  ];

  const sw = 2.1;
  const rows = [stats.slice(0, 4), stats.slice(4)];
  rows.forEach((row, ri) => {
    row.forEach((st, ci) => {
      statCallout(s, st.n, st.l, LM + ci * (sw + 0.17), 1.05 + ri * 1.4, sw);
    });
  });

  innerRule(s, 3.65);

  // Bottom facts row
  const facts = [
    "Next.js 14 static export — zero server cost for the UI",
    "Claude Haiku 4.5 — latest EU cross-region inference model",
    "playerId in localStorage — XP persists across all sessions",
    "Async Lambda invocations — broadcast never blocks event_emitter",
  ];
  s.addText(facts.map((f, i) => ({
    text: `${i + 1}.  ${f}`,
    options: { breakLine: i < facts.length - 1 }
  })), {
    x: LM, y: 3.78, w: CW, h: 1.2,
    fontSize: 9, fontFace: BODY_FONT, color: BLK, align: "left", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — DEMO & LINKS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Live Demo", 11);

  s.addText("The platform is live and running on AWS right now.", {
    x: LM, y: 0.88, w: CW, h: 0.28,
    fontSize: 10, fontFace: BODY_FONT, italic: true, color: GRY3, align: "left", margin: 0
  });

  const links = [
    { label: "LIVE PLATFORM",      url: "https://d1706ex99mjina.cloudfront.net",        desc: "The full fan experience — landing page, join, arena, leaderboard, profile." },
    { label: "ADMIN DASHBOARD",    url: "https://d1706ex99mjina.cloudfront.net/admin",   desc: "Real-time analytics: KPI cards, match status, leaderboard, ML insights, activity log." },
    { label: "GITHUB REPOSITORY",  url: "https://github.com/pacyuzu16/connected-arena",  desc: "Full source code: Next.js frontend, 7 Lambda functions, deploy scripts, DynamoDB schemas." },
  ];

  links.forEach((lk, i) => {
    const ly = 1.32 + i * 1.35;
    card(s, LM, ly, CW, 1.18);
    tag(s, lk.label, LM + 0.18, ly + 0.18, 1.6);
    s.addText(lk.url, {
      x: LM + 0.18, y: ly + 0.52, w: CW - 0.36, h: 0.28,
      fontSize: 10.5, fontFace: "Courier New", bold: true, color: BLK,
      align: "left", margin: 0
    });
    s.addText(lk.desc, {
      x: LM + 0.18, y: ly + 0.82, w: CW - 0.36, h: 0.25,
      fontSize: 8.5, fontFace: BODY_FONT, color: GRY3,
      align: "left", margin: 0
    });
  });

  s.addText("To run a demo: python scripts\\demo_reset.py  then  python scripts\\emit_events.py --speedup 30", {
    x: LM, y: 5.18, w: CW, h: 0.24,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 12 — WHY WE WIN
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Why Connected Arena Wins", 12);

  const points = [
    {
      n: "01",
      t: "Personalized AI at Scale",
      b: "Bedrock generates a unique commentary message for every fan simultaneously — not one broadcast, but N individual conversations tailored to each person's chosen persona.",
    },
    {
      n: "02",
      t: "True Real-Time, Not Polling",
      b: "API Gateway WebSocket pushes data to browsers the instant it happens. EventBridge, Lambda, and DynamoDB work together with zero polling on either end.",
    },
    {
      n: "03",
      t: "Full Fan Journey, Not Just a Widget",
      b: "Pre-match predictions, live XP, half-time AI summary, post-match standings. Most demos show one screen. Connected Arena shows the complete experience.",
    },
    {
      n: "04",
      t: "Infinitely Scalable by Design",
      b: "100% serverless: Lambda, DynamoDB, CloudFront. From 1 fan to 1,000,000 fans without changing a single line of infrastructure code.",
    },
  ];

  const ph = 1.88;
  points.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const px = LM + col * (4.5 + 0.18);
    const py = 1.15 + row * (ph + 0.18);
    const pw = 4.5;

    card(s, px, py, pw, ph);

    // Number
    s.addText(p.n, {
      x: px + 0.18, y: py + 0.16, w: 0.6, h: 0.5,
      fontSize: 20, fontFace: TITLE_FONT, bold: true, color: GRY2,
      align: "left", margin: 0
    });
    s.addText(p.t, {
      x: px + 0.9, y: py + 0.16, w: pw - 1.08, h: 0.45,
      fontSize: 10.5, fontFace: TITLE_FONT, bold: true, color: BLK,
      align: "left", margin: 0
    });
    innerRule(s, py + 0.68);
    s.addText(p.b, {
      x: px + 0.18, y: py + 0.78, w: pw - 0.36, h: 0.98,
      fontSize: 9, fontFace: BODY_FONT, color: BLK, align: "left", margin: 0
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 13 — CLOSING (BLACK)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  // Left accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: H, fill: { color: WHT }, line: { color: WHT, width: 0 }
  });

  s.addText("Thank You", {
    x: 0.32, y: 0.9, w: 8, h: 0.9,
    fontSize: 40, fontFace: TITLE_FONT, bold: true, color: WHT,
    align: "left", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.32, y: 1.9, w: 3.8, h: 0.03, fill: { color: WHT }, line: { color: WHT, width: 0 }
  });

  s.addText("Connected Arena", {
    x: 0.32, y: 2.06, w: 7, h: 0.4,
    fontSize: 16, fontFace: BODY_FONT, color: GRY2, italic: true, align: "left", margin: 0
  });

  s.addText("AWS Sports AI Innovation Cup 2026 — Challenge 4", {
    x: 0.32, y: 2.56, w: 7, h: 0.28,
    fontSize: 10, fontFace: BODY_FONT, color: GRY3, align: "left", margin: 0
  });

  // Team list
  s.addText("TEAM", {
    x: 0.32, y: 3.38, w: 1.2, h: 0.22,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3,
    align: "left", charSpacing: 3, margin: 0
  });

  const members = ["Carine UMUGABEKAZE", "ISHIMWE Ami Paradis", "CYUZUZO Pacifique"];
  members.forEach((m, i) => {
    s.addText(m, {
      x: 0.32, y: 3.66 + i * 0.3, w: 5.5, h: 0.26,
      fontSize: 12, fontFace: BODY_FONT, color: WHT, align: "left", margin: 0
    });
  });

  // Links bottom right
  const linkItems = [
    "d1706ex99mjina.cloudfront.net",
    "github.com/pacyuzu16/connected-arena",
  ];
  linkItems.forEach((lk, i) => {
    s.addText(lk, {
      x: 5.2, y: 4.55 + i * 0.3, w: 4.6, h: 0.26,
      fontSize: 8.5, fontFace: "Courier New", color: GRY3, align: "right", margin: 0
    });
  });
}

// ── Write file ─────────────────────────────────────────────────────────────
const OUT = "C:\\Users\\Administrator\\Desktop\\connected_arena_presentation.pptx";
pres.writeFile({ fileName: OUT }).then(() => {
  console.log(`Written: ${OUT}`);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
