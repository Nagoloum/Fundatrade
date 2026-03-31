"use client";
import type { WeeklyPrediction, Asset, Timeframe, WeeklyStatus } from "@/types";

const STORAGE_KEY = "ft-weekly-predictions-v1";

// ─── ISO Week helpers ─────────────────────────────────────────────
export function getISOWeekId(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function getMondayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isMonday(date: Date = new Date()): boolean {
  return date.getDay() === 1;
}

export function getCurrentWeekId(): string {
  return getISOWeekId(new Date());
}

// ─── CRUD operations ─────────────────────────────────────────────
export function loadAllWeeklyPredictions(): WeeklyPrediction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveAllWeeklyPredictions(preds: WeeklyPrediction[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preds)); } catch {}
}

export function saveWeeklyPrediction(pred: WeeklyPrediction): void {
  const all = loadAllWeeklyPredictions();
  const idx = all.findIndex(p => p.id === pred.id);
  if (idx >= 0) all[idx] = pred; else all.push(pred);
  saveAllWeeklyPredictions(all);
}

export function getWeeklyPrediction(asset: Asset, timeframe: Timeframe, weekId?: string): WeeklyPrediction | null {
  const wid = weekId || getCurrentWeekId();
  const id  = `${wid}-${asset}-${timeframe}`;
  const all = loadAllWeeklyPredictions();
  return all.find(p => p.id === id) || null;
}

export function getHistoricalPredictions(asset?: Asset): WeeklyPrediction[] {
  const all  = loadAllWeeklyPredictions();
  const curr = getCurrentWeekId();
  return all
    .filter(p => p.weekId !== curr && (asset ? p.asset === asset : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Status & P&L management ──────────────────────────────────────
export function updateWeeklyPnL(id: string, currentPrice: number): WeeklyPrediction | null {
  const all  = loadAllWeeklyPredictions();
  const idx  = all.findIndex(p => p.id === id);
  if (idx < 0) return null;

  const pred = all[idx];
  if (pred.status !== "active") return pred;

  const pnlPct = ((currentPrice - pred.entryPrice) / pred.entryPrice) * 100;
  const directedPnl = pred.direction === "BEARISH" ? -pnlPct : pnlPct;

  // Update peak P&L
  if (pred.peakPnlPercent === undefined || directedPnl > pred.peakPnlPercent) {
    all[idx] = { ...pred, peakPnlPercent: parseFloat(directedPnl.toFixed(3)) };
  }

  // Check if target or stop hit
  let newStatus: WeeklyStatus = "active";
  if (pred.direction === "BULLISH") {
    if (currentPrice >= pred.targetPrice) newStatus = "target_hit";
    else if (currentPrice <= pred.stopLoss)  newStatus = "stop_hit";
  } else if (pred.direction === "BEARISH") {
    if (currentPrice <= pred.targetPrice) newStatus = "target_hit";
    else if (currentPrice >= pred.stopLoss)  newStatus = "stop_hit";
  }

  if (newStatus !== "active") {
    all[idx] = {
      ...all[idx],
      status: newStatus,
      closedPrice: currentPrice,
      closedAt: new Date().toISOString(),
      finalPnlPercent: parseFloat(directedPnl.toFixed(3)),
    };
  }

  saveAllWeeklyPredictions(all);
  return all[idx];
}

export function expireOldPredictions(): void {
  const all  = loadAllWeeklyPredictions();
  const curr = getCurrentWeekId();
  let changed = false;

  const updated = all.map(p => {
    if (p.weekId !== curr && p.status === "active") {
      changed = true;
      // Calculate final P&L from peak if available
      const finalPnl = p.peakPnlPercent ?? 0;
      return {
        ...p,
        status: "expired" as WeeklyStatus,
        finalPnlPercent: finalPnl,
        closedAt: p.closedAt || new Date().toISOString(),
      };
    }
    return p;
  });

  if (changed) saveAllWeeklyPredictions(updated);
}

// ─── Statistics ───────────────────────────────────────────────────
export interface WeeklyStats {
  total: number;
  wins: number;
  losses: number;
  expired: number;
  winRate: number;
  avgPnlWins: number;
  avgPnlLosses: number;
  bestWeek: number;
  worstWeek: number;
  totalCumulativePnl: number;
  byAsset: Record<string, { total: number; wins: number; winRate: number }>;
  byTimeframe: Record<string, { total: number; wins: number; winRate: number }>;
}

export function computeWeeklyStats(preds: WeeklyPrediction[]): WeeklyStats {
  const closed = preds.filter(p => p.status !== "active");
  const wins   = closed.filter(p => p.status === "target_hit");
  const losses = closed.filter(p => p.status === "stop_hit");
  const expired = closed.filter(p => p.status === "expired");

  const winPnls  = wins.map(p => p.finalPnlPercent ?? 0);
  const lossPnls = losses.map(p => p.finalPnlPercent ?? 0);
  const allPnls  = closed.map(p => p.finalPnlPercent ?? 0);

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // By asset
  const byAsset: Record<string, { total: number; wins: number; winRate: number }> = {};
  closed.forEach(p => {
    if (!byAsset[p.asset]) byAsset[p.asset] = { total: 0, wins: 0, winRate: 0 };
    byAsset[p.asset].total++;
    if (p.status === "target_hit") byAsset[p.asset].wins++;
  });
  Object.keys(byAsset).forEach(k => {
    byAsset[k].winRate = byAsset[k].total > 0 ? Math.round(byAsset[k].wins / byAsset[k].total * 100) : 0;
  });

  // By timeframe
  const byTimeframe: Record<string, { total: number; wins: number; winRate: number }> = {};
  closed.forEach(p => {
    if (!byTimeframe[p.timeframe]) byTimeframe[p.timeframe] = { total: 0, wins: 0, winRate: 0 };
    byTimeframe[p.timeframe].total++;
    if (p.status === "target_hit") byTimeframe[p.timeframe].wins++;
  });
  Object.keys(byTimeframe).forEach(k => {
    byTimeframe[k].winRate = byTimeframe[k].total > 0 ? Math.round(byTimeframe[k].wins / byTimeframe[k].total * 100) : 0;
  });

  return {
    total:              closed.length,
    wins:               wins.length,
    losses:             losses.length,
    expired:            expired.length,
    winRate:            closed.length > 0 ? Math.round(wins.length / closed.length * 100) : 0,
    avgPnlWins:         parseFloat(avg(winPnls).toFixed(2)),
    avgPnlLosses:       parseFloat(avg(lossPnls).toFixed(2)),
    bestWeek:           allPnls.length > 0 ? parseFloat(Math.max(...allPnls).toFixed(2)) : 0,
    worstWeek:          allPnls.length > 0 ? parseFloat(Math.min(...allPnls).toFixed(2)) : 0,
    totalCumulativePnl: parseFloat(allPnls.reduce((a, b) => a + b, 0).toFixed(2)),
    byAsset,
    byTimeframe,
  };
}
