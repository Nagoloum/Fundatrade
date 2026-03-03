"use client";

import type { NewsItem, Sentiment } from "@/types";

interface NewsFeedProps {
  news: NewsItem[];
}

const SENTIMENT_CONFIG: Record<Sentiment, { label: string; color: string; bg: string; icon: string }> = {
  positive: { label: "Positif",  color: "var(--bull)",    bg: "var(--bull-bg)",    icon: "▲" },
  negative: { label: "Négatif",  color: "var(--bear)",    bg: "var(--bear-bg)",    icon: "▼" },
  neutral:  { label: "Neutre",   color: "var(--neutral)", bg: "var(--neutral-bg)", icon: "◆" },
};

function NewsCard({ item }: { item: NewsItem }) {
  const sentiment = item.sentiment ?? "neutral";
  const cfg = SENTIMENT_CONFIG[sentiment];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (hours >= 24) return `il y a ${Math.floor(hours / 24)}j`;
    if (hours >= 1) return `il y a ${hours}h`;
    if (minutes >= 1) return `il y a ${minutes}min`;
    return "à l'instant";
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "0.75rem",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "10px",
        textDecoration: "none",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--bg-card-hover)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-subtle)";
        el.style.background = "var(--bg-surface)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Titre */}
      <div
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.45,
          marginBottom: "0.4rem",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.title}
      </div>

      {/* Résumé si disponible */}
      {item.summary && (
        <div
          style={{
            fontSize: "0.62rem",
            color: "var(--text-muted)",
            lineHeight: 1.4,
            marginBottom: "0.5rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.summary}
        </div>
      )}

      {/* Métadonnées */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "0.35rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {/* Source */}
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {typeof item.source === "object" ? (item.source as any).name : item.source}
          </span>
          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>·</span>
          <span style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        {/* Badge sentiment */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2rem",
            fontSize: "0.55rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: cfg.color,
            background: cfg.bg,
            padding: "0.1rem 0.4rem",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "0.5rem" }}>{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>
    </a>
  );
}

export default function NewsFeed({ news }: NewsFeedProps) {
  if (!news || news.length === 0) {
    return (
      <div className="card">
        <div className="section-label" style={{ marginBottom: "0.75rem" }}>Actualités</div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
          Aucune actualité disponible
        </div>
      </div>
    );
  }

  // Calcul du sentiment global
  const sentiments = news.map((n) => n.sentiment ?? "neutral");
  const positiveCount = sentiments.filter((s) => s === "positive").length;
  const negativeCount = sentiments.filter((s) => s === "negative").length;
  const globalSentiment =
    positiveCount > negativeCount ? "positive" :
    negativeCount > positiveCount ? "negative" :
    "neutral";
  const globalCfg = SENTIMENT_CONFIG[globalSentiment];

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
          <div className="section-label">Actualités</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sentiment de marché
          </div>
        </div>

        {/* Sentiment global */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.65rem",
            fontWeight: 700,
            color: globalCfg.color,
            background: globalCfg.bg,
            padding: "0.3rem 0.65rem",
            borderRadius: "8px",
            border: `1px solid ${globalCfg.color}33`,
          }}
        >
          <span>{globalCfg.icon}</span>
          {globalCfg.label}
        </span>
      </div>

      {/* Répartition des sentiments */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          marginBottom: "0.85rem",
          fontSize: "0.6rem",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ color: "var(--bull)" }}>▲ {positiveCount} positif{positiveCount > 1 ? "s" : ""}</span>
        <span>·</span>
        <span style={{ color: "var(--bear)" }}>▼ {negativeCount} négatif{negativeCount > 1 ? "s" : ""}</span>
        <span>·</span>
        <span>◆ {sentiments.length - positiveCount - negativeCount} neutre{sentiments.length - positiveCount - negativeCount > 1 ? "s" : ""}</span>
      </div>

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {news.slice(0, 5).map((item, i) => (
          <NewsCard key={i} item={item} />
        ))}
      </div>

      <div
        style={{
          marginTop: "0.65rem",
          fontSize: "0.56rem",
          color: "var(--text-muted)",
          textAlign: "right",
        }}
      >
        Source : NewsAPI · Traduit automatiquement
      </div>
    </div>
  );
}
