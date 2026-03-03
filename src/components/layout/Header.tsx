"use client";

import { useEffect, useState, useCallback } from "react";
import type { Theme } from "@/types";

interface HeaderProps {
  lastRefresh: Date | null;
  isLive: boolean;
  onRefresh: () => void;
}

export default function Header({ lastRefresh, isLive, onRefresh }: HeaderProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Init thème depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fundatrade-theme") as Theme | null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    } catch {}
  }, []);

  // Horloge temps réel
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Europe/Paris",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("fundatrade-theme", next); } catch {}
  }, [theme]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  }, [onRefresh]);

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return "—";
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo & titre */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "var(--accent)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#050a0e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <div>
          <h1
            style={{
              fontSize: "1.1rem",
              fontWeight: "800",
              color: "var(--text-accent)",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              fontFamily: "var(--font-syne), sans-serif",
            }}
          >
            FUNDATRADE
          </h1>
          <p
            style={{
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: "1px",
            }}
          >
            Analyse fondamentale & technique
          </p>
        </div>
      </div>

      {/* Centre — statut live + heure */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {/* Indicateur LIVE */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div className={isLive ? "live-dot" : undefined}
            style={!isLive ? {
              width: "7px",
              height: "7px",
              background: "var(--text-muted)",
              borderRadius: "50%",
            } : undefined}
          />
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: "700",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: isLive ? "var(--text-accent)" : "var(--text-muted)",
              fontFamily: "var(--font-mono), monospace",
            }}
          >
            {isLive ? "LIVE" : "HORS LIGNE"}
          </span>
        </div>

        {/* Horloge */}
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.7rem",
            color: "var(--text-secondary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{currentTime}</span>
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
            MAJ : {formatLastUpdate(lastRefresh)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {/* Bouton refresh manuel */}
        <button
          onClick={handleRefresh}
          className="btn-ghost"
          title="Rafraîchir les données"
          style={{ padding: "0.4rem 0.6rem" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isRefreshing ? "rotate(360deg)" : "rotate(0deg)",
              transition: isRefreshing ? "transform 0.8s linear" : "none",
            }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>

        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          className="btn-ghost"
          title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          style={{
            padding: "0.4rem 0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {theme === "dark" ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span style={{ fontSize: "0.72rem" }}>Clair</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span style={{ fontSize: "0.72rem" }}>Sombre</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
