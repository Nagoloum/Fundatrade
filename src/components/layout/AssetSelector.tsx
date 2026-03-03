"use client";

import type { Asset, Timeframe } from "@/types";

const ASSETS: { id: Asset; label: string; icon: string }[] = [
  { id: "BTC",    label: "Bitcoin",  icon: "B" },
  { id: "ETH",    label: "Ethereum", icon: "E" },
  { id: "SOL",    label: "Solana",   icon: "S" },
  { id: "XAUUSD", label: "Or",       icon: "Au" },
];

const TIMEFRAMES: { id: Timeframe; label: string; desc: string }[] = [
  { id: "4H", label: "4H",    desc: "Court terme" },
  { id: "1J", label: "1J",    desc: "Journalier" },
  { id: "1W", label: "1 Sem", desc: "Hebdomadaire" },
];

interface AssetSelectorProps {
  selectedAsset: Asset;
  selectedTimeframe: Timeframe;
  onSelectAsset: (asset: Asset) => void;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export default function AssetSelector({
  selectedAsset, selectedTimeframe, onSelectAsset, onSelectTimeframe,
}: AssetSelectorProps) {
  return (
    <>
      <div className="ft-as-root">
        {/* Actifs */}
        <div className="ft-as-row">
          <span className="ft-as-label">Actif</span>
          <div className="ft-as-assets">
            {ASSETS.map((a) => {
              const active = selectedAsset === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => onSelectAsset(a.id)}
                  className={active ? "ft-as-btn ft-as-btn-active" : "ft-as-btn"}
                >
                  <span className="ft-as-icon">{a.icon}</span>
                  <span className="ft-as-name">{a.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframes */}
        <div className="ft-as-row">
          <span className="ft-as-label">Période</span>
          <div className="ft-tf-group">
            {TIMEFRAMES.map((tf) => {
              const active = selectedTimeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => onSelectTimeframe(tf.id)}
                  className={active ? "ft-tf-btn ft-tf-btn-active" : "ft-tf-btn"}
                  title={tf.desc}
                >
                  {tf.label}
                </button>
              );
            })}
          </div>
          <span className="ft-as-desc">
            {TIMEFRAMES.find((t) => t.id === selectedTimeframe)?.desc}
          </span>
        </div>
      </div>

      <style>{`
        .ft-as-root {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .ft-as-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .ft-as-label {
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--text-muted);
          min-width: 44px;
        }
        .ft-as-assets {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .ft-as-btn {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-family: var(--font-syne), sans-serif;
          font-size: 0.75rem; font-weight: 500;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .ft-as-btn:hover {
          border-color: var(--border-strong);
          color: var(--text-primary);
        }
        .ft-as-btn-active {
          background: var(--accent-subtle) !important;
          border-color: var(--border-strong) !important;
          color: var(--text-accent) !important;
          font-weight: 700 !important;
          box-shadow: 0 0 0 1px var(--border-strong), 0 2px 8px var(--accent-glow);
        }
        .ft-as-icon {
          font-family: var(--font-mono), monospace;
          font-size: 0.65rem; opacity: 0.7;
        }
        .ft-tf-group {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }
        .ft-tf-btn {
          padding: 0.28rem 0.8rem;
          border-radius: 5px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-syne), sans-serif;
          font-size: 0.7rem; font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .ft-tf-btn:hover { color: var(--text-secondary); background: var(--accent-subtle); }
        .ft-tf-btn-active {
          background: var(--accent) !important;
          color: #050a0e !important;
          font-weight: 700 !important;
        }
        .ft-as-desc {
          font-size: 0.6rem; color: var(--text-muted);
        }

        /* Mobile : compacter */
        @media (max-width: 480px) {
          .ft-as-label { display: none; }
          .ft-as-btn { padding: 0.38rem 0.65rem; font-size: 0.7rem; }
          .ft-as-icon { display: none; }
          .ft-tf-btn { padding: 0.28rem 0.6rem; }
          .ft-as-desc { display: none; }
        }
      `}</style>
    </>
  );
}
