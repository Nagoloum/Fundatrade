"use client";
import type { NewsItem, Sentiment } from "@/types";

const SENT_CFG: Record<Sentiment, { label: string; color: string; bg: string; brd: string; icon: string }> = {
  positive: { label: "Positif", color: "var(--bull)",    bg: "var(--bull-bg)",    brd: "var(--bull-border)",    icon: "▲" },
  negative: { label: "Négatif", color: "var(--bear)",    bg: "var(--bear-bg)",    brd: "var(--bear-border)",    icon: "▼" },
  neutral:  { label: "Neutre",  color: "var(--neutral)", bg: "var(--neutral-bg)", brd: "var(--neutral-border)", icon: "◆" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor(diff / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}j`;
  if (h >= 1) return `${h}h`;
  if (m >= 1) return `${m}min`;
  return "maintenant";
}

export default function NewsFeed({ news }: { news: NewsItem[] }) {
  if (!news || news.length === 0) return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: "0.65rem" }}>Actualités</div>
      <div style={{ textAlign: "center", padding: "1.2rem 0", color: "var(--text-muted)", fontFamily: "'Rajdhani', sans-serif", fontSize: "0.78rem" }}>Aucune actualité disponible</div>
    </div>
  );

  const sents  = news.map(n => n.sentiment ?? "neutral");
  const posC   = sents.filter(s => s === "positive").length;
  const negC   = sents.filter(s => s === "negative").length;
  const global = posC > negC ? "positive" : negC > posC ? "negative" : "neutral";
  const gcfg   = SENT_CFG[global];

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div>
          <div className="section-label">Actualités</div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>Sentiment marché</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.28rem", padding: "0.25rem 0.6rem", borderRadius: 6, background: gcfg.bg, border: `1px solid ${gcfg.brd}`, fontFamily: "'Orbitron', monospace", fontSize: "0.56rem", fontWeight: 700, color: gcfg.color, letterSpacing: "0.08em" }}>
          {gcfg.icon} {gcfg.label}
        </span>
      </div>

      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.75rem", fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace" }}>
        <span style={{ color: "var(--bull)" }}>▲ {posC}</span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span style={{ color: "var(--bear)" }}>▼ {negC}</span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span style={{ color: "var(--neutral)" }}>◆ {sents.length - posC - negC}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {news.slice(0, 5).map((item, i) => {
          const sc = item.sentiment ?? "neutral";
          const cfg = SENT_CFG[sc];
          return (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "block", padding: "0.65rem 0.75rem", background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 9, textDecoration: "none", transition: "all 0.18s ease", cursor: "pointer" }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.background = "var(--bg-card-hover)"; el.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border-subtle)"; el.style.background = "var(--bg-surface)"; el.style.transform = "translateY(0)"; }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, marginBottom: "0.35rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {item.title}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.55rem", color: "var(--text-muted)" }}>
                  <span style={{ fontWeight: 600 }}>{typeof item.source === "object" ? (item.source as any).name : item.source}</span>
                  <span>·</span>
                  <span>il y a {timeAgo(item.publishedAt)}</span>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontFamily: "'Orbitron', monospace", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.06em", color: cfg.color, background: cfg.bg, padding: "0.08rem 0.35rem", borderRadius: 3, border: `1px solid ${cfg.brd}` }}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      <div style={{ marginTop: "0.55rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.52rem", color: "var(--text-muted)", textAlign: "right" }}>
        Source : NewsAPI · Rafraîchissement : 5 min
      </div>
    </div>
  );
}
