"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

export default function Navbar({ onStart, showPlayBtn = true }) {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else {
      const isDarkOS = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(isDarkOS ? "light" : "dark");
    }
  };

  return (
    <>
      <header className="lp-hdr">

        {/* ── Hamburger LEFT (mobile only) ── */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={`ham-line${menuOpen ? " open" : ""}`} />
          <span className={`ham-line${menuOpen ? " open" : ""}`} />
          <span className={`ham-line${menuOpen ? " open" : ""}`} />
        </button>

        {/* ── Logo ── */}
        <Link href="/" className="lp-logo" style={{ textDecoration: "none" }}>
          <span className="lp-logo-icon">🏟️</span>
          <span className="lp-logo-text">Connected Arena</span>
        </Link>

        {/* ── Desktop nav (center) ── */}
        <nav className="lp-nav">
          <Link href="/">Home</Link>
          <Link href="/about">About</Link>
          <Link href="/contacts">Contacts</Link>
          <Link href="/stadium" target="_blank" title="Stadium / Big Screen Mode">Stadium Mode</Link>
        </nav>

        {/* ── Right controls ── */}
        <div className="lp-hdr-right">
          <button onClick={toggleTheme} className="theme-btn" title="Toggle Theme">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {showPlayBtn && (
            <button className="lp-hdr-btn lp-hdr-btn-desktop" onClick={onStart}>
              Play Now
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile slide-in menu ── */}
      {menuOpen && (
        <div className="mob-menu-overlay" onClick={() => setMenuOpen(false)}>
          <nav className="mob-menu mob-menu-left" onClick={e => e.stopPropagation()}>
            <div className="mob-menu-brand">
              <span>🏟️</span>
              <span>Connected Arena</span>
            </div>
            <div className="mob-menu-divider" />
            <Link href="/"         className="mob-menu-link" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
            <Link href="/about"    className="mob-menu-link" onClick={() => setMenuOpen(false)}>ℹ️ About</Link>
            <Link href="/contacts" className="mob-menu-link" onClick={() => setMenuOpen(false)}>✉️ Contacts</Link>
            <Link href="/stadium" target="_blank" className="mob-menu-link" onClick={() => setMenuOpen(false)}>📺 Stadium Mode</Link>
            <div className="mob-menu-divider" />
            {showPlayBtn && (
              <button className="mob-menu-play" onClick={() => { setMenuOpen(false); onStart?.(); }}>
                Enter the Arena →
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
