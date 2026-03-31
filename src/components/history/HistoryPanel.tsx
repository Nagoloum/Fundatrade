"use client";
import { useEffect, useState } from "react";
import { loadAllWeeklyPredictions, computeWeeklyStats } from "@/lib/weekly/weeklyStorage";
import type { WeeklyPrediction, Asset } from "@/types";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; brd: string; icon: string }> = {
  active:     { label: "EN COURS",     color: "var(--accent)",     bg: "var(--accent-subtle)",  brd: "var(--accent-border)", icon: "◉" },
  target_hit: { label: "OBJECTIF HIT", color: "var(--bull)",       bg: "var(--bull-bg)",         brd: "var(--bull-border)",   icon: "✓" },
  stop_hit:   { label: "STOP TOUCHÉ",  color: "var(--bear)",       bg: "var(--bear-bg)",          brd: "var(--bear-border)",   icon: "✗" },
  expired:    { label: "EXPIRÉ",       color: "var(--text-muted)", bg: "transparent",             brd: "var(--border-subtle)", icon: "○" },
};

const ASSET_COLORS: Record<Asset, string> = { BTC: "#f7931a", XAUUSD: "#ffd700" };

function StatCard({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "0.75rem 0.9rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 10 }}>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.3rem", fontWeight: 700, color: color || "var(--text-primary)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 3, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function HistoryPanel() {
  const [preds, setPreds]     = useState<WeeklyPrediction[]>([]);
  const [filter, setFilter]   = useState<"all" | Asset>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const all = loadAllWeeklyPredictions();
    setPreds(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const filtered = filter === "all" ? preds : preds.filter(p => p.asset === filter);
  const stats    = computeWeeklyStats(filtered);
  const historical = filtered.filter(p => p.status !== "active");

  // Build equity curve
  const equityCurve: number[] = [];
  let cumPnl = 0;
  [...historical].reverse().forEach(p => {
    cumPnl += p.finalPnlPercent ?? 0;
    equityCurve.push(parseFloat(cumPnl.toFixed(2)));
  });

  const pnlColor = (v: number) => v > 0 ? "var(--bull)" : v < 0 ? "var(--bear)" : "var(--text-muted)";
  const fmtPct   = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <>
      <div className="ft-hist">
        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.05em", marginBottom: 6 }}>
            Historique des Objectifs
          </h1>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>
            Bilan hebdomadaire des prédictions BTC et Or · Statistiques de performance
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {(["all", "BTC", "XAUUSD"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={filter === f ? "btn-primary" : "btn-ghost"}
              style={{ fontSize: "0.62rem", fontFamily: "'Orbitron', monospace", padding: "0.38rem 0.9rem" }}>
              {f === "all" ? "Tous" : f}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        {historical.length > 0 ? (
          <>
            <div className="ft-hist-stats-grid">
              <StatCard label="Total prédictions" value={stats.total} />
              <StatCard label="Objectifs atteints" value={stats.wins} color="var(--bull)" />
              <StatCard label="Stops touchés"      value={stats.losses} color="var(--bear)" />
              <StatCard label="Win Rate"           value={`${stats.winRate}%`} color={stats.winRate >= 50 ? "var(--bull)" : "var(--bear)"} />
              <StatCard label="P&L Cumulé"         value={fmtPct(stats.totalCumulativePnl)} color={pnlColor(stats.totalCumulativePnl)} />
              <StatCard label="Moy P&L (wins)"     value={fmtPct(stats.avgPnlWins)} color="var(--bull)" sub={`Pertes: ${fmtPct(stats.avgPnlLosses)}`} />
              <StatCard label="Meilleure semaine"  value={fmtPct(stats.bestWeek)} color="var(--bull)" />
              <StatCard label="Pire semaine"       value={fmtPct(stats.worstWeek)} color="var(--bear)" />
            </div>

            {/* Equity curve */}
            {equityCurve.length >= 2 && (
              <div className="card" style={{ marginBottom: "1.25rem", padding: "0.9rem 1rem" }}>
                <div className="section-label" style={{ marginBottom: "0.6rem" }}>Courbe P&L Cumulé</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
                  {equityCurve.map((v, i) => {
                    const max = Math.max(...equityCurve.map(Math.abs), 0.1);
                    const h = Math.max(4, (Math.abs(v) / max) * 56);
                    return (
                      <div key={i} title={`${fmtPct(v)}`} style={{ flex: 1, height: `${h}px`, background: v >= 0 ? "var(--bull)" : "var(--bear)", borderRadius: "2px 2px 0 0", opacity: 0.85, minWidth: 6, cursor: "pointer", transition: "opacity 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.85"} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)" }}>
                  <span>Semaine 1</span>
                  <span style={{ color: pnlColor(equityCurve[equityCurve.length - 1]) }}>Total : {fmtPct(equityCurve[equityCurve.length - 1])}</span>
                  <span>Semaine {equityCurve.length}</span>
                </div>
              </div>
            )}

            {/* By asset / timeframe breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
              {Object.entries(stats.byAsset).map(([asset, s]) => (
                <div key={asset} className="card" style={{ padding: "0.75rem 0.9rem" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", color: ASSET_COLORS[asset as Asset] || "var(--text-accent)", marginBottom: 8 }}>{asset}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{s.total} trades</span>
                    <span style={{ color: s.winRate >= 50 ? "var(--bull)" : "var(--bear)", fontWeight: 700 }}>{s.winRate}% win</span>
                  </div>
                </div>
              ))}
              {Object.entries(stats.byTimeframe).map(([tf, s]) => (
                <div key={tf} className="card" style={{ padding: "0.75rem 0.9rem" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-accent)", marginBottom: 8 }}>{tf}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{s.total} trades</span>
                    <span style={{ color: s.winRate >= 50 ? "var(--bull)" : "var(--bear)", fontWeight: 700 }}>{s.winRate}% win</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📊</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>Aucun historique disponible</div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Les statistiques apparaîtront ici après la fin de votre première semaine de prédictions.
            </p>
          </div>
        )}

        {/* Prediction list */}
        <div className="section-label" style={{ marginBottom: "0.65rem" }}>Prédictions passées ({historical.length})</div>

        {historical.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.78rem" }}>Aucune prédiction clôturée pour le moment</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {historical.map(pred => {
              const sc    = STATUS_CFG[pred.status];
              const dirC  = pred.direction === "BULLISH" ? "var(--bull)" : pred.direction === "BEARISH" ? "var(--bear)" : "var(--neutral)";
              const dirI  = pred.direction === "BULLISH" ? "▲" : pred.direction === "BEARISH" ? "▼" : "◆";
              const pnl   = pred.finalPnlPercent;
              const isExp = expandedId === pred.id;

              return (
                <div key={pred.id} className="card" style={{ padding: "0.85rem 1rem", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExp ? null : pred.id)}>
                  {/* Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {/* Asset + Direction */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 100 }}>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.06em", color: ASSET_COLORS[pred.asset] }}>{pred.asset === "XAUUSD" ? "XAU/USD" : "BTC/USD"}</span>
                      <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.52rem", color: "var(--text-muted)" }}>{pred.timeframe}</span>
                      <span style={{ color: dirC, fontSize: "0.75rem" }}>{dirI}</span>
                    </div>

                    {/* Week */}
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-primary)" }}>{pred.weekLabel}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)", marginTop: 1 }}>
                        Entrée: ${pred.entryPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Target / Stop */}
                    <div style={{ display: "flex", gap: "0.6rem" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.44rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 2 }}>TARGET</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", fontWeight: 700, color: "var(--bull)" }}>${pred.targetPrice.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.44rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 2 }}>STOP</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", fontWeight: 700, color: "var(--bear)" }}>${pred.stopLoss.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}</div>
                      </div>
                    </div>

                    {/* P&L */}
                    <div style={{ textAlign: "right", minWidth: 60 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.95rem", fontWeight: 800, color: pnl !== undefined ? pnlColor(pnl) : "var(--text-muted)" }}>
                        {pnl !== undefined ? fmtPct(pnl) : "—"}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.22rem", padding: "0.18rem 0.5rem", borderRadius: 4, background: sc.bg, border: `1px solid ${sc.brd}`, fontFamily: "'Orbitron', monospace", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.1em", color: sc.color, flexShrink: 0 }}>
                      {sc.icon} {sc.label}
                    </span>

                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", transition: "transform 0.2s", transform: isExp ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>

                  {/* Expanded details */}
                  {isExp && (
                    <div style={{ marginTop: "0.85rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", animation: "fade-in 0.2s ease" }}>
                      {pred.reasoning.length > 0 && (
                        <div style={{ marginBottom: "0.65rem" }}>
                          <div className="section-label" style={{ marginBottom: "0.35rem" }}>Facteurs de décision</div>
                          {pred.reasoning.map((r, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.28rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.14rem", fontWeight: 500 }}>
                              <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{r}
                            </div>
                          ))}
                        </div>
                      )}
                      {pred.keyEvents && pred.keyEvents.length > 0 && (
                        <div>
                          <div className="section-label" style={{ marginBottom: "0.35rem" }}>Événements économiques</div>
                          {pred.keyEvents.slice(0, 3).map((e, i) => (
                            <div key={i} style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "var(--text-secondary)", marginBottom: "0.18rem" }}>
                              ⚡ {e.title} · {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                              {e.actual ? ` · Actuel: ${e.actual}` : e.forecast ? ` · Forecast: ${e.forecast}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.45rem", marginTop: "0.6rem" }}>
                        {[
                          { l: "Fondamental", v: pred.fundamentalScore },
                          { l: "Technique",   v: pred.technicalScore },
                          { l: "Sentiment",   v: pred.sentimentScore },
                          { l: "Global",      v: pred.globalScore },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ padding: "0.45rem 0.55rem", background: "var(--bg-surface)", borderRadius: 7, textAlign: "center" }}>
                            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: 3, fontWeight: 600 }}>{l}</div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: v >= 60 ? "var(--bull)" : v <= 40 ? "var(--bear)" : "var(--neutral)" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {pred.closedAt && (
                        <div style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "var(--text-muted)" }}>
                          {pred.closedPrice !== undefined ? `Clôturé à $${pred.closedPrice.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} · ` : ""}
                          {new Date(pred.closedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .ft-hist { max-width: 100%; }
        .ft-hist-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.6rem; margin-bottom: 1.1rem; }
        @media (max-width: 900px) { .ft-hist-stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px) { .ft-hist-stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 380px) { .ft-hist-stats-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  );
}
