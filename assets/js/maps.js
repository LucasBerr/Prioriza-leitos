const P = window.Prioriza;

const NORMALIZATION_TEXT = "Normalização min-max entre os municípios do mesmo ano e tipo de leito: o menor valor vira 0, o maior vira 100 e os demais são posicionados proporcionalmente entre eles.";

const COMPONENTS = [
  {
    label: "Demanda residente",
    field: "demanda_residente_normalizada",
    rawValue: (row) => `${P.formatNumber(row.demanda_residente_taxa_por_1000_pop_alvo, 2)} por mil · ${P.formatNumber(row.internacoes_residentes)} internações`,
    source: "SIH/SUS e IBGE.",
    calculation: "Internações de residentes divididas pela população-alvo do tipo de leito, multiplicadas por 1.000.",
    normalization: NORMALIZATION_TEXT,
  },
  {
    label: "Déficit de oferta",
    field: "deficit_oferta_sus_normalizado",
    rawValue: (row) => `${P.formatNumber(row.leitos_sus_media, 1)} leitos SUS · ${P.formatNumber(row.oferta_sus_por_1000_pop_alvo, 2)} por mil`,
    source: "CNES, SIH/SUS e IBGE.",
    calculation: "Compara a oferta SUS por mil habitantes com a referência estadual e pondera a diferença pela demanda residente. O JSON publica os insumos reais acima, não o déficit bruto intermediário.",
    normalization: NORMALIZATION_TEXT,
  },
  {
    label: "Evasão hospitalar",
    field: "evasao_hospitalar_normalizada",
    rawValue: (row) => `${P.formatPercent(row.evasao_hospitalar_raw, 1)} · ${P.formatNumber(row.internacoes_residentes_fora)} internações fora`,
    source: "SIH/SUS.",
    calculation: "Internações de residentes realizadas fora do município divididas pelo total de internações de residentes.",
    normalization: NORMALIZATION_TEXT,
  },
  {
    label: "Risco populacional",
    field: "risco_populacional_normalizado",
    rawValue: (row) => `${P.formatNumber(row.populacao_alvo)} pessoas na população-alvo`,
    source: "IBGE.",
    calculation: "Usa o subgrupo populacional pertinente ao tipo de leito. O JSON publica a população-alvo acima, mas não a proporção bruta intermediária do componente de risco.",
    normalization: NORMALIZATION_TEXT,
  },
  {
    label: "Crescimento",
    field: "crescimento_demanda_normalizado",
    rawValue: () => "Valor bruto não publicado no JSON",
    source: "SIH/SUS.",
    calculation: "Variação das internações de residentes em relação ao ano anterior. Sem histórico anterior válido, a metodologia usa o valor normalizado neutro de 50/100.",
    normalization: `${NORMALIZATION_TEXT} O arquivo público expõe somente o resultado normalizado, por isso o valor bruto não é reconstruído no navegador.`,
  },
];

function scoreColor(score) {
  if (score >= 0.75) return "#0b5631";
  if (score >= 0.6) return "#23874e";
  if (score >= 0.4) return "#62bb77";
  if (score >= 0.2) return "#a7ddb0";
  return "#d7f0d5";
}

function scoreValue(record, weights) {
  return P.weightedScore(record, weights);
}

function componentHTML(record, component) {
  const normalized = Number(record[component.field] || 0);
  return `
    <article class="popup-component">
      <div class="popup-component-head">
        <strong>${component.label}</strong>
        <div class="metric-help">
          <button class="metric-help-button" type="button" aria-expanded="false" aria-controls="help-${component.field}" aria-label="Explicar ${component.label}" title="Explicar esta métrica">?</button>
          <div class="metric-help-content" id="help-${component.field}">
            <p><b>Origem:</b> ${component.source}</p>
            <p><b>Cálculo:</b> ${component.calculation}</p>
            <p><b>Normalização:</b> ${component.normalization}</p>
          </div>
        </div>
      </div>
      <div class="popup-component-values">
        <div><span>Real / bruto</span><b>${component.rawValue(record)}</b></div>
        <div><span>Normalizado</span><b>${P.normalizedText(normalized)}</b></div>
      </div>
      <div class="bar-track" aria-hidden="true"><div class="bar-fill" style="--bar-width:${normalized * 100}%"></div></div>
    </article>
  `;
}

function detailHTML(record, rank, total, weights, usingCustomWeights) {
  const currentScore = scoreValue(record, weights);
  const score = P.formatNumber(currentScore * 100, 1);
  const scoreLabel = usingCustomWeights ? "Score com pesos salvos" : "Score oficial";
  return `
    <div class="map-popup-card">
      <div class="detail-head">
        <div>
          <p class="section-title">Município selecionado</p>
          <h2>${record.municipio_nome}</h2>
          <p>${record.regiao_saude} · ${record.macroregiao_saude}</p>
          <span class="priority-badge">Prioridade ${P.priorityLabel(record.faixa_prioridade)}</span>
        </div>
        <div class="score-ring" style="--score-angle:${currentScore * 360}deg" aria-label="${scoreLabel} ${score} de 100"><strong>${score}</strong></div>
      </div>
      <div class="popup-summary-grid">
        <div class="metric-box"><span>Posição relativa</span><strong>${rank}º <small>de ${total}</small></strong></div>
        <div class="metric-box"><span>Leitos SUS médios</span><strong>${P.formatNumber(record.leitos_sus_media, 1)}</strong></div>
        <div class="metric-box"><span>Internações residentes</span><strong>${P.formatNumber(record.internacoes_residentes)}</strong></div>
        <div class="metric-box"><span>Evasão hospitalar</span><strong>${P.formatPercent(record.evasao_hospitalar_raw, 1)}</strong></div>
      </div>
      <p class="section-title popup-components-title">Componentes do score</p>
      <div class="popup-components">${COMPONENTS.map((component) => componentHTML(record, component)).join("")}</div>
      <a class="button primary popup-score-link" href="entenda-o-score.html?${P.scoreQuery(record)}">Entenda este score</a>
      ${usingCustomWeights ? '<p class="popup-note"><strong>Pesos personalizados:</strong> este score usa os pesos salvos no simulador.</p>' : ""}
      <p class="popup-note">Prioridade relativa orienta investigação; não é recomendação automática de novos leitos.</p>
    </div>
  `;
}

function buildMap(container) {
  const map = L.map(container, {
    center: [-30.1, -53.2],
    zoom: 6,
    minZoom: 6,
    scrollWheelZoom: false,
    zoomControl: true,
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
    maxZoom: 18,
  }).addTo(map);
  return map;
}

async function initMap() {
  const container = document.querySelector("#priority-map");
  if (!container) return;
  if (!window.L) {
    container.textContent = "A biblioteca do mapa não foi carregada. Verifique sua conexão.";
    return;
  }

  try {
    const payload = await P.loadRankings();
    container.classList.remove("loading-state");
    container.textContent = "";
    const records = payload.records;
    const typeSelect = document.querySelector("#bed-type");
    const search = document.querySelector("#municipality-search");
    const regionSelect = document.querySelector("#region-filter");
    const yearSelect = document.querySelector("#year-filter");
    const compactList = document.querySelector("#compact-list");
    const typeChip = document.querySelector("#selected-type-chip");
    const updateYear = document.querySelector("[data-update-year]");
    const map = buildMap(container);
    const markerLayer = L.layerGroup().addTo(map);
    const selectionPanel = document.createElement("aside");
    selectionPanel.className = "map-selection-popup";
    selectionPanel.setAttribute("aria-label", "Município selecionado");
    container.append(selectionPanel);
    const params = new URLSearchParams(window.location.search);
    const requestedMunicipality = params.get("municipio");
    const requestedType = params.get("tipo");
    const savedWeights = P.loadScoreWeights();
    const usingCustomWeights = P.hasCustomScoreWeights(savedWeights);
    let visibleRecords = [];
    let selectedRecord = null;
    let selectedMarker = null;
    let markers = new Map();
    let initialSelectionApplied = false;

    Object.entries(P.BED_TYPES).forEach(([value, label]) => typeSelect.add(new Option(label, value)));
    typeSelect.value = P.BED_TYPES[requestedType] ? requestedType : "uti_adulto";
    yearSelect.add(new Option(String(payload.metadata.ano), String(payload.metadata.ano)));
    updateYear.textContent = `ano ${payload.metadata.ano}`;

    [...new Set(records.map((row) => row.macroregiao_saude).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((region) => regionSelect.add(new Option(region, region)));

    selectionPanel.addEventListener("click", (event) => {
      event.stopPropagation();
      const closeButton = event.target.closest(".map-popup-close");
      if (closeButton) {
        clearSelection();
        return;
      }
      const button = event.target.closest(".metric-help-button");
      if (!button) return;
      const content = document.getElementById(button.getAttribute("aria-controls"));
      if (!content) return;
      const shouldExpand = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(shouldExpand));
    });

    function recordsForType() {
      return records
        .filter((row) => row.tipo_leito === typeSelect.value)
        .sort((a, b) => scoreValue(b, savedWeights) - scoreValue(a, savedWeights) || a.municipio_nome.localeCompare(b.municipio_nome, "pt-BR"));
    }

    function updateSelectionStyles() {
      compactList.querySelectorAll(".compact-item").forEach((item) => item.classList.toggle("active", item.dataset.id === selectedRecord?.municipio_id));
      markers.forEach((marker, id) => marker.setStyle({
        weight: id === selectedRecord?.municipio_id ? 3 : 1.5,
        color: id === selectedRecord?.municipio_id ? "#183126" : "#ffffff",
      }));
    }

    function clearSelection() {
      selectedRecord = null;
      selectedMarker = null;
      selectionPanel.classList.remove("is-open");
      selectionPanel.replaceChildren();
      updateSelectionStyles();
    }

    function selectRecord(record, marker) {
      if (!record || !marker) return;
      selectedRecord = record;
      selectedMarker = marker;
      const allForType = recordsForType();
      const rank = allForType.findIndex((row) => row.municipio_id === record.municipio_id) + 1;
      selectionPanel.innerHTML = `<button class="map-popup-close" type="button" aria-label="Fechar município selecionado">×</button>${detailHTML(record, rank, allForType.length, savedWeights, usingCustomWeights)}`;
      selectionPanel.classList.add("is-open");
      updateSelectionStyles();
    }

    function renderCompactList() {
      compactList.innerHTML = visibleRecords.slice(0, 5).map((row) => `
        <button class="compact-item${row.municipio_id === selectedRecord?.municipio_id ? " active" : ""}" type="button" data-id="${row.municipio_id}">
          <span>${row.municipio_nome}</span><b>${P.formatNumber(scoreValue(row, savedWeights) * 100, 1)}</b>
        </button>
      `).join("") || '<div class="empty-state">Nenhum município encontrado.</div>';
      compactList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
        const record = visibleRecords.find((row) => row.municipio_id === button.dataset.id);
        const marker = markers.get(button.dataset.id);
        if (!record || !marker) return;
        map.setView(marker.getLatLng(), 9, { animate: false });
        selectRecord(record, marker);
      }));
    }

    function render() {
      clearSelection();
      const query = search.value.trim().toLocaleLowerCase("pt-BR");
      const region = regionSelect.value;
      visibleRecords = recordsForType().filter((row) => {
        const matchesSearch = !query || row.municipio_nome.toLocaleLowerCase("pt-BR").includes(query);
        return matchesSearch && (!region || row.macroregiao_saude === region);
      });
      typeChip.textContent = P.typeLabel(typeSelect.value);
      markerLayer.clearLayers();
      markers = new Map();
      visibleRecords.forEach((record) => {
        if (record.latitude === null || record.longitude === null) return;
        const currentScore = scoreValue(record, savedWeights);
        const marker = L.circleMarker([record.latitude, record.longitude], {
          radius: 4 + currentScore * 7,
          color: "#ffffff",
          fillColor: scoreColor(currentScore),
          fillOpacity: 0.88,
          weight: 1.5,
          bubblingMouseEvents: false,
        });
        marker.bindTooltip(`<strong>${record.municipio_nome}</strong><br>Score: ${P.formatNumber(currentScore * 100, 1)}`, { direction: "top" });
        marker.on("click", () => selectRecord(record, marker));
        marker.addTo(markerLayer);
        markers.set(record.municipio_id, marker);
      });
      renderCompactList();

      if (!initialSelectionApplied) {
        initialSelectionApplied = true;
        const requestedRecord = visibleRecords.find((row) => row.municipio_id === requestedMunicipality);
        const requestedMarker = requestedRecord ? markers.get(requestedRecord.municipio_id) : null;
        if (requestedRecord && requestedMarker) selectRecord(requestedRecord, requestedMarker);
      }
    }

    map.on("click", clearSelection);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && selectedRecord) clearSelection();
    });

    typeSelect.addEventListener("change", () => {
      search.value = "";
      render();
    });
    regionSelect.addEventListener("change", render);
    search.addEventListener("input", render);
    render();
  } catch (error) {
    console.error(error);
    container.textContent = "Não foi possível carregar os dados do mapa.";
  }
}

initMap();
