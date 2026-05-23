/**
 * Connected Arena — 5-Slide Executive Summary Generator
 * ─────────────────────────────────────────────────────
 * Generates executive_summary.pptx per challenge deliverable requirements.
 * Run:  node scripts/generate_executive_summary.js
 * Then: open the .pptx → File → Save As → PDF
 *
 * Slides:
 *   1. Title
 *   2. Problem → Solution
 *   3. Architecture + AWS Services
 *   4. Spatial & North Star Vision (Cross-Platform Ecosystem)
 *   5. Live Demo + Why We Win
 */

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Connected Arena Team";
pres.title  = "Connected Arena — Executive Summary";

// ── Colors ────────────────────────────────────────────────────────────────
const BLK = "000000", WHT = "FFFFFF", GRY1 = "F2F2F2", GRY2 = "CCCCCC", GRY3 = "888888";
const ACCENT = "10b981";
const W = 10, H = 5.625, LM = 0.55, RM = 0.55, CW = W - LM - RM;
const TITLE_FONT = "Georgia", BODY_FONT = "Calibri";

// ── Helpers ───────────────────────────────────────────────────────────────
function topRule(s, y = 0.72) {
  s.addShape(pres.shapes.RECTANGLE, { x: LM, y, w: CW, h: 0.025, fill: { color: BLK } });
}
function pageNum(s, n) {
  s.addText(`${n}/5`, { x: 9.2, y: 5.25, w: 0.6, h: 0.2, fontSize: 8, fontFace: BODY_FONT, color: GRY2, align: "right" });
}
function sectionHead(s, title, n) {
  s.background = { color: WHT };
  s.addText(title.toUpperCase(), {
    x: LM, y: 0.28, w: CW, h: 0.38,
    fontSize: 20, fontFace: TITLE_FONT, bold: true, color: BLK, charSpacing: 2,
  });
  topRule(s);
  pageNum(s, n);
}
function card(s, x, y, w, h) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: GRY1 }, line: { color: GRY2, width: 0.6 } });
}
function tag(s, text, x, y, w = 1.2) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.26, fill: { color: BLK } });
  s.addText(text, { x, y, w, h: 0.26, fontSize: 8, fontFace: BODY_FONT, bold: true, color: WHT, align: "center", valign: "middle" });
}
function innerRule(s, y) {
  s.addShape(pres.shapes.RECTANGLE, { x: LM, y, w: CW, h: 0.012, fill: { color: GRY2 } });
}
function awsBox(s, x, y, w, h, label, sub) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: BLK } });
  s.addText(label, { x: x + 0.06, y: y + 0.12, w: w - 0.12, h: 0.55, fontSize: 9, fontFace: TITLE_FONT, bold: true, color: WHT, align: "center", valign: "middle" });
  s.addText(sub, { x: x + 0.06, y: y + 0.7, w: w - 0.12, h: 0.35, fontSize: 7.5, fontFace: BODY_FONT, color: GRY2, align: "center" });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — TITLE (BLACK)
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: H, fill: { color: WHT } });

  s.addText("CONNECTED ARENA", {
    x: 0.32, y: 0.9, w: 7, h: 1.0,
    fontSize: 44, fontFace: TITLE_FONT, bold: true, color: WHT, charSpacing: 3,
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.32, y: 2.0, w: 3.8, h: 0.03, fill: { color: WHT } });
  s.addText("Real-Time Multiplayer Fan Engagement Platform", {
    x: 0.32, y: 2.12, w: 8, h: 0.38,
    fontSize: 16, fontFace: BODY_FONT, color: GRY2, italic: true,
  });
  s.addText("AWS Sports AI Innovation Cup 2026  |  Challenge 4: Connected Arena", {
    x: 0.32, y: 2.62, w: 8, h: 0.28,
    fontSize: 10, fontFace: BODY_FONT, color: GRY3,
  });

  s.addText("TEAM", {
    x: 0.32, y: 3.4, w: 2, h: 0.22,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3, charSpacing: 3,
  });
  ["Carine UMUGABEKAZE", "ISHIMWE Ami Paradis", "CYUZUZO Pacifique"].forEach((m, i) => {
    s.addText(m, { x: 0.32, y: 3.68 + i * 0.3, w: 5, h: 0.26, fontSize: 12, fontFace: BODY_FONT, color: WHT });
  });

  // Key stats right side
  const stats = [
    { val: "100%", lbl: "Serverless" },
    { val: "9",    lbl: "AWS Services" },
    { val: "<20ms",lbl: "WebSocket Latency" },
    { val: "3",    lbl: "AI Personas" },
  ];
  stats.forEach((st, i) => {
    const sy = 3.4 + i * 0.5;
    s.addText(st.val, { x: 7.0, y: sy, w: 1.2, h: 0.26, fontSize: 16, fontFace: TITLE_FONT, bold: true, color: ACCENT, align: "right" });
    s.addText(st.lbl, { x: 8.3, y: sy, w: 1.5, h: 0.26, fontSize: 9, fontFace: BODY_FONT, color: GRY3, align: "left" });
  });

  s.addText("d1706ex99mjina.cloudfront.net", {
    x: 5.5, y: 5.1, w: 4.3, h: 0.26,
    fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "right",
  });
  pageNum(s, 1);
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — PROBLEM → SOLUTION
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "The Problem & Our Solution", 2);

  // Problem strip
  s.addText('"Watching football today is passive. Fans react \u2014 they don\u2019t participate."', {
    x: LM, y: 0.86, w: CW, h: 0.5,
    fontSize: 13, fontFace: TITLE_FONT, italic: true, color: BLK, align: "center",
  });

  // 3 pain points
  const pains = [
    { t: "No Interactivity", b: "Broadcast/streaming offers zero participation." },
    { t: "Disconnected Fans", b: "Social reactions come after the moment, not during." },
    { t: "Generic Experience", b: "Every fan sees the same commentary." },
  ];
  pains.forEach((p, i) => {
    const px = LM + i * 3.05;
    card(s, px, 1.42, 2.9, 0.86);
    s.addText(p.t, { x: px + 0.12, y: 1.5, w: 2.66, h: 0.28, fontSize: 9.5, fontFace: TITLE_FONT, bold: true, color: BLK });
    s.addText(p.b, { x: px + 0.12, y: 1.78, w: 2.66, h: 0.4, fontSize: 8.5, fontFace: BODY_FONT, color: GRY3 });
  });

  // Arrow
  s.addText("\u2193  OUR SOLUTION  \u2193", {
    x: LM, y: 2.38, w: CW, h: 0.3,
    fontSize: 9, fontFace: BODY_FONT, bold: true, color: ACCENT, align: "center", charSpacing: 2,
  });

  // 4 feature cards
  const feats = [
    { tag: "PREDICT",  t: "Live Predictions",    b: "YES/NO on shots, penalties, free kicks with countdown timer + instant XP." },
    { tag: "AI",       t: "AI Commentary",        b: "Bedrock Claude Haiku generates unique commentary per fan persona." },
    { tag: "RANK",     t: "Real-Time Leaderboard", b: "Global ranking updates after every goal. 5 tiers: ROOKIE \u2192 APEX." },
    { tag: "SPATIAL",  t: "Stadium Big Screen",   b: "Full-screen mode for jumbotrons and watch parties with live QR join." },
  ];
  const fw = 2.14, fh = 1.82;
  feats.forEach((f, i) => {
    const fx = LM + i * (fw + 0.12);
    const fy = 2.72;
    card(s, fx, fy, fw, fh);
    tag(s, f.tag, fx + 0.1, fy + 0.12, 0.8);
    s.addText(f.t, { x: fx + 0.1, y: fy + 0.46, w: fw - 0.2, h: 0.32, fontSize: 9.5, fontFace: TITLE_FONT, bold: true, color: BLK });
    s.addText(f.b, { x: fx + 0.1, y: fy + 0.8, w: fw - 0.2, h: 0.88, fontSize: 8, fontFace: BODY_FONT, color: BLK });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — AWS ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "AWS Architecture \u2014 100% Serverless", 3);

  s.addText("9 AWS Services  |  9 Lambda Functions  |  5 DynamoDB Tables  |  Zero EC2", {
    x: LM, y: 0.86, w: CW, h: 0.26, fontSize: 9.5, fontFace: BODY_FONT, color: GRY3,
  });

  // Pipeline boxes
  const boxes = [
    { l: "CloudFront\n+ S3",       s: "CDN / Static\nHosting" },
    { l: "API Gateway\nWebSocket",  s: "Real-Time\nConnections" },
    { l: "Lambda\nx 9 Functions",   s: "Business\nLogic" },
    { l: "DynamoDB\nx 5 Tables",    s: "Players /\nPredictions" },
    { l: "Amazon\nBedrock",         s: "Claude Haiku\nAI Commentary" },
  ];
  const bw = 1.65, bh = 1.15, gap = 0.12;
  const totalW = boxes.length * bw + (boxes.length - 1) * (gap + 0.2);
  let bx = (W - totalW) / 2;

  boxes.forEach((b, i) => {
    if (i > 0) {
      s.addText("\u25B6", { x: bx - 0.22, y: 1.28 + bh / 2 - 0.12, w: 0.18, h: 0.24, fontSize: 8, color: BLK, align: "center" });
    }
    awsBox(s, bx, 1.28, bw, bh, b.l, b.s);
    bx += bw + gap + 0.2;
  });

  // EventBridge below Lambda
  const ebX = (W - totalW) / 2 + 2 * (bw + gap + 0.2);
  s.addShape(pres.shapes.RECTANGLE, { x: ebX + bw / 2 - 0.015, y: 1.28 + bh, w: 0.03, h: 0.38, fill: { color: GRY2 } });
  s.addText("EventBridge\n(1/min trigger)", { x: ebX - 0.2, y: 1.28 + bh + 0.38, w: bw + 0.4, h: 0.4, fontSize: 8, fontFace: BODY_FONT, color: BLK, align: "center" });

  // Cognito + SNS below
  s.addText("+ Amazon Cognito (Auth)  |  + Lambda Layers (shared code)  |  + S3 (DFL XML data)", {
    x: LM, y: 3.2, w: CW, h: 0.22, fontSize: 8, fontFace: BODY_FONT, color: GRY3, align: "center",
  });

  innerRule(s, 3.5);

  // Data flow summary
  const flow = [
    "1. Fan visits CloudFront \u2192 opens WebSocket \u2192 API Gateway routes to connect Lambda",
    "2. EventBridge fires event_emitter Lambda every 60s \u2192 reads next DFL match event from DynamoDB",
    "3. Resolves open predictions (awards XP) \u2192 invokes broadcast Lambda \u2192 pushes MATCH_EVENT to all fans",
    "4. For GOAL/PENALTY/VAR/CARD \u2192 invokes bedrock_commentary Lambda \u2192 unique AI_COMMENTARY per fan persona",
    "5. Frontend: score updates, feed card, win-prob bar, prediction modal, leaderboard auto-refresh",
  ];
  flow.forEach((f, i) => {
    s.addText(f, {
      x: LM, y: 3.62 + i * 0.36, w: CW, h: 0.32,
      fontSize: 8.5, fontFace: BODY_FONT, color: BLK,
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — SPATIAL & NORTH STAR VISION
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Spatial Vision & North Star Ecosystem", 4);

  s.addText("From a single screen to a connected fan ecosystem \u2014 matchday, mid-week, everywhere.", {
    x: LM, y: 0.86, w: CW, h: 0.3,
    fontSize: 11, fontFace: TITLE_FONT, italic: true, color: BLK,
  });

  // 5 touchpoints as columns
  const touchpoints = [
    {
      icon: "\uD83D\uDCF1", label: "MOBILE",
      status: "LIVE",
      items: ["Full arena experience", "Predictions + XP", "AI commentary", "Leaderboard + chat", "Push notifications"],
    },
    {
      icon: "\uD83D\uDCFA", label: "STADIUM SCREEN",
      status: "BUILT",
      items: ["/stadium big-screen mode", "Giant scoreboard + feed", "Live crowd vote bars", "QR code to join", "AI commentary overlay"],
    },
    {
      icon: "\uD83C\uDF10", label: "WATCH PARTY",
      status: "BUILT",
      items: ["Shared screen companion", "Fan count + crowd votes", "Projected leaderboard", "Group challenges", "Second-screen sync"],
    },
    {
      icon: "\uD83D\uDD76\uFE0F", label: "AR IN-STADIUM",
      status: "CONCEPT",
      items: ["Phone camera AR overlay", "Live stats on pitch", "Player XP badges floating", "Section-based challenges", "Proximity fan matching"],
    },
    {
      icon: "\u231A", label: "WEARABLE",
      status: "CONCEPT",
      items: ["Haptic buzz on prediction", "Tap YES/NO on wrist", "XP + streak notifications", "Heart rate challenges", "Cross-device identity"],
    },
  ];

  const tw = 1.72, th = 3.3;
  touchpoints.forEach((t, i) => {
    const tx = LM + i * (tw + 0.1);
    const ty = 1.28;

    // Header
    const isBuilt  = t.status === "LIVE" || t.status === "BUILT";
    const hdrColor = isBuilt ? BLK : GRY3;
    s.addShape(pres.shapes.RECTANGLE, { x: tx, y: ty, w: tw, h: 0.52, fill: { color: isBuilt ? BLK : GRY1 }, line: { color: GRY2, width: isBuilt ? 0 : 0.6 } });
    s.addText(`${t.icon}  ${t.label}`, {
      x: tx, y: ty + 0.02, w: tw, h: 0.3,
      fontSize: 8.5, fontFace: BODY_FONT, bold: true, color: isBuilt ? WHT : BLK, align: "center",
    });
    // Status badge
    const badgeColors = { LIVE: ACCENT, BUILT: "3b82f6", CONCEPT: "f59e0b" };
    s.addText(t.status, {
      x: tx + (tw - 0.7) / 2, y: ty + 0.3, w: 0.7, h: 0.18,
      fontSize: 6.5, fontFace: BODY_FONT, bold: true, color: WHT, align: "center", valign: "middle",
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: tx + (tw - 0.72) / 2, y: ty + 0.3, w: 0.72, h: 0.18,
      fill: { color: badgeColors[t.status] },
    });
    s.addText(t.status, {
      x: tx + (tw - 0.72) / 2, y: ty + 0.3, w: 0.72, h: 0.18,
      fontSize: 6.5, fontFace: BODY_FONT, bold: true, color: WHT, align: "center", valign: "middle",
    });

    // Card body
    card(s, tx, ty + 0.52, tw, th - 0.52);
    t.items.forEach((it, ii) => {
      s.addText(`\u2022  ${it}`, {
        x: tx + 0.08, y: ty + 0.62 + ii * 0.48, w: tw - 0.16, h: 0.44,
        fontSize: 8, fontFace: BODY_FONT, color: BLK,
      });
    });
  });

  // North star text at bottom
  s.addText("NORTH STAR: A persistent fan identity that travels across phone, stadium, wearable, and living room \u2014 every interaction earns XP, every touchpoint is connected.", {
    x: LM, y: 4.7, w: CW, h: 0.55,
    fontSize: 9, fontFace: TITLE_FONT, italic: true, color: BLK, align: "center",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — LIVE DEMO + WHY WE WIN
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  sectionHead(s, "Live Demo & Why We Win", 5);

  // Links
  const links = [
    { tag: "LIVE",     url: "https://d1706ex99mjina.cloudfront.net",              desc: "Full fan experience \u2014 join, predict, earn XP, AI commentary" },
    { tag: "STADIUM",  url: "https://d1706ex99mjina.cloudfront.net/stadium",      desc: "Big Screen mode \u2014 spatial proof-of-concept for jumbotrons" },
    { tag: "GITHUB",   url: "https://github.com/pacyuzu16/connected-arena",       desc: "Full source: Next.js frontend, 9 Lambdas, SAM template" },
  ];
  links.forEach((lk, i) => {
    const ly = 0.88 + i * 0.68;
    card(s, LM, ly, CW, 0.58);
    tag(s, lk.tag, LM + 0.12, ly + 0.08, 0.82);
    s.addText(lk.url, { x: LM + 1.06, y: ly + 0.06, w: CW - 1.18, h: 0.24, fontSize: 9.5, fontFace: "Courier New", bold: true, color: BLK });
    s.addText(lk.desc, { x: LM + 1.06, y: ly + 0.3, w: CW - 1.18, h: 0.22, fontSize: 8, fontFace: BODY_FONT, color: GRY3 });
  });

  innerRule(s, 2.98);

  // Why we win — 4 cards
  s.addText("WHY CONNECTED ARENA WINS", {
    x: LM, y: 3.08, w: CW, h: 0.24,
    fontSize: 8, fontFace: BODY_FONT, bold: true, color: GRY3, charSpacing: 3,
  });

  const wins = [
    { n: "01", t: "Personalized AI at Scale",    b: "Bedrock generates a unique message per fan per event \u2014 not one broadcast, N individual conversations." },
    { n: "02", t: "True Real-Time WebSocket",     b: "API Gateway WebSocket pushes to browsers instantly. EventBridge + Lambda + DynamoDB with zero polling." },
    { n: "03", t: "Complete Fan Journey",          b: "Pre-match predictions \u2192 live XP \u2192 HT AI summary \u2192 post-match standings \u2192 mid-week retention." },
    { n: "04", t: "Spatial Proof-of-Concept",     b: "Stadium big-screen mode, watch-party view, QR join \u2014 plus wearable & AR concepts articulated." },
  ];
  const ww = 2.14, wh = 1.7;
  wins.forEach((w, i) => {
    const wx = LM + i * (ww + 0.12);
    const wy = 3.38;
    card(s, wx, wy, ww, wh);
    s.addText(w.n, { x: wx + 0.08, y: wy + 0.08, w: 0.4, h: 0.3, fontSize: 14, fontFace: TITLE_FONT, bold: true, color: GRY2 });
    s.addText(w.t, { x: wx + 0.48, y: wy + 0.08, w: ww - 0.56, h: 0.34, fontSize: 9, fontFace: TITLE_FONT, bold: true, color: BLK });
    s.addText(w.b, { x: wx + 0.08, y: wy + 0.48, w: ww - 0.16, h: 1.1, fontSize: 8, fontFace: BODY_FONT, color: BLK });
  });
}

// ── Write ─────────────────────────────────────────────────────────────────
const OUT = "executive_summary.pptx";
pres.writeFile({ fileName: OUT }).then(() => {
  console.log(`\n  Executive summary written: ${OUT}`);
  console.log(`  Open in PowerPoint/Google Slides and export as PDF.\n`);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
