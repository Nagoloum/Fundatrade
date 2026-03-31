"use client";
import type { Prediction, Timeframe } from "@/types";

const TF_LABEL: Record<Timeframe, string> = { "4H": "Court terme (4H)", "1J": "Moyen terme (1J)", "1W": "Long terme (1W)" };
const REGIME_CFG: Record<string, { label: string; icon: string; color: string }> = {
  trending_bull: { label: "Tendance haussière",  icon: "↗", color: "var(--bull)"     },
  trending_bear: { label: "Tendance baissière",  icon: "↘", color: "var(--bear)"     },
  ranging:       { label: "Marché en range",     icon: "↔", color: "var(--neutral)"  },
  volatile:      { label: "Marché volatil",      icon: "⚡", color: "#ff8844"        },
  unknown:       { label: "Régime indéterminé",  icon: "?", color: "var(--text-muted)" },
};

export default function PredictionCard({ prediction, currentPrice }: { prediction: Prediction; currentPrice: number }) {
  const dir = prediction.direction;
  const regime = REGIME_CFG[prediction.regime ?? "unknown"] ?? REGIME_CFG.unknown;
  const pctDiff = ((prediction.targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
  const stopPct = ((prediction.stopLoss    - currentPrice) / currentPrice * 100).toFixed(2);
  const isPos   = parseFloat(pctDiff) >= 0;
  const fmt = (p: number) => p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sc  = (v: number) => v >= 60 ? "var(--bull)" : v <= 40 ? "var(--bear)" : "var(--neutral)";
  const gr  = (v: number) => v >= 60 ? "#00c880,#00f0a0" : v <= 40 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";

  const dirConfig = {
    BULLISH: { color: "var(--bull)",    bg: "var(--bull-bg)",    border: "var(--bull-border)",    icon: "▲", label: "HAUSSIER" },
    BEARISH: { color: "var(--bear)",    bg: "var(--bear-bg)",    border: "var(--bear-border)",    icon: "▼", label: "BAISSIER" },
    NEUTRAL: { color: "var(--neutral)", bg: "var(--neutral-bg)", border: "var(--neutral-border)", icon: "◆", label: "NEUTRE"   },
  }[dir];

  const mtf = prediction.multiTF;

  return (
    <>
      <div className="card ft-pred-card" style={{ borderColor: dirConfig.border }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.7rem" }}>
          <div>
            <div className="section-label">Prédiction IA temps réel</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{TF_LABEL[prediction.timeframe]}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.38rem", padding: "0.38rem 0.9rem", borderRadius: 6, border: `1px solid ${dirConfig.border}`, background: dirConfig.bg, color: dirConfig.color, fontFamily: "'Orbitron', monospace", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", animation: "pulse-glow 2s ease infinite" }}>
              <span style={{ fontSize: "0.85rem" }}>{dirConfig.icon}</span>
              {dirConfig.label}
            </span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", fontWeight: 700, color: regime.color }}>{regime.icon} {regime.label}</span>
          </div>
        </div>

        {/* Target + Stop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem", marginBottom: "0.55rem" }}>
          <div style={{ padding: "0.6rem 0.7rem", borderRadius: 9, background: "var(--bull-bg)", border: "1px solid var(--bull-border)" }}>
            <div className="section-label" style={{ marginBottom: 3 }}>Objectif</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--bull)" }}>${fmt(prediction.targetPrice)}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: isPos ? "var(--bull)" : "var(--bear)", marginTop: 2 }}>{isPos ? "+" : ""}{pctDiff}%</div>
          </div>
          <div style={{ padding: "0.6rem 0.7rem", borderRadius: 9, background: "var(--bear-bg)", border: "1px solid var(--bear-border)" }}>
            <div className="section-label" style={{ marginBottom: 3 }}>Stop Loss</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--bear)" }}>${fmt(prediction.stopLoss)}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "var(--bear)", marginTop: 2 }}>{stopPct}%</div>
          </div>
        </div>

        {/* R/R */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.38rem 0.6rem", marginBottom: "0.6rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 7 }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>Ratio Risque / Récompense</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: prediction.riskRewardRatio >= 2 ? "var(--bull)" : prediction.riskRewardRatio >= 1 ? "var(--neutral)" : "var(--bear)" }}>
            1 : {prediction.riskRewardRatio.toFixed(2)}
          </span>
        </div>

        {/* Multi-TF alignment */}
        {mtf && (
          <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            {(["4H","1J","1W"] as Timeframe[]).map(tf => {
              const d = mtf[tf];
              const c = d === "BULLISH" ? "var(--bull)" : d === "BEARISH" ? "var(--bear)" : "var(--neutral)";
              return (
                <div key={tf} style={{ display: "flex", alignItems: "center", gap: 3, padding: "0.18rem 0.42rem", borderRadius: 5, border: `1px solid ${c}44`, background: `${c}08` }}>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 700 }}>{tf}</span>
                  <span style={{ color: c, fontSize: "0.65rem", fontWeight: 700 }}>{d === "BULLISH" ? "▲" : d === "BEARISH" ? "▼" : "◆"}</span>
                </div>
              );
            })}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: mtf.alignment.includes("bull") ? "var(--bull)" : mtf.alignment.includes("bear") ? "var(--bear)" : "var(--neutral)", marginLeft: "auto" }}>
              {mtf.alignmentScore}% alignement
            </span>
          </div>
        )}

        {/* Scores */}
        <div style={{ marginBottom: "0.6rem" }}>
          <div className="section-label" style={{ marginBottom: "0.32rem" }}>Scores</div>
          {[
            { label: "Fondamental", val: prediction.fundamentalScore },
            { label: "Technique",   val: prediction.technicalScore   },
            { label: "Sentiment",   val: prediction.sentimentScore ?? 50 },
            { label: "Global",      val: prediction.globalScore      },
            { label: "Confiance",   val: Math.round(prediction.confidence), pct: true },
          ].map(({ label, val, pct }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.42rem", marginBottom: "0.27rem" }}>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.62rem", color: "var(--text-secondary)", minWidth: 64, fontWeight: 600 }}>{label}</span>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${val}%`, background: `linear-gradient(90deg,${gr(val)})` }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 700, minWidth: 28, textAlign: "right", color: sc(val) }}>{val}{pct ? "%" : ""}</span>
            </div>
          ))}
        </div>

        {/* Reasoning */}
        {prediction.reasoning.length > 0 && (
          <div>
            <div className="section-label" style={{ marginBottom: "0.32rem" }}>Facteurs</div>
            {prediction.reasoning.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: "0.3rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.16rem", fontWeight: 500 }}>
                <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{r}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`.ft-pred-card { border-width: 1px; }`}</style>
    </>
  );
}
