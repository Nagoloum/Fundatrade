import { NextResponse } from "next/server";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

async function fetchFred(seriesId: string, apiKey: string): Promise<number> {
  try {
    const res = await fetch(
      `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const val  = data.observations?.[0]?.value;
    return val && val !== "." ? parseFloat(val) : 0;
  } catch { return 0; }
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "FRED_API_KEY manquant" }, { status: 500 });

  try {
    const [fedRate, inflation, m2, dxy, yield10y, yield2y] = await Promise.all([
      fetchFred("FEDFUNDS", apiKey),
      fetchFred("CPIAUCSL", apiKey),
      fetchFred("M2SL",     apiKey),
      fetchFred("DTWEXBGS", apiKey),
      fetchFred("DGS10",    apiKey),
      fetchFred("DGS2",     apiKey),
    ]);

    const yieldCurve = yield10y && yield2y ? parseFloat((yield10y - yield2y).toFixed(3)) : undefined;

    return NextResponse.json({
      fedRate, inflation, m2Supply: m2,
      dxy: dxy || undefined, yieldCurve,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: `Macro error: ${error.message}` }, { status: 500 });
  }
}
