import type {
  MarketData, MacroData, NewsItem, Prediction, Asset, Timeframe,
  SentimentData, DerivativesData,
} from "@/types";

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erreur HTTP ${res.status}`);
  return data as T;
}

export const fetchCrypto      = (s: Asset, tf: Timeframe) => safeFetch<MarketData>(`/api/crypto?symbol=${s}&timeframe=${tf}`);
export const fetchGold        = (tf: Timeframe)           => safeFetch<MarketData>(`/api/gold?timeframe=${tf}`);
export const fetchMacro       = ()                         => safeFetch<MacroData>("/api/macro");
export const fetchNews        = (a: Asset)                => safeFetch<NewsItem[]>(`/api/news?asset=${a}`);
export const fetchSentiment   = (a: Asset)                => safeFetch<SentimentData>(`/api/sentiment?asset=${a}`);
export const fetchDerivatives = (a: Asset)                => safeFetch<DerivativesData>(`/api/derivatives?asset=${a}`);

export async function fetchPrediction(params: {
  asset: Asset; price: number; change24h: number;
  history: { date: string; price: number }[];
  macro: MacroData; timeframe: Timeframe;
  marketCap?: number; volume24h?: number;
  sentiment?: SentimentData;
  history4H?: { date: string; price: number }[];
  history1J?: { date: string; price: number }[];
  history1W?: { date: string; price: number }[];
}): Promise<Prediction> {
  return safeFetch<Prediction>("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
