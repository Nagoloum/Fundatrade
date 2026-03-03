"use client";

import type { MacroData } from "@/types";
import MacroIndicator from "./MacroIndicator";

interface MacroPanelProps {
  data: MacroData;
}

export default function MacroPanel({ data }: MacroPanelProps) {
  // ── Signals Fed Rate ────────────────────────────────────────────────────
  const fedSignal =
    data.fedRate < 3 ? "positive" :
    data.fedRate > 5 ? "negative" :
    "neutral";
  const fedLabel =
    data.fedRate < 3 ? "Politique accommodante" :
    data.fedRate > 5 ? "Politique restrictive" :
    "Politique neutre";
  const fedImpact =
    data.fedRate < 3 ? "→ Favorable aux cryptos et à l'or" :
    data.fedRate > 5 ? "→ Pression baissière sur les actifs risqués" :
    "→ Impact limité sur les marchés";

  // ── Signals CPI Inflation ───────────────────────────────────────────────
  const cpiSignal =
    data.inflation > 4 ? "negative" :
    data.inflation < 2 ? "positive" :
    "neutral";
  const cpiLabel =
    data.inflation > 4 ? "Inflation élevée" :
    data.inflation < 2 ? "Inflation faible" :
    "Inflation dans la cible";
  const cpiImpact =
    data.inflation > 4 ? "→ Haussier pour l'or, bearish pour les obligations" :
    data.inflation < 2 ? "→ La Fed peut baisser les taux" :
    "→ Environnement stable";

  // ── Signals DXY ────────────────────────────────────────────────────────
  const dxySignal =
    data.dxy && data.dxy > 105 ? "negative" :
    data.dxy && data.dxy < 98  ? "positive" :
    "neutral";
  const dxyLabel =
    data.dxy && data.dxy > 105 ? "Dollar très fort" :
    data.dxy && data.dxy < 98  ? "Dollar faible" :
    "Dollar neutre";
  const dxyImpact =
    data.dxy && data.dxy > 105 ? "→ Baissier pour l'or et les cryptos" :
    data.dxy && data.dxy < 98  ? "→ Haussier pour l'or et les cryptos" :
    "→ Impact modéré";

  // ── Signals M2 ─────────────────────────────────────────────────────────
  const m2Signal: "positive" | "negative" | "neutral" =
    data.m2Supply && data.m2Supply > 21000 ? "positive" :
    "neutral";
  const m2Label =
    data.m2Supply && data.m2Supply > 21000 ? "Masse monétaire élevée" :
    "Masse monétaire normale";
  const m2Impact =
    data.m2Supply && data.m2Supply > 21000
      ? "→ Liquidités abondantes, haussier pour les actifs"
      : "→ Liquidités dans la normale";

  // ── Score macro global ──────────────────────────────────────────────────
  let macroScore = 50;
  if (fedSignal === "positive")  macroScore += 15;
  if (fedSignal === "negative")  macroScore -= 15;
  if (cpiSignal === "positive")  macroScore += 10;
  if (cpiSignal === "negative")  macroScore -= 10;
  if (dxySignal === "positive")  macroScore += 10;
  if (dxySignal === "negative")  macroScore -= 10;
  if (m2Signal === "positive")   macroScore += 5;
  macroScore = Math.max(0, Math.min(100, macroScore));

  const macroColor =
    macroScore >= 65 ? "var(--bull)" :
    macroScore <= 40 ? "var(--bear)" :
    "var(--neutral)";
  const macroLabel =
    macroScore >= 65 ? "Environnement favorable" :
    macroScore <= 40 ? "Environnement défavorable" :
    "Environnement mitigé";

  return (
    <div className="card">
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div className="section-label">Macro-économie</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Données FRED & marchés
          </div>
        </div>

        {/* Score macro */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Score macro
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "1.4rem",
              fontWeight: 700,
              color: macroColor,
              lineHeight: 1,
            }}
          >
            {macroScore}
          </div>
          <div style={{ fontSize: "0.55rem", color: macroColor, marginTop: "2px" }}>
            {macroLabel}
          </div>
        </div>
      </div>

      {/* Barre de score */}
      <div className="progress-bar" style={{ marginBottom: "1rem" }}>
        <div
          className="progress-fill"
          style={{
            width: `${macroScore}%`,
            background: `linear-gradient(90deg, ${macroScore >= 65 ? "#00cc6a, #00ff88" : macroScore <= 40 ? "#cc2244, #ff4466" : "#cc7700, #ffa520"})`,
          }}
        />
      </div>

      {/* Indicateurs */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <MacroIndicator
          label="Taux directeur Fed (FEDFUNDS)"
          value={data.fedRate.toFixed(2)}
          unit="%"
          explanation="Le taux d'intérêt cible de la Fed. Des taux bas favorisent la prise de risque et gonflent les valorisations d'actifs."
          signal={fedSignal}
          signalLabel={fedLabel}
          impact={fedImpact}
        />

        <MacroIndicator
          label="Inflation CPI (CPIAUCSL)"
          value={data.inflation.toFixed(1)}
          unit=""
          explanation="Indice des prix à la consommation. Mesure la hausse générale des prix. La cible de la Fed est 2%. Au-dessus, la Fed monte les taux."
          signal={cpiSignal}
          signalLabel={cpiLabel}
          impact={cpiImpact}
        />

        {data.dxy !== undefined && data.dxy > 0 && (
          <MacroIndicator
            label="Dollar Index (DXY)"
            value={data.dxy.toFixed(2)}
            unit=""
            explanation="Force relative du dollar US contre un panier de devises. Un DXY fort pèse sur l'or et les cryptos libellés en dollars."
            signal={dxySignal}
            signalLabel={dxyLabel}
            impact={dxyImpact}
          />
        )}

        {data.m2Supply !== undefined && data.m2Supply > 0 && (
          <MacroIndicator
            label="M2 (Masse monétaire, Mds $)"
            value={(data.m2Supply / 1000).toFixed(1)}
            unit="T$"
            explanation="Total de la monnaie en circulation + dépôts à court terme. Une M2 croissante injecte des liquidités dans le système."
            signal={m2Signal}
            signalLabel={m2Label}
            impact={m2Impact}
          />
        )}

        {data.yieldCurve !== undefined && (
          <MacroIndicator
            label="Courbe des taux (10Y - 2Y)"
            value={data.yieldCurve >= 0 ? `+${data.yieldCurve.toFixed(2)}` : data.yieldCurve.toFixed(2)}
            unit="%"
            explanation="Spread entre obligations 10 ans et 2 ans. Négatif = courbe inversée = signal de récession historique."
            signal={data.yieldCurve >= 0 ? "positive" : "negative"}
            signalLabel={data.yieldCurve >= 0 ? "Courbe normale" : "Courbe inversée ⚠️"}
            impact={data.yieldCurve < 0 ? "→ Signal de récession potentielle" : "→ Croissance économique attendue"}
          />
        )}
      </div>

      {/* Note source */}
      <div
        style={{
          marginTop: "0.75rem",
          fontSize: "0.56rem",
          color: "var(--text-muted)",
          textAlign: "right",
        }}
      >
        Source : FRED (Federal Reserve Bank of St. Louis)
      </div>
    </div>
  );
}
