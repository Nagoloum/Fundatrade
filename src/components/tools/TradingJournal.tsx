"use client";

import { useState, useEffect, useCallback } from "react";
import type { TradeEntry, TradeStats, Asset, Direction, Timeframe } from "@/types";

// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL DE TRADING — 100% localStorage, aucune base de données
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = "fundatrade-journal-v1";

function loadTrades(): TradeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTrades(trades: TradeEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); } catch {}
}

function computeStats(trades: TradeEntry[]): TradeStats {
  const closed = trades.filter(t => t.result && t.result !== "open");
  const wins   = closed.filter(t => t.result === "win");
  const losses = closed.filter(t => t.result === "loss");
  const be     = closed.filter(t => t.result === "breakeven");
  const pnls   = closed.map(t => t.pnlPercent ?? 0);

  return {
    total: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: be.length,
    open: trades.filter(t => !t.result || t.result === "open").length,
    winRate: closed.length > 0 ? Math.round((wins.length / closed.length) * 100) : 0,
    avgPnl: pnls.length > 0 ? parseFloat((pnls.reduce((a, b) => a + b, 0) / pnls.length).toFixed(2)) : 0,
    bestTrade:  pnls.length > 0 ? Math.max(...pnls) : 0,
    worstTrade: pnls.length > 0 ? Math.min(...pnls) : 0,
    totalPnl:   parseFloat(pnls.reduce((a, b) => a + b, 0).toFixed(2)),
    avgRR: 0,
  };
}

const ASSETS: Asset[] = ["BTC", "XAUUSD"];
const TFS: Timeframe[] = ["4H", "1J", "1W"];
const DIRS: Direction[] = ["BULLISH", "BEARISH", "NEUTRAL"];
const RESULTS = ["win", "loss", "breakeven", "open"] as const;

interface JournalProps {
  onClose: () => void;
}

export default function TradingJournal({ onClose }: JournalProps) {
  const [trades, setTrades]     = useState<TradeEntry[]>([]);
  const [stats,  setStats]      = useState<TradeStats | null>(null);
  const [tab,    setTab]        = useState<"list" | "add" | "stats">("list");
  const [filter, setFilter]     = useState<Asset | "ALL">("ALL");
  const [editId, setEditId]     = useState<string | null>(null);

  const [form, setForm] = useState({
    asset: "BTC" as Asset,
    timeframe: "1J" as Timeframe,
    direction: "BULLISH" as Direction,
    entryPrice: "",
    targetPrice: "",
    stopLoss: "",
    exitPrice: "",
    result: "open" as typeof RESULTS[number],
    note: "",
  });

  useEffect(() => {
    const t = loadTrades();
    setTrades(t);
    setStats(computeStats(t));
  }, []);

  const saveAndRefresh = useCallback((updated: TradeEntry[]) => {
    saveTrades(updated);
    setTrades(updated);
    setStats(computeStats(updated));
  }, []);

  const handleAdd = () => {
    if (!form.entryPrice) return;
    const entry = parseFloat(form.entryPrice);
    const exit  = form.exitPrice ? parseFloat(form.exitPrice) : undefined;
    let pnl: number | undefined;
    if (exit) pnl = parseFloat(((exit - entry) / entry * 100 * (form.direction === "BEARISH" ? -1 : 1)).toFixed(2));

    const trade: TradeEntry = {
      id:         Date.now().toString(),
      asset:      form.asset,
      timeframe:  form.timeframe,
      direction:  form.direction,
      entryPrice: entry,
      targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : 0,
      stopLoss:    form.stopLoss    ? parseFloat(form.stopLoss)    : 0,
      exitPrice:  exit,
      exitDate:   exit ? new Date().toISOString() : undefined,
      result:     form.result,
      pnlPercent: pnl,
      entryDate:  new Date().toISOString(),
      note:       form.note || undefined,
    };

    if (editId) {
      saveAndRefresh(trades.map(t => t.id === editId ? { ...trade, id: editId } : t));
      setEditId(null);
    } else {
      saveAndRefresh([trade, ...trades]);
    }
    setForm({ asset: "BTC", timeframe: "1J", direction: "BULLISH", entryPrice: "", targetPrice: "", stopLoss: "", exitPrice: "", result: "open", note: "" });
    setTab("list");
  };

  const handleDelete = (id: string) => saveAndRefresh(trades.filter(t => t.id !== id));
  const handleEdit = (t: TradeEntry) => {
    setEditId(t.id);
    setForm({ asset: t.asset, timeframe: t.timeframe, direction: t.direction, entryPrice: t.entryPrice.toString(), targetPrice: (t.targetPrice || "").toString(), stopLoss: (t.stopLoss || "").toString(), exitPrice: (t.exitPrice || "").toString(), result: t.result || "open", note: t.note || "" });
    setTab("add");
  };

  const filtered = filter === "ALL" ? trades : trades.filter(t => t.asset === filter);

  const statCards = stats ? [
    { label: "Total",     val: stats.total,              color: "var(--text-primary)" },
    { label: "Gagnants",  val: `${stats.wins}`,          color: "var(--bull)" },
    { label: "Perdants",  val: `${stats.losses}`,        color: "var(--bear)" },
    { label: "Win Rate",  val: `${stats.winRate}%`,      color: stats.winRate >= 50 ? "var(--bull)" : "var(--bear)" },
    { label: "PnL Total", val: `${stats.totalPnl > 0 ? "+" : ""}${stats.totalPnl}%`, color: stats.totalPnl >= 0 ? "var(--bull)" : "var(--bear)" },
    { label: "Moy PnL",   val: `${stats.avgPnl > 0 ? "+" : ""}${stats.avgPnl}%`,    color: stats.avgPnl >= 0 ? "var(--bull)" : "var(--bear)" },
  ] : [];

  return (
    <>
      <div className="ft-journal-overlay" onClick={onClose} />
      <div className="ft-journal-modal">
        {/* Header */}
        <div className="ft-journal-header">
          <div>
            <div className="ft-journal-title">📓 Journal de Trading</div>
            <div className="ft-journal-sub">{trades.length} trades · localStorage</div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ padding: "0.3rem 0.6rem", fontSize: "1rem" }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="ft-journal-tabs">
          {([["list","📋 Trades"],["add", editId ? "✏️ Modifier" : "➕ Ajouter"],["stats","📊 Stats"]] as [string,string][]).map(([id, label]) => (
            <button key={id} className={tab === id ? "ft-journal-tab ft-journal-tab-active" : "ft-journal-tab"} onClick={() => setTab(id as any)}>
              {label}
            </button>
          ))}
        </div>

        <div className="ft-journal-body">
          {/* Tab: Liste */}
          {tab === "list" && (
            <div>
              <div className="ft-journal-filter">
                {(["ALL", ...ASSETS] as (Asset | "ALL")[]).map(a => (
                  <button key={a} className={filter === a ? "btn-primary ft-tab-sm" : "btn-ghost ft-tab-sm"} onClick={() => setFilter(a)}>{a}</button>
                ))}
              </div>
              {filtered.length === 0 && <div className="ft-journal-empty">Aucun trade enregistré. Ajoutez votre premier trade !</div>}
              <div className="ft-journal-list">
                {filtered.map(t => {
                  const pnlColor = t.pnlPercent !== undefined ? (t.pnlPercent > 0 ? "var(--bull)" : t.pnlPercent < 0 ? "var(--bear)" : "var(--neutral)") : "var(--text-muted)";
                  const resColor = t.result === "win" ? "var(--bull)" : t.result === "loss" ? "var(--bear)" : "var(--neutral)";
                  return (
                    <div key={t.id} className="ft-journal-item">
                      <div className="ft-journal-item-top">
                        <div className="ft-journal-item-asset">
                          <span className="badge badge-neutral">{t.asset}</span>
                          <span style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>{t.timeframe}</span>
                          <span style={{ fontSize: "0.65rem", color: t.direction === "BULLISH" ? "var(--bull)" : t.direction === "BEARISH" ? "var(--bear)" : "var(--neutral)", fontWeight: 700 }}>
                            {t.direction === "BULLISH" ? "▲" : t.direction === "BEARISH" ? "▼" : "◆"} {t.direction}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          {t.result && t.result !== "open" && <span style={{ fontSize: "0.6rem", fontWeight: 700, color: resColor, textTransform: "uppercase" }}>{t.result}</span>}
                          {t.pnlPercent !== undefined && <span style={{ fontFamily: "var(--font-mono),monospace", fontSize: "0.72rem", fontWeight: 700, color: pnlColor }}>{t.pnlPercent > 0 ? "+" : ""}{t.pnlPercent}%</span>}
                          <button className="btn-ghost" style={{ padding: "0.15rem 0.35rem", fontSize: "0.6rem" }} onClick={() => handleEdit(t)}>Éditer</button>
                          <button className="btn-ghost" style={{ padding: "0.15rem 0.35rem", fontSize: "0.6rem", color: "var(--bear)" }} onClick={() => handleDelete(t.id)}>✕</button>
                        </div>
                      </div>
                      <div className="ft-journal-item-prices">
                        <span>Entrée <b>${t.entryPrice.toLocaleString()}</b></span>
                        {t.targetPrice ? <span>Cible <b style={{ color: "var(--bull)" }}>${t.targetPrice.toLocaleString()}</b></span> : null}
                        {t.stopLoss ? <span>Stop <b style={{ color: "var(--bear)" }}>${t.stopLoss.toLocaleString()}</b></span> : null}
                        {t.exitPrice ? <span>Sortie <b>${t.exitPrice.toLocaleString()}</b></span> : null}
                      </div>
                      {t.note && <div className="ft-journal-note">{t.note}</div>}
                      <div className="ft-journal-date">{new Date(t.entryDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Ajouter */}
          {tab === "add" && (
            <div className="ft-journal-form">
              <div className="ft-journal-form-row">
                <div className="ft-journal-form-group">
                  <label>Actif</label>
                  <select value={form.asset} onChange={e => setForm({...form, asset: e.target.value as Asset})}>
                    {ASSETS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="ft-journal-form-group">
                  <label>Timeframe</label>
                  <select value={form.timeframe} onChange={e => setForm({...form, timeframe: e.target.value as Timeframe})}>
                    {TFS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="ft-journal-form-group">
                  <label>Direction</label>
                  <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value as Direction})}>
                    {DIRS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="ft-journal-form-row">
                <div className="ft-journal-form-group">
                  <label>Prix d'entrée *</label>
                  <input type="number" placeholder="ex: 95000" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})} />
                </div>
                <div className="ft-journal-form-group">
                  <label>Objectif</label>
                  <input type="number" placeholder="ex: 105000" value={form.targetPrice} onChange={e => setForm({...form, targetPrice: e.target.value})} />
                </div>
                <div className="ft-journal-form-group">
                  <label>Stop Loss</label>
                  <input type="number" placeholder="ex: 90000" value={form.stopLoss} onChange={e => setForm({...form, stopLoss: e.target.value})} />
                </div>
              </div>
              <div className="ft-journal-form-row">
                <div className="ft-journal-form-group">
                  <label>Prix de sortie</label>
                  <input type="number" placeholder="Si trade clôturé" value={form.exitPrice} onChange={e => setForm({...form, exitPrice: e.target.value})} />
                </div>
                <div className="ft-journal-form-group">
                  <label>Résultat</label>
                  <select value={form.result} onChange={e => setForm({...form, result: e.target.value as any})}>
                    {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="ft-journal-form-group">
                <label>Note / Analyse</label>
                <textarea rows={2} placeholder="Pourquoi ce trade ? Que s'est-il passé ?" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button className="btn-ghost" onClick={() => { setEditId(null); setTab("list"); }}>Annuler</button>
                <button className="btn-primary" onClick={handleAdd} disabled={!form.entryPrice}>{editId ? "Mettre à jour" : "Enregistrer le trade"}</button>
              </div>
            </div>
          )}

          {/* Tab: Stats */}
          {tab === "stats" && stats && (
            <div>
              <div className="ft-journal-stats-grid">
                {statCards.map(({ label, val, color }) => (
                  <div key={label} className="ft-journal-stat-card">
                    <div className="ft-journal-stat-label">{label}</div>
                    <div className="ft-journal-stat-val" style={{ color }}>{val}</div>
                  </div>
                ))}
              </div>
              {stats.bestTrade !== 0 && (
                <div className="ft-journal-pnl-row">
                  <span style={{ color: "var(--bull)" }}>Meilleur trade : +{stats.bestTrade}%</span>
                  <span style={{ color: "var(--bear)" }}>Pire trade : {stats.worstTrade}%</span>
                </div>
              )}
              {/* Courbe PnL cumulé simple */}
              {trades.filter(t => t.pnlPercent !== undefined).length >= 2 && (
                <div className="ft-journal-pnl-chart">
                  <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>PnL cumulé</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "60px" }}>
                    {(() => {
                      let cum = 0;
                      const pts = trades.filter(t => t.pnlPercent !== undefined).reverse().map(t => { cum += t.pnlPercent!; return cum; });
                      const max = Math.max(...pts.map(Math.abs), 0.1);
                      return pts.map((p, i) => (
                        <div key={i} style={{ flex: 1, height: `${Math.max(4, Math.abs(p) / max * 56)}px`, background: p >= 0 ? "var(--bull)" : "var(--bear)", borderRadius: "2px 2px 0 0", opacity: 0.8, minWidth: "4px" }} />
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ft-journal-overlay { position: fixed; inset: 0; background: var(--bg-overlay); z-index: 100; }
        .ft-journal-modal {
          position: fixed; inset: 0; margin: auto;
          width: min(680px, 96vw); max-height: 88vh;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; z-index: 101;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .ft-journal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem 1.1rem 0.6rem; border-bottom: 1px solid var(--border-subtle); }
        .ft-journal-title { font-size: 0.95rem; font-weight: 800; color: var(--text-primary); }
        .ft-journal-sub { font-size: 0.6rem; color: var(--text-muted); margin-top: 1px; }
        .ft-journal-tabs { display: flex; gap: 3px; padding: 0.5rem 0.8rem; background: var(--bg-surface); }
        .ft-journal-tab { padding: 0.3rem 0.75rem; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 0.68rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .ft-journal-tab:hover { color: var(--text-accent); border-color: var(--border-strong); }
        .ft-journal-tab-active { background: var(--accent-subtle) !important; color: var(--text-accent) !important; border-color: var(--border-strong) !important; }
        .ft-journal-body { flex: 1; overflow-y: auto; padding: 0.85rem 1rem; }
        .ft-journal-filter { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-bottom: 0.7rem; }
        .ft-tab-sm { padding: 0.22rem 0.6rem !important; font-size: 0.62rem !important; min-height: unset !important; }
        .ft-journal-empty { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.8rem; }
        .ft-journal-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .ft-journal-item { padding: 0.65rem 0.8rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 9px; }
        .ft-journal-item-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; flex-wrap: wrap; gap: 0.3rem; }
        .ft-journal-item-asset { display: flex; align-items: center; gap: 0.4rem; }
        .ft-journal-item-prices { display: flex; gap: 0.7rem; font-size: 0.58rem; color: var(--text-muted); flex-wrap: wrap; margin-bottom: 0.2rem; }
        .ft-journal-item-prices b { color: var(--text-secondary); }
        .ft-journal-note { font-size: 0.6rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0.4rem; background: var(--bg-card); border-radius: 5px; margin-top: 0.2rem; }
        .ft-journal-date { font-size: 0.55rem; color: var(--text-muted); margin-top: 0.25rem; }
        /* Form */
        .ft-journal-form { display: flex; flex-direction: column; gap: 0.65rem; }
        .ft-journal-form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; }
        .ft-journal-form-group { display: flex; flex-direction: column; gap: 3px; }
        .ft-journal-form-group label { font-size: 0.58rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        .ft-journal-form-group input,
        .ft-journal-form-group select,
        .ft-journal-form-group textarea {
          background: var(--bg-input); border: 1px solid var(--border);
          border-radius: 7px; padding: 0.4rem 0.6rem;
          color: var(--text-primary); font-family: var(--font-syne),sans-serif; font-size: 0.72rem;
          outline: none; transition: border-color 0.15s;
        }
        .ft-journal-form-group input:focus,
        .ft-journal-form-group select:focus,
        .ft-journal-form-group textarea:focus { border-color: var(--border-strong); }
        /* Stats */
        .ft-journal-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 0.75rem; }
        .ft-journal-stat-card { padding: 0.65rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 9px; text-align: center; }
        .ft-journal-stat-label { font-size: 0.55rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; }
        .ft-journal-stat-val { font-family: var(--font-mono),monospace; font-size: 1.1rem; font-weight: 700; }
        .ft-journal-pnl-row { display: flex; justify-content: space-between; font-size: 0.62rem; font-weight: 700; padding: 0.4rem 0; margin-bottom: 0.6rem; }
        .ft-journal-pnl-chart { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem 0.7rem; }
        @media (max-width: 480px) {
          .ft-journal-modal { max-height: 95vh; border-radius: 12px; }
          .ft-journal-stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </>
  );
}
