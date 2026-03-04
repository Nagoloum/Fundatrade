"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Asset, Timeframe, MarketData, MacroData, Prediction,
  NewsItem, SentimentData, DerivativesData,
} from "@/types";

// Layout
import Header        from "@/components/layout/Header";
import AssetSelector from "@/components/layout/AssetSelector";
// Market
import PriceCard       from "@/components/market/PriceCard";
import PriceChart      from "@/components/market/PriceChart";
import FundamentalCard from "@/components/market/FundamentalCard";
// Prediction
import PredictionCard  from "@/components/prediction/PredictionCard";
import StrategiesPanel from "@/components/strategy/StrategiesPanel";
import MultiTFPanel    from "@/components/strategy/MultiTFPanel";
// Sentiment & Dérivés
import SentimentPanel   from "@/components/sentiment/SentimentPanel";
import DerivativesPanel from "@/components/derivatives/DerivativesPanel";
// Macro & News
import MacroPanel from "@/components/macro/MacroPanel";
import NewsFeed   from "@/components/news/NewsFeed";
// UI
import { ErrorBanner, LoadingSkeleton } from "@/components/ui/Feedback";
// API client
import {
  fetchCrypto, fetchGold, fetchMacro, fetchNews,
  fetchPrediction, fetchSentiment, fetchDerivatives,
} from "@/lib/api/client";
// Outils (modales légères, chargement dynamique)
import dynamic from "next/dynamic";
const TradingJournal = dynamic(() => import("@/components/tools/TradingJournal"), { ssr: false });
const AlertsPanel    = dynamic(() => import("@/components/tools/AlertsPanel"),    { ssr: false });

// ─── Intervalles de refresh ───────────────────────────────────────────────
const MACRO_REFRESH_MS = 300_000;   // 5 min
const NEWS_REFRESH_MS  = 300_000;   // 5 min
const SENT_REFRESH_MS  = 600_000;   // 10 min
const PRED_REFRESH_MS  = 30_000;    // 30s (recalcul prédiction quand WS update prix)

// ─── Mapping WebSocket Kraken ─────────────────────────────────────────────
const WS_PAIR: Record<Asset, string | null> = {
  BTC:    "XBT/USD",
  ETH:    "ETH/USD",
  SOL:    "SOL/USD",
  XAUUSD: null, // Or non disponible sur Kraken WS → polling Yahoo
};

export default function Home() {
  const [asset,     setAsset]     = useState<Asset>("BTC");
  const [timeframe, setTimeframe] = useState<Timeframe>("1J");

  const [marketData,  setMarketData]  = useState<MarketData | null>(null);
  const [macroData,   setMacroData]   = useState<MacroData | null>(null);
  const [prediction,  setPrediction]  = useState<Prediction | null>(null);
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [sentiment,   setSentiment]   = useState<SentimentData | null>(null);
  const [derivatives, setDerivatives] = useState<DerivativesData | null>(null);

  // Prix live (mis à jour par WebSocket sans recharger tout le marketData)
  const [livePrice,   setLivePrice]   = useState<number | null>(null);
  const [priceFlash,  setPriceFlash]  = useState<"up" | "down" | null>(null);

  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLive,      setIsLive]      = useState(true);

  const [showJournal, setShowJournal] = useState(false);
  const [showAlerts,  setShowAlerts]  = useState(false);

  // Refs
  const macroRef   = useRef<NodeJS.Timeout | null>(null);
  const newsRef    = useRef<NodeJS.Timeout | null>(null);
  const sentRef    = useRef<NodeJS.Timeout | null>(null);
  const predRef    = useRef<NodeJS.Timeout | null>(null);
  const wsRef      = useRef<WebSocket | null>(null);
  const prevPrice  = useRef<number | null>(null);
  const macroRef2  = useRef<MacroData | null>(null);
  const sentRef2   = useRef<SentimentData | null>(null);

  // Synchroniser refs avec state pour les callbacks
  macroRef2.current = macroData;
  sentRef2.current  = sentiment;

  // ── Fetch initial complet ──────────────────────────────────────────────
  const fetchAll = useCallback(async (a: Asset, tf: Timeframe) => {
    setLoading(true);
    setError(null);
    setLivePrice(null);
    try {
      const [market, macro, newsData, sentData, derivData] = await Promise.allSettled([
        a === "XAUUSD" ? fetchGold(tf) : fetchCrypto(a, tf),
        fetchMacro(),
        fetchNews(a),
        fetchSentiment(a),
        a !== "XAUUSD" ? fetchDerivatives(a) : Promise.resolve(null),
      ]);

      const marketVal = market.status  === "fulfilled" ? market.value  : null;
      const macroVal  = macro.status   === "fulfilled" ? macro.value   : null;
      const sentVal   = sentData.status === "fulfilled" ? (sentData.value as SentimentData) : null;
      const derivVal  = derivData.status === "fulfilled" ? (derivData.value as DerivativesData | null) : null;

      if (marketVal) { setMarketData(marketVal); prevPrice.current = marketVal.price; }
      if (macroVal)  setMacroData(macroVal);
      setNews(newsData.status === "fulfilled" ? newsData.value : []);
      if (sentVal)  setSentiment(sentVal);
      if (derivVal) setDerivatives(derivVal);

      if (marketVal && macroVal) {
        const pred = await fetchPrediction({
          asset: a, price: marketVal.price, change24h: marketVal.change24h,
          history: marketVal.history, macro: macroVal, timeframe: tf,
          marketCap: marketVal.marketCap, volume24h: marketVal.volume24h,
          sentiment: sentVal ?? undefined,
        });
        setPrediction(pred);
      }

      setLastRefresh(new Date());
      setIsLive(true);
    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── WebSocket Kraken — prix tick-by-tick ───────────────────────────────
  const connectWS = useCallback((a: Asset) => {
    // Fermer WS existant
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const pair = WS_PAIR[a];
    if (!pair) return; // Or → pas de WS, polling classique

    try {
      const ws = new WebSocket("wss://ws.kraken.com/");
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: "subscribe",
          pair:  [pair],
          subscription: { name: "ticker" },
        }));
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // Le ticker Kraken WS : [channelID, {c:[lastPrice,...]}, "ticker", "XBT/USD"]
          if (!Array.isArray(msg) || msg[2] !== "ticker") return;
          const tickData = msg[1];
          const newPrice = parseFloat(tickData?.c?.[0]);
          if (!newPrice || isNaN(newPrice)) return;

          const prev = prevPrice.current;
          if (prev !== null && prev !== newPrice) {
            setPriceFlash(newPrice > prev ? "up" : "down");
            setTimeout(() => setPriceFlash(null), 600);
          }
          prevPrice.current = newPrice;
          setLivePrice(newPrice);
          setLastRefresh(new Date());
          setIsLive(true);
        } catch {}
      };

      ws.onerror = () => { setIsLive(false); };
      ws.onclose = () => {};

    } catch {}
  }, []);

  // ── Recalcul prédiction toutes les 30s avec prix live ─────────────────
  const refreshPrediction = useCallback(async () => {
    const macro = macroRef2.current;
    const sent  = sentRef2.current;
    const price = prevPrice.current;
    if (!macro || !price || !marketData) return;
    try {
      const pred = await fetchPrediction({
        asset, price, change24h: marketData.change24h,
        history: marketData.history, macro, timeframe,
        marketCap: marketData.marketCap, volume24h: marketData.volume24h,
        sentiment: sent ?? undefined,
      });
      setPrediction(pred);
    } catch {}
  }, [asset, timeframe, marketData]);

  // ── Refresh Or toutes les 30s (pas de WS disponible) ──────────────────
  const refreshGold = useCallback(async () => {
    try {
      const market = await fetchGold(timeframe);
      const prev = prevPrice.current;
      const newPrice = market.price;
      if (prev !== null && prev !== newPrice) {
        setPriceFlash(newPrice > prev ? "up" : "down");
        setTimeout(() => setPriceFlash(null), 600);
      }
      prevPrice.current = newPrice;
      setLivePrice(newPrice);
      setMarketData(market);
      setLastRefresh(new Date());
      setIsLive(true);
    } catch { setIsLive(false); }
  }, [timeframe]);

  // ── Helpers refresh périodiques ────────────────────────────────────────
  const fetchNewsOnly  = useCallback(async () => { try { setNews(await fetchNews(asset)); }           catch {} }, [asset]);
  const fetchMacroOnly = useCallback(async () => { try { setMacroData(await fetchMacro()); }          catch {} }, []);
  const fetchSentOnly  = useCallback(async () => { try { setSentiment(await fetchSentiment(asset)); } catch {} }, [asset]);

  // ── Effet principal : chargement + WS ─────────────────────────────────
  useEffect(() => {
    fetchAll(asset, timeframe);
  }, [asset, timeframe, fetchAll]);

  useEffect(() => {
    connectWS(asset);
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  }, [asset, connectWS]);

  // ── Intervalles périodiques ────────────────────────────────────────────
  useEffect(() => {
    [macroRef, newsRef, sentRef, predRef].forEach(r => { if (r.current) clearInterval(r.current); });
    macroRef.current = setInterval(fetchMacroOnly, MACRO_REFRESH_MS);
    newsRef.current  = setInterval(fetchNewsOnly,  NEWS_REFRESH_MS);
    sentRef.current  = setInterval(fetchSentOnly,  SENT_REFRESH_MS);
    predRef.current  = setInterval(
      asset === "XAUUSD" ? refreshGold : refreshPrediction,
      PRED_REFRESH_MS
    );
    return () => { [macroRef, newsRef, sentRef, predRef].forEach(r => { if (r.current) clearInterval(r.current); }); };
  }, [fetchMacroOnly, fetchNewsOnly, fetchSentOnly, refreshPrediction, refreshGold, asset]);

  const handleAssetChange     = (a: Asset)      => { setAsset(a);      setMarketData(null); setPrediction(null); setDerivatives(null); };
  const handleTimeframeChange = (tf: Timeframe) => { setTimeframe(tf); setPrediction(null); };
  const handleManualRefresh   = useCallback(() => fetchAll(asset, timeframe), [asset, timeframe, fetchAll]);

  // Prix affiché = live WS ou snapshot
  const displayPrice = livePrice ?? marketData?.price ?? null;
  const currentPrices: Partial<Record<Asset, number>> = displayPrice ? { [asset]: displayPrice } : {};

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg-base)" }}>
      <Header lastRefresh={lastRefresh} isLive={isLive} onRefresh={handleManualRefresh} />

      <main className="ft-main">
        {/* Sélecteurs */}
        <div className="ft-selector-bar">
          <AssetSelector
            selectedAsset={asset} selectedTimeframe={timeframe}
            onSelectAsset={handleAssetChange} onSelectTimeframe={handleTimeframeChange}
          />
        </div>

        {/* Barre d'outils — seulement Journal + Alertes */}
        <div className="ft-toolbar">
          <button className="btn-ghost ft-tool-btn" onClick={() => setShowJournal(true)}>📓 Journal de trading</button>
          <button className="btn-ghost ft-tool-btn" onClick={() => setShowAlerts(true)}>🔔 Alertes prix</button>
          {isLive && WS_PAIR[asset] && (
            <div className="ft-ws-badge">
              <span className="live-dot" />
              Prix WebSocket temps réel
            </div>
          )}
        </div>

        {error   && <ErrorBanner message={error} onRetry={handleManualRefresh} />}
        {loading && <LoadingSkeleton />}

        {!loading && marketData && (
          <div className="animate-fade-in ft-layout">

            {/* ══ Colonne GAUCHE ══════════════════════════════════════════ */}
            <div className="ft-col-left">
              {/* Prix avec flash live */}
              <div className={priceFlash ? `price-flash-${priceFlash}` : ""}>
                <PriceCard
                  data={{ ...marketData, price: displayPrice ?? marketData.price }}
                  asset={asset}
                />
              </div>

              <PriceChart
                data={marketData.history}
                timeframe={timeframe}
                lastUpdated={marketData.lastUpdated}
              />

              {asset !== "XAUUSD" && marketData.marketCap && (
                <FundamentalCard data={marketData} />
              )}

              {/* Stratégies + MultiTF + Sentiment + Actualités — côté gauche */}
              {prediction && <StrategiesPanel strategies={prediction.strategies} />}
              {prediction?.multiTF && <MultiTFPanel data={prediction.multiTF} />}
              {sentiment && (
                <SentimentPanel data={sentiment} isCrypto={asset !== "XAUUSD"} />
              )}
              <NewsFeed news={news} />
            </div>

            {/* ══ Colonne DROITE ══════════════════════════════════════════ */}
            <div className="ft-col-right">
              {prediction && (
                <PredictionCard
                  prediction={prediction}
                  currentPrice={displayPrice ?? marketData.price}
                />
              )}
              {derivatives && asset !== "XAUUSD" && (
                <DerivativesPanel data={derivatives} asset={asset} />
              )}
              {macroData && <MacroPanel data={macroData} />}
            </div>

          </div>
        )}

        {!loading && !marketData && !error && (
          <div style={{ textAlign:"center", padding:"4rem 1rem", color:"var(--text-muted)" }}>
            <div style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>📊</div>
            <div style={{ fontSize:"0.85rem" }}>Sélectionnez un actif pour charger les données</div>
          </div>
        )}
      </main>

      {showJournal && <TradingJournal onClose={() => setShowJournal(false)} />}
      {showAlerts  && <AlertsPanel currentPrices={currentPrices} onClose={() => setShowAlerts(false)} />}

      <style>{`
        .ft-main { max-width: 1400px; margin: 0 auto; padding: 1.1rem; }
        .ft-selector-bar {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 0.75rem;
        }
        .ft-toolbar {
          display: flex; gap: 0.5rem; align-items: center;
          flex-wrap: wrap; margin-bottom: 0.9rem;
        }
        .ft-tool-btn {
          font-size: 0.68rem !important; padding: 0.32rem 0.8rem !important;
          min-height: unset !important; border-radius: 8px !important;
        }
        .ft-ws-badge {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.62rem; color: var(--text-accent);
          padding: 0.28rem 0.7rem; border-radius: 99px;
          border: 1px solid var(--border); background: var(--accent-subtle);
          margin-left: auto;
        }
        .ft-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 1rem;
          align-items: start;
        }
        .ft-col-left, .ft-col-right {
          display: flex; flex-direction: column; gap: 1rem; min-width: 0;
        }
        @media (max-width: 1024px) {
          .ft-layout { grid-template-columns: 1fr; }
          .ft-col-right {
            display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem;
          }
        }
        @media (max-width: 640px) {
          .ft-main { padding: 0.6rem; }
          .ft-selector-bar { padding: 0.6rem 0.8rem; border-radius: 10px; margin-bottom: 0.6rem; }
          .ft-toolbar { gap: 0.3rem; margin-bottom: 0.6rem; }
          .ft-tool-btn { font-size: 0.62rem !important; padding: 0.26rem 0.55rem !important; }
          .ft-ws-badge { font-size: 0.58rem; margin-left: 0; }
          .ft-layout { gap: 0.7rem; }
          .ft-col-left, .ft-col-right { gap: 0.7rem; }
          .ft-col-right { display: flex; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
