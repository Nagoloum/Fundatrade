"use client";
import type { DerivativesData, Asset } from "@/types";

interface DerivativesPanelProps {
  data: DerivativesData;
  asset: Asset;
}

export default function DerivativesPanel({ data, asset }: DerivativesPanelProps) {
  const fmt = (n: number | undefined, decimals = 3, suffix = "%") =>
    n !== undefined ? `${n > 0 ? "+" : ""}${n.toFixed(decimals)}${suffix}` : "—";

  const frColor = data.fundingRate !== undefined
    ? data.fundingRate > 0.1 ? "var(--bear)" : data.fundingRate < -0.05 ? "var(--bull)" : "var(--neutral)"
    : "var(--text-muted)";

  const lsColor = data.longShortRatio !== undefined
    ? data.longShortRatio > 0.65 ? "var(--bear)" : data.longShortRatio < 0.40 ? "var(--bull)" : "var(--neutral)"
    : "var(--text-muted)";

  const oiColor = data.openInterestChange24h !== undefined
    ? data.openInterestChange24h > 3 ? "var(--bull)" : data.openInterestChange24h < -3 ? "var(--bear)" : "var(--neutral)"
    : "var(--text-muted)";

  const lsPct = data.longShortRatio !== undefined ? data.longShortRatio * 100 : 50;

  return (
    <>
      <div className="card">
        <div className="section-label">Marché des dérivés</div>
        <div className="ft-deriv-sub">Futures {asset}/USDT · Bybit</div>

        <div className="ft-deriv-grid">
          {/* Funding Rate */}
          <div className="ft-deriv-metric">
            <div className="ft-deriv-m-label">Funding Rate <span className="ft-deriv-m-period">(8h)</span></div>
            <div className="ft-deriv-m-value" style={{ color: frColor }}>
              {data.fundingRate !== undefined ? fmt(data.fundingRate) : "—"}
            </div>
            <div className="ft-deriv-m-hint">
              {data.fundingRate !== undefined
                ? data.fundingRate > 0.1 ? "Surcharge pour les longs"
                : data.fundingRate < -0.05 ? "Surcharge pour les shorts"
                : "Équilibré"
                : "Non disponible"}
            </div>
          </div>

          {/* Open Interest */}
          <div className="ft-deriv-metric">
            <div className="ft-deriv-m-label">Open Interest</div>
            <div className="ft-deriv-m-value" style={{ color: "var(--text-primary)", fontSize: "0.82rem" }}>
              {data.openInterest ? `$${(data.openInterest / 1e9).toFixed(2)}B` : "—"}
            </div>
            <div className="ft-deriv-m-hint" style={{ color: oiColor }}>
              {data.openInterestChange24h !== undefined ? `${fmt(data.openInterestChange24h, 1)} sur 1h` : ""}
            </div>
          </div>

          {/* Long/Short Ratio */}
          <div className="ft-deriv-metric" style={{ gridColumn: "1 / -1" }}>
            <div className="ft-deriv-m-label">Ratio Long / Short</div>
            <div className="ft-deriv-ls-bar">
              <div className="ft-deriv-ls-long" style={{ flex: lsPct, background: "var(--bull-bg)", borderRight: "1px solid var(--bull)" }}>
                <span className="ft-deriv-ls-label" style={{ color: "var(--bull)" }}>Long {lsPct.toFixed(1)}%</span>
              </div>
              <div className="ft-deriv-ls-short" style={{ flex: 100 - lsPct, background: "var(--bear-bg)" }}>
                <span className="ft-deriv-ls-label" style={{ color: "var(--bear)" }}>{(100 - lsPct).toFixed(1)}% Short</span>
              </div>
            </div>
            <div className="ft-deriv-m-hint" style={{ color: lsColor }}>
              {data.longShortRatio !== undefined
                ? lsPct > 65 ? "Marché surpositionné long — risque de liquidation en cascade"
                : lsPct < 40 ? "Majorité de shorts — potentiel short squeeze"
                : "Ratio équilibré — pas de biais directionnel fort"
                : ""}
            </div>
          </div>
        </div>

        {/* Signaux dérivés */}
        {data.signals && data.signals.length > 0 && (
          <div className="ft-deriv-signals">
            {(data.signals as string[]).map((s, i) => (
              <div key={i} className="ft-deriv-signal">
                <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{s}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .ft-deriv-sub { font-size: 0.62rem; color: var(--text-muted); margin-bottom: 0.75rem; }
        .ft-deriv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 0.65rem; }
        .ft-deriv-metric { padding: 0.6rem 0.7rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 9px; }
        .ft-deriv-m-label { font-size: 0.56rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .ft-deriv-m-period { font-size: 0.5rem; }
        .ft-deriv-m-value { font-family: var(--font-mono),monospace; font-size: 1rem; font-weight: 700; line-height: 1; margin-bottom: 3px; }
        .ft-deriv-m-hint { font-size: 0.57rem; color: var(--text-muted); line-height: 1.3; }
        .ft-deriv-ls-bar { display: flex; height: 22px; border-radius: 6px; overflow: hidden; margin: 0.35rem 0; }
        .ft-deriv-ls-long, .ft-deriv-ls-short { display: flex; align-items: center; justify-content: center; min-width: 0; transition: flex 0.8s ease; }
        .ft-deriv-ls-label { font-size: 0.58rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; }
        .ft-deriv-signals { display: flex; flex-direction: column; gap: 0.25rem; border-top: 1px solid var(--border-subtle); padding-top: 0.6rem; }
        .ft-deriv-signal { display: flex; gap: 0.35rem; font-size: 0.62rem; color: var(--text-secondary); line-height: 1.4; }
      `}</style>
    </>
  );
}
