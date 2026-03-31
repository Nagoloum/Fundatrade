import { NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════════════
// ECONOMIC CALENDAR — Forex Factory (free, no key)
// Fetched once per week · High-impact USD events only
// ═══════════════════════════════════════════════════════════════════

export interface EconomicEventRaw {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

// High-impact economic events that affect BTC and Gold
const KEY_KEYWORDS = [
  "nonfarm", "non-farm", "employment", "unemployment", "jobs",
  "cpi", "inflation", "pce",
  "fed", "fomc", "interest rate", "federal",
  "gdp", "growth",
  "pmi", "ism", "manufacturing",
  "retail sales",
  "consumer confidence",
  "durable goods",
  "treasury", "bond",
  "dollar", "dxy",
  "gold", "oil",
  "geopolitical",
];

function isRelevant(event: EconomicEventRaw): boolean {
  const lower = event.title.toLowerCase();
  const isHighOrMedium = event.impact === "High" || event.impact === "Medium";
  const isUSD = event.country === "USD" || event.country === "US";
  const isKeyword = KEY_KEYWORDS.some(kw => lower.includes(kw));
  return isHighOrMedium && (isUSD || isKeyword);
}

export async function GET() {
  try {
    // Forex Factory free weekly calendar (no auth required)
    const res = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { next: { revalidate: 43200 } } // Cache 12h (data doesn't change mid-week)
    );

    if (!res.ok) {
      // Fallback: return empty with a note
      return NextResponse.json({
        events: [],
        weekLabel: getWeekLabel(),
        note: "Calendar temporarily unavailable",
      });
    }

    const raw: EconomicEventRaw[] = await res.json();

    // Filter: High/Medium impact + USD + relevant keywords
    const filtered = raw
      .filter(e => e.impact === "High" || (e.impact === "Medium" && isRelevant(e)))
      .filter(e => e.country === "USD" || isRelevant(e))
      .map(e => ({
        title:    e.title,
        country:  e.country || "USD",
        date:     e.date,
        impact:   e.impact as "High" | "Medium" | "Low",
        forecast: e.forecast || undefined,
        previous: e.previous || undefined,
        actual:   e.actual   || undefined,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      events: filtered,
      weekLabel: getWeekLabel(),
      fetchedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[economic-calendar]", error.message);
    return NextResponse.json({
      events: [],
      weekLabel: getWeekLabel(),
      note: `Error: ${error.message}`,
    });
  }
}

function getWeekLabel(): string {
  const now   = new Date();
  const mon   = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sun   = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt   = (d: Date) => d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return `Semaine du ${fmt(mon)} au ${fmt(sun)}`;
}
