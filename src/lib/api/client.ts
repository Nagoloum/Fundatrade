import type {
  MarketData, MacroData, NewsItem, Prediction, Asset, Timeframe,
  SentimentData, DerivativesData, EconomicEvent, WeeklyPrediction,
} from "@/types";

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res  = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data as T;
}

export const fetchCrypto      = (tf: Timeframe)  => safeFetch<MarketData>(`/api/crypto?timeframe=${tf}`);
export const fetchGold        = (tf: Timeframe)  => safeFetch<MarketData>(`/api/gold?timeframe=${tf}`);
export const fetchMacro       = ()               => safeFetch<MacroData>("/api/macro");
export const fetchNews        = (a: Asset)       => safeFetch<NewsItem[]>(`/api/news?asset=${a}`);
export const fetchSentiment   = (a: Asset)       => safeFetch<SentimentData>(`/api/sentiment?asset=${a}`);
export const fetchDerivatives = ()               => safeFetch<DerivativesData>("/api/derivatives?asset=BTC");
export const fetchEconomicCalendar = () => safeFetch<{ events: EconomicEvent[]; weekLabel: string; fetchedAt?: string }>("/api/economic-calendar");

export async function fetchPrediction(params: {
  asset: Asset; price: number; change24h: number;
  history: { date: string; price: number }[];
  macro: MacroData; timeframe: Timeframe;
  volume24h?: number; sentiment?: SentimentData;
  economicEvents?: EconomicEvent[];
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

export async function fetchWeeklyPrediction(params: {
  asset: Asset; price: number; change24h: number;
  history: { date: string; price: number }[];
  macro: MacroData; timeframe: Timeframe;
  volume24h?: number; sentiment?: SentimentData;
  economicEvents?: EconomicEvent[];
}): Promise<WeeklyPrediction> {
  return safeFetch<WeeklyPrediction>("/api/weekly-predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
