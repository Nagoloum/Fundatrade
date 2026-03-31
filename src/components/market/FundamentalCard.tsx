"use client";

import type { MarketData } from "@/types";

interface FundamentalCardProps {
  data: MarketData;
}

function formatBig(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString("fr-FR")}`;
}

function formatSupply(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString("fr-FR");
}

interface MetricRowProps {
  label: string;
  value: string;
  tooltip: string;
  signal?: "positive" | "negative" | "neutral";
  signalLabel?: string;
}

function MetricRow({ label, value, tooltip, signal, signalLabel }: MetricRowProps) {
  const signalColor =
    signal === "positive" ? "var(--bull)" :
    signal === "negative" ? "var(--bear)" :
    "var(--neutral)";

  const signalBg =
    signal === "positive" ? "var(--bull-bg)" :
    signal === "negative" ? "var(--bear-bg)" :
    "var(--neutral-bg)";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "0.6rem 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--text-secondary)",
            fontWeight: 500,
            marginBottom: "2px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "0.58rem",
            color: "var(--text-muted)",
            maxWidth: "180px",
            lineHeight: 1.4,
          }}
        >
          {tooltip}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "0.75rem" }}>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {value}
        </div>
        {signal && signalLabel && (
          <div
            style={{
              marginTop: "3px",
              display: "inline-block",
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: signalColor,
              background: signalBg,
              padding: "0.1rem 0.35rem",
              borderRadius: "4px",
            }}
          >
            {signalLabel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FundamentalCard({ data }: FundamentalCardProps) {
  if (data.marketCap == null || data.volume24h == null) return null;

  // Ratio Volume / Market Cap — indique la liquidité et l'activité
  const volumeRatio = data.volume24h / data.marketCap;
  const volumeRatioSignal =
    volumeRatio > 0.15 ? "positive" :
    volumeRatio < 0.03 ? "negative" :
    "neutral";
  const volumeRatioLabel =
    volumeRatio > 0.15 ? "Très liquide" :
    volumeRatio < 0.03 ? "Faible activité" :
    "Activité normale";

  // Ratio FDV / MCap — mesure la dilution potentielle future
  const fdvRatio = data.fullyDilutedValuation && data.marketCap
    ? data.fullyDilutedValuation / data.marketCap
    : null;
  const fdvSignal: "positive" | "negative" | "neutral" =
    fdvRatio === null ? "neutral" :
    fdvRatio < 1.5 ? "positive" :
    fdvRatio > 3   ? "negative" :
    "neutral";
  const fdvLabel =
    fdvRatio === null ? "—" :
    fdvRatio < 1.5 ? "Dilution faible" :
    fdvRatio > 3   ? "Forte dilution future" :
    "Dilution modérée";

  // Score fondamental global
  let score = 50;
  if (volumeRatioSignal === "positive") score += 15;
  if (volumeRatioSignal === "negative") score -= 15;
  if (fdvSignal === "positive") score += 10;
  if (fdvSignal === "negative") score -= 10;
  score = Math.max(0, Math.min(100, score));

  const scoreColor =
    score >= 65 ? "var(--bull)" :
    score <= 40 ? "var(--bear)" :
    "var(--neutral)";

  const scoreLabel =
    score >= 65 ? "Fondamentaux solides" :
    score <= 40 ? "Fondamentaux fragiles" :
    "Fondamentaux neutres";

  return (
    <div className="card">
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div className="section-label">Analyse fondamentale</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Données on-chain & marché
          </div>
        </div>

        {/* Score global */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Score
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div style={{ fontSize: "0.55rem", color: scoreColor, marginTop: "2px" }}>
            {scoreLabel}
          </div>
        </div>
      </div>

      {/* Barre de score */}
      <div className="progress-bar" style={{ marginBottom: "1.25rem" }}>
        <div
          className="progress-fill"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${score >= 65 ? "#00cc6a, #00ff88" : score <= 40 ? "#cc2244, #ff4466" : "#cc7700, #ffa520"})`,
          }}
        />
      </div>

      {/* Métriques */}
      <div>
        <MetricRow
          label="Capitalisation boursière"
          value={formatBig(data.marketCap)}
          tooltip="Valeur totale de tous les tokens en circulation. Plus c'est élevé, plus l'actif est établi."
          signal="neutral"
        />

        <MetricRow
          label="Volume 24h"
          value={formatBig(data.volume24h)}
          tooltip="Total des échanges sur 24h. Indique l'activité et la liquidité du marché."
          signal={volumeRatioSignal}
          signalLabel={`Ratio ${(volumeRatio * 100).toFixed(1)}% du MCap`}
        />

        <MetricRow
          label="Ratio Volume / MCap"
          value={`${(volumeRatio * 100).toFixed(2)}%`}
          tooltip="Mesure la liquidité relative. >15% = très actif, <3% = faible activité de trading."
          signal={volumeRatioSignal}
          signalLabel={volumeRatioLabel}
        />

        {data.circulatingSupply && typeof data.circulatingSupply === "number" && (
          <MetricRow
            label="Supply en circulation"
            value={formatSupply(data.circulatingSupply as number)}
            tooltip="Nombre de tokens actuellement disponibles sur le marché."
          />
        )}

        {data.fullyDilutedValuation && (
          <MetricRow
            label="Valorisation fully diluted (FDV)"
            value={formatBig(data.fullyDilutedValuation)}
            tooltip="Capitalisation si 100% des tokens étaient en circulation. Un FDV >> MCap signale une forte inflation future de l'offre."
            signal={fdvSignal}
            signalLabel={`Ratio FDV/MCap : ${fdvRatio ? fdvRatio.toFixed(2) + "x" : "—"} — ${fdvLabel}`}
          />
        )}

        {data.dominance && typeof data.dominance === "number" && (
          <MetricRow
            label="Dominance BTC"
            value={`${(data.dominance as number).toFixed(1)}%`}
            tooltip="Part de marché de Bitcoin. Une dominance élevée (>55%) signale un marché risk-off, favorable à BTC."
            signal={data.dominance > 55 ? "positive" : data.dominance < 45 ? "negative" : "neutral"}
            signalLabel={
              data.dominance > 55 ? "Marché BTC-dominé" :
              data.dominance < 45 ? "Alt-saison possible" :
              "Équilibre BTC/Alts"
            }
          />
        )}
      </div>
    </div>
  );
}
