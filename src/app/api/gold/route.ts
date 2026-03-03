import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// OR (XAUUSD) — Yahoo Finance (gratuit, sans clé, sans limite)
// Remplace Alpha Vantage limité à 25 req/jour
// ═══════════════════════════════════════════════════════════════════════════

const DAYS_MAP: Record<string, number> = {
  "4H": 5,
  "1J": 60,
  "1W": 365,
};

const INTERVAL_MAP: Record<string, string> = {
  "4H": "1h",
  "1J": "1d",
  "1W": "1wk",
};

async function fetchYahooGold(timeframe: string) {
  const days     = DAYS_MAP[timeframe] ?? 60;
  const interval = INTERVAL_MAP[timeframe] ?? "1d";
  const period2  = Math.floor(Date.now() / 1000);
  const period1  = period2 - days * 86400;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

  const json   = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Structure Yahoo Finance inattendue");

  const timestamps: number[] = result.timestamp || [];
  const quote                = result.indicators?.quote?.[0] || {};
  const closes: number[]     = quote.close   || [];
  const highs: number[]      = quote.high    || [];
  const lows: number[]       = quote.low     || [];
  const volumes: number[]    = quote.volume  || [];

  if (!closes.length) throw new Error("Aucune donnée de prix Yahoo Finance");

  const rawHistory = timestamps
    .map((ts, i) => ({
      date:   new Date(ts * 1000).toISOString(),
      price:  closes[i],
      volume: volumes[i] ?? undefined,
    }))
    .filter((h) => h.price != null && !isNaN(h.price));

  // Regroupement 4H (4 bougies horaires => 1 bougie 4H)
  let history = rawHistory;
  if (timeframe === "4H") {
    const grouped: typeof rawHistory = [];
    for (let i = 0; i < rawHistory.length; i += 4) {
      const chunk = rawHistory.slice(i, i + 4).filter((c) => c.price);
      if (chunk.length) grouped.push(chunk[chunk.length - 1]);
    }
    history = grouped;
  }

  const last    = closes[closes.length - 1];
  const prev    = closes[closes.length - 2] ?? last;
  const change24h = prev ? ((last - prev) / prev) * 100 : 0;

  return {
    price:    parseFloat(last.toFixed(2)),
    change24h: parseFloat(change24h.toFixed(3)),
    high24h:  highs[highs.length - 1] ? parseFloat(highs[highs.length - 1].toFixed(2)) : undefined,
    low24h:   lows[lows.length - 1]   ? parseFloat(lows[lows.length - 1].toFixed(2))   : undefined,
    history:  history.map((h) => ({ ...h, price: parseFloat(h.price.toFixed(2)) })),
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("timeframe") || "1J";

  try {
    const data = await fetchYahooGold(timeframe);

    if (data.history.length < 3) {
      throw new Error("Historique insuffisant de Yahoo Finance");
    }

    return NextResponse.json({
      name:        "Or (XAUUSD)",
      price:       data.price,
      change24h:   data.change24h,
      high24h:     data.high24h,
      low24h:      data.low24h,
      history:     data.history,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/gold]", error.message);
    return NextResponse.json(
      { error: `Erreur données or : ${error.message}` },
      { status: 500 }
    );
  }
}
