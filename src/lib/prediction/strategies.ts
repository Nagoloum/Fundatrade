import type {
  HistoryPoint,
  StrategyAnalysis,
  PriceActionAnalysis,
  SMCAnalysis,
  Direction,
  Timeframe,
  TechnicalIndicators,
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// STRATÉGIES D'ANALYSE — Price Action, SMC, RSI, MACD
// ═══════════════════════════════════════════════════════════════════════════

// RSI inline pour éviter les imports circulaires
function calculateRSIInline(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  let gains = 0, losses = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
}

export function analyzePriceAction(
  history: HistoryPoint[],
  currentPrice: number,
  timeframe: Timeframe
): StrategyAnalysis {
  if (history.length < 10) {
    return {
      name: "Price Action",
      direction: "NEUTRAL",
      signal: "Données insuffisantes pour l'analyse Price Action",
      confidence: 30,
      details: [],
      timeframe,
    };
  }

  const prices = history.map((h) => h.price);
  const details: string[] = [];
  let score = 0;

  // Structure de marché
  const swingPoints: number[] = [];
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] > prices[i-1] && prices[i] > prices[i-2] &&
        prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
      swingPoints.push(prices[i]);
    }
  }
  const recentHighs = swingPoints.slice(-3);
  if (recentHighs.length >= 2) {
    const isHH = recentHighs.every((v, i) => i === 0 || v > recentHighs[i - 1]);
    const isLL = recentHighs.every((v, i) => i === 0 || v < recentHighs[i - 1]);
    if (isHH) { score += 20; details.push("Structure haussière confirmée : sommets successifs croissants (Higher Highs)"); }
    else if (isLL) { score -= 20; details.push("Structure baissière : sommets successifs décroissants (Lower Highs)"); }
  }

  // Support/Résistance
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const support    = sortedPrices[Math.floor(sortedPrices.length * 0.2)];
  const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.8)];
  const range      = resistance - support;
  const positionInRange = range > 0 ? (currentPrice - support) / range : 0.5;

  if (positionInRange > 0.75) {
    details.push(`Prix proche de la résistance ($${resistance.toFixed(2)}) — risque de rejet`);
    score -= 10;
  } else if (positionInRange < 0.25) {
    details.push(`Prix sur le support ($${support.toFixed(2)}) — potentiel rebond`);
    score += 10;
  } else {
    details.push(`Prix dans la zone médiane (support : $${support.toFixed(2)}, résistance : $${resistance.toFixed(2)})`);
  }

  // Tendance récente
  const lookback = Math.min(7, Math.floor(prices.length / 3));
  const recentSlice = prices.slice(-lookback);
  const trendPct = ((recentSlice[recentSlice.length - 1] - recentSlice[0]) / recentSlice[0]) * 100;
  if (trendPct > 3) {
    score += 15;
    details.push(`Tendance haussière récente : +${trendPct.toFixed(1)}% sur les ${lookback} dernières périodes`);
  } else if (trendPct < -3) {
    score -= 15;
    details.push(`Tendance baissière récente : ${trendPct.toFixed(1)}% sur les ${lookback} dernières périodes`);
  } else {
    details.push(`Consolidation : variation de ${trendPct.toFixed(1)}% — attente de breakout`);
  }

  // Pattern detection
  const last5 = prices.slice(-5);
  const peak   = Math.max(...last5);
  const trough = Math.min(...last5);
  let pattern: string | undefined;
  if (Math.abs(last5[1] - last5[3]) / peak < 0.02 && last5[2] < last5[1] && last5[2] < last5[3]) {
    pattern = "Double Top";
    score -= 15;
    details.push("Pattern Double Top détecté — signal de retournement baissier");
  } else if (Math.abs(last5[1] - last5[3]) / trough < 0.02 && last5[2] > last5[1] && last5[2] > last5[3]) {
    pattern = "Double Bottom";
    score += 15;
    details.push("Pattern Double Bottom détecté — signal de retournement haussier");
  }

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(85, Math.max(35, 50 + Math.abs(score)));

  return {
    name: "Price Action",
    direction,
    signal: direction === "BULLISH" ? `Structure haussière — score +${score}` :
             direction === "BEARISH" ? `Structure baissière — score ${score}` :
             "Zone de consolidation — attente de signal clair",
    confidence,
    details,
    timeframe,
    pattern,
    keyLevels: { support: [support], resistance: [resistance] },
  } as PriceActionAnalysis;
}

export function analyzeSMC(
  history: HistoryPoint[],
  currentPrice: number,
  timeframe: Timeframe
): StrategyAnalysis {
  if (history.length < 15) {
    return { name: "SMC", direction: "NEUTRAL", signal: "Données insuffisantes pour l'analyse SMC", confidence: 30, details: [], timeframe };
  }

  const prices = history.map((h) => h.price);
  const details: string[] = [];
  let score = 0;

  const recent   = prices.slice(-10);
  const prevHigh = Math.max(...prices.slice(-20, -10));
  const prevLow  = Math.min(...prices.slice(-20, -10));
  const currHigh = Math.max(...recent);
  const currLow  = Math.min(...recent);

  let structureBreak: "BOS" | "CHoCH" | null = null;
  if (currHigh > prevHigh * 1.01) {
    structureBreak = "BOS"; score += 25;
    details.push(`BOS haussier confirmé : cassure du plafond précédent à $${prevHigh.toFixed(2)}`);
  } else if (currLow < prevLow * 0.99) {
    structureBreak = "BOS"; score -= 25;
    details.push(`BOS baissier confirmé : cassure du plancher précédent à $${prevLow.toFixed(2)}`);
  }

  const midRecent  = (Math.max(...recent) + Math.min(...recent)) / 2;
  const obBullish  = Math.min(...recent.slice(0, 5));
  const obBearish  = Math.max(...recent.slice(0, 5));

  if (currentPrice > midRecent && currentPrice < obBearish) {
    details.push(`Prix dans un Order Block baissier potentiel (~$${obBearish.toFixed(2)}) — surveiller un rejet`);
    score -= 10;
  } else if (currentPrice < midRecent && currentPrice > obBullish) {
    details.push(`Prix sur un Order Block haussier potentiel (~$${obBullish.toFixed(2)}) — potentiel rebond institutionnel`);
    score += 10;
  }

  let fvgFound = false;
  for (let i = 2; i < prices.length - 1; i++) {
    const gap    = prices[i + 1] - prices[i - 1];
    const gapPct = Math.abs(gap) / prices[i - 1];
    if (gapPct > 0.015 && !fvgFound) {
      fvgFound = true;
      if (gap > 0) { details.push("Fair Value Gap haussier détecté — déséquilibre institutionnel à combler vers le haut"); score += 12; }
      else          { details.push("Fair Value Gap baissier détecté — déséquilibre de prix à combler vers le bas"); score -= 12; }
      break;
    }
  }

  const equalHighs = prices.filter(p => Math.abs(p - Math.max(...prices)) / Math.max(...prices) < 0.005);
  if (equalHighs.length >= 2) {
    details.push(`Liquidité accumulée au-dessus ($${Math.max(...prices).toFixed(2)}) — cible potentielle pour les institutionnels`);
  }

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(82, Math.max(35, 45 + Math.abs(score)));

  return {
    name: "SMC",
    direction,
    signal: direction === "BULLISH" ? `Structure institutionnelle haussière — ${structureBreak ?? "accumulation détectée"}` :
             direction === "BEARISH" ? `Pression institutionnelle baissière — ${structureBreak ?? "distribution détectée"}` :
             "Zone de consolidation — les institutionnels accumulent ou distribuent",
    confidence,
    details,
    timeframe,
    structureBreak,
    orderBlocks: [
      { price: obBullish, type: "bullish", strength: "strong" },
      { price: obBearish, type: "bearish", strength: "weak" },
    ],
    fairValueGaps: [],
    liquidityZones: [Math.max(...prices), Math.min(...prices)],
  } as SMCAnalysis;
}

export function analyzeRSI(
  indicators: TechnicalIndicators,
  currentPrice: number,
  history: HistoryPoint[],
  timeframe: Timeframe
): StrategyAnalysis {
  const { rsi } = indicators;
  const details: string[] = [];
  let score = 0;

  if (rsi > 70) {
    score -= 20;
    details.push(`RSI suracheté (${rsi}) — pression vendeuse probable, risque de correction`);
  } else if (rsi > 60) {
    score += 10;
    details.push(`RSI en zone haussière (${rsi}) — momentum positif, surveiller la résistance à 70`);
  } else if (rsi < 30) {
    score += 20;
    details.push(`RSI survendu (${rsi}) — potentiel rebond technique imminent`);
  } else if (rsi < 40) {
    score -= 10;
    details.push(`RSI en zone baissière (${rsi}) — momentum négatif`);
  } else {
    details.push(`RSI neutre (${rsi}) — pas de signal extrême entre 40 et 60`);
  }

  // Divergence RSI/Prix (sans require dynamique)
  if (history.length >= 10) {
    const prices       = history.map(h => h.price);
    const recentPrices = prices.slice(-5);
    const prevPrices   = prices.slice(-10, -5);
    const priceUp      = recentPrices[recentPrices.length - 1] > prevPrices[0];
    const prevRSI      = calculateRSIInline(prevPrices);

    if (priceUp && indicators.rsi < prevRSI) {
      score -= 15;
      details.push("Divergence baissière RSI : le prix monte mais le RSI baisse — signe de faiblesse cachée");
    } else if (!priceUp && indicators.rsi > prevRSI) {
      score += 15;
      details.push("Divergence haussière RSI : le prix baisse mais le RSI monte — force cachée");
    }
  }

  if (rsi > 50) { score += 5; details.push("RSI au-dessus de 50 : les acheteurs dominent à court terme"); }
  else          { score -= 5; details.push("RSI sous 50 : les vendeurs dominent à court terme"); }

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(88, Math.max(35, 50 + Math.abs(score)));

  return {
    name: "RSI",
    direction,
    signal: `RSI à ${rsi} — ${
      rsi > 70 ? "Zone de surachat — attention au retournement" :
      rsi < 30 ? "Zone de survente — rebond probable" :
      rsi > 55 ? "Momentum haussier modéré" :
      rsi < 45 ? "Momentum baissier modéré" :
      "Zone neutre — pas de signal fort"
    }`,
    confidence,
    details,
    timeframe,
  };
}

export function analyzeMACD(
  indicators: TechnicalIndicators,
  currentPrice: number,
  timeframe: Timeframe
): StrategyAnalysis {
  const { macd } = indicators;
  const details: string[] = [];
  let score = 0;

  if (macd.macdLine > macd.signalLine) {
    score += 15;
    details.push(`MACD (${macd.macdLine.toFixed(4)}) au-dessus de la ligne Signal (${macd.signalLine.toFixed(4)}) — tendance haussière`);
  } else {
    score -= 15;
    details.push(`MACD (${macd.macdLine.toFixed(4)}) sous la ligne Signal (${macd.signalLine.toFixed(4)}) — tendance baissière`);
  }

  if (macd.crossover === "bullish") {
    score += 25;
    details.push("Croisement haussier MACD x Signal — signal d'achat fort, changement de tendance probable");
  } else if (macd.crossover === "bearish") {
    score -= 25;
    details.push("Croisement baissier MACD x Signal — signal de vente fort, inversion de tendance probable");
  }

  if (macd.histogram > 0) {
    score += 10;
    details.push(`Histogramme positif (${macd.histogram.toFixed(4)}) — pression haussière en cours`);
  } else {
    score -= 10;
    details.push(`Histogramme négatif (${macd.histogram.toFixed(4)}) — pression baissière en cours`);
  }

  if (macd.macdLine > 0) {
    score += 8;
    details.push("MACD positif : momentum haussier dominant sur la période analysée");
  } else {
    score -= 8;
    details.push("MACD négatif : momentum baissier dominant sur la période analysée");
  }

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(90, Math.max(35, 45 + Math.abs(score) * 0.8));

  return {
    name: "MACD",
    direction,
    signal:
      macd.crossover === "bullish" ? "Croisement haussier actif — signal d'achat confirmé" :
      macd.crossover === "bearish" ? "Croisement baissier actif — signal de vente confirmé" :
      macd.macdLine > macd.signalLine ? "MACD au-dessus du signal — tendance haussière en cours" :
      "MACD sous le signal — tendance baissière en cours",
    confidence,
    details,
    timeframe,
  };
}

// ─── NOUVEAU : Analyse Ichimoku ──────────────────────────────────────────────
export function analyzeIchimoku(
  indicators: TechnicalIndicators,
  currentPrice: number,
  timeframe: Timeframe
): StrategyAnalysis {
  const ichi = indicators.ichimoku;
  const details: string[] = [];
  let score = 0;

  // Position par rapport au nuage
  if (ichi.pricePosition === "above_cloud") {
    score += 25;
    details.push(`Prix au-dessus du nuage Ichimoku ${ichi.cloudColor === "bullish" ? "haussier" : "baissier"} — tendance dominante haussière`);
  } else if (ichi.pricePosition === "below_cloud") {
    score -= 25;
    details.push(`Prix sous le nuage Ichimoku — tendance dominante baissière, résistance forte`);
  } else {
    details.push(`Prix dans le nuage Ichimoku — zone d'incertitude, volatilité probable`);
  }

  // Croisement TK (Tenkan/Kijun)
  if (ichi.tenkan > ichi.kijun) {
    score += 15;
    details.push(`Tenkan (${ichi.tenkan.toFixed(2)}) au-dessus de Kijun (${ichi.kijun.toFixed(2)}) — momentum haussier court terme`);
  } else {
    score -= 15;
    details.push(`Tenkan sous Kijun — momentum baissier, pas d'entrée recommandée`);
  }

  // Couleur du nuage (tendance future)
  if (ichi.cloudColor === "bullish") {
    score += 10;
    details.push("Nuage futur haussier (Senkou A > Senkou B) — support futur solide");
  } else {
    score -= 10;
    details.push("Nuage futur baissier (Senkou B > Senkou A) — résistance future");
  }

  // Chikou (lagging span)
  const chikouAbove = ichi.chikou > currentPrice * 0.98;
  if (chikouAbove) {
    score += 8;
    details.push("Chikou Span au-dessus du prix passé — confirmation haussière triple");
  } else {
    score -= 8;
  }

  const direction: Direction = score > 20 ? "BULLISH" : score < -20 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(88, Math.max(35, 45 + Math.abs(score) * 0.7));

  return {
    name: "Ichimoku",
    direction,
    signal:
      ichi.pricePosition === "above_cloud" ? `Au-dessus du nuage ${ichi.cloudColor === "bullish" ? "haussier" : ""} — tendance confirmée` :
      ichi.pricePosition === "below_cloud" ? "Sous le nuage — bearish structurel" :
      "Dans le nuage — zone de transition",
    confidence,
    details,
    timeframe,
  };
}

// ─── NOUVEAU : Analyse ADX ───────────────────────────────────────────────────
export function analyzeADX(
  indicators: TechnicalIndicators,
  timeframe: Timeframe
): StrategyAnalysis {
  const adx = indicators.adx;
  const details: string[] = [];
  let score = 0;

  // Force de la tendance
  if (adx.adx > 40) {
    details.push(`ADX très fort (${adx.adx}) — tendance puissante et fiable, suivre la direction`);
    score += adx.trend === "BULLISH" ? 30 : -30;
  } else if (adx.adx > 25) {
    details.push(`ADX fort (${adx.adx}) — tendance confirmée, momentum solide`);
    score += adx.trend === "BULLISH" ? 20 : -20;
  } else if (adx.adx < 20) {
    details.push(`ADX faible (${adx.adx}) — pas de tendance claire, marché en range — RSI et oscillateurs plus fiables`);
  } else {
    details.push(`ADX modéré (${adx.adx}) — tendance émergente, surveiller la confirmation`);
  }

  // +DI vs -DI
  if (adx.plusDI > adx.minusDI) {
    score += 10;
    details.push(`+DI (${adx.plusDI}) > -DI (${adx.minusDI}) — pression achetrice dominante`);
  } else {
    score -= 10;
    details.push(`-DI (${adx.minusDI}) > +DI (${adx.plusDI}) — pression vendeuse dominante`);
  }

  // Régime de marché
  const regimeLabels: Record<string, string> = {
    trending_bull: "Tendance haussière active",
    trending_bear: "Tendance baissière active",
    ranging:       "Marché en range — oscillateurs privilégiés",
    volatile:      "Marché volatil — prudence, positions réduites",
    unknown:       "Régime indéterminé",
  };
  details.push(`Régime : ${regimeLabels[adx.regime] ?? adx.regime}`);

  const direction: Direction = score > 15 ? "BULLISH" : score < -15 ? "BEARISH" : "NEUTRAL";
  const confidence = Math.min(85, Math.max(30, 40 + Math.abs(adx.adx - 20) * 0.8));

  return {
    name: "ADX",
    direction,
    signal:
      adx.regime === "ranging"       ? `Range détecté (ADX ${adx.adx}) — oscillateurs privilégiés` :
      adx.regime === "trending_bull" ? `Tendance haussière forte (ADX ${adx.adx})` :
      adx.regime === "trending_bear" ? `Tendance baissière forte (ADX ${adx.adx})` :
      adx.regime === "volatile"      ? `Marché volatil (ADX ${adx.adx}) — prudence` :
      `ADX ${adx.adx} — tendance ${adx.trend.toLowerCase()}`,
    confidence,
    details,
    timeframe,
  };
}
