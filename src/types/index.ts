export type Asset = "XAUUSD" | "BTC" | "ETH" | "SOL";
export type Timeframe = "4H" | "1J" | "1W";
export type Theme = "dark" | "light";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Sentiment = "positive" | "negative" | "neutral";
export type MarketRegime = "trending_bull" | "trending_bear" | "ranging" | "volatile" | "unknown";
export type WeeklyStatus = "active" | "target_hit" | "stop_hit" | "expired";

// ─── Market Data ─────────────────────────────────────────────────────────────
export interface HistoryPoint { date: string; price: number; volume?: number; }

export interface MarketData {
  marketCap?: number;
  fullyDilutedValuation?: number;
  circulatingSupply?: number;
  dominance?: number;
  name: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  history: HistoryPoint[];
  lastUpdated: string;
}

// ─── Macro ────────────────────────────────────────────────────────────────────
export interface MacroData {
  fedRate: number; inflation: number;
  m2Supply?: number; dxy?: number; yieldCurve?: number;
  lastUpdated?: string;
}

// ─── Sentiment ────────────────────────────────────────────────────────────────
export interface FearGreedData {
  value: number; label: string;
  previousValue?: number; previousLabel?: string; timestamp: string;
}
export interface SentimentData {
  fearGreed?: FearGreedData; cryptoPanicScore?: number;
  newsScore: number; overallScore: number; overallLabel: string; signals: string[];
}

// ─── Derivatives ──────────────────────────────────────────────────────────────
export interface DerivativesData {
  fundingRate?: number; openInterest?: number;
  openInterestChange24h?: number; longShortRatio?: number;
  signals?: string[];
}

// ─── Technical Indicators ────────────────────────────────────────────────────
export interface MACDData {
  macdLine: number; signalLine: number;
  histogram: number; crossover: "bullish" | "bearish" | "none";
}
export interface BollingerBands {
  upper: number; middle: number; lower: number; bandwidth: number; percentB: number;
}
export interface IchimokuData {
  tenkan: number; kijun: number; senkouA: number; senkouB: number; chikou: number;
  cloudColor: "bullish" | "bearish";
  pricePosition: "above_cloud" | "in_cloud" | "below_cloud";
  signal: Direction;
}
export interface StochasticRSIData {
  k: number; d: number; crossover: "bullish" | "bearish" | "none";
  zone: "overbought" | "oversold" | "neutral";
}
export interface ADXData {
  adx: number; plusDI: number; minusDI: number; regime: MarketRegime; trend: Direction;
}
export interface TechnicalIndicators {
  rsi: number; stochRSI: StochasticRSIData; macd: MACDData;
  ema20: number; ema50: number; ema200: number;
  bollingerBands: BollingerBands; ichimoku: IchimokuData;
  adx: ADXData; atr: number; volume_trend: "increasing" | "decreasing" | "stable";
}

// ─── Strategy Analysis ───────────────────────────────────────────────────────
export interface StrategyAnalysis {
  name: string; direction: Direction; signal: string;
  confidence: number; details: string[]; timeframe: Timeframe;
}
export interface MultiTimeframeSignal {
  "4H": Direction; "1J": Direction; "1W": Direction;
  alignment: "strong_bull" | "strong_bear" | "mixed_bull" | "mixed_bear" | "neutral";
  alignmentScore: number;
}

// ─── Prediction ───────────────────────────────────────────────────────────────
export interface Prediction {
  direction: Direction; targetPrice: number; stopLoss: number;
  confidence: number; fundamentalScore: number; technicalScore: number;
  sentimentScore: number; globalScore: number; riskRewardRatio: number;
  reasoning: string[]; timeframe: Timeframe; regime: MarketRegime;
  multiTF?: MultiTimeframeSignal;
  strategies: {
    priceAction: StrategyAnalysis; smc: StrategyAnalysis;
    rsi: StrategyAnalysis; macd: StrategyAnalysis;
    ichimoku: StrategyAnalysis; adx: StrategyAnalysis;
  };
}

// ─── Economic Events ─────────────────────────────────────────────────────────
export interface EconomicEvent {
  title: string; country: string; date: string;
  impact: "High" | "Medium" | "Low";
  forecast?: string; previous?: string; actual?: string;
}

// ─── Weekly Prediction ───────────────────────────────────────────────────────
export interface WeeklyPrediction {
  id: string;                   // e.g. "2025-W14-BTC-1J"
  weekId: string;               // e.g. "2025-W14"
  weekLabel: string;            // e.g. "Semaine du 1 Apr 2025"
  asset: Asset;
  timeframe: Timeframe;
  direction: Direction;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  riskRewardRatio: number;
  fundamentalScore: number;
  technicalScore: number;
  sentimentScore: number;
  globalScore: number;
  reasoning: string[];
  keyEvents: EconomicEvent[];   // High-impact events this week
  createdAt: string;            // ISO string — Monday
  status: WeeklyStatus;
  closedPrice?: number;
  closedAt?: string;
  finalPnlPercent?: number;
  peakPnlPercent?: number;      // Best P&L reached during the week
}

// ─── Weekly History Entry ─────────────────────────────────────────────────────
export interface WeeklyHistoryEntry extends WeeklyPrediction {
  wasCorrect: boolean;
}

export interface TradeEntry {
  id: string;
  asset: Asset;
  timeframe: Timeframe;
  direction: Direction;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  exitPrice?: number;
  exitDate?: string;
  result: "win" | "loss" | "breakeven" | "open";
  pnlPercent?: number;
  entryDate: string;
  note?: string;
}

export interface TradeStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  open: number;
  winRate: number;
  avgPnl: number;
  bestTrade: number;
  worstTrade: number;
  totalPnl: number;
  avgRR: number;
}

// ─── News ─────────────────────────────────────────────────────────────────────
export interface NewsItem {
  title: string; url: string; source: string;
  publishedAt: string; sentiment?: Sentiment; summary?: string;
}

// ─── App State ────────────────────────────────────────────────────────────────
export interface PriceAlert {
  id: string;
  asset: Asset;
  condition: "above" | "below";
  targetPrice: number;
  message: string;
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
}

export interface AppState {
  asset: Asset; timeframe: Timeframe; theme: Theme;
  activeTab: "dashboard" | "history";
  marketData: MarketData | null; macroData: MacroData | null;
  prediction: Prediction | null; news: NewsItem[];
  sentiment: SentimentData | null; derivatives: DerivativesData | null;
  weeklyPrediction: WeeklyPrediction | null;
  economicEvents: EconomicEvent[];
  loading: boolean; error: string | null; lastRefresh: Date | null;
}
