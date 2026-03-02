import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ALPHA_VANTAGE_KEY;

  const [priceRes, historyRes] = await Promise.all([
    fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${apiKey}`),
    fetch(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=XAU&to_symbol=USD&outputsize=compact&apikey=${apiKey}`)
  ]);

  const priceData = await priceRes.json();
  const historyData = await historyRes.json();

  const rate = priceData["Realtime Currency Exchange Rate"];
  const timeSeries = historyData["Time Series FX (Daily)"];

  const history = timeSeries
    ? Object.entries(timeSeries).slice(0, 30).map(([date, val]: any) => ({
        date,
        price: parseFloat(val["4. close"]),
      })).reverse()
    : [];

  return NextResponse.json({
    name: "Gold (XAUUSD)",
    price: parseFloat(rate?.["5. Exchange Rate"] || "0"),
    change24h: 0, // Alpha Vantage ne fournit pas ce champ directement
    history,
  });
}