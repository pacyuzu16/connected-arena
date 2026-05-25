"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import useWebSocket from "../../hooks/useWebSocket";
import JoinScreen from "../../components/JoinScreen";
import MatchFeed from "../../components/MatchFeed";
import Leaderboard from "../../components/Leaderboard";
import CommentaryBar from "../../components/CommentaryBar";
import PredictionModal from "../../components/PredictionModal";
import ProfilePanel from "../../components/ProfilePanel";
import MatchPhaseContent from "../../components/MatchPhaseContent";
import CrowdReactions from "../../components/CrowdReactions";
import MobileProfileTab from "../../components/MobileProfileTab";
import DesktopProfilePanel from "../../components/DesktopProfilePanel";
import LiveChat from "../../components/LiveChat";
import ChatTab from "../../components/ChatTab";
import NotificationCenter from "../../components/NotificationCenter";
import useNotifications from "../../hooks/useNotifications";
import useSettings from "../../hooks/useSettings";
import useSounds from "../../hooks/useSounds";
import useQuests from "../../hooks/useQuests";
import useSquad from "../../hooks/useSquad";
import DailyQuestsCard from "../../components/DailyQuestsCard";
import SquadPanel from "../../components/SquadPanel";
import StadiumBadge from "../../components/StadiumBadge";
import Logo from "../../components/Logo";
import useVenue from "../../hooks/useVenue";
import { useTheme } from "../../components/ThemeProvider";
import { Home, Zap, Trophy, MessageSquare, User, Globe, UsersRound, Monitor } from "lucide-react";
import { getTier } from "../../utils/constants";
// Dynamic import prevents amazon-cognito-identity-js from running during
// Next.js static generation (it accesses window/localStorage at module init time,
// which causes "Cannot access 'X' before initialization" TDZ errors in the bundle).
import dynamic from "next/dynamic";
const AuthScreen = dynamic(() => import("../../components/AuthScreen"), { ssr: false });

// Cognito helpers — lazy loaded at runtime only, never during SSG
let _cognitoLoaded = false;
let _cognito = { currentUser: () => null, exchangeCodeForTokens: async () => null, signOut: () => {}, refreshSession: async () => null };
async function loadCognito() {
  if (_cognitoLoaded) return _cognito;
  const mod = await import("../../utils/cognito");
  _cognito = mod;
  _cognitoLoaded = true;
  return _cognito;
}

// ── Inline helpers ─────────────────────────────────────────────────────────

function calcWinProb(home, away) {
  const diff = home - away;
  if (diff === 0) return home === 0 ? { h: 40, d: 30, a: 30 } : { h: 35, d: 35, a: 30 };
  if (diff === 1)  return { h: 58, d: 23, a: 19 };
  if (diff >= 2)   return { h: 72, d: 17, a: 11 };
  if (diff === -1) return { h: 19, d: 23, a: 58 };
  return { h: 11, d: 17, a: 72 };
}

function WinProbBar({ home, away }) {
  const p = calcWinProb(home, away);
  return (
    <div className="winprob-wrap">
      <div className="winprob-labels">
        <span className="winprob-team home">Hamburg</span>
        <span className="winprob-draw-label">Draw</span>
        <span className="winprob-team away">Bayern</span>
      </div>
      <div className="winprob-bar">
        <div className="winprob-seg home" style={{ width: `${p.h}%` }} />
        <div className="winprob-seg draw" style={{ width: `${p.d}%` }} />
        <div className="winprob-seg away" style={{ width: `${p.a}%` }} />
      </div>
      <div className="winprob-pcts">
        <span className="winprob-pct home">{p.h}%</span>
        <span className="winprob-pct draw">{p.d}%</span>
        <span className="winprob-pct away">{p.a}%</span>
      </div>
    </div>
  );
}

const LEVEL_COLOR_HDR = ["", "#64748b", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

function SquadOverviewCard({ player, avatarUrl }) {
  const tier = getTier(player.score || 0);
  return (
    <div className="squad-card">
      <div className="squad-left">
        {avatarUrl
          ? <img src={avatarUrl} className="squad-avatar-img" alt="avatar" />
          : <div className="squad-avatar-initial" style={{ background: LEVEL_COLOR_HDR[player.level || 1] }}>
              {(player.name || "?")[0].toUpperCase()}
            </div>
        }
      </div>
      <div className="squad-right">
        <div className="squad-name-row">
          <span className="squad-name">{player.name}</span>
          <span className="tier-badge" style={{ color: tier.color, background: tier.bg }}>{tier.label}</span>
        </div>
        <div className="squad-stats-row">
          <span className="squad-stat">⭐ {player.score || 0} XP</span>
          <span className="squad-stat">Lv.{player.level || 1}</span>
          {player.rank && <span className="squad-stat">#{player.rank}</span>}
          <span className="squad-stat">{player.accuracy || 0}% acc</span>
          <span className="squad-stat">{player.correct || 0} wins</span>
        </div>
      </div>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

function GlobalLeadersMini({ players }) {
  if (!players?.length) return null;
  return (
    <div className="global-leaders">
      <div className="global-leaders-hdr">Global Leaders</div>
      {players.map((p, i) => (
        <div key={p.name} className="global-leader-row">
          <span className="gl-medal">{MEDALS[i]}</span>
          <span className="gl-name">{p.name}</span>
          <span className="gl-xp">⭐ {p.score}</span>
        </div>
      ))}
    </div>
  );
}

// ── Fan chat log (commentary → chat messages) ─────────────────────────────
const FAN_NAMES = ["GoalHunter", "Fanatic44", "StatShark_X", "ElitePredictor",
  "DataQueen", "TacticalTony", "VictoryVibe", "MetaMaster", "ApexAnalyst"];

const CHAT_REACTIONS = {
  GOAL:        ["What a finish! 🔥", "GET IN! ⚽", "Unbelievable goal! 😱", "That's class! 👏"],
  SHOT:        ["That was close! 😮", "Good attempt!", "Keeper had no chance...", "Just wide! 😤"],
  PENALTY:     ["Penalty! 🔥", "Keeper to guess right now...", "Nerve-wracking 😬"],
  YELLOW_CARD: ["Deserved that booking! 🟨", "Dangerous play!", "Ref had to show it."],
  FREE_KICK:   ["Perfect position for a goal! 🎯", "Set piece time!", "Who takes this? 👀"],
  VAR:         ["VAR checking... 👁️", "They're reviewing it!", "What did they see? 🤔"],
  SUBSTITUTION:["Fresh legs on! 🔄", "Tactical change.", "Will it make a difference?"],
  WHISTLE:     ["Half time! 🏁", "Full time! Great match!", "Whistle blown!"],
  CORNER:      ["Corner! 🚩 Danger!", "Into the box now...", "Good delivery needed."],
  KICKOFF:     ["We're off! 🏈", "Let's go! ⚽", "Match started!"],
};

function getChatMsg(eventType) {
  const opts = CHAT_REACTIONS[eventType] || ["Interesting! 👀"];
  return opts[Math.floor(Math.random() * opts.length)];
}

// ── Tactical Feed ─────────────────────────────────────────────────────────
function TacticalFeed({ players, currentName }) {
  const STATUSES = ["In Arena", "Analyzing Lineups", "Predicting"];
  const others = players.filter(p => p.name !== currentName).slice(0, 4);
  if (!others.length) return null;
  return (
    <div className="tactical-feed">
      <div className="tactical-hdr">⚡ Tactical Feed</div>
      {others.map((p, i) => {
        const isOnline = (p.score || 0) > 0;
        const status   = isOnline ? STATUSES[i % STATUSES.length] : "Last seen 2h ago";
        return (
          <div key={p.name} className="tactical-row">
            <div className={`tactical-dot ${isOnline ? "online" : "offline"}`} />
            <div className="tactical-name">{p.name}</div>
            <div className="tactical-status">{status}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Marketplace Teaser ────────────────────────────────────────────────────
function MarketplaceTeaser() {
  return (
    <div className="marketplace-card">
      <div className="marketplace-top">
        <div className="marketplace-left">
          <div className="marketplace-badge">NEW</div>
          <div className="marketplace-title">MARKETPLACE</div>
          <div className="marketplace-sub">Exclusive Elite Pack available now!</div>
        </div>
        <div className="marketplace-right">🎁</div>
      </div>
      <button className="marketplace-btn">BROWSE STORE →</button>
    </div>
  );
}


// ── Main page ──────────────────────────────────────────────────────────────

export default function ArenaPage() {
  const [playerName, setPlayerName]     = useState("");
  const [joined, setJoined]             = useState(false);
  const [showProfile, setShowProfile]   = useState(false);

  // URL-hash backed tab state — surviving refresh and supporting deep links.
  // Valid hashes: "home" | "arena" | "leaderboard" | "chat" | "profile"
  const VALID_TABS = ["home", "arena", "leaderboard", "chat", "profile"];
  const _initialTab = (() => {
    if (typeof window === "undefined") return "home";
    const h = window.location.hash.replace(/^#/, "");
    return VALID_TABS.includes(h) ? h : "home";
  })();
  const [activeTab, _setActiveTab]      = useState(_initialTab);

  // Wrap setActiveTab to also push to the URL hash (no full reload)
  const setActiveTab = (tab) => {
    _setActiveTab(tab);
    if (typeof window !== "undefined" && VALID_TABS.includes(tab)) {
      const next = `#${tab}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", `${window.location.pathname}${next}`);
      }
    }
  };

  // React to back/forward browser navigation between tabs
  useEffect(() => {
    function onHash() {
      const h = window.location.hash.replace(/^#/, "");
      if (VALID_TABS.includes(h)) _setActiveTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [avatarUrl, setAvatarUrl]       = useState(null);
  const [chatLog, setChatLog]           = useState([]);
  const [welcomeBack, setWelcomeBack]   = useState(null);
  // Auth state — null = not checked yet, false = no session, object = logged in
  const [authUser, setAuthUser]         = useState(null);
  const [authChecked, setAuthChecked]   = useState(false);
  const jwtRef            = useRef(null);
  // Stores connect() params to fire once the WS hook has stabilised
  const pendingConnectRef = useRef(null);
  const { theme, setTheme } = useTheme();

  // ── On mount: restore session → skip landing page entirely on refresh ──
  useEffect(() => {
    async function checkAuth() {
      // Helper: queue a connect call (fires via the effect below)
      function queueConnect(name, persona, jwt) {
        pendingConnectRef.current = { name, persona, jwt };
      }

      // Load cognito lazily (never runs during SSG)
      const cog = await loadCognito();

      // 1. OAuth authorization-code callback (?code=...)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const code   = params.get("code");
        if (code) {
          try {
            const result = await cog.exchangeCodeForTokens(code);
            window.history.replaceState({}, "", window.location.pathname);
            _applySession(result, queueConnect);
            setAuthChecked(true);
            return;
          } catch (e) {
            console.warn("OAuth code exchange failed:", e);
          }
        }
      }

      // 2. Existing Cognito JWT in localStorage (token refresh)
      try {
        const refreshed = await cog.refreshSession();
        if (refreshed) {
          _applySession(refreshed, queueConnect);
          setAuthChecked(true);
          return;
        }
      } catch (e) { /* no session */ }

      // 3. Guest session (random playerId saved in localStorage)
      const savedName    = localStorage.getItem("arena-player-name");
      const savedId      = localStorage.getItem("arena-player-id");
      const savedPersona = localStorage.getItem("arena-player-persona") || "casual";
      if (savedName && savedId) {
        setAuthUser(false);
        setPlayerName(savedName);
        setJoined(true);
        queueConnect(savedName, savedPersona, null);
        setWelcomeBack(savedName);
        setTimeout(() => setWelcomeBack(null), 3500);
        setAuthChecked(true);
        return;
      }

      // 4. Brand new visitor — show landing page
      setAuthChecked(true);
    }

    // Apply a Cognito session: set all state so arena renders immediately
    function _applySession(result, queueConnect) {
      const savedName    = localStorage.getItem("arena-player-name")
                        || result.name
                        || result.email?.split("@")[0]
                        || "Fan";
      const savedPersona = localStorage.getItem("arena-player-persona") || "casual";
      jwtRef.current = result.jwt;
      setAuthUser(result);
      setPlayerName(savedName);
      localStorage.setItem("arena-player-name", savedName);
        setJoined(true);
      queueConnect(savedName, savedPersona, result.jwt);
      setWelcomeBack(savedName);
      setTimeout(() => setWelcomeBack(null), 3500);
    }

    checkAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable avatar storage key — survives name changes, sign-outs, refreshes.
  // Priority: Cognito sub > saved guest playerId. Falls back to playerName
  // only for the brief window before either is available.
  const avatarStorageKey = useMemo(() => {
    if (authUser?.sub) return `arena-avatar-${authUser.sub}`;
    if (typeof window !== "undefined") {
      const pid = localStorage.getItem("arena-player-id");
      if (pid) return `arena-avatar-${pid}`;
    }
    return playerName ? `arena-avatar-${playerName}` : null;
  }, [authUser, playerName]);

  // Load the persisted avatar on mount + whenever the stable key changes.
  // localStorage is the source of truth — works for both Cognito and guests.
  useEffect(() => {
    if (!avatarStorageKey || typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(avatarStorageKey);
      setAvatarUrl(saved || null);
    } catch { setAvatarUrl(null); }
  }, [avatarStorageKey]);

  // Wrapper that persists every avatar update to localStorage automatically.
  // Components only need to call this — they no longer write to localStorage
  // themselves with mismatched keys.
  const persistAvatar = (value) => {
    setAvatarUrl(value);
    if (!avatarStorageKey || typeof window === "undefined") return;
    try {
      if (value) localStorage.setItem(avatarStorageKey, value);
      else       localStorage.removeItem(avatarStorageKey);
    } catch (e) {
      // localStorage quota exceeded — image too large
      console.warn("Could not persist avatar:", e?.message);
    }
  };

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else {
      const isDarkOS = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDarkOS ? "light" : "dark");
    }
  };

  const {
    connected, events, leaderboard, commentary, prediction, predVoted,
    myScore, myPlayer, predCountdown,
    matchScore, matchMinute, activityFeed, recentActivity,
    matchPhase, halfTimeScore, halfTimeCommentary,
    connect, sendPrediction, sendChat, refreshLeaderboard,
    requestAvatarUpload, avatarUploadUrl,
    chatMessages, suspended,
  } = useWebSocket(playerName);

  // Fire the queued connect() once `connect` is available (after playerName is set).
  // Must be AFTER useWebSocket so `connect` is already initialised when this effect runs.
  useEffect(() => {
    if (!pendingConnectRef.current) return;
    const { name, persona, jwt } = pendingConnectRef.current;
    pendingConnectRef.current = null;
    connect(name, persona, jwt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);

  // Keep the chat-send ref in sync so the wrapped function above can call it
  useEffect(() => { _sendChatRef.current = sendChat; }, [sendChat]);

  // ── User preferences (mute toggles + language) ─────────────────────────
  const { settings, update: updateSettings, reset: resetSettings } = useSettings();

  // ── Active stadium context (from /venues/[code]) ───────────────────────
  const { venue: activeVenue } = useVenue();

  // ── Sound effects (respects settings.sound toggle) ─────────────────────
  const { play: playSound } = useSounds(settings.sound);

  // Wrap sendChat so it plays a tick sound + increments today's chat counter
  // (used by Daily Quests). Wrapped at the page level so every ChatTab
  // mount uses the same instrumented send function.
  const wrappedSendChat = (msg) => {
    // Forward to the real WebSocket send (declared below via useWebSocket)
    _sendChatRef.current?.(msg);
    if (msg && msg.trim()) {
      setChatSentCount(c => c + 1);
      playSound("chatSend");
    }
  };
  const _sendChatRef = useRef(null);

  // ── Daily Quests (resets every midnight, persists to localStorage) ─────
  const [chatSentCount, setChatSentCount] = useState(0);
  const {
    quests,
    claim: claimQuest,
    claimedXp: questsClaimedXp,
  } = useQuests({ myPlayer, chatCount: chatSentCount, settings });

  // ── Friend Squad ───────────────────────────────────────────────────────
  const {
    squad,
    create: createSquad,
    join:   joinSquad,
    leave:  leaveSquad,
    rename: renameSquad,
    addMember:    addSquadMember,
    removeMember: removeSquadMember,
  } = useSquad({ myPlayerId: myPlayer?.playerId, myName: myPlayer?.name || playerName });

  // ── Leaderboard view toggle (Global | Squad) ───────────────────────────
  const [lbView, setLbView] = useState("global"); // "global" | "squad"
  const squadIds = squad ? new Set(squad.members.map(m => m.playerId)) : null;
  const visibleLeaderboard = useMemo(() => {
    if (lbView === "squad" && squadIds) {
      return leaderboard.filter(p => squadIds.has(p.playerId));
    }
    return leaderboard;
  }, [lbView, leaderboard, squad]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notifications (respects muteNotifications setting) ─────────────────
  const {
    permission, requestPermission,
    notifications, unreadCount,
    open: notifOpen, togglePanel: toggleNotif, closePanel: closeNotif, dismiss: dismissNotif,
  } = useNotifications({
    events,
    myPlayer,
    matchPhase,
    muted: settings.muteNotifications,
  });

  // Build chat log from incoming match events + play sound on goals
  const prevEventIdRef = useRef(null);
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    if (!latest) return;

    // Sound effect — only for genuinely new events (not on every re-render)
    if (latest.id !== prevEventIdRef.current) {
      prevEventIdRef.current = latest.id;
      if (latest.type === "GOAL") playSound("goal");
    }

    const fanName = FAN_NAMES[Math.floor(Math.random() * FAN_NAMES.length)];
    const msg     = getChatMsg(latest.type);
    setChatLog(prev => [{
      id: latest.id,
      fan: fanName,
      msg,
      emoji: latest.emoji,
      type: latest.type,
    }, ...prev].slice(0, 20));
  }, [events, playSound]);

  // Play a sound when a prediction window opens
  const prevPredEventIdRef = useRef(null);
  useEffect(() => {
    if (!prediction) { prevPredEventIdRef.current = null; return; }
    if (prediction.eventId && prediction.eventId !== prevPredEventIdRef.current) {
      prevPredEventIdRef.current = prediction.eventId;
      playSound("predictionOpen");
    }
  }, [prediction, playSound]);

  // XP pop-up when score increases — also play correct/levelUp sound
  const prevScoreRef = useRef(0);
  const prevLevelRef = useRef(1);
  const [xpPop, setXpPop] = useState(null);
  useEffect(() => {
    if (myScore > prevScoreRef.current && prevScoreRef.current > 0) {
      const diff = myScore - prevScoreRef.current;
      setXpPop({ diff, id: Date.now() });
      playSound(diff >= 50 ? "rankUp" : "correct");
      const t = setTimeout(() => setXpPop(null), 1600);
      return () => clearTimeout(t);
    }
    prevScoreRef.current = myScore;
  }, [myScore, playSound]);

  useEffect(() => {
    const lvl = myPlayer?.level || 1;
    if (lvl > prevLevelRef.current && prevLevelRef.current > 0) {
      playSound("levelUp");
    }
    prevLevelRef.current = lvl;
  }, [myPlayer?.level, playSound]);

  // ── Auth handlers ───────────────────────────────────────────────────────
  const handleAuth = (result) => {
    // Admin → redirect to admin dashboard
    if (result.email === "admin@gmail.com") {
      jwtRef.current = result.jwt;
      window.location.href = "/admin";
      return;
    }
    // Regular user → enter arena
    setAuthUser(result);
    jwtRef.current = result.jwt;
    const savedName    = localStorage.getItem("arena-player-name") || result.name || result.email?.split("@")[0] || "Fan";
    const savedPersona = localStorage.getItem("arena-player-persona") || "casual";
    setPlayerName(savedName);
    localStorage.setItem("arena-player-name", savedName);
    setJoined(true);
    connect(savedName, savedPersona, result.jwt);
    setWelcomeBack(savedName);
    setTimeout(() => setWelcomeBack(null), 3500);
  };

  const handleGuest = () => {
    // Skip Cognito — use localStorage random playerId
    setAuthUser(false);
  };

  const handleJoin = (name, persona) => {
    localStorage.setItem("arena-player-name",    name);
    localStorage.setItem("arena-player-persona", persona);
    setPlayerName(name);
    setJoined(true);
    connect(name, persona, jwtRef.current);
  };

  // ── Name change (keeps playerId + XP, just reconnects with new display name) ──
  const handleNameChange = (newName) => {
    if (!newName.trim() || newName === playerName) return;
    localStorage.setItem("arena-player-name", newName.trim());
    setPlayerName(newName.trim());
    const persona = localStorage.getItem("arena-player-persona") || "casual";
    setTimeout(() => connect(newName.trim(), persona, jwtRef.current), 100);
  };

  // Avatar storage strategy:
  //   - Components read the picked file, convert to base64, and call
  //     `persistAvatar(b64)` (defined above) which both updates state
  //     and writes to localStorage under the stable avatarStorageKey.
  //   - Works identically for guests AND Cognito users — no S3 round-trip
  //     needed for the demo. The S3 presigned-URL path that used to live
  //     here was structurally broken (the pending-file ref was never set)
  //     and the Bedrock-style SCP on this account would block the bucket
  //     PUT anyway, so localStorage is the only reliable path.

  // ── Routing ────────────────────────────────────────────────────────────────
  // Block render until the mount auth-check resolves (prevents flicker)
  if (!authChecked) {
    return (
      <div className="arena-loading">
        <div className="arena-loading-logo">⚽</div>
        <div className="arena-loading-text">Loading…</div>
      </div>
    );
  }

  // Block render until auth check completes
  if (!authChecked) {
    return (
      <div className="arena-loading">
        <div className="arena-loading-logo">⚽</div>
        <div className="arena-loading-text">Loading…</div>
      </div>
    );
  }

  // No session → show auth screen directly (full page, no landing page)
  if (!joined) {
    if (authUser === false) {
      // Guest: picked "Continue as Guest" → show name/persona picker
      return <JoinScreen onJoin={handleJoin} />;
    }
    if (authUser && authUser.jwt) {
      // Cognito user authenticated but hasn't set persona yet
      return <JoinScreen onJoin={handleJoin} cognitoName={authUser.name} />;
    }
    // New visitor — show login/signup
    return <AuthScreen onAuth={handleAuth} onGuest={handleGuest} />;
  }

  const fullPlayer = myPlayer || {
    name: playerName, score: myScore,
    predictions: 0, correct: 0, accuracy: 0, level: 1, winStreak: 0,
  };

  const handleLeave = () => {
    localStorage.removeItem("arena-player-name");
    localStorage.removeItem("arena-player-persona");
    if (authUser) loadCognito().then(c => c.signOut());
    setAuthUser(null);
    jwtRef.current = null;
    setJoined(false);
    // Return the user to the public homepage on explicit leave
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="app">

      {/* ── Suspended banner ── */}
      {suspended && (
        <div className="suspended-banner">
          🚫 Your account has been suspended. You can view the match but cannot make predictions or chat.
          Contact support if you believe this is a mistake.
        </div>
      )}

      {/* ── Top Header ── */}
      <header className="hdr">
        <button
          className="hdr-logo"
          onClick={() => { if (typeof window !== "undefined") window.location.href = "/"; }}
          title="Back to home"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Logo size={28} />
          <span>Connected Arena</span>
        </button>

        {/* Live score */}
        <div className="hdr-scorebar">
          <span className="hdr-sb-team">HAM</span>
          <span className="hdr-sb-score">{matchScore.home} – {matchScore.away}</span>
          <span className="hdr-sb-team">BAY</span>
          <span className="hdr-sb-min">{matchMinute > 0 ? `${matchMinute}'` : "—"}</span>
        </div>

        {/* Stadium badge — shown when the user entered via /venues */}
        <StadiumBadge venue={activeVenue} />

        <div className="hdr-right">
          {myPlayer && <div className="hdr-level" title="Your level">Lv.{myPlayer.level || 1}</div>}
          <div className="hdr-score">⭐ {myScore} XP</div>
          {myPlayer?.winStreak >= 3 && <div className="hdr-streak">🔥 {myPlayer.winStreak}</div>}
          <div className={`status ${connected ? "live" : "offline"}`}>
            <div className={`dot ${connected ? "live" : "offline"}`} />
            {connected ? "LIVE" : "OFFLINE"}
          </div>
          {connected && leaderboard.length > 0 && (
            <div className="hdr-fans">
              <span className="hdr-fans-dot" />
              {leaderboard.length} fans
            </div>
          )}
          <NotificationCenter
            permission={permission}
            requestPermission={requestPermission}
            notifications={notifications}
            unreadCount={unreadCount}
            open={notifOpen}
            togglePanel={toggleNotif}
            closePanel={closeNotif}
            dismiss={dismissNotif}
          />
          {/* Theme toggle removed from header — it lives in the Profile tab
              under "Appearance" so we don't show it twice. */}
          <button className="profile-btn hdr-profile-btn" onClick={() => setShowProfile(true)} title="Your profile">
            👤
          </button>
        </div>
      </header>

      {/* ── Desktop: tab navigation bar ── */}
      <nav className="desktop-tab-bar">
        {[
          { id: "home",        Icon: Home,          label: "Home"    },
          { id: "arena",       Icon: Zap,           label: "Arena",  badge: prediction ? "!" : null },
          { id: "leaderboard", Icon: Trophy,        label: "Leaders" },
          { id: "chat",        Icon: MessageSquare, label: "Chat"   },
          { id: "profile",     Icon: User,          label: "Profile" },
        ].map(t => (
          <button
            key={t.id}
            className={`desktop-tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.Icon size={16} strokeWidth={1.75} />
            <span>{t.label}</span>
            {t.badge && <span className="desktop-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </nav>

      {/* ── Desktop: tab content panels ── */}
      <div className="desktop-panels">

        {/* HOME */}
        {activeTab === "home" && (
          <div className="main desktop-main">
            <div className="desktop-left-col">
              {matchPhase !== "live"
                ? <MatchPhaseContent phase={matchPhase} matchScore={matchScore}
                    halfTimeScore={halfTimeScore} halfTimeCommentary={halfTimeCommentary}
                    myPlayer={myPlayer} leaderboard={leaderboard} connected={connected} />
                : <>
                    <WinProbBar home={matchScore.home} away={matchScore.away} />
                    {activityFeed.length > 0 && (
                      <div className="card" style={{ overflow: "hidden" }}>
                        <div className="card-hdr">⚡ Live Activity</div>
                        <div className="activity-stream" style={{ borderRadius: 0 }}>
                          {activityFeed.slice(0, 8).map(a => (
                            <div key={a.id} className="activity-item">
                              <span className="activity-icon">⭐</span>
                              <span className="activity-text">{a.text}</span>
                              <span className="activity-time">{Math.round((Date.now() - a.time) / 1000)}s ago</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <TacticalFeed players={leaderboard} currentName={playerName} />
                    <MarketplaceTeaser />
                  </>
              }
            </div>
            <div className="desktop-right-col">
              <DailyQuestsCard quests={quests} onClaim={claimQuest} onSound={playSound} />
              <GlobalLeadersMini players={leaderboard.slice(0, 3)} />
            </div>
          </div>
        )}

        {/* ARENA */}
        {activeTab === "arena" && (
          <div className="main desktop-main">
            <div className="desktop-left-col">
              <WinProbBar home={matchScore.home} away={matchScore.away} />
              <MatchFeed events={events} />
              <LiveChat
                messages={chatMessages}
                onSend={wrappedSendChat}
                playerName={playerName}
              />
              <CrowdReactions events={events} />
            </div>
            <div className="desktop-right-col">
              <Leaderboard players={leaderboard} currentPlayerName={playerName} />
            </div>
          </div>
        )}

        {/* LEADERS — Global / Squad toggle + squad panel side-by-side */}
        {activeTab === "leaderboard" && (
          <div className="main desktop-main">
            <div className="desktop-left-col">
              <div className="lb-toggle-bar">
                <button
                  className={`lb-toggle-btn ${lbView === "global" ? "active" : ""}`}
                  onClick={() => setLbView("global")}
                >
                  <Globe size={14} strokeWidth={1.75} />
                  <span>Global</span>
                  <span className="lb-toggle-count">{leaderboard.length}</span>
                </button>
                <button
                  className={`lb-toggle-btn ${lbView === "squad" ? "active" : ""}`}
                  onClick={() => setLbView("squad")}
                  disabled={!squad}
                >
                  <UsersRound size={14} strokeWidth={1.75} />
                  <span>{squad ? squad.name : "Squad"}</span>
                  {squad && <span className="lb-toggle-count">{squad.members.length}</span>}
                </button>
              </div>
              {lbView === "squad" && !squad ? (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--text-3)" }}>
                  Join or create a squad on the right to see squad rankings.
                </div>
              ) : (
                <Leaderboard players={visibleLeaderboard} currentPlayerName={playerName} />
              )}
            </div>
            <div className="desktop-right-col">
              <SquadPanel
                squad={squad}
                onCreate={createSquad}
                onJoin={joinSquad}
                onLeave={leaveSquad}
                onRename={renameSquad}
                onAddMember={addSquadMember}
                onRemoveMember={removeSquadMember}
                myPlayerId={myPlayer?.playerId}
                leaderboard={leaderboard}
              />
            </div>
          </div>
        )}

        {/* CHAT */}
        {activeTab === "chat" && (
          <div className="main" style={{ padding: 0, height: "calc(100vh - 56px)" }}>
            <ChatTab
              messages={chatMessages}
              onSend={wrappedSendChat}
              playerName={playerName}
              connected={connected}
            />
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div className="main" style={{ padding: 0 }}>
            <DesktopProfilePanel
              player={fullPlayer}
              recentActivity={recentActivity}
              avatarUrl={avatarUrl}
              onAvatarChange={persistAvatar}
              onNameChange={handleNameChange}
              theme={theme}
              toggleTheme={toggleTheme}
              onLeave={handleLeave}
              settings={settings}
              updateSettings={updateSettings}
              resetSettings={resetSettings}
            />
          </div>
        )}

      </div>

      {/* ── Mobile: tab-based single column ── */}
      <div className="mobile-main">

        {/* HOME — phase-aware hub */}
        <div className={`mobile-tab-content${activeTab === "home" ? " active" : ""}`}>
          {matchPhase === "live" ? (
            <>
              <WinProbBar home={matchScore.home} away={matchScore.away} />
              <SquadOverviewCard player={fullPlayer} avatarUrl={avatarUrl} />
              <DailyQuestsCard quests={quests} onClaim={claimQuest} onSound={playSound} compact />
              {activityFeed.length > 0 && (
                <div className="activity-stream">
                  <div className="activity-hdr">Live Activity</div>
                  {activityFeed.slice(0, 6).map(a => (
                    <div key={a.id} className="activity-item">
                      <span className="activity-icon">⭐</span>
                      <span className="activity-text">{a.text}</span>
                      <span className="activity-time">{Math.round((Date.now() - a.time) / 1000)}s ago</span>
                    </div>
                  ))}
                </div>
              )}
              <TacticalFeed players={leaderboard} currentName={playerName} />
              <GlobalLeadersMini players={leaderboard.slice(0, 3)} />
              <MarketplaceTeaser />
            </>
          ) : (
            <MatchPhaseContent
              phase={matchPhase}
              matchScore={matchScore}
              halfTimeScore={halfTimeScore}
              halfTimeCommentary={halfTimeCommentary}
              myPlayer={myPlayer}
              leaderboard={leaderboard}
              connected={connected}
            />
          )}
        </div>

        {/* ⚡ ARENA — live match + chat feed + reactions */}
        <div className={`mobile-tab-content${activeTab === "arena" ? " active" : ""}`}>
          {prediction && (
            <div className="arena-pred-banner">
              <span className="arena-pred-pulse">🎯</span>
              <span>Prediction live! Answer below</span>
            </div>
          )}
          <MatchFeed events={events} />
          <LiveChat
            messages={chatMessages}
            onSend={wrappedSendChat}
            playerName={playerName}
            compact={true}
          />
          <div className="arena-reactions-wrap">
            <CrowdReactions events={events} />
          </div>
        </div>

        {/* LEADERBOARD — Global / Squad toggle, then squad panel below */}
        <div className={`mobile-tab-content${activeTab === "leaderboard" ? " active" : ""}`}>
          <div className="lb-toggle-bar lb-toggle-bar-mobile">
            <button
              className={`lb-toggle-btn ${lbView === "global" ? "active" : ""}`}
              onClick={() => setLbView("global")}
            >
              <Globe size={14} strokeWidth={1.75} />
              <span>Global</span>
              <span className="lb-toggle-count">{leaderboard.length}</span>
            </button>
            <button
              className={`lb-toggle-btn ${lbView === "squad" ? "active" : ""}`}
              onClick={() => setLbView("squad")}
              disabled={!squad}
            >
              <UsersRound size={14} strokeWidth={1.75} />
              <span>{squad ? squad.name : "Squad"}</span>
              {squad && <span className="lb-toggle-count">{squad.members.length}</span>}
            </button>
          </div>
          {lbView === "squad" && !squad ? (
            <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-3)", margin: "0 12px" }}>
              Create or join a squad below.
            </div>
          ) : (
            <Leaderboard players={visibleLeaderboard} currentPlayerName={playerName} />
          )}
          <div style={{ padding: "0 12px 12px" }}>
            <SquadPanel
              squad={squad}
              onCreate={createSquad}
              onJoin={joinSquad}
              onLeave={leaveSquad}
              onRename={renameSquad}
              onAddMember={addSquadMember}
              onRemoveMember={removeSquadMember}
              myPlayerId={myPlayer?.playerId}
              leaderboard={leaderboard}
            />
          </div>
        </div>

        {/* 👤 PROFILE — inline, no overlay */}
        <div className={`mobile-tab-content${activeTab === "profile" ? " active" : ""}`}>
          <MobileProfileTab
            player={fullPlayer}
            recentActivity={recentActivity}
            avatarUrl={avatarUrl}
            onAvatarChange={persistAvatar}
            onNameChange={handleNameChange}
            theme={theme}
            toggleTheme={toggleTheme}
            onLeave={handleLeave}
            settings={settings}
            updateSettings={updateSettings}
            resetSettings={resetSettings}
          />
        </div>

        {/* 💬 CHAT */}
        <div className={`mobile-tab-content${activeTab === "chat" ? " active" : ""}`}
          style={{ height: "calc(100vh - 56px - 56px)", display: activeTab === "chat" ? "flex" : "none", flexDirection: "column" }}>
          <ChatTab
            messages={chatMessages}
            onSend={wrappedSendChat}
            playerName={playerName}
            connected={connected}
          />
        </div>

      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        {[
          { id: "home",        Icon: Home,          label: "Home"       },
          { id: "arena",       Icon: Zap,           label: "Arena",     badge: prediction ? "!" : null },
          { id: "leaderboard", Icon: Trophy,        label: "Leaders"    },
          { id: "profile",     Icon: User,          label: "Profile"    },
          { id: "chat",        Icon: MessageSquare, label: "Chat"       },
        ].map(tab => (
          <button
            key={tab.id}
            className={`mobile-nav-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mobile-nav-icon">
              <tab.Icon size={20} strokeWidth={1.75} />
              {tab.badge && <span className="mobile-nav-badge">{tab.badge}</span>}
            </span>
            <span className="mobile-nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── AI Commentary (hidden if user muted it in settings) ── */}
      {!settings.muteCommentary && <CommentaryBar commentary={commentary} />}

      {/* ── Welcome back toast ── */}
      {welcomeBack && (
        <div className="welcome-back-toast">
          👋 Welcome back, <strong>{welcomeBack}</strong>! Your progress has been restored.
        </div>
      )}

      {/* ── XP pop animation ── */}
      {xpPop && (
        <div key={xpPop.id} className="xp-pop">+{xpPop.diff} XP ⭐</div>
      )}

      {/* ── Prediction Modal (suppressed if user muted prediction popups) ── */}
      {!settings.mutePredictions && (
        <PredictionModal
          prediction={prediction}
          countdown={predCountdown}
          onAnswer={sendPrediction}
          voted={predVoted}
        />
      )}

      {/* ── Profile Panel overlay (desktop only) ── */}
      {showProfile && (
        <ProfilePanel
          player={fullPlayer}
          recentActivity={recentActivity}
          onClose={() => setShowProfile(false)}
        />
      )}

    </div>
  );
}
