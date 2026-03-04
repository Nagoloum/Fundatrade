import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// SENTIMENT — Fear & Greed (alternative.me) + CryptoPanic + NLP news
// 100% gratuit, sans clé API
// ═══════════════════════════════════════════════════════════════════════════

// Dictionnaire NLP financier (Loughran-McDonald adapté crypto)
const POSITIVE_FINANCIAL = [
  "surge","rally","bullish","breakout","soar","adoption","approval","etf","institutional",
  "accumulate","record","high","growth","bull","bounce","recovery","upgrade","partnership",
  "integration","launch","milestone","all-time","ath","buy","long","support","rebound",
  "hausse","rebond","haussier","record","croissance","adoption","approbation","soutien",
  "achat","institutionnel","integration","progression","montee","sommet",
];

const NEGATIVE_FINANCIAL = [
  "crash","dump","bear","plunge","collapse","hack","exploit","ban","lawsuit","sec","fine",
  "fraud","ponzi","sell","short","resistance","correction","fear","panic","liquidation",
  "bearish","drop","fall","decline","warning","risk","vulnerability","attack","scam",
  "chute","baisse","baissier","effondrement","piratage","interdiction","amende","panique",
  "liquidation","correction","vente","risque","fraude","peur","avertissement",
];

// Mots fortement négatifs (poids double)
const STRONG_NEGATIVE = ["crash","hack","exploit","ban","fraud","ponzi","collapse","scam","piratage","fraude","effondrement"];
// Mots fortement positifs (poids double)  
const STRONG_POSITIVE = ["ath","all-time","institutional","etf","approval","record","adoption","approbation","institutionnel"];

function nlpScore(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  POSITIVE_FINANCIAL.forEach(w => { if (lower.includes(w)) score += STRONG_POSITIVE.includes(w) ? 2 : 1; });
  NEGATIVE_FINANCIAL.forEach(w => { if (lower.includes(w)) score -= STRONG_NEGATIVE.includes(w) ? 2 : 1; });
  return score;
}

function normalizeSentiment(score: number, total: number): number {
  // Convertit score brut en 0–100 centré sur 50
  if (total === 0) return 50;
  const normalized = score / (total * 2); // -1 à +1
  return Math.round(Math.max(0, Math.min(100, 50 + normalized * 50)));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset") || "BTC";
  const isCrypto = asset !== "XAUUSD";

  const results: Record<string, any> = {};

  // ── 1. Fear & Greed Index (crypto uniquement) ─────────────────────────
  if (isCrypto) {
    try {
      const fgRes = await fetch(
        "https://api.alternative.me/fng/?limit=2&format=json",
        { next: { revalidate: 3600 } } // Change 1x/jour
      );
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        const current  = fgData.data?.[0];
        const previous = fgData.data?.[1];
        if (current) {
          results.fearGreed = {
            value:         parseInt(current.value),
            label:         current.value_classification,
            previousValue: previous ? parseInt(previous.value) : undefined,
            previousLabel: previous?.value_classification,
            timestamp:     new Date(parseInt(current.timestamp) * 1000).toISOString(),
          };
        }
      }
    } catch (e) { console.warn("[sentiment] Fear & Greed error:", e); }
  }

  // ── 2. CryptoPanic (news agrégées avec sentiment) ─────────────────────
  const CRYPTO_PANIC_CURRENCY: Record<string, string> = {
    BTC: "BTC", ETH: "ETH", SOL: "SOL", XAUUSD: "",
  };
  const currency = CRYPTO_PANIC_CURRENCY[asset];
  let cryptoPanicScore = 0;
  let cryptoPanicCount = 0;

  if (currency) {
    try {
      const cpRes = await fetch(
        `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&currencies=${currency}&kind=news&public=true`,
        { next: { revalidate: 300 } }
      );
      if (cpRes.ok) {
        const cpData = await cpRes.json();
        const posts = cpData.results?.slice(0, 10) || [];
        posts.forEach((post: any) => {
          if (post.votes) {
            const positive = (post.votes.positive || 0) + (post.votes.liked || 0);
            const negative = (post.votes.negative || 0) + (post.votes.disliked || 0);
            const total = positive + negative;
            if (total > 0) {
              cryptoPanicScore += (positive - negative) / total;
              cryptoPanicCount++;
            }
          }
          // Aussi analyser le titre avec NLP
          if (post.title) {
            const nlp = nlpScore(post.title);
            cryptoPanicScore += nlp * 0.05; // Poids plus faible que les votes
            cryptoPanicCount += 0.5;
          }
        });
      }
    } catch (e) { console.warn("[sentiment] CryptoPanic error:", e); }
  }

  const cryptoPanicNormalized = cryptoPanicCount > 0
    ? normalizeSentiment(cryptoPanicScore, cryptoPanicCount)
    : 50;

  // ── 3. NLP sur les news récentes (NewsAPI déjà en cache) ─────────────
  let newsNlpScore = 50;
  try {
    const QUERY: Record<string, string> = {
      BTC: "bitcoin price",
      ETH: "ethereum price",
      SOL: "solana price",
      XAUUSD: "gold price",
    };
    const newsKey = process.env.NEWSAPI_KEY;
    if (newsKey) {
      const newsRes = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(QUERY[asset])}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${newsKey}`,
        { next: { revalidate: 300 } }
      );
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const articles = newsData.articles || [];
        let totalScore = 0;
        let count = 0;
        articles.forEach((a: any) => {
          const text = `${a.title} ${a.description || ""}`;
          const score = nlpScore(text);
          totalScore += score;
          count++;
        });
        newsNlpScore = normalizeSentiment(totalScore, count * 2);
      }
    }
  } catch (e) { console.warn("[sentiment] NLP news error:", e); }

  // ── 4. Score combiné ──────────────────────────────────────────────────
  let overallScore: number;
  const signals: string[] = [];

  if (isCrypto && results.fearGreed) {
    const fg = results.fearGreed.value;
    // F&G 40% + CryptoPanic 35% + NLP 25%
    overallScore = Math.round(fg * 0.4 + cryptoPanicNormalized * 0.35 + newsNlpScore * 0.25);

    if (fg <= 25) signals.push(`Peur extrême (F&G : ${fg}) — historiquement zone d'achat contrariante pour BTC`);
    else if (fg <= 45) signals.push(`Peur sur le marché (F&G : ${fg}) — sentiment négatif dominant`);
    else if (fg >= 75) signals.push(`Avidité extrême (F&G : ${fg}) — attention aux retournements imminent`);
    else if (fg >= 55) signals.push(`Avidité modérée (F&G : ${fg}) — marché optimiste mais vigilance`);
    else signals.push(`Sentiment neutre (F&G : ${fg}) — pas de signal directionnel fort`);
  } else {
    // Pour l'or : CryptoPanic 50% + NLP 50%
    overallScore = Math.round(cryptoPanicNormalized * 0.5 + newsNlpScore * 0.5);
  }

  if (cryptoPanicScore > 0.3) signals.push("Sentiment positif dominant sur CryptoPanic — flux news favorable");
  else if (cryptoPanicScore < -0.3) signals.push("Sentiment négatif sur CryptoPanic — flux news défavorable");
  if (newsNlpScore > 60) signals.push("Analyse NLP des headlines favorable — vocabulaire haussier dominant");
  else if (newsNlpScore < 40) signals.push("Analyse NLP des headlines défavorable — vocabulaire baissier dominant");

  const overallLabel =
    overallScore >= 75 ? "Avidité Extrême" :
    overallScore >= 60 ? "Avidité" :
    overallScore >= 45 ? "Neutre" :
    overallScore >= 30 ? "Peur" :
    "Peur Extrême";

  return NextResponse.json({
    fearGreed:        results.fearGreed ?? null,
    cryptoPanicScore: parseFloat(cryptoPanicNormalized.toFixed(1)),
    newsScore:        newsNlpScore,
    overallScore,
    overallLabel,
    signals: signals.slice(0, 3),
    timestamp:        new Date().toISOString(),
  });
}
