"use client";

import { useRef, useEffect } from "react";

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10)  return "just now";
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const TYPE_COLOR = {
  goal:    "var(--accent)",
  xp:      "#10b981",
  wrong:   "#ef4444",
  rank:    "#f59e0b",
  levelup: "#8b5cf6",
  phase:   "var(--text-2)",
  event:   "var(--text-2)",
};

/**
 * NotificationCenter
 * ------------------
 * Bell icon + slide-down panel.
 *
 * Props from useNotifications():
 *   permission, requestPermission,
 *   notifications, unreadCount,
 *   open, togglePanel, closePanel, dismiss
 */
export default function NotificationCenter({
  permission,
  requestPermission,
  notifications,
  unreadCount,
  open,
  togglePanel,
  closePanel,
  dismiss,
}) {
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        closePanel();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closePanel]);

  return (
    <div className="notif-root" ref={panelRef}>

      {/* Bell button */}
      <button
        className="notif-bell"
        onClick={togglePanel}
        title="Notifications"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-hdr">
            <span className="notif-panel-title">Notifications</span>
            {permission !== "granted" && (
              <button className="notif-enable-btn" onClick={requestPermission}>
                Enable alerts
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">🔔</div>
              <div>No notifications yet</div>
              <div className="notif-empty-sub">Goals, predictions and rank changes appear here</div>
            </div>
          ) : (
            <div className="notif-list">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-item-unread"}`}
                  style={{ borderLeftColor: TYPE_COLOR[n.type] || "var(--border)" }}
                >
                  <div className="notif-item-emoji">{n.emoji}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    {n.body && <div className="notif-item-sub">{n.body}</div>}
                    <div className="notif-item-time">{relTime(n.time)}</div>
                  </div>
                  <button
                    className="notif-item-dismiss"
                    onClick={() => dismiss(n.id)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {permission !== "granted" && (
            <div className="notif-panel-footer">
              <button className="notif-full-enable-btn" onClick={requestPermission}>
                🔔 Enable browser notifications
              </button>
              <div className="notif-footer-note">
                Get alerts even when this tab is in the background
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
