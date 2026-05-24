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
  ArrowRight, PlayCircle, Zap, MessageSquare, Activity,
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
                <span>Free · Play on any phone or laptop</span>
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
                Predict every shot. Earn points. Climb the leaderboard.
                Chat with other fans while the match is actually happening —
                and find out what football feels like when you're in the game,
                not on the sofa.
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
                  <span>Watch-party mode</span>
                </Link>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="lp-hero-mini">
                <div className="lp-hero-mini-item">
                  <strong>Free to play</strong>
                  <span>No download. Just open and go.</span>
                </div>
                <div className="lp-hero-mini-divider" />
                <div className="lp-hero-mini-item">
                  <strong>Play with friends</strong>
                  <span>Create a squad, share a code, compete.</span>
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
              <span className="lp-trust-item">Real Bundesliga matches</span>
              <span className="lp-trust-divider" />
              <span className="lp-trust-item">Phone, tablet, laptop or TV</span>
              <span className="lp-trust-divider" />
              <span className="lp-trust-item">Live chat with fans worldwide</span>
              <span className="lp-trust-divider" />
              <span className="lp-trust-item">No account needed to start</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <Reveal>
            <div className="lp-section-head">
              <div className="lp-eyebrow">What you'll do</div>
              <h2 className="lp-h2">A football match, but you're in it</h2>
              <p className="lp-lead">
                Six things that make a regular match feel completely different. Nothing to install, nothing to learn.
              </p>
            </div>
          </Reveal>

          <div className="lp-features-grid">
            {[
              {
                Icon: Target, color: "#ea580c",
                title: "Call every shot",
                body: "Every shot, penalty and free kick gives you 10 seconds to predict what happens next. Get it right, earn points. Get a long-shot goal right? Three times the points.",
              },
              {
                Icon: Brain, color: "#7c3aed",
                title: "Commentary that matches your vibe",
                body: "Tell us how you watch — chilled, loud and dramatic, or all about the numbers. Every goal gets a reaction written just for you.",
              },
              {
                Icon: Sparkles, color: "#0891b2",
                title: "See which shots are dangerous",
                body: "A live bar shows how good every chance really is, before the keeper even reacts. Spot the goals nobody else saw coming.",
              },
              {
                Icon: UsersRound, color: "#059669",
                title: "Play with your friends",
                body: "Make a squad in seconds. Share a six-letter code with your mates. See who's actually the smartest football fan in your group chat.",
              },
              {
                Icon: Trophy, color: "#d97706",
                title: "Daily missions, real progression",
                body: "Quick missions reset every day. Climb from Rookie to Apex across five tiers. Unlock badges that show off the kind of fan you are.",
              },
              {
                Icon: Monitor, color: "#2563eb",
                title: "Throw a watch party",
                body: "Open one link on a TV or projector and your living room becomes a stadium. Massive scoreboard, top fans on the podium, goal alerts that fill the screen.",
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
              <h2 className="lp-h2">From opening the link to having a blast in three steps</h2>
              <p className="lp-lead">
                No tutorials, no setup, no homework. Just open it minutes before kick-off and you're in.
              </p>
            </div>
          </Reveal>

          <div className="lp-steps">
            {[
              { num: "01", title: "Open the site, pick a name", Icon: Zap,
                body: "Works on your phone, your laptop, even on the TV. Jump in as a guest or sign up to keep your points forever." },
              { num: "02", title: "Predict as the match plays", Icon: Activity,
                body: "When a shot or penalty kicks off, a quick 10-second window pops up. Tap YES or NO. See what other fans think while you wait." },
              { num: "03", title: "Climb, chat, beat your mates", Icon: Trophy,
                body: "Right answers earn points. Surprise goals earn triple. Chat with fans. Unlock badges. And finally settle who actually knows their football." },
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
              <div className="lp-eyebrow">Built around real moments</div>
              <h2 className="lp-h2">Quick. Loud. Slightly addictive.</h2>
            </div>
          </Reveal>

          <div className="lp-stats">
            {[
              { num: 10,  suffix: "s", label: "to lock in every prediction" },
              { num: 5,   suffix: "",  label: "tiers from Rookie to Apex" },
              { num: 12,  suffix: "",  label: "badges to unlock" },
              { num: 90,  suffix: "'", label: "minutes of pure matchday" },
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
              <div className="lp-eyebrow">Pick your vibe</div>
              <h2 className="lp-h2">One goal. Your reaction.</h2>
              <p className="lp-lead">
                Tell us how you watch and the live commentary shifts to match.
                Same goal, three completely different feeds — pick the one that
                actually sounds like you.
              </p>
            </div>
          </Reveal>

          <div className="lp-personas">
            {[
              { name: "Casual",     tagline: "Fun and friendly, quick takes.",
                quote: "What a finish! Hamburg are on fire tonight!",          color: "#0891b2" },
              { name: "Hyped",      tagline: "Loud, dramatic, full volume.",
                quote: "YESSS!! GET IN!! That's what we live for!",            color: "#dc2626" },
              { name: "Tactical",   tagline: "Numbers, angles, deep cuts.",
                quote: "Hamburg score from a tight angle — clinical finish.",  color: "#7c3aed" },
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
              <h2 className="lp-h2">Turn your living room into a stadium</h2>
              <p className="lp-lead">
                Open one link on a TV, projector or big monitor. A huge live scoreboard,
                the top fans on the podium, and dramatic goal alerts the moment something
                happens. Friends on the couch, phones in hand, all playing along together.
              </p>
              <div className="lp-checklist">
                {[
                  "Works on any TV, projector or big monitor",
                  "Goes fullscreen with one tap",
                  "Massive alerts when a goal hits the net",
                  "No login needed — just open the link",
                ].map((c) => (
                  <div key={c} className="lp-check-item">
                    <span className="lp-check-dot" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <Link href="/stadium" className="lp-btn-primary lp-btn-md">
                <Monitor size={16} strokeWidth={1.75} />
                <span>See watch-party mode</span>
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
                Free, instant, no install. Grab your phone, grab some friends,
                and turn the next match into something you'll actually remember.
              </p>
              <div className="lp-final-actions">
                <Link href="/app" className="lp-btn-primary lp-btn-lg">
                  <span>Start playing</span>
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <Link href="/stadium" className="lp-btn-ghost lp-btn-lg">
                  <Monitor size={16} strokeWidth={1.75} />
                  <span>Watch-party mode</span>
                </Link>
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
              <div className="lp-footer-sub">Watch football. Predict. Compete. Free, forever.</div>
            </div>
          </div>

          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Play</div>
              <Link href="/app">Open the arena</Link>
              <Link href="/stadium">Watch-party mode</Link>
              <Link href="/app#leaderboard">Live leaderboard</Link>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Explore</div>
              <a href="#features">What you'll do</a>
              <a href="#how">How it works</a>
              <a href="#stadium">Throw a watch party</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-head">Made by</div>
              <span>Carine UMUGABEKAZE</span>
              <span>ISHIMWE Ami Paradis</span>
              <span>CYUZUZO Pacifique</span>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom lp-container">
          <span>© 2026 Connected Arena · Made for football fans, by football fans</span>
          <Link href="/app">Start playing →</Link>
        </div>
      </footer>
    </div>
  );
}
