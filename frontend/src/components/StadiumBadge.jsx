"use client";
/**
 * StadiumBadge — small chrome element shown at the top of the arena
 * when the user entered via a specific stadium. Click it to go back
 * to the venue directory and pick a different one.
 */

import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";

export default function StadiumBadge({ venue }) {
  if (!venue) return null;
  return (
    <Link
      href="/venues"
      className="stadium-badge"
      title={`${venue.name}, ${venue.city} — switch stadium`}
    >
      <MapPin size={11} strokeWidth={1.75} />
      <span className="stadium-badge-text">
        Watching from <strong>{venue.short || venue.name}</strong>
      </span>
      <ChevronDown size={11} strokeWidth={1.75} className="stadium-badge-chev" />
    </Link>
  );
}
