"use client";
/**
 * LandingPage — premium, human-centred homepage for Connected Arena.
 *
 * Sections (in order):
 *   1. Top navigation (sticky, blurred on scroll)
 *   2. Hero  — headline + dual CTAs + animated card mockup
 *   3. Trust strip — context line
 *   4. Features grid — six rich cards
 *   5. How it works — three numbered steps
 *   6. Stats counters — animated count-up
 *   7. Personas — Casual / Passionate / Stats Nerd
 *   8. Stadium / watch-party preview (split layout)
 *   9. Final CTA banner
 *  10. Footer (team + links)
 *
 * Notes:
 *   - All routes use Next.js Link for client navigation.
 *   - Animations use IntersectionObserver (zero deps).
 *   - Mobile-first responsive, scales up.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Trophy, Brain, Sparkles, UsersRound, Target, Monitor,
  ArrowRight, PlayCircle, Code2, Zap, MessageSquare, Activity,
} from "lucide-react";

/* ── Reveal-on-scroll wrapper (zero dependencies) ──────────────────── */
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Animated count-up for the stats section ──────────────────────── */
function CountUp({ to, suffix = "", duration = 1400 }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        const start = performance.now();
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          setVal(Math.round(to * ease(t)));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Live-feel hero mockup: a stack of three real UI cards ────────── */
function HeroMockup() {
  return (
    <div className="lp-hero-mockup" aria-hidden="true">
      {/* Card 1: prediction window */}
      <div className="lp-mock-card lp-mock-pred">
        <div className="lp-mock-pred-meta">
          <div className="lp-mock-pred-tag">SHOT · BAYERN · 78'</div>
          <div className="lp-mock-pred-countdown">
            <svg width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="#ea580c" strokeWidth="3"
                strokeDasharray="94" strokeDashoffset="32" strokeLinecap="round"
                transform="rotate(-90 18 18)" />
            </svg>
            <span>7</span>
          </div>
        </div>
        <div className="lp-mock-pred-q">Will this become a goal?</div>
        <div className="lp-mock-pred-xg">
          <div className="lp-mock-pred-xg-bar">
            <span className="lp-mock-pred-xg-fill" />
          </div>
          <div className="lp-mock-pred-xg-meta">
            <span>ML shot quality</span>
            <strong>34%</strong>
          </div>
        </div>
        <div className="lp-mock-pred-btns">
          <button className="lp-mock-pred-yes">YES</button>
          <button className="lp-mock-pred-no">NO</button>
        </div>
      </div>

      {/* Card 2: leaderboard */}
      <div className="lp-mock-card lp-mock-lb">
        <div className="lp-mock-lb-hdr">
          <Trophy size={14} strokeWidth={1.75} />
          <span>Top fans</span>
          <span className="lp-mock-lb-tag">LIVE</span>
        </div>
        {[
          { rank: 1, name: "Carine U.",    xp: 2450, acc: 78 },
          { rank: 2, name: "Ami Paradis",  xp: 2180, acc: 71 },
          { rank: 3, name: "Pacifique C.", xp: 1960, acc: 69 },
        ].map((p) => (
          <div key={p.rank} className="lp-mock-lb-row">
            <span className="lp-mock-lb-rank">{p.rank}</span>
            <span className="lp-mock-lb-name">{p.name}</span>
            <span className="lp-mock-lb-acc">{p.acc}%</span>
            <span className="lp-mock-lb-xp">{p.xp.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Card 3: chat */}
      <div className="lp-mock-card lp-mock-chat">
        <div className="lp-mock-chat-hdr">
          <MessageSquare size={14} strokeWidth={1.75} />
          <span>Live chat</span>
          <span className="lp-mock-chat-dot" />
        </div>
        <div className="lp-mock-chat-msg lp-mock-chat-other">
          <div className="lp-mock-chat-avatar" style={{ background: "#7c3aed" }}>A</div>
          <div>
            <div className="lp-mock-chat-name">Ami</div>
            <div className="lp-mock-chat-bubble">What a save!!</div>
          </div>
        </div>
        <div className="lp-mock-chat-msg lp-mock-chat-me">
          <div>
            <div className="lp-mock-chat-name">You · +5 XP</div>
            <div className="lp-mock-chat-bubble lp-mock-chat-bubble-me">Counter attack incoming…</div>
          </div>
        </div>
      </div>

      <div className="lp-hero-glow" />
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when navigating away (route change via Link)
  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="lp">

      {/* ══════════════ NAV ══════════════ */}
      <header className={`lp-nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="lp-container lp-nav-inner">
          <Link href="/" className="lp-nav-brand" onClick={() => setMobileOpen(false)}>
            <span className="lp-nav-mark">CA</span>
            <span className="lp-nav-title">Connected Arena</span>
          </Link>

          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#stadium">Stadium</a>
            <Link href="/admin" className="lp-nav-sub">Admin</Link>
          </nav>

          <div className="lp-nav-actions">
            <Link href="/app" className="lp-btn-ghost lp-nav-signin">Sign in</Link>
            <Link href="/app" className="lp-btn-primary lp-nav-cta">
              <span>Get started</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          <button
            className="lp-nav-burger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {mobileOpen && (
          <div className="lp-nav-mobile">
            <a href="#features"    onClick={() => setMobileOpen(false)}>Features</a>
            <a href="#how"         onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#stadium"     onClick={() => setMobileOpen(false)}>Stadium</a>
            <Link href="/admin"    onClick={() => setMobileOpen(false)}>Admin</Link>
            <div className="lp-nav-mobile-divider" />
            <Link href="/app" className="lp-btn-primary lp-btn-block" onClick={() => setMobileOpen(false)}>
              <span>Get started</span>
              <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        )}
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-text">
            <Reveal>
              <div className="lp-pill">
                <span className="lp-pill-dot" />
                <span>Built on AWS · Live for Bundesliga 25/26</span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="lp-h1">
                Football you don't just watch.<br/>
                <span className="lp-h1-accent">You compete in it.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="lp-hero-sub">
                Predict every shot, penalty and turning point as it happens.
                Earn XP. Climb the leaderboard. Argue with friends in live chat —
                all powered by real Bundesliga match data and an AI commentator
                that adapts to how you watch.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="lp-hero-ctas">
                <Link href="/app" className="lp-btn-primary lp-btn-lg">
                  <span>Start playing</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <Link href="/stadium" className="lp-btn-ghost lp-btn-lg">
                  <PlayCircle size={16} strokeWidth={1.75} />
                  <span>Open stadium view</span>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="lp-hero-mini">
                <div className="lp-hero-mini-item">
                  <strong>Free to play</strong>
                  <span>No download. Works on any browser.</span>
                </div>
                <div className="lp-hero-mini-divider" />
                <div className="lp-hero-mini-item">
                  <strong>Real ML</strong>
                  <span>xG model trained on 57k professional shots.</span>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={200} className="lp-hero-visual">
            <HeroMockup />
          </Reveal>
        </div>
      </section>

      {/* ══════════════ TRUST STRIP ══════════════ */}
      <section className="lp-trust">
        <div className="lp-container">
          <Reveal>
            <div className="lp-trust-row">
              <span className="lp-trust-label">Built for</span>
              <span className="lp-trust-item">AWS Sports AI Innovation Cup 2026</span>
              <span className="lp-trust-divider" />
              <span className="lp-trust-item">Challenge 4 · Real-time multiplayer fan engagement</span>
              <span className="lp-trust-divider" />
              <span className="lp-trust-item">Bundesliga open data · StatsBomb</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">Features</div>
              <h2 className="lp-h2">Built for the way fans actually watch</h2>
              <p className="lp-lead">
                Six features that turn a 90-minute match into something you don't put your phone down for.
              </p>
            </div>
          </Reveal>

          <div className="lp-features-grid">
            {[
              {
                Icon: Target, color: "#ea580c",
                title: "Live predictions in 10 seconds",
                body: "Every shot, penalty and free kick triggers a YES/NO question with a real countdown. Correct picks earn XP. Surprise goals reward triple.",
              },
              {
                Icon: Brain, color: "#7c3aed",
                title: "AI commentary that knows you",
                body: "Amazon Bedrock writes a unique reaction for every fan based on their persona — casual, passionate, or stats nerd. Same goal, totally different feed.",
              },
              {
                Icon: Sparkles, color: "#0891b2",
                title: "Real machine-learning xG",
                body: "Our Expected Goals model — trained on 57,000 shots across 1,569 professional matches — runs on every shot so you see the real probability live.",
              },
              {
                Icon: UsersRound, color: "#059669",
                title: "Friend squads & mini-leagues",
                body: "Create a squad in seconds. Share a 6-character code. Compete on a private leaderboard alongside the global one.",
              },
              {
                Icon: Trophy, color: "#d97706",
                title: "Daily missions & progression",
                body: "Five missions reset every day. Climb five tiers from Rookie to Apex. Unlock twelve achievements as you play.",
              },
              {
                Icon: Monitor, color: "#2563eb",
                title: "Stadium / watch-party mode",
                body: "A separate big-screen view for TVs and projectors. Massive scoreboard, top-3 podium, goal splashes — perfect for watch parties.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <article className="lp-feature">
                  <div className="lp-feature-icon" style={{ color: f.color, background: `${f.color}15` }}>
                    <f.Icon size={22} strokeWidth={1.75} />
                  </div>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-body">{f.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how" className="lp-section lp-section-alt">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">How it works</div>
              <h2 className="lp-h2">From kickoff to climbing the ranks in three steps</h2>
              <p className="lp-lead">
                No tutorials, no setup. Open the site, pick a name, and the match is already playing alongside you.
              </p>
            </div>
          </Reveal>

          <div className="lp-steps">
            {[
              { num: "01", title: "Open the site", Icon: Zap,
                body: "Works on phone, tablet, PC, or projected on a TV. Continue as a guest or sign up to keep your XP across devices." },
              { num: "02", title: "Predict as the match unfolds", Icon: Activity,
                body: "When a shot or penalty fires, a 10-second window opens. Tap YES or NO. See the crowd's vote and the ML model's xG estimate." },
              { num: "03", title: "Climb, chat, compete", Icon: Trophy,
                body: "Right answers earn XP. Surprise goals earn triple. Chat with fans in real time. Unlock badges. Beat your friends in your squad." },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 120}>
                <div className="lp-step">
                  <div className="lp-step-num">{s.num}</div>
                  <div className="lp-step-icon"><s.Icon size={20} strokeWidth={1.75} /></div>
                  <h3 className="lp-step-title">{s.title}</h3>
                  <p className="lp-step-body">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="lp-section">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">The numbers behind it</div>
              <h2 className="lp-h2">Not a demo — a working platform</h2>
            </div>
          </Reveal>

          <div className="lp-stats">
            {[
              { num: 57763, suffix: "",  label: "Shots used to train our xG model" },
              { num: 1569,  suffix: "",  label: "Professional matches analysed" },
              { num: 8,     suffix: "",  label: "AWS services in production" },
              { num: 100,   suffix: "%", label: "Serverless. From 10 fans to 10 M." },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 80}>
                <div className="lp-stat">
                  <div className="lp-stat-num"><CountUp to={s.num} suffix={s.suffix} /></div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PERSONAS ══════════════ */}
      <section className="lp-section lp-section-alt">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head lp-section-head-left">
              <div className="lp-eyebrow">Personalised AI</div>
              <h2 className="lp-h2">One goal. Three reactions. Powered by Bedrock.</h2>
              <p className="lp-lead">
                Pick the persona that matches how you watch. Bedrock writes a unique commentary message
                for every fan, every event. Casual viewers, loud die-hards and data nerds all get
                something completely different.
              </p>
            </div>
          </Reveal>

          <div className="lp-personas">
            {[
              { name: "Casual",     tagline: "Fun, friendly, short. With emojis.",
                quote: "What a finish! Hamburg are on fire tonight!",          color: "#0891b2" },
              { name: "Passionate", tagline: "Loud, dramatic, all-caps energy.",
                quote: "YESSS!! GET IN!! That's what we live for!",            color: "#dc2626" },
              { name: "Stats nerd", tagline: "Numbers, tactics, ML talk.",
                quote: "Hamburg score from an xG of 0.34 — clinical conversion.", color: "#7c3aed" },
            ].map((p, i) => (
              <Reveal key={p.name} delay={i * 80}>
                <div className="lp-persona" style={{ borderTopColor: p.color }}>
                  <div className="lp-persona-name" style={{ color: p.color }}>{p.name}</div>
                  <div className="lp-persona-tagline">{p.tagline}</div>
                  <div className="lp-persona-quote">"{p.quote}"</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ STADIUM PREVIEW ══════════════ */}
      <section id="stadium" className="lp-section">
        <div className="lp-container">
          <div className="lp-split">
            <Reveal className="lp-split-text">
              <div className="lp-eyebrow">Watch-party mode</div>
              <h2 className="lp-h2">Project it on the big screen</h2>
              <p className="lp-lead">
                Open <code className="lp-code">/stadium</code> on any TV or projector. A huge live
                scoreboard, top-3 podium, rolling event ticker, and a full-screen splash whenever
                a goal hits the net. No login required.
              </p>
              <div className="lp-checklist">
                {[
                  "Designed for landscape 1920×1080 and beyond",
                  "Fullscreen toggle for kiosks and bars",
                  "Goal / penalty / VAR splash overlays",
                  "Updates over the same live WebSocket as the app",
                ].map((c) => (
                  <div key={c} className="lp-check-item">
                    <span className="lp-check-dot" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <Link href="/stadium" className="lp-btn-primary lp-btn-md">
                <Monitor size={16} strokeWidth={1.75} />
                <span>Open stadium view</span>
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </Reveal>

            <Reveal delay={120} className="lp-split-visual">
              <div className="lp-stadium-mock">
                <div className="lp-stadium-mock-bar">
                  <span className="lp-stadium-mock-mark">CA</span>
                  <span className="lp-stadium-mock-live">
                    <span className="lp-stadium-mock-dot" /> LIVE · 247 FANS
                  </span>
                </div>
                <div className="lp-stadium-mock-score">
                  <div>
                    <div className="lp-stadium-mock-team">HAM</div>
                    <div className="lp-stadium-mock-team-sub">HAMBURG</div>
                  </div>
                  <div className="lp-stadium-mock-num">2 — 1</div>
                  <div>
                    <div className="lp-stadium-mock-team">BAY</div>
                    <div className="lp-stadium-mock-team-sub">BAYERN</div>
                  </div>
                </div>
                <div className="lp-stadium-mock-podium">
                  {["A", "C", "P"].map((c, i) => (
                    <div key={i} className={`lp-stadium-mock-pod lp-stadium-mock-pod-${i+1}`}>
                      <div className="lp-stadium-mock-avatar">{c}</div>
                      <div className="lp-stadium-mock-xp">{[2450,2180,1960][i].toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="lp-stadium-mock-ticker">
                  <strong>GOAL</strong> · HAMBURG <span>· 2s ago</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="lp-section">
        <div className="lp-container">
          <Reveal>
            <div className="lp-final-cta">
              <h2 className="lp-final-title">Ready to feel the match?</h2>
              <p className="lp-final-sub">
                Free, instant, no install. Open it on your phone for the next Bundesliga kickoff
                and find out what football feels like when you're actually in it.
              </p>
              <div className="lp-final-actions">
                <Link href="/app" className="lp-btn-primary lp-btn-lg">
                  <span>Enter the arena</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <a
                  href="https://github.com/pacyuzu16/connected-arena"
                  target="_blank" rel="noopener noreferrer"
                  className="lp-btn-ghost lp-btn-lg"
                >
                  <Code2 size={16} strokeWidth={1.75} />
                  <span>View source</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <span className="lp-nav-mark">CA</span>
            <div>
              <div className="lp-footer-title">Connected Arena</div>
              <div className="lp-footer-sub">A real-time multiplayer fan engagement platform.</div>
            </div>
          </div>

          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Product</div>
              <Link href="/app">Fan app</Link>
              <Link href="/stadium">Stadium view</Link>
              <Link href="/admin">Admin console</Link>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Team</div>
              <span>Carine UMUGABEKAZE</span>
              <span>ISHIMWE Ami Paradis</span>
              <span>CYUZUZO Pacifique</span>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Tech</div>
              <span>AWS Lambda · DynamoDB</span>
              <span>API Gateway · WebSockets</span>
              <span>Amazon Bedrock · Cognito</span>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom lp-container">
          <span>© 2026 Connected Arena · AWS Sports AI Innovation Cup, Challenge 4</span>
          <a href="https://github.com/pacyuzu16/connected-arena" target="_blank" rel="noopener noreferrer">
            github.com/pacyuzu16/connected-arena
          </a>
        </div>
      </footer>
    </div>
  );
}
