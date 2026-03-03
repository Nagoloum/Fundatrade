import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// BINANCE API — Gratuit, sans clé, temps réel, klines natifs 4H/1J/1W
// ═══════════════════════════════════════════════════════════════════════════

const SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
};

const INTERVAL_MAP: Record<string, string> = {
  "4H": "4h",
  "1J": "1d",
  "1W": "1w",
};

// 60 points minimum pour RSI(14), MACD(26), BB(20)
const LIMIT_MAP: Record<string, number> = {
  "4H": 60,
  "1J": 60,
  "1W": 52,
};

const NAME_MAP: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
};

const BINANCE = "https://api.binance.com/api/v3";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol    = searchParams.get("symbol") || "BTC";
  const timeframe = searchParams.get("timeframe") || "1J";
  const pair      = SYMBOL_MAP[symbol];

  if (!pair) {
    return NextResponse.json({ error: `Symbole invalide : ${symbol}` }, { status: 400 });
  }

  const interval = INTERVAL_MAP[timeframe] ?? "1d";
  const limit    = LIMIT_MAP[timeframe] ?? 60;

  try {
    const [tickerRes, klineRes, priceRes] = await Promise.all([
      fetch(`${BINANCE}/ticker/24hr?symbol=${pair}`, { next: { revalidate: 15 } }),
      fetch(`${BINANCE}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, { next: { revalidate: 20 } }),
      fetch(`${BINANCE}/ticker/price?symbol=${pair}`, { next: { revalidate: 5 } }),
    ]);

    if (!tickerRes.ok) throw new Error(`Binance ticker error ${tickerRes.status}`);
    if (!klineRes.ok)  throw new Error(`Binance klines error ${klineRes.status}`);

    const [ticker, klines, priceData] = await Promise.all([
      tickerRes.json(),
      klineRes.json(),
      priceRes.json(),
    ]);

    // Klines : [openTime, open, high, low, close, volume, ...]
    const history = (klines as any[][]).map((k) => ({
      date:   new Date(k[0]).toISOString(),
      price:  parseFloat(parseFloat(k[4]).toFixed(4)),
      volume: parseFloat(parseFloat(k[5]).toFixed(2)),
    }));

    const currentPrice = parseFloat(priceData.price);

    return NextResponse.json({
      name:                  NAME_MAP[symbol] || symbol,
      price:                 currentPrice,
      change24h:             parseFloat(parseFloat(ticker.priceChangePercent).toFixed(3)),
      high24h:               parseFloat(ticker.highPrice),
      low24h:                parseFloat(ticker.lowPrice),
      volume24h:             parseFloat(ticker.quoteVolume),
      marketCap:             undefined,
      circulatingSupply:     undefined,
      fullyDilutedValuation: undefined,
      history,
      lastUpdated:           new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/crypto Binance]", error.message);
    return NextResponse.json(
      { error: `Erreur Binance : ${error.message}` },
      { status: 500 }
    );
  }
}
