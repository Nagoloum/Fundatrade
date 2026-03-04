"use client";

import type { SentimentData, FearGreedData } from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT PANEL — Redesign complet
// Jauge Fear & Greed demi-cercle SVG propre + barres de scores + signaux
// ═══════════════════════════════════════════════════════════════════════════

function FearGreedGauge({ data }: { data: FearGreedData }) {
  const v = data.value; // 0–100

  // Couleur selon la zone
  const color =
    v <= 20 ? "#ff4466" :
    v <= 40 ? "#ff8844" :
    v <= 60 ? "#ffa520" :
    v <= 80 ? "#88cc44" :
    "#00ff88";

  const label =
    v <= 20 ? "Peur Extrême" :
    v <= 40 ? "Peur" :
    v <= 60 ? "Neutre" :
    v <= 80 ? "Avidité" :
    "Avidité Extrême";

  // SVG demi-cercle — rayon 54, centre (60, 60)
  const R   = 54;
  const CX  = 60;
  const CY  = 60;
  // Arc de fond : de 180° à 0° (demi-cercle haut)
  // Aiguille : angle de 180° (gauche, v=0) à 0° (droite, v=100)
  const angleDeg  = 180 - (v / 100) * 180; // 180 = peur, 0 = avidité
  const angleRad  = (angleDeg * Math.PI) / 180;
  const needleX   = CX + (R - 8) * Math.cos(angleRad);
  const needleY   = CY - (R - 8) * Math.sin(angleRad);

  // Segments colorés du demi-arc (5 zones)
  const zones = [
    { start: 180, end: 144, color: "#ff4466" },  // 0–20 Peur Extrême
    { start: 144, end: 108, color: "#ff8844" },  // 20–40 Peur
    { start: 108, end:  72, color: "#ffa520" },  // 40–60 Neutre
    { start:  72, end:  36, color: "#88cc44" },  // 60–80 Avidité
    { start:  36, end:   0, color: "#00ff88" },  // 80–100 Avidité Extrême
  ];

  function arcPath(startDeg: number, endDeg: number, r: number) {
    const s = (startDeg * Math.PI) / 180;
    const e = (endDeg   * Math.PI) / 180;
    const x1 = CX + r * Math.cos(s);
    const y1 = CY - r * Math.sin(s);
    const x2 = CX + r * Math.cos(e);
    const y2 = CY - r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:"0.9rem" }}>
      <svg width="120" height="68" viewBox="0 0 120 68" style={{ overflow:"visible" }}>
        {/* Fond gris */}
        <path d={arcPath(180, 0, R)} fill="none" stroke="var(--border-subtle)" strokeWidth="10" strokeLinecap="round" />

        {/* Segments colorés */}
        {zones.map((z, i) => (
          <path
            key={i}
            d={arcPath(z.start, z.end, R)}
            fill="none"
            stroke={z.color}
            strokeWidth="10"
            strokeLinecap={i === 0 ? "round" : i === 4 ? "round" : "butt"}
            opacity="0.35"
          />
        ))}

        {/* Zone active — surbrillance */}
        <path
          d={arcPath(180, angleDeg, R)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Aiguille */}
        <line
          x1={CX} y1={CY}
          x2={needleX} y2={needleY}
          stroke="var(--text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="4" fill="var(--text-primary)" />

        {/* Valeur centrale */}
        <text x={CX} y={CY + 16} textAnchor="middle" fill={color}
          style={{ fontFamily:"monospace", fontSize:"13px", fontWeight:700 }}>
          {v}
        </text>
      </svg>

      {/* Label */}
      <div style={{ fontSize:"0.7rem", fontWeight:700, color, marginTop:"15px" }}>{label}</div>

      {/* Légende */}
      <div style={{ display:"flex", justifyContent:"space-between", width:"120px", marginTop:"3px" }}>
        <span style={{ fontSize:"0.6rem", color:"#ff4466" }}>Peur</span>
        <span style={{ fontSize:"0.6rem", color:"#00ff88" }}>Avidité</span>
      </div>

      {/* Comparaison hier */}
      {data.previousValue !== undefined && (
        <div style={{ fontSize:"0.57rem", color:"var(--text-muted)", marginTop:"4px" }}>
          Hier :{" "}
          <span style={{ fontWeight:700, color: data.previousValue > v ? "#ff4466" : "#00ff88" }}>
            {data.previousValue}
          </span>
          {" · "}{data.previousLabel}
        </div>
      )}
    </div>
  );
}

interface SentimentPanelProps {
  data: SentimentData;
  isCrypto?: boolean;
}

export default function SentimentPanel({ data, isCrypto = true }: SentimentPanelProps) {
  const overallColor =
    data.overallScore >= 65 ? "var(--bull)" :
    data.overallScore <= 35 ? "var(--bear)" : "var(--neutral)";

  const overallGrad =
    data.overallScore >= 65 ? "#00cc6a,#00ff88" :
    data.overallScore <= 35 ? "#cc2244,#ff4466" : "#cc7700,#ffa520";

  const scoreRows = [
    ...(isCrypto && data.fearGreed ? [] : []),   // F&G affiché via jauge
    { label: "Score global",  val: data.overallScore  },
    { label: "Analyse NLP",   val: data.newsScore     },
    ...(isCrypto && data.cryptoPanicScore
      ? [{ label: "CryptoPanic", val: data.cryptoPanicScore }]
      : []),
  ];

  return (
    <div className="card" style={{ padding:"1rem 1.1rem" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
        <div>
          <div className="section-label">Sentiment de marché</div>
          <div style={{ fontSize:"0.65rem", color:"var(--text-muted)", marginTop:"2px" }}>
            {isCrypto ? "Fear & Greed · CryptoPanic · NLP" : "Analyse NLP · Actualités"}
          </div>
        </div>
        {/* Score global compact */}
        <div style={{
          display:"flex", flexDirection:"column", alignItems:"center",
          padding:"0.3rem 0.6rem", borderRadius:"8px",
          border:`1px solid ${overallColor}44`, background:`${overallColor}0a`,
        }}>
          <span style={{ fontFamily:"monospace", fontSize:"1.15rem", fontWeight:700, color:overallColor, lineHeight:1 }}>
            {data.overallScore}
          </span>
          <span style={{ fontSize:"0.5rem", color:"var(--text-muted)", marginTop:"1px" }}>/100</span>
        </div>
      </div>

      {/* Jauge Fear & Greed */}
      {isCrypto && data.fearGreed && <FearGreedGauge data={data.fearGreed} />}

      {/* Barres de scores */}
      <div style={{ display:"flex", flexDirection:"column", gap:"0.32rem", marginBottom:"0.7rem" }}>
        {scoreRows.map(({ label, val }) => {
          const c  = val >= 60 ? "var(--bull)" : val <= 40 ? "var(--bear)" : "var(--neutral)";
          const gr = val >= 60 ? "#00cc6a,#00ff88" : val <= 40 ? "#cc2244,#ff4466" : "#cc7700,#ffa520";
          return (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}>
              <span style={{ fontSize:"0.58rem", color:"var(--text-secondary)", minWidth:"78px", flexShrink:0 }}>{label}</span>
              <div className="progress-bar" style={{ flex:1 }}>
                <div className="progress-fill" style={{ width:`${val}%`, background:`linear-gradient(90deg,${gr})` }} />
              </div>
              <span style={{ fontFamily:"monospace", fontSize:"0.6rem", fontWeight:700, color:c, minWidth:"22px", textAlign:"right" }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* Label global */}
      <div style={{
        display:"flex", alignItems:"center", gap:"0.6rem",
        padding:"0.5rem 0.7rem", marginBottom:"0.65rem",
        background:"var(--bg-surface)", border:"1px solid var(--border-subtle)", borderRadius:"9px",
      }}>
        <div className="progress-bar" style={{ flex:1 }}>
          <div className="progress-fill" style={{ width:`${data.overallScore}%`, background:`linear-gradient(90deg,${overallGrad})` }} />
        </div>
        <span style={{ fontSize:"0.7rem", fontWeight:700, color:overallColor, whiteSpace:"nowrap" }}>
          {data.overallLabel}
        </span>
      </div>

      {/* Signaux */}
      {data.signals.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"0.22rem" }}>
          {data.signals.map((s, i) => (
            <div key={i} style={{ display:"flex", gap:"0.3rem", fontSize:"0.6rem", color:"var(--text-secondary)", lineHeight:1.4 }}>
              <span style={{ color:"var(--text-accent)", flexShrink:0 }}>›</span>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
