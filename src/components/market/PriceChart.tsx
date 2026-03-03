"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { HistoryPoint, Timeframe } from "@/types";

interface PriceChartProps {
  data: HistoryPoint[];
  timeframe: Timeframe;
  lastUpdated?: string;
}

const TF_LABELS: Record<Timeframe, string> = {
  "4H": "4 heures",
  "1J": "30 derniers jours",
  "1W": "12 dernières semaines",
};

const TF_DATE_FORMAT: Record<Timeframe, Intl.DateTimeFormatOptions> = {
  "4H": { hour: "2-digit", minute: "2-digit" },
  "1J": { day: "2-digit", month: "short" },
  "1W": { day: "2-digit", month: "short" },
};

// Tooltip personnalisé
function CustomTooltip({ active, payload, label, timeframe }: any) {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value as number;

  const formatLabel = () => {
    try {
      const d = new Date(label);
      return d.toLocaleString("fr-FR", TF_DATE_FORMAT[timeframe as Timeframe]);
    } catch {
      return label;
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-strong)",
        borderRadius: "10px",
        padding: "0.6rem 0.9rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px var(--border)",
      }}
    >
      <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginBottom: "4px" }}>
        {formatLabel()}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "var(--text-accent)",
        }}
      >
        ${price?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function PriceChart({ data, timeframe, lastUpdated }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="card"
        style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
          Aucune donnée historique disponible
        </span>
      </div>
    );
  }

  // Calcul min/max pour la référence
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const startPrice = data[0]?.price;
  const currentPrice = data[data.length - 1]?.price;
  const isPositiveTrend = currentPrice >= startPrice;

  // Formater les labels de l'axe X selon la timeframe
  const formatXTick = (val: string) => {
    try {
      const d = new Date(val);
      if (timeframe === "4H") {
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      }
      return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch {
      return val;
    }
  };

  const formatYTick = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  const accentColor = isPositiveTrend ? "var(--bull)" : "var(--bear)";
  const accentHex   = isPositiveTrend ? "#00ff88" : "#ff4466";

  // Nb de ticks XAxis selon la taille du dataset
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="card" style={{ padding: "1.25rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            Graphique de prix — {TF_LABELS[timeframe]}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: accentColor,
              }}
            >
              ${currentPrice?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: isPositiveTrend ? "var(--bull)" : "var(--bear)",
                background: isPositiveTrend ? "var(--bull-bg)" : "var(--bear-bg)",
                padding: "0.15rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {isPositiveTrend ? "▲" : "▼"}{" "}
              {Math.abs(((currentPrice - startPrice) / startPrice) * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Stats mini */}
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.62rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>+ Haut</div>
            <div style={{ fontFamily: "var(--font-mono), monospace", color: "var(--bull)", fontWeight: 700 }}>
              ${maxPrice.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>+ Bas</div>
            <div style={{ fontFamily: "var(--font-mono), monospace", color: "var(--bear)", fontWeight: 700 }}>
              ${minPrice.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div style={{ height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={accentHex} stopOpacity={0.22} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              stroke="transparent"
              tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
              tickFormatter={formatXTick}
            />
            <YAxis
              stroke="transparent"
              tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYTick}
              domain={["auto", "auto"]}
              width={52}
            />
            <Tooltip
              content={<CustomTooltip timeframe={timeframe} />}
              cursor={{
                stroke: "var(--border-strong)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Ligne de référence — prix de départ */}
            <ReferenceLine
              y={startPrice}
              stroke="var(--text-muted)"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke={accentHex}
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: accentHex,
                stroke: "var(--bg-base)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer MAJ */}
      {lastUpdated && (
        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.35rem",
            fontSize: "0.58rem",
            color: "var(--text-muted)",
          }}
        >
          <div className="live-dot" style={{ width: "5px", height: "5px" }} />
          <span>
            Dernière mise à jour :{" "}
            {new Date(lastUpdated).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
