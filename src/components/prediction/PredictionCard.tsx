"use client";

import type { Prediction, Timeframe } from "@/types";
import SignalBadge from "../strategy/SignalBadge";

interface PredictionCardProps {
  prediction: Prediction;
  currentPrice: number;
}

const TF_LABEL: Record<Timeframe, string> = {
  "4H": "Court terme (4H)", "1J": "Moyen terme (1J)", "1W": "Long terme (1W)",
};

export default function PredictionCard({ prediction, currentPrice }: PredictionCardProps) {
  const priceDiffPct = ((prediction.targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
  const stopDiffPct  = ((prediction.stopLoss - currentPrice) / currentPrice * 100).toFixed(2);
  const isPositive   = parseFloat(priceDiffPct) >= 0;
  const fmt = (p: number) => p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sc  = (s: number) => s >= 60 ? "var(--bull)" : s <= 40 ? "var(--bear)" : "var(--neutral)";
  const gr  = (s: number) => s >= 60 ? "#00cc6a, #00ff88" : s <= 40 ? "#cc2244, #ff4466" : "#cc7700, #ffa520";

  const borderColor =
    prediction.direction === "BULLISH" ? "rgba(0,255,136,0.25)" :
    prediction.direction === "BEARISH" ? "rgba(255,68,102,0.25)" :
    "rgba(255,165,32,0.25)";

  const scores = [
    { label: "Fondamental", val: prediction.fundamentalScore },
    { label: "Technique",   val: prediction.technicalScore   },
    { label: "Global",      val: prediction.globalScore       },
    { label: "Confiance",   val: prediction.confidence, pct: true },
  ];

  return (
    <div className="card" style={{ borderColor, padding: "1.1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.9rem", gap: "0.5rem", flexWrap: "wrap" }}>
        <div>
          <div className="section-label">Prediction IA</div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>{TF_LABEL[prediction.timeframe]}</div>
        </div>
        <SignalBadge direction={prediction.direction} size="lg" animated />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", background: "var(--bull-bg)", border: "1px solid rgba(0,255,136,0.15)" }}>
          <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Objectif</div>
          <div style={{ fontFamily: "var(--font-mono),monospace", fontSize: "clamp(0.72rem,2.5vw,0.9rem)", fontWeight: 700, color: "var(--bull)" }}>${fmt(prediction.targetPrice)}</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, marginTop: "2px", color: isPositive ? "var(--bull)" : "var(--bear)" }}>{isPositive ? "+" : ""}{priceDiffPct}%</div>
        </div>
        <div style={{ padding: "0.65rem 0.75rem", borderRadius: "10px", background: "var(--bear-bg)", border: "1px solid rgba(255,68,102,0.15)" }}>
          <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>Stop Loss</div>
          <div style={{ fontFamily: "var(--font-mono),monospace", fontSize: "clamp(0.72rem,2.5vw,0.9rem)", fontWeight: 700, color: "var(--bear)" }}>${fmt(prediction.stopLoss)}</div>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, marginTop: "2px", color: "var(--bear)" }}>{stopDiffPct}%</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0.65rem", marginBottom: "0.9rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "8px" }}>
        <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Ratio Risque / Recompense</span>
        <span style={{ fontFamily: "var(--font-mono),monospace", fontSize: "0.82rem", fontWeight: 700, color: prediction.riskRewardRatio >= 2 ? "var(--bull)" : prediction.riskRewardRatio >= 1 ? "var(--neutral)" : "var(--bear)" }}>
          1 : {prediction.riskRewardRatio.toFixed(2)}
        </span>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Scores</div>
        {scores.map(({ label, val, pct }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", minWidth: "68px" }}>{label}</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${val}%`, background: `linear-gradient(90deg, ${gr(val)})` }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono),monospace", fontSize: "0.62rem", fontWeight: 700, minWidth: "32px", textAlign: "right", color: sc(val) }}>
              {val}{pct ? "%" : ""}
            </span>
          </div>
        ))}
      </div>

      {prediction.reasoning.length > 0 && (
        <div>
          <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Facteurs</div>
          {prediction.reasoning.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "0.35rem", fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.2rem" }}>
              <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
