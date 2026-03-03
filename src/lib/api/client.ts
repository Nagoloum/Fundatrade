import type { MarketData, MacroData, NewsItem, Prediction, Asset, Timeframe } from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT API — Fonctions de fetch côté client vers les routes Next.js
// ═══════════════════════════════════════════════════════════════════════════

async function safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Erreur HTTP ${res.status}`);
  }
  return data as T;
}

export async function fetchCrypto(symbol: Asset, timeframe: Timeframe): Promise<MarketData> {
  return safeFetch<MarketData>(`/api/crypto?symbol=${symbol}&timeframe=${timeframe}`);
}

export async function fetchGold(timeframe: Timeframe): Promise<MarketData> {
  return safeFetch<MarketData>(`/api/gold?timeframe=${timeframe}`);
}

export async function fetchMacro(): Promise<MacroData> {
  return safeFetch<MacroData>("/api/macro");
}

export async function fetchNews(asset: Asset): Promise<NewsItem[]> {
  return safeFetch<NewsItem[]>(`/api/news?asset=${asset}`);
}

export async function fetchPrediction(params: {
  asset: Asset;
  price: number;
  change24h: number;
  history: { date: string; price: number }[];
  macro: MacroData;
  timeframe: Timeframe;
  marketCap?: number;
  volume24h?: number;
}): Promise<Prediction> {
  return safeFetch<Prediction>("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
