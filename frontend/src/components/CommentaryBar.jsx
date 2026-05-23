"use client";

import { EVENT_EMOJIS } from "../utils/constants";

export default function CommentaryBar({ commentary }) {
  if (!commentary) return null;

  return (
    <div className="cbar">
      <div className="cbar-icon">
        {EVENT_EMOJIS[commentary.eventType] || "🎙️"}
      </div>
      <div>
        <div className="cbar-label">AI Commentary</div>
        <div className="cbar-text">{commentary.text}</div>
      </div>
    </div>
  );
}
