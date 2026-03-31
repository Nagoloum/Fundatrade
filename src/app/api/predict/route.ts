import { NextResponse } from "next/server";
import { predictCrypto } from "@/lib/prediction/cryptoPredictor";
import { predictGold }   from "@/lib/prediction/goldPrediction";
import type { Asset, Timeframe, MacroData, SentimentData, EconomicEvent } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset, price, change24h, history, macro, timeframe = "1J",
            volume24h, sentiment, economicEvents,
            history4H, history1J, history1W }: {
      asset: Asset; price: number; change24h: number;
      history: { date: string; price: number }[];
      macro: MacroData; timeframe: Timeframe;
      volume24h?: number; sentiment?: SentimentData;
      economicEvents?: EconomicEvent[];
      history4H?: { date: string; price: number }[];
      history1J?: { date: string; price: number }[];
      history1W?: { date: string; price: number }[];
    } = body;

    if (!asset || !price || !history || !macro)
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    if (price <= 0)
      return NextResponse.json({ error: "Le prix doit être positif" }, { status: 400 });
    if (!Array.isArray(history) || history.length < 3)
      return NextResponse.json({ error: "Historique insuffisant (min 3 points)" }, { status: 400 });

    const prediction = asset === "XAUUSD"
      ? predictGold({ price, change24h, history, macro, timeframe, sentiment, economicEvents })
      : predictCrypto({ price, change24h, volume24h, history, macro, timeframe, sentiment, economicEvents, history4H, history1J, history1W });

    return NextResponse.json({ ...prediction, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("[API/predict]", error);
    return NextResponse.json({ error: `Prédiction échouée: ${error.message}` }, { status: 500 });
  }
}
