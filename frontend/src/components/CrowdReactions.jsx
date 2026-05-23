"use client";

import { useState, useEffect, useRef } from "react";

const REACTIONS = [
  { emoji: "🔥", label: "Fire",  seed: 247 },
  { emoji: "👏", label: "Clap",  seed: 122 },
  { emoji: "😮", label: "Wow",   seed:  89 },
  { emoji: "🙌", label: "Hype",  seed: 311 },
];

export default function CrowdReactions({ events }) {
  const [counts, setCounts] = useState(REACTIONS.map(r => r.seed));
  const [bursts, setBursts] = useState([null, null, null, null]);
  const prevEventCount = useRef(0);

  // Slow organic drift every 4-7 seconds
  useEffect(() => {
    const tick = () => {
      setCounts(prev => prev.map(c => c + Math.floor(Math.random() * 3)));
    };
    const id = setInterval(tick, 4500 + Math.random() * 2500);
    return () => clearInterval(id);
  }, []);

  // Spike reactions on GOAL events
  useEffect(() => {
    if (!events?.length) return;
    const goalsSeen = events.filter(e => e.type === "GOAL").length;
    if (goalsSeen > prevEventCount.current) {
      prevEventCount.current = goalsSeen;
      setCounts(prev => prev.map(c => c + 15 + Math.floor(Math.random() * 20)));
    }
  }, [events]);

  const handleClick = (i) => {
    setCounts(prev => prev.map((c, idx) => idx === i ? c + 1 : c));
    setBursts(prev => prev.map((_, idx) => idx === i ? Date.now() : _));
    setTimeout(() => setBursts(prev => prev.map((v, idx) => idx === i ? null : v)), 600);
  };

  return (
    <div className="reactions-wrap">
      <div className="reactions-title">Crowd Reactions</div>
      <div className="reactions-row">
        {REACTIONS.map((r, i) => (
          <button
            key={r.label}
            className={`reaction-btn${bursts[i] ? " burst" : ""}`}
            onClick={() => handleClick(i)}
          >
            <span className="reaction-emoji">{r.emoji}</span>
            <span className="reaction-count">{counts[i].toLocaleString()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
