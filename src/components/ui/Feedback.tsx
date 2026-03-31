"use client";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.7rem 1.1rem", background: "var(--bear-bg)", border: "1px solid var(--bear-border)", borderRadius: 9, marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
        <span style={{ fontSize: "0.9rem" }}>⚠️</span>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", color: "var(--bear)", fontWeight: 600 }}>{message}</span>
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{ padding: "0.28rem 0.75rem", background: "var(--bear-bg)", border: "1px solid var(--bear)", borderRadius: 5, color: "var(--bear)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          Réessayer
        </button>
      )}
    </div>
  );
}

function SkeletonBlock({ height = 60, radius = 9 }: { height?: number; radius?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: radius }} />;
}

export function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: "1rem", marginTop: "0.85rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <SkeletonBlock height={44} /> <SkeletonBlock height={55} /> <SkeletonBlock height={36} />
        </div>
        <div className="card"><SkeletonBlock height={190} /></div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <SkeletonBlock height={14} radius={4} />
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={42} />)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {[220, 260, 180, 200].map((h, i) => <div key={i} className="card"><SkeletonBlock height={h} /></div>)}
      </div>
    </div>
  );
}
