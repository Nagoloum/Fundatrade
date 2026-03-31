"use client";
import type { Asset, Timeframe } from "@/types";

const ASSETS: { id: Asset; label: string; symbol: string; color: string }[] = [
  { id: "BTC",    label: "Bitcoin", symbol: "₿",  color: "#f7931a" },
  { id: "XAUUSD", label: "Or",      symbol: "Au", color: "#ffd700" },
];

const TIMEFRAMES: { id: Timeframe; label: string; desc: string }[] = [
  { id: "4H", label: "4H",    desc: "Court terme" },
  { id: "1J", label: "1J",    desc: "Journalier"  },
  { id: "1W", label: "1 Sem", desc: "Hebdomadaire" },
];

interface Props {
  selectedAsset: Asset;
  selectedTimeframe: Timeframe;
  onSelectAsset: (a: Asset) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export default function AssetSelector({ selectedAsset, selectedTimeframe, onSelectAsset, onSelectTimeframe }: Props) {
  return (
    <>
      <div className="ft-asel-root">
        {/* Asset buttons */}
        <div className="ft-asel-assets">
          {ASSETS.map(a => {
            const active = selectedAsset === a.id;
            return (
              <button key={a.id} onClick={() => onSelectAsset(a.id)}
                className="ft-asel-btn" data-active={active}
                style={{ "--asset-color": a.color } as React.CSSProperties}>
                <span className="ft-asel-symbol">{a.symbol}</span>
                <span className="ft-asel-id">{a.id}</span>
                <span className="ft-asel-name">{a.label}</span>
              </button>
            );
          })}
        </div>

        <div className="ft-asel-divider" />

        {/* Timeframe tabs */}
        <div className="ft-tf-wrap">
          <span className="ft-tf-label">Période</span>
          <div className="ft-tf-group">
            {TIMEFRAMES.map(tf => (
              <button key={tf.id} onClick={() => onSelectTimeframe(tf.id)}
                className="ft-tf-btn" data-active={selectedTimeframe === tf.id}
                title={tf.desc}>
                {tf.label}
              </button>
            ))}
          </div>
          <span className="ft-tf-desc">
            {TIMEFRAMES.find(t => t.id === selectedTimeframe)?.desc}
          </span>
        </div>
      </div>

      <style>{`
        .ft-asel-root {
          display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
        }
        .ft-asel-assets { display: flex; gap: 0.45rem; }
        .ft-asel-btn {
          display: flex; align-items: center; gap: 0.45rem;
          padding: 0.5rem 1rem; border-radius: 8px;
          border: 1px solid var(--border); background: var(--bg-card);
          color: var(--text-secondary); cursor: pointer;
          font-family: 'Rajdhani', sans-serif; font-size: 0.8rem; font-weight: 500;
          transition: all 0.18s ease; white-space: nowrap;
          position: relative; overflow: hidden;
        }
        .ft-asel-btn::before {
          content: ''; position: absolute; inset: 0;
          background: var(--asset-color); opacity: 0;
          transition: opacity 0.18s ease;
        }
        .ft-asel-btn:hover { border-color: var(--border-strong); color: var(--text-primary); }
        .ft-asel-btn:hover::before { opacity: 0.05; }
        .ft-asel-btn[data-active="true"] {
          border-color: var(--asset-color, var(--accent-border)) !important;
          background: rgba(var(--asset-r, 0), var(--asset-g, 240), var(--asset-b, 160), 0.08) !important;
          color: var(--asset-color, var(--text-accent)) !important;
          font-weight: 700 !important;
          box-shadow: 0 0 12px color-mix(in srgb, var(--asset-color, var(--accent)) 20%, transparent);
        }
        .ft-asel-btn[data-active="true"]::before { opacity: 0.07; }
        .ft-asel-symbol {
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          opacity: 0.8; position: relative; z-index: 1;
        }
        .ft-asel-id {
          font-family: 'Orbitron', monospace; font-size: 0.65rem; font-weight: 700;
          letter-spacing: 0.05em; position: relative; z-index: 1;
        }
        .ft-asel-name {
          font-size: 0.7rem; opacity: 0.65; position: relative; z-index: 1;
        }
        .ft-asel-divider { width: 1px; height: 28px; background: var(--border-subtle); flex-shrink: 0; }
        .ft-tf-wrap { display: flex; align-items: center; gap: 0.55rem; }
        .ft-tf-label { font-family: 'Orbitron', monospace; font-size: 0.5rem; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); }
        .ft-tf-group {
          display: flex; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 7px; padding: 3px; gap: 2px;
        }
        .ft-tf-btn {
          padding: 0.28rem 0.85rem; border-radius: 5px; border: none;
          background: transparent; color: var(--text-muted);
          font-family: 'Rajdhani', sans-serif; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
        }
        .ft-tf-btn:hover { color: var(--text-secondary); background: var(--accent-subtle); }
        .ft-tf-btn[data-active="true"] {
          background: var(--accent) !important;
          color: #020c18 !important;
          font-family: 'Orbitron', monospace !important;
          font-weight: 700 !important;
          font-size: 0.6rem !important;
          box-shadow: 0 0 8px var(--accent-glow);
        }
        .ft-tf-desc { font-size: 0.58rem; color: var(--text-muted); font-family: 'Rajdhani', sans-serif; }
        @media (max-width: 600px) {
          .ft-asel-name { display: none; }
          .ft-asel-divider { display: none; }
          .ft-tf-label { display: none; }
          .ft-tf-desc  { display: none; }
          .ft-asel-btn { padding: 0.45rem 0.7rem; }
        }
      `}</style>
    </>
  );
}
