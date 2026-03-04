import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════════════
// DÉRIVÉS — Bybit API (gratuit, sans clé, non bloqué sur Vercel)
// Funding Rate, Open Interest, Long/Short Ratio
// ═══════════════════════════════════════════════════════════════════════════

const BYBIT_SYMBOL: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
};

const BYBIT = "https://api.bybit.com/v5/market";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset") || "BTC";
  const symbol = BYBIT_SYMBOL[asset];

  if (!symbol) {
    return NextResponse.json({ error: "Asset non supporté pour les dérivés" }, { status: 400 });
  }

  try {
    const [fundingRes, oiRes, lsRes] = await Promise.all([
      fetch(`${BYBIT}/tickers?category=linear&symbol=${symbol}`, { next: { revalidate: 30 } }),
      fetch(`${BYBIT}/open-interest?category=linear&symbol=${symbol}&intervalTime=1h&limit=2`, { next: { revalidate: 60 } }),
      fetch(`${BYBIT}/account-ratio?category=linear&symbol=${symbol}&period=1h&limit=1`, { next: { revalidate: 60 } }),
    ]);

    const [fundingData, oiData, lsData] = await Promise.all([
      fundingRes.ok ? fundingRes.json() : null,
      oiRes.ok      ? oiRes.json()      : null,
      lsRes.ok      ? lsRes.json()      : null,
    ]);

    const ticker    = fundingData?.result?.list?.[0];
    const oiList    = oiData?.result?.list;
    const lsList    = lsData?.result?.list;

    const fundingRate    = ticker?.fundingRate    ? parseFloat(ticker.fundingRate) * 100 : undefined;
    const openInterest   = ticker?.openInterestValue ? parseFloat(ticker.openInterestValue) : undefined;

    // OI change 1h
    let openInterestChange24h: number | undefined;
    if (oiList && oiList.length >= 2) {
      const latest = parseFloat(oiList[0]?.openInterest ?? "0");
      const prev   = parseFloat(oiList[1]?.openInterest ?? "0");
      if (prev > 0) openInterestChange24h = parseFloat(((latest - prev) / prev * 100).toFixed(2));
    }

    const longShortRatio = lsList?.[0]?.buyRatio
      ? parseFloat(parseFloat(lsList[0].buyRatio).toFixed(3))
      : undefined;

    // Interpréter le funding rate
    const signals: string[] = [];
    if (fundingRate !== undefined) {
      if (fundingRate > 0.1) signals.push(`Funding rate élevé (+${fundingRate.toFixed(3)}%) — marché surpositionné long, risque de squeeze`);
      else if (fundingRate < -0.05) signals.push(`Funding rate négatif (${fundingRate.toFixed(3)}%) — shorts dominants, potentiel short squeeze`);
      else signals.push(`Funding rate neutre (${fundingRate?.toFixed(3)}%) — équilibre longs/shorts`);
    }
    if (openInterestChange24h !== undefined) {
      if (openInterestChange24h > 5) signals.push(`OI en hausse (+${openInterestChange24h}%) — nouvelle liquidité entrant sur le marché`);
      else if (openInterestChange24h < -5) signals.push(`OI en baisse (${openInterestChange24h}%) — positions fermées, déleveraging en cours`);
    }
    if (longShortRatio !== undefined) {
      const lsPct = (longShortRatio * 100).toFixed(1);
      if (longShortRatio > 0.65) signals.push(`Ratio Long/Short déséquilibré (${lsPct}% longs) — marché suracheté côté dérivés`);
      else if (longShortRatio < 0.40) signals.push(`Majorité de shorts (${lsPct}% longs) — position contrariante possible`);
    }

    return NextResponse.json({
      fundingRate,
      openInterest,
      openInterestChange24h,
      longShortRatio,
      signals,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/derivatives]", error.message);
    return NextResponse.json({ error: `Erreur dérivés : ${error.message}` }, { status: 500 });
  }
}
