"use client";

import { useEffect, useRef, useState } from "react";
import type { Asset, MarketData } from "@/types";

interface PriceCardProps {
  data: MarketData;
  asset: Asset;
}

const ASSET_LABELS: Record<Asset, { name: string; icon: string; currency: string }> = {
  BTC:    { name: "Bitcoin",  icon: "₿", currency: "$" },
  ETH:    { name: "Ethereum", icon: "Ξ", currency: "$" },
  SOL:    { name: "Solana",   icon: "◎", currency: "$" },
  XAUUSD: { name: "Or",       icon: "Au", currency: "$" },
};

export default function PriceCard({ data, asset }: PriceCardProps) {
  const prevPriceRef = useRef<number | null>(null);
  const [flashClass, setFlashClass] = useState<"up" | "down" | null>(null);
  const meta = ASSET_LABELS[asset];

  // Flash animation quand le prix change
  useEffect(() => {
    if (prevPriceRef.current !== null && prevPriceRef.current !== data.price) {
      const dir = data.price > prevPriceRef.current ? "up" : "down";
      setFlashClass(dir);
      const timer = setTimeout(() => setFlashClass(null), 700);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = data.price;
  }, [data.price]);

  const isPositive = data.change24h >= 0;

  const formatPrice = (p: number) =>
    p >= 1000
      ? p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  const flashStyle: React.CSSProperties =
    flashClass === "up"
      ? { color: "var(--bull)", transition: "color 0.15s ease" }
      : flashClass === "down"
      ? { color: "var(--bear)", transition: "color 0.15s ease" }
      : { color: "var(--text-primary)", transition: "color 0.5s ease" };

  return (
    <div
      className="card"
      style={{
        position: "relative",
        overflow: "hidden",
        borderColor: flashClass === "up"
          ? "rgba(0,255,136,0.4)"
          : flashClass === "down"
          ? "rgba(255,68,102,0.4)"
          : "var(--border)",
        transition: "border-color 0.4s ease",
      }}
    >
      {/* Ligne décorative top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: isPositive
            ? "linear-gradient(90deg, transparent, var(--bull), transparent)"
            : "linear-gradient(90deg, transparent, var(--bear), transparent)",
          opacity: 0.5,
        }}
      />

      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Icône actif */}
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "var(--accent-subtle)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.9rem",
              fontFamily: "var(--font-mono), monospace",
              color: "var(--text-accent)",
              fontWeight: 700,
            }}
          >
            {meta.icon}
          </div>
          <div>
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              {asset}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {meta.name}
            </div>
          </div>
        </div>

        {/* Variation 24h */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "0.3rem 0.65rem",
            borderRadius: "8px",
            background: isPositive ? "var(--bull-bg)" : "var(--bear-bg)",
            border: `1px solid ${isPositive ? "rgba(0,255,136,0.2)" : "rgba(255,68,102,0.2)"}`,
          }}
        >
          <span style={{ fontSize: "0.65rem" }}>{isPositive ? "▲" : "▼"}</span>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: isPositive ? "var(--bull)" : "var(--bear)",
            }}
          >
            {Math.abs(data.change24h).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Prix principal */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "0.25rem",
          }}
        >
          Prix actuel
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "2.2rem",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            ...flashStyle,
          }}
        >
          {meta.currency}{formatPrice(data.price)}
        </div>
      </div>

      {/* High / Low 24h */}
      {(data.high24h || data.low24h) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.5rem",
            padding: "0.75rem",
            background: "var(--bg-surface)",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>
              Plus haut 24h
            </div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.82rem", color: "var(--bull)", fontWeight: 700 }}>
              {meta.currency}{formatPrice(data.high24h!)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>
              Plus bas 24h
            </div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.82rem", color: "var(--bear)", fontWeight: 700 }}>
              {meta.currency}{formatPrice(data.low24h!)}
            </div>
          </div>
        </div>
      )}

      {/* Timestamp MAJ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          fontSize: "0.6rem",
          color: "var(--text-muted)",
        }}
      >
        <div className="live-dot" style={{ width: "5px", height: "5px" }} />
        <span>
          Mis à jour :{" "}
          {new Date(data.lastUpdated).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
