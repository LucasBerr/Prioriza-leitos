const P = window.Prioriza;

const COMPONENTS = [
  {
    label: "Demanda residente", field: "demanda_residente_normalizado_0_100", weight: "30%",
    raw: (row) => `${P.formatNumber(row.demanda_residente_taxa_por_1000_pop_alvo, 2)} por mil · ${P.formatNumber(row.internacoes_residentes)} internações`,
    source: "SIH/SUS, 12 competências de 2025; população-alvo do Ministério da Saúde / DATASUS.",
    calculation: "Internações de residentes ÷ população-alvo × 1.000.",
    normalization: "Min–máx dentro do tipo de leito em 2025: menor taxa = 0 e maior taxa = 100.",
  },
  {
    label: "Déficit de oferta regional", field: "deficit_oferta_regional_normalizado_0_100", weight: "30%",
    raw: (row) => `${P.formatNumber(row.pressao_regional_por_leito, 1)} pessoas por leito · rota ${P.formatHours(row.duracao_rota_horas)}`,
    source: "CNES, população-alvo e rotas para estabelecimento de referência.",
    calculation: "70% pressão regional por leito + 30% penalidade de deslocamento. Acesso é verificado até 24h e a penalidade chega ao teto em 6h.",
    normalization: "Pressão regional normalizada dentro do tipo; deslocamento convertido em 0–100 com teto de 6h.",
  },
  {
    label: "Evasão intermunicipal", field: "evasao_hospitalar_normalizada_0_100", weight: "15%",
    raw: (row) => `${P.formatPercent(row.evasao_hospitalar_percentual, 1)} · ${P.formatNumber(row.internacoes_fora_municipio)} internações fora`,
    source: "SIH/SUS, estabelecimentos localizados no Rio Grande do Sul, 2025.",
    calculation: "Internações de residentes realizadas fora do município ÷ internações de residentes.",
    normalization: "O percentual observado já varia de 0 a 100. Sem internações residentes, o componente recebe 0.",
  },
  {
    label: "Tendência de crescimento", field: "pontuacao_normalizada_tendencia", weight: "15%",
    raw: (row) => `CAGR ${P.formatPercent(row.taxa_anual_composta_percentual, 2)} · ${P.formatNumber(row.variacao_absoluta_2021_2025)} pessoas em 2021–2025`,
    source: "Populações anuais do Ministério da Saúde / DATASUS, 2021–2025.",
    calculation: "Taxa anual composta de crescimento da população-alvo no período de cinco anos.",
    normalization: "Faixas congeladas por tipo: sem crescimento = 0; crescimento positivo = 50; crescimento alto a partir do P80 positivo = 100.",
  },
  {
    label: "Risco populacional", field: "risco_populacional_normalizado_0_100", weight: "10%",
    raw: (row) => `${P.formatPercent(row.valor_bruto_percentual, 1)} · ${P.formatNumber(row.populacao_alvo_proxy)} pessoas no grupo-alvo`,
    source: "População 2025 do Ministério da Saúde / DATASUS.",
    calculation: "Proporção do público-alvo sobre a população total, com proxy específico para cada tipo de leito.",
    normalization: "Faixas congeladas de 2025 por tipo: até a mediana = 0; entre mediana e P80 = 50; P80 ou acima = 100.",
  },
];

function scoreColor(score) {
  if (score >= 75) return "#0b5631";
  if (score >= 60) return "#23874e";
  if (score >= 40) return "#62bb77";
  if (score >= 20) return "#a7ddb0";
  return "#d7f0d5";
}

function icon(name) {
  const paths = {
    rank: "M12 3v12m0-12 4 4m-4-4-4 4M5 21h14M7 17h10",
    people: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m17-7a4 4 0 0 0-4-4m0-6a4 4 0 1 1-8 0 4 4 0 0 1 8 0m5 6a4 4 0 0 1 0 8",
    bed: "M3 19V8m0 7h18v4m0-8a3 3 0 0 0-3-3H7v7m0-3h.01",
    hospital: "M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01",
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.people}"></path></svg>`;
}

function componentHTML(record, component) {
  const normalized = Number(record[component.field] || 0);
  return `
    <article class="popup-component">
      <div class="popup-component-head"><strong>${component.label}</strong><span class="component-weight">${component.weight}</span>
        <div class="metric-help"><button class="metric-help-button" type="button" aria-expanded="false" aria-controls="help-${component.field}" aria-label="Explicar ${component.label}">?</button>
          <div class="metric-help-content" id="help-${component.field}"><p><b>Origem:</b> ${component.source}</p><p><b>Cálculo:</b> ${component.calculation}</p><p><b>Normalização:</b> ${component.normalization}</p></div>
        </div>
      </div>
      <div class="popup-component-values"><div><span>Valor observado</span><b>${component.raw(record)}</b></div><div><span>Score</span><b>${P.normalizedText(normalized)}</b></div></div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="--bar-width:${normalized}%"></div></div>
    </article>`;
}

function coverageHTML(record, records) {
  if (!record.oferta_acessivel_24h) return `<section class="coverage-card coverage-alert"><p class="section-title">Cobertura regional estimada</p><strong>Sem oferta acessível no limite de 24 horas</strong><p>O componente de déficit recebeu o valor máximo de alerta.</p></section>`;
  const pole = records.find((item) => item.municipio_id === record.polo_municipio_id && item.tipo_leito === record.tipo_leito);
  const poleName = pole?.municipio_nome || "Município de referência não identificado";
  const status = record.polo_e_municipio_origem ? "Este município é a oferta regional de referência" : `Oferta regional de referência: ${poleName}`;
  return `<section class="coverage-card"><div class="coverage-title"><span class="popup-icon">${icon("hospital")}</span><div><p class="section-title">Cobertura regional estimada</p><strong>${status}</strong></div></div>
    <div class="coverage-grid"><div><span>Municípios associados</span><b>${P.formatNumber(record.municipios_associados_polo)}</b></div><div><span>População-alvo regional</span><b>${P.formatNumber(record.populacao_alvo_regional)}</b></div><div><span>Leitos SUS no polo</span><b>${P.formatNumber(record.leitos_sus_polo_acessiveis, 1)}</b></div><div><span>Tempo até a oferta</span><b>${P.formatHours(record.duracao_rota_horas)}</b></div></div>
    <p class="coverage-note">Pressão regional: <b>${P.formatNumber(record.pressao_regional_por_leito, 1)} pessoas por leito</b>.</p></section>`;
}

function detailHTML(record, rank, total, weights, custom, records) {
  const score = P.weightedScore(record, weights);
  const label = custom ? "Score com pesos salvos" : "Score padrão";
  return `<div class="map-popup-card"><div class="detail-head"><div><p class="section-title">Município selecionado</p><h2>${record.municipio_nome}</h2><p>${record.regiao_saude} · ${record.macroregiao_saude}</p><span class="priority-badge">Prioridade ${P.priorityLabel(record.faixa_prioridade)}</span></div><div class="score-ring" style="--score-angle:${score * 3.6}deg" aria-label="${label} ${P.formatNumber(score, 1)} de 100"><strong>${P.formatNumber(score, 1)}</strong></div></div>
    <section class="popup-info"><p class="section-title">Informações gerais</p><div class="popup-info-list"><div><span class="popup-icon">${icon("rank")}</span><p><b>Posição relativa</b>${rank}º de ${total}</p></div><div><span class="popup-icon">${icon("people")}</span><p><b>População-alvo</b>${P.formatNumber(record.populacao_alvo)} pessoas</p></div><div><span class="popup-icon">${icon("bed")}</span><p><b>Leitos SUS de ${P.typeLabel(record.tipo_leito)}</b>${P.formatNumber(record.leitos_sus_locais_registrados, 1)}</p></div><div><span class="popup-icon">${icon("hospital")}</span><p><b>Internações residentes</b>${P.formatNumber(record.internacoes_residentes)} · evasão ${P.formatPercent(record.evasao_hospitalar_percentual, 1)}</p></div></div></section>
    ${coverageHTML(record, records)}
    <p class="section-title popup-components-title">Componentes do score</p><div class="popup-components">${COMPONENTS.map((component) => componentHTML(record, component)).join("")}</div>
    <a class="button primary popup-score-link" href="entenda-o-score.html?${P.scoreQuery(record)}">Entenda este score</a>${custom ? '<p class="popup-note"><strong>Pesos personalizados:</strong> este score usa os pesos salvos no simulador.</p>' : ""}<p class="popup-note">Referência: 2025. Prioridade relativa orienta investigação; não é recomendação automática de novos leitos.</p></div>`;
}

function buildMap(container) {
  const map = L.map(container, { center: [-30.1, -53.2], zoom: 6, minZoom: 6, scrollWheelZoom: false, zoomControl: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap", maxZoom: 18 }).addTo(map);
  return map;
}

async function initMap() {
  const container = document.querySelector("#priority-map");
  if (!container || !window.L) return;
  try {
    const payload = await P.loadRankings(); const records = payload.records; const typeSelect = document.querySelector("#bed-type"); const search = document.querySelector("#municipality-search"); const regionSelect = document.querySelector("#region-filter"); const yearSelect = document.querySelector("#year-filter"); const compactList = document.querySelector("#compact-list"); const typeChip = document.querySelector("#selected-type-chip");
    container.classList.remove("loading-state"); container.textContent = "";
    const map = buildMap(container); const markerLayer = L.layerGroup().addTo(map); const panel = document.createElement("aside"); panel.className = "map-selection-popup"; panel.setAttribute("aria-label", "Município selecionado"); container.append(panel); L.DomEvent.disableClickPropagation(panel); L.DomEvent.disableScrollPropagation(panel);
    const params = new URLSearchParams(window.location.search); const savedWeights = P.loadScoreWeights(); const custom = P.hasCustomScoreWeights(savedWeights); let visible = []; let selected = null; let markers = new Map(); let initial = false;
    Object.entries(P.BED_TYPES).forEach(([value, label]) => typeSelect.add(new Option(label, value))); typeSelect.value = P.BED_TYPES[params.get("tipo")] ? params.get("tipo") : "uti_adulto"; yearSelect.add(new Option(String(payload.metadata.ano), String(payload.metadata.ano))); document.querySelector("[data-update-year]").textContent = `ano ${payload.metadata.ano}`;
    [...new Set(records.map((row) => row.macroregiao_saude).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach((region) => regionSelect.add(new Option(region, region)));
    const typeRecords = () => records.filter((row) => row.tipo_leito === typeSelect.value).sort((a, b) => P.weightedScore(b, savedWeights) - P.weightedScore(a, savedWeights) || a.municipio_nome.localeCompare(b.municipio_nome, "pt-BR"));
    const clear = () => { selected = null; panel.classList.remove("is-open"); panel.replaceChildren(); updateStyles(); };
    const updateStyles = () => { compactList.querySelectorAll(".compact-item").forEach((item) => item.classList.toggle("active", item.dataset.id === selected?.municipio_id)); markers.forEach((marker, id) => marker.setStyle({ weight: id === selected?.municipio_id ? 3 : 1.5, color: id === selected?.municipio_id ? "#183126" : "#fff" })); };
    const select = (record) => { if (!record) return; selected = record; const listed = typeRecords(); const rank = listed.findIndex((row) => row.municipio_id === record.municipio_id) + 1; panel.innerHTML = `<button class="map-popup-close" type="button" aria-label="Fechar município selecionado">×</button>${detailHTML(record, rank, listed.length, savedWeights, custom, records)}`; panel.classList.add("is-open"); updateStyles(); };
    panel.addEventListener("click", (event) => { event.stopPropagation(); if (event.target.closest(".map-popup-close")) return clear(); const button = event.target.closest(".metric-help-button"); if (!button) return; button.setAttribute("aria-expanded", String(button.getAttribute("aria-expanded") !== "true")); });
    const compact = () => { compactList.innerHTML = visible.slice(0, 5).map((row) => `<button class="compact-item${row.municipio_id === selected?.municipio_id ? " active" : ""}" type="button" data-id="${row.municipio_id}"><span>${row.municipio_nome}</span><b>${P.formatNumber(P.weightedScore(row, savedWeights), 1)}</b></button>`).join("") || '<div class="empty-state">Nenhum município encontrado.</div>'; compactList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { const record = visible.find((row) => row.municipio_id === button.dataset.id); const marker = markers.get(button.dataset.id); if (record && marker) map.setView(marker.getLatLng(), 9, { animate: false }); select(record); })); };
    const render = () => { clear(); const query = search.value.trim().toLocaleLowerCase("pt-BR"); visible = typeRecords().filter((row) => (!query || row.municipio_nome.toLocaleLowerCase("pt-BR").includes(query)) && (!regionSelect.value || row.macroregiao_saude === regionSelect.value)); typeChip.textContent = P.typeLabel(typeSelect.value); markerLayer.clearLayers(); markers = new Map(); visible.forEach((row) => { const score = P.weightedScore(row, savedWeights); const marker = L.circleMarker([row.latitude, row.longitude], { radius: 4 + score / 100 * 7, color: "#fff", fillColor: scoreColor(score), fillOpacity: .88, weight: 1.5, bubblingMouseEvents: false }); marker.bindTooltip(`<strong>${row.municipio_nome}</strong><br>Score: ${P.formatNumber(score, 1)}`, { direction: "top" }); marker.on("click", () => select(row)); marker.addTo(markerLayer); markers.set(row.municipio_id, marker); }); compact(); if (!initial) { initial = true; const record = visible.find((row) => row.municipio_id === params.get("municipio")); if (record) select(record); } };
    map.on("click", clear); document.addEventListener("keydown", (event) => { if (event.key === "Escape" && selected) clear(); }); typeSelect.addEventListener("change", () => { search.value = ""; render(); }); regionSelect.addEventListener("change", render); search.addEventListener("input", render); render();
  } catch (error) { console.error(error); container.textContent = "Não foi possível carregar os dados do mapa."; }
}

initMap();
