/**
 * constants.js
 * ------------
 * Shared lookup tables used across components.
 */

export const TEAM_NAMES = {
  "DFL-CLU-000001": "Hamburg",
  "DFL-CLU-000002": "Bayern",
};

export const EVENT_EMOJIS = {
  GOAL:         "⚽",
  SHOT:         "🎯",
  PENALTY:      "🔥",
  YELLOW_CARD:  "🟨",
  FREE_KICK:    "🎯",
  VAR:          "👁️",
  SUBSTITUTION: "🔄",
  WHISTLE:      "🏁",
  CORNER:       "🚩",
  KICKOFF:      "🏈",
};

export const EVENT_COLORS = {
  GOAL:         "#10b981",
  SHOT:         "#f59e0b",
  PENALTY:      "#ef4444",
  YELLOW_CARD:  "#eab308",
  FREE_KICK:    "#3b82f6",
  VAR:          "#8b5cf6",
  SUBSTITUTION: "#06b6d4",
  WHISTLE:      "#6b7280",
  CORNER:       "#f97316",
  KICKOFF:      "#6b7280",
};

export const PERSONAS = [
  { value: "casual",     emoji: "😎", label: "Casual Fan" },
  { value: "passionate", emoji: "🔥", label: "Passionate Fan" },
  { value: "stats_nerd", emoji: "📊", label: "Stats Nerd" },
];

export function getTier(score) {
  if (score >= 1000) return { label: "APEX",   color: "#10b981", bg: "rgba(16,185,129,.13)" };
  if (score >= 600)  return { label: "LEGEND", color: "#f59e0b", bg: "rgba(245,158,11,.13)" };
  if (score >= 300)  return { label: "ELITE",  color: "#8b5cf6", bg: "rgba(139,92,246,.13)" };
  if (score >= 100)  return { label: "PRO",    color: "#3b82f6", bg: "rgba(59,130,246,.13)" };
  return                    { label: "ROOKIE", color: "#94a3b8", bg: "rgba(148,163,184,.10)" };
}
