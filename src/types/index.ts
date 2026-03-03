export type Asset = "XAUUSD" | "BTC" | "ETH" | "SOL";
export type Timeframe = "4H" | "1J" | "1W";
export type Theme = "dark" | "light";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Sentiment = "positive" | "negative" | "neutral";

// ─── Données de marché ───────────────────────────────────────────────────────

export interface MarketData {
  name: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  fullyDilutedValuation?: number;
  dominance?: number;
  history: HistoryPoint[];
  lastUpdated: string; // ISO timestamp
}

export interface HistoryPoint {
  date: string;
  price: number;
  volume?: number;
}

// ─── Fondamentaux crypto ─────────────────────────────────────────────────────

export interface CryptoFundamentals {
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  fullyDilutedValuation?: number;
  dominance?: number;
  volumeToMarketCapRatio?: number; // Volume/MCap ratio
  nvtSignal?: number;              // Network Value to Transactions
}

// ─── Données macro ───────────────────────────────────────────────────────────

export interface MacroData {
  fedRate: number;
  inflation: number;
  m2Supply?: number;
  dxy?: number;
  yieldCurve?: number; // 10Y - 2Y spread
  lastUpdated?: string;
}

// ─── Indicateurs techniques ──────────────────────────────────────────────────

export interface TechnicalIndicators {
  rsi: number;                    // 0–100
  macd: MACDData;
  ema20: number;
  ema50: number;
  ema200: number;
  bollingerBands: BollingerBands;
  atr: number;                    // Average True Range (volatilité)
  volume_trend: "increasing" | "decreasing" | "stable";
}

export interface MACDData {
  macdLine: number;
  signalLine: number;
  histogram: number;
  crossover: "bullish" | "bearish" | "none";
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;              // (upper - lower) / middle
  percentB: number;               // Position du prix dans les bandes
}

// ─── Analyses stratégiques ───────────────────────────────────────────────────

export interface StrategyAnalysis {
  name: string;
  direction: Direction;
  signal: string;                 // Description courte du signal
  confidence: number;             // 0–100
  details: string[];              // Points détaillés
  timeframe: Timeframe;
}

export interface PriceActionAnalysis extends StrategyAnalysis {
  name: "Price Action";
  pattern?: string;               // "Double Top", "Bull Flag", "Head & Shoulders", etc.
  keyLevels: {
    support: number[];
    resistance: number[];
  };
}

export interface SMCAnalysis extends StrategyAnalysis {
  name: "SMC";
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  structureBreak?: "BOS" | "CHoCH" | null; // Break of Structure / Change of Character
  liquidityZones: number[];
}

export interface OrderBlock {
  price: number;
  type: "bullish" | "bearish";
  strength: "strong" | "weak";
}

export interface FairValueGap {
  upper: number;
  lower: number;
  filled: boolean;
}

// ─── Prédiction IA ───────────────────────────────────────────────────────────

export interface Prediction {
  direction: Direction;
  targetPrice: number;
  stopLoss: number;               // Niveau de stop loss suggéré
  confidence: number;             // 0–100
  fundamentalScore: number;       // Score fondamental brut (-100 à +100)
  reasoning: string[];
  timeframe: Timeframe;
  technicalScore: number;         // Score technique brut
  globalScore: number;            // Score combiné
  riskRewardRatio: number;        // Risk/Reward ratio
  strategies: {
    priceAction: StrategyAnalysis;
    smc: StrategyAnalysis;
    rsi: StrategyAnalysis;
    macd: StrategyAnalysis;
  };
}

// ─── Actualités ──────────────────────────────────────────────────────────────

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: Sentiment;
  summary?: string;
}

// ─── État global de l'app ────────────────────────────────────────────────────

export interface AppState {
  asset: Asset;
  timeframe: Timeframe;
  theme: Theme;
  marketData: MarketData | null;
  macroData: MacroData | null;
  prediction: Prediction | null;
  news: NewsItem[];
  indicators: TechnicalIndicators | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

// ─── Réponses API ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp: string;
}
