"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Ticket } from "lucide-react";
import { signIn, signUp, confirmSignUp } from "../utils/cognito";
import Logo from "./Logo";

// Lazy-load the QR scanner — pulls in html5-qrcode only when the user
// taps "Scan ticket", keeping the initial auth-screen bundle slim.
const TicketScan = dynamic(() => import("./TicketScan"), { ssr: false });

/**
 * AuthScreen
 * ----------
 * Email/password sign-in and sign-up via Cognito.
 * No SSO, no Google, no hosted UI redirect.
 *
 * Props:
 *   onAuth(result)  — called with { jwt, sub, email, name } on success
 *   onGuest()       — called when user clicks "Continue as Guest"
 *   onTicket(t)     — optional: { venue, seat, name } from a scanned/typed
 *                     match-ticket QR. If omitted, falls back to onGuest()
 *                     with the ticket holder's name.
 */
export default function AuthScreen({ onAuth, onGuest, onTicket }) {
  const [showScan, setShowScan] = useState(false);
  const [mode, setMode]         = useState("signin"); // signin | signup | verify
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [dispName, setDispName] = useState("");
  const [code, setCode]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");

  const clear = () => { setError(""); setInfo(""); };

  async function handleSignIn(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      const result = await signIn(email, password);
      onAuth(result);
    } catch (err) {
      setError(err.message || "Sign in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      await signUp(email, password, dispName || email.split("@")[0]);
      setMode("verify");
      setInfo("Check your email for a 6-digit verification code.");
    } catch (err) {
      setError(err.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault(); clear(); setLoading(true);
    try {
      await confirmSignUp(email, code);
      setInfo("Email verified! Signing you in…");
      const result = await signIn(email, password);
      onAuth(result);
    } catch (err) {
      setError(err.message || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      {/* Back to home (top-left, fixed) */}
      <Link href="/" className="auth-back-btn" aria-label="Back to home">
        <ArrowLeft size={16} strokeWidth={1.75} />
        <span>Back to home</span>
      </Link>

      <div className="auth-card">

        {/* Header */}
        <div className="auth-header">
          <Logo size={56} className="auth-logo auth-logo-mark" />
          <div className="auth-title">Connected Arena</div>
          <div className="auth-sub">
            {mode === "signin" && "Sign in to save your XP forever"}
            {mode === "signup" && "Create your fan account"}
            {mode === "verify" && "Verify your email"}
          </div>
        </div>

        {/* Sign In */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="auth-form">
            <input
              className="auth-input" type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
            />
            <input
              className="auth-input" type="password" placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signup"); }}>
              No account yet? Create one →
            </button>
          </form>
        )}

        {/* Sign Up */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="auth-form">
            <input
              className="auth-input" type="text" placeholder="Display name (shown on leaderboard)"
              value={dispName} onChange={e => setDispName(e.target.value)}
              autoFocus maxLength={24}
            />
            <input
              className="auth-input" type="email" placeholder="Email address"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <input
              className="auth-input" type="password" placeholder="Password (min 8 characters)"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signin"); }}>
              Already have an account? Sign in →
            </button>
          </form>
        )}

        {/* Email verification */}
        {mode === "verify" && (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="auth-verify-hint">
              A 6-digit code was sent to <strong>{email}</strong>
            </div>
            <input
              className="auth-input auth-code-input"
              type="text" placeholder="000000" maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            {error && <div className="auth-error">{error}</div>}
            {info  && <div className="auth-info">{info}</div>}
            <button
              className="auth-submit-btn" type="submit"
              disabled={loading || code.length < 6}
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button type="button" className="auth-switch-btn"
              onClick={() => { clear(); setMode("signup"); }}>
              ← Back
            </button>
          </form>
        )}

        {/* Guest + Ticket options — both passwordless entry paths */}
        <div className="auth-alt-wrap">
          <button className="auth-guest-btn" onClick={onGuest} disabled={loading}>
            Continue as Guest
          </button>
          <button
            type="button"
            className="auth-ticket-btn"
            onClick={() => setShowScan(true)}
            disabled={loading}
          >
            <Ticket size={15} strokeWidth={1.75} />
            <span>Scan match ticket</span>
          </button>
          <div className="auth-guest-note">
            Guest progress saves to this device · Ticket scan lands you in your stadium
          </div>
        </div>

      </div>

      {/* QR ticket scanner overlay (lazy-loaded) */}
      {showScan && (
        <TicketScan
          onClose={() => setShowScan(false)}
          onTicketScanned={(t) => {
            setShowScan(false);
            if (onTicket) {
              onTicket(t);
            } else if (onGuest) {
              // Graceful fallback: enter as a guest using the ticket-holder's name
              const fallbackName = t.name || (t.seat ? `Seat ${t.seat}` : "Stadium Guest");
              onGuest(fallbackName, "casual", t.venue || null);
            }
          }}
        />
      )}
    </div>
  );
}
