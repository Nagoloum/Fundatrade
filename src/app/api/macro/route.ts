import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  const [fedRes, cpiRes] = await Promise.all([
    fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`),
    fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`)
  ]);

  const fedData = await fedRes.json();
  const cpiData = await cpiRes.json();

  return NextResponse.json({
    fedRate: parseFloat(fedData.observations?.[0]?.value || "0"),
    inflation: parseFloat(cpiData.observations?.[0]?.value || "0"),
  });
}