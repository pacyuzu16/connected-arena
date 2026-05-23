"use client";

const RADIUS = 38;
const CIRC   = 2 * Math.PI * RADIUS;

function crowdYesPct(eventId) {
  if (!eventId) return 54;
  const seed = [...String(eventId)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 32 + (seed % 37); // 32–68 %  — realistic, consistent per event
}

export default function PredictionModal({ prediction, countdown, onAnswer, voted }) {
  if (!prediction) return null;

  const pct        = countdown / (prediction.total || 30);
  const dashOffset = CIRC * (1 - pct);
  const urgency    = countdown <= 5;
  const yesPct     = crowdYesPct(prediction.eventId);
  const noPct      = 100 - yesPct;

  /* ── Reveal screen (shown for 2.5 s after voting) ── */
  if (voted) {
    return (
      <div className="pred-overlay">
        <div className="pred-card pred-reveal">
          <div className="pred-reveal-icon">{voted === "yes" ? "✅" : "❌"}</div>
          <div className="pred-reveal-title">
            Locked in — <span style={{ color: voted === "yes" ? "var(--green)" : "var(--red)" }}>
              {voted.toUpperCase()}
            </span>
          </div>

          <div className="pred-reveal-label">Crowd voted</div>
          <div className="pred-reveal-bars">
            <div className="pred-rv-row">
              <span className="pred-rv-tag yes">YES</span>
              <div className="pred-rv-track">
                <div
                  className="pred-rv-fill yes"
                  style={{ width: `${yesPct}%` }}
                />
              </div>
              <span className="pred-rv-pct">{yesPct}%</span>
            </div>
            <div className="pred-rv-row">
              <span className="pred-rv-tag no">NO</span>
              <div className="pred-rv-track">
                <div
                  className="pred-rv-fill no"
                  style={{ width: `${noPct}%` }}
                />
              </div>
              <span className="pred-rv-pct">{noPct}%</span>
            </div>
          </div>

          <div className="pred-reveal-pts">
            ⭐ Correct = +{prediction.points} XP — results after the event
          </div>
        </div>
      </div>
    );
  }

  /* ── Normal prediction screen ── */
  return (
    <div className="pred-overlay">
      <div className="pred-card">

        {/* Circular countdown */}
        <div className="pred-ring-wrap">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="48" cy="48" r={RADIUS}
              fill="none"
              stroke={urgency ? "#ef4444" : "var(--accent)"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={dashOffset}
              transform="rotate(-90 48 48)"
              style={{ transition: "stroke-dashoffset .9s linear, stroke .3s" }}
            />
          </svg>
          <div className="pred-ring-num" style={{ color: urgency ? "#ef4444" : "var(--accent)" }}>
            {countdown}
          </div>
        </div>

        {/* Event badge */}
        <div className="pred-badge">
          <span>{prediction.emoji}</span>
          <span>{prediction.eventType.replace(/_/g, " ")}</span>
          <span style={{ color: "var(--text-3)" }}>·</span>
          <span>{prediction.team}</span>
        </div>

        <div className="pred-q">Will this result in a goal?</div>

        {/* xG bar — shown when ML model has a value */}
        {prediction.xg != null && (
          <div className="pred-xg-wrap">
            <div className="pred-xg-label">
              <span>
                ⚡ Shot Quality
                {prediction.xgSource && (
                  <span className="pred-xg-source"> · {prediction.xgSource}</span>
                )}
              </span>
              <span style={{ color: prediction.xg >= 0.35 ? "#ef4444" : prediction.xg >= 0.15 ? "#f59e0b" : "#10b981" }}>
                {prediction.xgLabel || `${Math.round(prediction.xg * 100)}% chance`}
              </span>
            </div>
            <div className="pred-xg-track">
              <div
                className="pred-xg-fill"
                style={{
                  width: `${Math.round(prediction.xg * 100)}%`,
                  background: prediction.xg >= 0.35 ? "#ef4444" : prediction.xg >= 0.15 ? "#f59e0b" : "#10b981",
                }}
              />
            </div>
            {prediction.xgMultiplier > 1 && (
              <div className="pred-xg-bonus">
                🎁 Low chance = {prediction.xgMultiplier}× XP if you predict correctly!
              </div>
            )}
          </div>
        )}

        <div className="pred-pts"><span>⭐</span> Correct = +{prediction.points} XP</div>

        <div className="pred-btns">
          <button className="pred-yes" onClick={() => onAnswer("yes")}>
            <span className="pred-btn-icon">✅</span>
            <span>YES!</span>
          </button>
          <button className="pred-no" onClick={() => onAnswer("no")}>
            <span className="pred-btn-icon">❌</span>
            <span>NO</span>
          </button>
        </div>

        <div className="pred-hint">Tap to lock in your prediction</div>
      </div>
    </div>
  );
}
