"use client";
import type { MacroData } from "@/types";

function MacroRow({ label, value, explanation, signal, signalLabel }: {
  label: string; value: string; explanation: string;
  signal?: "positive" | "negative" | "neutral"; signalLabel?: string;
}) {
  const c = signal === "positive" ? "var(--bull)" : signal === "negative" ? "var(--bear)" : "var(--neutral)";
  const bg = signal === "positive" ? "var(--bull-bg)" : signal === "negative" ? "var(--bear-bg)" : "var(--neutral-bg)";
  const brd = signal === "positive" ? "var(--bull-border)" : signal === "negative" ? "var(--bear-border)" : "var(--neutral-border)";
  const icon = signal === "positive" ? "▲" : signal === "negative" ? "▼" : "◆";
  return (
    <div style={{ padding: "0.65rem 0.75rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9, transition: "border-color 0.18s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.88rem", fontWeight: 700, color: signal ? c : "var(--text-primary)" }}>{value}</span>
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "var(--text-muted)", lineHeight: 1.45, marginBottom: 5 }}>{explanation}</div>
      {signal && signalLabel && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontFamily: "'Orbitron', monospace", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: c, background: bg, padding: "0.1rem 0.38rem", borderRadius: 4, border: `1px solid ${brd}` }}>
          {icon} {signalLabel}
        </span>
      )}
    </div>
  );
}

export default function MacroPanel({ data }: { data: MacroData }) {
  const fedSig = data.fedRate < 3 ? "positive" : data.fedRate > 5 ? "negative" : "neutral" as const;
  const cpiSig = data.inflation > 4 ? "negative" : data.inflation < 2 ? "positive" : "neutral" as const;
  const dxySig = data.dxy && data.dxy > 105 ? "negative" : data.dxy && data.dxy < 98 ? "positive" : "neutral" as const;
  const m2Sig: "positive" | "neutral" = data.m2Supply && data.m2Supply > 21000 ? "positive" : "neutral";

  let macroScore = 50;
  if (fedSig === "positive") macroScore += 15; if (fedSig === "negative") macroScore -= 15;
  if (cpiSig === "negative") macroScore -= 10; if (cpiSig === "positive") macroScore += 10;
  if (dxySig === "positive") macroScore += 10; if (dxySig === "negative") macroScore -= 10;
  if (m2Sig === "positive")  macroScore += 5;
  macroScore = Math.max(0, Math.min(100, macroScore));

  const msColor = macroScore >= 65 ? "var(--bull)" : macroScore <= 40 ? "var(--bear)" : "var(--neutral)";
  const msGr    = macroScore >= 65 ? "#00c880,#00f0a0" : macroScore <= 40 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";
  const msLabel = macroScore >= 65 ? "Environnement favorable" : macroScore <= 40 ? "Environnement défavorable" : "Environnement mitigé";

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
        <div>
          <div className="section-label">Macro-économie</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>Données FRED</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>Score macro</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.4rem", fontWeight: 700, color: msColor, lineHeight: 1 }}>{macroScore}</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.55rem", color: msColor, marginTop: 2, fontWeight: 600 }}>{msLabel}</div>
        </div>
      </div>
      <div className="progress-bar" style={{ marginBottom: "0.85rem" }}>
        <div className="progress-fill" style={{ width: `${macroScore}%`, background: `linear-gradient(90deg,${msGr})` }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <MacroRow label="Taux directeur Fed" value={`${data.fedRate.toFixed(2)}%`}
          explanation="Taux cible de la Fed. Bas = risque favorable ; Élevé = pression sur les actifs."
          signal={fedSig}
          signalLabel={data.fedRate < 3 ? "Accommodant" : data.fedRate > 5 ? "Restrictif" : "Neutre"} />
        <MacroRow label="Inflation CPI" value={`${data.inflation.toFixed(1)}`}
          explanation="Indice des prix à la consommation. Cible Fed : 2%. Au-dessus = hausse des taux."
          signal={cpiSig}
          signalLabel={data.inflation > 4 ? "Élevée" : data.inflation < 2 ? "Faible" : "Dans la cible"} />
        {data.dxy !== undefined && data.dxy > 0 && (
          <MacroRow label="Dollar Index DXY" value={data.dxy.toFixed(2)}
            explanation="Force du dollar US. DXY fort = pression baissière sur or/crypto. DXY faible = haussier."
            signal={dxySig}
            signalLabel={data.dxy > 105 ? "Dollar fort" : data.dxy < 98 ? "Dollar faible" : "Neutre"} />
        )}
        {data.m2Supply !== undefined && data.m2Supply > 0 && (
          <MacroRow label="M2 Masse monétaire" value={`${(data.m2Supply / 1000).toFixed(1)}T$`}
            explanation="Monnaie en circulation + dépôts court terme. M2 croissante = liquidités abondantes."
            signal={m2Sig}
            signalLabel={data.m2Supply > 21000 ? "Masse élevée" : "Normale"} />
        )}
        {data.yieldCurve !== undefined && (
          <MacroRow label="Courbe taux (10Y-2Y)" value={`${data.yieldCurve >= 0 ? "+" : ""}${data.yieldCurve.toFixed(2)}%`}
            explanation="Spread obligations. Négatif = courbe inversée = signal historique de récession."
            signal={data.yieldCurve >= 0 ? "positive" : "negative"}
            signalLabel={data.yieldCurve >= 0 ? "Normale" : "Inversée ⚠"} />
        )}
      </div>
      <div style={{ marginTop: "0.65rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)", textAlign: "right" }}>
        Source : FRED · Federal Reserve Bank of St. Louis
      </div>
    </div>
  );
}
