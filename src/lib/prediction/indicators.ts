import type {
  HistoryPoint,
  TechnicalIndicators,
  MACDData,
  BollingerBands,
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// CALCULS TECHNIQUES — Indicateurs financiers
// Tous les calculs sont faits sur les données historiques brutes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RSI — Relative Strength Index
 * Mesure la vitesse et l'amplitude des mouvements de prix (0–100)
 * Suracheté > 70, Survendu < 30
 */
export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  let gains = 0;
  let losses = 0;

  // Moyenne initiale sur la période
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i];
    else losses += Math.abs(changes[i]);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Lissage EMA (Wilder)
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

/**
 * EMA — Exponential Moving Average
 * Moyenne mobile exponentielle, donne plus de poids aux données récentes
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;

  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

/**
 * MACD — Moving Average Convergence Divergence
 * Signal de tendance basé sur la différence entre EMA12 et EMA26
 */
export function calculateMACD(prices: number[]): MACDData {
  if (prices.length < 26) {
    return {
      macdLine: 0,
      signalLine: 0,
      histogram: 0,
      crossover: "none",
    };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Signal = EMA9 de la ligne MACD
  // On calcule la ligne MACD sur les 9 derniers points disponibles
  const macdHistory: number[] = [];
  const windowSize = Math.min(prices.length - 26 + 1, 20);
  for (let i = 0; i < windowSize; i++) {
    const slice = prices.slice(0, prices.length - windowSize + i + 1);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdHistory.push(e12 - e26);
  }

  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;

  // Détection du croisement
  const prevHistogram = macdHistory.length >= 2
    ? macdHistory[macdHistory.length - 2] - signalLine
    : 0;

  const crossover =
    prevHistogram < 0 && histogram > 0 ? "bullish" :
    prevHistogram > 0 && histogram < 0 ? "bearish" :
    "none";

  return {
    macdLine: parseFloat(macdLine.toFixed(4)),
    signalLine: parseFloat(signalLine.toFixed(4)),
    histogram: parseFloat(histogram.toFixed(4)),
    crossover,
  };
}

/**
 * Bollinger Bands
 * Bandes de volatilité autour d'une SMA (période 20, écart-type 2)
 */
export function calculateBollingerBands(prices: number[], period = 20, stdDevMultiplier = 2): BollingerBands {
  if (prices.length < period) {
    const last = prices[prices.length - 1] ?? 0;
    return { upper: last, middle: last, lower: last, bandwidth: 0, percentB: 0.5 };
  }

  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = mean + stdDevMultiplier * stdDev;
  const lower = mean - stdDevMultiplier * stdDev;
  const bandwidth = (upper - lower) / mean;

  const currentPrice = prices[prices.length - 1];
  const percentB = upper === lower ? 0.5 : (currentPrice - lower) / (upper - lower);

  return {
    upper: parseFloat(upper.toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat(lower.toFixed(2)),
    bandwidth: parseFloat(bandwidth.toFixed(4)),
    percentB: parseFloat(percentB.toFixed(4)),
  };
}

/**
 * ATR — Average True Range
 * Mesure la volatilité moyenne sur une période donnée
 */
export function calculateATR(history: HistoryPoint[], period = 14): number {
  if (history.length < 2) return 0;

  const trueRanges: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const high = history[i].price * 1.005; // Estimation si pas de H/L séparé
    const low  = history[i].price * 0.995;
    const prevClose = history[i - 1].price;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const relevantTR = trueRanges.slice(-period);
  return relevantTR.reduce((a, b) => a + b, 0) / relevantTR.length;
}

/**
 * Tendance du volume
 */
export function detectVolumeTrend(
  history: HistoryPoint[]
): "increasing" | "decreasing" | "stable" {
  const withVolume = history.filter((h) => h.volume !== undefined);
  if (withVolume.length < 4) return "stable";

  const recent  = withVolume.slice(-Math.ceil(withVolume.length / 2));
  const older   = withVolume.slice(0, Math.floor(withVolume.length / 2));

  const avgRecent = recent.reduce((s, h) => s + (h.volume ?? 0), 0) / recent.length;
  const avgOlder  = older.reduce((s, h) => s + (h.volume ?? 0), 0) / older.length;

  if (avgOlder === 0) return "stable";
  const diff = (avgRecent - avgOlder) / avgOlder;

  if (diff > 0.1) return "increasing";
  if (diff < -0.1) return "decreasing";
  return "stable";
}

/**
 * Calcul complet de tous les indicateurs techniques
 */
export function computeAllIndicators(history: HistoryPoint[]): TechnicalIndicators {
  const prices = history.map((h) => h.price);

  const rsi    = calculateRSI(prices);
  const macd   = calculateMACD(prices);
  const ema20  = calculateEMA(prices, 20);
  const ema50  = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);
  const bollingerBands = calculateBollingerBands(prices);
  const atr    = calculateATR(history);
  const volume_trend = detectVolumeTrend(history);

  return {
    rsi,
    macd,
    ema20: parseFloat(ema20.toFixed(2)),
    ema50: parseFloat(ema50.toFixed(2)),
    ema200: parseFloat(ema200.toFixed(2)),
    bollingerBands,
    atr: parseFloat(atr.toFixed(2)),
    volume_trend,
  };
}
