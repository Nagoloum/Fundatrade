import { NextResponse } from "next/server";
import { predictCrypto } from "@/lib/prediction/cryptoPredictor";
import { predictGold }   from "@/lib/prediction/goldPrediction";
import type { Asset, Timeframe, MacroData } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      asset,
      price,
      change24h,
      history,
      macro,
      timeframe = "1J",
      marketCap,
      volume24h,
    }: {
      asset:      Asset;
      price:      number;
      change24h:  number;
      history:    { date: string; price: number }[];
      macro:      MacroData;
      timeframe:  Timeframe;
      marketCap?: number;
      volume24h?: number;
    } = body;

    // ── Validation ────────────────────────────────────────────────────────
    if (!asset || !price || !history || !macro) {
      return NextResponse.json(
        { error: "Paramètres manquants : asset, price, history, macro requis" },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: "Le prix doit être positif" },
        { status: 400 }
      );
    }

    if (!Array.isArray(history) || history.length < 3) {
      return NextResponse.json(
        { error: "L'historique de prix doit contenir au moins 3 points" },
        { status: 400 }
      );
    }

    // ── Prédiction selon l'actif ──────────────────────────────────────────
    let prediction;

    if (asset === "XAUUSD") {
      prediction = predictGold({
        price,
        change24h,
        history,
        macro,
        timeframe,
      });
    } else {
      prediction = predictCrypto({
        price,
        change24h,
        marketCap,
        volume24h,
        history,
        macro,
        timeframe,
      });
    }

    return NextResponse.json({
      ...prediction,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[API/predict]", error);
    return NextResponse.json(
      { error: `Erreur lors du calcul de la prédiction : ${error.message}` },
      { status: 500 }
    );
  }
}
