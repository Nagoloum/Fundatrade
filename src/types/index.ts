export type Asset = "XAUUSD" | "BTC" | "ETH" | "SOL";
export type Timeframe = "4H" | "1J" | "1W";
export type Theme = "dark" | "light";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type Sentiment = "positive" | "negative" | "neutral";
export type MarketRegime = "trending_bull" | "trending_bear" | "ranging" | "volatile" | "unknown";

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
  lastUpdated: string;
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
  volumeToMarketCapRatio?: number;
  nvtSignal?: number;
}

// ─── Données macro ───────────────────────────────────────────────────────────

export interface MacroData {
  fedRate: number;
  inflation: number;
  m2Supply?: number;
  dxy?: number;
  yieldCurve?: number;
  lastUpdated?: string;
}

// ─── Sentiment & Fear/Greed ──────────────────────────────────────────────────

export interface FearGreedData {
  value: number;           // 0–100
  label: string;           // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  previousValue?: number;
  previousLabel?: string;
  timestamp: string;
}

export interface SentimentData {
  fearGreed?: FearGreedData;
  cryptoPanicScore?: number;    // -1 à +1 agrégé
  newsScore: number;            // score NLP des news
  overallScore: number;         // 0–100 combiné
  overallLabel: string;
  signals: string[];
}

// ─── Données dérivés (Futures) ───────────────────────────────────────────────

export interface DerivativesData {
  fundingRate?: number;          // % par 8h (positif = longs paient shorts)
  openInterest?: number;         // USD
  openInterestChange24h?: number;// % changement
  longShortRatio?: number;       // ratio longs/shorts
  liquidations24h?: {
    longs: number;
    shorts: number;
  };
  signals?: string[];            // Signaux textuels interprétatifs
}

// ─── Corrélations ────────────────────────────────────────────────────────────

export interface CorrelationData {
  btcSpx?: number;       // Corrélation BTC/S&P500
  btcGold?: number;      // Corrélation BTC/Or
  btcDxy?: number;       // Corrélation BTC/DXY
  label: string;
}

// ─── Indicateurs techniques enrichis ────────────────────────────────────────

export interface IchimokuData {
  tenkan: number;          // Conversion Line (9)
  kijun: number;           // Base Line (26)
  senkouA: number;         // Leading Span A
  senkouB: number;         // Leading Span B
  chikou: number;          // Lagging Span
  cloudColor: "bullish" | "bearish";
  pricePosition: "above_cloud" | "in_cloud" | "below_cloud";
  signal: Direction;
}

export interface StochasticRSIData {
  k: number;               // %K line
  d: number;               // %D line (SMA de K)
  crossover: "bullish" | "bearish" | "none";
  zone: "overbought" | "oversold" | "neutral";
}

export interface ADXData {
  adx: number;             // 0–100 (force de tendance)
  plusDI: number;          // +DI (pression haussière)
  minusDI: number;         // -DI (pression baissière)
  regime: MarketRegime;
  trend: Direction;
}

export interface TechnicalIndicators {
  rsi: number;
  stochRSI: StochasticRSIData;
  macd: MACDData;
  ema20: number;
  ema50: number;
  ema200: number;
  bollingerBands: BollingerBands;
  ichimoku: IchimokuData;
  adx: ADXData;
  atr: number;
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
  bandwidth: number;
  percentB: number;
}

// ─── Analyses stratégiques ───────────────────────────────────────────────────

export interface StrategyAnalysis {
  name: string;
  direction: Direction;
  signal: string;
  confidence: number;
  details: string[];
  timeframe: Timeframe;
  weight?: number;         // Poids dans le consensus (selon timeframe)
}

export interface PriceActionAnalysis extends StrategyAnalysis {
  name: "Price Action";
  pattern?: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
}

export interface SMCAnalysis extends StrategyAnalysis {
  name: "SMC";
  orderBlocks: OrderBlock[];
  fairValueGaps: FairValueGap[];
  structureBreak?: "BOS" | "CHoCH" | null;
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

// ─── Confluence multi-timeframe ──────────────────────────────────────────────

export interface MultiTimeframeSignal {
  "4H": Direction;
  "1J": Direction;
  "1W": Direction;
  alignment: "strong_bull" | "strong_bear" | "mixed_bull" | "mixed_bear" | "neutral";
  alignmentScore: number;  // 0–100 : niveau d'accord entre timeframes
}

// ─── Prédiction enrichie ─────────────────────────────────────────────────────

export interface Prediction {
  direction: Direction;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  fundamentalScore: number;
  technicalScore: number;
  sentimentScore: number;   // NOUVEAU
  globalScore: number;
  riskRewardRatio: number;
  reasoning: string[];
  timeframe: Timeframe;
  regime: MarketRegime;     // NOUVEAU — régime de marché détecté
  multiTF?: MultiTimeframeSignal;  // NOUVEAU — confluence multi-TF
  strategies: {
    priceAction: StrategyAnalysis;
    smc: StrategyAnalysis;
    rsi: StrategyAnalysis;
    macd: StrategyAnalysis;
    ichimoku: StrategyAnalysis;   // NOUVEAU
    adx: StrategyAnalysis;        // NOUVEAU
  };
}

// ─── Actualités ──────────────────────────────────────────────────────────────

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: Sentiment;
  sentimentScore?: number;  // -1 à +1 (NLP enrichi)
  summary?: string;
}

// ─── Journal de trading (localStorage) ──────────────────────────────────────

export interface TradeEntry {
  id: string;
  asset: Asset;
  timeframe: Timeframe;
  direction: Direction;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  entryDate: string;
  exitDate?: string;
  exitPrice?: number;
  result?: "win" | "loss" | "breakeven" | "open";
  pnlPercent?: number;
  note?: string;
  predictionConfidence?: number;
  predictionDirection?: Direction;
  tags?: string[];
}

export interface TradeStats {
  total: number;
  wins: number;
  losses: number;
  breakevens: number;
  open: number;
  winRate: number;          // %
  avgPnl: number;           // %
  bestTrade: number;        // %
  worstTrade: number;       // %
  totalPnl: number;         // %
  avgRR: number;
}

// ─── Alertes prix (localStorage + Web Push) ──────────────────────────────────

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

// ─── Backtesting ─────────────────────────────────────────────────────────────

export interface BacktestResult {
  asset: Asset;
  timeframe: Timeframe;
  period: string;
  totalSignals: number;
  correctSignals: number;
  accuracy: number;          // %
  avgConfidenceWin: number;
  avgConfidenceLoss: number;
  results: BacktestPoint[];
}

export interface BacktestPoint {
  date: string;
  predictedDirection: Direction;
  actualDirection: Direction;
  confidence: number;
  correct: boolean;
  priceAtPrediction: number;
  priceAfter: number;
  pnlPercent: number;
}

// ─── Comparaison multi-actifs ─────────────────────────────────────────────────

export interface AssetSnapshot {
  asset: Asset;
  price: number;
  change24h: number;
  direction: Direction;
  globalScore: number;
  confidence: number;
  rsi: number;
  regime: MarketRegime;
  sentiment?: number;
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
  sentiment: SentimentData | null;
  derivatives: DerivativesData | null;
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