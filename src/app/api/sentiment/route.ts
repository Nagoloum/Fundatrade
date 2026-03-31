import { NextResponse } from "next/server";

const POSITIVE = [
  "surge","rally","bullish","breakout","soar","adoption","approval","etf","institutional",
  "accumulate","record","high","growth","bull","bounce","recovery","upgrade","partnership",
  "ath","buy","support","rebound","hausse","rebond","haussier","record","croissance",
];
const NEGATIVE = [
  "crash","dump","bear","plunge","collapse","hack","exploit","ban","lawsuit","sec","fine",
  "fraud","ponzi","sell","short","correction","fear","panic","liquidation","bearish","drop",
  "fall","decline","warning","risk","attack","scam","chute","baisse","effondrement","fraude",
];
const STRONG_NEG = ["crash","hack","exploit","ban","fraud","collapse","scam","effondrement"];
const STRONG_POS = ["ath","institutional","etf","approval","record","adoption"];

function nlpScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE.forEach(w => { if (lower.includes(w)) score += STRONG_POS.includes(w) ? 2 : 1; });
  NEGATIVE.forEach(w => { if (lower.includes(w)) score -= STRONG_NEG.includes(w) ? 2 : 1; });
  return score;
}

function normalize(score: number, total: number): number {
  if (total === 0) return 50;
  return Math.round(Math.max(0, Math.min(100, 50 + (score / (total * 2)) * 50)));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset    = searchParams.get("asset") || "BTC";
  const isCrypto = asset !== "XAUUSD";

  const results: Record<string, any> = {};

  // 1. Fear & Greed
  if (isCrypto) {
    try {
      const fgRes = await fetch("https://api.alternative.me/fng/?limit=2&format=json", { next: { revalidate: 3600 } });
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        const cur = fgData.data?.[0]; const prev = fgData.data?.[1];
        if (cur) {
          results.fearGreed = {
            value: parseInt(cur.value), label: cur.value_classification,
            previousValue: prev ? parseInt(prev.value) : undefined,
            previousLabel: prev?.value_classification,
            timestamp: new Date(parseInt(cur.timestamp) * 1000).toISOString(),
          };
        }
      }
    } catch {}
  }

  // 2. CryptoPanic
  const CURRENCY: Record<string, string> = { BTC: "BTC", XAUUSD: "" };
  const currency = CURRENCY[asset] || "";
  let cpScore = 0; let cpCount = 0;

  if (currency) {
    try {
      const cpRes = await fetch(
        `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&currencies=${currency}&kind=news&public=true`,
        { next: { revalidate: 300 } }
      );
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        (cpData.results?.slice(0, 10) || []).forEach((post: any) => {
          if (post.votes) {
            const pos = (post.votes.positive || 0) + (post.votes.liked || 0);
            const neg = (post.votes.negative || 0) + (post.votes.disliked || 0);
            const tot = pos + neg;
            if (tot > 0) { cpScore += (pos - neg) / tot; cpCount++; }
          }
          if (post.title) { cpScore += nlpScore(post.title) * 0.05; cpCount += 0.5; }
        });
      }
    } catch {}
  }

  const cpNormalized = cpCount > 0 ? normalize(cpScore, cpCount) : 50;

  // 3. NLP news
  let newsNlp = 50;
  try {
    const newsKey = process.env.NEWSAPI_KEY;
    if (newsKey) {
      const QUERY: Record<string, string> = { BTC: "bitcoin price", XAUUSD: "gold price" };
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(QUERY[asset])}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${newsKey}`,
        { next: { revalidate: 300 } }
      );
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const articles = newsData.articles || [];
        let tot = 0; let cnt = 0;
        articles.forEach((a: any) => { tot += nlpScore(`${a.title} ${a.description || ""}`); cnt++; });
        newsNlp = normalize(tot, cnt * 2);
      }
    }
  } catch {}

  let overallScore: number;
  const signals: string[] = [];

  if (isCrypto && results.fearGreed) {
    const fg = results.fearGreed.value;
    overallScore = Math.round(fg * 0.45 + cpNormalized * 0.30 + newsNlp * 0.25);
    if (fg <= 25)      signals.push(`Peur extrême (F&G: ${fg}) — zone d'achat contrariante historique`);
    else if (fg <= 45) signals.push(`Peur dominante (F&G: ${fg}) — sentiment négatif`);
    else if (fg >= 75) signals.push(`Avidité extrême (F&G: ${fg}) — attention aux retournements`);
    else if (fg >= 55) signals.push(`Avidité modérée (F&G: ${fg}) — marché optimiste`);
    else               signals.push(`Sentiment neutre (F&G: ${fg})`);
  } else {
    overallScore = Math.round(cpNormalized * 0.5 + newsNlp * 0.5);
  }

  if (newsNlp > 62) signals.push("Vocabulaire haussier dominant dans les headlines");
  else if (newsNlp < 38) signals.push("Vocabulaire baissier dominant dans les headlines");

  const overallLabel =
    overallScore >= 75 ? "Avidité Extrême" :
    overallScore >= 60 ? "Avidité" :
    overallScore >= 45 ? "Neutre" :
    overallScore >= 30 ? "Peur" : "Peur Extrême";

  return NextResponse.json({
    fearGreed: results.fearGreed ?? null,
    cryptoPanicScore: parseFloat(cpNormalized.toFixed(1)),
    newsScore: newsNlp, overallScore, overallLabel,
    signals: signals.slice(0, 3),
    timestamp: new Date().toISOString(),
  });
}
