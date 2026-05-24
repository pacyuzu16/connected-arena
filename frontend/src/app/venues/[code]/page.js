/**
 * /venues/[code] — venue detail / entry page.
 *
 * For "live" venues this is a confirmation step before entering the
 * arena. For "upcoming" venues we show a preview with a "notify me
 * when live" CTA.
 *
 * Static-exported via generateStaticParams so each venue gets its
 * own pre-rendered HTML page (and a permalink judges / fans can
 * share or scan via QR).
 */

import { VENUES } from "../../../data/venues";
import VenueEntryClient from "./VenueEntryClient";

// Pre-render one route per venue at build time
export function generateStaticParams() {
  return VENUES.map(v => ({ code: v.code }));
}

export default function Page({ params }) {
  const venue = VENUES.find(v => v.code === params.code?.toUpperCase());
  return <VenueEntryClient venue={venue} />;
}
