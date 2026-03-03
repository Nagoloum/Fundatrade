import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO — Kraken API (gratuit, sans clé, compatible Vercel/US)
// Binance bloque les IPs américaines (erreur 451 sur Vercel)
// Kraken n'a pas de restriction géographique
// ═══════════════════════════════════════════════════════════════════════════

const KRAKEN_PAIR: Record<string, string> = {
  BTC: "XXBTZUSD",
  ETH: "XETHZUSD",
  SOL: "SOLUSD",
};

const NAME_MAP: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
};

// Nombre de points d'historique selon timeframe
// Kraken interval en minutes : 240 = 4H, 1440 = 1J, 10080 = 1W
const INTERVAL_MAP: Record<string, number> = {
  "4H": 240,
  "1J": 1440,
  "1W": 10080,
};

const LIMIT_MAP: Record<string, number> = {
  "4H": 60,
  "1J": 60,
  "1W": 52,
};

const KRAKEN = "https://api.kraken.com/0/public";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol    = searchParams.get("symbol") || "BTC";
  const timeframe = searchParams.get("timeframe") || "1J";
  const pair      = KRAKEN_PAIR[symbol];

  if (!pair) {
    return NextResponse.json({ error: `Symbole invalide : ${symbol}` }, { status: 400 });
  }

  const interval = INTERVAL_MAP[timeframe] ?? 1440;
  const limit    = LIMIT_MAP[timeframe] ?? 60;

  try {
    // since = timestamp Unix du début de la période souhaitée
    const sinceTs = Math.floor(Date.now() / 1000) - interval * 60 * limit;

    const [tickerRes, ohlcRes] = await Promise.all([
      fetch(`${KRAKEN}/Ticker?pair=${pair}`, {
        next: { revalidate: 15 },
      }),
      fetch(`${KRAKEN}/OHLC?pair=${pair}&interval=${interval}&since=${sinceTs}`, {
        next: { revalidate: 20 },
      }),
    ]);

    if (!tickerRes.ok) throw new Error(`Kraken ticker HTTP ${tickerRes.status}`);
    if (!ohlcRes.ok)   throw new Error(`Kraken OHLC HTTP ${ohlcRes.status}`);

    const [tickerJson, ohlcJson] = await Promise.all([
      tickerRes.json(),
      ohlcRes.json(),
    ]);

    if (tickerJson.error?.length) throw new Error(`Kraken: ${tickerJson.error[0]}`);
    if (ohlcJson.error?.length)   throw new Error(`Kraken OHLC: ${ohlcJson.error[0]}`);

    const tickerData = tickerJson.result?.[pair] ?? tickerJson.result?.[Object.keys(tickerJson.result)[0]];
    const ohlcData   = ohlcJson.result?.[pair]   ?? ohlcJson.result?.[Object.keys(ohlcJson.result).find(k => k !== "last")!];

    if (!tickerData) throw new Error("Données ticker Kraken introuvables");

    // Kraken ticker : c = last trade, h = 24h high, l = 24h low, v = volume, p = vwap
    const currentPrice = parseFloat(tickerData.c[0]);
    const high24h      = parseFloat(tickerData.h[1]); // [1] = last 24h
    const low24h       = parseFloat(tickerData.l[1]);
    const volume24h    = parseFloat(tickerData.v[1]) * currentPrice; // en USD
    const openPrice    = parseFloat(tickerData.o);
    const change24h    = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

    // OHLC Kraken : [time, open, high, low, close, vwap, volume, count]
    const history = (ohlcData as any[][])
      .slice(-limit)
      .map((k) => ({
        date:   new Date(k[0] * 1000).toISOString(),
        price:  parseFloat(parseFloat(k[4]).toFixed(4)), // close
        volume: parseFloat(k[6]),
      }));

    return NextResponse.json({
      name:                  NAME_MAP[symbol] || symbol,
      price:                 currentPrice,
      change24h:             parseFloat(change24h.toFixed(3)),
      high24h,
      low24h,
      volume24h,
      marketCap:             undefined,
      circulatingSupply:     undefined,
      fullyDilutedValuation: undefined,
      history,
      lastUpdated:           new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/crypto Kraken]", error.message);
    return NextResponse.json(
      { error: `Erreur Kraken : ${error.message}` },
      { status: 500 }
    );
  }
}
