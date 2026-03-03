import { NextResponse } from "next/server";

const QUERY_MAP: Record<string, string> = {
  XAUUSD: "gold XAUUSD OR \"cours de l'or\" OR XAU price",
  BTC:    "bitcoin BTC crypto price",
  ETH:    "ethereum ETH crypto price",
  SOL:    "solana SOL crypto",
};

// Mots-clés pour détection de sentiment automatique
const POSITIVE_KEYWORDS = [
  "surge", "rally", "bull", "gain", "rise", "soar", "record", "high",
  "growth", "boost", "breakout", "adoption", "ETF", "approve", "pump",
  "hausse", "rebond", "record", "croissance", "adoption", "approbation",
];

const NEGATIVE_KEYWORDS = [
  "crash", "drop", "fall", "bear", "decline", "sell", "fear", "hack",
  "ban", "regulation", "fine", "loss", "collapse", "dump", "warning",
  "baisse", "chute", "peur", "effondrement", "sanction", "perte", "interdiction",
];

function detectSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  const posScore = POSITIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  const negScore = NEGATIVE_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset  = searchParams.get("asset") || "BTC";
  const apiKey = process.env.NEWSAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API NewsAPI manquante (NEWSAPI_KEY)" },
      { status: 500 }
    );
  }

  const query = QUERY_MAP[asset] || asset;

  try {
    // On cherche d'abord en français, puis en anglais si peu de résultats
    const [frRes, enRes] = await Promise.all([
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=fr&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
        { next: { revalidate: 300 } } // Cache 5 min
      ),
      fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const [frData, enData] = await Promise.all([
      frRes.ok ? frRes.json() : { articles: [] },
      enRes.ok ? enRes.json() : { articles: [] },
    ]);

    // Fusionner et dédupliquer
    const frArticles = frData.articles || [];
    const enArticles = enData.articles || [];

    // Priorité aux articles FR, complément EN si < 3 articles FR
    const combined =
      frArticles.length >= 3
        ? frArticles.slice(0, 5)
        : [...frArticles, ...enArticles].slice(0, 5);

    const formatted = combined.map((article: any) => ({
      title:       article.title || "Sans titre",
      url:         article.url,
      source:      article.source?.name || "Inconnu",
      publishedAt: article.publishedAt,
      sentiment:   detectSentiment(article.title || ""),
      summary:     article.description || null,
    }));

    return NextResponse.json(formatted);

  } catch (error: any) {
    console.error("[API/news]", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les actualités" },
      { status: 500 }
    );
  }
}
