"use client";

interface MacroIndicatorProps {
  label: string;
  value: string | number;
  unit?: string;
  explanation: string;
  signal?: "positive" | "negative" | "neutral";
  signalLabel?: string;
  impact?: string; // Impact sur les marchés
}

export default function MacroIndicator({
  label,
  value,
  unit = "",
  explanation,
  signal,
  signalLabel,
  impact,
}: MacroIndicatorProps) {
  const signalColor =
    signal === "positive" ? "var(--bull)" :
    signal === "negative" ? "var(--bear)" :
    "var(--neutral)";

  const signalBg =
    signal === "positive" ? "var(--bull-bg)" :
    signal === "negative" ? "var(--bear-bg)" :
    "var(--neutral-bg)";

  const signalIcon =
    signal === "positive" ? "▲" :
    signal === "negative" ? "▼" :
    "◆";

  return (
    <div
      style={{
        padding: "0.75rem",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
      }}
    >
      {/* Ligne principale */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 500 }}>
          {label}
        </span>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.9rem",
              fontWeight: 700,
              color: signal ? signalColor : "var(--text-primary)",
            }}
          >
            {value}{unit}
          </span>
        </div>
      </div>

      {/* Explication */}
      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "0.4rem" }}>
        {explanation}
      </div>

      {/* Signal + Impact */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        {signal && signalLabel && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: signalColor,
              background: signalBg,
              padding: "0.12rem 0.4rem",
              borderRadius: "4px",
            }}
          >
            <span>{signalIcon}</span>
            {signalLabel}
          </span>
        )}
        {impact && (
          <span style={{ fontSize: "0.56rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            {impact}
          </span>
        )}
      </div>
    </div>
  );
}
