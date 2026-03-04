"use client";
import type { MultiTimeframeSignal } from "@/types";

interface MultiTFPanelProps {
  data: MultiTimeframeSignal;
}

const DIR_COLOR: Record<string, string> = {
  BULLISH: "var(--bull)",
  BEARISH: "var(--bear)",
  NEUTRAL: "var(--neutral)",
};

const DIR_ICON: Record<string, string> = {
  BULLISH: "▲", BEARISH: "▼", NEUTRAL: "◆",
};

const ALIGN_LABEL: Record<string, { label: string; color: string }> = {
  strong_bull: { label: "Alignement HAUSSIER FORT",  color: "var(--bull)"    },
  strong_bear: { label: "Alignement BAISSIER FORT",  color: "var(--bear)"    },
  mixed_bull:  { label: "Tendance HAUSSIÈRE MODÉRÉE", color: "#88cc44"        },
  mixed_bear:  { label: "Tendance BAISSIÈRE MODÉRÉE", color: "#ff8844"        },
  neutral:     { label: "Divergence — Signal mixte",  color: "var(--neutral)" },
};

export default function MultiTFPanel({ data }: MultiTFPanelProps) {
  const align = ALIGN_LABEL[data.alignment] ?? ALIGN_LABEL.neutral;

  const tfs = [
    { label: "4H",   dir: data["4H"], desc: "Court terme" },
    { label: "1 Jour", dir: data["1J"], desc: "Moyen terme" },
    { label: "1 Sem.", dir: data["1W"], desc: "Long terme" },
  ];

  const scoreColor =
    data.alignmentScore >= 70 ? "var(--bull)" :
    data.alignmentScore <= 30 ? "var(--bear)" : "var(--neutral)";

  return (
    <>
      <div className="card">
        <div className="section-label">Confluence multi-timeframe</div>
        <div className="ft-mtf-subtitle">Alignement des 3 horizons temporels</div>

        {/* Les 3 timeframes */}
        <div className="ft-mtf-tfs">
          {tfs.map(({ label, dir, desc }) => (
            <div key={label} className="ft-mtf-tf" style={{ borderColor: DIR_COLOR[dir] + "33" }}>
              <div className="ft-mtf-tf-name">{label}</div>
              <div className="ft-mtf-tf-dir" style={{ color: DIR_COLOR[dir] }}>
                {DIR_ICON[dir]}
              </div>
              <div className="ft-mtf-tf-label" style={{ color: DIR_COLOR[dir] }}>{dir}</div>
              <div className="ft-mtf-tf-desc">{desc}</div>
            </div>
          ))}
        </div>

        {/* Résultat de la confluence */}
        <div className="ft-mtf-result" style={{ borderColor: align.color + "33", background: align.color + "08" }}>
          <div className="ft-mtf-result-label" style={{ color: align.color }}>{align.label}</div>
          <div className="ft-mtf-result-score-row">
            <span className="ft-mtf-result-hint">Score d'alignement</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{
                width: `${data.alignmentScore}%`,
                background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
              }} />
            </div>
            <span style={{ fontFamily: "var(--font-mono),monospace", fontSize: "0.65rem", fontWeight: 700, color: scoreColor, minWidth: "28px" }}>
              {data.alignmentScore}
            </span>
          </div>
        </div>

        <div className="ft-mtf-note">
          Un alignement fort des 3 timeframes augmente significativement la fiabilité du signal.
          Éviter de trader contre la tendance long terme (1W).
        </div>
      </div>

      <style>{`
        .ft-mtf-subtitle { font-size: 0.65rem; color: var(--text-muted); margin-bottom: 0.8rem; }
        .ft-mtf-tfs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.7rem; }
        .ft-mtf-tf {
          display: flex; flex-direction: column; align-items: center;
          padding: 0.65rem 0.4rem; border-radius: 10px;
          border: 1px solid; background: var(--bg-surface);
          gap: 2px;
        }
        .ft-mtf-tf-name { font-size: 0.62rem; color: var(--text-muted); font-weight: 700; }
        .ft-mtf-tf-dir { font-size: 1.1rem; line-height: 1; }
        .ft-mtf-tf-label { font-size: 0.55rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        .ft-mtf-tf-desc { font-size: 0.5rem; color: var(--text-muted); }
        .ft-mtf-result {
          padding: 0.65rem 0.8rem; border-radius: 10px; border: 1px solid;
          margin-bottom: 0.6rem;
        }
        .ft-mtf-result-label { font-size: 0.7rem; font-weight: 700; margin-bottom: 0.4rem; }
        .ft-mtf-result-score-row { display: flex; align-items: center; gap: 0.5rem; }
        .ft-mtf-result-hint { font-size: 0.58rem; color: var(--text-muted); white-space: nowrap; }
        .ft-mtf-note { font-size: 0.57rem; color: var(--text-muted); line-height: 1.45; }
      `}</style>
    </>
  );
}
