import React from 'react';

const FundatradeManual: React.FC = () => {
  const css = `
    :root {
      --green: #00cc6a;
      --green-light: #e6fff4;
      --green-mid: #00994d;
      --red: #e63c54;
      --red-light: #fff0f2;
      --orange: #f59e0b;
      --orange-light: #fffbeb;
      --blue: #3b82f6;
      --blue-light: #eff6ff;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --font: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --font-mono: 'Courier New', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font);
      color: var(--gray-800);
      background: white;
      line-height: 1.65;
      font-size: 15px;
    }

    /* ── Navigation latérale ── */
    .sidebar {
      position: fixed;
      left: 0; top: 0;
      width: 260px;
      height: 100vh;
      background: var(--gray-900);
      color: white;
      overflow-y: auto;
      padding: 1.5rem 0;
      z-index: 100;
    }
    .sidebar-logo {
      padding: 0 1.25rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      margin-bottom: 0.75rem;
    }
    .sidebar-logo-title {
      font-size: 1.1rem; font-weight: 800;
      color: var(--green); letter-spacing: -0.02em;
    }
    .sidebar-logo-sub {
      font-size: 0.65rem; color: rgba(255,255,255,0.4);
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-top: 2px;
    }
    .sidebar-section {
      padding: 0.5rem 1.25rem 0.15rem;
      font-size: 0.6rem; font-weight: 700;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: rgba(255,255,255,0.3);
      margin-top: 0.5rem;
    }
    .sidebar a {
      display: block;
      padding: 0.45rem 1.25rem;
      color: rgba(255,255,255,0.65);
      text-decoration: none;
      font-size: 0.82rem;
      border-left: 2px solid transparent;
      transition: all 0.15s;
    }
    .sidebar a:hover {
      color: white;
      background: rgba(255,255,255,0.05);
      border-left-color: var(--green);
    }

    /* ── Contenu principal ── */
    .main {
      margin-left: 260px;
      max-width: 900px;
      padding: 2.5rem 3rem;
    }

    /* ── En-tête du document ── */
    .doc-header {
      border-bottom: 3px solid var(--gray-900);
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
    }
    .doc-badge {
      display: inline-block;
      background: var(--green);
      color: white;
      font-size: 0.65rem; font-weight: 700;
      letter-spacing: 0.15em; text-transform: uppercase;
      padding: 0.25rem 0.75rem; border-radius: 99px;
      margin-bottom: 0.75rem;
    }
    .doc-title {
      font-size: 2.2rem; font-weight: 800;
      color: var(--gray-900); line-height: 1.15;
      letter-spacing: -0.03em;
    }
    .doc-title span { color: var(--green-mid); }
    .doc-subtitle {
      font-size: 1rem; color: var(--gray-600);
      margin-top: 0.5rem;
    }
    .doc-meta {
      display: flex; gap: 1.5rem; margin-top: 1.25rem;
      flex-wrap: wrap;
    }
    .doc-meta-item {
      font-size: 0.75rem; color: var(--gray-600);
      display: flex; align-items: center; gap: 0.35rem;
    }
    .doc-meta-item strong { color: var(--gray-800); }

    /* ── Sections ── */
    .section {
      margin-bottom: 3rem;
      scroll-margin-top: 1.5rem;
    }
    .section-header {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--gray-100);
    }
    .section-number {
      width: 32px; height: 32px; min-width: 32px;
      background: var(--gray-900); color: white;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 800;
      font-family: var(--font-mono);
    }
    .section-title {
      font-size: 1.3rem; font-weight: 800;
      color: var(--gray-900); letter-spacing: -0.02em;
    }

    h3 {
      font-size: 1rem; font-weight: 700;
      color: var(--gray-800); margin: 1.5rem 0 0.6rem;
      display: flex; align-items: center; gap: 0.5rem;
    }
    h3::before {
      content: "";
      display: inline-block;
      width: 3px; height: 14px;
      background: var(--green); border-radius: 99px;
      flex-shrink: 0;
    }

    p { color: var(--gray-700); margin-bottom: 0.75rem; }
    ul, ol { padding-left: 1.25rem; color: var(--gray-700); margin-bottom: 0.75rem; }
    li { margin-bottom: 0.3rem; }

    /* ── Signal badges ── */
    .sig {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.2rem 0.65rem; border-radius: 99px;
      font-size: 0.72rem; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase;
      white-space: nowrap;
    }
    .sig-bull  { background: var(--green-light);  color: #007a38; border: 1px solid #99eec7; }
    .sig-bear  { background: var(--red-light);    color: #c0162d; border: 1px solid #f5b8c0; }
    .sig-neu   { background: var(--orange-light); color: #92620a; border: 1px solid #fcd985; }

    /* ── Cartes d'explication ── */
    .card {
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: 1.1rem 1.25rem;
      margin-bottom: 0.85rem;
      background: white;
      position: relative;
    }
    .card-title {
      font-size: 0.82rem; font-weight: 700;
      color: var(--gray-900); margin-bottom: 0.35rem;
      display: flex; align-items: center; gap: 0.5rem;
      flex-wrap: wrap;
    }
    .card-body { font-size: 0.83rem; color: var(--gray-600); line-height: 1.55; }
    .card-body strong { color: var(--gray-800); }

    .card-bull  { border-left: 4px solid var(--green); background: var(--green-light); }
    .card-bear  { border-left: 4px solid var(--red);   background: var(--red-light);   }
    .card-neu   { border-left: 4px solid var(--orange); background: var(--orange-light); }
    .card-info  { border-left: 4px solid var(--blue);  background: var(--blue-light);  }
    .card-dark  { border-left: 4px solid var(--gray-800); background: var(--gray-50);  }

    /* ── Tableau de lecture rapide ── */
    .reading-table {
      width: 100%; border-collapse: collapse;
      font-size: 0.82rem; margin: 0.75rem 0 1.25rem;
      border-radius: 10px; overflow: hidden;
      border: 1px solid var(--gray-200);
    }
    .reading-table thead tr { background: var(--gray-900); color: white; }
    .reading-table thead th {
      padding: 0.65rem 0.9rem; text-align: left;
      font-size: 0.7rem; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .reading-table tbody tr:nth-child(even) { background: var(--gray-50); }
    .reading-table tbody tr:hover { background: var(--green-light); }
    .reading-table td { padding: 0.6rem 0.9rem; color: var(--gray-700); border-bottom: 1px solid var(--gray-100); }
    .reading-table td:first-child { font-weight: 600; color: var(--gray-900); font-family: var(--font-mono); font-size: 0.78rem; }

    /* ── Boîte d'exemple ── */
    .example-box {
      background: var(--gray-900);
      border-radius: 10px; padding: 1rem 1.25rem;
      margin: 0.85rem 0 1.25rem;
      font-size: 0.8rem; color: rgba(255,255,255,0.85);
      font-family: var(--font-mono); line-height: 1.7;
    }
    .example-box .eg-title {
      font-size: 0.62rem; color: var(--green);
      font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.15em; margin-bottom: 0.5rem;
      font-family: var(--font);
    }
    .eg-green  { color: var(--green); font-weight: 700; }
    .eg-red    { color: #ff6b80; font-weight: 700; }
    .eg-orange { color: #fbbf24; font-weight: 700; }
    .eg-gray   { color: rgba(255,255,255,0.4); }

    /* ── Alerte / conseil ── */
    .alert {
      border-radius: 10px; padding: 0.9rem 1.1rem;
      margin: 0.85rem 0 1.25rem;
      font-size: 0.82rem; line-height: 1.55;
      display: flex; gap: 0.75rem; align-items: flex-start;
    }
    .alert-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }
    .alert-warn { background: var(--orange-light); border: 1px solid #fcd985; color: #78520c; }
    .alert-tip  { background: var(--green-light);  border: 1px solid #99eec7; color: #005c2a; }
    .alert-info { background: var(--blue-light);   border: 1px solid #bfdbfe; color: #1d4ed8; }

    /* ── Score bar visuelle ── */
    .score-demo {
      display: flex; align-items: center; gap: 0.75rem;
      margin: 0.35rem 0;
    }
    .score-bar-wrap {
      flex: 1; height: 6px;
      background: var(--gray-200); border-radius: 99px; overflow: hidden;
    }
    .score-bar-fill { height: 100%; border-radius: 99px; }
    .score-label { font-size: 0.72rem; color: var(--gray-600); min-width: 80px; }
    .score-val { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; min-width: 30px; text-align: right; }

    /* ── Grid de définitions ── */
    .def-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      margin: 0.75rem 0 1.25rem;
    }
    .def-item {
      padding: 0.75rem 0.9rem;
      background: var(--gray-50); border: 1px solid var(--gray-200);
      border-radius: 10px;
    }
    .def-term {
      font-size: 0.72rem; font-weight: 700;
      color: var(--gray-900); font-family: var(--font-mono);
      margin-bottom: 0.25rem;
    }
    .def-desc { font-size: 0.78rem; color: var(--gray-600); line-height: 1.45; }

    /* ── Footer ── */
    .footer {
      margin-top: 3rem; padding-top: 1.5rem;
      border-top: 2px solid var(--gray-100);
      font-size: 0.75rem; color: var(--gray-600);
      display: flex; justify-content: space-between;
      flex-wrap: wrap; gap: 0.5rem;
    }
    .footer strong { color: var(--green-mid); }

    /* ── Print ── */
    @media print {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 1.5rem 2rem; }
      .section { page-break-inside: avoid; }
    }

    /* ── Responsive ── */
    @media (max-width: 900px) {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 1.5rem 1.25rem; }
      .def-grid { grid-template-columns: 1fr; }
    }
  `;

  return (
    <>
      <style>{css}</style>

      {/* ═══════════════════════════ SIDEBAR ═══════════════════════════════════ */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">FUNDATRADE</div>
          <div className="sidebar-logo-sub">Manuel d&apos;utilisation</div>
        </div>

        <div className="sidebar-section">Démarrage</div>
        <a href="#intro">Introduction</a>
        <a href="#interface">Vue d&apos;ensemble</a>
        <a href="#actifs">Choisir un actif</a>
        <a href="#timeframes">Les timeframes</a>

        <div className="sidebar-section">Lecture des données</div>
        <a href="#prix">Prix &amp; variations</a>
        <a href="#graphique">Graphique</a>
        <a href="#fondamentaux">Fondamentaux</a>
        <a href="#macro">Données macro</a>

        <div className="sidebar-section">Prédiction IA</div>
        <a href="#signal">Signaux BULLISH/BEARISH</a>
        <a href="#scores">Les scores (0–100)</a>
        <a href="#objectif">Objectif &amp; Stop Loss</a>
        <a href="#rr">Ratio Risque/Récompense</a>

        <div className="sidebar-section">Stratégies</div>
        <a href="#priceaction">Price Action</a>
        <a href="#smc">SMC</a>
        <a href="#rsi">RSI</a>
        <a href="#macd">MACD</a>
        <a href="#consensus">Consensus des stratégies</a> {/* ← Ajout pour compléter */}

        <div className="sidebar-section">Divers</div>
        <a href="#news">Actualités</a>
        <a href="#live">Indicateur LIVE</a>
        <a href="#exemples">Exemples concrets</a>
        <a href="#disclaimer">Avertissements</a>
      </nav>

      {/* ═══════════════════════════ CONTENU ═══════════════════════════════════ */}
      <div className="main">
        {/* En-tête */}
        <div className="doc-header">
          <div className="doc-badge">Documentation officielle</div>
          <h1 className="doc-title">Manuel d&apos;utilisation<br /><span>Fundatrade</span></h1>
          <p className="doc-subtitle">Guide complet pour interpréter chaque indicateur, signal et score de la plateforme.</p>
          <div className="doc-meta">
            <div className="doc-meta-item">📅 <strong>Version 2.0</strong></div>
            <div className="doc-meta-item">🌐 <strong>Langue :</strong> Français</div>
            <div className="doc-meta-item">⏱ <strong>Lecture :</strong> ~15 minutes</div>
            <div className="doc-meta-item">🎯 <strong>Niveau :</strong> Débutant à intermédiaire</div>
          </div>
        </div>

        {/* 01. INTRODUCTION */}
        <div className="section" id="intro">
          <div className="section-header">
            <div className="section-number">01</div>
            <h2 className="section-title">Introduction</h2>
          </div>
          <p>Fundatrade est une plateforme d&apos;analyse de marché en temps réel qui combine <strong>analyse fondamentale</strong> (données économiques, macro-économie, on-chain) et <strong>analyse technique</strong> (RSI, MACD, Price Action, SMC) pour générer des prédictions directionnelles sur les cryptomonnaies et l&apos;or.</p>

          <div className="alert alert-warn">
            <div className="alert-icon">⚠️</div>
            <div><strong>Important :</strong> Fundatrade est un outil d&apos;aide à la décision. Les signaux affichés ne constituent <strong>pas</strong> des conseils financiers. Les marchés financiers sont imprévisibles et tout investissement comporte un risque de perte en capital.</div>
          </div>

          <h3>Ce que Fundatrade fait pour vous</h3>
          <ul>
            <li>Agrège et calcule automatiquement les indicateurs techniques sur 4H, 1 Jour et 1 Semaine</li>
            <li>Analyse le contexte macro-économique (taux Fed, inflation, DXY, M2)</li>
            <li>Génère un signal directionnel avec un niveau de confiance chiffré</li>
            <li>Propose un objectif de prix et un stop loss basés sur la volatilité réelle (ATR)</li>
            <li>Surveille les actualités financières et détecte leur sentiment</li>
          </ul>
        </div>

        {/* 02. INTERFACE */}
        <div className="section" id="interface">
          <div className="section-header">
            <div className="section-number">02</div>
            <h2 className="section-title">Vue d&apos;ensemble de l&apos;interface</h2>
          </div>
          <p>L&apos;interface est divisée en zones distinctes :</p>

          <div className="card card-dark">
            <div className="card-title">🔝 En-tête (Header)</div>
            <div className="card-body">Logo, indicateur LIVE pulsant, horloge en temps réel (Europe/Paris), heure de dernière mise à jour, bouton de rafraîchissement manuel, bascule thème clair/sombre.</div>
          </div>

          <div className="card card-dark">
            <div className="card-title">🎛️ Barre de sélection</div>
            <div className="card-body">Permet de choisir l&apos;actif analysé (BTC, ETH, SOL, Or) et la timeframe (4H, 1J, 1 Sem). Tout le contenu se recalcule automatiquement à chaque changement.</div>
          </div>

          <div className="card card-dark">
            <div className="card-title">📊 Colonne gauche</div>
            <div className="card-body">Prix en temps réel, graphique historique, données fondamentales (pour crypto), analyses stratégiques (Price Action, SMC, RSI, MACD).</div>
          </div>

          <div className="card card-dark">
            <div className="card-title">🤖 Colonne droite</div>
            <div className="card-body">Carte de prédiction IA (signal, objectif, stop loss, scores), panneau macro-économique, fil d&apos;actualités.</div>
          </div>

          <div className="alert alert-tip">
            <div className="alert-icon">💡</div>
            <div>Sur mobile, les deux colonnes s&apos;empilent verticalement. L&apos;ordre recommandé de lecture reste : Prix → Prédiction → Stratégies → Macro → Actualités.</div>
          </div>
        </div>

        {/* 03. ACTIFS */}
        <div className="section" id="actifs">
          <div className="section-header">
            <div className="section-number">03</div>
            <h2 className="section-title">Choisir un actif</h2>
          </div>
          <p>Cliquez sur l&apos;un des 4 boutons de la barre de sélection :</p>

          <table className="reading-table">
            <thead><tr><th>Actif</th><th>Nom complet</th><th>Type</th><th>Source des données</th></tr></thead>
            <tbody>
              <tr><td>BTC</td><td>Bitcoin</td><td>Cryptomonnaie</td><td>Binance (BTCUSDT)</td></tr>
              <tr><td>ETH</td><td>Ethereum</td><td>Cryptomonnaie</td><td>Binance (ETHUSDT)</td></tr>
              <tr><td>SOL</td><td>Solana</td><td>Cryptomonnaie</td><td>Binance (SOLUSDT)</td></tr>
              <tr><td>XAUUSD</td><td>Or (Gold)</td><td>Matière première</td><td>Yahoo Finance (GC=F)</td></tr>
            </tbody>
          </table>

          <div className="alert alert-info">
            <div className="alert-icon">ℹ️</div>
            <div>Les prix crypto sont en <strong>USD (USDT)</strong>. Le prix de l&apos;or est en <strong>USD par once troy</strong>. 1 once troy = 31,1 grammes.</div>
          </div>
        </div>

        {/* 04. TIMEFRAMES */}
        <div className="section" id="timeframes">
          <div className="section-header">
            <div className="section-number">04</div>
            <h2 className="section-title">Les timeframes (périodes d&apos;analyse)</h2>
          </div>
          <p>La timeframe détermine la <strong>granularité des données</strong> utilisées pour tous les calculs. Choisissez selon votre horizon de trading :</p>

          <div className="card card-info">
            <div className="card-title">4H — Court terme <span className="sig sig-neu">Scalping / Day trading</span></div>
            <div className="card-body">
              Chaque point de données = 1 bougie de 4 heures. L&apos;analyse porte sur les <strong>~10 derniers jours</strong>.<br /><br />
              <strong>Quand l&apos;utiliser :</strong> Vous cherchez des entrées précises sur des mouvements rapides. Vous pouvez surveiller votre position plusieurs fois par jour.<br />
              <strong>Risque :</strong> Plus de bruit de marché, signaux plus volatils, stops plus serrés.
            </div>
          </div>

          <div className="card card-info">
            <div className="card-title">1J — Moyen terme <span className="sig sig-neu">Swing trading</span></div>
            <div className="card-body">
              Chaque point = 1 bougie journalière. Analyse sur les <strong>60 derniers jours</strong>.<br /><br />
              <strong>Quand l&apos;utiliser :</strong> Vous tenez vos positions de quelques jours à quelques semaines. C&apos;est la timeframe la plus équilibrée pour la majorité des traders.<br />
              <strong>Risque :</strong> Volatilité modérée, signaux plus fiables qu&apos;en 4H.
            </div>
          </div>

          <div className="card card-info">
            <div className="card-title">1 Sem — Long terme <span className="sig sig-neu">Position trading</span></div>
            <div className="card-body">
              Chaque point = 1 bougie hebdomadaire. Analyse sur les <strong>52 dernières semaines</strong> (1 an).<br /><br />
              <strong>Quand l&apos;utiliser :</strong> Vous cherchez à identifier la tendance de fond pour des positions de plusieurs semaines à mois.<br />
              <strong>Risque :</strong> Signaux rares mais très significatifs. Stops larges.
            </div>
          </div>

          <div className="alert alert-tip">
            <div className="alert-icon">💡</div>
            <div><strong>Bonne pratique :</strong> Consultez d&apos;abord <strong>1 Sem</strong> pour identifier la tendance principale, puis <strong>1J</strong> pour affiner, et enfin <strong>4H</strong> pour choisir votre point d&apos;entrée.</div>
          </div>
        </div>

        {/* 05. PRIX */}
        <div className="section" id="prix">
          <div className="section-header">
            <div className="section-number">05</div>
            <h2 className="section-title">Lire la carte de prix</h2>
          </div>

          <h3>Prix actuel</h3>
          <p>Le grand nombre affiché en haut est le <strong>prix spot en temps réel</strong>, mis à jour automatiquement toutes les 30 secondes. Il clignote en vert si le prix monte, en rouge s&apos;il baisse.</p>

          <h3>Variation 24h</h3>
          <table className="reading-table">
            <thead><tr><th>Ce que vous voyez</th><th>Ce que ça signifie</th></tr></thead>
            <tbody>
              <tr><td>▲ +5.2%</td><td>Le prix a progressé de 5,2% sur les dernières 24 heures — tendance haussière</td></tr>
              <tr><td>▼ -3.1%</td><td>Le prix a reculé de 3,1% sur les dernières 24 heures — tendance baissière</td></tr>
              <tr><td>0.00%</td><td>Prix stable ou données insuffisantes pour calculer la variation</td></tr>
            </tbody>
          </table>

          <h3>High / Low 24h</h3>
          <p>Ces deux valeurs représentent le <strong>plus haut</strong> et le <strong>plus bas</strong> atteints durant les dernières 24 heures. Elles permettent d&apos;évaluer la volatilité de la journée et de repérer si le prix est proche d&apos;une borne extrême.</p>

          <div className="example-box">
            <div className="eg-title">Exemple de lecture</div>
            Prix actuel : <span className="eg-green">$97,450</span>   ▲ <span className="eg-green">+2.8%</span><br />
            High 24h : <span className="eg-green">$98,200</span>  ·  Low 24h : <span className="eg-red">$94,800</span><br />
            <span className="eg-gray">→ Le prix est proche du haut de la journée (+97.7% du range).<br />Risque de résistance à $98,200.</span>
          </div>
        </div>

        {/* 06. GRAPHIQUE */}
        <div className="section" id="graphique">
          <div className="section-header">
            <div className="section-number">06</div>
            <h2 className="section-title">Lire le graphique historique</h2>
          </div>
          <p>Le graphique en zone (Area Chart) affiche l&apos;<strong>évolution du prix de clôture</strong> sur la période sélectionnée.</p>

          <h3>Couleur du graphique</h3>
          <div className="card card-bull">
            <div className="card-title"><span className="sig sig-bull">Vert</span> — Tendance positive</div>
            <div className="card-body">Le prix actuel est <strong>supérieur</strong> au prix de départ de la période. La zone sous la courbe est remplie en vert.</div>
          </div>
          <div className="card card-bear">
            <div className="card-title"><span className="sig sig-bear">Rouge</span> — Tendance négative</div>
            <div className="card-body">Le prix actuel est <strong>inférieur</strong> au prix de départ de la période. La zone sous la courbe est remplie en rouge.</div>
          </div>

          <h3>Ligne de référence pointillée</h3>
          <p>La ligne horizontale pointillée représente le <strong>prix de départ</strong> de la période. Elle sert de référence visuelle pour évaluer rapidement si la tendance est positive ou négative sur la durée analysée.</p>

          <h3>Axe X (horizontal)</h3>
          <p>Les labels changent selon la timeframe : <strong>heures</strong> (4H), <strong>dates</strong> (1J et 1W). Passez la souris sur le graphique pour voir le prix exact à chaque point.</p>
        </div>

        {/* 07. FONDAMENTAUX */}
        <div className="section" id="fondamentaux">
          <div className="section-header">
            <div className="section-number">07</div>
            <h2 className="section-title">Données fondamentales (crypto uniquement)</h2>
          </div>
          <p>Cette carte n&apos;apparaît que pour BTC, ETH et SOL (pas pour l&apos;or). Elle analyse la <strong>santé financière on-chain</strong> de l&apos;actif.</p>

          <h3>Métriques affichées</h3>
          <table className="reading-table">
            <thead><tr><th>Métrique</th><th>Signification</th><th>Signal haussier</th></tr></thead>
            <tbody>
              <tr><td>Market Cap</td><td>Valeur totale en circulation (prix × offre)</td><td>MCap élevé = actif mature, liquide</td></tr>
              <tr><td>Volume 24h</td><td>Valeur totale échangée en 24h</td><td>Volume élevé = forte participation</td></tr>
              <tr><td>Vol/MCap %</td><td>Ratio volume sur capitalisation</td><td>&gt; 15% = très actif ; &lt; 3% = faible activité</td></tr>
              <tr><td>Offre circulante</td><td>Nombre de tokens actuellement en circulation</td><td>Offre faible relative = plus rare</td></tr>
              <tr><td>FDV</td><td>Fully Diluted Valuation — MCap si tous les tokens étaient émis</td><td>FDV proche du MCap = peu de dilution future</td></tr>
              <tr><td>FDV/MCap</td><td>Ratio de dilution future</td><td>&lt; 1.5x = faible dilution ; &gt; 3x = risque fort</td></tr>
            </tbody>
          </table>

          <h3>Score fondamental (0–100)</h3>
          <div className="score-demo">
            <span className="score-label">Score &gt; 65</span>
            <div className="score-bar-wrap"><div className="score-bar-fill" style={{ width: '75%', background: 'linear-gradient(90deg,#00cc6a,#00ff88)' }} /></div>
            <span className="score-val" style={{ color: '#00994d' }}>75</span>
          </div>
          <div className="score-demo">
            <span className="score-label">Score 40–65</span>
            <div className="score-bar-wrap"><div className="score-bar-fill" style={{ width: '52%', background: 'linear-gradient(90deg,#cc7700,#ffa520)' }} /></div>
            <span className="score-val" style={{ color: '#cc7700' }}>52</span>
          </div>
          <div className="score-demo">
            <span className="score-label">Score &lt; 40</span>
            <div className="score-bar-wrap"><div className="score-bar-fill" style={{ width: '28%', background: 'linear-gradient(90deg,#cc2244,#ff4466)' }} /></div>
            <span className="score-val" style={{ color: '#cc2244' }}>28</span>
          </div>
        </div>

        {/* 08. MACRO */}
        <div className="section" id="macro">
          <div className="section-header">
            <div className="section-number">08</div>
            <h2 className="section-title">Données macro-économiques</h2>
          </div>
          <p>Ces données proviennent de la <strong>Réserve Fédérale américaine (FRED)</strong> et ont un impact direct sur les marchés d&apos;actifs risqués (crypto) et les valeurs refuges (or).</p>

          <table className="reading-table">
            <thead><tr><th>Indicateur</th><th>Source</th><th>Haussier pour crypto/or</th><th>Baissier</th></tr></thead>
            <tbody>
              <tr><td>Taux Fed</td><td>FEDFUNDS</td><td>&lt; 2.5% — politique accommodante</td><td>&gt; 5% — politique restrictive</td></tr>
              <tr><td>Inflation (CPI)</td><td>CPIAUCSL</td><td>&gt; 4% (demande de hedge)</td><td>&lt; 2% (moins de pression)</td></tr>
              <tr><td>DXY</td><td>DTWEXBGS</td><td>&lt; 98 — dollar faible</td><td>&gt; 105 — dollar fort</td></tr>
              <tr><td>M2 (masse monétaire)</td><td>M2SL</td><td>&gt; 21 000 Mds$ — liquidités abondantes</td><td>En contraction</td></tr>
              <tr><td>Courbe des taux</td><td>DGS10 – DGS2</td><td>Positive (normale)</td><td>Négative = courbe inversée = signal de récession</td></tr>
            </tbody>
          </table>

          <h3>Taux réels (spécifique à l&apos;or)</h3>
          <div className="card card-info">
            <div className="card-title">Taux réels = Taux Fed − Inflation</div>
            <div className="card-body">
              C&apos;est l&apos;indicateur le plus important pour l&apos;or. Quand les taux réels sont <strong>négatifs</strong>, l&apos;or surperforme car il n&apos;y a pas de coût d&apos;opportunité à le détenir. Quand les taux réels sont <strong>positifs et élevés</strong>, l&apos;or souffre car les obligations rapportent davantage.<br /><br />
              <strong>Exemple :</strong> Taux Fed = 5%, Inflation = 7% → Taux réels = -2% → <span className="sig sig-bull">HAUSSIER pour l&apos;or</span>
            </div>
          </div>

          <h3>L&apos;impact du DXY</h3>
          <p>Le DXY (Dollar Index) mesure la force du dollar américain par rapport à un panier de devises. Comme les cryptos et l&apos;or sont libellés en dollars, il existe une <strong>corrélation inverse forte</strong> :</p>
          <ul>
            <li><strong>DXY monte</strong> → les étrangers paient plus cher pour acheter BTC/Or → demande réduite → prix baisse</li>
            <li><strong>DXY baisse</strong> → les étrangers paient moins cher → demande accrue → prix monte</li>
          </ul>
        </div>

        {/* 09. SIGNAL */}
        <div className="section" id="signal">
          <div className="section-header">
            <div className="section-number">09</div>
            <h2 className="section-title">Signaux BULLISH / BEARISH / NEUTRAL</h2>
          </div>
          <p>Le signal directionnel est le cœur de la prédiction. Il est affiché en grand dans la carte de prédiction IA.</p>

          <div className="card card-bull">
            <div className="card-title"><span className="sig sig-bull">▲ BULLISH</span></div>
            <div className="card-body">
              <strong>Signification :</strong> L&apos;algorithme anticipe une hausse du prix sur la timeframe sélectionnée.<br />
              <strong>Score global ≥ 62</strong> pour déclencher ce signal.<br />
              <strong>Action possible :</strong> Chercher une opportunité d&apos;achat (long). L&apos;objectif de prix est supérieur au prix actuel.
            </div>
          </div>

          <div className="card card-bear">
            <div className="card-title"><span className="sig sig-bear">▼ BEARISH</span></div>
            <div className="card-body">
              <strong>Signification :</strong> L&apos;algorithme anticipe une baisse du prix sur la timeframe sélectionnée.<br />
              <strong>Score global ≤ 42</strong> pour déclencher ce signal.<br />
              <strong>Action possible :</strong> Chercher une opportunité de vente (short) ou éviter d&apos;acheter. L&apos;objectif de prix est inférieur au prix actuel.
            </div>
          </div>

          <div className="card card-neu">
            <div className="card-title"><span className="sig sig-neu">◆ NEUTRAL</span></div>
            <div className="card-body">
              <strong>Signification :</strong> Pas de signal clair. Le marché est en consolidation, les indicateurs sont contradictoires ou trop proches de leurs zones neutres.<br />
              <strong>Score global entre 43 et 61.</strong><br />
              <strong>Action possible :</strong> Attendre un signal plus clair. Ne pas entrer en position.
            </div>
          </div>

          <div className="alert alert-warn">
            <div className="alert-icon">⚠️</div>
            <div>Un signal BULLISH ne garantit pas une hausse. Il signifie simplement que <strong>la probabilité d&apos;une hausse est statistiquement plus élevée</strong> selon les données disponibles au moment du calcul.</div>
          </div>
        </div>

        {/* 10. SCORES */}
        <div className="section" id="scores">
          <div className="section-header">
            <div className="section-number">10</div>
            <h2 className="section-title">Les scores de 0 à 100</h2>
          </div>
          <p>Trois barres de progression mesurent la force du signal sur une échelle normalisée :</p>

          <table className="reading-table">
            <thead><tr><th>Score</th><th>Couleur</th><th>Interprétation</th></tr></thead>
            <tbody>
              <tr><td>65 – 100</td><td style={{ color: '#00994d', fontWeight: 700 }}>Vert</td><td>Signal fort dans le sens haussier</td></tr>
              <tr><td>41 – 64</td><td style={{ color: '#cc7700', fontWeight: 700 }}>Orange</td><td>Signal modéré ou neutre</td></tr>
              <tr><td>0 – 40</td><td style={{ color: '#cc2244', fontWeight: 700 }}>Rouge</td><td>Signal fort dans le sens baissier</td></tr>
            </tbody>
          </table>

          <h3>Score Fondamental</h3>
          <p>Mesure la santé macro et on-chain. Intègre : taux Fed, inflation, DXY, M2, volume, variation 24h, tendance 7j. <strong>Pondération : 40%</strong> du score global pour les cryptos, <strong>55%</strong> pour l&apos;or.</p>

          <h3>Score Technique</h3>
          <p>Mesure le momentum des indicateurs techniques : RSI, MACD, EMA20/200, Bollinger Bands, volume. <strong>Pondération : 60%</strong> du score global pour les cryptos, <strong>45%</strong> pour l&apos;or.</p>

          <h3>Score Global</h3>
          <p>Combinaison pondérée des deux scores précédents. C&apos;est lui qui détermine le signal BULLISH/BEARISH/NEUTRAL.</p>

          <div className="card card-info">
            <div className="card-title">Formule de calcul</div>
            <div className="card-body">
              <strong>Crypto :</strong> Score Global = (Fondamental × 40%) + (Technique × 60%)<br />
              <strong>Or :</strong> Score Global = (Fondamental × 55%) + (Technique × 45%)
            </div>
          </div>

          <h3>Confiance</h3>
          <p>La barre de confiance (0–100%) mesure à quel point le score global s&apos;éloigne du centre (50). Plus le score est extrême (proche de 0 ou 100), plus la confiance est élevée. Une confiance {'>'} 70% indique un signal solide.</p>
        </div>

        {/* 11. OBJECTIF & STOP LOSS */}
        <div className="section" id="objectif">
          <div className="section-header">
            <div className="section-number">11</div>
            <h2 className="section-title">Objectif de prix et Stop Loss</h2>
          </div>
          <p>Ces deux valeurs sont calculées à partir de l&apos;<strong>ATR (Average True Range)</strong>, qui mesure la volatilité réelle de l&apos;actif sur la période.</p>

          <h3>Objectif de prix (Target Price)</h3>
          <div className="card card-bull">
            <div className="card-title">Prix cible si BULLISH</div>
            <div className="card-body">
              L&apos;objectif représente le <strong>niveau de prix à atteindre</strong> si le scénario haussier se réalise. Il est calculé par : <strong>Prix actuel + (ATR × multiplicateur)</strong>.<br /><br />
              Le multiplicateur dépend de la timeframe : 3× en 4H, 6× en 1J, 12× en 1W.<br />
              Le pourcentage affiché (+X%) indique l&apos;écart entre l&apos;objectif et le prix actuel.
            </div>
          </div>

          <h3>Stop Loss</h3>
          <div className="card card-bear">
            <div className="card-title">Niveau de protection</div>
            <div className="card-body">
              Le stop loss est le <strong>niveau auquel sortir de position pour limiter les pertes</strong> si le scénario ne se réalise pas. Il est calculé par : <strong>Prix actuel − (ATR × multiplicateur)</strong>.<br /><br />
              Le multiplicateur stop : 1.5× en 4H, 3× en 1J, 5× en 1W.
            </div>
          </div>

          <div className="alert alert-warn">
            <div className="alert-icon">⚠️</div>
            <div>Ces niveaux sont des <strong>suggestions basées sur la volatilité statistique</strong>, pas des garanties. Adaptez-les toujours à votre gestion du risque personnelle et au contexte du marché.</div>
          </div>
        </div>

        {/* 12. RATIO R/R */}
        <div className="section" id="rr">
          <div className="section-header">
            <div className="section-number">12</div>
            <h2 className="section-title">Ratio Risque / Récompense</h2>
          </div>
          <p>Affiché sous la forme <strong>1 : X</strong>, ce ratio compare le gain potentiel au risque pris.</p>

          <table className="reading-table">
            <thead><tr><th>Ratio affiché</th><th>Interprétation</th><th>Signal</th></tr></thead>
            <tbody>
              <tr><td>1 : 3 ou plus</td><td>Pour 1$ risqué, vous pouvez gagner 3$. Excellent setup.</td><td style={{ color: '#00994d', fontWeight: 700 }}>Vert ✓</td></tr>
              <tr><td>1 : 2</td><td>Pour 1$ risqué, vous pouvez gagner 2$. Setup correct.</td><td style={{ color: '#00994d', fontWeight: 700 }}>Vert ✓</td></tr>
              <tr><td>1 : 1 à 2</td><td>Ratio acceptable mais peu favorable.</td><td style={{ color: '#cc7700', fontWeight: 700 }}>Orange ~</td></tr>
              <tr><td>1 : moins de 1</td><td>Vous risquez plus que ce que vous pouvez gagner. À éviter.</td><td style={{ color: '#cc2244', fontWeight: 700 }}>Rouge ✗</td></tr>
            </tbody>
          </table>

          <div className="alert alert-tip">
            <div className="alert-icon">💡</div>
            <div>La règle d&apos;or du trading : ne prenez jamais une position avec un R/R inférieur à <strong>1:2</strong>. Même en ayant raison seulement 50% du temps, vous êtes rentable avec un R/R de 1:2.</div>
          </div>
        </div>

        {/* 13. PRICE ACTION */}
        <div className="section" id="priceaction">
          <div className="section-header">
            <div className="section-number">13</div>
            <h2 className="section-title">Stratégie Price Action</h2>
          </div>
          <p>L&apos;analyse Price Action étudie la <strong>structure du marché</strong> sans indicateurs mathématiques, en se basant uniquement sur les mouvements de prix.</p>

          <h3>Ce que l&apos;algorithme détecte</h3>
          <div className="def-grid">
            <div className="def-item">
              <div className="def-term">Higher Highs (HH)</div>
              <div className="def-desc">Chaque sommet est plus haut que le précédent. Structure haussière.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Lower Highs (LH)</div>
              <div className="def-desc">Chaque sommet est plus bas que le précédent. Structure baissière.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Support</div>
              <div className="def-desc">Niveau de prix plancher où les acheteurs ont historiquement réagi.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Résistance</div>
              <div className="def-desc">Niveau de prix plafond où les vendeurs ont historiquement réagi.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Double Top</div>
              <div className="def-desc">Deux sommets au même niveau. Pattern de retournement baissier.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Double Bottom</div>
              <div className="def-desc">Deux creux au même niveau. Pattern de retournement haussier.</div>
            </div>
          </div>

          <div className="example-box">
            <div className="eg-title">Exemple de signal Price Action</div>
            Signal : <span className="eg-green">&quot;Structure haussière confirmée : sommets successifs croissants&quot;</span><br />
            Détails :<br />
            <span className="eg-gray">›</span> Prix proche du support ($42,300) — potentiel rebond<br />
            <span className="eg-gray">›</span> Tendance haussière récente : +4.2% sur les 7 dernières périodes<br />
            Confiance : <span className="eg-green">72%</span>
          </div>
        </div>

        {/* 14. SMC */}
        <div className="section" id="smc">
          <div className="section-header">
            <div className="section-number">14</div>
            <h2 className="section-title">Stratégie SMC (Smart Money Concepts)</h2>
          </div>
          <p>Le SMC analyse le comportement des <strong>grands acteurs institutionnels</strong> (banques, fonds, whales) en détectant leurs traces dans les données de prix.</p>

          <h3>Concepts clés</h3>

          <div className="card card-bull">
            <div className="card-title">BOS — Break of Structure <span className="sig sig-bull">Haussier</span> ou <span className="sig sig-bear">Baissier</span></div>
            <div className="card-body">
              <strong>BOS haussier :</strong> Le prix casse un précédent plafond → les institutionnels ont accumulé et poussent les prix plus haut. Signal d&apos;achat fort.<br />
              <strong>BOS baissier :</strong> Le prix casse un précédent plancher → les institutionnels distribuent. Signal de vente fort.
            </div>
          </div>

          <div className="card card-dark">
            <div className="card-title">Order Block (OB) — Zone institutionnelle</div>
            <div className="card-body">
              Zone de prix où les institutionnels ont passé de grosses commandes. Quand le prix revient sur cette zone, il y a souvent une forte réaction (rebond ou rejet).<br />
              <strong>OB haussier :</strong> Zone de support institutionnel — rebond probable.<br />
              <strong>OB baissier :</strong> Zone de résistance institutionnelle — rejet probable.
            </div>
          </div>

          <div className="card card-dark">
            <div className="card-title">Fair Value Gap (FVG) — Déséquilibre</div>
            <div className="card-body">
              Quand le prix a bougé trop vite dans une direction, il laisse un &quot;vide&quot; dans les données de prix. Le marché a tendance à revenir combler ce vide.<br />
              <strong>FVG haussier :</strong> Vide laissé lors d&apos;une montée rapide — le prix pourrait remonter pour combler.<br />
              <strong>FVG baissier :</strong> Vide laissé lors d&apos;une chute rapide — le prix pourrait redescendre.
            </div>
          </div>

          <div className="card card-dark">
            <div className="card-title">Liquidité — Chasse aux stops</div>
            <div className="card-body">
              Les institutionnels savent où les traders particuliers placent leurs stops. Ils font souvent monter ou descendre le prix pour &quot;chasser&quot; ces stops et récupérer la liquidité, avant de repartir dans la vraie direction.
            </div>
          </div>
        </div>

        {/* 15. RSI */}
        <div className="section" id="rsi">
          <div className="section-header">
            <div className="section-number">15</div>
            <h2 className="section-title">Stratégie RSI (Relative Strength Index)</h2>
          </div>
          <p>Le RSI est un oscillateur de momentum qui mesure la <strong>vitesse et l&apos;amplitude des mouvements de prix</strong> sur une échelle de 0 à 100. Calculé sur 14 périodes.</p>

          <table className="reading-table">
            <thead><tr><th>Valeur RSI</th><th>Zone</th><th>Signification</th><th>Signal</th></tr></thead>
            <tbody>
              <tr><td>&gt; 70</td><td style={{ color: '#cc2244', fontWeight: 700 }}>Surachat</td><td>L&apos;actif a trop monté trop vite — risque de correction</td><td><span className="sig sig-bear">BEARISH</span></td></tr>
              <tr><td>60 – 70</td><td style={{ color: '#00994d', fontWeight: 700 }}>Haussier</td><td>Momentum positif fort mais surveiller la résistance à 70</td><td><span className="sig sig-bull">BULLISH</span></td></tr>
              <tr><td>50 – 60</td><td style={{ color: '#cc7700', fontWeight: 700 }}>Neutre+</td><td>Les acheteurs dominent légèrement</td><td><span className="sig sig-neu">NEUTRE</span></td></tr>
              <tr><td>40 – 50</td><td style={{ color: '#cc7700', fontWeight: 700 }}>Neutre-</td><td>Les vendeurs dominent légèrement</td><td><span className="sig sig-neu">NEUTRE</span></td></tr>
              <tr><td>30 – 40</td><td style={{ color: '#cc2244', fontWeight: 700 }}>Baissier</td><td>Momentum négatif modéré</td><td><span className="sig sig-bear">BEARISH</span></td></tr>
              <tr><td>&lt; 30</td><td style={{ color: '#00994d', fontWeight: 700 }}>Survendu</td><td>L&apos;actif a trop chuté — rebond probable</td><td><span className="sig sig-bull">BULLISH</span></td></tr>
            </tbody>
          </table>

          <h3>Divergences RSI</h3>
          <div className="card card-bull">
            <div className="card-title">Divergence haussière</div>
            <div className="card-body">Le prix fait un nouveau plus bas, mais le RSI fait un plus bas moins bas. Indique que la pression vendeuse s&apos;épuise — retournement haussier probable.</div>
          </div>
          <div className="card card-bear">
            <div className="card-title">Divergence baissière</div>
            <div className="card-body">Le prix fait un nouveau plus haut, mais le RSI fait un plus haut moins haut. Indique que la pression acheteuse s&apos;épuise — retournement baissier probable.</div>
          </div>

          <div className="alert alert-tip">
            <div className="alert-icon">💡</div>
            <div>Un RSI survendu (&lt;30) ne signifie pas &quot;achetez immédiatement&quot;. Dans une tendance baissière forte, le RSI peut rester survendu longtemps. Attendez une confirmation (ex : croisement MACD, BOS haussier).</div>
          </div>
        </div>

        {/* 16. MACD */}
        <div className="section" id="macd">
          <div className="section-header">
            <div className="section-number">16</div>
            <h2 className="section-title">Stratégie MACD</h2>
          </div>
          <p>Le MACD (Moving Average Convergence Divergence) mesure la <strong>convergence et divergence entre deux moyennes mobiles exponentielles</strong> (EMA12 et EMA26) pour identifier les changements de tendance.</p>

          <h3>Composants du MACD</h3>
          <div className="def-grid">
            <div className="def-item">
              <div className="def-term">Ligne MACD</div>
              <div className="def-desc">Différence entre EMA12 et EMA26. Mesure le momentum de la tendance.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Ligne Signal</div>
              <div className="def-desc">EMA9 de la ligne MACD. Sert de déclencheur pour les croisements.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Histogramme</div>
              <div className="def-desc">Différence entre la ligne MACD et la ligne Signal. Visualise l&apos;accélération.</div>
            </div>
            <div className="def-item">
              <div className="def-term">Niveau zéro</div>
              <div className="def-desc">MACD au-dessus de 0 = momentum haussier. En dessous = momentum baissier.</div>
            </div>
          </div>

          <h3>Signaux MACD</h3>
          <table className="reading-table">
            <thead><tr><th>Événement</th><th>Signification</th><th>Signal</th></tr></thead>
            <tbody>
              <tr><td>Croisement haussier</td><td>MACD passe au-dessus de la ligne Signal — <strong>signal d&apos;achat fort</strong></td><td><span className="sig sig-bull">BULLISH fort</span></td></tr>
              <tr><td>Croisement baissier</td><td>MACD passe en dessous du Signal — <strong>signal de vente fort</strong></td><td><span className="sig sig-bear">BEARISH fort</span></td></tr>
              <tr><td>MACD &gt; Signal (sans croisement)</td><td>Tendance haussière en cours</td><td><span className="sig sig-bull">BULLISH</span></td></tr>
              <tr><td>MACD &lt; Signal (sans croisement)</td><td>Tendance baissière en cours</td><td><span className="sig sig-bear">BEARISH</span></td></tr>
              <tr><td>Histogramme positif croissant</td><td>Momentum haussier qui s&apos;accélère</td><td><span className="sig sig-bull">BULLISH</span></td></tr>
              <tr><td>Histogramme négatif décroissant</td><td>Momentum baissier qui s&apos;accélère</td><td><span className="sig sig-bear">BEARISH</span></td></tr>
            </tbody>
          </table>

          <div className="example-box">
            <div className="eg-title">Exemple de lecture MACD</div>
            MACD : <span className="eg-green">0.0024</span>  Signal : <span className="eg-orange">0.0018</span>  Histogramme : <span className="eg-green">+0.0006</span><br />
            Croisement : <span className="eg-green">HAUSSIER</span><br />
            <span className="eg-gray">→ La ligne MACD vient de croiser la ligne Signal vers le haut.<br />Signal d&apos;achat fort confirmé. Confiance : 85%</span>
          </div>
        </div>

        {/* 17. CONSENSUS (ajouté pour compléter le manuel) */}
        <div className="section" id="consensus">
          <div className="section-header">
            <div className="section-number">17</div>
            <h2 className="section-title">Panneau consensus des stratégies</h2>
          </div>
          <p>Ce panneau synthétise les 4 stratégies (Price Action, SMC, RSI, MACD) en un vote global affiché sous forme de barre colorée.</p>

          <table className="reading-table">
            <thead><tr><th>Consensus</th><th>Condition</th><th>Interprétation</th></tr></thead>
            <tbody>
              <tr><td><span className="sig sig-bull">BULLISH</span></td><td>3 ou 4 stratégies sur 4 haussières</td><td>Alignement fort — signal très fiable</td></tr>
              <tr><td><span className="sig sig-bear">BEARISH</span></td><td>3 ou 4 stratégies sur 4 baissières</td><td>Alignement fort — signal très fiable</td></tr>
              <tr><td><span className="sig sig-neu">BULLISH MODÉRÉ</span></td><td>Plus de haussiers que baissiers</td><td>Signal positif mais pas unanime — prudence</td></tr>
              <tr><td><span className="sig sig-neu">BEARISH MODÉRÉ</span></td><td>Plus de baissiers que haussiers</td><td>Signal négatif mais pas unanime — prudence</td></tr>
              <tr><td><span className="sig sig-neu">DIVERGENCE</span></td><td>Égalité entre les signaux</td><td>Marché indécis — attendre un catalyst</td></tr>
            </tbody>
          </table>

          <div className="alert alert-tip">
            <div className="alert-icon">💡</div>
            <div><strong>Règle des confluences :</strong> Plus les stratégies sont alignées, plus le signal est fiable. Un consensus de 4/4 BULLISH avec une confiance &gt; 75% est un setup particulièrement intéressant.</div>
          </div>
        </div>

        {/* 18. NEWS */}
        <div className="section" id="news">
          <div className="section-header">
            <div className="section-number">18</div>
            <h2 className="section-title">Fil d&apos;actualités</h2>
          </div>
          <p>Les actualités sont récupérées depuis <strong>NewsAPI</strong> (priorité aux sources francophones, complété par l&apos;anglais) et rafraîchies toutes les 5 minutes.</p>

          <h3>Badges de sentiment</h3>
          <div className="card card-bull">
            <div className="card-title"><span className="sig sig-bull">Positif</span></div>
            <div className="card-body">L&apos;article contient des mots-clés haussiers : hausse, rebond, record, adoption, approbation, croissance, ETF, rally, surge...</div>
          </div>
          <div className="card card-bear">
            <div className="card-title"><span className="sig sig-bear">Négatif</span></div>
            <div className="card-body">L&apos;article contient des mots-clés baissiers : chute, crash, baisse, interdiction, sanction, perte, hack, réglementation, liquidation...</div>
          </div>
          <div className="card card-neu">
            <div className="card-title"><span className="sig sig-neu">Neutre</span></div>
            <div className="card-body">Article informatif sans connotation directionnelle forte.</div>
          </div>

          <div className="alert alert-info">
            <div className="alert-icon">ℹ️</div>
            <div>La détection de sentiment est automatique basée sur des mots-clés. Elle n&apos;est pas infaillible et ne remplace pas la lecture réelle de l&apos;article. Cliquez sur le titre pour accéder à la source originale.</div>
          </div>
        </div>

        {/* 19. LIVE */}
        <div className="section" id="live">
          <div className="section-header">
            <div className="section-number">19</div>
            <h2 className="section-title">Indicateur LIVE et rafraîchissement</h2>
          </div>

          <h3>Point vert pulsant — LIVE</h3>
          <p>Le point vert qui pulse dans l&apos;en-tête indique que les données sont fraîches et que les connexions aux APIs fonctionnent. Les données sont mises à jour selon ce calendrier :</p>

          <table className="reading-table">
            <thead><tr><th>Données</th><th>Fréquence</th></tr></thead>
            <tbody>
              <tr><td>Prix (crypto &amp; or)</td><td>Toutes les <strong>30 secondes</strong></td></tr>
              <tr><td>Prédiction IA</td><td>Recalculée à chaque nouveau prix</td></tr>
              <tr><td>Données macro (Fed, CPI, DXY...)</td><td>Toutes les <strong>5 minutes</strong></td></tr>
              <tr><td>Actualités</td><td>Toutes les <strong>5 minutes</strong></td></tr>
            </tbody>
          </table>

          <h3>Point gris — HORS LIGNE</h3>
          <p>Si le point devient gris et affiche &quot;HORS LIGNE&quot;, cela signifie qu&apos;une ou plusieurs APIs ne répondent pas. Causes possibles : rate limit atteint, panne du service externe, problème réseau. Utilisez le bouton de rafraîchissement manuel (↻) pour réessayer.</p>

          <h3>Bouton rafraîchissement (↻)</h3>
          <p>Déclenche un rechargement complet de toutes les données (prix, macro, news, prédiction). Utilisez-le si vous suspectez des données périmées ou après un retour de connexion.</p>
        </div>

        {/* 20. EXEMPLES */}
        <div className="section" id="exemples">
          <div className="section-header">
            <div className="section-number">20</div>
            <h2 className="section-title">Exemples de lecture complète</h2>
          </div>

          <h3>Scénario 1 — Setup haussier fort</h3>
          <div className="example-box">
            <div className="eg-title">Bitcoin — Timeframe 1J</div>
            Prix : <span className="eg-green">$97,200</span>  ▲ <span className="eg-green">+3.8% (24h)</span><br />
            Signal : <span className="eg-green">▲ BULLISH</span>  Confiance : <span className="eg-green">78%</span><br />
            Objectif : <span className="eg-green">$103,500</span> (+6.5%)  Stop Loss : <span className="eg-red">$93,800</span> (-3.5%)<br />
            R/R : <span className="eg-green">1 : 1.86</span><br />
            Score Fondamental : <span className="eg-green">71</span>  Technique : <span className="eg-green">75</span>  Global : <span className="eg-green">73</span><br />
            Consensus : <span className="eg-green">BULLISH (3/4 stratégies)</span><br /><br />
            <span className="eg-gray">Interprétation : Tous les signaux s&apos;alignent. Taux Fed bas, DXY faible,<br />
            RSI à 62 (haussier), MACD au-dessus du signal, structure de marché HH.<br />
            Setup intéressant, R/R acceptable. Attendre confirmation sur 4H.</span>
          </div>

          <h3>Scénario 2 — Signal baissier avec divergence</h3>
          <div className="example-box">
            <div className="eg-title">Ethereum — Timeframe 4H</div>
            Prix : <span className="eg-orange">$3,450</span>  ▼ <span className="eg-red">-1.2% (24h)</span><br />
            Signal : <span className="eg-orange">◆ NEUTRAL</span>  Confiance : <span className="eg-orange">52%</span><br />
            Score Global : <span className="eg-orange">48</span><br />
            Consensus : <span className="eg-orange">DIVERGENCE (2 BULL / 2 BEAR)</span><br />
            RSI : <span className="eg-orange">51</span>  MACD : <span className="eg-orange">Croisement baissier récent</span><br /><br />
            <span className="eg-gray">Interprétation : Les signaux se contredisent. Price Action et RSI neutres,<br />
            mais MACD vient de croiser baissièrement. Pas de position recommandée.<br />
            Attendre sur 1J pour confirmation de la direction.</span>
          </div>

          <h3>Scénario 3 — Or en configuration refuge</h3>
          <div className="example-box">
            <div className="eg-title">XAUUSD — Timeframe 1W</div>
            Prix : <span className="eg-green">$2,650</span>  ▲ <span className="eg-green">+1.1% (24h)</span><br />
            Signal : <span className="eg-green">▲ BULLISH</span>  Confiance : <span className="eg-green">72%</span><br />
            Taux Fed : 5.25%  Inflation : 7.1%  → Taux réels : <span className="eg-green">-1.85%</span><br />
            DXY : <span className="eg-green">97.4</span> (dollar faible)  Courbe des taux : <span className="eg-green">-0.8%</span> (inversée)<br /><br />
            <span className="eg-gray">Interprétation : Le contexte macro est idéal pour l&apos;or. Taux réels négatifs,<br />
            dollar faible, courbe inversée (signal de récession). L&apos;or bénéficie<br />
            de la demande de valeur refuge. Signal fondamental dominant (55%).</span>
          </div>
        </div>

        {/* 21. DISCLAIMER */}
        <div className="section" id="disclaimer">
          <div className="section-header">
            <div className="section-number">21</div>
            <h2 className="section-title">Avertissements importants</h2>
          </div>

          <div className="alert alert-warn">
            <div className="alert-icon">⚠️</div>
            <div>
              <strong>Pas de conseil financier :</strong> Fundatrade est un outil d&apos;analyse algorithmique. Les signaux générés sont basés sur des modèles mathématiques et ne constituent en aucun cas des recommandations d&apos;investissement personnalisées.
            </div>
          </div>
        </div>

        <div className="footer">
          <div>© Fundatrade — Tous droits réservés</div>
          <div><strong>Version 2.0</strong> — Mars 2026</div>
        </div>
      </div>
    </>
  );
};

export default FundatradeManual;   