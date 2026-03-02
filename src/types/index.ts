export type Asset = "XAUUSD" | "BTC" | "ETH" | "SOL";

export interface MarketData {
  name: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
}

export interface CryptoFundamentals {
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  fullyDilutedValuation?: number;
  dominance?: number;
}

export interface MacroData {
  fedRate: number;
  inflation: number;
  m2Supply?: number;
  dxy?: number;
}

export interface Prediction {
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  targetPrice: number;
  confidence: number; // 0-100
  reasoning: string[];
  timeframe: string;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: "positive" | "negative" | "neutral";
}