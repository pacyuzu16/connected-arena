"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, MapPin, Users, Radio,
  Clock, BellRing, AlertCircle, Trophy,
} from "lucide-react";
import Logo from "../../../components/Logo";

const STORAGE_KEY = "arena-active-venue";

/**
 * Client-side venue entry shell.
 *  - Live venue: hero with primary "Enter the arena" CTA
 *  - Upcoming:   preview with "Notify me" toggle (local only)
 *  - Soon:       coming-soon banner
 *  - Unknown:    not-found state with Back to venues
 */
export default function VenueEntryClient({ venue }) {
  const router = useRouter();
  const [reminded, setReminded] = useState(false);

  // Reminders stored locally so the button feels real for the demo
  useEffect(() => {
    if (!venue) return;
    try {
      const raw = JSON.parse(localStorage.getItem("arena-venue-reminders") || "[]");
      setReminded(raw.includes(venue.code));
    } catch {}
  }, [venue]);

  function toggleReminder() {
    if (!venue) return;
    try {
      const raw = JSON.parse(localStorage.getItem("arena-venue-reminders") || "[]");
      const next = reminded ? raw.filter(c => c !== venue.code) : [...raw, venue.code];
      localStorage.setItem("arena-venue-reminders", JSON.stringify(next));
      setReminded(!reminded);
    } catch {}
  }

  function enterStadium() {
    if (!venue) return;
    try { localStorage.setItem(STORAGE_KEY, venue.code); } catch {}
    router.push("/app");
  }

  // ── Unknown code ──────────────────────────────────────────────────
  if (!venue) {
    return (
      <div className="ven-page ven-page-404">
        <div className="ven-404">
          <AlertCircle size={32} strokeWidth={1.5} />
          <h1>Stadium not found</h1>
          <p>We couldn't find a venue with that code.</p>
          <Link href="/venues" className="ven-back-btn">
            <ArrowLeft size={14} strokeWidth={2} />
            <span>Back to all stadiums</span>
          </Link>
        </div>
      </div>
    );
  }

  const isLive     = venue.status === "live";
  const isUpcoming = venue.status === "upcoming";
  const isSoon     = venue.status === "soon";

  return (
    <div className="ven-page">

      {/* Backdrop with the venue image */}
      <div
        className="ven-bg"
        style={{ backgroundImage: `url("${venue.image}")` }}
        role="presentation"
      />
      <div className="ven-bg-shade" />

      {/* Top bar */}
      <header className="ven-topbar">
        <Link href="/venues" className="ven-back-btn">
          <ArrowLeft size={14} strokeWidth={2} />
          <span>All stadiums</span>
        </Link>
        <Link href="/" className="ven-brand">
          <Logo size={32} className="ven-brand-mark" />
          <span>Connected Arena</span>
        </Link>
        <Link href="/app" className="ven-skip">Skip to arena →</Link>
      </header>

      {/* Hero panel */}
      <main className="ven-main">
        <div className="ven-card">

          {/* Status badge */}
          <div className={`ven-status ven-status-${venue.status}`}>
            {isLive    && <><Radio    size={11} strokeWidth={2.25} /> LIVE NOW</>}
            {isUpcoming&& <><Clock    size={11} strokeWidth={2} /> {venue.matchLabel.toUpperCase()}</>}
            {isSoon    && <><BellRing size={11} strokeWidth={2} /> COMING SOON</>}
          </div>

          {/* Location */}
          <div className="ven-loc">
            <MapPin size={13} strokeWidth={1.75} />
            <span>{venue.city}, {venue.country}</span>
            <span className="ven-loc-dot" />
            <Users size={13} strokeWidth={1.75} />
            <span>{venue.capacity.toLocaleString()} capacity</span>
          </div>

          {/* Name + description */}
          <h1 className="ven-name">{venue.name}</h1>
          <p className="ven-desc">{venue.description}</p>

          {/* Match strip */}
          <div className="ven-match-block">
            <div className="ven-match-label">Today's fixture</div>
            <div className="ven-match-teams">
              <div className="ven-match-team">
                <span className="ven-team-bubble" style={{ background: venue.homeTeam.color }}>
                  {venue.homeTeam.code}
                </span>
                <span className="ven-team-name">{venue.homeTeam.name}</span>
              </div>
              <div className="ven-match-vs">vs</div>
              <div className="ven-match-team ven-match-team-away">
                <span className="ven-team-bubble" style={{ background: venue.awayTeam.color }}>
                  {venue.awayTeam.code}
                </span>
                <span className="ven-team-name">{venue.awayTeam.name}</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          {isLive && (
            <button className="ven-cta-primary" onClick={enterStadium}>
              <Trophy size={16} strokeWidth={1.75} />
              <span>Enter the stadium</span>
              <ArrowRight size={14} strokeWidth={2} />
            </button>
          )}

          {isUpcoming && (
            <div className="ven-upcoming-row">
              <button
                className={`ven-cta-secondary ${reminded ? "is-on" : ""}`}
                onClick={toggleReminder}
              >
                <BellRing size={14} strokeWidth={1.75} />
                <span>{reminded ? "We'll remind you" : "Remind me when it starts"}</span>
              </button>
              <Link href="/app" className="ven-cta-link">
                Or play the live match now →
              </Link>
            </div>
          )}

          {isSoon && (
            <div className="ven-upcoming-row">
              <button
                className={`ven-cta-secondary ${reminded ? "is-on" : ""}`}
                onClick={toggleReminder}
              >
                <BellRing size={14} strokeWidth={1.75} />
                <span>{reminded ? "We'll let you know" : "Tell me when this venue is live"}</span>
              </button>
            </div>
          )}

          {/* Footer note */}
          <div className="ven-foot">
            Walked in physically? Look for the <strong>{venue.code}</strong> QR code at the entrance and scan to enter the digital arena from your phone.
          </div>
        </div>
      </main>
    </div>
  );
}
