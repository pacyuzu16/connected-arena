"use client";
/**
 * useSounds.js  —  Connected Arena sound system
 * -------------------------------------------------------------------
 * Synthesized, dependency-free audio using the Web Audio API.
 * No external assets — every sound is generated from oscillators on
 * the fly. Total CPU/memory cost is essentially zero.
 *
 * Sounds:
 *   • goal           — bright ascending major triad (C5, E5, G5) — celebratory
 *   • correct        — short two-note ding (E5 → A5)              — win
 *   • wrong          — descending dull tone (G4 → C4)             — loss
 *   • predictionOpen — soft "tick" + rising mini-arpeggio          — alert
 *   • chatSend       — soft pop                                   — sent
 *   • levelUp        — triumphant 4-note arpeggio                 — milestone
 *   • rankUp         — same shape, different timbre               — climb
 *   • notification   — single soft bell                           — generic
 *
 * Respects the `settings.sound` toggle from useSettings.
 *
 * Usage:
 *   const { play, unlock } = useSounds(settings.sound);
 *   // anywhere, then:
 *   play("goal");
 *
 * Browser autoplay policy: the AudioContext is created lazily and
 * resumed on the first user gesture so we never violate the policy.
 */

import { useEffect, useRef, useCallback } from "react";

let _ctx = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  _ctx = new AC();
  return _ctx;
}

/** Play a single tone at a given frequency, duration, and timbre. */
function tone(ctx, { freq, start = 0, dur = 0.18, type = "sine", gain = 0.18, attack = 0.005, release = 0.06 }) {
  const t0  = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type  = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Quick ADSR for click-free playback
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.setValueAtTime(gain, t0 + Math.max(attack, dur - release));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Play a tone with a frequency sweep (useful for "whoosh" effects). */
function sweep(ctx, { from, to, start = 0, dur = 0.25, type = "sine", gain = 0.16 }) {
  const t0  = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.type  = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const NOTES = { C4: 261.63, E4: 329.63, G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00, C6: 1046.50 };

const RECIPES = {
  goal: (ctx) => {
    // C5 + E5 + G5 ascending major triad with a bright square overtone
    tone(ctx, { freq: NOTES.C5, start: 0.00, dur: 0.16, type: "triangle", gain: 0.20 });
    tone(ctx, { freq: NOTES.E5, start: 0.10, dur: 0.18, type: "triangle", gain: 0.22 });
    tone(ctx, { freq: NOTES.G5, start: 0.22, dur: 0.30, type: "triangle", gain: 0.24 });
    tone(ctx, { freq: NOTES.C6, start: 0.34, dur: 0.45, type: "sine",     gain: 0.18 });
  },
  correct: (ctx) => {
    tone(ctx, { freq: NOTES.E5, start: 0.00, dur: 0.10, type: "sine", gain: 0.20 });
    tone(ctx, { freq: NOTES.A5, start: 0.08, dur: 0.22, type: "sine", gain: 0.22 });
  },
  wrong: (ctx) => {
    sweep(ctx, { from: NOTES.G4, to: NOTES.C4, dur: 0.30, type: "sawtooth", gain: 0.12 });
  },
  predictionOpen: (ctx) => {
    // Soft alert: tick + quick rising arpeggio
    tone(ctx, { freq: NOTES.A4, start: 0.00, dur: 0.06, type: "square",   gain: 0.10 });
    tone(ctx, { freq: NOTES.E5, start: 0.08, dur: 0.08, type: "triangle", gain: 0.16 });
    tone(ctx, { freq: NOTES.A5, start: 0.15, dur: 0.14, type: "triangle", gain: 0.18 });
  },
  chatSend: (ctx) => {
    sweep(ctx, { from: NOTES.A4 * 1.5, to: NOTES.A5 * 1.5, dur: 0.07, type: "sine", gain: 0.08 });
  },
  levelUp: (ctx) => {
    // Triumphant arpeggio: C-E-G-C
    tone(ctx, { freq: NOTES.C5, start: 0.00, dur: 0.10, type: "triangle", gain: 0.22 });
    tone(ctx, { freq: NOTES.E5, start: 0.09, dur: 0.10, type: "triangle", gain: 0.22 });
    tone(ctx, { freq: NOTES.G5, start: 0.18, dur: 0.10, type: "triangle", gain: 0.22 });
    tone(ctx, { freq: NOTES.C6, start: 0.27, dur: 0.45, type: "triangle", gain: 0.26 });
  },
  rankUp: (ctx) => {
    tone(ctx, { freq: NOTES.E5, start: 0.00, dur: 0.10, type: "sine", gain: 0.20 });
    tone(ctx, { freq: NOTES.G5, start: 0.09, dur: 0.10, type: "sine", gain: 0.22 });
    tone(ctx, { freq: NOTES.C6, start: 0.18, dur: 0.35, type: "sine", gain: 0.26 });
  },
  notification: (ctx) => {
    tone(ctx, { freq: NOTES.E5, start: 0.00, dur: 0.20, type: "sine", gain: 0.16 });
  },
};

export default function useSounds(soundEnabled = true) {
  const enabledRef = useRef(soundEnabled);
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled]);

  // Unlock the AudioContext on the first user gesture so subsequent
  // programmatic play() calls work without violating autoplay policy.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function unlock() {
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown",     unlock);
    }
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown",     unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown",     unlock);
    };
  }, []);

  const play = useCallback((name) => {
    if (!enabledRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const recipe = RECIPES[name];
    if (recipe) {
      try { recipe(ctx); } catch (e) { /* swallow */ }
    }
  }, []);

  // Manual unlock — useful when called from a button click for first-time setup
  const unlock = useCallback(() => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
  }, []);

  return { play, unlock };
}
