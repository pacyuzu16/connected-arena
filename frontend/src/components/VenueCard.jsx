"use client";
/**
 * VenueCard — rich card for one stadium.
 *
 * Props:
 *   venue      : a venue object from data/venues.js
 *   onSelect() : called when user taps Enter
 */

import Link from "next/link";
import { MapPin, Users, ArrowRight, Radio, Clock, BellRing } from "lucide-react";

export default function VenueCard({ venue }) {
  const isLive     = venue.status === "live";
  const isUpcoming = venue.status === "upcoming";
  const isSoon     = venue.status === "soon";

  return (
    <article className={`venue-card venue-card-${venue.status}`}>
      {/* Background image */}
      <div
        className="venue-card-bg"
        style={{ backgroundImage: `url("${venue.image}")` }}
        role="presentation"
      />
      <div className="venue-card-shade" />

      {/* Status badge (top right) */}
      <div className={`venue-badge venue-badge-${venue.status}`}>
        {isLive    && <><Radio    size={11} strokeWidth={2.25} /> LIVE</>}
        {isUpcoming&& <><Clock    size={11} strokeWidth={2} /> NEXT</>}
        {isSoon    && <><BellRing size={11} strokeWidth={2} /> SOON</>}
      </div>

      {/* Content */}
      <div className="venue-card-body">
        <div className="venue-card-loc">
          <MapPin size={11} strokeWidth={1.75} />
          <span>{venue.city}, {venue.country}</span>
          <span className="venue-card-loc-divider">·</span>
          <Users size={11} strokeWidth={1.75} />
          <span>{venue.capacity.toLocaleString()}</span>
        </div>

        <h3 className="venue-card-name">{venue.name}</h3>
        <p className="venue-card-desc">{venue.description}</p>

        {/* Match strip */}
        <div className="venue-match">
          <div className="venue-match-teams">
            <span className="venue-team" style={{ "--c": venue.homeTeam.color }}>
              <span className="venue-team-dot" />
              <span>{venue.homeTeam.code}</span>
            </span>
            <span className="venue-match-vs">vs</span>
            <span className="venue-team" style={{ "--c": venue.awayTeam.color }}>
              <span className="venue-team-dot" />
              <span>{venue.awayTeam.code}</span>
            </span>
          </div>
          <div className="venue-match-meta">{venue.matchLabel}</div>
        </div>

        {/* Action */}
        {isLive ? (
          <Link href={`/venues/${venue.code}`} className="venue-enter-btn">
            <span>Enter stadium</span>
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        ) : isUpcoming ? (
          <Link href={`/venues/${venue.code}`} className="venue-enter-btn venue-enter-btn-ghost">
            <span>Preview venue</span>
            <ArrowRight size={14} strokeWidth={2} />
          </Link>
        ) : (
          <button className="venue-enter-btn venue-enter-btn-disabled" disabled>
            Coming soon
          </button>
        )}
      </div>
    </article>
  );
}
