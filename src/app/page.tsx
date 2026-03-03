"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Asset, Timeframe, MarketData, MacroData, Prediction, NewsItem } from "@/types";

import Header        from "@/components/layout/Header";
import AssetSelector from "@/components/layout/AssetSelector";
import PriceCard      from "@/components/market/PriceCard";
import PriceChart     from "@/components/market/PriceChart";
import FundamentalCard from "@/components/market/FundamentalCard";
import PredictionCard  from "@/components/prediction/PredictionCard";
import StrategiesPanel from "@/components/strategy/StrategiesPanel";
import MacroPanel from "@/components/macro/MacroPanel";
import NewsFeed   from "@/components/news/NewsFeed";
import { ErrorBanner, LoadingSkeleton } from "@/components/ui/Feedback";
import {
  fetchCrypto, fetchGold, fetchMacro, fetchNews, fetchPrediction,
} from "@/lib/api/client";

const PRICE_REFRESH_MS = 30_000;
const MACRO_REFRESH_MS = 300_000;
const NEWS_REFRESH_MS  = 300_000;

export default function Home() {
  const [asset, setAsset]         = useState<Asset>("BTC");
  const [timeframe, setTimeframe] = useState<Timeframe>("1J");
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [macroData,  setMacroData]  = useState<MacroData | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [news,       setNews]       = useState<NewsItem[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastRefresh,  setLastRefresh]  = useState<Date | null>(null);
  const [isLive,       setIsLive]       = useState(true);

  const priceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const macroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const newsIntervalRef  = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async (selectedAsset: Asset, selectedTimeframe: Timeframe) => {
    setLoading(true);
    setError(null);
    try {
      const [market, macro, newsData] = await Promise.all([
        selectedAsset === "XAUUSD" ? fetchGold(selectedTimeframe) : fetchCrypto(selectedAsset, selectedTimeframe),
        fetchMacro(),
        fetchNews(selectedAsset),
      ]);
      setMarketData(market);
      setMacroData(macro);
      setNews(newsData);
      const pred = await fetchPrediction({
        asset: selectedAsset, price: market.price, change24h: market.change24h,
        history: market.history, macro, timeframe: selectedTimeframe,
        marketCap: market.marketCap, volume24h: market.volume24h,
      });
      setPrediction(pred);
      setLastRefresh(new Date());
      setIsLive(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPriceOnly = useCallback(async () => {
    if (!macroData) return;
    try {
      const market = asset === "XAUUSD" ? await fetchGold(timeframe) : await fetchCrypto(asset, timeframe);
      setMarketData(market);
      const pred = await fetchPrediction({
        asset, price: market.price, change24h: market.change24h,
        history: market.history, macro: macroData, timeframe,
        marketCap: market.marketCap, volume24h: market.volume24h,
      });
      setPrediction(pred);
      setLastRefresh(new Date());
      setIsLive(true);
    } catch (err: any) {
      setIsLive(false);
    }
  }, [asset, timeframe, macroData]);

  const fetchNewsOnly  = useCallback(async () => { try { setNews(await fetchNews(asset)); } catch {} }, [asset]);
  const fetchMacroOnly = useCallback(async () => { try { setMacroData(await fetchMacro()); } catch {} }, []);

  useEffect(() => { fetchAll(asset, timeframe); }, [asset, timeframe, fetchAll]);

  useEffect(() => {
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);
    if (newsIntervalRef.current)  clearInterval(newsIntervalRef.current);
    priceIntervalRef.current = setInterval(fetchPriceOnly, PRICE_REFRESH_MS);
    macroIntervalRef.current = setInterval(fetchMacroOnly, MACRO_REFRESH_MS);
    newsIntervalRef.current  = setInterval(fetchNewsOnly,  NEWS_REFRESH_MS);
    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);
      if (newsIntervalRef.current)  clearInterval(newsIntervalRef.current);
    };
  }, [fetchPriceOnly, fetchMacroOnly, fetchNewsOnly]);

  const handleAssetChange     = (a: Asset)     => { setAsset(a);      setMarketData(null); setPrediction(null); };
  const handleTimeframeChange = (tf: Timeframe) => { setTimeframe(tf); setPrediction(null); };
  const handleManualRefresh   = useCallback(() => fetchAll(asset, timeframe), [asset, timeframe, fetchAll]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Header lastRefresh={lastRefresh} isLive={isLive} onRefresh={handleManualRefresh} />

      <main className="ft-main">
        {/* Sélecteurs */}
        <div className="ft-selector-bar">
          <AssetSelector
            selectedAsset={asset}
            selectedTimeframe={timeframe}
            onSelectAsset={handleAssetChange}
            onSelectTimeframe={handleTimeframeChange}
          />
        </div>

        {error && <ErrorBanner message={error} onRetry={handleManualRefresh} />}
        {loading && <LoadingSkeleton />}

        {!loading && marketData && (
          <div className="animate-fade-in ft-layout">
            {/* Colonne gauche */}
            <div className="ft-col-left">
              <PriceCard data={marketData} asset={asset} />
              <PriceChart data={marketData.history} timeframe={timeframe} lastUpdated={marketData.lastUpdated} />
              {asset !== "XAUUSD" && marketData.marketCap && <FundamentalCard data={marketData} />}
              {prediction && <StrategiesPanel strategies={prediction.strategies} />}
            </div>

            {/* Colonne droite */}
            <div className="ft-col-right">
              {prediction && <PredictionCard prediction={prediction} currentPrice={marketData.price} />}
              {macroData   && <MacroPanel data={macroData} />}
              <NewsFeed news={news} />
            </div>
          </div>
        )}

        {!loading && !marketData && !error && (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📊</div>
            <div style={{ fontSize: "0.85rem" }}>Sélectionnez un actif pour charger les données</div>
          </div>
        )}
      </main>

      <style>{`
        /* ── Layout principal ── */
        .ft-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.25rem;
        }
        .ft-selector-bar {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.9rem 1.1rem;
          margin-bottom: 1.1rem;
        }
        .ft-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          grid-template-rows: auto;
          gap: 1.1rem;
          align-items: start;
        }
        .ft-col-left,
        .ft-col-right {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          min-width: 0;
        }

        /* ── Tablette ── */
        @media (max-width: 1024px) {
          .ft-layout {
            grid-template-columns: 1fr;
          }
          /* Sur tablette, la colonne droite passe en grille 2 col */
          .ft-col-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .ft-main {
            padding: 0.65rem;
          }
          .ft-selector-bar {
            padding: 0.75rem 0.85rem;
            border-radius: 10px;
            margin-bottom: 0.75rem;
          }
          .ft-layout {
            gap: 0.75rem;
          }
          .ft-col-left,
          .ft-col-right {
            gap: 0.75rem;
          }
          /* Sur mobile, colonne droite repasse en 1 col */
          .ft-col-right {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
