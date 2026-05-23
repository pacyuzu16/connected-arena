"use client";

import { useState, useEffect } from "react";
import { getTier } from "../utils/constants";

// ── Hamburg vs Bayern lineup ────────────────────────────────────────────────
const HOME = {
  name: "Hamburg", short: "HAM", color: "#1a3a8f",
  players: [
    { pos: "GK", name: "Heuer Fernandes" },
    { pos: "RB", name: "Heyer" },
    { pos: "CB", name: "Ambrosius" },
    { pos: "CB", name: "Schönlau" },
    { pos: "LB", name: "Muheim" },
    { pos: "CM", name: "Meffert" },
    { pos: "CM", name: "Skhiri" },
    { pos: "AM", name: "Herold" },
    { pos: "RW", name: "Dompé" },
    { pos: "LW", name: "Baldé" },
    { pos: "ST", name: "Glatzel" },
  ],
};
const AWAY = {
  name: "Bayern", short: "BAY", color: "#dc2626",
  players: [
    { pos: "GK", name: "Neuer" },
    { pos: "RB", name: "Kimmich" },
    { pos: "CB", name: "Kim" },
    { pos: "CB", name: "Dier" },
    { pos: "LB", name: "Davies" },
    { pos: "CM", name: "Palhinha" },
    { pos: "CM", name: "Goretzka" },
    { pos: "AM", name: "Müller" },
    { pos: "RW", name: "Sané" },
    { pos: "LW", name: "Coman" },
    { pos: "ST", name: "Kane" },
  ],
};

const SCORERS = ["Glatzel", "Baldé", "Dompé", "Herold", "Kane", "Sané", "Müller", "Coman", "Kimmich"];
const RESULTS = ["Hamburg Win 🔵", "Draw ⚖️", "Bayern Win 🔴"];
const MEDALS  = ["🥇", "🥈", "🥉"];

// ────────────────────────────────────────────────────────────────────────────
// PRE-MATCH
// ────────────────────────────────────────────────────────────────────────────
function PreMatch() {
  const saved = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("pm-preds") || "null")
    : null;

  const [scorer, setScorer] = useState(saved?.scorer || "");
  const [result, setResult] = useState(saved?.result || "");
  const [locked, setLocked] = useState(!!saved);
  const [tab, setTab]       = useState("predict"); // "predict" | "lineup"

  const canSave = scorer && result && !locked;

  function save() {
    if (!canSave) return;
    localStorage.setItem("pm-preds", JSON.stringify({ scorer, result }));
    setLocked(true);
  }

  return (
    <div className="phase-wrap">
      {/* Header */}
      <div className="phase-matchup">
        <div className="phase-team" style={{ color: HOME.color }}>
          <span className="phase-team-name">{HOME.name}</span>
          <span className="phase-team-badge">Home</span>
        </div>
        <div className="phase-vs">VS</div>
        <div className="phase-team right" style={{ color: AWAY.color }}>
          <span className="phase-team-name">{AWAY.name}</span>
          <span className="phase-team-badge">Away</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="phase-tabs">
        {["predict", "lineup"].map(t => (
          <button
            key={t}
            className={`phase-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "predict" ? "🎯 Predict" : "📋 Lineup"}
          </button>
        ))}
      </div>

      {tab === "predict" ? (
        <div className="phase-section">
          {locked && (
            <div className="phase-locked-banner">
              ✅ Predictions locked in — results revealed at full time
            </div>
          )}

          <div className="phase-pred-group">
            <div className="phase-pred-label">
              ⚽ Who scores first?
              <span className="phase-pred-xp">+50 XP</span>
            </div>
            <div className="phase-scorer-grid">
              {SCORERS.map(s => (
                <button
                  key={s}
                  className={`phase-scorer-btn${scorer === s ? " active" : ""}${locked ? " locked" : ""}`}
                  onClick={() => !locked && setScorer(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="phase-pred-group">
            <div className="phase-pred-label">
              📊 Final result?
              <span className="phase-pred-xp">+30 XP</span>
            </div>
            <div className="phase-result-btns">
              {RESULTS.map(r => (
                <button
                  key={r}
                  className={`phase-result-btn${result === r ? " active" : ""}${locked ? " locked" : ""}`}
                  onClick={() => !locked && setResult(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {!locked && (
            <button
              className="phase-save-btn"
              onClick={save}
              disabled={!canSave}
            >
              Lock In Predictions 🔒
            </button>
          )}

          {locked && (
            <div className="phase-my-preds">
              <div className="phase-my-pred-row">
                <span>First scorer</span>
                <strong>{scorer}</strong>
              </div>
              <div className="phase-my-pred-row">
                <span>Result</span>
                <strong>{result}</strong>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="phase-lineup">
          {[HOME, AWAY].map(team => (
            <div key={team.name} className="phase-lineup-col">
              <div className="phase-lineup-hdr" style={{ color: team.color }}>
                {team.name}
              </div>
              {team.players.map(p => (
                <div key={p.name} className="phase-lineup-row">
                  <span className="phase-lineup-pos">{p.pos}</span>
                  <span className="phase-lineup-name">{p.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// HALF-TIME
// ────────────────────────────────────────────────────────────────────────────
function HalfTime({ score, myPlayer, leaderboard, htCommentary }) {
  const top3    = leaderboard.slice(0, 3);
  const myRank  = (leaderboard.findIndex(p => p.playerId === myPlayer?.playerId) + 1) || "—";
  const correct = myPlayer?.correctPredictions || myPlayer?.correct || 0;
  const total   = myPlayer?.totalPredictions   || myPlayer?.predictions || 0;
  const acc     = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="phase-wrap">
      <div className="ht-banner">
        <div className="ht-label">HALF TIME</div>
        <div className="ht-score">
          <span style={{ color: HOME.color }}>{HOME.short}</span>
          <span className="ht-score-num">{score?.home ?? 0} – {score?.away ?? 0}</span>
          <span style={{ color: AWAY.color }}>{AWAY.short}</span>
        </div>
      </div>

      {/* AI Summary */}
      {htCommentary && (
        <div className="ht-ai-box">
          <div className="ht-ai-label">🤖 AI Half-Time Report</div>
          <div className="ht-ai-text">"{htCommentary}"</div>
        </div>
      )}

      {/* Your stats */}
      <div className="ht-stats-row">
        <div className="ht-stat">
          <div className="ht-stat-val">⭐ {myPlayer?.score || 0}</div>
          <div className="ht-stat-lbl">XP earned</div>
        </div>
        <div className="ht-stat">
          <div className="ht-stat-val">{correct}/{total}</div>
          <div className="ht-stat-lbl">Correct picks</div>
        </div>
        <div className="ht-stat">
          <div className="ht-stat-val">{acc}%</div>
          <div className="ht-stat-lbl">Accuracy</div>
        </div>
        <div className="ht-stat">
          <div className="ht-stat-val">#{myRank}</div>
          <div className="ht-stat-lbl">Your rank</div>
        </div>
      </div>

      {/* Leaderboard snapshot */}
      <div className="ht-lb-hdr">🏆 Half-Time Standings</div>
      <div className="ht-lb">
        {top3.map((p, i) => (
          <div key={p.name} className={`ht-lb-row${p.playerId === myPlayer?.playerId ? " me" : ""}`}>
            <span className="ht-lb-medal">{MEDALS[i]}</span>
            <span className="ht-lb-name">{p.name}</span>
            <span className="ht-lb-xp">⭐ {p.score}</span>
          </div>
        ))}
        {myRank > 3 && myPlayer && (
          <>
            <div className="ht-lb-ellipsis">···</div>
            <div className="ht-lb-row me">
              <span className="ht-lb-medal">#{myRank}</span>
              <span className="ht-lb-name">{myPlayer.name} (you)</span>
              <span className="ht-lb-xp">⭐ {myPlayer.score}</span>
            </div>
          </>
        )}
      </div>

      <div className="ht-hint">Second half kicks off soon — stay sharp 🎯</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// POST-MATCH
// ────────────────────────────────────────────────────────────────────────────
function PostMatch({ score, myPlayer, leaderboard }) {
  const [copied, setCopied] = useState(false);

  const saved     = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("pm-preds") || "null")
    : null;
  const myRank    = (leaderboard.findIndex(p => p.playerId === myPlayer?.playerId) + 1) || "—";
  const correct   = myPlayer?.correctPredictions || myPlayer?.correct || 0;
  const total     = myPlayer?.totalPredictions   || myPlayer?.predictions || 0;
  const acc       = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tier      = getTier(myPlayer?.score || 0);

  // Resolve pre-match predictions
  const scorerCorrect = saved && score
    ? (score.home > score.away ? ["Glatzel","Baldé","Dompé","Herold"].includes(saved.scorer)
      : score.away > score.home ? ["Kane","Sané","Müller","Coman"].includes(saved.scorer)
      : false)
    : null;
  const resultCorrect = saved && score
    ? (score.home > score.away && saved.result.includes("Hamburg")) ||
      (score.away > score.home && saved.result.includes("Bayern")) ||
      (score.home === score.away && saved.result.includes("Draw"))
    : null;

  function copyChallenge() {
    navigator.clipboard.writeText(
      `I finished #${myRank} with ${myPlayer?.score || 0} XP in Connected Arena! 🏟️ Can you beat me next matchday? https://d1706ex99mjina.cloudfront.net`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="phase-wrap">
      {/* Full time banner */}
      <div className="ft-banner">
        <div className="ft-label">FULL TIME</div>
        <div className="ft-score">
          <span style={{ color: HOME.color }}>{HOME.short}</span>
          <span className="ft-score-num">{score?.home ?? 0} – {score?.away ?? 0}</span>
          <span style={{ color: AWAY.color }}>{AWAY.short}</span>
        </div>
      </div>

      {/* Performance card */}
      <div className="ft-perf-card">
        <div className="ft-perf-hdr">Your Match Performance</div>
        <div className="ft-perf-grid">
          <div className="ft-perf-stat">
            <div className="ft-perf-val" style={{ color: "var(--accent)" }}>
              ⭐ {myPlayer?.score || 0}
            </div>
            <div className="ft-perf-lbl">Total XP</div>
          </div>
          <div className="ft-perf-stat">
            <div className="ft-perf-val">#{myRank}</div>
            <div className="ft-perf-lbl">Final Rank</div>
          </div>
          <div className="ft-perf-stat">
            <div className="ft-perf-val">{acc}%</div>
            <div className="ft-perf-lbl">Accuracy</div>
          </div>
          <div className="ft-perf-stat">
            <div className="ft-perf-val" style={{ color: tier.color }}>{tier.label}</div>
            <div className="ft-perf-lbl">Tier</div>
          </div>
        </div>

        {/* Pre-match prediction results */}
        {saved && (
          <div className="ft-pm-results">
            <div className="ft-pm-hdr">Pre-Match Predictions</div>
            <div className="ft-pm-row">
              <span>First scorer: {saved.scorer}</span>
              {scorerCorrect !== null && (
                <span className={scorerCorrect ? "ft-correct" : "ft-wrong"}>
                  {scorerCorrect ? "✅ +50 XP" : "❌"}
                </span>
              )}
            </div>
            <div className="ft-pm-row">
              <span>Result: {saved.result}</span>
              {resultCorrect !== null && (
                <span className={resultCorrect ? "ft-correct" : "ft-wrong"}>
                  {resultCorrect ? "✅ +30 XP" : "❌"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Weekly standings */}
      <div className="ft-league-hdr">📊 Weekly League Standings</div>
      <div className="ft-league">
        <div className="ft-league-thead">
          <span>#</span><span style={{flex:1}}>Fan</span><span>Acc</span><span>XP</span>
        </div>
        {leaderboard.slice(0, 8).map((p, i) => (
          <div key={p.name} className={`ft-league-row${p.playerId === myPlayer?.playerId ? " me" : ""}`}>
            <span className="ft-league-rank">{i + 1}</span>
            <span className="ft-league-name">{p.name}</span>
            <span className="ft-league-acc">{p.accuracy || 0}%</span>
            <span className="ft-league-xp">⭐ {p.score}</span>
          </div>
        ))}
      </div>

      {/* Challenge friends CTA */}
      <button className="ft-challenge-btn" onClick={copyChallenge}>
        {copied ? "✅ Link copied!" : "🔗 Challenge friends for next matchday"}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// MID-WEEK
// ────────────────────────────────────────────────────────────────────────────
const SQUAD_SLOTS = [
  { pos: "ST", locked: false, name: "Glatzel", rating: 82 },
  { pos: "CAM", locked: false, name: "Herold", rating: 78 },
  { pos: "RW", locked: true },
  { pos: "LW", locked: true },
  { pos: "CM", locked: false, name: "Meffert", rating: 80 },
  { pos: "CM", locked: true },
  { pos: "CB", locked: false, name: "Schönlau", rating: 79 },
  { pos: "CB", locked: true },
  { pos: "GK", locked: false, name: "H. Fernandes", rating: 84 },
];

function MidWeek({ myPlayer, leaderboard }) {
  const myRank   = (leaderboard.findIndex(p => p.playerId === myPlayer?.playerId) + 1) || 0;
  const streak   = myPlayer?.winStreak || 0;
  const tier     = getTier(myPlayer?.score || 0);
  const isBottom = myRank > 5 && leaderboard.length > 5;

  // Countdown to "next match" (hardcoded for demo — next Saturday)
  const nextMatch = new Date();
  nextMatch.setDate(nextMatch.getDate() + (6 - nextMatch.getDay() + 6) % 7 + 1);
  const daysLeft  = Math.ceil((nextMatch - Date.now()) / 86400000);

  return (
    <div className="phase-wrap">
      {/* Next match */}
      <div className="mw-next-match">
        <div className="mw-next-label">Next Match</div>
        <div className="mw-next-fixture">Hamburg vs Bayern</div>
        <div className="mw-next-countdown">
          in <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>
        </div>
      </div>

      {/* Your mid-week stats */}
      <div className="mw-stats-row">
        <div className="mw-stat">
          <div className="mw-stat-val" style={{ color: streak >= 3 ? "#f97316" : "var(--text)" }}>
            {streak >= 3 ? `🔥 ${streak}` : streak}
          </div>
          <div className="mw-stat-lbl">Win streak</div>
        </div>
        <div className="mw-stat">
          <div className="mw-stat-val">#{myRank || "—"}</div>
          <div className="mw-stat-lbl">Weekly rank</div>
        </div>
        <div className="mw-stat">
          <div className="mw-stat-val" style={{ color: tier.color }}>{tier.label}</div>
          <div className="mw-stat-lbl">Current tier</div>
        </div>
      </div>

      {/* Comeback challenge */}
      {isBottom && (
        <div className="mw-comeback">
          <div className="mw-comeback-icon">⚡</div>
          <div>
            <div className="mw-comeback-title">Comeback Challenge</div>
            <div className="mw-comeback-sub">
              You're ranked #{myRank}. Score 3 correct predictions in a row next matchday
              to earn <strong>+200 bonus XP</strong> and jump the table.
            </div>
          </div>
        </div>
      )}

      {/* Streak challenge */}
      {streak >= 3 && (
        <div className="mw-streak-card">
          <div className="mw-streak-icon">🔥</div>
          <div>
            <div className="mw-streak-title">Hot Streak — {streak} in a row!</div>
            <div className="mw-streak-sub">
              Keep it going next matchday for <strong>+150 bonus XP</strong>. Don't break the chain.
            </div>
          </div>
        </div>
      )}

      {/* Squad builder */}
      <div className="mw-squad-hdr">
        🛡️ Your Squad
        <span className="mw-squad-hint">Unlock more slots by leveling up</span>
      </div>
      <div className="mw-squad-grid">
        {SQUAD_SLOTS.map((s, i) => (
          <div key={i} className={`mw-squad-slot${s.locked ? " locked" : ""}`}>
            <div className="mw-squad-pos">{s.pos}</div>
            {s.locked ? (
              <div className="mw-squad-lock">🔒</div>
            ) : (
              <>
                <div className="mw-squad-name">{s.name}</div>
                <div className="mw-squad-rating">{s.rating}</div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ────────────────────────────────────────────────────────────────────────────
export default function MatchPhaseContent({
  phase, matchScore, halfTimeScore, halfTimeCommentary,
  myPlayer, leaderboard, connected,
}) {
  if (phase === "prematch" || (!connected && phase === "prematch")) {
    return <PreMatch />;
  }
  if (phase === "halftime") {
    return (
      <HalfTime
        score={halfTimeScore}
        myPlayer={myPlayer}
        leaderboard={leaderboard}
        htCommentary={halfTimeCommentary}
      />
    );
  }
  if (phase === "postmatch") {
    return (
      <PostMatch
        score={matchScore}
        myPlayer={myPlayer}
        leaderboard={leaderboard}
      />
    );
  }
  if (phase === "midweek") {
    return <MidWeek myPlayer={myPlayer} leaderboard={leaderboard} />;
  }
  // "live" — return null so the normal arena content shows
  return null;
}
