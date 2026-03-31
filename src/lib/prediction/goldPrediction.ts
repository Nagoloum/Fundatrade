import type { HistoryPoint, MacroData, Prediction, Timeframe, Direction, MarketRegime, SentimentData, EconomicEvent } from "@/types";
import { computeAllIndicators } from "./indicators";
import { analyzePriceAction, analyzeSMC, analyzeRSI, analyzeMACD, analyzeIchimoku, analyzeADX } from "./strategies";

interface GoldInput {
  price: number; change24h: number; history: HistoryPoint[];
  macro: MacroData; timeframe: Timeframe;
  sentiment?: SentimentData; economicEvents?: EconomicEvent[];
}

function getGoldWeights(timeframe: Timeframe, regime: MarketRegime) {
  const base: Record<Timeframe, Record<string, number>> = {
    "4H": { rsi: 0.22, stochRSI: 0.18, macd: 0.17, priceAction: 0.16, ichimoku: 0.14, smc: 0.09, adx: 0.04 },
    "1J": { ichimoku: 0.22, priceAction: 0.20, rsi: 0.15, macd: 0.14, smc: 0.14, stochRSI: 0.10, adx: 0.05 },
    "1W": { ichimoku: 0.28, smc: 0.22, priceAction: 0.20, macd: 0.12, rsi: 0.10, stochRSI: 0.05, adx: 0.03 },
  };
  const w = { ...base[timeframe] };
  if (regime === "ranging") { w.rsi = (w.rsi||0)*1.5; w.stochRSI = (w.stochRSI||0)*1.5; w.macd = (w.macd||0)*0.6; }
  else if (regime === "trending_bull" || regime === "trending_bear") { w.ichimoku = (w.ichimoku||0)*1.4; w.macd = (w.macd||0)*1.2; }
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach(k => { w[k] = w[k] / total; });
  return w;
}

function computeGoldEconomicImpact(events: EconomicEvent[], reasons: string[]): number {
  if (!events || events.length === 0) return 0;
  let impact = 0;
  const now = Date.now();
  const upcomingHigh = events.filter(e => e.impact === "High" && new Date(e.date).getTime() > now);

  upcomingHigh.forEach(e => {
    const title = e.title.toLowerCase();
    // Rate hike = bearish for gold (opportunity cost)
    if (title.includes("interest rate") || title.includes("fomc")) {
      if (e.forecast && e.previous && parseFloat(e.forecast) > parseFloat(e.previous)) {
        impact -= 10; reasons.push(`${e.title} — hausse des taux anticipée, pression sur l'or`);
      } else { impact += 3; } // Rate hold/cut = bullish gold
    }
    // High inflation = bullish gold (hedge)
    else if (title.includes("cpi") || title.includes("inflation") || title.includes("pce")) {
      if (e.forecast && e.previous && parseFloat(e.forecast) > parseFloat(e.previous)) {
        impact += 10; reasons.push(`${e.title} — inflation en hausse, or comme valeur refuge`);
      } else impact += 3;
    }
    // Weak jobs = dollar weakens = bullish gold
    else if (title.includes("nonfarm") || title.includes("non-farm")) {
      if (e.forecast && e.previous && parseFloat(e.forecast) < parseFloat(e.previous)) {
        impact += 8; reasons.push(`NFP faible — dollar potentiellement sous pression, haussier or`);
      }
    }
    // Geopolitical uncertainty = bullish gold
    else if (title.includes("gdp") && e.forecast && e.previous && parseFloat(e.forecast) < parseFloat(e.previous)) {
      impact += 5; reasons.push("PIB en baisse — demande refuge potentielle pour l'or");
    }
  });

  return Math.max(-15, Math.min(18, impact));
}

function computeGoldFundamental(input: GoldInput, reasons: string[]): number {
  const { macro, change24h, history, price } = input;
  let score = 50;

  // Real rates = Fed - Inflation (most important for gold)
  const realRate = macro.fedRate - macro.inflation;
  if (realRate < -2)      { score += 22; reasons.push(`Taux réels très négatifs (${realRate.toFixed(1)}%) — environnement idéal pour l'or`); }
  else if (realRate < 0)  { score += 11; reasons.push(`Taux réels négatifs (${realRate.toFixed(1)}%) — or attractif vs obligations`); }
  else if (realRate > 3)  { score -= 16; reasons.push(`Taux réels élevés (+${realRate.toFixed(1)}%) — coût d'opportunité fort`); }
  else if (realRate > 1)  score -= 7;

  // DXY — strongest inverse correlation with gold
  if (macro.dxy) {
    if (macro.dxy > 107)       { score -= 18; reasons.push(`Dollar très fort (DXY ${macro.dxy.toFixed(1)}) — pression majeure sur l'or`); }
    else if (macro.dxy > 103)  score -= 8;
    else if (macro.dxy < 98)   { score += 16; reasons.push(`Dollar faible (DXY ${macro.dxy.toFixed(1)}) — haussier pour l'or`); }
    else if (macro.dxy < 101)  score += 6;
  }

  if (macro.inflation > 5)      { score += 16; reasons.push(`Inflation ${macro.inflation}% — forte demande refuge`); }
  else if (macro.inflation > 3) score += 6;
  else if (macro.inflation < 2) score -= 6;

  if (macro.m2Supply && macro.m2Supply > 21500) { score += 10; reasons.push("M2 expansif — dévaluation monétaire favorable à l'or"); }
  if (macro.yieldCurve !== undefined && macro.yieldCurve < -0.5) { score += 12; reasons.push(`Courbe inversée (${macro.yieldCurve.toFixed(2)}%) — signal de récession → or refuge`); }

  if (change24h > 1.5) score += 5; else if (change24h < -1.5) score -= 5;

  if (history.length >= 7) {
    const t7 = ((price - history.slice(-7)[0].price) / history.slice(-7)[0].price) * 100;
    if (t7 > 4) score += 5; else if (t7 < -4) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function computeGoldTechnical(history: HistoryPoint[], price: number, timeframe: Timeframe, reasons: string[], regime: MarketRegime): number {
  const indicators = computeAllIndicators(history);
  const weights    = getGoldWeights(timeframe, regime);
  const scores: Record<string, number> = {};

  const rsi = indicators.rsi;
  if (rsi < 32)      { scores.rsi = 84; reasons.push(`RSI or survendu (${rsi}) — rebond probable`); }
  else if (rsi < 44) scores.rsi = 38;
  else if (rsi > 72) { scores.rsi = 16; reasons.push(`RSI or suracheté (${rsi})`); }
  else if (rsi > 58) { scores.rsi = 66; }
  else               scores.rsi = 50;

  const stoch = indicators.stochRSI;
  if (stoch.zone === "oversold" && stoch.crossover === "bullish") { scores.stochRSI = 90; reasons.push("StochRSI croisement haussier en survente — signal fort"); }
  else if (stoch.zone === "oversold") scores.stochRSI = 75;
  else if (stoch.zone === "overbought" && stoch.crossover === "bearish") scores.stochRSI = 10;
  else if (stoch.zone === "overbought") scores.stochRSI = 25;
  else if (stoch.crossover === "bullish") scores.stochRSI = 65;
  else if (stoch.crossover === "bearish") scores.stochRSI = 35;
  else scores.stochRSI = 50;

  if (indicators.macd.crossover === "bullish") { scores.macd = 82; reasons.push("MACD or : croisement haussier"); }
  else if (indicators.macd.crossover === "bearish") { scores.macd = 18; reasons.push("MACD or : croisement baissier"); }
  else scores.macd = indicators.macd.macdLine > indicators.macd.signalLine ? 60 : 40;

  const ichi = indicators.ichimoku;
  if (ichi.pricePosition === "above_cloud" && ichi.cloudColor === "bullish") { scores.ichimoku = 78; reasons.push("Or au-dessus du nuage Ichimoku"); }
  else if (ichi.pricePosition === "below_cloud") scores.ichimoku = 22;
  else scores.ichimoku = ichi.tenkan > ichi.kijun ? 60 : 40;

  const adx = indicators.adx;
  scores.adx = adx.adx > 28 ? (adx.trend === "BULLISH" ? 70 : 30) : 50;

  const pa  = analyzePriceAction(history, price, timeframe);
  const smc = analyzeSMC(history, price, timeframe);
  scores.priceAction = pa.direction === "BULLISH" ? 50 + pa.confidence * 0.35 : pa.direction === "BEARISH" ? 50 - pa.confidence * 0.35 : 50;
  scores.smc         = smc.direction === "BULLISH" ? 50 + smc.confidence * 0.32 : smc.direction === "BEARISH" ? 50 - smc.confidence * 0.32 : 50;

  let emaBonus = 0;
  if (price > indicators.ema20)  emaBonus += 5;
  if (price > indicators.ema50)  emaBonus += 4;
  if (price > indicators.ema200) emaBonus += 6;
  const bb = indicators.bollingerBands;
  if (bb.percentB < 0.1) { emaBonus += 8; reasons.push("Bollinger inférieure — survente or"); }
  else if (bb.percentB > 0.9) emaBonus -= 8;

  const weighted = Object.entries(scores).reduce((sum, [key, val]) => sum + val * (weights[key] ?? 0.04), emaBonus * 0.06);
  return Math.max(0, Math.min(100, Math.round(50 + (weighted - 50))));
}

export function predictGold(input: GoldInput): Prediction {
  const { price, history, timeframe, sentiment, economicEvents } = input;
  const reasons: string[] = [];

  const indicators       = computeAllIndicators(history);
  const regime           = indicators.adx.regime;
  const fundamentalScore = computeGoldFundamental(input, reasons);
  const technicalScore   = computeGoldTechnical(history, price, timeframe, reasons, regime);
  const sentimentScore   = sentiment?.overallScore ?? 50;
  const econImpact       = computeGoldEconomicImpact(economicEvents || [], reasons);

  if (sentimentScore >= 70) reasons.push(`Sentiment or positif (${sentimentScore}/100)`);
  else if (sentimentScore <= 30) reasons.push(`Sentiment or négatif — valeur refuge possible`);

  // Gold: Fundamental 40% + Technical 42% + Sentiment 12% + Econ 6%
  const econScore = Math.max(0, Math.min(100, 50 + econImpact * 3));
  const globalScore = Math.max(0, Math.min(100, Math.round(
    fundamentalScore * 0.40 + technicalScore * 0.42 + sentimentScore * 0.12 + econScore * 0.06
  )));

  const direction: Direction = globalScore >= 62 ? "BULLISH" : globalScore <= 42 ? "BEARISH" : "NEUTRAL";

  const atr = indicators.atr || price * 0.008;
  const mults: Record<Timeframe, [number, number]> = { "4H": [2, 1], "1J": [4, 2], "1W": [8, 4] };
  const [tM, sM] = mults[timeframe];
  const targetPrice = direction === "BULLISH" ? price + atr * tM : direction === "BEARISH" ? price - atr * tM : price;
  const stopLoss    = direction === "BULLISH" ? price - atr * sM : price + atr * sM;
  const reward = Math.abs(targetPrice - price), risk = Math.abs(stopLoss - price);
  const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 1;
  const confidence = Math.min(88, Math.max(35, 40 + Math.abs(globalScore - 50) * 0.9));

  return {
    direction, targetPrice: parseFloat(targetPrice.toFixed(2)), stopLoss: parseFloat(stopLoss.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(1)), fundamentalScore, technicalScore, sentimentScore,
    globalScore, riskRewardRatio, reasoning: reasons.slice(0, 8), timeframe, regime, multiTF: undefined,
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
