"use client";
/**
 * Logo — the Connected Arena stadium mark.
 *
 * Single source of truth for the brand image so we can swap the
 * asset (or add dark/light variants) in one place. Renders a plain
 * <img> with sensible defaults: no margin, contained, transparent
 * background, lazy-decoded.
 *
 * Props:
 *   size       — pixel size of the longest edge (default 28)
 *   className  — passthrough
 *   alt        — defaults to "Connected Arena"
 */

const SRC = "/images/stadium-emoji-clipart-md.png";

export default function Logo({ size = 28, className = "", alt = "Connected Arena", ...rest }) {
  return (
    <img
      src={SRC}
      width={size}
      height={size}
      alt={alt}
      decoding="async"
      draggable={false}
      className={`brand-logo ${className}`}
      style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
      {...rest}
    />
  );
}
