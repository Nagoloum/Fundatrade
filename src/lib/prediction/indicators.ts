import type {
  HistoryPoint, TechnicalIndicators, MACDData, BollingerBands,
  IchimokuData, StochasticRSIData, ADXData, MarketRegime
} from "@/types";

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  let gains = 0, losses = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) gains += changes[i]; else losses += Math.abs(changes[i]);
  }
  let avgGain = gains / period, avgLoss = losses / period;
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
  const windowSize = Math.min(prices.length - 26 + 1, 20);
  const macdHistory: number[] = [];
  for (let i = 0; i < windowSize; i++) {
    const slice = prices.slice(0, prices.length - windowSize + i + 1);
    macdHistory.push(calculateEMA(slice, 12) - calculateEMA(slice, 26));
  }
  const signalLine = calculateEMA(macdHistory, 9);
  const histogram  = macdLine - signalLine;
  const prevH = macdHistory.length >= 2 ? macdHistory[macdHistory.length - 2] - signalLine : 0;
  const crossover = prevH < 0 && histogram > 0 ? "bullish" : prevH > 0 && histogram < 0 ? "bearish" : "none";
  return {
    macdLine: parseFloat(macdLine.toFixed(6)),
    signalLine: parseFloat(signalLine.toFixed(6)),
    histogram: parseFloat(histogram.toFixed(6)),
    crossover,
  };
}

export function calculateBollingerBands(prices: number[], period = 20, mult = 2): BollingerBands {
  if (prices.length < period) {
    const last = prices[prices.length - 1] ?? 0;
    return { upper: last, middle: last, lower: last, bandwidth: 0, percentB: 0.5 };
  }
  const slice  = prices.slice(-period);
  const mean   = slice.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(slice.reduce((s, p) => s + (p - mean) ** 2, 0) / period);
  const upper  = mean + mult * stdDev;
  const lower  = mean - mult * stdDev;
  const current = prices[prices.length - 1];
  return {
    upper: parseFloat(upper.toFixed(4)), middle: parseFloat(mean.toFixed(4)), lower: parseFloat(lower.toFixed(4)),
    bandwidth: parseFloat(((upper - lower) / mean).toFixed(6)),
    percentB: parseFloat((upper === lower ? 0.5 : (current - lower) / (upper - lower)).toFixed(6)),
  };
}

export function calculateATR(history: HistoryPoint[], period = 14): number {
  if (history.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const h = history[i].price * 1.005, l = history[i].price * 0.995, prev = history[i - 1].price;
    trs.push(Math.max(h - l, Math.abs(h - prev), Math.abs(l - prev)));
  }
  return trs.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, trs.length);
}

export function calculateStochasticRSI(prices: number[], period = 14, kSmooth = 3, dSmooth = 3): StochasticRSIData {
  if (prices.length < period * 2) return { k: 50, d: 50, crossover: "none", zone: "neutral" };
  const rsiSeries: number[] = [];
  for (let i = period; i <= prices.length; i++) rsiSeries.push(calculateRSI(prices.slice(0, i), period));
  if (rsiSeries.length < period) return { k: 50, d: 50, crossover: "none", zone: "neutral" };

  const stochSeries: number[] = [];
  for (let i = period - 1; i < rsiSeries.length; i++) {
    const window = rsiSeries.slice(i - period + 1, i + 1);
    const minR = Math.min(...window), maxR = Math.max(...window);
    stochSeries.push(maxR === minR ? 50 : (rsiSeries[i] - minR) / (maxR - minR) * 100);
  }

  const kSeries: number[] = [];
  for (let i = kSmooth - 1; i < stochSeries.length; i++) {
    const w = stochSeries.slice(i - kSmooth + 1, i + 1);
    kSeries.push(w.reduce((a, b) => a + b, 0) / kSmooth);
  }
  const dSeries: number[] = [];
  for (let i = dSmooth - 1; i < kSeries.length; i++) {
    const w = kSeries.slice(i - dSmooth + 1, i + 1);
    dSeries.push(w.reduce((a, b) => a + b, 0) / dSmooth);
  }

  const k = kSeries[kSeries.length - 1] ?? 50;
  const d = dSeries[dSeries.length - 1] ?? 50;
  const prevK = kSeries[kSeries.length - 2] ?? k;
  const prevD = dSeries[dSeries.length - 2] ?? d;
  const crossover = prevK < prevD && k > d ? "bullish" : prevK > prevD && k < d ? "bearish" : "none";
  const zone = k > 80 ? "overbought" : k < 20 ? "oversold" : "neutral";
  return { k: parseFloat(k.toFixed(1)), d: parseFloat(d.toFixed(1)), crossover, zone };
}

export function calculateADX(history: HistoryPoint[], period = 14): ADXData {
  if (history.length < period * 2) return { adx: 25, plusDI: 25, minusDI: 25, regime: "unknown", trend: "NEUTRAL" };
  const prices = history.map(h => h.price);
  const highs  = prices.map(p => p * 1.005);
  const lows   = prices.map(p => p * 0.995);
  const trList: number[] = [], plusDM: number[] = [], minusDM: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const hd = highs[i] - highs[i-1], ld = lows[i-1] - lows[i];
    const tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - prices[i-1]), Math.abs(lows[i] - prices[i-1]));
    trList.push(tr);
    plusDM.push(hd > ld && hd > 0 ? hd : 0);
    minusDM.push(ld > hd && ld > 0 ? ld : 0);
  }

  let atrS = trList.slice(0, period).reduce((a, b) => a + b, 0);
  let pS   = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let mS   = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  const dxList: number[] = [];

  for (let i = period; i < trList.length; i++) {
    atrS = atrS - atrS / period + trList[i];
    pS   = pS   - pS   / period + plusDM[i];
    mS   = mS   - mS   / period + minusDM[i];
    const pDI = atrS > 0 ? (pS / atrS) * 100 : 0;
    const mDI = atrS > 0 ? (mS / atrS) * 100 : 0;
    dxList.push(pDI + mDI > 0 ? Math.abs(pDI - mDI) / (pDI + mDI) * 100 : 0);
  }

  const adx = dxList.length >= period
    ? dxList.slice(-period).reduce((a, b) => a + b, 0) / period
    : dxList.reduce((a, b) => a + b, 0) / Math.max(dxList.length, 1);

  const lastP = atrS > 0 ? (pS / atrS) * 100 : 25;
  const lastM = atrS > 0 ? (mS / atrS) * 100 : 25;

  let regime: MarketRegime;
  if (adx > 30 && lastP > lastM) regime = "trending_bull";
  else if (adx > 30 && lastM > lastP) regime = "trending_bear";
  else if (adx < 20) regime = "ranging";
  else if (adx > 40) regime = "volatile";
  else regime = "unknown";

  return {
    adx: parseFloat(adx.toFixed(1)), plusDI: parseFloat(lastP.toFixed(1)), minusDI: parseFloat(lastM.toFixed(1)),
    regime, trend: lastP > lastM ? "BULLISH" : lastM > lastP ? "BEARISH" : "NEUTRAL",
  };
}

export function calculateIchimoku(history: HistoryPoint[]): IchimokuData {
  const prices = history.map(h => h.price);
  const n = prices.length;
  const blank: IchimokuData = { tenkan: 0, kijun: 0, senkouA: 0, senkouB: 0, chikou: 0, cloudColor: "bearish", pricePosition: "in_cloud", signal: "NEUTRAL" };
  if (n < 52) return blank;

  const mid = (arr: number[], from: number, len: number) => {
    const s = arr.slice(from, from + len);
    return (Math.max(...s) + Math.min(...s)) / 2;
  };

  const tenkan  = mid(prices, n - 9, 9);
  const kijun   = mid(prices, n - 26, 26);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = mid(prices, n - 52, 52);
  const chikou  = prices[n - 26] ?? prices[n - 1];
  const current = prices[n - 1];
  const cloudTop    = Math.max(senkouA, senkouB);
  const cloudBottom = Math.min(senkouA, senkouB);
  const cloudColor  = senkouA >= senkouB ? "bullish" : "bearish";
  const pricePosition: IchimokuData["pricePosition"] =
    current > cloudTop ? "above_cloud" : current < cloudBottom ? "below_cloud" : "in_cloud";

  let bp = 0, brp = 0;
  if (tenkan > kijun) bp += 2; else brp += 2;
  if (pricePosition === "above_cloud") bp += 3; else if (pricePosition === "below_cloud") brp += 3;
  if (cloudColor === "bullish") bp++; else brp++;
  if (chikou > (prices[n - 27] ?? 0)) bp++; else brp++;

  const signal: "BULLISH" | "BEARISH" | "NEUTRAL" = bp >= 5 ? "BULLISH" : brp >= 5 ? "BEARISH" : "NEUTRAL";

  return {
    tenkan: parseFloat(tenkan.toFixed(2)), kijun: parseFloat(kijun.toFixed(2)),
    senkouA: parseFloat(senkouA.toFixed(2)), senkouB: parseFloat(senkouB.toFixed(2)),
    chikou: parseFloat(chikou.toFixed(2)), cloudColor, pricePosition, signal,
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

export function computeAllIndicators(history: HistoryPoint[]): TechnicalIndicators {
  const prices = history.map(h => h.price);
  return {
    rsi: calculateRSI(prices),
    stochRSI: calculateStochasticRSI(prices),
    macd: calculateMACD(prices),
    ema20:  parseFloat(calculateEMA(prices, 20).toFixed(4)),
    ema50:  parseFloat(calculateEMA(prices, 50).toFixed(4)),
    ema200: parseFloat(calculateEMA(prices, 200).toFixed(4)),
    bollingerBands: calculateBollingerBands(prices),
    ichimoku: calculateIchimoku(history),
    adx: calculateADX(history),
    atr: parseFloat(calculateATR(history).toFixed(4)),
    volume_trend: detectVolumeTrend(history),
  };
}
