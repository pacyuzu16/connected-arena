"use client";

import LandingPage from "../components/LandingPage";

/**
 * Public homepage. The fan app lives at /app, the admin console at
 * /admin, and the big-screen view at /stadium. Auth is handled inside
 * /app — visitors who already have a session can click the "Get
 * started" CTA and skip straight in.
 */
export default function HomePage() {
  return <LandingPage />;
}
