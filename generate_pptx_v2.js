// generate_pptx_v2.js — Updated Connected Arena presentation
// Black & white only, simple words, no "Watch Party" tab.
// Includes new features: Live Chat, Cognito login, ML xG model, Admin management.
//
// Usage: node generate_pptx_v2.js

const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout    = "LAYOUT_WIDE"; // 13.33 x 7.5 inches
pres.title     = "Connected Arena — Updated";

// Black & white palette only
const BLACK = "000000";
const WHITE = "FFFFFF";
const GREY  = "888888";
const FAINT = "DDDDDD";

const FONT_H = "Georgia";       // headers
const FONT_B = "Calibri";       // body

// ─────────────────────────────────────────────────────────────────────────────
// helper: thin divider line
function divider(slide, x, y, w) {
  slide.addShape("rect", { x, y, w, h: 0.02, fill: { color: BLACK }, line: { type: "none" } });
}

// helper: page number
function pageNum(slide, n) {
  slide.addText(`${n}`, {
    x: 12.5, y: 7.05, w: 0.6, h: 0.3,
    fontFace: FONT_B, fontSize: 9, color: GREY, align: "right",
  });
}

// helper: top label
function topLabel(slide, text) {
  slide.addText(text, {
    x: 0.6, y: 0.35, w: 6, h: 0.3,
    fontFace: FONT_B, fontSize: 10, color: GREY, bold: true,
    charSpacing: 4,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — Cover
let s = pres.addSlide();
s.background = { color: BLACK };

s.addText("CONNECTED ARENA", {
  x: 0.6, y: 2.4, w: 12.1, h: 1.2,
  fontFace: FONT_H, fontSize: 66, color: WHITE, bold: true, align: "left",
});
s.addText("Watch the match. Predict the action. Earn your place.", {
  x: 0.6, y: 3.6, w: 12.1, h: 0.6,
  fontFace: FONT_B, fontSize: 22, color: WHITE, italic: true, align: "left",
});
s.addShape("rect", { x: 0.6, y: 4.35, w: 1.2, h: 0.03, fill: { color: WHITE }, line: { type: "none" } });

s.addText("AWS Sports AI Innovation Cup 2026  ·  Challenge 4", {
  x: 0.6, y: 4.55, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 14, color: WHITE, align: "left",
});

s.addText("TEAM", {
  x: 0.6, y: 5.6, w: 4, h: 0.3,
  fontFace: FONT_B, fontSize: 10, color: WHITE, bold: true, charSpacing: 4,
});
s.addText([
  { text: "Carine UMUGABEKAZE\n", options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
  { text: "ISHIMWE Ami Paradis\n",  options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
  { text: "CYUZUZO Pacifique",      options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
], { x: 0.6, y: 5.85, w: 6, h: 1.2 });

s.addText("d1706ex99mjina.cloudfront.net", {
  x: 8, y: 6.85, w: 5, h: 0.3,
  fontFace: FONT_B, fontSize: 11, color: WHITE, italic: true, align: "right",
});

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — The Problem
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "01  ·  THE PROBLEM");
divider(s, 0.6, 0.85, 12.1);

s.addText("Football fans just sit and watch.", {
  x: 0.6, y: 1.2, w: 12.1, h: 1.0,
  fontFace: FONT_H, fontSize: 42, color: BLACK, bold: true,
});
s.addText("They do not get to play. They do not get to compete. They do not get to feel part of the game.", {
  x: 0.6, y: 2.3, w: 12.1, h: 0.7,
  fontFace: FONT_B, fontSize: 18, color: GREY, italic: true,
});

const issues = [
  { num: "01", t: "TV shows the match but does nothing else", d: "You can shout at the screen, but the screen does not shout back. The match keeps going whether you are awake, asleep, or making tea." },
  { num: "02", t: "Social media only happens after the moment", d: "By the time you post your reaction, the next play is already happening. There is no shared live energy with other fans." },
  { num: "03", t: "Every fan gets the same boring feed", d: "The casual fan, the die-hard, and the data lover all see the exact same thing. Nothing is tailored to who you actually are." },
];
issues.forEach((it, i) => {
  const y = 3.6 + i * 1.15;
  s.addText(it.num, { x: 0.6, y, w: 0.8, h: 0.5, fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true });
  s.addText(it.t,   { x: 1.6, y, w: 11, h: 0.4, fontFace: FONT_B, fontSize: 16, color: BLACK, bold: true });
  s.addText(it.d,   { x: 1.6, y: y + 0.4, w: 11, h: 0.5, fontFace: FONT_B, fontSize: 12, color: GREY });
});

pageNum(s, 2);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — The Solution
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "02  ·  OUR SOLUTION");
divider(s, 0.6, 0.85, 12.1);

s.addText("Connected Arena turns watching into competing.", {
  x: 0.6, y: 1.2, w: 12.1, h: 1.0,
  fontFace: FONT_H, fontSize: 38, color: BLACK, bold: true,
});
s.addText("Open the website during a live match. Predict what happens next. Earn points. Climb the leaderboard. Chat with other fans. All while the match is happening.", {
  x: 0.6, y: 2.4, w: 12.1, h: 1.0,
  fontFace: FONT_B, fontSize: 16, color: GREY, italic: true,
});

const features = [
  { t: "PREDICT",      d: "Every shot, penalty, and free kick triggers a YES / NO question. You have 10 seconds to vote. Right answers earn XP." },
  { t: "CHAT LIVE",    d: "Fan chat that runs alongside the match — react in real time, send emojis, and earn XP for being active." },
  { t: "RANK & LEVEL", d: "Live leaderboard updates after every goal. Climb from Rookie to Apex through 5 tiers and 12 unlockable badges." },
  { t: "GET SMART",    d: "Our AI gives different match commentary based on who you are: casual fan, hardcore fan, or data nerd." },
];
features.forEach((f, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.6 + col * 6.15;
  const y = 4.0 + row * 1.5;
  s.addShape("rect", { x, y, w: 0.05, h: 1.3, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(f.t, { x: x + 0.25, y, w: 5.7, h: 0.4, fontFace: FONT_H, fontSize: 18, color: BLACK, bold: true });
  s.addText(f.d, { x: x + 0.25, y: y + 0.45, w: 5.7, h: 0.85, fontFace: FONT_B, fontSize: 12, color: BLACK });
});

pageNum(s, 3);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — How It Works (Simple)
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "03  ·  HOW IT WORKS");
divider(s, 0.6, 0.85, 12.1);

s.addText("From a goal in the stadium to your phone — in seconds.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 30, color: BLACK, bold: true,
});

const steps = [
  { n: "1", t: "Match event happens",       d: "A shot, goal, or penalty is recorded by the system." },
  { n: "2", t: "Sent to all fans instantly",d: "AWS pushes the event to every connected fan at the same time." },
  { n: "3", t: "Fans predict in 10 seconds",d: "A YES / NO question pops up. Right answers earn points." },
  { n: "4", t: "Personal AI commentary",    d: "Each fan gets a unique reaction matched to their personality." },
  { n: "5", t: "Leaderboard updates live",  d: "Top fans move up, badges unlock, the crowd reacts together." },
];
steps.forEach((st, i) => {
  const y = 2.4 + i * 0.85;
  s.addShape("ellipse", { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(st.n, { x: 0.6, y, w: 0.6, h: 0.6, fontFace: FONT_H, fontSize: 22, color: WHITE, bold: true, align: "center", valign: "middle" });
  s.addText(st.t, { x: 1.5, y: y - 0.05, w: 11, h: 0.4, fontFace: FONT_B, fontSize: 16, color: BLACK, bold: true });
  s.addText(st.d, { x: 1.5, y: y + 0.3,  w: 11, h: 0.4, fontFace: FONT_B, fontSize: 12, color: GREY });
});

pageNum(s, 4);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 5 — Built on AWS (simple)
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "04  ·  BUILT ON AWS");
divider(s, 0.6, 0.85, 12.1);

s.addText("Eight AWS services. Zero servers to manage.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true,
});
s.addText("Everything runs only when fans use it. No idle costs, no servers to babysit.", {
  x: 0.6, y: 2.0, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 14, color: GREY, italic: true,
});

const aws = [
  { n: "CloudFront",  r: "Delivers the website fast to anyone, anywhere in the world." },
  { n: "S3",          r: "Stores the website files and fan profile pictures." },
  { n: "API Gateway", r: "Keeps every fan connected in real time using WebSockets." },
  { n: "Lambda",      r: "Runs all our code. Handles predictions, chat, XP, and AI calls." },
  { n: "DynamoDB",    r: "Stores fans, predictions, match events, and chat messages." },
  { n: "Cognito",     r: "Handles login, sign up, and email verification securely." },
  { n: "Bedrock",     r: "Runs the AI that generates personalized match commentary." },
  { n: "EventBridge", r: "Schedules and triggers our match playback every minute." },
];
aws.forEach((svc, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.6 + col * 6.15;
  const y = 2.8 + row * 1.05;
  s.addText(svc.n, { x, y, w: 2.2, h: 0.4, fontFace: FONT_H, fontSize: 18, color: BLACK, bold: true });
  s.addText(svc.r, { x: x + 2.3, y: y + 0.05, w: 3.7, h: 0.85, fontFace: FONT_B, fontSize: 12, color: BLACK });
});

pageNum(s, 5);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 6 — AI Commentary
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "05  ·  PERSONAL AI COMMENTARY");
divider(s, 0.6, 0.85, 12.1);

s.addText("Same goal. Three fans. Three completely different reactions.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 28, color: BLACK, bold: true,
});
s.addText("Powered by Amazon Bedrock running Claude Haiku 4.5 — sends one tailored message per fan.", {
  x: 0.6, y: 2.0, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 13, color: GREY, italic: true,
});

const personas = [
  { p: "CASUAL FAN",    s: "Friendly. Short. Lots of emojis.",         q: "\"What a finish! Hamburg are on fire tonight! 🔥\"" },
  { p: "PASSIONATE",    s: "Loud. Dramatic. All caps energy.",         q: "\"YESSSS!! GET IN!! This is what we live for!!\"" },
  { p: "STATS NERD",    s: "Numbers. Stats. ML model talk.",           q: "\"Hamburg score — xG was 0.34, well above league avg.\"" },
];
personas.forEach((p, i) => {
  const x = 0.6 + i * 4.13;
  const y = 2.9;
  s.addShape("rect", { x, y, w: 3.9, h: 3.6, fill: { color: WHITE }, line: { color: BLACK, width: 1.5 } });
  s.addShape("rect", { x, y, w: 3.9, h: 0.5, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(p.p, { x: x + 0.15, y, w: 3.7, h: 0.5, fontFace: FONT_H, fontSize: 14, color: WHITE, bold: true, valign: "middle" });
  s.addText("Style", { x: x + 0.2, y: y + 0.65, w: 3.5, h: 0.3, fontFace: FONT_B, fontSize: 10, color: GREY, bold: true, charSpacing: 3 });
  s.addText(p.s,    { x: x + 0.2, y: y + 0.95, w: 3.5, h: 0.6, fontFace: FONT_B, fontSize: 12, color: BLACK });
  s.addText("Fan sees", { x: x + 0.2, y: y + 1.75, w: 3.5, h: 0.3, fontFace: FONT_B, fontSize: 10, color: GREY, bold: true, charSpacing: 3 });
  s.addText(p.q,    { x: x + 0.2, y: y + 2.05, w: 3.5, h: 1.4, fontFace: FONT_B, fontSize: 13, color: BLACK, italic: true });
});

pageNum(s, 6);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 7 — Machine Learning: xG
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "06  ·  MACHINE LEARNING — EXPECTED GOALS");
divider(s, 0.6, 0.85, 12.1);

s.addText("We trained our own AI model to predict goal chances.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 28, color: BLACK, bold: true,
});
s.addText("Every shot now shows a real probability — and rare goals reward more XP.", {
  x: 0.6, y: 2.0, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 14, color: GREY, italic: true,
});

// Big stats row
const stats = [
  { v: "57,763", l: "shots used to train" },
  { v: "1,569",  l: "real matches studied" },
  { v: "0.75",   l: "model accuracy (AUC)" },
  { v: "< 1ms",  l: "live prediction time" },
];
stats.forEach((st, i) => {
  const x = 0.6 + i * 3.08;
  s.addText(st.v, { x, y: 2.7, w: 3, h: 1.0, fontFace: FONT_H, fontSize: 44, color: BLACK, bold: true, align: "center" });
  s.addText(st.l, { x, y: 3.7, w: 3, h: 0.4, fontFace: FONT_B, fontSize: 11, color: GREY, align: "center", charSpacing: 2 });
});

divider(s, 0.6, 4.5, 12.1);

s.addText("What this means for fans:", {
  x: 0.6, y: 4.7, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 14, color: BLACK, bold: true,
});

const xgBenefits = [
  { t: "Live shot quality",      d: "A coloured bar appears with every shot. Green = unlikely. Red = dangerous." },
  { t: "Surprise bonus",         d: "Correctly predict a goal from a 5% chance shot? You get 3 times the normal XP." },
  { t: "Smarter AI commentary",  d: "Stats fans hear the exact xG numbers in the live commentary." },
];
xgBenefits.forEach((b, i) => {
  const y = 5.2 + i * 0.55;
  s.addText("•", { x: 0.6, y, w: 0.3, h: 0.4, fontFace: FONT_H, fontSize: 18, color: BLACK, bold: true });
  s.addText(b.t + " — ", { x: 0.85, y, w: 3.5, h: 0.4, fontFace: FONT_B, fontSize: 13, color: BLACK, bold: true });
  s.addText(b.d, { x: 4.3, y, w: 8.5, h: 0.4, fontFace: FONT_B, fontSize: 12, color: BLACK });
});

pageNum(s, 7);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 8 — The Product (4 tabs, no Watch)
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "07  ·  THE FAN EXPERIENCE");
divider(s, 0.6, 0.85, 12.1);

s.addText("Four simple screens. Built for phone, tablet, and PC.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 28, color: BLACK, bold: true,
});

const tabs = [
  { n: "HOME",       sub: "Match Hub",     items: ["Team lineups and overview", "Live score and match clock", "Win probability bar", "Recent activity feed"] },
  { n: "ARENA",      sub: "Live Action",   items: ["Real-time match event feed", "Prediction pop-up with countdown", "YES / NO voting with crowd %", "AI commentary bar"] },
  { n: "LEADERBOARD",sub: "Rankings",      items: ["Global top fans podium", "Tier badges per player", "Live fan count", "Crowd reactions"] },
  { n: "CHAT",       sub: "Fan Chat Live", items: ["YouTube-style live chat", "Emoji reactions on messages", "Top chatter sidebar", "Earn +5 XP every 5 messages"] },
];
tabs.forEach((tab, i) => {
  const x = 0.6 + i * 3.08;
  const y = 2.4;
  s.addShape("rect", { x, y, w: 2.9, h: 4.0, fill: { color: WHITE }, line: { color: BLACK, width: 1.2 } });
  s.addShape("rect", { x, y, w: 2.9, h: 0.7, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(tab.n,   { x, y, w: 2.9, h: 0.5, fontFace: FONT_H, fontSize: 16, color: WHITE, bold: true, align: "center", valign: "middle" });
  s.addText(tab.sub, { x, y: y + 0.35, w: 2.9, h: 0.3, fontFace: FONT_B, fontSize: 10, color: WHITE, italic: true, align: "center" });
  tab.items.forEach((item, j) => {
    s.addText("• " + item, { x: x + 0.15, y: y + 0.95 + j * 0.55, w: 2.65, h: 0.5, fontFace: FONT_B, fontSize: 11, color: BLACK });
  });
});

pageNum(s, 8);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 9 — Login & Roles
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "08  ·  ACCOUNTS & ROLES");
divider(s, 0.6, 0.85, 12.1);

s.addText("Three ways to use Connected Arena.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true,
});
s.addText("Powered by Amazon Cognito — secure passwords, email verification, and session tokens.", {
  x: 0.6, y: 2.0, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 14, color: GREY, italic: true,
});

const roles = [
  { n: "GUEST",  d: "Jump in instantly — no account needed.", b: ["Pick a name and persona", "Make predictions, chat, earn XP", "Progress saved to your device only"] },
  { n: "MEMBER", d: "Sign up with email and password.",        b: ["Full account through Amazon Cognito", "Profile and XP follow you everywhere", "Stays logged in across refreshes"] },
  { n: "ADMIN",  d: "Run the show from the admin dashboard.",  b: ["Watch live stats and engagement", "See all fans with XP and accuracy", "Suspend troublemakers with one click"] },
];
roles.forEach((r, i) => {
  const y = 2.9 + i * 1.4;
  s.addShape("rect", { x: 0.6, y, w: 1.8, h: 1.3, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(r.n, { x: 0.6, y, w: 1.8, h: 1.3, fontFace: FONT_H, fontSize: 18, color: WHITE, bold: true, align: "center", valign: "middle" });
  s.addText(r.d, { x: 2.6, y, w: 10, h: 0.4, fontFace: FONT_B, fontSize: 15, color: BLACK, bold: true });
  r.b.forEach((bullet, j) => {
    s.addText("• " + bullet, { x: 2.6, y: y + 0.45 + j * 0.3, w: 10, h: 0.3, fontFace: FONT_B, fontSize: 12, color: BLACK });
  });
});

pageNum(s, 9);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 10 — Numbers
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "09  ·  BY THE NUMBERS");
divider(s, 0.6, 0.85, 12.1);

s.addText("What we built in one project.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true,
});

const numbers = [
  { v: "8",   l: "AWS Services Used" },
  { v: "10",  l: "Backend Functions" },
  { v: "5",   l: "Database Tables" },
  { v: "91",  l: "Match Events in DB" },
  { v: "3",   l: "Fan Personas" },
  { v: "12",  l: "Unlockable Badges" },
  { v: "5",   l: "Rank Tiers" },
  { v: "57k", l: "Shots Used for ML" },
];
numbers.forEach((n, i) => {
  const col = i % 4;
  const row = Math.floor(i / 4);
  const x = 0.6 + col * 3.08;
  const y = 2.4 + row * 2.0;
  s.addText(n.v, { x, y, w: 3, h: 1.2, fontFace: FONT_H, fontSize: 60, color: BLACK, bold: true, align: "center" });
  s.addText(n.l, { x, y: y + 1.25, w: 3, h: 0.4, fontFace: FONT_B, fontSize: 11, color: GREY, align: "center", charSpacing: 2 });
});

pageNum(s, 10);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 11 — Live Demo
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "10  ·  TRY IT NOW");
divider(s, 0.6, 0.85, 12.1);

s.addText("Connected Arena is live and running on AWS.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true,
});

const links = [
  { t: "FAN APP",        u: "https://d1706ex99mjina.cloudfront.net",       d: "Open in two browser tabs to see real-time multiplayer in action." },
  { t: "ADMIN DASHBOARD",u: "https://d1706ex99mjina.cloudfront.net/admin", d: "Sign in as admin@gmail.com to see live stats and manage users." },
  { t: "SOURCE CODE",    u: "https://github.com/pacyuzu16/connected-arena", d: "All the code, deploy scripts, and documentation in one place." },
];
links.forEach((l, i) => {
  const y = 2.5 + i * 1.4;
  s.addShape("rect", { x: 0.6, y, w: 0.1, h: 1.2, fill: { color: BLACK }, line: { type: "none" } });
  s.addText(l.t, { x: 0.95, y, w: 11, h: 0.4, fontFace: FONT_H, fontSize: 16, color: BLACK, bold: true });
  s.addText(l.u, { x: 0.95, y: y + 0.4, w: 11, h: 0.4, fontFace: FONT_B, fontSize: 13, color: BLACK, italic: true });
  s.addText(l.d, { x: 0.95, y: y + 0.8, w: 11, h: 0.4, fontFace: FONT_B, fontSize: 11, color: GREY });
});

pageNum(s, 11);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 12 — Why It Wins
s = pres.addSlide();
s.background = { color: WHITE };
topLabel(s, "11  ·  WHY CONNECTED ARENA WINS");
divider(s, 0.6, 0.85, 12.1);

s.addText("Four reasons we stand out.", {
  x: 0.6, y: 1.2, w: 12.1, h: 0.8,
  fontFace: FONT_H, fontSize: 32, color: BLACK, bold: true,
});

const wins = [
  { n: "01", t: "Personal for every single fan", d: "Bedrock writes a unique reaction for each viewer based on their persona. Not one broadcast — thousands of individual conversations." },
  { n: "02", t: "Real ML built on real data", d: "Our Expected Goals model was trained on 57,000 actual shots from professional matches. Not a gimmick — a working AI feature." },
  { n: "03", t: "Truly real-time, no refreshing", d: "Events arrive the instant they happen using WebSockets. Predictions, chat, leaderboard — all live, no waiting." },
  { n: "04", t: "Built to handle millions", d: "100% serverless. Works for 10 fans or 10 million fans without changing a single line of code." },
];
wins.forEach((w, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 0.6 + col * 6.15;
  const y = 2.4 + row * 2.3;
  s.addText(w.n, { x, y, w: 1.0, h: 0.6, fontFace: FONT_H, fontSize: 28, color: BLACK, bold: true });
  s.addText(w.t, { x: x + 1.1, y, w: 4.9, h: 0.6, fontFace: FONT_B, fontSize: 16, color: BLACK, bold: true });
  s.addText(w.d, { x: x + 1.1, y: y + 0.7, w: 4.9, h: 1.5, fontFace: FONT_B, fontSize: 12, color: BLACK });
});

pageNum(s, 12);

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE 13 — Thank You
s = pres.addSlide();
s.background = { color: BLACK };

s.addText("Thank you.", {
  x: 0.6, y: 2.7, w: 12.1, h: 1.4,
  fontFace: FONT_H, fontSize: 80, color: WHITE, bold: true, italic: true,
});
s.addShape("rect", { x: 0.6, y: 4.1, w: 1.2, h: 0.03, fill: { color: WHITE }, line: { type: "none" } });

s.addText("Connected Arena", {
  x: 0.6, y: 4.3, w: 12.1, h: 0.5,
  fontFace: FONT_B, fontSize: 18, color: WHITE,
});
s.addText("AWS Sports AI Innovation Cup 2026 — Challenge 4", {
  x: 0.6, y: 4.75, w: 12.1, h: 0.4,
  fontFace: FONT_B, fontSize: 13, color: WHITE, italic: true,
});

s.addText("TEAM", {
  x: 0.6, y: 5.6, w: 4, h: 0.3,
  fontFace: FONT_B, fontSize: 10, color: WHITE, bold: true, charSpacing: 4,
});
s.addText([
  { text: "Carine UMUGABEKAZE  ·  ",   options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
  { text: "ISHIMWE Ami Paradis  ·  ",  options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
  { text: "CYUZUZO Pacifique",         options: { fontSize: 14, color: WHITE, fontFace: FONT_B } },
], { x: 0.6, y: 5.85, w: 12, h: 0.5 });

s.addText("d1706ex99mjina.cloudfront.net   ·   github.com/pacyuzu16/connected-arena", {
  x: 0.6, y: 6.85, w: 12.1, h: 0.3,
  fontFace: FONT_B, fontSize: 11, color: WHITE, italic: true, align: "right",
});

// ─────────────────────────────────────────────────────────────────────────────
const outPath = "C:/Users/Administrator/Desktop/connected_arena_presentation_v2.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("✓ Wrote:", outPath);
});
