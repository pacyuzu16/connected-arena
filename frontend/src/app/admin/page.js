"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, Users, Trophy, Activity, Shield,
  LogOut, Menu, RefreshCw, User, Wifi, WifiOff, AlertCircle,
  Search, Ban, CheckCircle2, Loader2, Cpu, Info,
  Target, Sparkles, PieChart, Zap, Monitor, ExternalLink,
} from "lucide-react";
import AdminCharts from "../../components/AdminCharts";

const HOME_TEAM  = "DFL-CLU-000001";
const WS_URL     = process.env.NEXT_PUBLIC_WS_URL || "";
const ADMIN_EMAIL = "admin@gmail.com";

// ── Auth helpers (no cognito-sdk dependency — parse JWT directly) ────────────
function parseJwt(token) {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return {}; }
}
function savedEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("arena-cognito-email") || null;
}
function savedJwt() {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("arena-cognito-jwt");
  if (!t) return null;
  const p = parseJwt(t);
  if (p.exp && p.exp * 1000 < Date.now()) return null; // expired
  return t;
}
function clearCognitoSession() {
  ["arena-cognito-jwt","arena-cognito-sub","arena-cognito-email","arena-cognito-name"]
    .forEach(k => localStorage.removeItem(k));
}

// ── Derived metrics ──────────────────────────────────────────────────────────
function computeInsights(players, events) {
  const out = [];
  if (players.length > 0) {
    const avgAcc = Math.round(players.reduce((s, p) => s + (p.accuracy || 0), 0) / players.length);
    const top    = players.reduce((b, p) => (p.accuracy||0) > (b.accuracy||0) ? p : b, players[0]);
    out.push({ type:"accuracy", icon:"🎯", title:"Accuracy Leader",
      body:`${top?.name} leads at ${top?.accuracy||0}%. Arena average: ${avgAcc}%.` });

    const noAction = players.filter(p => (p.predictions||0) === 0);
    if (noAction.length)
      out.push({ type:"churn", icon:"⚠️", title:"Inactive Fans",
        body:`${noAction.length} fan(s) joined but made 0 predictions. Consider lowering the first-prediction XP threshold.` });

    const streaks = players.filter(p => (p.winStreak||0) >= 3);
    if (streaks.length)
      out.push({ type:"streak", icon:"🔥", title:"Hot Streak Players",
        body:`${streaks.map(p => p.name).join(", ")} on a win streak — great time to surface them in the Chat tab.` });
  }
  const goals = events.filter(e => e.type === "GOAL");
  if (goals.length >= 2)
    out.push({ type:"goals", icon:"⚽", title:"High-Scoring Match",
      body:`${goals.length} goals so far. Prediction accuracy typically peaks after 2+ goals.` });
  if (events.length > 0 && events.length < 25)
    out.push({ type:"peak", icon:"📈", title:"Engagement Forecast",
      body:`Peak engagement predicted around events 45–55. Prepare comeback XP bonuses for bottom-ranked fans.` });
  if (out.length === 0)
    out.push({ type:"idle", icon:"💡", title:"Awaiting Match Data",
      body:"No events yet. Run demo_reset.py then emit_events.py to start a replay." });
  return out;
}

function MiniBar({ label, value, max, color = "var(--accent)" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="admin-bar-row">
      <span className="admin-bar-label">{label}</span>
      <div className="admin-bar-track">
        <div className="admin-bar-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
      <span className="admin-bar-val">{value}</span>
    </div>
  );
}

// ── Admin Auth Form (sign in + sign up + email verify) ───────────────────────
function AdminLogin({ onLogin }) {
  const [mode, setMode]           = useState("signin"); // signin | signup | verify
  const [email, setEmail]         = useState(ADMIN_EMAIL); // pre-fill admin email
  const [password, setPassword]   = useState("");
  const [code, setCode]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [info, setInfo]           = useState("");

  const clear = () => { setError(""); setInfo(""); };

  async function handleSignIn(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const { signIn } = await import("../../utils/cognito");
      const result = await signIn(email, password);
      // JWT may not include email claim — fall back to the typed email
      const effectiveEmail = result.email || email;
      if (effectiveEmail !== ADMIN_EMAIL) {
        clearCognitoSession();
        setError("Access denied. Only admin@gmail.com can access this dashboard.");
      } else {
        // Ensure email is stored even if JWT omitted it
        localStorage.setItem("arena-cognito-email", effectiveEmail);
        onLogin({ ...result, email: effectiveEmail });
      }
    } catch (err) {
      // "User does not exist" → prompt to create account
      if (err.message?.includes("does not exist") || err.code === "UserNotFoundException") {
        setError("No admin account found. Use 'Create Account' below to set one up.");
      } else {
        setError(err.message || "Sign in failed.");
      }
    } finally { setLoading(false); }
  }

  async function handleSignUp(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const { signUp } = await import("../../utils/cognito");
      await signUp(email, password, "Admin");
      setMode("verify");
      setInfo(`Verification code sent to ${email}. Check your inbox.`);
    } catch (err) {
      if (err.message?.includes("already exists") || err.code === "UsernameExistsException") {
        setError("Account already exists. Try signing in instead.");
        setMode("signin");
      } else {
        setError(err.message || "Sign up failed.");
      }
    } finally { setLoading(false); }
  }

  async function handleVerify(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const { confirmSignUp, signIn } = await import("../../utils/cognito");
      await confirmSignUp(email, code);
      setInfo("Email verified! Signing you in…");
      const result = await signIn(email, password);
      onLogin(result);
    } catch (err) {
      setError(err.message || "Verification failed. Check the code and try again.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:16 }}>
      <div className="auth-card" style={{ maxWidth:380, width:"100%" }}>
        <div className="auth-header">
          <div className="auth-logo auth-logo-mark">CA</div>
          <div className="auth-title">Admin Dashboard</div>
          <div className="auth-sub">
            {mode === "signin" && "Sign in with admin@gmail.com"}
            {mode === "signup" && "Create your admin account"}
            {mode === "verify" && "Verify your email"}
          </div>
        </div>

        {/* Sign In */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="auth-form">
            <input className="auth-input" type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <input className="auth-input" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signup"); }}>
              First time? Create admin account →
            </button>
          </form>
        )}

        {/* Sign Up */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="auth-form">
            <input className="auth-input" type="email" placeholder="Admin email"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <input className="auth-input" type="password" placeholder="Password (min 8 chars)"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signin"); }}>
              ← Back to sign in
            </button>
          </form>
        )}

        {/* Email Verify */}
        {mode === "verify" && (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="auth-verify-hint">
              A 6-digit code was sent to <strong>{email}</strong>
            </div>
            <input className="auth-input auth-code-input" type="text"
              placeholder="000000" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g,""))}
              autoFocus />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit-btn" type="submit"
              disabled={loading || code.length < 6}>
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signup"); }}>
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminUser, setAdminUser]   = useState(null);  // null = checking, false = not authed
  const [view,      setView]        = useState("overview"); // sidebar section
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer state
  const [players,   setPlayers]     = useState([]);
  const [allUsers,  setAllUsers]    = useState([]);   // full list with suspended flag
  const [userSearch,setUserSearch]  = useState("");
  const [events,    setEvents]      = useState([]);
  const [actLog,    setActLog]      = useState([]);
  const [matchScore,setMatchScore]  = useState({ home: 0, away: 0 });
  const [eventCount,setEventCount]  = useState(0);
  const [wsStatus,  setWsStatus]    = useState("idle");
  const [wsError,   setWsError]     = useState("");
  const wsRef = useRef(null);

  // ── Auth check on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const jwt   = savedJwt();
    const email = savedEmail();
    if (jwt && email === ADMIN_EMAIL) {
      setAdminUser({ email, jwt });
    } else {
      setAdminUser(false);
    }
  }, []);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null; }
    if (!WS_URL) { setWsStatus("error"); setWsError("NEXT_PUBLIC_WS_URL not set."); return; }

    setWsStatus("connecting"); setWsError("");
    let ws;
    const adminEmail = typeof window !== "undefined"
      ? (localStorage.getItem("arena-cognito-email") || "")
      : "";
    const wsUrl = `${WS_URL}?playerId=admin-dashboard&name=ADMIN&persona=stats_nerd`
      + (adminEmail ? `&email=${encodeURIComponent(adminEmail)}` : "");
    try { ws = new WebSocket(wsUrl); }
    catch (e) { setWsStatus("error"); setWsError(e.message); return; }

    ws.onopen  = () => {
      setWsStatus("connected");
      ws.send(JSON.stringify({ action: "leaderboard" }));
      // Fetch full user list with suspended flags
      ws.send(JSON.stringify({ action: "adminAction", type: "getUsers" }));
    };
    ws.onerror = () => { setWsStatus("error"); setWsError("WebSocket connection failed."); };
    ws.onclose = () => { setWsStatus(p => p === "connected" ? "idle" : p); wsRef.current = null; };
    ws.onmessage = (m) => {
      let data; try { data = JSON.parse(m.data); } catch { return; }
      if (data.type === "LEADERBOARD") setPlayers(data.players || []);
      if (data.type === "ADMIN_ACTION_RESULT") {
        if (data.players) setAllUsers(data.players);
      }
      if (data.type === "MATCH_EVENT") {
        const ev = data.event || {};
        setEventCount(c => c + 1);
        if (ev.eventType === "GOAL")
          setMatchScore(p => ({ home: ev.team===HOME_TEAM ? p.home+1 : p.home, away: ev.team===HOME_TEAM ? p.away : p.away+1 }));
        const entry = { id: Date.now(), type: ev.eventType||"?", team: ev.team||"", time:(ev.eventTime||"").slice(11,16) };
        setEvents(p => [entry, ...p].slice(0, 50));
        setActLog(p => [{ id:Date.now(), text:`${ev.eventType} · ${(ev.eventTime||"").slice(11,16)}`, ts:Date.now() }, ...p].slice(0,100));
      }
    };
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    if (!adminUser) return;
    connect();
    return () => { if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); } };
  }, [adminUser, connect]);

  useEffect(() => {
    const id = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN)
        wsRef.current.send(JSON.stringify({ action: "leaderboard" }));
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Auth states ────────────────────────────────────────────────────────────
  if (adminUser === null) {
    return (
      <div className="arena-loading">
        <div className="arena-loading-logo">⚽</div>
        <div className="arena-loading-text">Loading…</div>
      </div>
    );
  }

  if (adminUser === false) {
    return <AdminLogin onLogin={(result) => setAdminUser(result)} />;
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const insights     = computeInsights(players, events);
  const totalPreds   = players.reduce((s, p) => s + (p.predictions||0), 0);
  const totalCorrect = players.reduce((s, p) => s + (p.correct||0), 0);
  const totalXP      = players.reduce((s, p) => s + (p.score||0), 0);
  const avgAcc       = players.length ? Math.round(players.reduce((s,p) => s+(p.accuracy||0),0)/players.length) : 0;
  const eventTypes   = events.reduce((a,e) => { a[e.type]=(a[e.type]||0)+1; return a; }, {});
  const isConn       = wsStatus === "connected";

  function signOutAdmin() {
    clearCognitoSession();
    setAdminUser(false);
    if (typeof window !== "undefined") window.location.href = "/";
  }

  function sendAdminAction(type, playerId = "") {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ action: "adminAction", type, playerId }));
  }

  function toggleSuspend(user) {
    const action = user.suspended ? "unsuspend" : "suspend";
    sendAdminAction(action, user.playerId);
    // Optimistic UI update
    setAllUsers(prev => prev.map(u =>
      u.playerId === user.playerId ? { ...u, suspended: !u.suspended } : u
    ));
  }

  const filteredUsers = allUsers.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.playerId.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Navigation items for the sidebar — Lucide icons for modern, consistent UI
  const NAV = [
    { id: "overview",   Icon: LayoutDashboard, label: "Overview"        },
    { id: "users",      Icon: Users,           label: "User Management" },
    { id: "leaderboard",Icon: Trophy,          label: "Leaderboard"     },
    { id: "match",      Icon: Activity,        label: "Match Status"    },
    { id: "auth",       Icon: Shield,          label: "Identity & Auth" },
  ];
  const currentNav = NAV.find(n => n.id === view) || NAV[0];

  return (
    <div className="admin-shell">

      {/* ── Sidebar (collapsible on mobile) ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">CA</div>
          <div>
            <div className="admin-sidebar-title">Connected Arena</div>
            <div className="admin-sidebar-sub">Admin Console</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map(({ id, Icon, label }) => (
            <button
              key={id}
              className={`admin-nav-item ${view === id ? "active" : ""}`}
              onClick={() => { setView(id); setSidebarOpen(false); }}
            >
              <Icon size={18} strokeWidth={1.75} className="admin-nav-icon" />
              <span className="admin-nav-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <a
            href="/stadium"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-stadium-link"
            title="Open Stadium / Big-Screen view in a new tab"
          >
            <Monitor size={14} strokeWidth={1.75} />
            <span>Stadium View</span>
            <ExternalLink size={11} strokeWidth={1.75} style={{ marginLeft: "auto", opacity: 0.6 }} />
          </a>
          <div className="admin-user-pill admin-sidebar-user">
            <User size={13} strokeWidth={1.75} />
            <span>{adminUser.email}</span>
          </div>
          <button className="admin-signout-btn admin-sidebar-signout" onClick={signOutAdmin}>
            <LogOut size={15} strokeWidth={1.75} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main content area ── */}
      <main className="admin-main">

        {/* Top bar */}
        <header className="admin-topbar">
          <button className="admin-burger" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <div className="admin-topbar-title">
            <currentNav.Icon size={20} strokeWidth={1.75} className="admin-topbar-icon" />
            <span>{currentNav.label}</span>
          </div>
          <div className="admin-topbar-right">
            <div className={`admin-ws-status ${isConn ? "connected" : wsStatus==="connecting" ? "connecting" : "disconnected"}`}>
              <span className="admin-ws-dot" />
              <span>{isConn ? "Live" : wsStatus==="connecting" ? "Connecting" : wsStatus==="error" ? "Error" : "Offline"}</span>
            </div>
            {!isConn && wsStatus !== "connecting" && (
              <button className="admin-reconnect-btn" onClick={connect}>
                <RefreshCw size={13} strokeWidth={2} />
                <span>{wsStatus === "error" ? "Retry" : "Connect"}</span>
              </button>
            )}
          </div>
        </header>

        {wsStatus === "error" && wsError && (
          <div className="admin-error-banner">
            <AlertCircle size={16} strokeWidth={1.75} />
            <span><strong>WebSocket Error:</strong> {wsError}</span>
          </div>
        )}

      <div className="admin-body">

        {/* ============ OVERVIEW ============ */}
        {view === "overview" && (<>

        {/* ── KPI row ── */}
        <div className="admin-kpi-row">
          {[
            { Icon: Users,        val: players.length, lbl:"Fans Connected",    color:"#059669" },
            { Icon: Target,       val: totalPreds,     lbl:"Total Predictions", color:"var(--accent)" },
            { Icon: CheckCircle2, val: totalCorrect,   lbl:"Correct Picks",     color:"#2563eb" },
            { Icon: Sparkles,     val: totalXP,        lbl:"Total XP Awarded",  color:"#d97706" },
            { Icon: PieChart,     val:`${avgAcc}%`,    lbl:"Avg Accuracy",      color:"#7c3aed" },
            { Icon: Zap,          val: eventCount,     lbl:"Events Processed",  color:"#0891b2" },
          ].map(k => (
            <div key={k.lbl} className="admin-kpi-card">
              <div className="admin-kpi-icon" style={{ color:k.color }}>
                <k.Icon size={20} strokeWidth={1.75} />
              </div>
              <div className="admin-kpi-val" style={{ color:k.color }}>{k.val}</div>
              <div className="admin-kpi-lbl">{k.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Modern Recharts dashboard ── */}
        <AdminCharts players={players} events={events} eventCount={eventCount} />

        {/* ── ML Insights (overview) ── */}
        <div className="admin-card admin-insights-card">
          <div className="admin-card-hdr"><Cpu size={16} strokeWidth={1.75} /> ML-Powered Insights &amp; Recommendations</div>
          <div className="admin-insights-grid">
            {insights.map((ins, i) => (
              <div key={i} className={`admin-insight admin-insight-${ins.type}`}>
                <div className="admin-insight-icon">{ins.icon}</div>
                <div>
                  <div className="admin-insight-title">{ins.title}</div>
                  <div className="admin-insight-body">{ins.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Debug Info (overview footer) ── */}
        <div className="admin-card">
          <div className="admin-card-hdr"><Info size={16} strokeWidth={1.75} /> System Info</div>
          <div style={{ padding:"14px 18px", fontSize:12, color:"var(--text-2)", lineHeight:2 }}>
            <div><strong>WS endpoint:</strong> {WS_URL || <span style={{color:"#ef4444"}}>NOT SET — check .env.local</span>}</div>
            <div><strong>Status:</strong> {wsStatus}</div>
            <div><strong>Players in DB:</strong> {players.length}</div>
            <div><strong>Events this session:</strong> {eventCount}</div>
            <div><strong>Admin:</strong> {adminUser.email}</div>
          </div>
        </div>

        </>)}
        {/* ============ END OVERVIEW ============ */}


        {/* ============ MATCH STATUS ============ */}
        {view === "match" && (
        <div className="admin-grid-2">

          {/* Match Status */}
          <div className="admin-card">
            <div className="admin-card-hdr"><Activity size={16} strokeWidth={1.75} /> Match Status</div>
            <div className="admin-match-score">
              <span className="admin-match-team home">HAM</span>
              <span className="admin-match-num">{matchScore.home} — {matchScore.away}</span>
              <span className="admin-match-team away">BAY</span>
            </div>
            <div className="admin-match-meta">
              <span>Event {eventCount} / ~91</span>
              <div className="admin-progress-track">
                <div className="admin-progress-fill" style={{ width:`${Math.min(100,(eventCount/91)*100)}%` }} />
              </div>
            </div>
            <div className="admin-card-sub">Event distribution</div>
            {Object.keys(eventTypes).length === 0
              ? <div className="admin-empty">{isConn ? "No events yet" : "Connect to see data"}</div>
              : Object.entries(eventTypes).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([type,cnt]) => (
                  <MiniBar key={type} label={type} value={cnt} max={eventCount} />
                ))
            }
          </div>

          {/* Activity Log */}
          <div className="admin-card">
            <div className="admin-card-hdr"><Activity size={16} strokeWidth={1.75} /> Live Activity Log</div>
            {actLog.length === 0
              ? <div className="admin-empty">{isConn ? "Waiting for events…" : "Connect to see activity"}</div>
              : (
                <div className="admin-log">
                  {actLog.slice(0,30).map(a => (
                    <div key={a.id} className="admin-log-row">
                      <span className="admin-log-text">{a.text}</span>
                      <span className="admin-log-time">{Math.round((Date.now()-a.ts)/1000)}s ago</span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
        )}
        {/* ============ END MATCH STATUS ============ */}


        {/* ============ LEADERBOARD ============ */}
        {view === "leaderboard" && (
        <div className="admin-card">
          <div className="admin-card-hdr"><Trophy size={16} strokeWidth={1.75} /> Live Leaderboard</div>
          {players.length === 0
            ? <div className="admin-empty">{isConn ? "No players yet" : "Connect to see live data"}</div>
            : (
              <div className="admin-lb">
                <div className="admin-lb-hdr">
                  <span>#</span><span style={{flex:1}}>Player</span><span>Acc</span><span>XP</span>
                </div>
                {players.slice(0, 50).map((p, i) => (
                  <div key={p.playerId || p.name} className="admin-lb-row">
                    <span className="admin-lb-rank">{i+1}</span>
                    <div className="admin-lb-info">
                      <span className="admin-lb-name">{p.name}</span>
                      {(p.winStreak||0)>=3 && <span className="admin-lb-streak">🔥{p.winStreak}</span>}
                    </div>
                    <span className="admin-lb-acc">{p.accuracy||0}%</span>
                    <span className="admin-lb-xp">⭐{p.score||0}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
        )}
        {/* ============ END LEADERBOARD ============ */}


        {/* ============ IDENTITY & AUTH ============ */}
        {view === "auth" && (
        <div className="admin-card">
          <div className="admin-card-hdr"><Shield size={16} strokeWidth={1.75} /> Identity &amp; Auth Strategy</div>
          <div className="admin-auth-grid">
            <div className="admin-auth-item current">
              <div className="admin-auth-badge">LIVE ✅</div>
              <div className="admin-auth-name">Amazon Cognito — Email / Password</div>
              <div className="admin-auth-desc">
                Cognito User Pool with email+password auth. JWT token passed to WebSocket on connect.
                Backend uses the <code>sub</code> claim as the permanent playerId — XP and rank survive
                any number of refreshes or reconnects.
              </div>
            </div>
            <div className="admin-auth-item current">
              <div className="admin-auth-badge">LIVE ✅</div>
              <div className="admin-auth-name">Guest Mode (localStorage)</div>
              <div className="admin-auth-desc">
                Fans who skip login get a random playerId stored in localStorage.
                XP persists on the same device. Upgradeable to a full Cognito account at any time.
              </div>
            </div>
            <div className="admin-auth-item">
              <div className="admin-auth-badge">PHASE 2</div>
              <div className="admin-auth-name">Google / Social OAuth</div>
              <div className="admin-auth-desc">
                Add Google as an identity provider in Cognito Console. The frontend code is already
                written — <code>getGoogleOAuthUrl()</code> and token exchange are in place.
              </div>
              <div className="admin-auth-status planned">🔵 Planned</div>
            </div>
            <div className="admin-auth-item">
              <div className="admin-auth-badge">PHASE 3</div>
              <div className="admin-auth-name">Stadium QR / NFC + Wearable</div>
              <div className="admin-auth-desc">
                Scan match ticket at turnstile → auto-login with physical attendance linked to
                digital profile. Smart wearables: tap YES/NO on wrist during prediction windows.
              </div>
              <div className="admin-auth-status vision">🟠 North Star</div>
            </div>
          </div>
        </div>
        )}
        {/* ============ END IDENTITY & AUTH ============ */}


        {/* ============ USER MANAGEMENT ============ */}
        {view === "users" && (
        <div className="admin-card">
          <div className="admin-card-hdr" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:8 }}><Users size={16} strokeWidth={1.75} /> User Management</span>
            <button
              className="admin-reconnect-btn"
              style={{ fontSize:11 }}
              onClick={() => sendAdminAction("getUsers")}
            >
              <RefreshCw size={12} strokeWidth={2} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="admin-search-wrap">
            <Search size={15} strokeWidth={1.75} className="admin-search-icon" />
            <input
              className="admin-search-input"
              placeholder="Search by name or player ID"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="admin-empty">
              {isConn ? (
                allUsers.length === 0
                  ? <span style={{display:"inline-flex",alignItems:"center",gap:8}}><Loader2 size={14} className="spin" /> Loading users…</span>
                  : "No users match your search"
              ) : "Connect to manage users"}
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table className="admin-user-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>XP</th>
                    <th>Preds</th>
                    <th>Acc</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u.playerId} className={u.suspended ? "admin-user-suspended" : ""}>
                      <td className="admin-user-rank">{u.rank || i+1}</td>
                      <td className="admin-user-name">
                        <div style={{ fontWeight:600, fontSize:13 }}>{u.name}</div>
                        <div style={{ fontSize:10, color:"var(--text-3)", fontFamily:"monospace" }}>{u.playerId}</div>
                      </td>
                      <td>{u.score}</td>
                      <td>{u.predictions}</td>
                      <td>{u.accuracy}%</td>
                      <td>
                        <span className={`admin-status-pill ${u.suspended ? "suspended" : "active"}`}>
                          {u.suspended
                            ? <><Ban size={11} strokeWidth={2} /> Suspended</>
                            : <><CheckCircle2 size={11} strokeWidth={2} /> Active</>}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`admin-suspend-btn ${u.suspended ? "unsuspend" : "suspend"}`}
                          onClick={() => toggleSuspend(u)}
                        >
                          {u.suspended ? "Unsuspend" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
        {/* ============ END USER MANAGEMENT ============ */}

      </div>
      </main>
    </div>
  );
}
