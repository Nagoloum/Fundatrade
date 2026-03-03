import type {
  HistoryPoint,
  MacroData,
  Prediction,
  Timeframe,
  Direction,
} from "@/types";
import { computeAllIndicators } from "./indicators";
import { analyzePriceAction, analyzeSMC, analyzeRSI, analyzeMACD } from "./strategies";

// ═══════════════════════════════════════════════════════════════════════════
// PRÉDICTEUR CRYPTO — Algorithme fondamental + technique combiné
// Score fondamental (40%) + Score technique (60%) = Score global
// ═══════════════════════════════════════════════════════════════════════════

interface CryptoPredictorInput {
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  history: HistoryPoint[];
  macro: MacroData;
  timeframe: Timeframe;
}

/**
 * Score fondamental basé sur les données macro et on-chain
 * Retourne un score brut de 0 à 100
 */
function computeFundamentalScore(
  input: CryptoPredictorInput,
  reasons: string[]
): number {
  let score = 50;

  const { price, change24h, marketCap, volume24h, history, macro } = input;

  // ── Taux Fed ─────────────────────────────────────────────────────────
  if (macro.fedRate < 2.5) {
    score += 12;
    reasons.push(`Taux Fed très bas (${macro.fedRate}%) → liquidités abondantes, favorable aux cryptos`);
  } else if (macro.fedRate < 4) {
    score += 6;
    reasons.push(`Taux Fed modérés (${macro.fedRate}%) → environnement neutre pour les actifs risqués`);
  } else if (macro.fedRate > 5) {
    score -= 12;
    reasons.push(`Taux Fed élevés (${macro.fedRate}%) → coût d'opportunité élevé, pression sur les cryptos`);
  }

  // ── Inflation ─────────────────────────────────────────────────────────
  if (macro.inflation > 5) {
    score += 8;
    reasons.push(`Inflation élevée (${macro.inflation}) → demande de hedging crypto comme actif non-corréllé`);
  } else if (macro.inflation < 2) {
    score -= 5;
    reasons.push(`Inflation basse (${macro.inflation}) → moins de pression pour fuir vers les cryptos`);
  }

  // ── DXY ───────────────────────────────────────────────────────────────
  if (macro.dxy) {
    if (macro.dxy < 98) {
      score += 10;
      reasons.push(`Dollar faible (DXY ${macro.dxy.toFixed(1)}) → haussier pour les cryptos libellées en USD`);
    } else if (macro.dxy > 105) {
      score -= 10;
      reasons.push(`Dollar fort (DXY ${macro.dxy.toFixed(1)}) → pression baissière sur les cryptos`);
    }
  }

  // ── M2 ────────────────────────────────────────────────────────────────
  if (macro.m2Supply && macro.m2Supply > 21000) {
    score += 6;
    reasons.push(`Masse monétaire M2 expansive (${(macro.m2Supply / 1000).toFixed(1)}T$) → liquidités en excès cherchent du rendement`);
  }

  // ── Volume/MCap ratio ─────────────────────────────────────────────────
  if (marketCap && volume24h) {
    const volRatio = volume24h / marketCap;
    if (volRatio > 0.15) {
      score += 8;
      reasons.push(`Activité de trading forte (ratio Vol/MCap : ${(volRatio * 100).toFixed(1)}%) → forte participation de marché`);
    } else if (volRatio < 0.03) {
      score -= 6;
      reasons.push(`Faible volume relatif (${(volRatio * 100).toFixed(1)}% du MCap) → manque d'intérêt, liquidité réduite`);
    }
  }

  // ── Variation 24h ─────────────────────────────────────────────────────
  if (change24h > 5) {
    score += 8;
    reasons.push(`Forte hausse 24h (+${change24h.toFixed(1)}%) → momentum acheteur puissant`);
  } else if (change24h > 2) {
    score += 4;
    reasons.push(`Hausse modérée 24h (+${change24h.toFixed(1)}%) → pression acheteuse présente`);
  } else if (change24h < -5) {
    score -= 8;
    reasons.push(`Forte baisse 24h (${change24h.toFixed(1)}%) → pression vendeuse dominante`);
  } else if (change24h < -2) {
    score -= 4;
    reasons.push(`Baisse modérée 24h (${change24h.toFixed(1)}%) → affaiblissement du sentiment`);
  }

  // ── Tendance 7 jours ──────────────────────────────────────────────────
  if (history.length >= 7) {
    const slice = history.slice(-7);
    const trend7d = ((price - slice[0].price) / slice[0].price) * 100;
    if (trend7d > 8) {
      score += 6;
      reasons.push(`Forte tendance haussière sur 7 jours (+${trend7d.toFixed(1)}%) — momentum moyen terme positif`);
    } else if (trend7d < -8) {
      score -= 6;
      reasons.push(`Forte tendance baissière sur 7 jours (${trend7d.toFixed(1)}%) — momentum moyen terme négatif`);
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score technique basé sur les indicateurs calculés
 * Retourne un score brut de 0 à 100
 */
function computeTechnicalScore(
  history: HistoryPoint[],
  price: number,
  timeframe: Timeframe,
  reasons: string[]
): number {
  const indicators = computeAllIndicators(history);
  let score = 50;

  // ── RSI ───────────────────────────────────────────────────────────────
  const rsi = indicators.rsi;
  if (rsi < 30) { score += 18; reasons.push(`RSI survendu (${rsi}) → fort potentiel de rebond`); }
  else if (rsi < 45) { score -= 8; reasons.push(`RSI faible (${rsi}) → momentum vendeur`); }
  else if (rsi > 70) { score -= 15; reasons.push(`RSI suracheté (${rsi}) → risque de retournement`); }
  else if (rsi > 55) { score += 8; reasons.push(`RSI haussier (${rsi}) → momentum acheteur`); }

  // ── MACD ──────────────────────────────────────────────────────────────
  if (indicators.macd.crossover === "bullish") {
    score += 20;
    reasons.push("Croisement haussier MACD → signal technique majeur d'achat");
  } else if (indicators.macd.crossover === "bearish") {
    score -= 20;
    reasons.push("Croisement baissier MACD → signal technique majeur de vente");
  } else if (indicators.macd.macdLine > indicators.macd.signalLine) {
    score += 8;
  } else {
    score -= 8;
  }

  // ── EMA Position ──────────────────────────────────────────────────────
  if (price > indicators.ema20) {
    score += 6;
    reasons.push(`Prix au-dessus de l'EMA20 ($${indicators.ema20.toFixed(2)}) → tendance courte haussière`);
  } else {
    score -= 6;
  }

  if (indicators.ema200 > 0 && price > indicators.ema200) {
    score += 6;
    reasons.push(`Prix au-dessus de l'EMA200 ($${indicators.ema200.toFixed(2)}) → tendance longue terme haussière`);
  } else if (indicators.ema200 > 0) {
    score -= 6;
    reasons.push(`Prix sous l'EMA200 → tendance longue terme baissière`);
  }

  // ── Bollinger Bands ───────────────────────────────────────────────────
  const bb = indicators.bollingerBands;
  if (bb.percentB < 0.1) {
    score += 12;
    reasons.push(`Prix sous la bande inférieure de Bollinger → zone de survente extrême`);
  } else if (bb.percentB > 0.9) {
    score -= 12;
    reasons.push(`Prix sur la bande supérieure de Bollinger → zone de surachat, possible retour vers la moyenne`);
  }

  // ── Volume trend ──────────────────────────────────────────────────────
  if (indicators.volume_trend === "increasing") {
    score += 5;
    reasons.push("Volume en hausse → confirmation de la tendance en cours");
  } else if (indicators.volume_trend === "decreasing") {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Prédicteur principal crypto
 */
export function predictCrypto(input: CryptoPredictorInput): Prediction {
  const { price, history, timeframe } = input;
  const reasons: string[] = [];

  // ── Calcul des scores ─────────────────────────────────────────────────
  const fundamentalScore = computeFundamentalScore(input, reasons);
  const technicalScore   = computeTechnicalScore(history, price, timeframe, reasons);

  // Pondération : 40% fondamental, 60% technique
  const globalScore = Math.round(fundamentalScore * 0.4 + technicalScore * 0.6);

  // ── Direction ─────────────────────────────────────────────────────────
  const direction: Direction =
    globalScore >= 62 ? "BULLISH" :
    globalScore <= 42 ? "BEARISH" :
    "NEUTRAL";

  // ── Prix cible (basé sur volatilité ATR) ──────────────────────────────
  const indicators = computeAllIndicators(history);
  const atr = indicators.atr || price * 0.02;

  const multiplierMap: Record<Timeframe, number> = { "4H": 3, "1J": 6, "1W": 12 };
  const atrMult = multiplierMap[timeframe];

  const targetPrice = direction === "BULLISH"
    ? price + atr * atrMult
    : direction === "BEARISH"
    ? price - atr * atrMult
    : price + atr * (globalScore > 50 ? 1 : -1);

  // ── Stop Loss ─────────────────────────────────────────────────────────
  const stopMult: Record<Timeframe, number> = { "4H": 1.5, "1J": 3, "1W": 5 };
  const stopLoss = direction === "BULLISH"
    ? price - atr * stopMult[timeframe]
    : price + atr * stopMult[timeframe];

  // ── Risk/Reward ────────────────────────────────────────────────────────
  const reward = Math.abs(targetPrice - price);
  const risk   = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;

  // ── Confiance ─────────────────────────────────────────────────────────
  const distFromNeutral = Math.abs(globalScore - 50);
  const confidence = Math.min(90, Math.max(40, 45 + distFromNeutral * 0.9));

  // ── Stratégies individuelles ──────────────────────────────────────────
  const priceActionAnalysis = analyzePriceAction(history, price, timeframe);
  const smcAnalysis         = analyzeSMC(history, price, timeframe);
  const rsiAnalysis         = analyzeRSI(indicators, price, history, timeframe);
  const macdAnalysis        = analyzeMACD(indicators, price, timeframe);

  return {
    direction,
    targetPrice:    parseFloat(targetPrice.toFixed(2)),
    stopLoss:       parseFloat(stopLoss.toFixed(2)),
    confidence:     parseFloat(confidence.toFixed(1)),
    fundamentalScore,
    technicalScore,
    globalScore,
    riskRewardRatio,
    reasoning:      reasons.slice(0, 6),
    timeframe,
    strategies: {
      priceAction: priceActionAnalysis,
      smc:         smcAnalysis,
      rsi:         rsiAnalysis,
      macd:        macdAnalysis,
    },
  };
}
