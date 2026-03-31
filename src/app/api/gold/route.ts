import { NextResponse } from "next/server";

const DAYS_MAP:     Record<string, number> = { "4H": 5, "1J": 60, "1W": 365 };
const INTERVAL_MAP: Record<string, string> = { "4H": "1h", "1J": "1d", "1W": "1wk" };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("timeframe") || "1J";
  const days     = DAYS_MAP[timeframe] ?? 60;
  const interval = INTERVAL_MAP[timeframe] ?? "1d";
  const period2  = Math.floor(Date.now() / 1000);
  const period1  = period2 - days * 86400;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/GC=F?period1=${period1}&period2=${period2}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);

    const json   = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("Unexpected Yahoo structure");

    const timestamps: number[] = result.timestamp || [];
    const quote                = result.indicators?.quote?.[0] || {};
    const closes: number[]     = quote.close  || [];
    const highs:  number[]     = quote.high   || [];
    const lows:   number[]     = quote.low    || [];
    const volumes: number[]    = quote.volume || [];

    if (!closes.length) throw new Error("No price data");

    let rawHistory = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString(), price: closes[i], volume: volumes[i] }))
      .filter((h) => h.price != null && !isNaN(h.price));

    if (timeframe === "4H") {
      const grouped: typeof rawHistory = [];
      for (let i = 0; i < rawHistory.length; i += 4) {
        const chunk = rawHistory.slice(i, i + 4).filter(c => c.price);
        if (chunk.length) grouped.push(chunk[chunk.length - 1]);
      }
      rawHistory = grouped;
    }

    const last    = closes[closes.length - 1];
    const prev    = closes[closes.length - 2] ?? last;
    const change24h = prev ? ((last - prev) / prev) * 100 : 0;

    return NextResponse.json({
      name: "Or (XAUUSD)",
      price: parseFloat(last.toFixed(2)),
      change24h: parseFloat(change24h.toFixed(3)),
      high24h:  highs[highs.length - 1]  ? parseFloat(highs[highs.length - 1].toFixed(2))  : undefined,
      low24h:   lows[lows.length - 1]    ? parseFloat(lows[lows.length - 1].toFixed(2))    : undefined,
      volume24h: volumes[volumes.length - 1] ?? 0,
      history:  rawHistory.map(h => ({ ...h, price: parseFloat(h.price.toFixed(2)) })),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Gold error: ${error.message}` }, { status: 500 });
  }
}
