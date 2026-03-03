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
// PRÉDICTEUR OR (XAUUSD)
// L'or est sensible à : DXY, taux réels, inflation, géopolitique, M2
// Score fondamental (55%) + Score technique (45%) = Score global
// ═══════════════════════════════════════════════════════════════════════════

interface GoldPredictorInput {
  price: number;
  change24h: number;
  history: HistoryPoint[];
  macro: MacroData;
  timeframe: Timeframe;
}

/**
 * Score fondamental spécifique à l'or
 * L'or est une valeur refuge : réagit inversement au DXY et aux taux réels
 */
function computeGoldFundamentalScore(
  input: GoldPredictorInput,
  reasons: string[]
): number {
  const { price, change24h, history, macro } = input;
  let score = 50;

  // ── Taux réels (Fed Rate - Inflation) ─────────────────────────────────
  // Des taux réels négatifs sont très haussiers pour l'or
  const realRate = macro.fedRate - macro.inflation;

  if (realRate < -2) {
    score += 20;
    reasons.push(`Taux réels très négatifs (${realRate.toFixed(1)}%) → environnement idéal pour l'or, actif de protection`);
  } else if (realRate < 0) {
    score += 12;
    reasons.push(`Taux réels négatifs (${realRate.toFixed(1)}%) → l'or surperforme généralement dans ce contexte`);
  } else if (realRate > 3) {
    score -= 15;
    reasons.push(`Taux réels élevés (+${realRate.toFixed(1)}%) → coût d'opportunité fort pour l'or sans rendement`);
  } else if (realRate > 1) {
    score -= 8;
    reasons.push(`Taux réels positifs (+${realRate.toFixed(1)}%) → légère pression sur l'or`);
  }

  // ── Inflation ─────────────────────────────────────────────────────────
  if (macro.inflation > 5) {
    score += 15;
    reasons.push(`Inflation élevée (${macro.inflation}) → l'or est la couverture historique contre la perte de pouvoir d'achat`);
  } else if (macro.inflation > 3) {
    score += 8;
    reasons.push(`Inflation modérément élevée (${macro.inflation}) → soutien pour l'or comme hedge`);
  } else if (macro.inflation < 2) {
    score -= 6;
    reasons.push(`Inflation maîtrisée (${macro.inflation}) → moins de pression pour se réfugier dans l'or`);
  }

  // ── DXY (corrélation inverse très forte avec l'or) ────────────────────
  if (macro.dxy) {
    if (macro.dxy > 107) {
      score -= 18;
      reasons.push(`Dollar extrêmement fort (DXY ${macro.dxy.toFixed(1)}) → pression baissière majeure sur l'or (corrélation inverse)`);
    } else if (macro.dxy > 104) {
      score -= 10;
      reasons.push(`Dollar fort (DXY ${macro.dxy.toFixed(1)}) → vent de face pour l'or`);
    } else if (macro.dxy < 98) {
      score += 15;
      reasons.push(`Dollar faible (DXY ${macro.dxy.toFixed(1)}) → haussier pour l'or : les acheteurs étrangers profitent`);
    } else if (macro.dxy < 101) {
      score += 8;
      reasons.push(`Dollar en retrait (DXY ${macro.dxy.toFixed(1)}) → léger soutien pour l'or`);
    }
  }

  // ── M2 ────────────────────────────────────────────────────────────────
  if (macro.m2Supply && macro.m2Supply > 21500) {
    score += 10;
    reasons.push(`Masse monétaire très expansive (M2 : ${(macro.m2Supply / 1000).toFixed(1)}T$) → dévaluation monétaire → haussier pour l'or`);
  } else if (macro.m2Supply && macro.m2Supply > 20000) {
    score += 5;
    reasons.push(`Masse monétaire élevée (M2 : ${(macro.m2Supply / 1000).toFixed(1)}T$) → soutien modéré pour l'or`);
  }

  // ── Courbe des taux (signal de stress économique) ────────────────────
  if (macro.yieldCurve !== undefined && macro.yieldCurve < -0.5) {
    score += 12;
    reasons.push(`Courbe des taux inversée (${macro.yieldCurve.toFixed(2)}%) → signal de récession → forte demande refuge pour l'or`);
  }

  // ── Variation 24h ─────────────────────────────────────────────────────
  if (change24h > 1.5) {
    score += 6;
    reasons.push(`Momentum haussier 24h (+${change24h.toFixed(2)}%) sur l'or`);
  } else if (change24h < -1.5) {
    score -= 6;
    reasons.push(`Correction de l'or (${change24h.toFixed(2)}% en 24h)`);
  }

  // ── Tendance 7 jours ──────────────────────────────────────────────────
  if (history.length >= 7) {
    const trend7d = ((price - history.slice(-7)[0].price) / history.slice(-7)[0].price) * 100;
    if (trend7d > 3) {
      score += 6;
      reasons.push(`Tendance haussière sur 7 jours (+${trend7d.toFixed(1)}%) — demande soutenue`);
    } else if (trend7d < -3) {
      score -= 6;
      reasons.push(`Pression vendeuse sur 7 jours (${trend7d.toFixed(1)}%) — prise de profits`);
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score technique pour l'or (identique au crypto mais pondération différente)
 */
function computeGoldTechnicalScore(
  history: HistoryPoint[],
  price: number,
  reasons: string[]
): number {
  if (history.length < 5) return 50;
  const indicators = computeAllIndicators(history);
  let score = 50;

  // RSI
  const rsi = indicators.rsi;
  if (rsi < 35)      { score += 15; reasons.push(`Or survendu (RSI ${rsi}) → rebond technique attendu`); }
  else if (rsi > 72) { score -= 15; reasons.push(`Or suracheté (RSI ${rsi}) → consolidation probable`); }
  else if (rsi > 55) { score += 6; }
  else if (rsi < 45) { score -= 6; }

  // MACD
  if (indicators.macd.crossover === "bullish") {
    score += 18;
    reasons.push("Signal MACD haussier sur l'or — confirmation technique");
  } else if (indicators.macd.crossover === "bearish") {
    score -= 18;
    reasons.push("Signal MACD baissier sur l'or — prudence");
  } else if (indicators.macd.macdLine > indicators.macd.signalLine) {
    score += 7;
  } else {
    score -= 7;
  }

  // EMA
  if (price > indicators.ema20) { score += 5; }
  else { score -= 5; }
  if (indicators.ema200 > 0) {
    if (price > indicators.ema200) { score += 5; reasons.push(`Or au-dessus de l'EMA200 → tendance longue haussière préservée`); }
    else { score -= 5; }
  }

  // Bollinger
  const bb = indicators.bollingerBands;
  if (bb.percentB < 0.15)    { score += 10; reasons.push("Or sur la bande Bollinger inférieure → zone de support technique fort"); }
  else if (bb.percentB > 0.85) { score -= 10; }

  return Math.max(0, Math.min(100, score));
}

/**
 * Prédicteur principal OR
 */
export function predictGold(input: GoldPredictorInput): Prediction {
  const { price, history, timeframe } = input;
  const reasons: string[] = [];

  // ── Calcul des scores ─────────────────────────────────────────────────
  // Or : fondamental légèrement dominant (55% / 45%)
  const fundamentalScore = computeGoldFundamentalScore(input, reasons);
  const technicalScore   = computeGoldTechnicalScore(history, price, reasons);
  const globalScore      = Math.round(fundamentalScore * 0.55 + technicalScore * 0.45);

  // ── Direction ─────────────────────────────────────────────────────────
  const direction: Direction =
    globalScore >= 62 ? "BULLISH" :
    globalScore <= 42 ? "BEARISH" :
    "NEUTRAL";

  // ── Prix cible ────────────────────────────────────────────────────────
  // L'or a une volatilité plus faible que les cryptos
  const indicators = computeAllIndicators(history);
  const atr = indicators.atr || price * 0.008; // ~0.8% par défaut pour l'or

  const targetMultMap: Record<Timeframe, number> = { "4H": 2, "1J": 4, "1W": 8 };
  const stopMultMap:   Record<Timeframe, number> = { "4H": 1.2, "1J": 2.5, "1W": 4 };

  const targetPrice = direction === "BULLISH"
    ? price + atr * targetMultMap[timeframe]
    : direction === "BEARISH"
    ? price - atr * targetMultMap[timeframe]
    : price + atr * (globalScore > 50 ? 0.8 : -0.8);

  const stopLoss = direction === "BULLISH"
    ? price - atr * stopMultMap[timeframe]
    : price + atr * stopMultMap[timeframe];

  // ── Risk/Reward ────────────────────────────────────────────────────────
  const reward = Math.abs(targetPrice - price);
  const risk   = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;

  // ── Confiance ─────────────────────────────────────────────────────────
  const distFromNeutral = Math.abs(globalScore - 50);
  const confidence = Math.min(88, Math.max(40, 48 + distFromNeutral * 0.85));

  // ── Stratégies ────────────────────────────────────────────────────────
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
