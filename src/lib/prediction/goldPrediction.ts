import type {
  HistoryPoint, MacroData, Prediction, Timeframe, Direction,
  MarketRegime, SentimentData,
} from "@/types";
import { computeAllIndicators } from "./indicators";
import { analyzePriceAction, analyzeSMC, analyzeRSI, analyzeMACD, analyzeIchimoku, analyzeADX } from "./strategies";

// ═══════════════════════════════════════════════════════════════════════════
// PRÉDICTEUR OR v2 — Enrichi : Ichimoku, ADX, StochRSI, Sentiment, Régime
// L'or : DXY (corrélation inverse forte), taux réels, inflation, M2
// Score : Fondamental 40% + Technique 45% + Sentiment 15%
// ═══════════════════════════════════════════════════════════════════════════

interface GoldPredictorInput {
  price: number;
  change24h: number;
  history: HistoryPoint[];
  macro: MacroData;
  timeframe: Timeframe;
  sentiment?: SentimentData;
}

function getGoldWeights(timeframe: Timeframe, regime: MarketRegime) {
  const base: Record<Timeframe, Record<string, number>> = {
    "4H": { rsi: 0.22, stochRSI: 0.18, macd: 0.18, priceAction: 0.16, ichimoku: 0.14, smc: 0.08, adx: 0.04 },
    "1J": { ichimoku: 0.22, priceAction: 0.20, rsi: 0.15, macd: 0.14, smc: 0.14, stochRSI: 0.10, adx: 0.05 },
    "1W": { ichimoku: 0.28, smc: 0.22, priceAction: 0.20, macd: 0.12, rsi: 0.10, stochRSI: 0.05, adx: 0.03 },
  };
  const w = { ...base[timeframe] };
  if (regime === "ranging") {
    w.rsi = (w.rsi || 0) * 1.5; w.stochRSI = (w.stochRSI || 0) * 1.5; w.macd = (w.macd || 0) * 0.6;
  } else if (regime === "trending_bull" || regime === "trending_bear") {
    w.ichimoku = (w.ichimoku || 0) * 1.4; w.macd = (w.macd || 0) * 1.2; w.rsi = (w.rsi || 0) * 0.75;
  }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach(k => { w[k] = w[k] / total; });
  return w;
}

function computeGoldFundamentalScore(input: GoldPredictorInput, reasons: string[]): number {
  const { macro, change24h, history, price } = input;
  let score = 50;

  // Taux réels = Fed - Inflation (facteur #1 pour l'or)
  const realRate = macro.fedRate - macro.inflation;
  if (realRate < -2) {
    score += 20;
    reasons.push(`Taux réels très négatifs (${realRate.toFixed(1)}%) → environnement très favorable à l'or`);
  } else if (realRate < 0) {
    score += 10;
    reasons.push(`Taux réels négatifs (${realRate.toFixed(1)}%) → or attractif vs obligations`);
  } else if (realRate > 3) {
    score -= 15;
    reasons.push(`Taux réels élevés (+${realRate.toFixed(1)}%) → coût d'opportunité fort, pression sur l'or`);
  } else if (realRate > 1) {
    score -= 7;
  }

  // DXY — corrélation inverse la plus forte avec l'or
  if (macro.dxy) {
    if (macro.dxy > 107)      { score -= 18; reasons.push(`Dollar très fort (DXY ${macro.dxy.toFixed(1)}) → pression baissière majeure sur l'or`); }
    else if (macro.dxy > 103) { score -= 8; }
    else if (macro.dxy < 98)  { score += 15; reasons.push(`Dollar faible (DXY ${macro.dxy.toFixed(1)}) → haussier pour l'or libellé en USD`); }
    else if (macro.dxy < 101) { score += 6; }
  }

  // Inflation — demande de valeur refuge
  if (macro.inflation > 5)      { score += 15; reasons.push(`Inflation élevée (${macro.inflation}%) → demande de protection via l'or`); }
  else if (macro.inflation > 3) { score += 6; }
  else if (macro.inflation < 2) { score -= 6; }

  // M2 — expansion monétaire favorise l'or
  if (macro.m2Supply && macro.m2Supply > 21500) {
    score += 10;
    reasons.push(`Masse monétaire M2 expansive (${(macro.m2Supply / 1000).toFixed(1)}T$) → dévaluation monétaire favorable à l'or`);
  }

  // Courbe inversée = risque récession = refuge or
  if (macro.yieldCurve !== undefined && macro.yieldCurve < -0.5) {
    score += 12;
    reasons.push(`Courbe de taux inversée (${macro.yieldCurve.toFixed(2)}%) → signal récession → or refuge`);
  }

  if (change24h > 1.5)       { score += 5; }
  else if (change24h < -1.5) { score -= 5; }

  if (history.length >= 7) {
    const t7 = ((price - history.slice(-7)[0].price) / history.slice(-7)[0].price) * 100;
    if (t7 > 4)       { score += 5; reasons.push(`Tendance haussière sur 7 périodes (+${t7.toFixed(1)}%)`); }
    else if (t7 < -4) { score -= 5; reasons.push(`Tendance baissière sur 7 périodes (${t7.toFixed(1)}%)`); }
  }

  return Math.max(0, Math.min(100, score));
}

function computeGoldTechnicalScore(history: HistoryPoint[], price: number, timeframe: Timeframe, reasons: string[], regime: MarketRegime): number {
  const indicators = computeAllIndicators(history);
  const weights    = getGoldWeights(timeframe, regime);
  const scores: Record<string, number> = {};

  // RSI
  const rsi = indicators.rsi;
  if (rsi < 32)      { scores.rsi = 82; reasons.push(`RSI or survendu (${rsi}) — rebond probable`); }
  else if (rsi < 44) { scores.rsi = 38; }
  else if (rsi > 72) { scores.rsi = 18; reasons.push(`RSI or suracheté (${rsi}) — consolidation probable`); }
  else if (rsi > 58) { scores.rsi = 65; }
  else               { scores.rsi = 50; }

  // StochRSI
  const stoch = indicators.stochRSI;
  if (stoch.zone === "oversold" && stoch.crossover === "bullish")   { scores.stochRSI = 88; reasons.push(`StochRSI or : croisement haussier en survente — signal d'entrée fort`); }
  else if (stoch.zone === "oversold")                               { scores.stochRSI = 75; }
  else if (stoch.zone === "overbought" && stoch.crossover === "bearish") { scores.stochRSI = 12; }
  else if (stoch.zone === "overbought")                             { scores.stochRSI = 25; }
  else if (stoch.crossover === "bullish")                           { scores.stochRSI = 65; }
  else if (stoch.crossover === "bearish")                           { scores.stochRSI = 35; }
  else                                                              { scores.stochRSI = 50; }

  // MACD
  if (indicators.macd.crossover === "bullish")      { scores.macd = 82; reasons.push("MACD or : croisement haussier détecté"); }
  else if (indicators.macd.crossover === "bearish") { scores.macd = 18; reasons.push("MACD or : croisement baissier détecté"); }
  else scores.macd = indicators.macd.macdLine > indicators.macd.signalLine ? 60 : 40;

  // Ichimoku
  const ichi = indicators.ichimoku;
  if (ichi.pricePosition === "above_cloud" && ichi.cloudColor === "bullish") {
    scores.ichimoku = 78; reasons.push("Or au-dessus du nuage Ichimoku haussier — tendance long terme confirmée");
  } else if (ichi.pricePosition === "below_cloud") {
    scores.ichimoku = 22;
  } else { scores.ichimoku = ichi.tenkan > ichi.kijun ? 60 : 40; }

  // ADX
  const adx = indicators.adx;
  if (adx.adx > 28 && adx.trend === "BULLISH") { scores.adx = 70; }
  else if (adx.adx > 28 && adx.trend === "BEARISH") { scores.adx = 30; }
  else { scores.adx = 50; }

  // Price Action & SMC
  const pa  = analyzePriceAction(history, price, timeframe);
  const smc = analyzeSMC(history, price, timeframe);
  scores.priceAction = pa.direction === "BULLISH" ? 50 + pa.confidence * 0.35 : pa.direction === "BEARISH" ? 50 - pa.confidence * 0.35 : 50;
  scores.smc         = smc.direction === "BULLISH" ? 50 + smc.confidence * 0.32 : smc.direction === "BEARISH" ? 50 - smc.confidence * 0.32 : 50;

  // EMA / BB bonus
  let emaBonus = 0;
  if (price > indicators.ema20)  emaBonus += 5;
  if (price > indicators.ema50)  emaBonus += 4;
  if (price > indicators.ema200) emaBonus += 6;
  if (indicators.bollingerBands.percentB < 0.1) { emaBonus += 8; reasons.push("Or sous la bande Bollinger inférieure — zone de survente"); }
  else if (indicators.bollingerBands.percentB > 0.9) emaBonus -= 8;

  const weightedScore = Object.entries(scores).reduce((sum, [key, val]) => sum + val * (weights[key] ?? 0.05), emaBonus * 0.06);
  return Math.max(0, Math.min(100, Math.round(50 + (weightedScore - 50))));
}

export function predictGold(input: GoldPredictorInput): Prediction {
  const { price, history, timeframe, sentiment } = input;
  const reasons: string[] = [];

  const indicators     = computeAllIndicators(history);
  const regime         = indicators.adx.regime;
  const fundamentalScore = computeGoldFundamentalScore(input, reasons);
  const technicalScore   = computeGoldTechnicalScore(history, price, timeframe, reasons, regime);
  const sentimentScore   = sentiment?.overallScore ?? 50;

  if (sentimentScore >= 70) reasons.push(`Sentiment or positif (${sentimentScore}/100)`);
  else if (sentimentScore <= 30) reasons.push(`Sentiment or négatif (${sentimentScore}/100) — possible valeur refuge`);

  // Or : Fondamental 40% + Technique 45% + Sentiment 15%
  const globalScore = Math.max(0, Math.min(100, Math.round(
    fundamentalScore * 0.40 + technicalScore * 0.45 + sentimentScore * 0.15
  )));

  const direction: Direction = globalScore >= 62 ? "BULLISH" : globalScore <= 42 ? "BEARISH" : "NEUTRAL";

  const atr = indicators.atr || price * 0.008; // Or : ~0.8% volatilité
  const mults: Record<Timeframe, [number, number]> = { "4H": [2, 1], "1J": [4, 2], "1W": [8, 4] };
  const [tgtM, stpM] = mults[timeframe];
  const targetPrice = direction === "BULLISH" ? price + atr * tgtM : direction === "BEARISH" ? price - atr * tgtM : price;
  const stopLoss    = direction === "BULLISH" ? price - atr * stpM : price + atr * stpM;
  const reward      = Math.abs(targetPrice - price);
  const risk        = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;
  const confidence  = Math.min(88, Math.max(35, 40 + Math.abs(globalScore - 50) * 0.9));

  return {
    direction,
    targetPrice:       parseFloat(targetPrice.toFixed(2)),
    stopLoss:          parseFloat(stopLoss.toFixed(2)),
    confidence:        parseFloat(confidence.toFixed(1)),
    fundamentalScore,
    technicalScore,
    sentimentScore,
    globalScore,
    riskRewardRatio,
    reasoning:         reasons.slice(0, 7),
    timeframe,
    regime,
    multiTF:           undefined,
    strategies: {
      priceAction: analyzePriceAction(history, price, timeframe),
      smc:         analyzeSMC(history, price, timeframe),
      rsi:         analyzeRSI(indicators, price, history, timeframe),
      macd:        analyzeMACD(indicators, price, timeframe),
      ichimoku:    analyzeIchimoku(indicators, price, timeframe),
      adx:         analyzeADX(indicators, timeframe),
    },
  };
}
