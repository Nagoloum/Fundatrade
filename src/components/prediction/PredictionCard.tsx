"use client";

import type { Prediction, Timeframe } from "@/types";
import SignalBadge from "../strategy/SignalBadge";

const TF_LABEL: Record<Timeframe, string> = {
  "4H": "Court terme (4H)", "1J": "Moyen terme (1J)", "1W": "Long terme (1W)",
};
const REGIME_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  trending_bull: { label: "Tendance haussière",  icon: "\u2197", color: "var(--bull)"       },
  trending_bear: { label: "Tendance baissière",  icon: "\u2198", color: "var(--bear)"       },
  ranging:       { label: "Marché en range",     icon: "\u2194", color: "var(--neutral)"    },
  volatile:      { label: "Marché volatil",      icon: "\u26a1", color: "#ff8844"           },
  unknown:       { label: "Régime indéterminé",  icon: "?",       color: "var(--text-muted)" },
};

export default function PredictionCard({ prediction, currentPrice }: { prediction: Prediction; currentPrice: number }) {
  const pctDiff = ((prediction.targetPrice - currentPrice) / currentPrice * 100).toFixed(2);
  const stopPct = ((prediction.stopLoss    - currentPrice) / currentPrice * 100).toFixed(2);
  const isPos   = parseFloat(pctDiff) >= 0;
  const fmt  = (p: number) => p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sc   = (s: number) => s >= 60 ? "var(--bull)" : s <= 40 ? "var(--bear)" : "var(--neutral)";
  const gr   = (s: number) => s >= 60 ? "#00cc6a,#00ff88" : s <= 40 ? "#cc2244,#ff4466" : "#cc7700,#ffa520";
  const regime = REGIME_LABELS[prediction.regime ?? "unknown"] ?? REGIME_LABELS.unknown;
  const mtf    = prediction.multiTF;
  const borderColor = prediction.direction === "BULLISH" ? "rgba(0,255,136,0.3)" : prediction.direction === "BEARISH" ? "rgba(255,68,102,0.3)" : "rgba(255,165,32,0.3)";
  const scores = [
    { label: "Fondamental", val: prediction.fundamentalScore, pct: false },
    { label: "Technique",   val: prediction.technicalScore,   pct: false },
    { label: "Sentiment",   val: prediction.sentimentScore ?? 50, pct: false },
    { label: "Global",      val: prediction.globalScore,      pct: false },
    { label: "Confiance",   val: Math.round(prediction.confidence), pct: true },
  ];

  return (
    <>
      <div className="card" style={{ borderColor, padding: "1rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem", gap:"0.5rem", flexWrap:"wrap" }}>
          <div>
            <div className="section-label">Prédiction IA</div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginTop:"2px" }}>{TF_LABEL[prediction.timeframe]}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
            <SignalBadge direction={prediction.direction} size="lg" animated />
            <div style={{ fontSize:"0.58rem", fontWeight:700, color:regime.color }}>
              {regime.icon} {regime.label}
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.45rem", marginBottom:"0.6rem" }}>
          <div style={{ padding:"0.6rem 0.7rem", borderRadius:"10px", background:"var(--bull-bg)", border:"1px solid rgba(0,255,136,0.15)" }}>
            <div style={{ fontSize:"0.54rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"3px" }}>Objectif</div>
            <div style={{ fontFamily:"var(--font-mono),monospace", fontSize:"clamp(0.7rem,2.5vw,0.88rem)", fontWeight:700, color:"var(--bull)" }}>${fmt(prediction.targetPrice)}</div>
            <div style={{ fontSize:"0.6rem", fontWeight:700, marginTop:"2px", color:isPos?"var(--bull)":"var(--bear)" }}>{isPos?"+":""}{pctDiff}%</div>
          </div>
          <div style={{ padding:"0.6rem 0.7rem", borderRadius:"10px", background:"var(--bear-bg)", border:"1px solid rgba(255,68,102,0.15)" }}>
            <div style={{ fontSize:"0.54rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"3px" }}>Stop Loss</div>
            <div style={{ fontFamily:"var(--font-mono),monospace", fontSize:"clamp(0.7rem,2.5vw,0.88rem)", fontWeight:700, color:"var(--bear)" }}>${fmt(prediction.stopLoss)}</div>
            <div style={{ fontSize:"0.6rem", fontWeight:700, marginTop:"2px", color:"var(--bear)" }}>{stopPct}%</div>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.42rem 0.6rem", marginBottom:"0.7rem", background:"var(--bg-surface)", border:"1px solid var(--border-subtle)", borderRadius:"8px" }}>
          <span style={{ fontSize:"0.6rem", color:"var(--text-muted)" }}>Ratio Risque / Récompense</span>
          <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:"0.82rem", fontWeight:700, color:prediction.riskRewardRatio>=2?"var(--bull)":prediction.riskRewardRatio>=1?"var(--neutral)":"var(--bear)" }}>
            1 : {prediction.riskRewardRatio.toFixed(2)}
          </span>
        </div>

        {mtf && (
          <div style={{ display:"flex", gap:"0.35rem", alignItems:"center", marginBottom:"0.65rem", flexWrap:"wrap" }}>
            {(["4H","1J","1W"] as Timeframe[]).map(tf => {
              const d = mtf[tf];
              const c = d==="BULLISH"?"var(--bull)":d==="BEARISH"?"var(--bear)":"var(--neutral)";
              return (
                <div key={tf} style={{ display:"flex", alignItems:"center", gap:"3px", padding:"0.2rem 0.45rem", borderRadius:"6px", border:`1px solid ${c}44`, background:`${c}08` }}>
                  <span style={{ fontSize:"0.55rem", color:"var(--text-muted)", fontWeight:700 }}>{tf}</span>
                  <span style={{ color:c, fontSize:"0.65rem", fontWeight:700 }}>{d==="BULLISH"?"▲":d==="BEARISH"?"▼":"◆"}</span>
                </div>
              );
            })}
            <span style={{ fontSize:"0.56rem", color:mtf.alignment.includes("bull")?"var(--bull)":mtf.alignment.includes("bear")?"var(--bear)":"var(--neutral)", fontWeight:700, marginLeft:"auto" }}>
              {mtf.alignmentScore}% alignement
            </span>
          </div>
        )}

        <div style={{ marginBottom:"0.65rem" }}>
          <div style={{ fontSize:"0.56rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.38rem" }}>Scores</div>
          {scores.map(({ label, val, pct }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.45rem", marginBottom:"0.3rem" }}>
              <span style={{ fontSize:"0.58rem", color:"var(--text-secondary)", minWidth:"66px" }}>{label}</span>
              <div className="progress-bar" style={{ flex:1 }}>
                <div className="progress-fill" style={{ width:`${val}%`, background:`linear-gradient(90deg,${gr(val)})` }} />
              </div>
              <span style={{ fontFamily:"var(--font-mono),monospace", fontSize:"0.6rem", fontWeight:700, minWidth:"30px", textAlign:"right", color:sc(val) }}>{val}{pct?"%":""}</span>
            </div>
          ))}
        </div>

        {prediction.reasoning.length > 0 && (
          <div>
            <div style={{ fontSize:"0.56rem", color:"var(--text-muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.35rem" }}>Facteurs</div>
            {prediction.reasoning.map((r, i) => (
              <div key={i} style={{ display:"flex", gap:"0.32rem", fontSize:"0.6rem", color:"var(--text-secondary)", lineHeight:1.4, marginBottom:"0.18rem" }}>
                <span style={{ color:"var(--text-accent)", flexShrink:0 }}>›</span>{r}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
