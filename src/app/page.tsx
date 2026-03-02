"use client";

import { useState, useEffect } from "react";
import { Asset } from "@/types";
import Header from "@/components/layout/Header";
import AssetSelector from "@/components/layout/AssetSelector";
import PriceCard from "@/components/market/PriceCard";
import FundamentalCard from "@/components/market/FundamentalCard";
import PriceChart from "@/components/market/PriceChart";
import PredictionCard from "@/components/prediction/PredictionCard";
import MacroPanel from "@/components/macro/MacroPanel";
import NewsFeed from "@/components/news/NewsFeed";

export default function Home() {
  const [asset, setAsset] = useState<Asset>("BTC");
  const [marketData, setMarketData] = useState<any>(null);
  const [macroData, setMacroData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async (selectedAsset: Asset) => {
    setLoading(true);
    try {
      // Fetch market data
      const marketRes = selectedAsset === "XAUUSD"
        ? await fetch("/api/gold")
        : await fetch(`/api/crypto?symbol=${selectedAsset}`);
      const market = await marketRes.json();

      // Fetch macro
      const macroRes = await fetch("/api/macro");
      const macro = await macroRes.json();

      // Fetch news
      const newsRes = await fetch(`/api/news?asset=${selectedAsset}`);
      const newsData = await newsRes.json();

      // Fetch prediction
      const predRes = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: selectedAsset,
          price: market.price,
          change24h: market.change24h,
          fedRate: macro.fedRate,
          inflation: macro.inflation,
          history: market.history,
        }),
      });
      const pred = await predRes.json();

      setMarketData(market);
      setMacroData(macro);
      setNews(newsData);
      setPrediction(pred);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(asset); }, [asset]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white p-6">
      <Header />
      <AssetSelector selected={asset} onSelect={(a) => setAsset(a)} />

      {loading && (
        <div className="flex justify-center mt-20 text-violet-400 text-lg animate-pulse">
          Chargement des données...
        </div>
      )}

      {!loading && marketData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <PriceCard data={marketData} asset={asset} />
            <PriceChart data={marketData.history} />
            {asset !== "XAUUSD" && <FundamentalCard data={marketData} />}
          </div>
          <div className="flex flex-col gap-6">
            {prediction && <PredictionCard prediction={prediction} currentPrice={marketData.price} />}
            {macroData && <MacroPanel data={macroData} />}
            <NewsFeed news={news} />
          </div>
        </div>
      )}
    </main>
  );
}