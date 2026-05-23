"use client";
/**
 * DailyQuestsCard — modern card listing today's missions.
 *
 * Props:
 *   quests      : array of enriched quest objects from useQuests()
 *   onClaim(id) : called when user claims a completed quest
 *   onSound?(name): optional sound trigger ("levelUp" played on claim)
 *   compact     : optional bool — slimmer layout for the Profile tab
 */

import { useState } from "react";
import {
  Target, MessageSquare, Flame, Sparkles, Zap,
  CheckCircle2, ListChecks,
} from "lucide-react";

const ICON_MAP = {
  target:        Target,
  messageSquare: MessageSquare,
  flame:         Flame,
  sparkles:      Sparkles,
  zap:           Zap,
};

export default function DailyQuestsCard({ quests = [], onClaim, onSound, compact = false }) {
  const [flash, setFlash] = useState(null);  // { id, xp } for the toast

  function handleClaim(quest) {
    onClaim?.(quest.id);
    onSound?.("levelUp");
    setFlash({ id: quest.id, xp: quest.reward });
    setTimeout(() => setFlash(null), 2200);
  }

  const done   = quests.filter(q => q.isDone || q.isClaimed).length;
  const total  = quests.length;
  const claimed= quests.filter(q => q.isClaimed).length;

  return (
    <div className={`quests-card ${compact ? "quests-card-compact" : ""}`}>

      {/* Header */}
      <div className="quests-hdr">
        <div className="quests-hdr-left">
          <ListChecks size={16} strokeWidth={1.75} />
          <span className="quests-hdr-title">Today's Missions</span>
        </div>
        <div className="quests-hdr-progress">
          <span className="quests-hdr-count">{done}/{total}</span>
          <div className="quests-hdr-bar">
            <div className="quests-hdr-fill" style={{ width: `${(done/total)*100}%` }} />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="quests-list">
        {quests.map(q => {
          const Icon       = ICON_MAP[q.iconKey] || Target;
          const pct        = Math.min(100, Math.round((q.current / q.target) * 100));
          const isClaiming = flash?.id === q.id;

          return (
            <div
              key={q.id}
              className={`quest-row ${q.isClaimed ? "is-claimed" : q.isDone ? "is-done" : ""} ${isClaiming ? "is-claiming" : ""}`}
            >
              <div className="quest-icon-wrap">
                {q.isClaimed
                  ? <CheckCircle2 size={18} strokeWidth={1.75} />
                  : <Icon size={18} strokeWidth={1.75} />}
              </div>

              <div className="quest-body">
                <div className="quest-title">{q.title}</div>
                <div className="quest-sub">{q.description}</div>
                <div className="quest-progress">
                  <div className="quest-progress-track">
                    <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="quest-progress-count">{Math.min(q.current, q.target)}/{q.target}</span>
                </div>
              </div>

              <div className="quest-action">
                {q.isClaimed ? (
                  <span className="quest-claimed-pill">
                    <CheckCircle2 size={11} strokeWidth={2} /> Claimed
                  </span>
                ) : q.isDone ? (
                  <button className="quest-claim-btn" onClick={() => handleClaim(q)}>
                    +{q.reward} XP
                  </button>
                ) : (
                  <span className="quest-reward-pill">+{q.reward} XP</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Claim toast */}
      {flash && (
        <div className="quests-toast">
          <Sparkles size={16} strokeWidth={1.75} />
          <span>+{flash.xp} XP claimed!</span>
        </div>
      )}
    </div>
  );
}
