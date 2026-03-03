import { NextResponse } from "next/server";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<number> {
  try {
    const res = await fetch(
      `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=1&sort_order=desc`,
      { next: { revalidate: 3600 } } // Cache 1h — les données macro changent peu
    );
    if (!res.ok) return 0;
    const data = await res.json();
    const val = data.observations?.[0]?.value;
    return val && val !== "." ? parseFloat(val) : 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API FRED manquante (FRED_API_KEY)" },
      { status: 500 }
    );
  }

  try {
    // Récupération parallèle de tous les indicateurs macro
    const [fedRate, inflation, m2, dxy, yield10y, yield2y] = await Promise.all([
      fetchFredSeries("FEDFUNDS", apiKey),  // Taux directeur Fed
      fetchFredSeries("CPIAUCSL", apiKey),  // CPI inflation
      fetchFredSeries("M2SL", apiKey),      // M2 masse monétaire (Mds $)
      fetchFredSeries("DTWEXBGS", apiKey),  // Dollar Index (Trade Weighted)
      fetchFredSeries("DGS10", apiKey),     // Rendement obligation 10 ans
      fetchFredSeries("DGS2", apiKey),      // Rendement obligation 2 ans
    ]);

    // Courbe des taux = 10Y - 2Y
    const yieldCurve = yield10y && yield2y ? parseFloat((yield10y - yield2y).toFixed(3)) : undefined;

    return NextResponse.json({
      fedRate:    fedRate,
      inflation:  inflation,
      m2Supply:   m2,       // En milliards USD
      dxy:        dxy || undefined,
      yieldCurve: yieldCurve,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/macro]", error);
    return NextResponse.json(
      { error: "Erreur récupération données macro FRED" },
      { status: 500 }
    );
  }
}
