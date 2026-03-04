import { NextResponse } from "next/server";
import { predictCrypto } from "@/lib/prediction/cryptoPredictor";
import { predictGold }   from "@/lib/prediction/goldPrediction";
import type { Asset, Timeframe, MacroData, SentimentData } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      asset, price, change24h, history, macro, timeframe = "1J",
      marketCap, volume24h, sentiment,
      history4H, history1J, history1W,
    }: {
      asset: Asset; price: number; change24h: number;
      history: { date: string; price: number }[];
      macro: MacroData; timeframe: Timeframe;
      marketCap?: number; volume24h?: number;
      sentiment?: SentimentData;
      history4H?: { date: string; price: number }[];
      history1J?: { date: string; price: number }[];
      history1W?: { date: string; price: number }[];
    } = body;

    if (!asset || !price || !history || !macro)
      return NextResponse.json({ error: "Paramètres manquants : asset, price, history, macro requis" }, { status: 400 });
    if (price <= 0)
      return NextResponse.json({ error: "Le prix doit être positif" }, { status: 400 });
    if (!Array.isArray(history) || history.length < 3)
      return NextResponse.json({ error: "L'historique doit contenir au moins 3 points" }, { status: 400 });

    const prediction = asset === "XAUUSD"
      ? predictGold({ price, change24h, history, macro, timeframe, sentiment })
      : predictCrypto({ price, change24h, marketCap, volume24h, history, macro, timeframe, sentiment, history4H, history1J, history1W });

    return NextResponse.json({ ...prediction, timestamp: new Date().toISOString() });

  } catch (error: any) {
    console.error("[API/predict]", error);
    return NextResponse.json({ error: `Erreur prédiction : ${error.message}` }, { status: 500 });
  }
}
