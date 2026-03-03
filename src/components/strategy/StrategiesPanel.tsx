"use client";

import type { Prediction } from "@/types";
import StrategyCard from "./StrategyCard";

interface StrategiesPanelProps {
  strategies: Prediction["strategies"];
}

const STRATEGY_META = {
  priceAction: {
    icon: "📊",
    description: "Structures de prix & niveaux clés",
  },
  smc: {
    icon: "🏦",
    description: "Smart Money Concepts — liquidité & order blocks",
  },
  rsi: {
    icon: "📈",
    description: "Relative Strength Index — momentum",
  },
  macd: {
    icon: "⚡",
    description: "MACD — tendance & divergences",
  },
};

export default function StrategiesPanel({ strategies }: StrategiesPanelProps) {
  // Consensus des 4 stratégies
  const directions = Object.values(strategies).map((s) => s.direction);
  const bullCount = directions.filter((d) => d === "BULLISH").length;
  const bearCount = directions.filter((d) => d === "BEARISH").length;
  const neutralCount = directions.filter((d) => d === "NEUTRAL").length;

  const consensus =
    bullCount >= 3 ? "BULLISH" :
    bearCount >= 3 ? "BEARISH" :
    bullCount > bearCount ? "BULLISH MODÉRÉ" :
    bearCount > bullCount ? "BEARISH MODÉRÉ" :
    "DIVERGENCE";

  const consensusColor =
    consensus.includes("BULL") ? "var(--bull)" :
    consensus.includes("BEAR") ? "var(--bear)" :
    "var(--neutral)";

  return (
    <div className="card">
      {/* En-tête */}
      <div style={{ marginBottom: "1rem" }}>
        <div className="section-label">Analyses stratégiques</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Price Action · SMC · RSI · MACD
          </div>

          {/* Consensus global */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>
              Consensus
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: consensusColor,
              }}
            >
              {consensus}
            </div>
          </div>
        </div>

        {/* Barre de votes */}
        <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.6rem", alignItems: "center" }}>
          <div
            style={{
              height: "4px",
              background: "var(--bull)",
              borderRadius: "2px",
              flex: bullCount,
              opacity: bullCount > 0 ? 1 : 0.15,
              transition: "flex 0.5s ease",
            }}
          />
          <div
            style={{
              height: "4px",
              background: "var(--neutral)",
              borderRadius: "2px",
              flex: neutralCount,
              opacity: neutralCount > 0 ? 1 : 0.15,
              transition: "flex 0.5s ease",
            }}
          />
          <div
            style={{
              height: "4px",
              background: "var(--bear)",
              borderRadius: "2px",
              flex: bearCount,
              opacity: bearCount > 0 ? 1 : 0.15,
              transition: "flex 0.5s ease",
            }}
          />
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginLeft: "0.25rem", whiteSpace: "nowrap" }}>
            {bullCount}▲ {neutralCount}◆ {bearCount}▼
          </span>
        </div>
      </div>

      {/* Grille des stratégies */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
        }}
      >
        {(Object.keys(strategies) as Array<keyof Prediction["strategies"]>).map((key) => (
          <StrategyCard
            key={key}
            strategy={strategies[key]}
            icon={STRATEGY_META[key].icon}
            description={STRATEGY_META[key].description}
          />
        ))}
      </div>

      {/* Note explicative */}
      <div
        style={{
          marginTop: "0.75rem",
          padding: "0.5rem 0.75rem",
          background: "var(--accent-subtle)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "0.6rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        ⚠️ Ces analyses sont calculées sur la timeframe sélectionnée et ne constituent pas un conseil financier. Chaque indicateur est indépendant et doit être interprété dans son contexte.
      </div>
    </div>
  );
}
