import { NextResponse } from "next/server";

const KRAKEN_PAIR = "XXBTZUSD";
const KRAKEN = "https://api.kraken.com/0/public";

const INTERVAL_MAP: Record<string, number> = { "4H": 240, "1J": 1440, "1W": 10080 };
const LIMIT_MAP:    Record<string, number> = { "4H": 60,  "1J": 60,  "1W": 52   };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get("timeframe") || "1J";
  const interval  = INTERVAL_MAP[timeframe] ?? 1440;
  const limit     = LIMIT_MAP[timeframe] ?? 60;

  try {
    const sinceTs = Math.floor(Date.now() / 1000) - interval * 60 * limit;

    const [tickerRes, ohlcRes] = await Promise.all([
      fetch(`${KRAKEN}/Ticker?pair=${KRAKEN_PAIR}`, { next: { revalidate: 15 } }),
      fetch(`${KRAKEN}/OHLC?pair=${KRAKEN_PAIR}&interval=${interval}&since=${sinceTs}`, { next: { revalidate: 20 } }),
    ]);

    if (!tickerRes.ok || !ohlcRes.ok) throw new Error("Kraken API error");

    const [tickerJson, ohlcJson] = await Promise.all([tickerRes.json(), ohlcRes.json()]);
    if (tickerJson.error?.length) throw new Error(tickerJson.error[0]);

    const tickerData = tickerJson.result?.[KRAKEN_PAIR] ?? tickerJson.result?.[Object.keys(tickerJson.result)[0]];
    const ohlcData   = ohlcJson.result?.[KRAKEN_PAIR]   ?? ohlcJson.result?.[Object.keys(ohlcJson.result).find((k: string) => k !== "last")!];

    const currentPrice = parseFloat(tickerData.c[0]);
    const high24h      = parseFloat(tickerData.h[1]);
    const low24h       = parseFloat(tickerData.l[1]);
    const volume24h    = parseFloat(tickerData.v[1]) * currentPrice;
    const openPrice    = parseFloat(tickerData.o);
    const change24h    = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

    const history = (ohlcData as any[][]).slice(-limit).map((k) => ({
      date:   new Date(k[0] * 1000).toISOString(),
      price:  parseFloat(parseFloat(k[4]).toFixed(2)),
      volume: parseFloat(k[6]),
    }));

    return NextResponse.json({
      name: "Bitcoin", price: currentPrice,
      change24h: parseFloat(change24h.toFixed(3)),
      high24h, low24h, volume24h, history,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Kraken error: ${error.message}` }, { status: 500 });
  }
}
