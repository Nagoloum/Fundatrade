"use client";

import type { Prediction } from "@/types";
import SignalBadge from "./SignalBadge";

interface StrategiesPanelProps {
  strategies: Prediction["strategies"];
}

const STRATEGY_META = {
  priceAction: { icon: "PA", label: "Price Action", desc: "Structures & niveaux clés" },
  smc:         { icon: "SC", label: "SMC",          desc: "Order blocks & liquidite" },
  rsi:         { icon: "RS", label: "RSI",          desc: "Momentum oscillateur" },
  macd:        { icon: "MC", label: "MACD",         desc: "Tendance & croisements" },
};

function MiniStratCard({ strategy, meta }: { strategy: any; meta: any }) {
  const confColor =
    strategy.confidence >= 65 ? "var(--bull)" :
    strategy.confidence <= 40 ? "var(--bear)" : "var(--neutral)";

  return (
    <div className="ft-strat-card">
      <div className="ft-strat-top">
        <div className="ft-strat-id">
          <span className="ft-strat-icon">{meta.icon}</span>
          <div>
            <div className="ft-strat-name">{meta.label}</div>
            <div className="ft-strat-desc">{meta.desc}</div>
          </div>
        </div>
        <SignalBadge direction={strategy.direction} size="sm" />
      </div>

      <div className="ft-strat-signal">{strategy.signal}</div>

      <div className="ft-strat-conf-row">
        <span className="ft-strat-conf-label">Confiance</span>
        <div className="ft-strat-bar">
          <div className="ft-strat-bar-fill" style={{ width: `${strategy.confidence}%`, background: confColor }} />
        </div>
        <span className="ft-strat-conf-val" style={{ color: confColor }}>{strategy.confidence}%</span>
      </div>

      {strategy.details?.slice(0, 2).map((d: string, i: number) => (
        <div key={i} className="ft-strat-detail">
          <span className="ft-strat-dot">›</span>{d}
        </div>
      ))}
    </div>
  );
}

export default function StrategiesPanel({ strategies }: StrategiesPanelProps) {
  const dirs    = Object.values(strategies).map((s: any) => s.direction);
  const bulls   = dirs.filter(d => d === "BULLISH").length;
  const bears   = dirs.filter(d => d === "BEARISH").length;
  const neutrals = dirs.filter(d => d === "NEUTRAL").length;

  const consensus =
    bulls >= 3 ? "BULLISH" : bears >= 3 ? "BEARISH" :
    bulls > bears ? "BULLISH MODERE" : bears > bulls ? "BEARISH MODERE" : "DIVERGENCE";

  const consColor =
    consensus.includes("BULL") ? "var(--bull)" :
    consensus.includes("BEAR") ? "var(--bear)" : "var(--neutral)";

  return (
    <>
      <div className="card">
        {/* En-tete */}
        <div className="ft-sp-header">
          <div>
            <div className="section-label">Analyses strategiques</div>
            <div className="ft-sp-title">Price Action · SMC · RSI · MACD</div>
          </div>
          <div className="ft-sp-consensus">
            <div className="ft-sp-cons-label">Consensus</div>
            <div className="ft-sp-cons-val" style={{ color: consColor }}>{consensus}</div>
          </div>
        </div>

        {/* Barre de votes */}
        <div className="ft-sp-votes">
          <div className="ft-sp-vote-bar" style={{ flex: bulls,    background: "var(--bull)",    opacity: bulls > 0    ? 1 : 0.15 }} />
          <div className="ft-sp-vote-bar" style={{ flex: neutrals, background: "var(--neutral)", opacity: neutrals > 0 ? 1 : 0.15 }} />
          <div className="ft-sp-vote-bar" style={{ flex: bears,    background: "var(--bear)",    opacity: bears > 0    ? 1 : 0.15 }} />
          <span className="ft-sp-vote-count">{bulls}▲ {neutrals}◆ {bears}▼</span>
        </div>

        {/* Grille 2x2 responsive */}
        <div className="ft-sp-grid">
          {(Object.keys(strategies) as Array<keyof Prediction["strategies"]>).map((key) => (
            <MiniStratCard key={key} strategy={strategies[key]} meta={STRATEGY_META[key]} />
          ))}
        </div>

        <div className="ft-sp-note">
          Ces analyses sont calculees sur la timeframe selectionnee et ne constituent pas un conseil financier.
        </div>
      </div>

      <style>{`
        .ft-sp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem; }
        .ft-sp-title { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }
        .ft-sp-consensus { text-align: right; }
        .ft-sp-cons-label { font-size: 0.52rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .ft-sp-cons-val { font-family: var(--font-mono), monospace; font-size: 0.65rem; font-weight: 700; }
        .ft-sp-votes { display: flex; gap: 3px; margin-bottom: 0.85rem; align-items: center; }
        .ft-sp-vote-bar { height: 4px; border-radius: 2px; transition: flex 0.5s ease; min-width: 4px; }
        .ft-sp-vote-count { font-size: 0.56rem; color: var(--text-muted); margin-left: 0.4rem; white-space: nowrap; flex-shrink: 0; }
        .ft-sp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .ft-strat-card {
          padding: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          transition: border-color 0.2s;
        }
        .ft-strat-card:hover { border-color: var(--border); }
        .ft-strat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.45rem; gap: 0.35rem; }
        .ft-strat-id { display: flex; align-items: center; gap: 0.35rem; min-width: 0; }
        .ft-strat-icon {
          width: 26px; height: 26px; min-width: 26px;
          background: var(--accent-subtle); border: 1px solid var(--border);
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          font-size: 0.55rem; font-weight: 800; color: var(--text-accent);
          font-family: var(--font-mono), monospace;
        }
        .ft-strat-name { font-size: 0.68rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .ft-strat-desc { font-size: 0.54rem; color: var(--text-muted); margin-top: 1px; }
        .ft-strat-signal {
          font-size: 0.62rem; color: var(--text-secondary);
          padding: 0.3rem 0.45rem;
          background: var(--bg-card); border-radius: 5px;
          border: 1px solid var(--border-subtle);
          margin-bottom: 0.4rem; line-height: 1.35;
        }
        .ft-strat-conf-row { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.35rem; }
        .ft-strat-conf-label { font-size: 0.55rem; color: var(--text-muted); white-space: nowrap; }
        .ft-strat-bar { flex: 1; height: 3px; background: var(--border-subtle); border-radius: 99px; overflow: hidden; }
        .ft-strat-bar-fill { height: 100%; border-radius: 99px; transition: width 0.7s ease; }
        .ft-strat-conf-val { font-size: 0.6rem; font-weight: 700; min-width: 28px; text-align: right; font-family: var(--font-mono), monospace; }
        .ft-strat-detail { display: flex; gap: 0.3rem; font-size: 0.57rem; color: var(--text-muted); line-height: 1.35; margin-top: 0.15rem; }
        .ft-strat-dot { color: var(--text-accent); flex-shrink: 0; }
        .ft-sp-note {
          margin-top: 0.75rem;
          padding: 0.45rem 0.65rem;
          background: var(--accent-subtle);
          border: 1px solid var(--border);
          border-radius: 7px;
          font-size: 0.57rem; color: var(--text-muted); line-height: 1.45;
        }

        /* Mobile : passer en 1 colonne */
        @media (max-width: 480px) {
          .ft-sp-grid { grid-template-columns: 1fr; }
          .ft-strat-desc { display: none; }
        }
      `}</style>
    </>
  );
}
