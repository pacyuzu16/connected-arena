"use client";

import { getTier } from "../utils/constants";

export const ACHIEVEMENTS = [
  { id: "first_pred",      icon: "🎯", name: "First Step",       desc: "Made your first prediction",         check: p => (p.predictions||0) >= 1 },
  { id: "5_correct",       icon: "⭐", name: "Prediction Pro",   desc: "5+ correct predictions",             check: p => (p.correct||0) >= 5 },
  { id: "sniper",          icon: "🎖️", name: "Sniper",           desc: "Reached 70%+ accuracy",              check: p => (p.accuracy||0) >= 70 },
  { id: "on_fire",         icon: "🔥", name: "On Fire",          desc: "3+ consecutive correct picks",       check: p => (p.winStreak||0) >= 3 },
  { id: "unstoppable",     icon: "⚡", name: "Unstoppable",      desc: "5+ win streak",                      check: p => (p.winStreak||0) >= 5 },
  { id: "level3",          icon: "🚀", name: "Rising Star",      desc: "Reached Level 3",                    check: p => (p.level||1) >= 3 },
  { id: "goal_hunter",     icon: "⚽", name: "Goal Hunter",      desc: "Predicted 10+ goals correctly",      check: p => (p.correct||0) >= 10 },
  { id: "pred_king",       icon: "🏆", name: "Prediction King",  desc: "85%+ accuracy with 10+ predictions", check: p => (p.accuracy||0) >= 85 && (p.predictions||0) >= 10 },
  { id: "consistent",      icon: "📊", name: "Consistent",       desc: "50%+ accuracy across 20+ picks",     check: p => (p.predictions||0) >= 20 && (p.accuracy||0) >= 50 },
  { id: "century",         icon: "💯", name: "Century",          desc: "100+ total predictions",              check: p => (p.predictions||0) >= 100 },
  { id: "apex_analyst",    icon: "🌟", name: "Apex Analyst",     desc: "Reached APEX tier (1000+ XP)",       check: p => (p.score||0) >= 1000 },
  { id: "legend",          icon: "👑", name: "Legend",           desc: "Reached Level 5 — 1000+ XP",         check: p => (p.level||1) >= 5 },
];

const PERSONA = {
  casual:     { icon: "😎", label: "Casual Fan" },
  passionate: { icon: "🔥", label: "Passionate Fan" },
  stats_nerd: { icon: "📊", label: "Stats Nerd" },
};

const LEVEL_COLOR = ["", "#64748b", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000];
const LEVEL_RANGES     = [100, 100, 200, 300, 400, 400];

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function levelProgress(score, lvl) {
  if (lvl >= 5) return 100;
  const base  = LEVEL_THRESHOLDS[lvl] || 0;
  const range = LEVEL_RANGES[lvl]     || 400;
  return Math.min(100, Math.max(0, Math.round(((score - base) / range) * 100)));
}

export default function ProfilePanel({ player, recentActivity = [], onClose, inline = false }) {
  if (!player) return null;

  const persona  = PERSONA[player.persona] || PERSONA.casual;
  const lvl      = player.level || 1;
  const tier     = getTier(player.score || 0);
  const accColor = player.accuracy >= 70 ? "#10b981" : player.accuracy >= 45 ? "#f59e0b" : "#ef4444";
  const unlocked = ACHIEVEMENTS.filter(a => a.check(player));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(player));
  const progress = levelProgress(player.score || 0, lvl);

  const inner = (
    <>
        {/* Avatar + identity */}
        <div
          className="profile-avatar"
          style={{ background: LEVEL_COLOR[lvl], boxShadow: `0 0 24px ${LEVEL_COLOR[lvl]}55` }}
        >
          {(player.name || "?")[0].toUpperCase()}
        </div>
        <div className="profile-name">{player.name}</div>
        <div className="profile-tier-badge" style={{ color: tier.color, background: tier.bg, borderColor: tier.color + "44" }}>
          {tier.label}
        </div>
        <div className="profile-persona-badge">
          <span>{persona.icon}</span> {persona.label}
        </div>
        {player.rank && (
          <div className="profile-rank-tag">#ARENA_RANK_{String(player.rank).padStart(3,"0")}</div>
        )}
        {(player.winStreak||0) >= 3 && (
          <div className="profile-hot-streak">🔥 HOT STREAK — {player.winStreak} wins in a row</div>
        )}
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-val" style={{ color: accColor }}>
              {(player.predictions||0) > 0 ? Math.round(((player.correct||0)/(player.predictions||1))*100) : 0}%
            </div>
            <div className="profile-stat-lbl">Win Rate</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val" style={{ color: accColor }}>{player.accuracy||0}%</div>
            <div className="profile-stat-lbl">Accuracy</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val" style={{ color: "var(--accent)" }}>
              {player.score ? (player.score >= 1000 ? `${(player.score/1000).toFixed(1)}k` : player.score) : 0}
            </div>
            <div className="profile-stat-lbl">Arena Points</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-val">
              {(player.winStreak||0) >= 3
                ? <span style={{ color:"#f97316" }}>🔥 {player.winStreak}</span>
                : player.winStreak || 0}
            </div>
            <div className="profile-stat-lbl">Streak</div>
          </div>
        </div>
        <div className="profile-xp"><span>⭐</span><span>{player.score || 0} XP</span></div>
        <div className="profile-level-row">
          <span style={{ fontSize:11, color:"var(--text-3)" }}>
            {lvl >= 5 ? "Max level reached!" : `Next level at ${LEVEL_THRESHOLDS[lvl+1]} XP`}
          </span>
          <div className="profile-level-bar">
            <div style={{ width:`${progress}%`, height:"100%", background:LEVEL_COLOR[lvl], borderRadius:3, transition:"width .5s" }} />
          </div>
        </div>
        <div className="profile-section-title" style={{ marginTop:24 }}>
          Achievements
          <span className="profile-badge-count">{unlocked.length}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="profile-achievements">
          {unlocked.map(a => (
            <div key={a.id} className="achievement unlocked" title={a.desc}>
              <div className="achievement-icon">{a.icon}</div>
              <div className="achievement-name">{a.name}</div>
            </div>
          ))}
          {locked.map(a => (
            <div key={a.id} className="achievement" title={a.desc}>
              <div className="achievement-icon">🔒</div>
              <div className="achievement-name">{a.name}</div>
            </div>
          ))}
        </div>
        {recentActivity.length > 0 && (
          <>
            <div className="profile-section-title" style={{ marginTop:8 }}>Recent Activity</div>
            <div className="profile-activity">
              {recentActivity.slice(0,5).map(a => (
                <div key={a.id} className="profile-activity-row">
                  <span className="pact-emoji">{a.emoji}</span>
                  <div className="pact-info">
                    <span className="pact-type">{a.eventType.replace(/_/g," ")}</span>
                    <span className="pact-time">{Math.floor((Date.now()-a.time)/1000)}s ago</span>
                  </div>
                  <span className="pact-result">{a.correct ? "✅" : "❌"}</span>
                  {a.xp > 0 && <span className="pact-xp">+{a.xp} XP</span>}
                </div>
              ))}
            </div>
          </>
        )}
    </>
  );

  if (inline) return <div className="profile-panel-inline">{inner}</div>;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={e => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>
        {inner}
      </div>
    </div>
  );
}
