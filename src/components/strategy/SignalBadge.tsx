"use client";

import type { Direction } from "@/types";

interface SignalBadgeProps {
  direction: Direction;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  animated?: boolean;
}

const CONFIG = {
  BULLISH: {
    label: "HAUSSIER",
    icon: "▲",
    color: "var(--bull)",
    bg: "var(--bull-bg)",
    border: "rgba(0, 255, 136, 0.25)",
    glow: "0 0 12px rgba(0, 255, 136, 0.25)",
  },
  BEARISH: {
    label: "BAISSIER",
    icon: "▼",
    color: "var(--bear)",
    bg: "var(--bear-bg)",
    border: "rgba(255, 68, 102, 0.25)",
    glow: "0 0 12px rgba(255, 68, 102, 0.2)",
  },
  NEUTRAL: {
    label: "NEUTRE",
    icon: "◆",
    color: "var(--neutral)",
    bg: "var(--neutral-bg)",
    border: "rgba(255, 165, 32, 0.25)",
    glow: "0 0 12px rgba(255, 165, 32, 0.18)",
  },
};

const SIZE_MAP = {
  sm: { fontSize: "0.6rem",  padding: "0.18rem 0.5rem",  gap: "0.25rem", iconSize: "0.55rem" },
  md: { fontSize: "0.68rem", padding: "0.28rem 0.75rem", gap: "0.3rem",  iconSize: "0.62rem" },
  lg: { fontSize: "0.8rem",  padding: "0.4rem 1rem",     gap: "0.4rem",  iconSize: "0.75rem" },
};

export default function SignalBadge({
  direction,
  size = "md",
  showIcon = true,
  animated = false,
}: SignalBadgeProps) {
  const cfg = CONFIG[direction];
  const sz  = SIZE_MAP[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: sz.gap,
        padding: sz.padding,
        borderRadius: "99px",
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        color: cfg.color,
        fontSize: sz.fontSize,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "var(--font-syne), sans-serif",
        boxShadow: animated ? cfg.glow : "none",
        animation: animated ? "pulse-glow 2s ease infinite" : "none",
        transition: "all 0.3s ease",
        whiteSpace: "nowrap",
      }}
    >
      {showIcon && (
        <span style={{ fontSize: sz.iconSize, lineHeight: 1 }}>{cfg.icon}</span>
      )}
      {cfg.label}
    </span>
  );
}
