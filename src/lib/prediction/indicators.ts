import type {
  HistoryPoint, TechnicalIndicators, MACDData, BollingerBands,
  IchimokuData, StochasticRSIData, ADXData, MarketRegime
} from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// INDICATEURS TECHNIQUES — Enrichis : ADX, Stochastique RSI, Ichimoku
// ═══════════════════════════════════════════════════════════════════════════

export function calculateRSI(prices: number[], period = 14): number {
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

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] ?? 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) ema = prices[i] * k + ema * (1 - k);
  return ema;
}

export function calculateMACD(prices: number[]): MACDData {
  if (prices.length < 26) return { macdLine: 0, signalLine: 0, histogram: 0, crossover: "none" };
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const macdHistory: number[] = [];
  const windowSize = Math.min(prices.length - 26 + 1, 20);
  for (let i = 0; i < windowSize; i++) {
    const slice = prices.slice(0, prices.length - windowSize + i + 1);
    macdHistory.push(calculateEMA(slice, 12) - calculateEMA(slice, 26));
  }
  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;
  const prevH = macdHistory.length >= 2 ? macdHistory[macdHistory.length - 2] - signalLine : 0;
  const crossover = prevH < 0 && histogram > 0 ? "bullish" : prevH > 0 && histogram < 0 ? "bearish" : "none";
  return {
    macdLine: parseFloat(macdLine.toFixed(4)),
    signalLine: parseFloat(signalLine.toFixed(4)),
    histogram: parseFloat(histogram.toFixed(4)),
    crossover,
  };
}

export function calculateBollingerBands(prices: number[], period = 20, mult = 2): BollingerBands {
  if (prices.length < period) {
    const last = prices[prices.length - 1] ?? 0;
    return { upper: last, middle: last, lower: last, bandwidth: 0, percentB: 0.5 };
  }
  const slice = prices.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(slice.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / period);
  const upper = mean + mult * stdDev;
  const lower = mean - mult * stdDev;
  const current = prices[prices.length - 1];
  return {
    upper: parseFloat(upper.toFixed(2)),
    middle: parseFloat(mean.toFixed(2)),
    lower: parseFloat(lower.toFixed(2)),
    bandwidth: parseFloat(((upper - lower) / mean).toFixed(4)),
    percentB: parseFloat((upper === lower ? 0.5 : (current - lower) / (upper - lower)).toFixed(4)),
  };
}

export function calculateATR(history: HistoryPoint[], period = 14): number {
  if (history.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const high = history[i].price * 1.005;
    const low  = history[i].price * 0.995;
    const prev = history[i - 1].price;
    trs.push(Math.max(high - low, Math.abs(high - prev), Math.abs(low - prev)));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

// ─── NOUVEAU : Stochastique RSI ─────────────────────────────────────────────
export function calculateStochasticRSI(prices: number[], period = 14, kSmooth = 3, dSmooth = 3): StochasticRSIData {
  if (prices.length < period * 2) return { k: 50, d: 50, crossover: "none", zone: "neutral" };

  // Calculer une série RSI
  const rsiSeries: number[] = [];
  for (let i = period; i <= prices.length; i++) {
    rsiSeries.push(calculateRSI(prices.slice(0, i), period));
  }

  if (rsiSeries.length < period) return { k: 50, d: 50, crossover: "none", zone: "neutral" };

  // StochRSI = (RSI - min(RSI, period)) / (max(RSI, period) - min(RSI, period))
  const stochSeries: number[] = [];
  for (let i = period - 1; i < rsiSeries.length; i++) {
    const window = rsiSeries.slice(i - period + 1, i + 1);
    const minRSI = Math.min(...window);
    const maxRSI = Math.max(...window);
    stochSeries.push(maxRSI === minRSI ? 50 : (rsiSeries[i] - minRSI) / (maxRSI - minRSI) * 100);
  }

  // Lisser K avec SMA
  const kSeries: number[] = [];
  for (let i = kSmooth - 1; i < stochSeries.length; i++) {
    const window = stochSeries.slice(i - kSmooth + 1, i + 1);
    kSeries.push(window.reduce((a, b) => a + b, 0) / kSmooth);
  }

  // D = SMA(K, dSmooth)
  const dSeries: number[] = [];
  for (let i = dSmooth - 1; i < kSeries.length; i++) {
    const window = kSeries.slice(i - dSmooth + 1, i + 1);
    dSeries.push(window.reduce((a, b) => a + b, 0) / dSmooth);
  }

  const k = kSeries[kSeries.length - 1] ?? 50;
  const d = dSeries[dSeries.length - 1] ?? 50;
  const prevK = kSeries[kSeries.length - 2] ?? k;
  const prevD = dSeries[dSeries.length - 2] ?? d;

  const crossover = prevK < prevD && k > d ? "bullish" : prevK > prevD && k < d ? "bearish" : "none";
  const zone = k > 80 ? "overbought" : k < 20 ? "oversold" : "neutral";

  return { k: parseFloat(k.toFixed(1)), d: parseFloat(d.toFixed(1)), crossover, zone };
}

// ─── NOUVEAU : ADX — Average Directional Index ──────────────────────────────
export function calculateADX(history: HistoryPoint[], period = 14): ADXData {
  if (history.length < period * 2) {
    return { adx: 25, plusDI: 25, minusDI: 25, regime: "unknown", trend: "NEUTRAL" };
  }

  const prices = history.map(h => h.price);
  const highs  = prices.map(p => p * 1.005);
  const lows   = prices.map(p => p * 0.995);

  const trList:    number[] = [];
  const plusDMList: number[] = [];
  const minusDMList: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const highDiff = highs[i] - highs[i - 1];
    const lowDiff  = lows[i - 1] - lows[i];
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - prices[i - 1]), Math.abs(lows[i] - prices[i - 1]));

    trList.push(tr);
    plusDMList.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDMList.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);
  }

  // ATR sur period
  const smoothTR    = trList.slice(0, period).reduce((a, b) => a + b, 0);
  const smoothPlusDM  = plusDMList.slice(0, period).reduce((a, b) => a + b, 0);
  const smoothMinusDM = minusDMList.slice(0, period).reduce((a, b) => a + b, 0);

  let atrSmooth = smoothTR, plusSmooth = smoothPlusDM, minusSmooth = smoothMinusDM;
  const dxList: number[] = [];

  for (let i = period; i < trList.length; i++) {
    atrSmooth   = atrSmooth   - atrSmooth   / period + trList[i];
    plusSmooth  = plusSmooth  - plusSmooth  / period + plusDMList[i];
    minusSmooth = minusSmooth - minusSmooth / period + minusDMList[i];

    const plusDI  = atrSmooth > 0 ? (plusSmooth / atrSmooth) * 100 : 0;
    const minusDI = atrSmooth > 0 ? (minusSmooth / atrSmooth) * 100 : 0;
    const dx = plusDI + minusDI > 0 ? Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100 : 0;
    dxList.push(dx);
  }

  const adx = dxList.length >= period
    ? dxList.slice(-period).reduce((a, b) => a + b, 0) / period
    : dxList.reduce((a, b) => a + b, 0) / Math.max(dxList.length, 1);

  const lastPlusDI  = atrSmooth > 0 ? (plusSmooth / atrSmooth) * 100 : 25;
  const lastMinusDI = atrSmooth > 0 ? (minusSmooth / atrSmooth) * 100 : 25;

  let regime: MarketRegime;
  if (adx > 30 && lastPlusDI > lastMinusDI) regime = "trending_bull";
  else if (adx > 30 && lastMinusDI > lastPlusDI) regime = "trending_bear";
  else if (adx < 20) regime = "ranging";
  else if (adx > 40) regime = "volatile";
  else regime = "unknown";

  const trend = lastPlusDI > lastMinusDI ? "BULLISH" : lastMinusDI > lastPlusDI ? "BEARISH" : "NEUTRAL";

  return {
    adx: parseFloat(adx.toFixed(1)),
    plusDI: parseFloat(lastPlusDI.toFixed(1)),
    minusDI: parseFloat(lastMinusDI.toFixed(1)),
    regime,
    trend,
  };
}

// ─── NOUVEAU : Ichimoku Cloud ───────────────────────────────────────────────
export function calculateIchimoku(history: HistoryPoint[]): IchimokuData {
  const prices = history.map(h => h.price);
  const n = prices.length;
  const blank: IchimokuData = { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, chikou: 0, cloudColor: "bearish", pricePosition: "in_cloud", signal: "NEUTRAL" };
  if (n < 52) return blank;

  const midpoint = (arr: number[], from: number, len: number) => {
    const slice = arr.slice(from, from + len);
    return (Math.max(...slice) + Math.min(...slice)) / 2;
  };

  const tenkan  = midpoint(prices, n - 9, 9);
  const kijun   = midpoint(prices, n - 26, 26);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = midpoint(prices, n - 52, 52);
  const chikou  = prices[n - 26] ?? prices[n - 1];
  const current = prices[n - 1];

  const cloudTop    = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  const cloudColor  = senkouA >= senkouB ? "bullish" : "bearish";

  let pricePosition: IchimokuData["pricePosition"];
  if (current > cloudTop)    pricePosition = "above_cloud";
  else if (current < cloudBottom) pricePosition = "below_cloud";
  else pricePosition = "in_cloud";

  // Signal Ichimoku complet (TK cross + cloud position + chikou)
  let bullPoints = 0, bearPoints = 0;
  if (tenkan > kijun) bullPoints += 2; else bearPoints += 2;
  if (pricePosition === "above_cloud") bullPoints += 3;
  else if (pricePosition === "below_cloud") bearPoints += 3;
  if (cloudColor === "bullish") bullPoints++; else bearPoints++;
  if (chikou > (prices[n - 27] ?? 0)) bullPoints++; else bearPoints++;

  const signal: "BULLISH" | "BEARISH" | "NEUTRAL" =
    bullPoints >= 5 ? "BULLISH" : bearPoints >= 5 ? "BEARISH" : "NEUTRAL";

  return {
    tenkan: parseFloat(tenkan.toFixed(2)),
    kijun: parseFloat(kijun.toFixed(2)),
    senkouA: parseFloat(senkouA.toFixed(2)),
    senkouB: parseFloat(senkouB.toFixed(2)),
    chikou: parseFloat(chikou.toFixed(2)),
    cloudColor,
    pricePosition,
    signal,
  };
}

export function detectVolumeTrend(history: HistoryPoint[]): "increasing" | "decreasing" | "stable" {
  const wv = history.filter(h => h.volume !== undefined);
  if (wv.length < 4) return "stable";
  const half = Math.floor(wv.length / 2);
  const recent = wv.slice(-half).reduce((s, h) => s + (h.volume ?? 0), 0) / half;
  const older  = wv.slice(0, half).reduce((s, h) => s + (h.volume ?? 0), 0) / half;
  if (older === 0) return "stable";
  const diff = (recent - older) / older;
  return diff > 0.1 ? "increasing" : diff < -0.1 ? "decreasing" : "stable";
}

// ─── Calcul complet enrichi ──────────────────────────────────────────────────
export function computeAllIndicators(history: HistoryPoint[]): TechnicalIndicators {
  const prices = history.map(h => h.price);
  return {
    rsi:           calculateRSI(prices),
    stochRSI:      calculateStochasticRSI(prices),
    macd:          calculateMACD(prices),
    ema20:         parseFloat(calculateEMA(prices, 20).toFixed(2)),
    ema50:         parseFloat(calculateEMA(prices, 50).toFixed(2)),
    ema200:        parseFloat(calculateEMA(prices, 200).toFixed(2)),
    bollingerBands: calculateBollingerBands(prices),
    ichimoku:      calculateIchimoku(history),
    adx:           calculateADX(history),
    atr:           parseFloat(calculateATR(history).toFixed(2)),
    volume_trend:  detectVolumeTrend(history),
  };
}
