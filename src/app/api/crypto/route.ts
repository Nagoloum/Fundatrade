import { NextResponse } from "next/server";

const COIN_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "BTC";
  const coinId = COIN_MAP[symbol];

  if (!coinId) return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });

  const [coinRes, historyRes] = await Promise.all([
    fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`),
    fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30`)
  ]);

  const coin = await coinRes.json();
  const history = await historyRes.json();

  return NextResponse.json({
    name: coin.name,
    price: coin.market_data.current_price.usd,
    change24h: coin.market_data.price_change_percentage_24h,
    high24h: coin.market_data.high_24h.usd,
    low24h: coin.market_data.low_24h.usd,
    marketCap: coin.market_data.market_cap.usd,
    volume24h: coin.market_data.total_volume.usd,
    circulatingSupply: coin.market_data.circulating_supply,
    fullyDilutedValuation: coin.market_data.fully_diluted_valuation.usd,
    history: history.prices.map(([timestamp, price]: number[]) => ({
      date: new Date(timestamp).toISOString().split("T")[0],
      price,
    })),
  });
}