const DATA_BASE = "./data";

const botsConfig = {
  marketPulse: {
    file: "market-pulse-latest.json",
    containerId: "market-pulse-content",
  },
  alphaRadar: {
    file: "alpha-radar-latest.json",
    containerId: "alpha-radar-content",
  },
  defiYield: {
    file: "defi-yield-latest.json",
    containerId: "defi-yield-content",
  },
  newTokenExplorer: {
    file: "new-token-explorer-latest.json",
    containerId: "nte-content",
  },
  whaleWatcher: {
    file: "whale-watcher-latest.json",
    containerId: "whale-watcher-content",
  },
  narratives: {
    file: "narratives-ai-detector.json",
    containerId: "narratives-content",
  },
};

function setLastUpdated(ts) {
  const el = document.getElementById("last-updated");
  if (!el || !ts) return;

  const d = new Date(ts);
  if (isNaN(d.getTime())) return;

  el.textContent = `Última actualización general: ${d.toLocaleString("es-MX", {
    timeZone: "UTC",
  })} UTC`;
}

// Helper genérico
async function loadJson(relativePath) {
  const url = `${DATA_BASE}/${relativePath}`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} al leer ${url}`);
  }
  return resp.json();
}

/* ---------- Renderers ---------- */

// 1) Market Pulse
function renderMarketPulse(payload) {
  const el = document.getElementById(botsConfig.marketPulse.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const byType = Object.fromEntries(
      items.map((it) => [it.type, it])
    );

    const global = byType.global || {};
    const btc = byType.btc || {};
    const eth = byType.eth || {};
    const fear = byType.fear_greed || {};
    const chains = (byType.chains && byType.chains.chains) || [];
    const gainers = (byType.gainers && byType.gainers.coins) || [];
    const losers = (byType.losers && byType.losers.coins) || [];

    const fmtUsdShort = (v) => {
      const n = Number(v || 0);
      if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
      if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
      if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
      return n.toFixed(0);
    };

    const fearText =
      fear.value != null
        ? `${fear.value} – ${fear.classification || "N/A"}`
        : "N/A";

    el.classList.remove("db-loading");
    el.innerHTML = `
      <div class="db-section">
        <div class="db-badge">🌐 Mercado global</div>
        <div>Market Cap: <strong>$${fmtUsdShort(global.total_market_cap)}</strong></div>
        <div>Volumen 24h: <strong>$${fmtUsdShort(global.total_volume_24h)}</strong></div>
        <div>Dominancia BTC: <strong>${(global.btc_dominance || 0).toFixed(2)}%</strong></div>
      </div>
      <br />
      <div class="db-section">
        <div class="db-badge">🪙 BTC / ETH</div>
        <div>BTC: <strong>$${fmtUsdShort(btc.price || btc.price_usd || 0)}</strong></div>
        <div>ETH: <strong>$${fmtUsdShort(eth.price || eth.price_usd || 0)}</strong></div>
      </div>
      <br />
      <div class="db-section">
        <div class="db-badge">📉 Sentimiento</div>
        <div>Fear & Greed Index: <strong>${fearText}</strong></div>
      </div>
      <br />
      <div class="db-section">
        <div class="db-badge">⛓ Top cadenas por TVL</div>
        <ul class="db-list">
          ${chains
            .slice(0, 5)
            .map(
              (c) =>
                `<li>${c.name} – TVL: <strong>$${fmtUsdShort(c.tvl)}</strong></li>`
            )
            .join("") || "<li>Sin datos</li>"}
        </ul>
      </div>
      <br />
      <div class="db-section">
        <div class="db-badge">📈 Gainers / 📉 Losers (24h)</div>
        <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
          <div style="flex:1;">
            <strong>Gainers</strong>
            <ul class="db-list">
              ${gainers
                .slice(0, 3)
                .map(
                  (g) =>
                    `<li>${g.symbol} – ${Number(
                      g.percent_change_24h || 0
                    ).toFixed(2)}%</li>`
                )
                .join("") || "<li>Sin datos</li>"}
            </ul>
          </div>
          <div style="flex:1;">
            <strong>Losers</strong>
            <ul class="db-list">
              ${losers
                .slice(0, 3)
                .map(
                  (l) =>
                    `<li>${l.symbol} – ${Number(
                      l.percent_change_24h || 0
                    ).toFixed(2)}%</li>`
                )
                .join("") || "<li>Sin datos</li>"}
            </ul>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar Market Pulse.";
  }
}

// 2) Alpha Radar
function renderAlphaRadar(payload) {
  const el = document.getElementById(botsConfig.alphaRadar.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const top5 = items.slice(0, 5);

    el.classList.remove("db-loading");
    el.innerHTML =
      top5.length === 0
        ? "No hay tokens con score suficiente en este último escaneo."
        : `
      <ul class="db-list">
        ${top5
          .map((t, idx) => {
            const score = Number(t.score || t.alpha_score || 0).toFixed(2);
            return `
              <li>
                <strong>#${idx + 1} ${t.token_symbol || t.symbol}</strong>
                <br/>
                Chain: <code>${t.chain_id || t.chain}</code> · Score: <strong>${score}</strong>
                <br/>
                MC: $${Number(t.fdv_usd || 0).toLocaleString("en-US")} · 
                Liq: $${Number(t.liquidity_usd || 0).toLocaleString("en-US")} · 
                Vol 24h: $${Number(t.volume_24h || 0).toLocaleString("en-US")}
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar Alpha Radar.";
  }
}

// 3) DeFi Yield
function renderDefiYield(payload) {
  const el = document.getElementById(botsConfig.defiYield.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const top = items.slice(0, 5);

    el.classList.remove("db-loading");
    el.innerHTML =
      top.length === 0
        ? "No hay pools que cumplan los filtros de riesgo."
        : `
      <ul class="db-list">
        ${top
          .map((p) => {
            const apy = Number(p.apy || 0).toFixed(2);
            const score = Number(p.score || p.defiYieldScore || 0).toFixed(1);
            return `
              <li>
                <strong>${p.symbol}</strong> en <strong>${p.project}</strong> (${p.chain})
                <br/>
                TVL: $${Number(p.tvlUsd || 0).toLocaleString("en-US")} · 
                APY: <strong>${apy}%</strong> · Score: <code>${score}</code>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar DeFi Yield Scanner.";
  }
}

// 4) New Token Explorer
function renderNewTokenExplorer(payload) {
  const el = document.getElementById(botsConfig.newTokenExplorer.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const top = items.slice(0, 5);

    el.classList.remove("db-loading");
    el.innerHTML =
      top.length === 0
        ? "No hay nuevos tokens que pasen rug checks + score mínimo."
        : `
      <ul class="db-list">
        ${top
          .map((t) => `
            <li>
              <strong>${t.symbol}</strong> (${t.chain}) · Score: <code>${Number(
            t.alpha_score || 0
          ).toFixed(1)}</code>
              <br/>
              Liq: $${Number(t.liquidity_usd || 0).toLocaleString("en-US")} · 
              Vol 24h: $${Number(t.volume_24h_usd || 0).toLocaleString("en-US")}
            </li>
          `)
          .join("")}
      </ul>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar New Token Explorer.";
  }
}

// 5) Whale Watcher
function renderWhaleWatcher(payload) {
  const el = document.getElementById(botsConfig.whaleWatcher.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const top = items.slice(0, 5);

    el.classList.remove("db-loading");
    el.innerHTML =
      top.length === 0
        ? "No se detectaron movimientos relevantes de ballenas."
        : `
      <ul class="db-list">
        ${top
          .map((e) => `
            <li>
              <strong>${(e.direction || "").toUpperCase()}</strong> · 
              ${e.token_symbol} en ${e.chain}
              <br/>
              Size: $${Number(e.usd_value || 0).toLocaleString("en-US")} · 
              Wallet: ${e.wallet_label || e.wallet?.slice(0, 6) + "..."}
            </li>
          `)
          .join("")}
      </ul>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar Whale Watcher.";
  }
}

// 6) Narratives
function renderNarratives(payload) {
  const el = document.getElementById(botsConfig.narratives.containerId);
  if (!el) return;

  try {
    const items = payload.items || [];
    const top = items.slice(0, 4);

    el.classList.remove("db-loading");
    el.innerHTML =
      top.length === 0
        ? "No hay narrativas detectadas en el último run."
        : `
      <ul class="db-list">
        ${top
          .map((n) => `
            <li>
              <strong>${n.title || n.narrative}</strong>
              <br/>
              Score: <code>${Number(n.total_score || n.score || 0).toFixed(
                1
              )}</code> · 
              Frecuencia: ${n.frequency || n.count || "N/A"}
            </li>
          `)
          .join("")}
      </ul>
    `;
  } catch (err) {
    el.classList.remove("db-loading");
    el.classList.add("db-error");
    el.textContent = "Error al renderizar narrativas.";
  }
}

/* ---------- Boot ---------- */

async function bootstrapDashboard() {
  // Market Pulse
  loadJson(botsConfig.marketPulse.file)
    .then((data) => {
      setLastUpdated(data.generated_at || data.last_updated);
      renderMarketPulse(data);
    })
    .catch((err) => {
      const el = document.getElementById(
        botsConfig.marketPulse.containerId
      );
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar market-pulse-latest.json";
    });

  // Alpha Radar
  loadJson(botsConfig.alphaRadar.file)
    .then(renderAlphaRadar)
    .catch(() => {
      const el = document.getElementById(
        botsConfig.alphaRadar.containerId
      );
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar alpha-radar-latest.json";
    });

  // DeFi Yield
  loadJson(botsConfig.defiYield.file)
    .then(renderDefiYield)
    .catch(() => {
      const el = document.getElementById(
        botsConfig.defiYield.containerId
      );
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar defi-yield-latest.json";
    });

  // New Token Explorer
  loadJson(botsConfig.newTokenExplorer.file)
    .then(renderNewTokenExplorer)
    .catch(() => {
      const el = document.getElementById(botsConfig.newTokenExplorer.containerId);
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar new-token-explorer-latest.json";
    });

  // Whale Watcher
  loadJson(botsConfig.whaleWatcher.file)
    .then(renderWhaleWatcher)
    .catch(() => {
      const el = document.getElementById(botsConfig.whaleWatcher.containerId);
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar whale-watcher-latest.json";
    });

  // Narratives
  loadJson(botsConfig.narratives.file)
    .then(renderNarratives)
    .catch(() => {
      const el = document.getElementById(botsConfig.narratives.containerId);
      if (!el) return;
      el.classList.remove("db-loading");
      el.classList.add("db-error");
      el.textContent = "No se pudo cargar narratives-ai-detector.json";
    });
}

document.addEventListener("DOMContentLoaded", bootstrapDashboard);

