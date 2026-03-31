import { NextResponse } from "next/server";
import { predictCrypto } from "@/lib/prediction/cryptoPredictor";
import { predictGold }   from "@/lib/prediction/goldPrediction";
import type { Asset, Timeframe, MacroData, SentimentData, EconomicEvent, WeeklyPrediction } from "@/types";

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekLabel(date: Date): string {
  const mon = new Date(date);
  mon.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  return `Semaine du ${fmt(mon)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset, price, change24h, history, macro, timeframe = "1J",
            volume24h, sentiment, economicEvents }: {
      asset: Asset; price: number; change24h: number;
      history: { date: string; price: number }[];
      macro: MacroData; timeframe: Timeframe;
      volume24h?: number; sentiment?: SentimentData;
      economicEvents?: EconomicEvent[];
    } = body;

    if (!asset || !price || !history || !macro)
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

    // Generate the technical prediction
    const prediction = asset === "XAUUSD"
      ? predictGold({ price, change24h, history, macro, timeframe, sentiment, economicEvents })
      : predictCrypto({ price, change24h, volume24h, history, macro, timeframe, sentiment, economicEvents });

    const now     = new Date();
    const weekId  = getISOWeek(now);
    const id      = `${weekId}-${asset}-${timeframe}`;

    const weeklyPrediction: WeeklyPrediction = {
      id, weekId, weekLabel: getWeekLabel(now), asset, timeframe,
      direction:        prediction.direction,
      entryPrice:       price,
      targetPrice:      prediction.targetPrice,
      stopLoss:         prediction.stopLoss,
      confidence:       prediction.confidence,
      riskRewardRatio:  prediction.riskRewardRatio,
      fundamentalScore: prediction.fundamentalScore,
      technicalScore:   prediction.technicalScore,
      sentimentScore:   prediction.sentimentScore,
      globalScore:      prediction.globalScore,
      reasoning:        prediction.reasoning,
      keyEvents:        (economicEvents || []).filter(e => e.impact === "High").slice(0, 5),
      createdAt:        now.toISOString(),
      status:           "active",
    };

    return NextResponse.json(weeklyPrediction);
  } catch (error: any) {
    console.error("[API/weekly-predict]", error);
    return NextResponse.json({ error: `Weekly prediction error: ${error.message}` }, { status: 500 });
  }
}
