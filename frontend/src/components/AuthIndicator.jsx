"use client";
/**
 * AuthIndicator — drop-in nav element that adapts to auth state.
 *
 * - No session  → shows "Sign in" + "Get started" buttons (default).
 * - Has session → shows profile pill ([initial] · name ▾) which
 *   opens a small dropdown with Continue / Sign out.
 *
 * Reads the existing Cognito-or-guest session straight from
 * localStorage so it works on any page (landing, venues, etc.)
 * without needing the full ArenaProvider.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, LogOut, Trophy, User } from "lucide-react";

const STORAGE_KEYS = {
  cognitoJwt:   "arena-cognito-jwt",
  cognitoEmail: "arena-cognito-email",
  cognitoName:  "arena-cognito-name",
  guestName:    "arena-player-name",
  guestId:      "arena-player-id",
};

function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const jwt   = localStorage.getItem(STORAGE_KEYS.cognitoJwt);
    const email = localStorage.getItem(STORAGE_KEYS.cognitoEmail);
    const cName = localStorage.getItem(STORAGE_KEYS.cognitoName);
    if (jwt && email) {
      return {
        kind: "member",
        name: cName || email.split("@")[0] || "Fan",
        email,
      };
    }
    const guestName = localStorage.getItem(STORAGE_KEYS.guestName);
    if (guestName) {
      return { kind: "guest", name: guestName, email: null };
    }
  } catch {}
  return null;
}

export default function AuthIndicator() {
  const [session, setSession] = useState(null);
  const [open, setOpen]       = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    setSession(loadSession());
    // Refresh on cross-tab changes
    function onStorage(e) {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        setSession(loadSession());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [open]);

  function signOut() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch {}
    setSession(null);
    setOpen(false);
    if (typeof window !== "undefined") {
      // Hard navigate so any cached arena state is cleared
      window.location.href = "/";
    }
  }

  // ── Signed out — original CTA pair ──────────────────────────────
  if (!session) {
    return (
      <>
        <Link href="/app" className="lp-btn-ghost lp-nav-signin">Sign in</Link>
        <Link href="/app" className="lp-btn-primary lp-nav-cta">
          <span>Get started</span>
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </>
    );
  }

  // ── Signed in — profile pill + dropdown ─────────────────────────
  const initial = (session.name || "?")[0].toUpperCase();
  return (
    <div className="auth-ind-wrap" ref={wrapRef}>
      <button
        type="button"
        className="auth-ind-pill"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="auth-ind-avatar">{initial}</span>
        <span className="auth-ind-name">{session.name}</span>
        {session.kind === "guest" && <span className="auth-ind-tag">Guest</span>}
        <ChevronDown size={13} strokeWidth={1.75} className={`auth-ind-chev ${open ? "is-open" : ""}`} />
      </button>

      {open && (
        <div className="auth-ind-menu" role="menu">
          <div className="auth-ind-menu-head">
            <div className="auth-ind-menu-avatar">{initial}</div>
            <div className="auth-ind-menu-info">
              <div className="auth-ind-menu-name">{session.name}</div>
              {session.email
                ? <div className="auth-ind-menu-email">{session.email}</div>
                : <div className="auth-ind-menu-email">Guest session</div>}
            </div>
          </div>

          <Link href="/app" className="auth-ind-menu-item" onClick={() => setOpen(false)}>
            <Trophy size={14} strokeWidth={1.75} />
            <span>Continue to arena</span>
          </Link>

          <Link href="/app#profile" className="auth-ind-menu-item" onClick={() => setOpen(false)}>
            <User size={14} strokeWidth={1.75} />
            <span>Your profile</span>
          </Link>

          <button type="button" className="auth-ind-menu-item auth-ind-menu-danger" onClick={signOut}>
            <LogOut size={14} strokeWidth={1.75} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
