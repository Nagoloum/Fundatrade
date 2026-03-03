"use client";

import type { Prediction, Timeframe } from "@/types";
import SignalBadge from "../strategy/SignalBadge";

interface PredictionCardProps {
  prediction: Prediction;
  currentPrice: number;
}

function ScoreBar({ label, score, tooltip }: { label: string; score: number; tooltip: string }) {
  const color =
    score >= 60 ? "var(--bull)" :
    score <= 40 ? "var(--bear)" :
    "var(--neutral)";

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span
          style={{ fontSize: "0.62rem", color: "var(--text-secondary)" }}
          title={tooltip}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.65rem",
            fontWeight: 700,
            color,
          }}
        >
          {score}/100
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${score >= 60 ? "#00cc6a, #00ff88" : score <= 40 ? "#cc2244, #ff4466" : "#cc7700, #ffa520"})`,
          }}
        />
      </div>
    </div>
  );
}

const TF_LABEL: Record<Timeframe, string> = {
  "4H": "Court terme (4H)",
  "1J": "Moyen terme (1 Jour)",
  "1W": "Long terme (1 Semaine)",
};

export default function PredictionCard({ prediction, currentPrice }: PredictionCardProps) {
  const priceDiffPct = ((prediction.targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
  const stopDiffPct  = ((prediction.stopLoss - currentPrice) / currentPrice * 100).toFixed(2);
  const isPositive   = parseFloat(priceDiffPct) >= 0;

  const formatPrice = (p: number) =>
    p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="card"
      style={{
        borderColor: prediction.direction === "BULLISH"
          ? "rgba(0,255,136,0.25)"
          : prediction.direction === "BEARISH"
          ? "rgba(255,68,102,0.25)"
          : "rgba(255,165,32,0.25)",
      }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div className="section-label">Prédiction IA</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {TF_LABEL[prediction.timeframe]}
          </div>
        </div>
        <SignalBadge direction={prediction.direction} size="lg" animated />
      </div>

      {/* Prix cible + Stop Loss */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {/* Prix cible */}
        <div
          style={{
            padding: "0.75rem",
            background: "var(--bull-bg)",
            border: "1px solid rgba(0,255,136,0.15)",
            borderRadius: "10px",
          }}
        >
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Objectif
          </div>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.95rem", fontWeight: 700, color: "var(--bull)" }}>
            ${formatPrice(prediction.targetPrice)}
          </div>
          <div style={{ fontSize: "0.62rem", color: isPositive ? "var(--bull)" : "var(--bear)", marginTop: "2px" }}>
            {isPositive ? "+" : ""}{priceDiffPct}%
          </div>
        </div>

        {/* Stop Loss */}
        <div
          style={{
            padding: "0.75rem",
            background: "var(--bear-bg)",
            border: "1px solid rgba(255,68,102,0.15)",
            borderRadius: "10px",
          }}
        >
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Stop Loss
          </div>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.95rem", fontWeight: 700, color: "var(--bear)" }}>
            ${formatPrice(prediction.stopLoss)}
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--bear)", marginTop: "2px" }}>
            {stopDiffPct}%
          </div>
        </div>
      </div>

      {/* Risk/Reward */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 0.75rem",
          background: "var(--bg-surface)",
          borderRadius: "8px",
          border: "1px solid var(--border-subtle)",
          marginBottom: "1rem",
        }}
      >
        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
          Ratio Risque/Récompense
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: prediction.riskRewardRatio >= 2 ? "var(--bull)" : prediction.riskRewardRatio >= 1 ? "var(--neutral)" : "var(--bear)",
          }}
        >
          1 : {prediction.riskRewardRatio.toFixed(2)}
        </span>
      </div>

      {/* Scores */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Scores d`&apos`analyse
        </div>
        <ScoreBar
          label="Score fondamental"
          score={prediction.fundamentalScore}
          tooltip="Basé sur les données macro (Fed, inflation, DXY) et les fondamentaux de l'actif"
        />
        <ScoreBar
          label="Score technique"
          score={prediction.technicalScore}
          tooltip="Basé sur RSI, MACD, Price Action et SMC"
        />
        <ScoreBar
          label="Score global (combiné)"
          score={prediction.globalScore}
          tooltip="Combinaison pondérée des scores fondamental (40%) et technique (60%)"
        />
      </div>

      {/* Confiance */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)" }}>Niveau de confiance</span>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: prediction.confidence >= 70 ? "var(--bull)" : prediction.confidence >= 50 ? "var(--neutral)" : "var(--bear)",
            }}
          >
            {prediction.confidence}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${prediction.confidence}%`,
              background: prediction.confidence >= 70
                ? "linear-gradient(90deg, #00cc6a, #00ff88)"
                : prediction.confidence >= 50
                ? "linear-gradient(90deg, #cc7700, #ffa520)"
                : "linear-gradient(90deg, #cc2244, #ff4466)",
            }}
          />
        </div>
      </div>

      {/* Raisonnement */}
      {prediction.reasoning.length > 0 && (
        <div>
          <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Facteurs déterminants
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            {prediction.reasoning.map((reason, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.4rem",
                  alignItems: "flex-start",
                  fontSize: "0.65rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "var(--text-accent)", marginTop: "1px", flexShrink: 0 }}>›</span>
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
