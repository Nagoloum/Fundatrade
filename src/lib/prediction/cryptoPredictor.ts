import type {
  HistoryPoint, MacroData, Prediction, Timeframe, Direction, MarketRegime,
  MultiTimeframeSignal, SentimentData,
} from "@/types";
import { computeAllIndicators, calculateRSI, calculateEMA } from "./indicators";
import { analyzePriceAction, analyzeSMC, analyzeRSI, analyzeMACD, analyzeIchimoku, analyzeADX } from "./strategies";

// ═══════════════════════════════════════════════════════════════════════════
// PRÉDICTEUR CRYPTO v2 — Enrichi avec Ichimoku, ADX, StochRSI, Sentiment,
// Confluence multi-timeframe, Pondération dynamique par régime de marché
// ═══════════════════════════════════════════════════════════════════════════

interface CryptoPredictorInput {
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  history: HistoryPoint[];
  macro: MacroData;
  timeframe: Timeframe;
  sentiment?: SentimentData;
  // Historiques des autres timeframes pour confluence multi-TF
  history4H?: HistoryPoint[];
  history1J?: HistoryPoint[];
  history1W?: HistoryPoint[];
}

// ─── Pondérations dynamiques par timeframe ET régime de marché ─────────────
function getStrategyWeights(timeframe: Timeframe, regime: MarketRegime): Record<string, number> {
  const base: Record<Timeframe, Record<string, number>> = {
    "4H": { priceAction: 0.15, smc: 0.10, rsi: 0.20, macd: 0.20, stochRSI: 0.15, ichimoku: 0.10, adx: 0.10 },
    "1J": { priceAction: 0.20, smc: 0.18, rsi: 0.15, macd: 0.15, stochRSI: 0.10, ichimoku: 0.14, adx: 0.08 },
    "1W": { priceAction: 0.20, smc: 0.22, rsi: 0.12, macd: 0.12, stochRSI: 0.08, ichimoku: 0.18, adx: 0.08 },
  };

  const weights = { ...base[timeframe] };

  // Ajustement selon le régime détecté par ADX
  if (regime === "ranging") {
    // En range : RSI et StochRSI plus importants, MACD et tendance moins fiables
    weights.rsi       = (weights.rsi || 0) * 1.4;
    weights.stochRSI  = (weights.stochRSI || 0) * 1.4;
    weights.macd      = (weights.macd || 0) * 0.6;
    weights.ichimoku  = (weights.ichimoku || 0) * 0.7;
  } else if (regime === "trending_bull" || regime === "trending_bear") {
    // En tendance : Ichimoku, MACD et ADX plus fiables
    weights.ichimoku = (weights.ichimoku || 0) * 1.5;
    weights.macd     = (weights.macd || 0) * 1.3;
    weights.rsi      = (weights.rsi || 0) * 0.8; // RSI moins fiable en tendance forte
  } else if (regime === "volatile") {
    // Volatilité : Price Action et SMC (niveaux structurels) sont plus utiles
    weights.priceAction = (weights.priceAction || 0) * 1.4;
    weights.smc         = (weights.smc || 0) * 1.3;
    weights.stochRSI    = (weights.stochRSI || 0) * 0.7;
  }

  // Renormaliser pour que la somme = 1
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(k => { weights[k] = weights[k] / total; });
  return weights;
}

// ─── Calcul du score technique pondéré ──────────────────────────────────────
function computeTechnicalScoreWeighted(
  history: HistoryPoint[],
  price: number,
  timeframe: Timeframe,
  reasons: string[],
  regime: MarketRegime
): { score: number; strategyScores: Record<string, number> } {
  const indicators = computeAllIndicators(history);
  const weights    = getStrategyWeights(timeframe, regime);
  const scores: Record<string, number> = {};

  // RSI (0-100, 50 = neutre)
  const rsi = indicators.rsi;
  let rsiScore = 50;
  if (rsi < 30)      { rsiScore = 80; reasons.push(`RSI survendu (${rsi}) — fort potentiel de rebond technique`); }
  else if (rsi < 42) { rsiScore = 38; }
  else if (rsi > 70) { rsiScore = 20; reasons.push(`RSI suracheté (${rsi}) — risque de correction à court terme`); }
  else if (rsi > 58) { rsiScore = 65; reasons.push(`RSI en zone haussière (${rsi}) — momentum acheteur`); }
  scores.rsi = rsiScore;

  // Stochastique RSI
  const stoch = indicators.stochRSI;
  let stochScore = 50;
  if (stoch.zone === "oversold")  { stochScore = 78; if (stoch.crossover === "bullish") { stochScore = 88; reasons.push(`StochRSI croisement haussier en survente (K:${stoch.k}) — signal d'entrée fort`); } }
  else if (stoch.zone === "overbought") { stochScore = 22; if (stoch.crossover === "bearish") { stochScore = 12; reasons.push(`StochRSI croisement baissier en surachat (K:${stoch.k}) — signal de sortie fort`); } }
  else if (stoch.crossover === "bullish") { stochScore = 65; }
  else if (stoch.crossover === "bearish") { stochScore = 35; }
  scores.stochRSI = stochScore;

  // MACD
  let macdScore = 50;
  if (indicators.macd.crossover === "bullish") { macdScore = 85; reasons.push("Croisement haussier MACD — signal de retournement majeur"); }
  else if (indicators.macd.crossover === "bearish") { macdScore = 15; reasons.push("Croisement baissier MACD — signal de retournement majeur"); }
  else macdScore = indicators.macd.macdLine > indicators.macd.signalLine ? 62 : 38;
  scores.macd = macdScore;

  // Ichimoku
  const ichi = indicators.ichimoku;
  let ichiScore = 50;
  if (ichi.pricePosition === "above_cloud" && ichi.cloudColor === "bullish") { ichiScore = 78; reasons.push(`Prix au-dessus du nuage Ichimoku haussier — tendance long terme confirmée`); }
  else if (ichi.pricePosition === "below_cloud" && ichi.cloudColor === "bearish") { ichiScore = 22; reasons.push(`Prix sous le nuage Ichimoku baissier — tendance baissière structurelle`); }
  else if (ichi.pricePosition === "above_cloud") { ichiScore = 65; }
  else if (ichi.pricePosition === "below_cloud") { ichiScore = 35; }
  if (ichi.tenkan > ichi.kijun) ichiScore += 8;
  else ichiScore -= 8;
  scores.ichimoku = Math.max(0, Math.min(100, ichiScore));

  // ADX
  const adx = indicators.adx;
  let adxScore = 50;
  if (adx.adx > 30) {
    adxScore = adx.trend === "BULLISH" ? 72 : 28;
    if (adx.adx > 45) {
      adxScore = adx.trend === "BULLISH" ? 82 : 18;
      reasons.push(`Tendance forte détectée (ADX ${adx.adx}) — ${adx.trend === "BULLISH" ? "momentum haussier puissant" : "pression baissière dominante"}`);
    }
  } else if (adx.adx < 20) {
    adxScore = 50; // Pas de tendance claire
  }
  scores.adx = adxScore;

  // Price Action
  const pa = analyzePriceAction(history, price, timeframe);
  scores.priceAction = pa.direction === "BULLISH" ? 50 + pa.confidence * 0.4 : pa.direction === "BEARISH" ? 50 - pa.confidence * 0.4 : 50;

  // SMC
  const smc = analyzeSMC(history, price, timeframe);
  scores.smc = smc.direction === "BULLISH" ? 50 + smc.confidence * 0.38 : smc.direction === "BEARISH" ? 50 - smc.confidence * 0.38 : 50;

  // Score EMA
  let emaScore = 50;
  if (price > indicators.ema20) emaScore += 8;
  if (price > indicators.ema50) emaScore += 6;
  if (indicators.ema200 > 0 && price > indicators.ema200) { emaScore += 8; reasons.push(`Prix au-dessus de l'EMA200 — tendance long terme haussière`); }

  // Score Bollinger
  const bb = indicators.bollingerBands;
  if (bb.percentB < 0.1) { emaScore += 10; reasons.push("Prix sous la bande Bollinger inférieure — zone de survente extrême"); }
  else if (bb.percentB > 0.9) { emaScore -= 10; }
  scores.ema = Math.max(0, Math.min(100, emaScore));

  // Score pondéré final
  const weightedScore =
    (scores.priceAction * weights.priceAction) +
    (scores.smc         * weights.smc)         +
    (scores.rsi         * weights.rsi)         +
    (scores.macd        * weights.macd)        +
    (scores.stochRSI    * weights.stochRSI)    +
    (scores.ichimoku    * weights.ichimoku)    +
    (scores.adx         * weights.adx)         +
    (scores.ema         * 0.05);

  return { score: Math.max(0, Math.min(100, Math.round(weightedScore))), strategyScores: scores };
}

// ─── Score fondamental ───────────────────────────────────────────────────────
function computeFundamentalScore(input: CryptoPredictorInput, reasons: string[]): number {
  const { price, change24h, marketCap, volume24h, history, macro } = input;
  let score = 50;

  if (macro.fedRate < 2.5)       { score += 12; reasons.push(`Taux Fed très bas (${macro.fedRate}%) → liquidités abondantes`); }
  else if (macro.fedRate < 4)    { score += 6; }
  else if (macro.fedRate > 5)    { score -= 12; reasons.push(`Taux Fed élevés (${macro.fedRate}%) → pression sur les cryptos`); }

  if (macro.inflation > 5)       { score += 8; reasons.push(`Inflation élevée (${macro.inflation}%) → demande de hedging crypto`); }
  else if (macro.inflation < 2)  { score -= 5; }

  if (macro.dxy) {
    if (macro.dxy < 98)         { score += 10; reasons.push(`Dollar faible (DXY ${macro.dxy.toFixed(1)}) → haussier pour les cryptos`); }
    else if (macro.dxy > 105)   { score -= 10; reasons.push(`Dollar fort (DXY ${macro.dxy.toFixed(1)}) → pression baissière crypto`); }
  }

  if (macro.m2Supply && macro.m2Supply > 21000) { score += 6; }
  if (macro.yieldCurve !== undefined && macro.yieldCurve < -0.5) { score += 5; }

  if (marketCap && volume24h) {
    const r = volume24h / marketCap;
    if (r > 0.15) { score += 8; reasons.push(`Volume relatif fort (${(r*100).toFixed(1)}% MCap) → forte participation`); }
    else if (r < 0.03) { score -= 6; }
  }

  if (change24h > 5)       { score += 8; reasons.push(`Forte hausse 24h (+${change24h.toFixed(1)}%) → momentum acheteur`); }
  else if (change24h > 2)  { score += 4; }
  else if (change24h < -5) { score -= 8; reasons.push(`Forte baisse 24h (${change24h.toFixed(1)}%) → pression vendeuse`); }
  else if (change24h < -2) { score -= 4; }

  if (history.length >= 7) {
    const trend7 = ((price - history.slice(-7)[0].price) / history.slice(-7)[0].price) * 100;
    if (trend7 > 8)      { score += 6; }
    else if (trend7 < -8) { score -= 6; }
  }

  return Math.max(0, Math.min(100, score));
}

// ─── Confluence multi-timeframe ──────────────────────────────────────────────
function computeMultiTFSignal(
  h4H?: HistoryPoint[], h1J?: HistoryPoint[], h1W?: HistoryPoint[], price?: number
): MultiTimeframeSignal | undefined {
  if (!h4H && !h1J && !h1W) return undefined;

  const getDir = (history: HistoryPoint[] | undefined): Direction => {
    if (!history || history.length < 10) return "NEUTRAL";
    const prices = history.map(h => h.price);
    const rsi = calculateRSI(prices);
    const ema20 = calculateEMA(prices, 20);
    const last = prices[prices.length - 1];
    const trend = ((last - prices[0]) / prices[0]) * 100;
    let score = 0;
    if (rsi > 55) score += 2; else if (rsi < 45) score -= 2;
    if (last > ema20) score += 2; else score -= 2;
    if (trend > 3) score += 1; else if (trend < -3) score -= 1;
    return score > 2 ? "BULLISH" : score < -2 ? "BEARISH" : "NEUTRAL";
  };

  const dir4H = getDir(h4H);
  const dir1J = getDir(h1J);
  const dir1W = getDir(h1W);

  const bulls = [dir4H, dir1J, dir1W].filter(d => d === "BULLISH").length;
  const bears = [dir4H, dir1J, dir1W].filter(d => d === "BEARISH").length;

  let alignment: MultiTimeframeSignal["alignment"];
  let alignmentScore: number;

  if (bulls === 3)    { alignment = "strong_bull"; alignmentScore = 95; }
  else if (bears === 3) { alignment = "strong_bear"; alignmentScore = 5; }
  else if (bulls === 2) { alignment = "mixed_bull";  alignmentScore = 68; }
  else if (bears === 2) { alignment = "mixed_bear";  alignmentScore = 32; }
  else                  { alignment = "neutral";     alignmentScore = 50; }

  return { "4H": dir4H, "1J": dir1J, "1W": dir1W, alignment, alignmentScore };
}

// ─── Prédicteur principal ────────────────────────────────────────────────────
export function predictCrypto(input: CryptoPredictorInput): Prediction {
  const { price, history, timeframe, sentiment } = input;
  const reasons: string[] = [];

  const indicators = computeAllIndicators(history);
  const regime     = indicators.adx.regime;

  // Scores
  const fundamentalScore = computeFundamentalScore(input, reasons);
  const { score: technicalScore } = computeTechnicalScoreWeighted(history, price, timeframe, reasons, regime);

  // Score sentiment (0–100, 50 = neutre)
  const sentimentScore = sentiment?.overallScore ?? 50;
  if (sentimentScore >= 70) reasons.push(`Sentiment marché positif (${sentimentScore}/100) — avidité ou optimisme dominant`);
  else if (sentimentScore <= 30) reasons.push(`Sentiment marché négatif (${sentimentScore}/100) — peur dominante, potentiel rebond contrairant`);

  // Confluence multi-TF
  const multiTF = computeMultiTFSignal(input.history4H, input.history1J, input.history1W, price);
  let multiTFBonus = 0;
  if (multiTF) {
    if (multiTF.alignment === "strong_bull") { multiTFBonus = +8; reasons.push("Confluence multi-timeframe haussière (4H+1J+1W alignés) — signal très fort"); }
    else if (multiTF.alignment === "strong_bear") { multiTFBonus = -8; reasons.push("Confluence multi-timeframe baissière (4H+1J+1W alignés) — signal très fort"); }
    else if (multiTF.alignment === "mixed_bull") { multiTFBonus = +3; }
    else if (multiTF.alignment === "mixed_bear") { multiTFBonus = -3; }
  }

  // Score global : Fondamental 30% + Technique 50% + Sentiment 15% + Multi-TF 5%
  const baseScore = Math.round(fundamentalScore * 0.30 + technicalScore * 0.50 + sentimentScore * 0.15);
  const globalScore = Math.max(0, Math.min(100, baseScore + multiTFBonus));

  const direction: Direction = globalScore >= 62 ? "BULLISH" : globalScore <= 42 ? "BEARISH" : "NEUTRAL";

  // Cible et stop basés sur ATR
  const atr = indicators.atr || price * 0.02;
  const mults: Record<Timeframe, [number, number]> = { "4H": [3, 1.5], "1J": [6, 3], "1W": [12, 5] };
  const [tgtMult, stpMult] = mults[timeframe];

  const targetPrice = direction === "BULLISH" ? price + atr * tgtMult : direction === "BEARISH" ? price - atr * tgtMult : price + atr * (globalScore > 50 ? 1 : -1);
  const stopLoss    = direction === "BULLISH" ? price - atr * stpMult : price + atr * stpMult;
  const reward      = Math.abs(targetPrice - price);
  const risk        = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;

  const distFromNeutral = Math.abs(globalScore - 50);
  const confidence = Math.min(92, Math.max(35, 42 + distFromNeutral * 0.95 + (multiTF?.alignment === "strong_bull" || multiTF?.alignment === "strong_bear" ? 5 : 0)));

  return {
    direction,
    targetPrice:    parseFloat(targetPrice.toFixed(2)),
    stopLoss:       parseFloat(stopLoss.toFixed(2)),
    confidence:     parseFloat(confidence.toFixed(1)),
    fundamentalScore,
    technicalScore,
    sentimentScore,
    globalScore,
    riskRewardRatio,
    reasoning:      reasons.slice(0, 7),
    timeframe,
    regime,
    multiTF,
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
