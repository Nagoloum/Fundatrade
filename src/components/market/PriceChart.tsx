"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { HistoryPoint, Timeframe } from "@/types";

const TF_LABELS: Record<Timeframe, string> = { "4H": "4 heures", "1J": "60 derniers jours", "1W": "52 semaines" };

function CustomTooltip({ active, payload, label, timeframe }: any) {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value as number;
  const fmt = () => {
    try {
      const d = new Date(label);
      return timeframe === "4H"
        ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch { return label; }
  };
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)", borderRadius: 8, padding: "0.55rem 0.85rem", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 3 }}>{fmt()}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.92rem", fontWeight: 700, color: "var(--text-accent)" }}>
        ${price?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

export default function PriceChart({ data, timeframe, lastUpdated }: { data: HistoryPoint[]; timeframe: Timeframe; lastUpdated?: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "'Rajdhani', sans-serif" }}>Aucune donnée historique</span>
      </div>
    );
  }

  const prices      = data.map(d => d.price);
  const startPrice  = data[0]?.price;
  const currentPrice = data[data.length - 1]?.price;
  const isPositive  = currentPrice >= startPrice;
  const accentHex   = isPositive ? "#00f0a0" : "#ff3d6b";
  const tickInterval = Math.max(1, Math.floor(data.length / 6));

  const fmtXTick = (val: string) => {
    try {
      const d = new Date(val);
      return timeframe === "4H"
        ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    } catch { return val; }
  };

  const fmtYTick = (val: number) => {
    if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val/1000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  const changePct = Math.abs(((currentPrice - startPrice) / startPrice) * 100).toFixed(2);

  return (
    <div className="card" style={{ padding: "1.1rem 1.1rem 0.8rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.4rem" }}>
        <div>
          <div className="section-label">Graphique — {TF_LABELS[timeframe]}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginTop: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.05rem", fontWeight: 700, color: isPositive ? "var(--bull)" : "var(--bear)" }}>
              ${currentPrice?.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", fontWeight: 700, color: isPositive ? "var(--bull)" : "var(--bear)", background: isPositive ? "var(--bull-bg)" : "var(--bear-bg)", padding: "0.12rem 0.4rem", borderRadius: 4 }}>
              {isPositive ? "▲" : "▼"} {changePct}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>HIGH</div>
            <div style={{ color: "var(--bull)", fontWeight: 700 }}>${Math.max(...prices).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--text-muted)", marginBottom: 2 }}>LOW</div>
            <div style={{ color: "var(--bear)", fontWeight: 700 }}>${Math.min(...prices).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 190 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 2, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentHex} stopOpacity={0.22} />
                <stop offset="95%" stopColor={accentHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false} axisLine={false} interval={tickInterval} tickFormatter={fmtXTick} />
            <YAxis stroke="transparent" tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
              tickLine={false} axisLine={false} tickFormatter={fmtYTick} domain={["auto","auto"]} width={54} />
            <Tooltip content={<CustomTooltip timeframe={timeframe} />} cursor={{ stroke: "var(--border-strong)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <ReferenceLine y={startPrice} stroke="var(--text-muted)" strokeDasharray="3 3" strokeOpacity={0.35} />
            <Area type="monotone" dataKey="price" stroke={accentHex} strokeWidth={2} fill="url(#cg)" dot={false}
              activeDot={{ r: 5, fill: accentHex, stroke: "var(--bg-base)", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {lastUpdated && (
        <div style={{ marginTop: "0.6rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)" }}>
          <div className="live-dot" style={{ width: 4, height: 4 }} />
          {new Date(lastUpdated).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      )}
    </div>
  );
}
