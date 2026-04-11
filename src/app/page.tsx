"use client";

import type { Asset, DerivativesData, EconomicEvent, MacroData, MarketData, NewsItem, Prediction, SentimentData, Timeframe, WeeklyPrediction } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

// Components
import DerivativesPanel from "@/components/derivatives/DerivativesPanel";
import EconomicCalendarPanel from "@/components/economic/EconomicCalendarPanel";
import HistoryPanel from "@/components/history/HistoryPanel";
import AssetSelector from "@/components/layout/AssetSelector";
import Header from "@/components/layout/Header";
import MacroPanel from "@/components/macro/MacroPanel";
import PriceCard from "@/components/market/PriceCard";
import PriceChart from "@/components/market/PriceChart";
import NewsFeed from "@/components/news/NewsFeed";
import PredictionCard from "@/components/prediction/PredictionCard";
import WeeklyObjectiveCard from "@/components/prediction/WeeklyObjectiveCard";
import SentimentPanel from "@/components/sentiment/SentimentPanel";
import StrategiesPanel from "@/components/strategy/StrategiesPanel";
import { ErrorBanner, LoadingSkeleton } from "@/components/ui/Feedback";

// Lib
import { fetchCrypto, fetchDerivatives, fetchEconomicCalendar, fetchGold, fetchMacro, fetchNews, fetchPrediction, fetchSentiment, fetchWeeklyPrediction } from "@/lib/api/client";
import { expireOldPredictions, getWeeklyPrediction, saveWeeklyPrediction, updateWeeklyPnL } from "@/lib/weekly/weeklyStorage";

// Refresh intervals
const MACRO_MS = 300_000;   // 5 min
const NEWS_MS  = 300_000;   // 5 min
const SENT_MS  = 600_000;   // 10 min
const PRED_MS  = 30_000;    // 30 sec

// Kraken WS pairs
const WS_PAIR: Record<Asset, string | null> = {
  BTC:    "XBT/USD",
  XAUUSD: null,
};

export default function Home() {
  const [asset,     setAsset]     = useState<Asset>("BTC");
  const [timeframe, setTimeframe] = useState<Timeframe>("1J");
  const [activeTab, setActiveTab] = useState<"dashboard" | "history">("dashboard");

  const [marketData,  setMarketData]  = useState<MarketData | null>(null);
  const [macroData,   setMacroData]   = useState<MacroData | null>(null);
  const [prediction,  setPrediction]  = useState<Prediction | null>(null);
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [sentiment,   setSentiment]   = useState<SentimentData | null>(null);
  const [derivatives, setDerivatives] = useState<DerivativesData | null>(null);
  const [econEvents,  setEconEvents]  = useState<EconomicEvent[]>([]);
  const [econLabel,   setEconLabel]   = useState<string>("");
  const [weeklyPred,  setWeeklyPred]  = useState<WeeklyPrediction | null>(null);
  const [generating,  setGenerating]  = useState(false);

  const [livePrice,   setLivePrice]   = useState<number | null>(null);
  const [priceFlash,  setPriceFlash]  = useState<"up" | "down" | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isLive,      setIsLive]      = useState(true);

  // Refs
  const macroRef  = useRef<NodeJS.Timeout | null>(null);
  const newsRef   = useRef<NodeJS.Timeout | null>(null);
  const sentRef   = useRef<NodeJS.Timeout | null>(null);
  const predRef   = useRef<NodeJS.Timeout | null>(null);
  const wsRef     = useRef<WebSocket | null>(null);
  const prevPrice = useRef<number | null>(null);
  const macroRef2 = useRef<MacroData | null>(null);
  const sentRef2  = useRef<SentimentData | null>(null);

  macroRef2.current = macroData;
  sentRef2.current  = sentiment;

  // ── Load stored weekly prediction ──────────────────────────────────
  const loadWeeklyPred = useCallback(() => {
    expireOldPredictions();
    const stored = getWeeklyPrediction(asset, timeframe);
    setWeeklyPred(stored);
  }, [asset, timeframe]);

  // ── Update live P&L for weekly prediction ───────────────────────────
  const updateWeeklyLivePnL = useCallback((price: number) => {
    const stored = getWeeklyPrediction(asset, timeframe);
    if (stored && stored.status === "active") {
      const updated = updateWeeklyPnL(stored.id, price);
      if (updated) setWeeklyPred(updated);
    }
  }, [asset, timeframe]);

  // ── Generate weekly prediction ───────────────────────────────────────
  const generateWeeklyPrediction = useCallback(async () => {
    const macro  = macroRef2.current;
    const sent   = sentRef2.current;
    const price  = prevPrice.current;
    if (!macro || !price || !marketData) return;

    setGenerating(true);
    try {
      const pred = await fetchWeeklyPrediction({
        asset, price, change24h: marketData.change24h,
        history: marketData.history, macro, timeframe,
        volume24h: marketData.volume24h,
        sentiment: sent ?? undefined,
        economicEvents: econEvents,
      });
      saveWeeklyPrediction(pred);
      setWeeklyPred(pred);
    } catch (err: any) {
      console.error("Weekly predict error:", err.message);
    } finally {
      setGenerating(false);
    }
  }, [asset, timeframe, marketData, econEvents]);

  // ── Full data fetch ──────────────────────────────────────────────────
  const fetchAll = useCallback(async (a: Asset, tf: Timeframe) => {
    setLoading(true);
    setError(null);
    setLivePrice(null);

    try {
      const [market, macro, newsData, sentData, derivData, econData] = await Promise.allSettled([
        a === "XAUUSD" ? fetchGold(tf) : fetchCrypto(tf),
        fetchMacro(),
        fetchNews(a),
        fetchSentiment(a),
        a !== "XAUUSD" ? fetchDerivatives() : Promise.resolve(null),
        fetchEconomicCalendar(),
      ]);

      const marketVal = market.status  === "fulfilled" ? market.value : null;
      const macroVal  = macro.status   === "fulfilled" ? macro.value  : null;
      const sentVal   = sentData.status === "fulfilled" ? sentData.value as SentimentData : null;
      const derivVal  = derivData.status === "fulfilled" ? derivData.value as DerivativesData | null : null;
      const econVal   = econData.status === "fulfilled" ? econData.value : null;

      if (marketVal) { setMarketData(marketVal); prevPrice.current = marketVal.price; }
      if (macroVal)  setMacroData(macroVal);
      setNews(newsData.status === "fulfilled" ? newsData.value : []);
      if (sentVal)  setSentiment(sentVal);
      if (derivVal) setDerivatives(derivVal);
      if (econVal)  { setEconEvents(econVal.events); setEconLabel(econVal.weekLabel); }

      if (marketVal && macroVal) {
        const pred = await fetchPrediction({
          asset: a, price: marketVal.price, change24h: marketVal.change24h,
          history: marketVal.history, macro: macroVal, timeframe: tf,
          volume24h: marketVal.volume24h, sentiment: sentVal ?? undefined,
          economicEvents: econVal?.events,
        });
        setPrediction(pred);
      }

      setLastRefresh(new Date());
      setIsLive(true);

      // Load/expire weekly prediction
      expireOldPredictions();
      const storedWeekly = getWeeklyPrediction(a, tf);
      setWeeklyPred(storedWeekly);
      if (storedWeekly && storedWeekly.status === "active" && marketVal) {
        const updated = updateWeeklyPnL(storedWeekly.id, marketVal.price);
        if (updated) setWeeklyPred(updated);
      }

    } catch (err: any) {
      setError(err.message || "Erreur de chargement");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── WebSocket Kraken ─────────────────────────────────────────────────
  const connectWS = useCallback((a: Asset) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    const pair = WS_PAIR[a];
    if (!pair) return;
    try {
      const ws = new WebSocket("wss://ws.kraken.com/");
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ event: "subscribe", pair: [pair], subscription: { name: "ticker" } }));
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (!Array.isArray(msg) || msg[2] !== "ticker") return;
          const newPrice = parseFloat(msg[1]?.c?.[0]);
          if (!newPrice || isNaN(newPrice)) return;
          const prev = prevPrice.current;
          if (prev !== null && prev !== newPrice) {
            setPriceFlash(newPrice > prev ? "up" : "down");
            setTimeout(() => setPriceFlash(null), 700);
            updateWeeklyLivePnL(newPrice);
          }
          prevPrice.current = newPrice;
          setLivePrice(newPrice);
          setLastRefresh(new Date());
          setIsLive(true);
        } catch {}
      };
      ws.onerror = () => setIsLive(false);
    } catch {}
  }, [updateWeeklyLivePnL]);

  // ── Refresh prediction ───────────────────────────────────────────────
  const refreshPrediction = useCallback(async () => {
    const macro = macroRef2.current;
    const sent  = sentRef2.current;
    const price = prevPrice.current;
    if (!macro || !price || !marketData) return;
    try {
      const pred = await fetchPrediction({
        asset, price, change24h: marketData.change24h,
        history: marketData.history, macro, timeframe,
        volume24h: marketData.volume24h, sentiment: sent ?? undefined,
        economicEvents: econEvents,
      });
      setPrediction(pred);
    } catch {}
  }, [asset, timeframe, marketData, econEvents]);

  // ── Refresh Gold ─────────────────────────────────────────────────────
  const refreshGold = useCallback(async () => {
    try {
      const market = await fetchGold(timeframe);
      const prev = prevPrice.current;
      if (prev !== null && prev !== market.price) {
        setPriceFlash(market.price > prev ? "up" : "down");
        setTimeout(() => setPriceFlash(null), 700);
        updateWeeklyLivePnL(market.price);
      }
      prevPrice.current = market.price;
      setLivePrice(market.price);
      setMarketData(market);
      setLastRefresh(new Date());
      setIsLive(true);
    } catch { setIsLive(false); }
  }, [timeframe, updateWeeklyLivePnL]);

  // ── Periodic refreshes ───────────────────────────────────────────────
  const fetchNewsOnly  = useCallback(async () => { try { setNews(await fetchNews(asset)); }           catch {} }, [asset]);
  const fetchMacroOnly = useCallback(async () => { try { setMacroData(await fetchMacro()); }          catch {} }, []);
  const fetchSentOnly  = useCallback(async () => { try { setSentiment(await fetchSentiment(asset)); } catch {} }, [asset]);

  // ── Effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAll(asset, timeframe);
  }, [asset, timeframe, fetchAll]);

  useEffect(() => {
    connectWS(asset);
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  }, [asset, connectWS]);

  useEffect(() => {
    [macroRef, newsRef, sentRef, predRef].forEach(r => { if (r.current) clearInterval(r.current); });
    macroRef.current = setInterval(fetchMacroOnly, MACRO_MS);
    newsRef.current  = setInterval(fetchNewsOnly,  NEWS_MS);
    sentRef.current  = setInterval(fetchSentOnly,  SENT_MS);
    predRef.current  = setInterval(asset === "XAUUSD" ? refreshGold : refreshPrediction, PRED_MS);
    return () => { [macroRef, newsRef, sentRef, predRef].forEach(r => { if (r.current) clearInterval(r.current); }); };
  }, [fetchMacroOnly, fetchNewsOnly, fetchSentOnly, refreshPrediction, refreshGold, asset]);

  useEffect(() => {
    loadWeeklyPred();
  }, [loadWeeklyPred]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleAssetChange = (a: Asset) => {
    setAsset(a);
    setMarketData(null); setPrediction(null); setDerivatives(null); setWeeklyPred(null);
  };
  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    setPrediction(null); setWeeklyPred(null);
  };
  const handleManualRefresh = useCallback(() => fetchAll(asset, timeframe), [asset, timeframe, fetchAll]);

  const displayPrice = livePrice ?? marketData?.price ?? null;

  return (
    <>
      <div className="scan-line-effect" />
      <Header lastRefresh={lastRefresh} isLive={isLive} onRefresh={handleManualRefresh}
        activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="ft-main">
        {activeTab === "dashboard" ? (
          <>
            {/* Selector */}
            <div className="ft-selector-bar">
              <AssetSelector selectedAsset={asset} selectedTimeframe={timeframe}
                onSelectAsset={handleAssetChange} onSelectTimeframe={handleTimeframeChange} />

              {/* WS badge */}
              {isLive && WS_PAIR[asset] && (
                <div className="ft-ws-badge">
                  <div className="live-dot" />
                  <span>WebSocket Kraken</span>
                </div>
              )}
            </div>

            {error   && <ErrorBanner message={error} onRetry={handleManualRefresh} />}
            {loading && <LoadingSkeleton />}

            {!loading && marketData && displayPrice !== null && (
              <div className="animate-fade-in ft-layout">
                {/* LEFT COLUMN */}
                <div className="ft-col-left">
                  <div className={priceFlash ? `price-flash-${priceFlash}` : ""}>
                    <PriceCard data={{ ...marketData, price: displayPrice }} asset={asset} />
                  </div>
                  <PriceChart data={marketData.history} timeframe={timeframe} lastUpdated={marketData.lastUpdated} />
                  {prediction && <StrategiesPanel strategies={prediction.strategies} />}
                  {sentiment && <SentimentPanel data={sentiment} isCrypto={asset !== "XAUUSD"} />}
                  <NewsFeed news={news} />
                </div>

                {/* RIGHT COLUMN */}
                <div className="ft-col-right">
                  <WeeklyObjectiveCard
                    weekly={weeklyPred}
                    currentPrice={displayPrice}
                    asset={asset}
                    onGenerate={generateWeeklyPrediction}
                    generating={generating}
                  />
                  {prediction && <PredictionCard prediction={prediction} currentPrice={displayPrice} />}
                  {derivatives && asset !== "XAUUSD" && <DerivativesPanel data={derivatives} />}
                  <EconomicCalendarPanel events={econEvents} weekLabel={econLabel} />
                  {macroData && <MacroPanel data={macroData} />}
                </div>
              </div>
            )}

            {!loading && !marketData && !error && (
              <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>📊</div>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "0.8rem", fontWeight: 700 }}>Sélectionnez un actif</div>
              </div>
            )}
          </>
        ) : (
          <HistoryPanel />
        )}
      </main>

      <style>{`
        .ft-main { max-width: 1400px; margin: 0 auto; padding: 1rem 1.1rem; }
        .ft-selector-bar {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: 10px; padding: 0.75rem 1rem;
          margin-bottom: 0.85rem;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 0.5rem;
        }
        .ft-ws-badge {
          display: flex; align-items: center; gap: 0.38rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.56rem; color: var(--text-accent);
          padding: 0.25rem 0.65rem; border-radius: 99px;
          border: 1px solid var(--border); background: var(--accent-subtle);
          flex-shrink: 0;
        }
        .ft-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 365px;
          gap: 0.9rem; align-items: start;
        }
        .ft-col-left, .ft-col-right {
          display: flex; flex-direction: column; gap: 0.9rem; min-width: 0;
        }
        @media (max-width: 1100px) {
          .ft-layout { grid-template-columns: 1fr; }
          .ft-col-right { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
        }
        @media (max-width: 680px) {
          .ft-main { padding: 0.55rem 0.6rem; }
          .ft-selector-bar { padding: 0.6rem 0.75rem; border-radius: 9px; }
          .ft-layout { gap: 0.65rem; }
          .ft-col-left, .ft-col-right { gap: 0.65rem; }
          .ft-col-right { display: flex; flex-direction: column; }
        }
      `}</style>
    </>
  );
}
