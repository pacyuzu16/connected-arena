"use client";
/**
 * TicketScan — full-screen ticket QR code scanner.
 *
 * Real fans walk into a stadium, scan the QR on their physical ticket,
 * and land directly in the arena with their seat / venue context pre-set.
 * No account needed. This is the spatial / cross-platform north-star
 * touchpoint the Challenge 4 brief explicitly calls for.
 *
 * Ticket QR payload formats accepted (any of these works):
 *   1. Plain URL:        https://d1706ex99mjina.cloudfront.net/venues/FORSTEREI
 *   2. Hash-style:       arena://ticket?v=FORSTEREI&s=A12-78&n=Alex
 *   3. Simple code:      FORSTEREI-A12-78-ALEX
 *   4. JSON:             {"venue":"FORSTEREI","seat":"A12-78","name":"Alex"}
 *
 * Falls back to manual code entry if the camera isn't available
 * (denied, no HTTPS, no device camera, etc.).
 *
 * Props:
 *   onClose()           — closes the scanner
 *   onTicketScanned({ venue, seat, name }) — fires when a ticket is parsed
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Keyboard, X, ArrowLeft, CheckCircle2, Loader2, AlertCircle, Ticket } from "lucide-react";

/* ── Demo ticket — pre-filled "Try demo" button uses this ────────── */
const DEMO_TICKET = "FORSTEREI-B12-78-DEMO";

/* ── Parse any of the supported QR payload formats into { venue, seat, name } */
function parseTicket(text) {
  if (!text || typeof text !== "string") return null;
  const raw = text.trim();
  if (!raw) return null;

  // JSON
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      if (obj.venue) return { venue: obj.venue, seat: obj.seat || "", name: obj.name || "" };
    } catch {}
  }

  // URL containing /venues/CODE — captures real stadium URLs printed on tickets
  const urlMatch = raw.match(/\/venues\/([A-Z0-9]{3,12})/i);
  if (urlMatch) return { venue: urlMatch[1].toUpperCase(), seat: "", name: "" };

  // arena://ticket query-string style
  if (raw.startsWith("arena://ticket")) {
    try {
      const u = new URL(raw.replace("arena://", "https://x.invalid/"));
      const v = u.searchParams.get("v");
      if (v) return {
        venue: v.toUpperCase(),
        seat:  u.searchParams.get("s") || "",
        name:  u.searchParams.get("n") || "",
      };
    } catch {}
  }

  // Simple dash-separated code: VENUE-SEAT-SEAT-NAME
  const parts = raw.split("-").map(p => p.trim()).filter(Boolean);
  if (parts.length >= 1 && /^[A-Z0-9]+$/i.test(parts[0])) {
    return {
      venue: parts[0].toUpperCase(),
      seat:  parts.slice(1, -1).join("-") || "",
      name:  parts[parts.length - 1] || "",
    };
  }

  return null;
}

/* ── Friendly display name from the ticket parts ──────────────────── */
function ticketDisplayName(t) {
  if (!t) return "";
  if (t.name) return t.name;
  if (t.seat) return `Seat ${t.seat}`;
  return "Stadium Guest";
}

export default function TicketScan({ onClose, onTicketScanned }) {
  const [mode, setMode]     = useState("camera"); // camera | manual
  const [error, setError]   = useState("");
  const [parsed, setParsed] = useState(null); // { venue, seat, name }
  const [manualCode, setManualCode] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const scannerRef = useRef(null);
  const scannerIdRef = useRef("ticket-qr-region");
  const startedRef = useRef(false);

  // ── Start camera scanner on mount (when in camera mode) ───────────
  useEffect(() => {
    if (mode !== "camera" || parsed) return;
    let cancelled = false;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, // back camera on mobile
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            // Success callback
            if (startedRef.current === "consumed") return;
            startedRef.current = "consumed";
            const t = parseTicket(decoded);
            if (t) {
              setParsed(t);
            } else {
              setError("Couldn't read that ticket — try manual entry below.");
              startedRef.current = false;
            }
          },
          () => { /* per-frame error — ignore */ },
        );
        startedRef.current = true;
        setCameraReady(true);
      } catch (err) {
        // Camera unavailable: blocked, no HTTPS, no device, etc.
        setError(`Camera unavailable: ${err?.message || "permission denied"}. Use manual entry instead.`);
        setMode("manual");
      }
    }
    startScanner();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        try { s.stop().then(() => s.clear()).catch(() => {}); } catch {}
      }
      startedRef.current = false;
    };
  }, [mode, parsed]);

  // ── Manual code submit ────────────────────────────────────────────
  function handleManualSubmit(e) {
    e.preventDefault();
    setError("");
    const t = parseTicket(manualCode.toUpperCase());
    if (!t) {
      setError("Code doesn't look valid. Format: VENUE-SEAT-NAME (e.g. FORSTEREI-A12-78-ALEX).");
      return;
    }
    setParsed(t);
  }

  function tryDemo() {
    setManualCode(DEMO_TICKET);
    setError("");
    const t = parseTicket(DEMO_TICKET);
    if (t) setParsed(t);
  }

  function confirmEntry() {
    if (!parsed) return;
    onTicketScanned?.(parsed);
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="ts-overlay">
      <div className="ts-shell">

        {/* Top bar */}
        <div className="ts-topbar">
          <button className="ts-back" onClick={onClose} aria-label="Close ticket scan">
            <ArrowLeft size={16} strokeWidth={1.75} />
            <span>Back</span>
          </button>
          <div className="ts-title">
            <Ticket size={16} strokeWidth={1.75} />
            <span>Scan match ticket</span>
          </div>
          <button className="ts-back" onClick={onClose} aria-label="Dismiss">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* ── PARSED: confirmation ── */}
        {parsed ? (
          <div className="ts-confirm">
            <div className="ts-success-icon"><CheckCircle2 size={36} strokeWidth={1.5} /></div>
            <h2 className="ts-confirm-title">Ticket verified</h2>
            <div className="ts-confirm-meta">
              <div className="ts-meta-row">
                <span className="ts-meta-label">Stadium</span>
                <span className="ts-meta-value">{parsed.venue}</span>
              </div>
              {parsed.seat && (
                <div className="ts-meta-row">
                  <span className="ts-meta-label">Seat</span>
                  <span className="ts-meta-value">{parsed.seat}</span>
                </div>
              )}
              <div className="ts-meta-row">
                <span className="ts-meta-label">Name</span>
                <span className="ts-meta-value">{ticketDisplayName(parsed)}</span>
              </div>
            </div>
            <button className="ts-cta-primary" onClick={confirmEntry}>
              Enter the arena →
            </button>
            <button className="ts-cta-ghost" onClick={() => { setParsed(null); setManualCode(""); startedRef.current = false; }}>
              Wrong ticket — scan again
            </button>
          </div>
        ) : (
          <>
            {/* ── Mode tabs ── */}
            <div className="ts-tabs">
              <button
                className={`ts-tab ${mode === "camera" ? "active" : ""}`}
                onClick={() => { setMode("camera"); setError(""); }}
              >
                <Camera size={14} strokeWidth={1.75} />
                <span>Scan QR</span>
              </button>
              <button
                className={`ts-tab ${mode === "manual" ? "active" : ""}`}
                onClick={() => { setMode("manual"); setError(""); }}
              >
                <Keyboard size={14} strokeWidth={1.75} />
                <span>Enter code</span>
              </button>
            </div>

            {/* ── CAMERA MODE ── */}
            {mode === "camera" && (
              <div className="ts-camera-wrap">
                <div id={scannerIdRef.current} className="ts-camera-region" />
                {!cameraReady && !error && (
                  <div className="ts-camera-loading">
                    <Loader2 size={20} className="spin" />
                    <span>Starting camera…</span>
                  </div>
                )}
                <div className="ts-camera-hint">
                  Point at the QR code on your match ticket — it'll scan automatically.
                </div>
              </div>
            )}

            {/* ── MANUAL MODE ── */}
            {mode === "manual" && (
              <form className="ts-manual" onSubmit={handleManualSubmit}>
                <label className="ts-label">Ticket code</label>
                <input
                  className="ts-input"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  placeholder="FORSTEREI-A12-78-ALEX"
                  autoFocus
                  autoCapitalize="characters"
                />
                <div className="ts-format-hint">
                  Format: <code>VENUE-SEAT-NAME</code> · printed on the back of your ticket
                </div>
                {error && (
                  <div className="ts-error">
                    <AlertCircle size={13} strokeWidth={1.75} />
                    <span>{error}</span>
                  </div>
                )}
                <button type="submit" className="ts-cta-primary" disabled={!manualCode.trim()}>
                  Verify ticket
                </button>
                <button type="button" className="ts-cta-link" onClick={tryDemo}>
                  Don't have one? Use a demo ticket →
                </button>
              </form>
            )}

            {/* Inline error for camera mode */}
            {error && mode === "camera" && (
              <div className="ts-error ts-error-floating">
                <AlertCircle size={13} strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}
          </>
        )}

        <div className="ts-footnote">
          Tickets are not stored on our servers — scanning is processed
          entirely on your device. Your account stays anonymous.
        </div>
      </div>
    </div>
  );
}
