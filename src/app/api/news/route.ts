import { NextResponse } from "next/server";

const QUERY_MAP: Record<string, string> = {
  XAUUSD: "gold XAUUSD OR \"cours de l'or\" OR XAU price",
  BTC:    "bitcoin BTC crypto price",
};

const POSITIVE_KW = [
  "surge","rally","bull","gain","rise","soar","record","high","growth","breakout",
  "adoption","ETF","approve","pump","hausse","rebond","record","croissance","approbation",
];
const NEGATIVE_KW = [
  "crash","drop","fall","bear","decline","sell","fear","hack","ban","regulation","fine",
  "loss","collapse","dump","warning","baisse","chute","peur","effondrement","sanction","perte",
];

function detectSentiment(title: string): "positive" | "negative" | "neutral" {
  const lower = title.toLowerCase();
  const pos = POSITIVE_KW.filter(kw => lower.includes(kw)).length;
  const neg = NEGATIVE_KW.filter(kw => lower.includes(kw)).length;
  return pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset  = searchParams.get("asset") || "BTC";
  const apiKey = process.env.NEWSAPI_KEY;

  if (!apiKey) return NextResponse.json([], { status: 200 });

  const query = QUERY_MAP[asset] || asset;

  try {
    const [frRes, enRes] = await Promise.all([
      fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=fr&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`, { next: { revalidate: 300 } }),
      fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`, { next: { revalidate: 300 } }),
    ]);

    const [frData, enData] = await Promise.all([
      frRes.ok ? frRes.json() : { articles: [] },
      enRes.ok ? enRes.json() : { articles: [] },
    ]);

    const frArticles = frData.articles || [];
    const enArticles = enData.articles || [];
    const combined = frArticles.length >= 3 ? frArticles.slice(0, 5) : [...frArticles, ...enArticles].slice(0, 5);

    return NextResponse.json(combined.map((article: any) => ({
      title:       article.title || "Sans titre",
      url:         article.url,
      source:      article.source?.name || "Inconnu",
      publishedAt: article.publishedAt,
      sentiment:   detectSentiment(article.title || ""),
      summary:     article.description || null,
    })));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
