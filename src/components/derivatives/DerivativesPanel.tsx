"use client";
import type { DerivativesData } from "@/types";

export default function DerivativesPanel({ data }: { data: DerivativesData }) {
  const fmt = (n: number | undefined, dec = 3) => n !== undefined ? `${n > 0 ? "+" : ""}${n.toFixed(dec)}%` : "—";
  const frColor = data.fundingRate !== undefined ? (data.fundingRate > 0.1 ? "var(--bear)" : data.fundingRate < -0.05 ? "var(--bull)" : "var(--neutral)") : "var(--text-muted)";
  const lsColor = data.longShortRatio !== undefined ? (data.longShortRatio > 0.65 ? "var(--bear)" : data.longShortRatio < 0.40 ? "var(--bull)" : "var(--neutral)") : "var(--text-muted)";
  const oiColor = data.openInterestChange24h !== undefined ? (data.openInterestChange24h > 3 ? "var(--bull)" : data.openInterestChange24h < -3 ? "var(--bear)" : "var(--neutral)") : "var(--text-muted)";
  const lsPct = data.longShortRatio !== undefined ? data.longShortRatio * 100 : 50;

  return (
    <div className="card">
      <div className="section-label">Dérivés BTC — Bybit Futures</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.55rem" }}>
        <div style={{ padding: "0.6rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Funding Rate (8h)</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 700, color: frColor, lineHeight: 1 }}>{data.fundingRate !== undefined ? fmt(data.fundingRate) : "—"}</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 3 }}>
            {data.fundingRate !== undefined ? (data.fundingRate > 0.1 ? "Surcharge longs" : data.fundingRate < -0.05 ? "Surcharge shorts" : "Équilibré") : "N/A"}
          </div>
        </div>
        <div style={{ padding: "0.6rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9 }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Open Interest</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
            {data.openInterest ? `$${(data.openInterest / 1e9).toFixed(2)}B` : "—"}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: oiColor, marginTop: 3 }}>
            {data.openInterestChange24h !== undefined ? `${fmt(data.openInterestChange24h, 1)} (1h)` : ""}
          </div>
        </div>
      </div>

      {/* Long/Short ratio */}
      <div style={{ marginBottom: "0.55rem" }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>Ratio Long / Short</div>
        <div style={{ display: "flex", height: 20, borderRadius: 5, overflow: "hidden" }}>
          <div style={{ flex: lsPct, background: "var(--bull-bg)", borderRight: "1px solid var(--bull)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: "var(--bull)", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden" }}>▲ {lsPct.toFixed(1)}%</span>
          </div>
          <div style={{ flex: 100 - lsPct, background: "var(--bear-bg)", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: "var(--bear)", padding: "0 4px", whiteSpace: "nowrap", overflow: "hidden" }}>{(100 - lsPct).toFixed(1)}% ▼</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: lsColor, marginTop: 4, fontWeight: 600 }}>
          {lsPct > 65 ? "Marché surpositionné long — risque liquidation" : lsPct < 40 ? "Majorité shorts — potentiel squeeze" : "Ratio équilibré"}
        </div>
      </div>

      {data.signals && data.signals.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.22rem" }}>
          {data.signals.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.3rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, fontWeight: 500 }}>
              <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
