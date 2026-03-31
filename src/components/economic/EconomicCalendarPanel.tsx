"use client";
import type { EconomicEvent } from "@/types";

const IMPACT_CFG = {
  High:   { color: "var(--bear)",    bg: "var(--bear-bg)",    label: "HIGH",   icon: "⚡" },
  Medium: { color: "var(--neutral)", bg: "var(--neutral-bg)", label: "MEDIUM", icon: "◆" },
  Low:    { color: "var(--text-muted)", bg: "transparent",    label: "LOW",    icon: "·" },
};

export default function EconomicCalendarPanel({ events, weekLabel }: { events: EconomicEvent[]; weekLabel: string }) {
  if (!events || events.length === 0) return (
    <div className="card">
      <div className="section-label">Calendrier économique</div>
      <div style={{ padding: "1rem 0", textAlign: "center", color: "var(--text-muted)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.78rem" }}>
        Aucun événement haute importance cette semaine
      </div>
    </div>
  );

  const highCount = events.filter(e => e.impact === "High").length;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <div className="section-label">Calendrier économique</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)", marginTop: 2 }}>{weekLabel}</div>
        </div>
        {highCount > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.18rem 0.5rem", borderRadius: 4, background: "var(--bear-bg)", border: "1px solid var(--bear-border)", fontFamily: "'Orbitron', monospace", fontSize: "0.52rem", fontWeight: 700, color: "var(--bear)", letterSpacing: "0.08em" }}>
            ⚡ {highCount} HIGH
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {events.map((e, i) => {
          const cfg = IMPACT_CFG[e.impact] || IMPACT_CFG.Low;
          const eventDate = new Date(e.date);
          const dayLabel  = eventDate.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
          const timeLabel = eventDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.6rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 7, borderLeft: `3px solid ${cfg.color}` }}>
              <div style={{ minWidth: 18, textAlign: "center", fontSize: "0.72rem" }}>{cfg.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: 2 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)" }}>{dayLabel} {timeLabel}</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.46rem", fontWeight: 700, letterSpacing: "0.08em", color: cfg.color, background: cfg.bg, padding: "0.08rem 0.3rem", borderRadius: 3 }}>{cfg.label}</span>
                  {e.country && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.48rem", color: "var(--text-muted)" }}>{e.country}</span>}
                </div>
              </div>
              {(e.forecast || e.previous) && (
                <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
                  {e.actual && <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.42rem", color: "var(--text-muted)", marginBottom: 1 }}>ACT</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 700, color: "var(--text-accent)" }}>{e.actual}</div></div>}
                  {e.forecast && <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.42rem", color: "var(--text-muted)", marginBottom: 1 }}>F</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 600, color: "var(--text-secondary)" }}>{e.forecast}</div></div>}
                  {e.previous && <div style={{ textAlign: "center" }}><div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.42rem", color: "var(--text-muted)", marginBottom: 1 }}>P</div><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "var(--text-muted)" }}>{e.previous}</div></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
