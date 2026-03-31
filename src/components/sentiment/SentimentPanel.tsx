"use client";
import type { SentimentData, FearGreedData } from "@/types";

function FearGreedGauge({ data }: { data: FearGreedData }) {
  const v = data.value;
  const color = v <= 20 ? "#ff3d6b" : v <= 40 ? "#ff8844" : v <= 60 ? "#ffab00" : v <= 80 ? "#88cc44" : "#00f0a0";
  const label = v <= 20 ? "Peur Extrême" : v <= 40 ? "Peur" : v <= 60 ? "Neutre" : v <= 80 ? "Avidité" : "Avidité Extrême";
  const R = 52, CX = 60, CY = 60;
  const angleDeg = 180 - (v / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX = CX + (R - 10) * Math.cos(angleRad);
  const needleY = CY - (R - 10) * Math.sin(angleRad);
  const zones = [
    { s: 180, e: 144, c: "#ff3d6b" }, { s: 144, e: 108, c: "#ff8844" },
    { s: 108, e: 72,  c: "#ffab00" }, { s: 72,  e: 36,  c: "#88cc44" },
    { s: 36,  e: 0,   c: "#00f0a0" },
  ];
  const arc = (s: number, e: number, r: number) => {
    const toR = (d: number) => (d * Math.PI) / 180;
    const x1 = CX + r * Math.cos(toR(s)), y1 = CY - r * Math.sin(toR(s));
    const x2 = CX + r * Math.cos(toR(e)), y2 = CY - r * Math.sin(toR(e));
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "0.8rem" }}>
      <svg width="120" height="70" viewBox="0 0 120 70" style={{ overflow: "visible" }}>
        <path d={arc(180, 0, R)} fill="none" stroke="var(--border-subtle)" strokeWidth="10" strokeLinecap="round" />
        {zones.map((z, i) => <path key={i} d={arc(z.s, z.e, R)} fill="none" stroke={z.c} strokeWidth="10" strokeLinecap={i === 0 || i === 4 ? "round" : "butt"} opacity="0.3" />)}
        <path d={arc(180, angleDeg, R)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" opacity="0.9" />
        <line x1={CX} y1={CY} x2={needleX} y2={needleY} stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="4" fill="var(--text-primary)" />
        <text x={CX} y={CY + 18} textAnchor="middle" fill={color} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", fontWeight: 700 }}>{v}</text>
      </svg>
      <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.62rem", fontWeight: 700, color, marginTop: 16 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", width: 120, marginTop: 3 }}>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "#ff3d6b", fontWeight: 600 }}>Peur</span>
        <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.58rem", color: "#00f0a0", fontWeight: 600 }}>Avidité</span>
      </div>
      {data.previousValue !== undefined && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)", marginTop: 4 }}>
          Hier : <span style={{ fontWeight: 700, color: data.previousValue > v ? "#ff3d6b" : "#00f0a0" }}>{data.previousValue}</span> · {data.previousLabel}
        </div>
      )}
    </div>
  );
}

export default function SentimentPanel({ data, isCrypto = true }: { data: SentimentData; isCrypto?: boolean }) {
  const oc = data.overallScore >= 65 ? "var(--bull)" : data.overallScore <= 35 ? "var(--bear)" : "var(--neutral)";
  const og = data.overallScore >= 65 ? "#00c880,#00f0a0" : data.overallScore <= 35 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";
  const sc = (v: number) => v >= 60 ? "var(--bull)" : v <= 40 ? "var(--bear)" : "var(--neutral)";
  const gr = (v: number) => v >= 60 ? "#00c880,#00f0a0" : v <= 40 ? "#cc2244,#ff3d6b" : "#cc7700,#ffab00";

  const scores = [
    { label: "Score global", val: data.overallScore },
    { label: "NLP News",     val: data.newsScore },
    ...(isCrypto && data.cryptoPanicScore ? [{ label: "CryptoPanic", val: data.cryptoPanicScore }] : []),
  ];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <div className="section-label">Sentiment de marché</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 2 }}>
            {isCrypto ? "Fear & Greed · CryptoPanic · NLP" : "NLP Actualités"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.28rem 0.6rem", borderRadius: 7, border: `1px solid ${oc}44`, background: `${oc}08` }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.1rem", fontWeight: 700, color: oc, lineHeight: 1 }}>{data.overallScore}</span>
          <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.42rem", color: "var(--text-muted)", marginTop: 1 }}>/100</span>
        </div>
      </div>

      {isCrypto && data.fearGreed && <FearGreedGauge data={data.fearGreed} />}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.28rem", marginBottom: "0.6rem" }}>
        {scores.map(({ label, val }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.6rem", color: "var(--text-secondary)", minWidth: 72, fontWeight: 600 }}>{label}</span>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${val}%`, background: `linear-gradient(90deg,${gr(val)})` }} />
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", fontWeight: 700, color: sc(val), minWidth: 22, textAlign: "right" }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", padding: "0.45rem 0.65rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 8, marginBottom: "0.6rem" }}>
        <div className="progress-bar" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${data.overallScore}%`, background: `linear-gradient(90deg,${og})` }} />
        </div>
        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.6rem", fontWeight: 700, color: oc, whiteSpace: "nowrap" }}>{data.overallLabel}</span>
      </div>

      {data.signals.length > 0 && data.signals.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: "0.28rem", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.62rem", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "0.18rem", fontWeight: 500 }}>
          <span style={{ color: "var(--text-accent)", flexShrink: 0 }}>›</span>{s}
        </div>
      ))}
    </div>
  );
}
