"use client";

import type { Asset, Timeframe } from "@/types";

const ASSETS: { id: Asset; label: string; icon: string }[] = [
  { id: "BTC",    label: "Bitcoin",  icon: "₿" },
  { id: "ETH",    label: "Ethereum", icon: "Ξ" },
  { id: "SOL",    label: "Solana",   icon: "◎" },
  { id: "XAUUSD", label: "Or",       icon: "Au" },
];

const TIMEFRAMES: { id: Timeframe; label: string; description: string }[] = [
  { id: "4H", label: "4H",     description: "Court terme — 4 heures" },
  { id: "1J", label: "1 Jour", description: "Moyen terme — Journalier" },
  { id: "1W", label: "1 Sem.", description: "Long terme — Hebdomadaire" },
];

interface AssetSelectorProps {
  selectedAsset: Asset;
  selectedTimeframe: Timeframe;
  onSelectAsset: (asset: Asset) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export default function AssetSelector({
  selectedAsset,
  selectedTimeframe,
  onSelectAsset,
  onSelectTimeframe,
}: AssetSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      {/* Sélecteur d'actif */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginRight: "0.25rem",
            whiteSpace: "nowrap",
          }}
        >
          Actif
        </span>

        {ASSETS.map((asset) => {
          const isActive = selectedAsset === asset.id;
          return (
            <button
              key={asset.id}
              onClick={() => onSelectAsset(asset.id)}
              title={asset.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                border: `1px solid ${isActive ? "var(--border-strong)" : "var(--border)"}`,
                background: isActive ? "var(--accent-subtle)" : "var(--bg-card)",
                color: isActive ? "var(--text-accent)" : "var(--text-secondary)",
                fontFamily: "var(--font-syne), sans-serif",
                fontSize: "0.78rem",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 0 0 1px var(--border-strong), 0 2px 8px var(--accent-glow)" : "none",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-strong)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: "0.7rem",
                  opacity: 0.7,
                }}
              >
                {asset.icon}
              </span>
              {asset.id}
            </button>
          );
        })}
      </div>

      {/* Sélecteur de timeframe */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginRight: "0.25rem",
            whiteSpace: "nowrap",
          }}
        >
          Période
        </span>

        {/* Conteneur avec fond unifié */}
        <div
          style={{
            display: "flex",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {TIMEFRAMES.map((tf) => {
            const isActive = selectedTimeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => onSelectTimeframe(tf.id)}
                title={tf.description}
                style={{
                  padding: "0.3rem 0.9rem",
                  borderRadius: "5px",
                  border: "none",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#050a0e" : "var(--text-muted)",
                  fontFamily: "var(--font-syne), sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-subtle)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }
                }}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Description de la timeframe active */}
        <span
          style={{
            fontSize: "0.62rem",
            color: "var(--text-muted)",
            marginLeft: "0.25rem",
          }}
        >
          {TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.description}
        </span>
      </div>
    </div>
  );
}
