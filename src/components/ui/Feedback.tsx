"use client";

// ─── ErrorBanner ─────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "0.75rem 1.25rem",
        background: "var(--bear-bg)",
        border: "1px solid rgba(255,68,102,0.3)",
        borderRadius: "10px",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1rem" }}>⚠️</span>
        <span style={{ fontSize: "0.75rem", color: "var(--bear)", fontWeight: 500 }}>
          {message}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "0.3rem 0.8rem",
            background: "var(--bear-bg)",
            border: "1px solid var(--bear)",
            borderRadius: "6px",
            color: "var(--bear)",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-syne), sans-serif",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────────

function SkeletonBlock({ height = 60, borderRadius = 10 }: { height?: number; borderRadius?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height: `${height}px`, borderRadius: `${borderRadius}px` }}
    />
  );
}

export function LoadingSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1rem",
        marginTop: "1rem",
        animation: "fade-in 0.3s ease",
      }}
    >
      {/* Layout principal */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "1.25rem",
        }}
      >
        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* PriceCard skeleton */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <SkeletonBlock height={40} />
            </div>
            <SkeletonBlock height={50} />
            <SkeletonBlock height={36} />
          </div>

          {/* Chart skeleton */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
            }}
          >
            <SkeletonBlock height={16} borderRadius={4} />
            <div style={{ marginTop: "0.75rem" }}>
              <SkeletonBlock height={200} />
            </div>
          </div>

          {/* Fundamental skeleton */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "1.25rem 1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
            }}
          >
            <SkeletonBlock height={16} borderRadius={4} />
            {[...Array(4)].map((_, i) => (
              <SkeletonBlock key={i} height={44} />
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[200, 280, 180, 220].map((h, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "1.25rem 1.5rem",
              }}
            >
              <SkeletonBlock height={h} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LiveIndicator inline ─────────────────────────────────────────────────────

export function LiveIndicator({ label = "LIVE" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
      <div className="live-dot" />
      <span
        style={{
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--text-accent)",
          fontFamily: "var(--font-mono), monospace",
        }}
      >
        {label}
      </span>
    </div>
  );
}
