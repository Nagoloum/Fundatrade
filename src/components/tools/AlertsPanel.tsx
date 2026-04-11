"use client";

import { useState, useEffect, useRef } from "react";
import type { PriceAlert, Asset } from "@/types";

const STORAGE_KEY = "fundatrade-alerts-v1";

function loadAlerts(): PriceAlert[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveAlerts(a: PriceAlert[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); } catch {}
}
async function requestNotifPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  return (await Notification.requestPermission()) === "granted";
}
function fireNotif(title: string, body: string) {
  if (Notification.permission === "granted") new Notification(title, { body });
}

const ASSETS: Asset[] = ["BTC", "XAUUSD"];
const ASSET_ICONS: Record<string, string>  = { BTC: "₿", XAUUSD: "Au" };
const ASSET_COLORS: Record<string, string> = { BTC: "#f7931a", XAUUSD: "#e5c84a" };

interface AlertsPanelProps {
  currentPrices: Partial<Record<Asset, number>>;
  onClose: () => void;
}

export default function AlertsPanel({ currentPrices, onClose }: AlertsPanelProps) {
  const [alerts,  setAlerts]  = useState<PriceAlert[]>([]);
  const [notifOk, setNotifOk] = useState(false);
  const [asset,   setAsset]   = useState<Asset>("BTC");
  const [cond,    setCond]    = useState<"above" | "below">("above");
  const [price,   setPrice]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const alertsRef = useRef<PriceAlert[]>([]);
  alertsRef.current = alerts;

  useEffect(() => {
    setAlerts(loadAlerts());
    if ("Notification" in window) setNotifOk(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    const hits = alertsRef.current.filter(a => {
      if (a.triggered) return false;
      const p = currentPrices[a.asset];
      if (!p) return false;
      return a.condition === "above" ? p >= a.targetPrice : p <= a.targetPrice;
    });
    if (!hits.length) return;
    const updated = alertsRef.current.map(a => {
      if (!hits.find(h => h.id === a.id)) return a;
      fireNotif("🔔 Fundatrade", `${a.asset} ${a.condition === "above" ? "≥" : "≤"} $${a.targetPrice.toLocaleString()}`);
      return { ...a, triggered: true, triggeredAt: new Date().toISOString() };
    });
    saveAlerts(updated); setAlerts(updated);
  }, [currentPrices]);

  const handleAdd = async () => {
    if (!price) return;
    setAdding(true);
    const ok = await requestNotifPermission();
    setNotifOk(ok);
    const a: PriceAlert = {
      id: Date.now().toString(), asset, condition: cond,
      targetPrice: parseFloat(price), message: "",
      createdAt: new Date().toISOString(), triggered: false,
    };
    const u = [a, ...alerts]; saveAlerts(u); setAlerts(u);
    setPrice(""); setAdding(false);
  };

  const del   = (id: string) => { const u = alerts.filter(a => a.id !== id); saveAlerts(u); setAlerts(u); };
  const reset = (id: string) => {
    const u = alerts.map(a => a.id === id ? { ...a, triggered: false, triggeredAt: undefined } : a);
    saveAlerts(u); setAlerts(u);
  };

  const currentP = currentPrices[asset];
  const diff     = currentP && price ? ((parseFloat(price) - currentP) / currentP * 100) : null;
  const activeCount = alerts.filter(a => !a.triggered).length;

  return (
    <>
      {/* ── Overlay ──────────────────────────────────────────────────────── */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(5,10,14,0.75)",
        backdropFilter: "blur(8px)",
      }} />

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", inset: 0, margin: "auto",
        width: "min(480px, 95vw)", maxHeight: "88vh",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        zIndex: 101,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
      }}>

        {/* ── En-tête ─────────────────────────────────────────────────── */}
        <div style={{
          padding: "1.2rem 1.4rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Icône */}
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(0,255,136,0.12), rgba(0,255,136,0.04))",
              border: "1px solid rgba(0,255,136,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.15rem",
            }}>🔔</div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.1 }}>
                Alertes de prix
              </div>
              <div style={{ fontSize: "0.6rem", marginTop: 3, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {notifOk
                  ? <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--bull)", display: "inline-block" }} /><span style={{ color: "var(--bull)" }}>Notifications actives</span></>
                  : <span style={{ color: "var(--text-muted)" }}>Activées à la première alerte</span>
                }
                {activeCount > 0 && (
                  <span style={{
                    marginLeft: 4, padding: "1px 7px", borderRadius: 99,
                    background: "var(--accent-subtle)", border: "1px solid var(--border)",
                    color: "var(--text-accent)", fontSize: "0.58rem", fontWeight: 700,
                  }}>{activeCount} actives</span>
                )}
              </div>
            </div>
          </div>
          {/* Bouton fermer */}
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 9,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--bg-surface)"; el.style.color = "var(--text-primary)"; el.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = "var(--text-muted)"; el.style.borderColor = "var(--border)"; }}
          >✕</button>
        </div>

        {/* ── Corps scrollable ─────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.1rem 1.4rem" }}>

          {/* ─ Formulaire nouvelle alerte ──────────────────────────── */}
          <section style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 14, padding: "1rem 1.1rem",
            marginBottom: "1.2rem",
          }}>
            <div style={{
              fontSize: "0.58rem", fontWeight: 800, color: "var(--text-muted)",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.85rem",
            }}>
              Nouvelle alerte
            </div>

            {/* Sélecteur d'actif */}
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
              {ASSETS.map(a => {
                const selected = asset === a;
                const col = ASSET_COLORS[a];
                return (
                  <button key={a} onClick={() => setAsset(a as Asset)} style={{
                    display: "flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.38rem 0.8rem", borderRadius: 9, cursor: "pointer",
                    border: `1px solid ${selected ? col + "99" : "var(--border)"}`,
                    background: selected ? col + "1a" : "transparent",
                    color: selected ? col : "var(--text-muted)",
                    fontSize: "0.7rem", fontWeight: 700,
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{ASSET_ICONS[a]}</span>
                    {a}
                  </button>
                );
              })}
            </div>

            {/* Condition + prix sur la même ligne */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.7rem" }}>

              {/* Toggle condition */}
              <div>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Condition</div>
                <div style={{ display: "flex", borderRadius: 9, border: "1px solid var(--border)", overflow: "hidden", height: 36 }}>
                  {(["above", "below"] as const).map((c, i) => (
                    <button key={c} onClick={() => setCond(c)} style={{
                      flex: 1, border: "none", cursor: "pointer",
                      borderRight: i === 0 ? "1px solid var(--border)" : "none",
                      background: cond === c ? "rgba(0,255,136,0.08)" : "transparent",
                      color: cond === c ? "var(--bull)" : "var(--text-muted)",
                      fontSize: "0.65rem", fontWeight: 700,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}>
                      {c === "above" ? "▲ Dessus" : "▼ Dessous"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input prix */}
              <div>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Prix cible ($)</div>
                <div style={{ position: "relative", height: 36 }}>
                  <span style={{
                    position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                    color: "var(--text-muted)", fontSize: "0.72rem", pointerEvents: "none",
                  }}>$</span>
                  <input
                    type="number" placeholder="ex : 105 000"
                    value={price} onChange={e => setPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    style={{
                      width: "100%", height: "100%",
                      paddingLeft: 24, paddingRight: 10,
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                      borderRadius: 9,
                      color: "var(--text-primary)",
                      fontFamily: "monospace", fontSize: "0.72rem",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={e => (e.target.style.borderColor = "rgba(0,255,136,0.4)")}
                    onBlur={e  => (e.target.style.borderColor = "var(--border)")}
                  />
                </div>
              </div>
            </div>

            {/* Ligne d'info prix actuel */}
            {currentP && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.4rem 0.6rem", borderRadius: 7,
                background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
                marginBottom: "0.75rem", fontSize: "0.6rem",
              }}>
                <span style={{ color: "var(--text-muted)" }}>
                  Prix actuel · <span style={{ color: "var(--text-accent)", fontFamily: "monospace", fontWeight: 700 }}>${currentP.toLocaleString("fr-FR")}</span>
                </span>
                {diff !== null && (
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: diff >= 0 ? "var(--bull)" : "var(--bear)" }}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(2)}%
                  </span>
                )}
              </div>
            )}

            {/* Bouton créer */}
            <button onClick={handleAdd} disabled={!price || adding} style={{
              width: "100%", height: 40, borderRadius: 10, border: "none",
              background: price && !adding
                ? "linear-gradient(135deg, rgba(0,255,136,0.9), rgba(0,204,106,0.9))"
                : "var(--bg-card)",
              color: price && !adding ? "#050a0e" : "var(--text-muted)",
              fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 800,
              cursor: price && !adding ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
            }}>
              {adding ? "⏳ Création…" : "＋ Créer l'alerte"}
            </button>
          </section>

          {/* ─ Liste des alertes ────────────────────────────────────── */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "0.6rem",
          }}>
            <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Mes alertes
            </div>
            {alerts.length > 0 && (
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)" }}>
                {alerts.length} total · <span style={{ color: "var(--bull)" }}>{activeCount} en attente</span>
              </div>
            )}
          </div>

          {alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.6rem", opacity: 0.4 }}>🔕</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Aucune alerte configurée</div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "0.3rem", opacity: 0.7 }}>
                Créez une alerte ci-dessus pour être notifié
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {alerts.map(a => {
                const col = ASSET_COLORS[a.asset];
                const isTriggered = a.triggered;
                return (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.7rem 0.85rem",
                    borderRadius: 12,
                    border: `1px solid ${isTriggered ? "var(--border-subtle)" : col + "2a"}`,
                    background: isTriggered ? "transparent" : col + "08",
                    opacity: isTriggered ? 0.6 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    {/* Icône actif */}
                    <div style={{
                      width: 34, height: 34, minWidth: 34, borderRadius: 9,
                      background: col + "18", border: `1px solid ${col}33`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 800, color: col,
                    }}>{ASSET_ICONS[a.asset]}</div>

                    {/* Contenu */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>{a.asset}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          {a.condition === "above" ? "≥" : "≤"}
                        </span>
                        <span style={{
                          fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700,
                          color: a.condition === "above" ? "var(--bull)" : "var(--bear)",
                        }}>${a.targetPrice.toLocaleString("fr-FR")}</span>
                        {isTriggered && (
                          <span style={{
                            fontSize: "0.58rem", fontWeight: 700, color: "var(--bull)",
                            padding: "1px 6px", borderRadius: 5,
                            background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)",
                          }}>✓ Déclenchée</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginTop: 2 }}>
                        Créée le {new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        {isTriggered && a.triggeredAt && ` · Déclenchée le ${new Date(a.triggeredAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                      {isTriggered && (
                        <button onClick={() => reset(a.id)} title="Réactiver" style={{
                          width: 28, height: 28, borderRadius: 7, cursor: "pointer",
                          border: "1px solid var(--border)", background: "transparent",
                          color: "var(--text-secondary)", fontSize: "0.75rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s", fontFamily: "inherit",
                        }}
                          onMouseEnter={e => { const el = e.currentTarget; el.style.background = "var(--bg-surface)"; el.style.color = "var(--text-primary)"; }}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = "var(--text-secondary)"; }}
                        >↺</button>
                      )}
                      <button onClick={() => del(a.id)} title="Supprimer" style={{
                        width: 28, height: 28, borderRadius: 7, cursor: "pointer",
                        border: "1px solid rgba(255,68,102,0.2)",
                        background: "rgba(255,68,102,0.06)",
                        color: "var(--bear)", fontSize: "0.72rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s", fontFamily: "inherit",
                      }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,68,102,0.14)"; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(255,68,102,0.06)"; }}
                      >✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Note de bas de page */}
          <div style={{
            marginTop: "1rem", padding: "0.6rem 0.8rem",
            borderRadius: 9, background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            fontSize: "0.56rem", color: "var(--text-muted)", lineHeight: 1.55,
          }}>
            🔒 Notifications via l'API native du navigateur · Aucune donnée envoyée à un serveur · Alertes sauvegardées localement
          </div>
        </div>
      </div>
    </>
  );
}
