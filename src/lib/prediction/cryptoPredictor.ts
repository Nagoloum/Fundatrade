import type { HistoryPoint, MacroData, Prediction, Timeframe, Direction, MarketRegime, MultiTimeframeSignal, SentimentData, EconomicEvent } from "@/types";
import { computeAllIndicators, calculateRSI, calculateEMA } from "./indicators";
import { analyzePriceAction, analyzeSMC, analyzeRSI, analyzeMACD, analyzeIchimoku, analyzeADX } from "./strategies";

interface CryptoPredictorInput {
  price: number; change24h: number; volume24h?: number;
  history: HistoryPoint[]; macro: MacroData; timeframe: Timeframe;
  sentiment?: SentimentData; economicEvents?: EconomicEvent[];
  history4H?: HistoryPoint[]; history1J?: HistoryPoint[]; history1W?: HistoryPoint[];
}

function getStrategyWeights(timeframe: Timeframe, regime: MarketRegime) {
  const base: Record<Timeframe, Record<string, number>> = {
    "4H": { priceAction: 0.14, smc: 0.10, rsi: 0.22, macd: 0.20, stochRSI: 0.14, ichimoku: 0.12, adx: 0.08 },
    "1J": { priceAction: 0.20, smc: 0.18, rsi: 0.15, macd: 0.15, stochRSI: 0.10, ichimoku: 0.14, adx: 0.08 },
    "1W": { priceAction: 0.22, smc: 0.22, rsi: 0.12, macd: 0.12, stochRSI: 0.07, ichimoku: 0.18, adx: 0.07 },
  };
  const w = { ...base[timeframe] };
  if (regime === "ranging") { w.rsi = (w.rsi||0)*1.4; w.stochRSI = (w.stochRSI||0)*1.4; w.macd = (w.macd||0)*0.6; }
  else if (regime === "trending_bull" || regime === "trending_bear") { w.ichimoku = (w.ichimoku||0)*1.5; w.macd = (w.macd||0)*1.3; w.rsi = (w.rsi||0)*0.75; }
  else if (regime === "volatile") { w.priceAction = (w.priceAction||0)*1.4; w.smc = (w.smc||0)*1.3; }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach(k => { w[k] = w[k] / total; });
  return w;
}

function computeEconomicImpact(events: EconomicEvent[], reasons: string[]): number {
  if (!events || events.length === 0) return 0;
  let impact = 0;
  const now = Date.now();

  const upcomingHigh = events.filter(e => {
    const d = new Date(e.date).getTime();
    return e.impact === "High" && d > now && d < now + 7 * 86400 * 1000;
  });

  upcomingHigh.forEach(e => {
    const title = e.title.toLowerCase();
    // Events bearish for crypto (rate hikes, strong dollar)
    if (title.includes("interest rate") || title.includes("fomc")) {
      if (e.forecast && e.previous && parseFloat(e.forecast) > parseFloat(e.previous)) {
        impact -= 8; reasons.push(`${e.title} — hausse de taux anticipée, pression sur le BTC`);
      } else { impact -= 3; }
    }
    // Events bullish for crypto (weak dollar, inflation hedge)
    else if (title.includes("cpi") || title.includes("inflation")) {
      impact += 3; // High inflation = crypto hedge
    }
    else if (title.includes("nonfarm") || title.includes("non-farm")) {
      if (e.forecast && e.previous && parseFloat(e.forecast) < parseFloat(e.previous)) {
        impact += 4; reasons.push(`NFP faible anticipé — dollar potentiellement sous pression`);
      }
    }
    // General high impact uncertainty = volatility = slight bearish
    else { impact -= 2; }
  });

  if (upcomingHigh.length > 3) { reasons.push(`${upcomingHigh.length} événements High Impact cette semaine — volatilité accrue`); }

  return Math.max(-15, Math.min(15, impact));
}

function computeTechnical(history: HistoryPoint[], price: number, timeframe: Timeframe, reasons: string[], regime: MarketRegime) {
  const indicators = computeAllIndicators(history);
  const weights    = getStrategyWeights(timeframe, regime);
  const scores: Record<string, number> = {};

  // RSI
  const rsi = indicators.rsi;
  if (rsi < 30)      { scores.rsi = 82; reasons.push(`RSI survendu (${rsi}) — rebond technique attendu`); }
  else if (rsi < 42) scores.rsi = 38;
  else if (rsi > 70) { scores.rsi = 18; reasons.push(`RSI suracheté (${rsi}) — correction probable`); }
  else if (rsi > 58) { scores.rsi = 66; reasons.push(`RSI haussier (${rsi}) — momentum acheteur`); }
  else scores.rsi = 50;

  // StochRSI
  const stoch = indicators.stochRSI;
  if (stoch.zone === "oversold" && stoch.crossover === "bullish") { scores.stochRSI = 90; reasons.push(`StochRSI croisement haussier en survente (K:${stoch.k}) — signal fort`); }
  else if (stoch.zone === "oversold") scores.stochRSI = 76;
  else if (stoch.zone === "overbought" && stoch.crossover === "bearish") { scores.stochRSI = 10; reasons.push(`StochRSI croisement baissier en surachat — signal fort`); }
  else if (stoch.zone === "overbought") scores.stochRSI = 24;
  else if (stoch.crossover === "bullish") scores.stochRSI = 66;
  else if (stoch.crossover === "bearish") scores.stochRSI = 34;
  else scores.stochRSI = 50;

  // MACD
  if (indicators.macd.crossover === "bullish") { scores.macd = 86; reasons.push("Croisement haussier MACD — signal de retournement"); }
  else if (indicators.macd.crossover === "bearish") { scores.macd = 14; reasons.push("Croisement baissier MACD — signal de retournement"); }
  else scores.macd = indicators.macd.macdLine > indicators.macd.signalLine ? 63 : 37;

  // Ichimoku
  const ichi = indicators.ichimoku;
  let ichiScore = 50;
  if (ichi.pricePosition === "above_cloud" && ichi.cloudColor === "bullish") { ichiScore = 78; reasons.push("Prix au-dessus du nuage Ichimoku haussier"); }
  else if (ichi.pricePosition === "below_cloud") ichiScore = 22;
  else if (ichi.pricePosition === "above_cloud") ichiScore = 64;
  if (ichi.tenkan > ichi.kijun) ichiScore += 8; else ichiScore -= 8;
  scores.ichimoku = Math.max(0, Math.min(100, ichiScore));

  // ADX
  const adx = indicators.adx;
  if (adx.adx > 30) {
    scores.adx = adx.trend === "BULLISH" ? 72 : 28;
    if (adx.adx > 45) { scores.adx = adx.trend === "BULLISH" ? 84 : 16; reasons.push(`ADX ${adx.adx} — tendance très forte`); }
  } else { scores.adx = 50; }

  // Price Action & SMC
  const pa  = analyzePriceAction(history, price, timeframe);
  const smc = analyzeSMC(history, price, timeframe);
  scores.priceAction = pa.direction === "BULLISH" ? 50 + pa.confidence * 0.4 : pa.direction === "BEARISH" ? 50 - pa.confidence * 0.4 : 50;
  scores.smc         = smc.direction === "BULLISH" ? 50 + smc.confidence * 0.38 : smc.direction === "BEARISH" ? 50 - smc.confidence * 0.38 : 50;

  // EMA
  let emaScore = 50;
  if (price > indicators.ema20)  emaScore += 8;
  if (price > indicators.ema50)  emaScore += 7;
  if (indicators.ema200 > 0 && price > indicators.ema200) { emaScore += 9; reasons.push("Prix au-dessus de l'EMA200 — bullish long terme"); }
  const bb = indicators.bollingerBands;
  if (bb.percentB < 0.1) { emaScore += 10; reasons.push("Bandes Bollinger — survente extrême"); }
  else if (bb.percentB > 0.9) emaScore -= 10;
  scores.ema = Math.max(0, Math.min(100, emaScore));

  const weighted =
    (scores.priceAction * weights.priceAction) +
    (scores.smc         * weights.smc) +
    (scores.rsi         * weights.rsi) +
    (scores.macd        * weights.macd) +
    (scores.stochRSI    * weights.stochRSI) +
    (scores.ichimoku    * weights.ichimoku) +
    (scores.adx         * weights.adx) +
    (scores.ema         * 0.05);

  return { score: Math.max(0, Math.min(100, Math.round(weighted))), strategyScores: scores };
}

function computeFundamental(input: CryptoPredictorInput, reasons: string[]): number {
  const { price, change24h, volume24h, history, macro } = input;
  let score = 50;

  if (macro.fedRate < 2.5)    { score += 14; reasons.push(`Taux Fed bas (${macro.fedRate}%) — liquidités abondantes`); }
  else if (macro.fedRate < 4) score += 7;
  else if (macro.fedRate > 5) { score -= 14; reasons.push(`Taux Fed élevés (${macro.fedRate}%) — pression sur les cryptos`); }

  if (macro.inflation > 5)      { score += 9; reasons.push(`Inflation ${macro.inflation}% — demande de hedge crypto`); }
  else if (macro.inflation < 2) score -= 5;

  if (macro.dxy) {
    if (macro.dxy < 98)       { score += 11; reasons.push(`DXY faible (${macro.dxy.toFixed(1)}) — haussier crypto`); }
    else if (macro.dxy > 105) { score -= 11; reasons.push(`DXY fort (${macro.dxy.toFixed(1)}) — pression baissière`); }
  }

  if (macro.m2Supply && macro.m2Supply > 21000) score += 6;
  if (macro.yieldCurve !== undefined && macro.yieldCurve < -0.5) score += 5;

  if (change24h > 5)       { score += 8; reasons.push(`Forte hausse 24h (+${change24h.toFixed(1)}%)`); }
  else if (change24h > 2)  score += 4;
  else if (change24h < -5) { score -= 8; reasons.push(`Forte baisse 24h (${change24h.toFixed(1)}%)`); }
  else if (change24h < -2) score -= 4;

  if (history.length >= 7) {
    const trend7 = ((price - history.slice(-7)[0].price) / history.slice(-7)[0].price) * 100;
    if (trend7 > 8) score += 6; else if (trend7 < -8) score -= 6;
  }

  return Math.max(0, Math.min(100, score));
}

function computeMultiTF(h4H?: HistoryPoint[], h1J?: HistoryPoint[], h1W?: HistoryPoint[]): MultiTimeframeSignal | undefined {
  if (!h4H && !h1J && !h1W) return undefined;
  const getDir = (history?: HistoryPoint[]): Direction => {
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
  const d4H = getDir(h4H), d1J = getDir(h1J), d1W = getDir(h1W);
  const bulls = [d4H, d1J, d1W].filter(d => d === "BULLISH").length;
  const bears = [d4H, d1J, d1W].filter(d => d === "BEARISH").length;
  let alignment: MultiTimeframeSignal["alignment"], alignmentScore: number;
  if (bulls === 3)    { alignment = "strong_bull"; alignmentScore = 95; }
  else if (bears === 3) { alignment = "strong_bear"; alignmentScore = 5; }
  else if (bulls === 2) { alignment = "mixed_bull";  alignmentScore = 68; }
  else if (bears === 2) { alignment = "mixed_bear";  alignmentScore = 32; }
  else                  { alignment = "neutral";     alignmentScore = 50; }
  return { "4H": d4H, "1J": d1J, "1W": d1W, alignment, alignmentScore };
}

export function predictCrypto(input: CryptoPredictorInput): Prediction {
  const { price, history, timeframe, sentiment, economicEvents } = input;
  const reasons: string[] = [];

  const indicators = computeAllIndicators(history);
  const regime     = indicators.adx.regime;

  const fundamentalScore = computeFundamental(input, reasons);
  const { score: technicalScore } = computeTechnical(history, price, timeframe, reasons, regime);
  const sentimentScore = sentiment?.overallScore ?? 50;
  if (sentimentScore >= 70) reasons.push(`Sentiment positif (${sentimentScore}/100) — avidité dominante`);
  else if (sentimentScore <= 30) reasons.push(`Sentiment négatif (${sentimentScore}/100) — peur dominante`);

  const econImpact = computeEconomicImpact(economicEvents || [], reasons);

  const multiTF = computeMultiTF(input.history4H, input.history1J, input.history1W);
  let multiTFBonus = 0;
  if (multiTF) {
    if (multiTF.alignment === "strong_bull") { multiTFBonus = +8; reasons.push("Confluence multi-TF haussière (4H+1J+1W)"); }
    else if (multiTF.alignment === "strong_bear") { multiTFBonus = -8; reasons.push("Confluence multi-TF baissière (4H+1J+1W)"); }
    else if (multiTF.alignment === "mixed_bull") multiTFBonus = +3;
    else if (multiTF.alignment === "mixed_bear") multiTFBonus = -3;
  }

  const baseScore = Math.round(fundamentalScore * 0.28 + technicalScore * 0.50 + sentimentScore * 0.15 + (econImpact + 50) * 0.07);
  const globalScore = Math.max(0, Math.min(100, baseScore + multiTFBonus));

  const direction: Direction = globalScore >= 62 ? "BULLISH" : globalScore <= 42 ? "BEARISH" : "NEUTRAL";

  const atr = indicators.atr || price * 0.022;
  const mults: Record<Timeframe, [number, number]> = { "4H": [3, 1.5], "1J": [6, 3], "1W": [12, 5] };
  const [tM, sM] = mults[timeframe];

  const targetPrice = direction === "BULLISH" ? price + atr * tM : direction === "BEARISH" ? price - atr * tM : price + atr * (globalScore > 50 ? 1 : -1);
  const stopLoss    = direction === "BULLISH" ? price - atr * sM : price + atr * sM;
  const reward = Math.abs(targetPrice - price), risk = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;
  const distFromNeutral = Math.abs(globalScore - 50);
  const confidence = Math.min(92, Math.max(35, 42 + distFromNeutral * 0.96));

  return {
    direction, targetPrice: parseFloat(targetPrice.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(1)), fundamentalScore, technicalScore, sentimentScore,
    globalScore, riskRewardRatio, reasoning: reasons.slice(0, 8), timeframe, regime, multiTF,
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
