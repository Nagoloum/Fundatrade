"use client";
import { useEffect, useState, useCallback } from "react";
import type { Theme } from "@/types";

interface HeaderProps {
  lastRefresh: Date | null;
  isLive: boolean;
  onRefresh: () => void;
  activeTab: "dashboard" | "history";
  onTabChange: (tab: "dashboard" | "history") => void;
}

export default function Header({ lastRefresh, isLive, onRefresh, activeTab, onTabChange }: HeaderProps) {
  const [theme, setTheme]           = useState<Theme>("dark");
  const [time,  setTime]            = useState("");
  const [spinning, setSpinning]     = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ft-theme") as Theme | null;
      if (saved === "light" || saved === "dark") { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
    } catch {}
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("ft-theme", next); } catch {}
  }, [theme]);

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 1200);
  }, [onRefresh]);

  const fmtTime = (d: Date | null) => d
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <>
      <header className="ft-header">
        {/* Logo */}
        <div className="ft-header-logo">
          <div className="ft-logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#020c18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
              <polyline points="16 7 22 7 22 13"/>
            </svg>
          </div>
          <div className="ft-logo-text">
            <span className="ft-logo-name">FUNDATRADE</span>
            <span className="ft-logo-sub">Analyse · BTC · XAUUSD</span>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav className="ft-nav">
          <button className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => onTabChange("dashboard")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </button>
          <button className={`nav-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => onTabChange("history")}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Historique
          </button>
        </nav>

        {/* Center info */}
        <div className="ft-header-center">
          <div className="ft-live-badge">
            <div className={isLive ? "live-dot" : "ft-dot-off"} />
            <span className="ft-live-txt">{isLive ? "LIVE" : "HORS LIGNE"}</span>
          </div>
          <div className="ft-clock">
            <span className="ft-clock-time">{time}</span>
            <span className="ft-clock-sub">MAJ: {fmtTime(lastRefresh)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="ft-header-actions">
          <button onClick={handleRefresh} className="btn-ghost ft-btn-icon" title="Rafraîchir">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: spinning ? "rotate(360deg)" : "none", transition: spinning ? "transform 0.9s linear" : "none" }}>
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button onClick={toggleTheme} className="btn-ghost ft-btn-theme" title="Thème">
            {theme === "dark"
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </header>

      <style>{`
        .ft-header {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          padding: 0 1.25rem;
          height: 56px;
          display: flex; align-items: center;
          gap: 0.75rem;
          position: sticky; top: 0; z-index: 50;
          backdrop-filter: blur(16px);
        }
        .ft-header-logo { display: flex; align-items: center; gap: 0.55rem; flex-shrink: 0; }
        .ft-logo-mark {
          width: 32px; height: 32px; min-width: 32px;
          background: var(--accent); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .ft-logo-text { display: flex; flex-direction: column; }
        .ft-logo-name {
          font-family: 'Orbitron', monospace; font-size: 0.78rem; font-weight: 800;
          color: var(--text-accent); letter-spacing: 0.05em; line-height: 1;
        }
        .ft-logo-sub { font-size: 0.48rem; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 2px; }
        .ft-nav { display: flex; align-items: stretch; height: 56px; margin-left: 0.5rem; }
        .ft-header-center { display: flex; align-items: center; gap: 1rem; flex: 1; justify-content: center; }
        .ft-live-badge { display: flex; align-items: center; gap: 0.35rem; }
        .ft-dot-off { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; }
        .ft-live-txt {
          font-family: 'Orbitron', monospace; font-size: 0.52rem; font-weight: 700;
          letter-spacing: 0.15em; color: var(--text-accent); text-transform: uppercase;
        }
        .ft-clock { display: flex; flex-direction: column; align-items: flex-end; }
        .ft-clock-time { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .ft-clock-sub  { font-family: 'JetBrains Mono', monospace; font-size: 0.52rem; color: var(--text-muted); margin-top: 2px; }
        .ft-header-actions { display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0; }
        .ft-btn-icon  { padding: 0.38rem !important; }
        .ft-btn-theme { padding: 0.38rem 0.5rem !important; }
        @media (max-width: 768px) {
          .ft-header { padding: 0 0.85rem; }
          .ft-header-center { display: none; }
          .ft-logo-sub { display: none; }
        }
        @media (max-width: 500px) {
          .ft-header { height: 50px; }
          .ft-logo-name { font-size: 0.68rem; }
          .ft-nav button { padding: 0.45rem 0.75rem; font-size: 0.55rem; }
        }
      `}</style>
    </>
  );
}
