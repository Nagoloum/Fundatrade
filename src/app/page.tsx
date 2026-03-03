"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Asset, Timeframe, MarketData, MacroData, Prediction, NewsItem } from "@/types";

// Layout
import Header        from "@/components/layout/Header";
import AssetSelector from "@/components/layout/AssetSelector";

// Market
import PriceCard      from "@/components/market/PriceCard";
import PriceChart     from "@/components/market/PriceChart";
import FundamentalCard from "@/components/market/FundamentalCard";

// Prediction
import PredictionCard  from "@/components/prediction/PredictionCard";
import StrategiesPanel from "@/components/strategy/StrategiesPanel";

// Macro & News
import MacroPanel from "@/components/macro/MacroPanel";
import NewsFeed   from "@/components/news/NewsFeed";

// UX
import { ErrorBanner, LoadingSkeleton } from "@/components/ui/Feedback";

// API client
import {
  fetchCrypto,
  fetchGold,
  fetchMacro,
  fetchNews,
  fetchPrediction,
} from "@/lib/api/client";

// ─── Intervalle de rafraîchissement temps réel ───────────────────────────────
// Prix : toutes les 30s | Macro : toutes les 5min | News : toutes les 5min
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
  const [priceLoading, setPriceLoading] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [lastRefresh,  setLastRefresh]  = useState<Date | null>(null);
  const [isLive,       setIsLive]       = useState(true);

  // Refs pour les intervalles
  const priceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const macroIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const newsIntervalRef  = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch complet (changement d'actif ou timeframe) ──────────────────────
  const fetchAll = useCallback(async (selectedAsset: Asset, selectedTimeframe: Timeframe) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Données de marché + macro + news en parallèle
      const [market, macro, newsData] = await Promise.all([
        selectedAsset === "XAUUSD"
          ? fetchGold(selectedTimeframe)
          : fetchCrypto(selectedAsset, selectedTimeframe),
        fetchMacro(),
        fetchNews(selectedAsset),
      ]);

      setMarketData(market);
      setMacroData(macro);
      setNews(newsData);

      // 2. Prédiction (dépend des données de marché et macro)
      const pred = await fetchPrediction({
        asset:      selectedAsset,
        price:      market.price,
        change24h:  market.change24h,
        history:    market.history,
        macro,
        timeframe:  selectedTimeframe,
        marketCap:  market.marketCap,
        volume24h:  market.volume24h,
      });

      setPrediction(pred);
      setLastRefresh(new Date());
      setIsLive(true);

    } catch (err: any) {
      console.error("[fetchAll]", err);
      setError(err.message || "Erreur lors du chargement des données");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch prix seulement (temps réel — rafraîchissement léger) ───────────
  const fetchPriceOnly = useCallback(async () => {
    if (!macroData) return;
    setPriceLoading(true);

    try {
      const market = asset === "XAUUSD"
        ? await fetchGold(timeframe)
        : await fetchCrypto(asset, timeframe);

      setMarketData(market);

      // Recalculer la prédiction avec le nouveau prix
      const pred = await fetchPrediction({
        asset,
        price:     market.price,
        change24h: market.change24h,
        history:   market.history,
        macro:     macroData,
        timeframe,
        marketCap: market.marketCap,
        volume24h: market.volume24h,
      });

      setPrediction(pred);
      setLastRefresh(new Date());
      setIsLive(true);

    } catch (err: any) {
      console.error("[fetchPriceOnly]", err.message);
      setIsLive(false);
    } finally {
      setPriceLoading(false);
    }
  }, [asset, timeframe, macroData]);

  // ── Fetch news seulement ──────────────────────────────────────────────────
  const fetchNewsOnly = useCallback(async () => {
    try {
      const newsData = await fetchNews(asset);
      setNews(newsData);
    } catch (err) {
      console.error("[fetchNewsOnly]", err);
    }
  }, [asset]);

  // ── Fetch macro seulement ─────────────────────────────────────────────────
  const fetchMacroOnly = useCallback(async () => {
    try {
      const macro = await fetchMacro();
      setMacroData(macro);
    } catch (err) {
      console.error("[fetchMacroOnly]", err);
    }
  }, []);

  // ── Chargement initial + changement d'actif/timeframe ────────────────────
  useEffect(() => {
    fetchAll(asset, timeframe);
  }, [asset, timeframe, fetchAll]);

  // ── Intervalles temps réel ────────────────────────────────────────────────
  useEffect(() => {
    // Clear anciens intervalles
    if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
    if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);
    if (newsIntervalRef.current)  clearInterval(newsIntervalRef.current);

    // Prix toutes les 30s
    priceIntervalRef.current = setInterval(fetchPriceOnly, PRICE_REFRESH_MS);
    // Macro toutes les 5min
    macroIntervalRef.current = setInterval(fetchMacroOnly, MACRO_REFRESH_MS);
    // News toutes les 5min
    newsIntervalRef.current  = setInterval(fetchNewsOnly,  NEWS_REFRESH_MS);

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (macroIntervalRef.current) clearInterval(macroIntervalRef.current);
      if (newsIntervalRef.current)  clearInterval(newsIntervalRef.current);
    };
  }, [fetchPriceOnly, fetchMacroOnly, fetchNewsOnly]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAssetChange = (newAsset: Asset) => {
    setAsset(newAsset);
    setMarketData(null);
    setPrediction(null);
  };

  const handleTimeframeChange = (newTf: Timeframe) => {
    setTimeframe(newTf);
    setPrediction(null);
  };

  const handleManualRefresh = useCallback(() => {
    fetchAll(asset, timeframe);
  }, [asset, timeframe, fetchAll]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Header fixe */}
      <Header
        lastRefresh={lastRefresh}
        isLive={isLive}
        onRefresh={handleManualRefresh}
      />

      {/* Contenu principal */}
      <main
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "1.5rem",
        }}
      >
        {/* Sélecteurs */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <AssetSelector
            selectedAsset={asset}
            selectedTimeframe={timeframe}
            onSelectAsset={handleAssetChange}
            onSelectTimeframe={handleTimeframeChange}
          />
        </div>

        {/* Erreur globale */}
        {error && (
          <ErrorBanner
            message={error}
            onRetry={handleManualRefresh}
          />
        )}

        {/* Skeleton de chargement */}
        {loading && <LoadingSkeleton />}

        {/* Contenu principal */}
        {!loading && marketData && (
          <div
            className="animate-fade-in"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "1.25rem",
            }}
          >
            {/* Layout responsive : 2 colonnes sur grand écran */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 380px",
                gap: "1.25rem",
              }}
              className="responsive-grid"
            >
              {/* ── Colonne gauche ──────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
                {/* Prix en temps réel */}
                <PriceCard data={marketData} asset={asset} />

                {/* Graphique */}
                <PriceChart
                  data={marketData.history}
                  timeframe={timeframe}
                  lastUpdated={marketData.lastUpdated}
                />

                {/* Fondamentaux (crypto seulement) */}
                {asset !== "XAUUSD" && marketData.marketCap && (
                  <FundamentalCard data={marketData} />
                )}

                {/* Analyses stratégiques */}
                {prediction && (
                  <StrategiesPanel strategies={prediction.strategies} />
                )}
              </div>

              {/* ── Colonne droite ──────────────────────────────────────── */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Prédiction IA */}
                {prediction && (
                  <PredictionCard
                    prediction={prediction}
                    currentPrice={marketData.price}
                  />
                )}

                {/* Données macro */}
                {macroData && <MacroPanel data={macroData} />}

                {/* Actualités */}
                <NewsFeed news={news} />
              </div>
            </div>
          </div>
        )}

        {/* État vide si pas de données et pas de chargement */}
        {!loading && !marketData && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📊</div>
            <div style={{ fontSize: "0.9rem" }}>
              Sélectionnez un actif pour charger les données
            </div>
          </div>
        )}
      </main>

      {/* CSS responsive inline */}
      <style>{`
        @media (max-width: 1024px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          main {
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
