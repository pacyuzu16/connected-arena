"use client";
/**
 * /venues — stadium directory page.
 *
 * Lists every venue as a rich card. Live venues show a pulsing badge
 * and a primary CTA; upcoming venues are previewable; "soon" venues
 * are surfaced but not yet enterable.
 *
 * No auth, no extra backend — the whole page is static.
 */

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { VENUES, LIVE_VENUES } from "../../data/venues";
import VenueCard from "../../components/VenueCard";

export default function VenuesPage() {
  return (
    <div className="venues-page">

      {/* Top bar */}
      <header className="venues-topbar">
        <Link href="/" className="venues-back">
          <ArrowLeft size={16} strokeWidth={1.75} />
          <span>Back to home</span>
        </Link>

        <Link href="/" className="venues-brand">
          <span className="venues-brand-mark">CA</span>
          <span className="venues-brand-name">Connected Arena</span>
        </Link>

        <Link href="/app" className="venues-skip">Skip to arena →</Link>
      </header>

      {/* Hero */}
      <section className="venues-hero">
        <div className="venues-hero-pill">
          <MapPin size={12} strokeWidth={1.75} />
          <span>{VENUES.length} venues · {LIVE_VENUES.length} live now</span>
        </div>
        <h1 className="venues-hero-title">Pick your stadium</h1>
        <p className="venues-hero-sub">
          Choose where you want to watch from. Each venue brings its own atmosphere,
          its own match, and its own crowd of fans to compete with. Walk into a real
          stadium? Scan the QR at the gate to land here automatically.
        </p>
      </section>

      {/* Grid */}
      <section className="venues-section">
        <div className="venues-section-head">
          <h2 className="venues-section-title">Live right now</h2>
          <span className="venues-section-count">{LIVE_VENUES.length}</span>
        </div>
        <div className="venues-grid">
          {LIVE_VENUES.map(v => <VenueCard key={v.code} venue={v} />)}
        </div>
      </section>

      <section className="venues-section">
        <div className="venues-section-head">
          <h2 className="venues-section-title">Coming up</h2>
          <span className="venues-section-count">{VENUES.length - LIVE_VENUES.length}</span>
        </div>
        <div className="venues-grid">
          {VENUES.filter(v => v.status !== "live").map(v => (
            <VenueCard key={v.code} venue={v} />
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="venues-footnote">
        Connected Arena · A real-time experience for football fans worldwide
      </footer>
    </div>
  );
}
