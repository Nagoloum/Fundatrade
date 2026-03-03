"use client";

import { useEffect, useState, useCallback } from "react";
import type { Theme } from "@/types";

interface HeaderProps {
  lastRefresh: Date | null;
  isLive: boolean;
  onRefresh: () => void;
}

export default function Header({ lastRefresh, isLive, onRefresh }: HeaderProps) {
  const [theme, setTheme]             = useState<Theme>("dark");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fundatrade-theme") as Theme | null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const tick = () =>
      setCurrentTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("fundatrade-theme", next); } catch {}
  }, [theme]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  }, [onRefresh]);

  const formatUpdate = (d: Date | null) =>
    d ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";

  return (
    <>
      <header className="ft-header">
        <div className="ft-header-logo">
          <div className="ft-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#050a0e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <div className="ft-logo-title">FUNDATRADE</div>
            <div className="ft-logo-sub">Analyse fondamentale & technique</div>
          </div>
        </div>

        <div className="ft-header-center">
          <div className="ft-live-badge">
            <div className={isLive ? "live-dot" : "ft-dot-offline"} />
            <span className="ft-live-label">{isLive ? "LIVE" : "HORS LIGNE"}</span>
          </div>
          <div className="ft-clock">
            <span className="ft-clock-time">{currentTime}</span>
            <span className="ft-clock-update">MAJ : {formatUpdate(lastRefresh)}</span>
          </div>
        </div>

        <div className="ft-header-actions">
          <button onClick={handleRefresh} className="btn-ghost ft-btn-icon" title="Rafraichir">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isRefreshing ? "rotate(360deg)" : "none", transition: isRefreshing ? "transform 0.8s linear" : "none" }}>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button onClick={toggleTheme} className="btn-ghost ft-btn-theme" title="Changer le theme">
            {theme === "dark" ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            <span className="ft-btn-theme-label">{theme === "dark" ? "Clair" : "Sombre"}</span>
          </button>
        </div>
      </header>

      <style>{`
        .ft-header {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          padding: 0.65rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(12px);
        }
        .ft-header-logo { display: flex; align-items: center; gap: 0.6rem; flex-shrink: 0; }
        .ft-logo-icon {
          width: 30px; height: 30px; min-width: 30px;
          background: var(--accent); border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .ft-logo-title {
          font-size: 1rem; font-weight: 800; color: var(--text-accent);
          letter-spacing: -0.02em; line-height: 1;
          font-family: var(--font-syne), sans-serif;
        }
        .ft-logo-sub { font-size: 0.55rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; }
        .ft-header-center { display: flex; align-items: center; gap: 1rem; flex: 1; justify-content: center; }
        .ft-live-badge { display: flex; align-items: center; gap: 0.35rem; }
        .ft-dot-offline { width: 7px; height: 7px; background: var(--text-muted); border-radius: 50%; }
        .ft-live-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-accent); font-family: var(--font-mono), monospace; }
        .ft-clock { display: flex; flex-direction: column; align-items: flex-end; font-family: var(--font-mono), monospace; }
        .ft-clock-time { font-size: 0.72rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
        .ft-clock-update { font-size: 0.56rem; color: var(--text-muted); margin-top: 1px; }
        .ft-header-actions { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
        .ft-btn-icon { padding: 0.4rem !important; }
        .ft-btn-theme { display: flex; align-items: center; gap: 0.35rem; padding: 0.38rem 0.7rem !important; }
        .ft-btn-theme-label { font-size: 0.7rem; }
        @media (max-width: 768px) {
          .ft-header { padding: 0.6rem 0.9rem; }
          .ft-header-center { display: none; }
          .ft-logo-sub { display: none; }
        }
        @media (max-width: 480px) {
          .ft-header { padding: 0.5rem 0.7rem; gap: 0.4rem; }
          .ft-logo-title { font-size: 0.85rem; }
          .ft-btn-theme-label { display: none; }
          .ft-btn-theme { padding: 0.38rem 0.45rem !important; }
        }
      `}</style>
    </>
  );
}
