"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

function useCountUp(target, duration, active) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let cur = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [active, target, duration]);
  return val;
}

const FEATURES = [
  { icon: "⚡", label: "Instant Predictions", desc: "YES/NO on every shot, corner, and free kick with a live countdown timer." },
  { icon: "🤖", label: "AI Commentary",       desc: "Amazon Bedrock writes you a personal match story based on your fan persona." },
  { icon: "🏆", label: "Live Leaderboard",    desc: "Earn XP for correct calls and climb the global rank in real time." },
];

const STEPS = [
  { n: "1", icon: "🏟️", title: "Join",    desc: "Create an account or continue as guest. Pick your persona." },
  { n: "2", icon: "🎯", title: "Predict", desc: "Make fast YES/NO calls on live events before the countdown hits zero." },
  { n: "3", icon: "🏆", title: "Win",     desc: "Earn XP, unlock achievements, rise on the global leaderboard." },
];

export default function LandingPage({ onStart }) {
  const [statsOn, setStatsOn] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsOn(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const fans     = useCountUp(8245, 1800, statsOn);
  const accuracy = useCountUp(92,   1200, statsOn);
  const latency  = useCountUp(14,    800, statsOn);

  return (
    <div className="lp-wrap">
      <Navbar onStart={onStart} showPlayBtn={true} />

      {/* ── Hero ── */}
      <div className="lp-hero-section">
        <div className="lp-hero">
          <div className="lp-badge">⚽ Hamburg vs Bayern · Live Now</div>
          <h1 className="lp-title">
            Watch Together.<br />
            <span className="lp-gradient-text">Predict &amp; Win.</span>
          </h1>
          <p className="lp-subtitle">
            Make real-time predictions on live match events, earn XP, and compete
            against thousands of fans — powered by Amazon Bedrock AI.
          </p>
          <div className="lp-cta-group">
            <button className="lp-btn-primary" onClick={onStart}>
              Enter the Arena <span className="lp-arrow">→</span>
            </button>
            <a href="#how" className="lp-btn-secondary">How it works</a>
          </div>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="lp-stats-bar" ref={statsRef}>
        <div className="lp-stat-item">
          <div className="lp-stat-val">{fans.toLocaleString()}+</div>
          <div className="lp-stat-lbl">Fans Connected</div>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat-item">
          <div className="lp-stat-val">{accuracy}%</div>
          <div className="lp-stat-lbl">Top Accuracy</div>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat-item">
          <div className="lp-stat-val">{latency}ms</div>
          <div className="lp-stat-lbl">Avg Latency</div>
        </div>
      </div>

      {/* ── Features ── */}
      <div id="features" className="lp-section-wrap">
        <div className="lp-section">
          <div className="lp-section-badge">What you get</div>
          <h2 className="lp-section-title">Built for the moment</h2>
          <div className="lp-features-3">
            {FEATURES.map(f => (
              <div key={f.label} className="lp-feat-card">
                <div className="lp-feat-icon">{f.icon}</div>
                <h3>{f.label}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div id="how" className="lp-section-wrap lp-alt">
        <div className="lp-section">
          <div className="lp-section-badge">Quick start</div>
          <h2 className="lp-section-title">Three steps</h2>
          <div className="lp-steps-3">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="lp-step-3">
                  <div className="lp-step-num">{s.n}</div>
                  <div className="lp-step-icon-3">{s.icon}</div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="lp-step-arrow-3">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="lp-cta-final-wrap">
        <div className="lp-cta-final">
          <h2 className="lp-cta-final-title">Ready?</h2>
          <p className="lp-cta-final-sub">Free to join. XP saved across every session.</p>
          <button className="lp-btn-primary lp-btn-lg" onClick={onStart}>
            Enter the Arena <span className="lp-arrow">→</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
