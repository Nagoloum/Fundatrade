import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { asset, price, change24h, fedRate, inflation, history } = body;

  // Algorithme de prédiction fondamentale
  let score = 0; // -100 à +100
  const reasons: string[] = [];

  // Signal momentum (trend 7j)
  if (history && history.length >= 7) {
    const recent = history.slice(-7);
    const startPrice = recent[0].price;
    const trend = ((price - startPrice) / startPrice) * 100;
    if (trend > 3) { score += 20; reasons.push("Tendance haussière sur 7 jours (+${trend.toFixed(1)}%)"); }
    else if (trend < -3) { score -= 20; reasons.push(`Tendance baissière sur 7 jours (${trend.toFixed(1)}%)`); }
  }

  // Signal macro (taux Fed)
  if (fedRate !== undefined) {
    if (fedRate < 3) { score += 15; reasons.push("Taux Fed bas → favorable aux actifs risqués et à l'or"); }
    else if (fedRate > 5) { score -= 15; reasons.push("Taux Fed élevés → pression baissière"); }
  }

  // Signal inflation
  if (inflation !== undefined) {
    if (asset === "XAUUSD" && inflation > 3) { score += 15; reasons.push("Inflation élevée → l'or est une valeur refuge"); }
    if ((asset === "BTC" || asset === "ETH") && inflation > 5) { score += 10; reasons.push("Inflation forte → demande de hedging crypto"); }
  }

  // Signal variation 24h
  if (change24h > 2) { score += 10; reasons.push("Forte hausse 24h → momentum positif"); }
  else if (change24h < -2) { score -= 10; reasons.push("Forte baisse 24h → pression vendeuse"); }

  // Calcul direction + prix cible
  const direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  const multiplier = score > 0 ? 1 + (score / 500) : 1 + (score / 500);
  const targetPrice = price * multiplier;
  const confidence = Math.min(90, Math.abs(score) + 40);

  return NextResponse.json({
    direction,
    targetPrice: parseFloat(targetPrice.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(1)),
    reasoning: reasons,
    timeframe: "7-14 jours",
  });
}