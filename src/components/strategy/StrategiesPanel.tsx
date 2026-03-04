"use client";

import type { Prediction } from "@/types";
import SignalBadge from "./SignalBadge";

interface StrategiesPanelProps {
  strategies: Prediction["strategies"];
}

const STRATEGY_META: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  priceAction: { icon: "PA", label: "Price Action", desc: "Structures & niveaux",    color: "#6688ff" },
  smc:         { icon: "SC", label: "SMC",          desc: "Order blocks & liquidity", color: "#aa66ff" },
  rsi:         { icon: "RS", label: "RSI",          desc: "Momentum oscillateur",    color: "#00ff88" },
  macd:        { icon: "MC", label: "MACD",         desc: "Tendance & croisements",  color: "#00ccff" },
  ichimoku:    { icon: "IC", label: "Ichimoku",     desc: "Nuage & confluence",       color: "#ffaa00" },
  adx:         { icon: "DX", label: "ADX",          desc: "Force & régime",          color: "#ff6688" },
};

function MiniStratCard({ stratKey, strategy }: { stratKey: string; strategy: any }) {
  const meta = STRATEGY_META[stratKey] ?? { icon: "??", label: stratKey, desc: "", color: "var(--text-muted)" };
  const confColor =
    strategy.confidence >= 65 ? "var(--bull)" :
    strategy.confidence <= 40 ? "var(--bear)" : "var(--neutral)";
  const grad =
    strategy.confidence >= 65 ? "#00cc6a,#00ff88" :
    strategy.confidence <= 40 ? "#cc2244,#ff4466" : "#cc7700,#ffa520";

  return (
    <div className="ft-sc-card">
      <div className="ft-sc-top">
        <div className="ft-sc-id">
          <div className="ft-sc-icon" style={{ background: meta.color + "18", border: `1px solid ${meta.color}44`, color: meta.color }}>{meta.icon}</div>
          <div>
            <div className="ft-sc-name">{meta.label}</div>
            <div className="ft-sc-desc">{meta.desc}</div>
          </div>
        </div>
        <SignalBadge direction={strategy.direction} size="sm" />
      </div>

      <div className="ft-sc-signal">{strategy.signal}</div>

      <div className="ft-sc-conf">
        <span className="ft-sc-conf-label">Confiance</span>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${strategy.confidence}%`, background: `linear-gradient(90deg,${grad})` }} />
        </div>
        <span className="ft-sc-conf-val" style={{ color: confColor }}>{strategy.confidence}%</span>
      </div>

      {strategy.details?.slice(0, 2).map((d: string, i: number) => (
        <div key={i} className="ft-sc-detail"><span className="ft-sc-dot">›</span>{d}</div>
      ))}
    </div>
  );
}

export default function StrategiesPanel({ strategies }: StrategiesPanelProps) {
  const entries  = Object.entries(strategies);
  const dirs     = entries.map(([, s]: [string, any]) => s.direction);
  const bulls    = dirs.filter(d => d === "BULLISH").length;
  const bears    = dirs.filter(d => d === "BEARISH").length;
  const neutrals = dirs.filter(d => d === "NEUTRAL").length;
  const total    = entries.length;

  const consensus =
    bulls >= Math.ceil(total * 0.75) ? "HAUSSIER FORT" :
    bears >= Math.ceil(total * 0.75) ? "BAISSIER FORT" :
    bulls > bears + 1 ? "HAUSSIER MODÉRÉ" :
    bears > bulls + 1 ? "BAISSIER MODÉRÉ" :
    "DIVERGENCE";

  const consColor =
    consensus.includes("HAUSSIER") ? "var(--bull)" :
    consensus.includes("BAISSIER") ? "var(--bear)" : "var(--neutral)";

  // Score de consensus pondéré (moyenne des confidences directionnelles)
  const avgConf = Math.round(entries.reduce((s, [, v]: [string, any]) => s + v.confidence, 0) / total);

  return (
    <>
      <div className="card">
        {/* Header */}
        <div className="ft-sp2-header">
          <div>
            <div className="section-label">Analyses stratégiques</div>
            <div className="ft-sp2-title">{total} stratégies · {total * 2} indicateurs combinés</div>
          </div>
          <div className="ft-sp2-consensus">
            <div className="ft-sp2-cons-label">Consensus</div>
            <div className="ft-sp2-cons-val" style={{ color: consColor }}>{consensus}</div>
            <div className="ft-sp2-cons-conf" style={{ color: consColor }}>{avgConf}% confiance moy.</div>
          </div>
        </div>

        {/* Barre de votes */}
        <div className="ft-sp2-votes">
          <div className="ft-sp2-vbar" style={{ flex: Math.max(bulls, 0.1), background: "var(--bull)", opacity: bulls > 0 ? 1 : 0.15 }} />
          <div className="ft-sp2-vbar" style={{ flex: Math.max(neutrals, 0.1), background: "var(--neutral)", opacity: neutrals > 0 ? 1 : 0.15 }} />
          <div className="ft-sp2-vbar" style={{ flex: Math.max(bears, 0.1), background: "var(--bear)", opacity: bears > 0 ? 1 : 0.15 }} />
          <span className="ft-sp2-vote-count">
            <span style={{ color: "var(--bull)" }}>▲{bulls}</span>
            {" "}<span style={{ color: "var(--neutral)" }}>◆{neutrals}</span>
            {" "}<span style={{ color: "var(--bear)" }}>▼{bears}</span>
          </span>
        </div>

        {/* Grille 2×3 (6 stratégies) */}
        <div className="ft-sp2-grid">
          {entries.map(([key, strategy]) => (
            <MiniStratCard key={key} stratKey={key} strategy={strategy} />
          ))}
        </div>

        <div className="ft-sp2-note">
          Analyses calculées sur la timeframe sélectionnée. Ne constitue pas un conseil financier.
        </div>
      </div>

      <style>{`
        .ft-sp2-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 0.5rem; }
        .ft-sp2-title { font-size: 0.72rem; font-weight: 700; color: var(--text-primary); }
        .ft-sp2-consensus { text-align: right; }
        .ft-sp2-cons-label { font-size: 0.52rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .ft-sp2-cons-val { font-family: var(--font-mono),monospace; font-size: 0.68rem; font-weight: 700; }
        .ft-sp2-cons-conf { font-size: 0.55rem; color: var(--text-muted); margin-top: 1px; }
        .ft-sp2-votes { display: flex; gap: 3px; margin-bottom: 0.8rem; align-items: center; }
        .ft-sp2-vbar { height: 4px; border-radius: 2px; min-width: 3px; transition: flex 0.6s ease; }
        .ft-sp2-vote-count { font-size: 0.58rem; margin-left: 0.45rem; white-space: nowrap; flex-shrink: 0; font-family: var(--font-mono),monospace; }
        .ft-sp2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; margin-bottom: 0.7rem; }
        /* Carte stratégie */
        .ft-sc-card { padding: 0.7rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 10px; transition: border-color 0.2s; }
        .ft-sc-card:hover { border-color: var(--border); }
        .ft-sc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; gap: 0.3rem; }
        .ft-sc-id { display: flex; align-items: center; gap: 0.35rem; min-width: 0; }
        .ft-sc-icon { width: 26px; height: 26px; min-width: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 800; font-family: var(--font-mono),monospace; }
        .ft-sc-name { font-size: 0.67rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .ft-sc-desc { font-size: 0.52rem; color: var(--text-muted); margin-top: 1px; }
        .ft-sc-signal { font-size: 0.6rem; color: var(--text-secondary); padding: 0.28rem 0.4rem; background: var(--bg-card); border-radius: 5px; border: 1px solid var(--border-subtle); margin-bottom: 0.38rem; line-height: 1.35; }
        .ft-sc-conf { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.32rem; }
        .ft-sc-conf-label { font-size: 0.53rem; color: var(--text-muted); white-space: nowrap; }
        .ft-sc-conf-val { font-size: 0.58rem; font-weight: 700; min-width: 26px; text-align: right; font-family: var(--font-mono),monospace; }
        .ft-sc-detail { display: flex; gap: 0.28rem; font-size: 0.55rem; color: var(--text-muted); line-height: 1.35; margin-top: 0.12rem; }
        .ft-sc-dot { color: var(--text-accent); flex-shrink: 0; }
        .ft-sp2-note { padding: 0.4rem 0.6rem; background: var(--accent-subtle); border: 1px solid var(--border); border-radius: 7px; font-size: 0.56rem; color: var(--text-muted); line-height: 1.45; }
        @media (max-width: 480px) {
          .ft-sp2-grid { grid-template-columns: 1fr; }
          .ft-sc-desc { display: none; }
        }
      `}</style>
    </>
  );
}
