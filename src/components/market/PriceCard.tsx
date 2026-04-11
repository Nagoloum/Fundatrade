"use client";
import type { Asset, MarketData } from "@/types";
import { useEffect, useRef, useState } from "react";

const ASSET_META: Record<Asset, { name: string; symbol: string; color: string }> = {
  BTC:    { name: "Bitcoin",    symbol: "₿",  color: "#f7931a" },
  XAUUSD: { name: "Or (XAUUSD)", symbol: "Au", color: "#ffd700" },
};

export default function PriceCard({ data, asset }: { data: MarketData; asset: Asset }) {
  const prevRef   = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const meta = ASSET_META[asset];
  const isPos = data.change24h >= 0;

  useEffect(() => {
    if (prevRef.current !== null && prevRef.current !== data.price) {
      const dir = data.price > prevRef.current ? "up" : "down";
      setFlash(dir);
      setTimeout(() => setFlash(null), 800);
    }
    prevRef.current = data.price;
  }, [data.price]);

  const fmtPrice = (p: number) =>
    p >= 1000
      ? p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <>
      <div className="card ft-pcard" style={{
        borderColor: flash === "up" ? "rgba(0,240,160,0.4)" : flash === "down" ? "rgba(255,61,107,0.4)" : "var(--border)",
        transition: "border-color 0.4s ease",
      }}>
        {/* Top accent line */}
        <div className="ft-pcard-topline" style={{ background: isPos
          ? "linear-gradient(90deg, transparent, var(--bull), transparent)"
          : "linear-gradient(90deg, transparent, var(--bear), transparent)"
        }} />

        {/* Header row */}
        <div className="ft-pcard-header">
          <div className="ft-pcard-identity">
            <div className="ft-pcard-icon" style={{ borderColor: meta.color + "44", color: meta.color }}>
              {meta.symbol}
            </div>
            <div>
              <div className="ft-pcard-asset">{asset === "XAUUSD" ? "XAU/USD" : "BTC/USD"}</div>
              <div className="ft-pcard-name">{meta.name}</div>
            </div>
          </div>
          <div className="ft-pcard-change" style={{
            background: isPos ? "var(--bull-bg)" : "var(--bear-bg)",
            border: `1px solid ${isPos ? "var(--bull-border)" : "var(--bear-border)"}`,
            color: isPos ? "var(--bull)" : "var(--bear)",
          }}>
            <span>{isPos ? "▲" : "▼"}</span>
            <span className="font-mono">{Math.abs(data.change24h).toFixed(2)}%</span>
          </div>
        </div>

        {/* Price */}
        <div className="ft-pcard-price-wrap">
          <div className="ft-pcard-price-label section-label">Prix actuel</div>
          <div className="ft-pcard-price font-mono" style={{
            color: flash === "up" ? "var(--bull)" : flash === "down" ? "var(--bear)" : "var(--text-primary)",
            textShadow: flash === "up" ? "0 0 12px var(--bull)" : flash === "down" ? "0 0 12px var(--bear)" : "none",
            transition: "color 0.3s ease, text-shadow 0.3s ease",
          }}>
            ${fmtPrice(data.price)}
          </div>
        </div>

        {/* High / Low */}
        {(data.high24h || data.low24h) && (
          <div className="ft-pcard-hl">
            <div className="ft-pcard-hl-item">
              <span className="ft-pcard-hl-label">Haut 24h</span>
              <span className="ft-pcard-hl-val font-mono" style={{ color: "var(--bull)" }}>${fmtPrice(data.high24h!)}</span>
            </div>
            <div className="ft-pcard-hl-sep" />
            <div className="ft-pcard-hl-item">
              <span className="ft-pcard-hl-label">Bas 24h</span>
              <span className="ft-pcard-hl-val font-mono" style={{ color: "var(--bear)" }}>${fmtPrice(data.low24h!)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="ft-pcard-footer">
          <div className="live-dot" style={{ width: 5, height: 5 }} />
          <span>Mis à jour : {new Date(data.lastUpdated).toLocaleTimeString("fr-FR")}</span>
        </div>
      </div>

      <style>{`
        .ft-pcard { overflow: hidden; }
        .ft-pcard-topline { position: absolute; top: 0; left: 0; right: 0; height: 2px; opacity: 0.6; }
        .ft-pcard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; }
        .ft-pcard-identity { display: flex; align-items: center; gap: 0.55rem; }
        .ft-pcard-icon {
          width: 38px; height: 38px; min-width: 38px;
          background: var(--bg-surface); border: 1px solid;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 700;
        }
        .ft-pcard-asset { font-family: 'Orbitron', monospace; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; color: var(--text-muted); text-transform: uppercase; }
        .ft-pcard-name  { font-size: 0.75rem; color: var(--text-secondary); margin-top: 1px; font-family: 'Rajdhani', sans-serif; }
        .ft-pcard-change { display: flex; align-items: center; gap: 0.28rem; padding: 0.28rem 0.65rem; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; }
        .ft-pcard-price-wrap { margin-bottom: 0.85rem; }
        .ft-pcard-price { font-size: 2.1rem; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; }
        .ft-pcard-hl {
          display: flex; align-items: center; gap: 0; padding: 0.7rem 0.85rem;
          background: var(--bg-surface); border-radius: 8px; border: 1px solid var(--border-subtle);
          margin-bottom: 0.75rem;
        }
        .ft-pcard-hl-item { display: flex; flex-direction: column; flex: 1; }
        .ft-pcard-hl-label { font-family: 'Orbitron', monospace; font-size: 0.48rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 3px; }
        .ft-pcard-hl-val   { font-size: 0.82rem; font-weight: 700; }
        .ft-pcard-hl-sep   { width: 1px; height: 32px; background: var(--border-subtle); margin: 0 0.75rem; }
        .ft-pcard-footer   { display: flex; align-items: center; gap: 0.35rem; font-family: 'JetBrains Mono', monospace; font-size: 0.55rem; color: var(--text-muted); }
        @media (max-width: 400px) { .ft-pcard-price { font-size: 1.7rem; } }
      `}</style>
    </>
  );
}
