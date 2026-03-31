import type { HistoryPoint, StrategyAnalysis, Direction, Timeframe, TechnicalIndicators } from "@/types";

function calcRSIInline(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const ch = prices.slice(1).map((p, i) => p - prices[i]);
  let g = 0, l = 0;
  for (let i = 0; i < period; i++) { if (ch[i] > 0) g += ch[i]; else l += Math.abs(ch[i]); }
  let ag = g / period, al = l / period;
  for (let i = period; i < ch.length; i++) {
    ag = (ag * (period - 1) + (ch[i] > 0 ? ch[i] : 0)) / period;
    al = (al * (period - 1) + (ch[i] < 0 ? Math.abs(ch[i]) : 0)) / period;
  }
  if (al === 0) return 100;
  return Math.round(100 - 100 / (1 + ag / al));
}

export function analyzePriceAction(history: HistoryPoint[], currentPrice: number, timeframe: Timeframe): StrategyAnalysis {
  if (history.length < 10) return { name: "Price Action", direction: "NEUTRAL", signal: "Données insuffisantes", confidence: 30, details: [], timeframe };

  const prices = history.map(h => h.price);
  const details: string[] = [];
  let score = 0;

  // Swing highs detection
  const swings: number[] = [];
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] > prices[i-1] && prices[i] > prices[i-2] && prices[i] > prices[i+1] && prices[i] > prices[i+2])
      swings.push(prices[i]);
  }
  const recentHighs = swings.slice(-3);
  if (recentHighs.length >= 2) {
    if (recentHighs.every((v, i) => i === 0 || v > recentHighs[i-1])) { score += 22; details.push("Structure haussière : Higher Highs confirmés (HH/HL)"); }
    else if (recentHighs.every((v, i) => i === 0 || v < recentHighs[i-1])) { score -= 22; details.push("Structure baissière : Lower Highs confirmés (LH/LL)"); }
  }

  // Key levels
  const sorted = [...prices].sort((a, b) => a - b);
  const support    = sorted[Math.floor(sorted.length * 0.2)];
  const resistance = sorted[Math.floor(sorted.length * 0.8)];
  const range = resistance - support;
  const pos   = range > 0 ? (currentPrice - support) / range : 0.5;

  if (pos > 0.78)      { score -= 12; details.push(`Résistance majeure à $${resistance.toFixed(0)} — risque de rejet`); }
  else if (pos < 0.22) { score += 12; details.push(`Support clé à $${support.toFixed(0)} — zone d'achat institutionnel`); }
  else details.push(`Prix en zone médiane (S: $${support.toFixed(0)} | R: $${resistance.toFixed(0)})`);

  // Recent trend
  const lb = Math.min(7, Math.floor(prices.length / 3));
  const recent = prices.slice(-lb);
  const trendPct = ((recent[recent.length - 1] - recent[0]) / recent[0]) * 100;
  if (trendPct > 3)       { score += 15; details.push(`Momentum haussier +${trendPct.toFixed(1)}% — tendance récente positive`); }
  else if (trendPct < -3) { score -= 15; details.push(`Momentum baissier ${trendPct.toFixed(1)}% — tendance récente négative`); }
  else details.push(`Consolidation (${trendPct.toFixed(1)}%) — marché en attente de catalyst`);

  // Patterns
  const last5 = prices.slice(-5);
  const peak = Math.max(...last5), trough = Math.min(...last5);
  if (Math.abs(last5[1] - last5[3]) / peak < 0.02 && last5[2] < last5[1] && last5[2] < last5[3]) {
    score -= 15; details.push("Pattern Double Top — signal de retournement baissier");
  } else if (Math.abs(last5[1] - last5[3]) / (trough || 1) < 0.02 && last5[2] > last5[1] && last5[2] > last5[3]) {
    score += 15; details.push("Pattern Double Bottom — signal de retournement haussier");
  }

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  return {
    name: "Price Action", direction,
    signal: direction === "BULLISH" ? `Structure haussière confirmée (score: +${score})` :
            direction === "BEARISH" ? `Structure baissière confirmée (score: ${score})` :
            "Zone de consolidation — attente de signal directionnel",
    confidence: Math.min(85, Math.max(35, 50 + Math.abs(score))), details, timeframe,
  };
}

export function analyzeSMC(history: HistoryPoint[], currentPrice: number, timeframe: Timeframe): StrategyAnalysis {
  if (history.length < 15) return { name: "SMC", direction: "NEUTRAL", signal: "Données insuffisantes", confidence: 30, details: [], timeframe };

  const prices = history.map(h => h.price);
  const details: string[] = [];
  let score = 0;

  const recent  = prices.slice(-10);
  const prevH   = Math.max(...prices.slice(-20, -10));
  const prevL   = Math.min(...prices.slice(-20, -10));
  const currH   = Math.max(...recent);
  const currL   = Math.min(...recent);

  if (currH > prevH * 1.01) { score += 28; details.push(`BOS Haussier — cassure structurelle à $${prevH.toFixed(0)} (Smart Money acheteur)`); }
  else if (currL < prevL * 0.99) { score -= 28; details.push(`BOS Baissier — cassure structurelle à $${prevL.toFixed(0)} (Smart Money vendeur)`); }

  const midR  = (Math.max(...recent) + Math.min(...recent)) / 2;
  const obBull = Math.min(...recent.slice(0, 5));
  const obBear = Math.max(...recent.slice(0, 5));

  if (currentPrice < midR && currentPrice > obBull) { score += 12; details.push(`Order Block haussier à $${obBull.toFixed(0)} — demande institutionnelle potentielle`); }
  else if (currentPrice > midR && currentPrice < obBear) { score -= 12; details.push(`Order Block baissier à $${obBear.toFixed(0)} — offre institutionnelle potentielle`); }

  let fvgFound = false;
  for (let i = 2; i < prices.length - 1; i++) {
    const gap = prices[i+1] - prices[i-1];
    if (Math.abs(gap) / prices[i-1] > 0.015 && !fvgFound) {
      fvgFound = true;
      if (gap > 0) { details.push("Fair Value Gap haussier — déséquilibre institutionnel"); score += 10; }
      else         { details.push("Fair Value Gap baissier — déséquilibre institutionnel"); score -= 10; }
      break;
    }
  }

  const equalHighs = prices.filter(p => Math.abs(p - Math.max(...prices)) / Math.max(...prices) < 0.005);
  if (equalHighs.length >= 2) details.push(`Liquidité au-dessus ($${Math.max(...prices).toFixed(0)}) — cible institutionnelle`);

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  return {
    name: "SMC", direction,
    signal: direction === "BULLISH" ? "Structure institutionnelle haussière — accumulation détectée" :
            direction === "BEARISH" ? "Structure institutionnelle baissière — distribution détectée" :
            "Consolidation — Smart Money en observation",
    confidence: Math.min(82, Math.max(35, 45 + Math.abs(score))), details, timeframe,
  };
}

export function analyzeRSI(indicators: TechnicalIndicators, currentPrice: number, history: HistoryPoint[], timeframe: Timeframe): StrategyAnalysis {
  const { rsi } = indicators;
  const details: string[] = [];
  let score = 0;

  if (rsi > 70)      { score -= 22; details.push(`RSI ${rsi} — Zone de surachat, pression vendeuse probable`); }
  else if (rsi > 60) { score += 12; details.push(`RSI ${rsi} — Momentum haussier fort`); }
  else if (rsi < 30) { score += 22; details.push(`RSI ${rsi} — Zone de survente, rebond technique probable`); }
  else if (rsi < 40) { score -= 12; details.push(`RSI ${rsi} — Momentum baissier modéré`); }
  else details.push(`RSI ${rsi} — Zone neutre (40–60)`);

  // Divergence
  if (history.length >= 10) {
    const prices = history.map(h => h.price);
    const priceUp = prices[prices.length - 1] > prices[prices.length - 6];
    const prevRSI = calcRSIInline(prices.slice(-10, -5));
    if (priceUp && rsi < prevRSI)   { score -= 14; details.push("Divergence baissière RSI — faiblesse cachée"); }
    else if (!priceUp && rsi > prevRSI) { score += 14; details.push("Divergence haussière RSI — force cachée"); }
  }

  if (rsi > 50) { score += 5; details.push("RSI > 50 : pression acheteuse dominante"); }
  else          { score -= 5; details.push("RSI < 50 : pression vendeuse dominante"); }

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  return {
    name: "RSI", direction,
    signal: rsi > 70 ? `RSI ${rsi} — Surachat : retournement imminent` :
            rsi < 30 ? `RSI ${rsi} — Survente : rebond probable` :
            rsi > 55 ? `RSI ${rsi} — Momentum haussier modéré` :
            rsi < 45 ? `RSI ${rsi} — Momentum baissier modéré` :
            `RSI ${rsi} — Neutre`,
    confidence: Math.min(88, Math.max(35, 50 + Math.abs(score))), details, timeframe,
  };
}

export function analyzeMACD(indicators: TechnicalIndicators, currentPrice: number, timeframe: Timeframe): StrategyAnalysis {
  const { macd } = indicators;
  const details: string[] = [];
  let score = 0;

  if (macd.macdLine > macd.signalLine) { score += 15; details.push(`MACD au-dessus du Signal — tendance haussière active`); }
  else { score -= 15; details.push(`MACD sous le Signal — tendance baissière active`); }

  if (macd.crossover === "bullish") { score += 28; details.push("Croisement haussier MACD × Signal — signal d'achat majeur"); }
  else if (macd.crossover === "bearish") { score -= 28; details.push("Croisement baissier MACD × Signal — signal de vente majeur"); }

  if (macd.histogram > 0) { score += 10; details.push(`Histogramme positif (${macd.histogram.toFixed(6)}) — accélération haussière`); }
  else { score -= 10; details.push(`Histogramme négatif (${macd.histogram.toFixed(6)}) — accélération baissière`); }

  if (macd.macdLine > 0) { score += 8; details.push("MACD > 0 : momentum haussier structurel"); }
  else { score -= 8; details.push("MACD < 0 : momentum baissier structurel"); }

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  return {
    name: "MACD", direction,
    signal: macd.crossover === "bullish" ? "Croisement haussier — achat confirmé" :
            macd.crossover === "bearish" ? "Croisement baissier — vente confirmée" :
            macd.macdLine > macd.signalLine ? "MACD > Signal — tendance haussière" :
            "MACD < Signal — tendance baissière",
    confidence: Math.min(90, Math.max(35, 45 + Math.abs(score) * 0.8)), details, timeframe,
  };
}

export function analyzeIchimoku(indicators: TechnicalIndicators, currentPrice: number, timeframe: Timeframe): StrategyAnalysis {
  const ichi = indicators.ichimoku;
  const details: string[] = [];
  let score = 0;

  if (ichi.pricePosition === "above_cloud") { score += 26; details.push(`Prix au-dessus du nuage ${ichi.cloudColor === "bullish" ? "haussier" : "baissier"} — bullish structurel`); }
  else if (ichi.pricePosition === "below_cloud") { score -= 26; details.push("Prix sous le nuage — bearish structurel, résistance forte"); }
  else details.push("Prix dans le nuage — incertitude, volatilité probable");

  if (ichi.tenkan > ichi.kijun) { score += 15; details.push(`TK Cross haussier (T:${ichi.tenkan.toFixed(0)} > K:${ichi.kijun.toFixed(0)})`); }
  else { score -= 15; details.push(`TK Cross baissier (T:${ichi.tenkan.toFixed(0)} < K:${ichi.kijun.toFixed(0)})`); }

  if (ichi.cloudColor === "bullish") { score += 10; details.push("Nuage futur haussier — support solide en vue"); }
  else { score -= 10; details.push("Nuage futur baissier — résistance en vue"); }

  if (ichi.chikou > currentPrice * 0.98) { score += 8; details.push("Chikou au-dessus du prix passé — confirmation triple"); }
  else score -= 8;

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  return {
    name: "Ichimoku", direction,
    signal: ichi.pricePosition === "above_cloud" ? "Au-dessus du nuage — tendance confirmée" :
            ichi.pricePosition === "below_cloud" ? "Sous le nuage — bearish structurel" :
            "Dans le nuage — zone de transition",
    confidence: Math.min(88, Math.max(35, 45 + Math.abs(score) * 0.7)), details, timeframe,
  };
}

export function analyzeADX(indicators: TechnicalIndicators, timeframe: Timeframe): StrategyAnalysis {
  const adx = indicators.adx;
  const details: string[] = [];
  let score = 0;

  if (adx.adx > 40)       { score += adx.trend === "BULLISH" ? 32 : -32; details.push(`ADX ${adx.adx} — Tendance très forte, suivre la direction`); }
  else if (adx.adx > 25)  { score += adx.trend === "BULLISH" ? 20 : -20; details.push(`ADX ${adx.adx} — Tendance confirmée`); }
  else if (adx.adx < 20)  { details.push(`ADX ${adx.adx} — Pas de tendance, marché en range (oscillateurs privilégiés)`); }
  else details.push(`ADX ${adx.adx} — Tendance émergente`);

  if (adx.plusDI > adx.minusDI) { score += 10; details.push(`+DI (${adx.plusDI}) > -DI (${adx.minusDI}) — pression acheteuse`); }
  else { score -= 10; details.push(`-DI (${adx.minusDI}) > +DI (${adx.plusDI}) — pression vendeuse`); }

  const regimeLabels: Record<string, string> = {
    trending_bull: "Tendance haussière forte", trending_bear: "Tendance baissière forte",
    ranging: "Marché en range", volatile: "Marché volatil — prudence", unknown: "Régime indéterminé",
  };
  details.push(`Régime : ${regimeLabels[adx.regime]}`);

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  return {
    name: "ADX", direction,
    signal: adx.regime === "ranging"       ? `Range (ADX ${adx.adx}) — oscillateurs plus fiables` :
            adx.regime === "trending_bull" ? `Tendance haussière forte (ADX ${adx.adx})` :
            adx.regime === "trending_bear" ? `Tendance baissière forte (ADX ${adx.adx})` :
            adx.regime === "volatile"      ? `Volatilité élevée (ADX ${adx.adx})` :
            `ADX ${adx.adx}`,
    confidence: Math.min(85, Math.max(30, 40 + Math.abs(adx.adx - 20) * 0.8)), details, timeframe,
  };
}
