"use client";

import { useRef, useState } from "react";
import { getTier } from "../utils/constants";
import { ACHIEVEMENTS } from "./ProfilePanel";
import SettingsPanel from "./SettingsPanel";

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

export default function MobileProfileTab({ player, recentActivity = [], avatarUrl, onAvatarChange, onNameChange, theme, toggleTheme, onLeave, settings, updateSettings, resetSettings }) {
  const fileRef = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(player.name || "");
  const lvl     = player.level || 1;
  const tier    = getTier(player.score || 0);
  const unlocked = ACHIEVEMENTS.filter(a => a.check(player));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(player));
  const progress = levelProgress(player.score || 0, lvl);
  const accColor = (player.accuracy || 0) >= 70 ? "#10b981" : (player.accuracy || 0) >= 45 ? "#f59e0b" : "#ef4444";

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      localStorage.setItem(`arena-avatar-${player.name}`, b64);
      onAvatarChange(b64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="profile-tab-wrap">

      {/* ── Avatar + identity ── */}
      <div className="profile-tab-header">
        <div className="profile-tab-avatar-wrap">
          {avatarUrl
            ? <img src={avatarUrl} className="profile-tab-avatar-img" alt="avatar" />
            : <div className="profile-tab-avatar" style={{ background: LEVEL_COLOR[lvl] }}>
                {(player.name || "?")[0].toUpperCase()}
              </div>
          }
          <button className="profile-tab-camera" onClick={() => fileRef.current?.click()} title="Change photo">
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
        <div className="profile-tab-identity">
          <div className="profile-tab-name">{player.name}</div>
          <div className="profile-tab-tier" style={{ color: tier.color, background: tier.bg }}>{tier.label}</div>
          <div className="profile-tab-xp">⭐ {player.score || 0} XP · Lv.{lvl}</div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="profile-tab-stats">
        {[
          { val: `${player.accuracy || 0}%`,                          lbl: "Accuracy",   color: accColor },
          { val: `${player.correct || 0}/${player.predictions || 0}`, lbl: "Correct",    color: null },
          { val: player.winStreak >= 3 ? `🔥${player.winStreak}` : (player.winStreak || 0), lbl: "Streak", color: player.winStreak >= 3 ? "#f97316" : null },
          { val: player.score || 0,                                   lbl: "Total XP",   color: "var(--accent)" },
        ].map(s => (
          <div key={s.lbl} className="profile-tab-stat">
            <div className="profile-tab-stat-val" style={s.color ? { color: s.color } : {}}>{s.val}</div>
            <div className="profile-tab-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── XP level bar ── */}
      <div className="profile-tab-level-wrap">
        <span className="profile-tab-level-lbl">
          {lvl >= 5 ? "Max level reached!" : `${player.score || 0} / ${LEVEL_THRESHOLDS[lvl + 1]} XP to Lv.${lvl + 1}`}
        </span>
        <div className="profile-tab-level-bar">
          <div style={{ width: `${progress}%`, height: "100%", background: LEVEL_COLOR[lvl], borderRadius: 3, transition: "width .5s" }} />
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="profile-tab-section-hdr">
        Achievements
        <span className="profile-tab-badge-count">{unlocked.length}/{ACHIEVEMENTS.length}</span>
      </div>
      <div className="profile-tab-achievements">
        {[...unlocked, ...locked].map(a => {
          const isUnlocked = unlocked.includes(a);
          return (
            <div key={a.id} className={`achievement${isUnlocked ? " unlocked" : ""}`} title={a.desc}>
              <div className="achievement-icon">{isUnlocked ? a.icon : "🔒"}</div>
              <div className="achievement-name">{a.name}</div>
            </div>
          );
        })}
      </div>

      {/* ── Recent Activity ── */}
      {recentActivity.length > 0 && (
        <>
          <div className="profile-tab-section-hdr">Recent Activity</div>
          <div className="profile-activity" style={{ padding: "0 16px" }}>
            {recentActivity.slice(0, 5).map(a => (
              <div key={a.id} className="profile-activity-row">
                <span className="pact-emoji">{a.emoji}</span>
                <div className="pact-info">
                  <span className="pact-type">{(a.eventType || "").replace(/_/g, " ")}</span>
                  <span className="pact-time">{relTime(a.time)}</span>
                </div>
                <span className="pact-result">{a.correct ? "✅" : "❌"}</span>
                {a.xp > 0 && <span className="pact-xp">+{a.xp} XP</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Edit Identity ── */}
      <div style={{ padding: "0 16px 8px" }}>
        {editingName ? (
          <div className="edit-identity-form">
            <div className="edit-identity-label">Change display name</div>
            <input
              className="f-input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { onNameChange?.(nameInput); setEditingName(false); }
                if (e.key === "Escape") setEditingName(false);
              }}
              autoFocus
              maxLength={24}
              placeholder="New nickname"
            />
            <div className="edit-identity-hint">
              Your playerId and XP are never affected.
            </div>
            <div className="edit-identity-btns">
              <button
                className="join-btn"
                style={{ flex: 1, padding: "10px" }}
                onClick={() => { onNameChange?.(nameInput); setEditingName(false); }}
                disabled={!nameInput.trim() || nameInput.trim() === player.name}
              >
                Save
              </button>
              <button
                className="profile-btn"
                style={{ flex: 1, padding: "10px", borderRadius: 8 }}
                onClick={() => { setNameInput(player.name); setEditingName(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="edit-identity-btn" onClick={() => { setNameInput(player.name); setEditingName(true); }}>
            ✏️ Edit Identity
          </button>
        )}
      </div>

      {/* ── Settings Panel (mute toggles + language) ── */}
      {settings && updateSettings && (
        <div style={{ padding: "0 16px" }}>
          <SettingsPanel settings={settings} update={updateSettings} reset={resetSettings} />
        </div>
      )}

      {/* ── Appearance toggle ── */}
      <div className="mobile-settings-section" style={{ margin: "16px 16px 0" }}>
        <div className="mobile-settings-title">Appearance</div>
        <button className="mobile-settings-row" onClick={toggleTheme}>
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
          <span className="mobile-settings-chevron">›</span>
        </button>
      </div>

      <div className="mobile-settings-section" style={{ margin: "12px 16px 0" }}>
        <button className="mobile-settings-row" onClick={onLeave}>
          <span>🚪</span>
          <span>Leave Arena</span>
          <span className="mobile-settings-chevron">›</span>
        </button>
      </div>

    </div>
  );
}
