import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset") || "gold";
  const apiKey = process.env.NEWSAPI_KEY;

  const queryMap: Record<string, string> = {
    XAUUSD: "gold XAUUSD price",
    BTC: "bitcoin BTC crypto",
    ETH: "ethereum ETH crypto",
    SOL: "solana SOL crypto",
  };

  const q = queryMap[asset] || asset;
  const res = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`
  );

  const data = await res.json();
  return NextResponse.json(data.articles || []);
}