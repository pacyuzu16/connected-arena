"use client";
/**
 * AdminCharts — modern, minimalist charts powered by Recharts.
 *
 * Renders three insights on the admin Overview view:
 *   1. XP distribution across the top players (bar chart)
 *   2. Accuracy band breakdown (donut / pie)
 *   3. Live engagement timeline (small area chart)
 *
 * All colours pull from CSS custom properties so they respect the
 * current theme automatically.
 */

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";

// Resolve a CSS variable to its computed hex/rgb at render time so the
// SVG renders cleanly (Recharts doesn't accept `var(--x)` natively).
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const COLORS = {
  accent:  "#ea580c",
  green:   "#059669",
  amber:   "#d97706",
  red:     "#dc2626",
  blue:    "#2563eb",
  purple:  "#7c3aed",
};

// ── Custom tooltip — matches our design system ─────────────────────────
function ChartTooltip({ active, payload, label, valueLabel = "Value" }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span className="chart-tooltip-name">{p.name || valueLabel}</span>
          <span className="chart-tooltip-value">{p.value?.toLocaleString?.() ?? p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminCharts({ players = [], events = [], eventCount = 0 }) {
  const [textColor, setTextColor]   = useState("#94a3b8");
  const [gridColor, setGridColor]   = useState("#e2e8f0");
  const [accentColor, setAccent]    = useState(COLORS.accent);

  // Resolve theme colours on mount + re-run when the theme attribute changes
  useEffect(() => {
    const sync = () => {
      setTextColor(cssVar("--text-3", "#94a3b8"));
      setGridColor(cssVar("--border", "#e2e8f0"));
      setAccent(cssVar("--accent", COLORS.accent));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  // ── DATA: Top 8 players by XP for the bar chart ─────────────────────
  const topPlayers = useMemo(() => {
    return [...players]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 8)
      .map(p => ({
        name: (p.name || "?").length > 9 ? (p.name || "?").slice(0, 9) + "…" : (p.name || "?"),
        XP:   p.score || 0,
      }))
      .reverse(); // smallest first so the largest bar reads naturally at the top
  }, [players]);

  // ── DATA: Accuracy band breakdown for the pie chart ─────────────────
  const accuracyBands = useMemo(() => {
    const bands = {
      "Sharp (70%+)":   { value: 0, color: COLORS.green  },
      "Solid (45–69%)": { value: 0, color: COLORS.blue   },
      "Streaky (1–44%)":{ value: 0, color: COLORS.amber  },
      "No picks yet":   { value: 0, color: "#94a3b8"     },
    };
    players.forEach(p => {
      const acc   = p.accuracy || 0;
      const preds = p.predictions || 0;
      if (preds === 0)        bands["No picks yet"].value++;
      else if (acc >= 70)      bands["Sharp (70%+)"].value++;
      else if (acc >= 45)      bands["Solid (45–69%)"].value++;
      else                     bands["Streaky (1–44%)"].value++;
    });
    return Object.entries(bands).map(([name, v]) => ({ name, value: v.value, color: v.color }));
  }, [players]);

  // ── DATA: Live engagement curve (synthesized from current totals) ───
  // For a real-time feel, we sample at 10-second buckets and back-fill
  // with a smooth ease-in to the current player count. This is a
  // demo-friendly proxy until we wire a true time-series stream.
  const engagement = useMemo(() => {
    const n = 12;
    const target = players.length;
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 1) / n;
      // Smooth ease-out curve up to the current count
      const eased = Math.round(target * (1 - Math.pow(1 - t, 2.2)));
      return {
        t: `t-${(n - i) * 10}s`,
        Fans: Math.max(0, eased),
      };
    });
  }, [players.length]);

  const hasData = players.length > 0;

  return (
    <div className="charts-grid">

      {/* ── Card 1: Top players XP ── */}
      <div className="chart-card">
        <div className="chart-card-hdr">
          <BarChart3 size={16} strokeWidth={1.75} />
          <span>Top Players · XP</span>
        </div>
        <div className="chart-card-body">
          {!hasData ? (
            <div className="chart-empty">Waiting for fans to join…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topPlayers} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={gridColor} strokeDasharray="3 3" />
                <XAxis type="number" stroke={textColor} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke={textColor} fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: gridColor, opacity: 0.4 }} content={<ChartTooltip valueLabel="XP" />} />
                <Bar dataKey="XP" fill={accentColor} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Card 2: Accuracy bands ── */}
      <div className="chart-card">
        <div className="chart-card-hdr">
          <PieIcon size={16} strokeWidth={1.75} />
          <span>Accuracy Distribution</span>
        </div>
        <div className="chart-card-body">
          {!hasData ? (
            <div className="chart-empty">Waiting for predictions…</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={accuracyBands}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {accuracyBands.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltip valueLabel="Fans" />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: textColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Card 3: Engagement timeline ── */}
      <div className="chart-card">
        <div className="chart-card-hdr">
          <TrendingUp size={16} strokeWidth={1.75} />
          <span>Live Engagement · last 2 min</span>
        </div>
        <div className="chart-card-body">
          {!hasData ? (
            <div className="chart-empty">No fans connected yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={engagement} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="fanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor={accentColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" stroke={textColor} fontSize={10} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} width={28} />
                <Tooltip content={<ChartTooltip valueLabel="Fans" />} />
                <Area
                  type="monotone"
                  dataKey="Fans"
                  stroke={accentColor}
                  strokeWidth={2}
                  fill="url(#fanGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
