"use client";

import type { StrategyAnalysis, Direction } from "@/types";
import SignalBadge from "./SignalBadge";

interface StrategyCardProps {
  strategy: StrategyAnalysis;
  icon: string;
  description: string;
}

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 65 ? "var(--bull)" :
    value <= 40 ? "var(--bear)" :
    "var(--neutral)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div
        style={{
          flex: 1,
          height: "3px",
          background: "var(--border-subtle)",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${value}%`,
            background: color,
            borderRadius: "99px",
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.62rem",
          fontWeight: 700,
          color,
          minWidth: "32px",
          textAlign: "right",
        }}
      >
        {value}%
      </span>
    </div>
  );
}

export default function StrategyCard({ strategy, icon, description }: StrategyCardProps) {
  return (
    <div
      style={{
        padding: "0.9rem",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--bg-card)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.background = "var(--bg-surface)";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1rem" }}>{icon}</span>
          <div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {strategy.name}
            </div>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
              {description}
            </div>
          </div>
        </div>
        <SignalBadge direction={strategy.direction} size="sm" />
      </div>

      {/* Signal principal */}
      <div
        style={{
          fontSize: "0.7rem",
          color: "var(--text-secondary)",
          marginBottom: "0.5rem",
          padding: "0.35rem 0.5rem",
          background: "var(--bg-card)",
          borderRadius: "6px",
          border: "1px solid var(--border-subtle)",
          lineHeight: 1.4,
        }}
      >
        {strategy.signal}
      </div>

      {/* Confiance */}
      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "4px" }}>
          Confiance
        </div>
        <ConfidenceBar value={strategy.confidence} />
      </div>

      {/* Détails */}
      {strategy.details.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {strategy.details.map((detail, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.3rem",
                fontSize: "0.6rem",
                color: "var(--text-muted)",
                lineHeight: 1.35,
              }}
            >
              <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>·</span>
              {detail}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
