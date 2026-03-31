"use client";
import type { WeeklyPrediction, Asset } from "@/types";

interface Props {
  weekly: WeeklyPrediction | null;
  currentPrice: number;
  asset: Asset;
  onGenerate: () => void;
  generating: boolean;
}

function StatusBadge({ status }: { status: WeeklyPrediction["status"] }) {
  const cfg = {
    active:      { label: "EN COURS",     color: "var(--accent)",  bg: "var(--accent-subtle)",  border: "var(--accent-border)" },
    target_hit:  { label: "OBJECTIF HIT", color: "var(--bull)",    bg: "var(--bull-bg)",         border: "var(--bull-border)" },
    stop_hit:    { label: "STOP TOUCHÉ",  color: "var(--bear)",    bg: "var(--bear-bg)",          border: "var(--bear-border)" },
    expired:     { label: "EXPIRÉ",       color: "var(--text-muted)", bg: "transparent",         border: "var(--border-subtle)" },
  }[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.2rem 0.6rem", borderRadius: 4, fontFamily: "'Orbitron', monospace", fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.12em", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      {status === "active" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", animation: "ticker-pulse 1.5s ease-in-out infinite", boxShadow: "0 0 4px var(--accent)" }} />}
      {cfg.label}
    </span>
  );
}

export default function WeeklyObjectiveCard({ weekly, currentPrice, asset, onGenerate, generating }: Props) {
  const fmtPrice = (p: number) => p.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Compute live P&L
  let livePnl: number | null = null;
  let pnlColor = "var(--text-muted)";
  if (weekly && weekly.status === "active") {
    const rawPnl = ((currentPrice - weekly.entryPrice) / weekly.entryPrice) * 100;
    livePnl = weekly.direction === "BEARISH" ? -rawPnl : rawPnl;
    pnlColor = livePnl >= 0 ? "var(--bull)" : "var(--bear)";
  } else if (weekly && weekly.finalPnlPercent !== undefined) {
    livePnl = weekly.finalPnlPercent;
    pnlColor = livePnl >= 0 ? "var(--bull)" : "var(--bear)";
  }

  // Progress toward target
  let progressPct = 0;
  if (weekly && weekly.status === "active") {
    const totalMove = Math.abs(weekly.targetPrice - weekly.entryPrice);
    const currentMove = weekly.direction === "BULLISH"
      ? currentPrice - weekly.entryPrice
      : weekly.entryPrice - currentPrice;
    progressPct = totalMove > 0 ? Math.max(0, Math.min(100, (currentMove / totalMove) * 100)) : 0;
  } else if (weekly?.status === "target_hit") progressPct = 100;

  const dirColor   = weekly?.direction === "BULLISH" ? "var(--bull)" : weekly?.direction === "BEARISH" ? "var(--bear)" : "var(--neutral)";
  const dirIcon    = weekly?.direction === "BULLISH" ? "▲" : weekly?.direction === "BEARISH" ? "▼" : "◆";
  const dirLabel   = weekly?.direction === "BULLISH" ? "HAUSSIER" : weekly?.direction === "BEARISH" ? "BAISSIER" : "NEUTRE";

  if (!weekly) {
    return (
      <div className="card card-glow" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.4 }}>📅</div>
        <div className="section-label" style={{ marginBottom: "0.5rem" }}>Objectif de la semaine</div>
        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1.25rem", fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.5 }}>
          Aucune prédiction pour cette semaine.<br />Générez votre objectif hebdomadaire.
        </p>
        <button onClick={onGenerate} className="btn-primary" disabled={generating} style={{ width: "100%" }}>
          {generating ? "⏳ Génération..." : "⚡ Générer l'objectif"}
        </button>
      </div>
    );
  }

  const targetPct = ((weekly.targetPrice - weekly.entryPrice) / weekly.entryPrice * 100);
  const stopPct   = ((weekly.stopLoss    - weekly.entryPrice) / weekly.entryPrice * 100);

  return (
    <>
      <div className="card card-glow ft-wobj">
        {/* Header */}
        <div className="ft-wobj-header">
          <div>
            <div className="section-label">Objectif semaine</div>
            <div className="ft-wobj-week">{weekly.weekLabel}</div>
          </div>
          <StatusBadge status={weekly.status} />
        </div>

        {/* Direction + Signal */}
        <div className="ft-wobj-signal">
          <div className="ft-wobj-dir" style={{ color: dirColor, borderColor: dirColor + "33", background: dirColor + "0a" }}>
            <span className="ft-wobj-dir-icon">{dirIcon}</span>
            <span className="ft-wobj-dir-txt font-orbitron">{dirLabel}</span>
          </div>
          <div className="ft-wobj-conf">
            <span style={{ color: "var(--text-muted)", fontSize: "0.58rem" }}>Confiance</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.82rem", color: "var(--text-accent)" }}>{weekly.confidence.toFixed(0)}%</span>
          </div>
        </div>

        {/* Live P&L — the core feature */}
        <div className="ft-wobj-pnl">
          <div style={{ fontSize: "0.56rem", fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
            {weekly.status === "active" ? "P&L Live" : "P&L Final"}
          </div>
          <div className="ft-wobj-pnl-val font-mono" style={{ color: pnlColor, textShadow: livePnl !== null && livePnl > 0 ? `0 0 16px var(--bull)` : livePnl !== null && livePnl < 0 ? `0 0 16px var(--bear)` : "none" }}>
            {livePnl !== null ? `${livePnl >= 0 ? "+" : ""}${livePnl.toFixed(2)}%` : "—"}
          </div>
          {weekly.status === "active" && (
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>
              Depuis entrée @ ${fmtPrice(weekly.entryPrice)} → Actuel ${fmtPrice(currentPrice)}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {weekly.status === "active" || weekly.status === "target_hit" ? (
          <div style={{ marginBottom: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.55rem", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
              <span>Progression vers l&apos;objectif</span>
              <span style={{ color: progressPct >= 100 ? "var(--bull)" : "var(--text-accent)" }}>{progressPct.toFixed(0)}%</span>
            </div>
            <div className="progress-bar" style={{ height: 5 }}>
              <div className="progress-fill" style={{
                width: `${progressPct}%`,
                background: progressPct >= 100 ? "linear-gradient(90deg, var(--bull), #00ff88)" :
                            progressPct >= 50 ? "linear-gradient(90deg, #ffab00, var(--accent))" :
                            "linear-gradient(90deg, var(--accent-dim), var(--accent))",
              }} />
            </div>
          </div>
        ) : null}

        {/* Target / Stop */}
        <div className="ft-wobj-levels">
          <div className="ft-wobj-level" style={{ background: "var(--bull-bg)", borderColor: "var(--bull-border)" }}>
            <div style={{ fontSize: "0.5rem", fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 3 }}>OBJECTIF</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--bull)" }}>${fmtPrice(weekly.targetPrice)}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "var(--bull)", marginTop: 1 }}>{targetPct >= 0 ? "+" : ""}{targetPct.toFixed(2)}%</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: "0.52rem", fontFamily: "'Orbitron', monospace", color: "var(--text-muted)", letterSpacing: "0.1em" }}>R/R</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", fontWeight: 700, color: weekly.riskRewardRatio >= 2 ? "var(--bull)" : weekly.riskRewardRatio >= 1 ? "var(--neutral)" : "var(--bear)" }}>
              1:{weekly.riskRewardRatio.toFixed(1)}
            </div>
          </div>
          <div className="ft-wobj-level" style={{ background: "var(--bear-bg)", borderColor: "var(--bear-border)" }}>
            <div style={{ fontSize: "0.5rem", fontFamily: "'Orbitron', monospace", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", marginBottom: 3 }}>STOP LOSS</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--bear)" }}>${fmtPrice(weekly.stopLoss)}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.58rem", color: "var(--bear)", marginTop: 1 }}>{stopPct.toFixed(2)}%</div>
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", marginBottom: "0.7rem" }}>
          {[
            { label: "Fondamental", val: weekly.fundamentalScore },
            { label: "Technique",   val: weekly.technicalScore },
            { label: "Sentiment",   val: weekly.sentimentScore },
            { label: "Global",      val: weekly.globalScore },
          ].map(({ label, val }) => {
            const c  = val >= 60 ? "var(--bull)" : val <= 40 ? "var(--bear)" : "var(--neutral)";
            const gr = val >= 60 ? "#00c880,#00f0a0" : val <= 40 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.62rem", color: "var(--text-secondary)", minWidth: 68, fontWeight: 600 }}>{label}</span>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-fill" style={{ width: `${val}%`, background: `linear-gradient(90deg,${gr})` }} />
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.62rem", fontWeight: 700, color: c, minWidth: 24, textAlign: "right" }}>{val}</span>
              </div>
            );
          })}
        </div>

        {/* Reasoning */}
        {weekly.reasoning.length > 0 && (
          <div style={{ marginBottom: "0.7rem" }}>
            <div className="section-label" style={{ marginBottom: "0.35rem" }}>Facteurs</div>
            {weekly.reasoning.slice(0, 5).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: "0.3rem", fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.15rem", fontFamily: "'Rajdhani', sans-serif" }}>
                <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{r}
              </div>
            ))}
          </div>
        )}

        {/* Key events */}
        {weekly.keyEvents && weekly.keyEvents.length > 0 && (
          <div>
            <div className="section-label" style={{ marginBottom: "0.35rem" }}>Événements clés</div>
            {weekly.keyEvents.slice(0, 3).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.32rem 0.5rem", background: "var(--bg-surface)", borderRadius: 6, marginBottom: "0.2rem", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.55rem", fontWeight: 700, color: e.impact === "High" ? "var(--bear)" : "var(--neutral)", fontFamily: "'Orbitron', monospace", letterSpacing: "0.08em", minWidth: 28 }}>{e.impact === "High" ? "⚡" : "◆"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)" }}>
                    {new Date(e.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
                    {e.forecast && ` · F: ${e.forecast}`}{e.previous && ` | P: ${e.previous}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regenerate button */}
        <div style={{ marginTop: "0.85rem", paddingTop: "0.7rem", borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onGenerate} disabled={generating} className="btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: "0.62rem", fontFamily: "'Orbitron', monospace" }}>
            {generating ? "⏳ Mise à jour..." : "↻ Regénérer l'objectif"}
          </button>
        </div>
      </div>

      <style>{`
        .ft-wobj { }
        .ft-wobj-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; gap: 0.5rem; flex-wrap: wrap; }
        .ft-wobj-week { font-family: 'Rajdhani', sans-serif; font-size: 0.78rem; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
        .ft-wobj-signal { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
        .ft-wobj-dir { display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 1rem; border-radius: 8px; border: 1px solid; flex: 1; }
        .ft-wobj-dir-icon { font-size: 1.3rem; line-height: 1; }
        .ft-wobj-dir-txt { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; }
        .ft-wobj-conf { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .ft-wobj-pnl { padding: 0.85rem 1rem; background: var(--bg-surface); border-radius: 10px; border: 1px solid var(--border-subtle); margin-bottom: 0.75rem; text-align: center; }
        .ft-wobj-pnl-val { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
        .ft-wobj-levels { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem; }
        .ft-wobj-level { padding: 0.65rem 0.75rem; border-radius: 9px; border: 1px solid; text-align: center; }
        @media (max-width: 400px) { .ft-wobj-pnl-val { font-size: 1.7rem; } }
      `}</style>
    </>
  );
}
