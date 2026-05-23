"use client";

import { useState } from "react";
import { PERSONAS } from "../utils/constants";

export default function JoinScreen({ onJoin, cognitoName }) {
  const [playerName, setPlayerName] = useState(cognitoName || "");
  const [persona, setPersona]       = useState("casual");

  const handleJoin = () => {
    if (playerName.trim()) onJoin(playerName.trim(), persona);
  };

  return (
    <div className="join-wrap">
      <div className="join-card">
        <div className="join-logo">🏟️</div>
        <h1 className="join-title">Connected Arena</h1>
        <p className="join-sub">Real-time multiplayer fan engagement</p>

        <div className="f-group">
          <label className="f-label">Your name</label>
          <input
            className="f-input"
            placeholder="e.g. FanKing99"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
          />
        </div>

        <div className="f-group">
          <label className="f-label">Fan persona</label>
          <div className="persona-grid">
            {PERSONAS.map(p => (
              <button
                key={p.value}
                className={`persona-btn${persona === p.value ? " active" : ""}`}
                onClick={() => setPersona(p.value)}
              >
                <span className="persona-em">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button className="join-btn" onClick={handleJoin} disabled={!playerName.trim()}>
          Join the Arena →
        </button>
      </div>
    </div>
  );
}
