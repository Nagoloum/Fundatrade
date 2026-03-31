"use client";
import type { Prediction } from "@/types";

const STRAT_META: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  priceAction: { icon: "PA", label: "Price Action", desc: "Structure & niveaux",    color: "#6688ff" },
  smc:         { icon: "SC", label: "SMC",          desc: "Order blocks & liquidité", color: "#aa66ff" },
  rsi:         { icon: "RS", label: "RSI",          desc: "Momentum oscillateur",    color: "#00f0a0" },
  macd:        { icon: "MC", label: "MACD",         desc: "Tendance & croisements",  color: "#00ccff" },
  ichimoku:    { icon: "IC", label: "Ichimoku",     desc: "Nuage & confluence",       color: "#ffab00" },
  adx:         { icon: "DX", label: "ADX",          desc: "Force & régime",           color: "#ff6688" },
};

const DIR_CFG = {
  BULLISH: { icon: "▲", label: "HAUSSIER", color: "var(--bull)",    bg: "var(--bull-bg)",    border: "var(--bull-border)"    },
  BEARISH: { icon: "▼", label: "BAISSIER", color: "var(--bear)",    bg: "var(--bear-bg)",    border: "var(--bear-border)"    },
  NEUTRAL: { icon: "◆", label: "NEUTRE",   color: "var(--neutral)", bg: "var(--neutral-bg)", border: "var(--neutral-border)" },
};

export default function StrategiesPanel({ strategies }: { strategies: Prediction["strategies"] }) {
  const entries  = Object.entries(strategies);
  const dirs     = entries.map(([, s]: any) => s.direction);
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

  const consColor = consensus.includes("HAUSSIER") ? "var(--bull)" : consensus.includes("BAISSIER") ? "var(--bear)" : "var(--neutral)";
  const avgConf   = Math.round(entries.reduce((s, [, v]: any) => s + v.confidence, 0) / total);
  const gr = (v: number) => v >= 60 ? "#00c880,#00f0a0" : v <= 40 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";
  const sc = (v: number) => v >= 60 ? "var(--bull)" : v <= 40 ? "var(--bear)" : "var(--neutral)";

  return (
    <>
      <div className="card ft-strat">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
          <div>
            <div className="section-label">Analyses stratégiques</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>{total} stratégies · {total * 2} indicateurs</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Consensus</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.65rem", fontWeight: 700, color: consColor }}>{consensus}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 1 }}>{avgConf}% moy.</div>
          </div>
        </div>

        {/* Vote bar */}
        <div style={{ display: "flex", gap: 3, marginBottom: "0.75rem", alignItems: "center" }}>
          {bulls > 0    && <div style={{ flex: bulls,    height: 4, background: "var(--bull)",    borderRadius: 2 }} />}
          {neutrals > 0 && <div style={{ flex: neutrals, height: 4, background: "var(--neutral)", borderRadius: 2 }} />}
          {bears > 0    && <div style={{ flex: bears,    height: 4, background: "var(--bear)",    borderRadius: 2 }} />}
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", marginLeft: 4, whiteSpace: "nowrap", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--bull)" }}>▲{bulls}</span>{" "}
            <span style={{ color: "var(--neutral)" }}>◆{neutrals}</span>{" "}
            <span style={{ color: "var(--bear)" }}>▼{bears}</span>
          </span>
        </div>

        {/* Strategy grid */}
        <div className="ft-strat-grid">
          {entries.map(([key, strategy]: any) => {
            const meta = STRAT_META[key] ?? { icon: "??", label: key, desc: "", color: "var(--text-muted)" };
            const dc   = DIR_CFG[strategy.direction as keyof typeof DIR_CFG];
            return (
              <div key={key} className="ft-strat-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.35rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.32rem", minWidth: 0 }}>
                    <div style={{ width: 24, height: 24, minWidth: 24, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Orbitron', monospace", fontSize: "0.48rem", fontWeight: 800, background: meta.color + "18", border: `1px solid ${meta.color}44`, color: meta.color }}>
                      {meta.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{meta.label}</div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.52rem", color: "var(--text-muted)", marginTop: 1 }}>{meta.desc}</div>
                    </div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "0.15rem 0.42rem", borderRadius: 4, border: `1px solid ${dc.border}`, background: dc.bg, color: dc.color, fontFamily: "'Orbitron', monospace", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0 }}>
                    {dc.icon} {dc.label}
                  </span>
                </div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: "var(--text-secondary)", padding: "0.25rem 0.38rem", background: "var(--bg-card)", borderRadius: 5, border: "1px solid var(--border-subtle)", marginBottom: "0.32rem", lineHeight: 1.35, fontWeight: 500 }}>
                  {strategy.signal}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.38rem" }}>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.52rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Conf.</span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${strategy.confidence}%`, background: `linear-gradient(90deg,${gr(strategy.confidence)})` }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", fontWeight: 700, color: sc(strategy.confidence), minWidth: 28, textAlign: "right" }}>{strategy.confidence}%</span>
                </div>
                {strategy.details?.slice(0, 1).map((d: string, i: number) => (
                  <div key={i} style={{ display: "flex", gap: "0.25rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", color: "var(--text-muted)", lineHeight: 1.3, marginTop: "0.18rem", fontWeight: 500 }}>
                    <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{d}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "0.35rem 0.55rem", background: "var(--accent-subtle)", border: "1px solid var(--border)", borderRadius: 6, fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          Analyses sur la timeframe sélectionnée · Ne constitue pas un conseil financier.
        </div>
      </div>

      <style>{`
        .ft-strat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.65rem; }
        .ft-strat-card { padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 9px; transition: border-color 0.18s; }
        .ft-strat-card:hover { border-color: var(--border); }
        @media (max-width: 480px) { .ft-strat-grid { grid-template-columns: 1fr; } }
      `}</style>
    </>
  );
}
