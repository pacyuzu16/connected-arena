"use client";

export default function MatchFeed({ events }) {
  return (
    <div className="card">
      <div className="card-hdr">⚡ Match Feed</div>
      <div className="card-body">
        {events.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📡</span>
            Waiting for match events…
          </div>
        ) : (
          events.map(ev => (
            <div key={ev.id} className="ev-item">
              <div
                className="ev-icon"
                style={{ background: `${ev.color}20`, color: ev.color }}
              >
                {ev.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div className="ev-type">{ev.type.replace(/_/g, " ")}</div>
                <div className="ev-meta">
                  <span>{ev.team}</span>
                  <span>·</span>
                  <span>{ev.time}</span>
                </div>
              </div>
              {ev.points > 0 && (
                <div className="ev-pts">+{ev.points} pts</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
