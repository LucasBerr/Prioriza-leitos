const P = window.Prioriza;

const COMPONENTS = [
  ["Demanda residente", "demanda_residente_normalizada"],
  ["Déficit de oferta", "deficit_oferta_sus_normalizado"],
  ["Evasão hospitalar", "evasao_hospitalar_normalizada"],
  ["Risco populacional", "risco_populacional_normalizado"],
  ["Crescimento", "crescimento_demanda_normalizado"],
];

function scoreColor(score) {
  if (score >= 0.75) return "#0b5631";
  if (score >= 0.6) return "#23874e";
  if (score >= 0.4) return "#62bb77";
  if (score >= 0.2) return "#a7ddb0";
  return "#d7f0d5";
}

function detailHTML(record, rank, total) {
  const bars = COMPONENTS.map(([label, key]) => `
    <div class="bar-row">
      <div class="bar-label"><span>${label}</span><strong>${P.normalizedText(record[key])}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="--bar-width:${Number(record[key] || 0) * 100}%"></div></div>
    </div>
  `).join("");
  const score = P.formatNumber(record.score_prioridade_mvp * 100, 1);
  return `
    <div class="detail-head">
      <div>
        <p class="section-title">Município selecionado</p>
        <h2>${record.municipio_nome}</h2>
        <p>${record.regiao_saude} · ${record.macroregiao_saude}</p>
        <span class="priority-badge">Prioridade ${P.priorityLabel(record.faixa_prioridade)}</span>
      </div>
      <div class="score-ring" style="--score-angle:${record.score_prioridade_mvp * 360}deg" aria-label="Score ${score} de 100"><strong>${score}</strong></div>
    </div>
    <div class="rank-line">
      <div class="metric-box"><span>Posição relativa</span><strong>${rank}º <small>de ${total}</small></strong></div>
      <div class="metric-box"><span>Leitos SUS médios</span><strong>${P.formatNumber(record.leitos_sus_media, 1)}</strong></div>
      <div class="metric-box"><span>Internações residentes</span><strong>${P.formatNumber(record.internacoes_residentes)}</strong></div>
      <div class="metric-box"><span>Evasão hospitalar</span><strong>${P.formatPercent(record.evasao_hospitalar_raw, 1)}</strong></div>
    </div>
    <p class="section-title">Componentes normalizados</p>
    <div class="dimension-bars">${bars}</div>
    <a class="button primary" href="entenda-o-score.html?${P.scoreQuery(record)}">Entenda este score</a>
    <div class="warning"><strong>Leitura responsável:</strong> alta prioridade relativa indica onde investigar com mais cuidado. Não é recomendação automática de novos leitos.</div>
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
    const detailPanel = document.querySelector("#details-panel");
    const compactList = document.querySelector("#compact-list");
    const typeChip = document.querySelector("#selected-type-chip");
    const updateYear = document.querySelector("[data-update-year]");
    const map = buildMap(container);
    const markerLayer = L.layerGroup().addTo(map);
    const params = new URLSearchParams(window.location.search);
    const requestedMunicipality = params.get("municipio");
    const requestedType = params.get("tipo");
    let visibleRecords = [];
    let selectedRecord = null;
    let markers = new Map();

    Object.entries(P.BED_TYPES).forEach(([value, label]) => typeSelect.add(new Option(label, value)));
    typeSelect.value = P.BED_TYPES[requestedType] ? requestedType : "uti_adulto";
    yearSelect.add(new Option(String(payload.metadata.ano), String(payload.metadata.ano)));
    updateYear.textContent = `ano ${payload.metadata.ano}`;

    [...new Set(records.map((row) => row.macroregiao_saude).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((region) => regionSelect.add(new Option(region, region)));

    function recordsForType() {
      return records
        .filter((row) => row.tipo_leito === typeSelect.value)
        .sort((a, b) => b.score_prioridade_mvp - a.score_prioridade_mvp || a.municipio_nome.localeCompare(b.municipio_nome, "pt-BR"));
    }

    function selectRecord(record, openSheet = false) {
      selectedRecord = record;
      const allForType = recordsForType();
      const rank = allForType.findIndex((row) => row.municipio_id === record.municipio_id) + 1;
      const html = detailHTML(record, rank, allForType.length);
      detailPanel.innerHTML = html;
      compactList.querySelectorAll(".compact-item").forEach((item) => item.classList.toggle("active", item.dataset.id === record.municipio_id));
      markers.forEach((marker, id) => marker.setStyle({ weight: id === record.municipio_id ? 3 : 1.5, color: id === record.municipio_id ? "#183126" : "#ffffff" }));
      if (openSheet && window.matchMedia("(max-width: 760px)").matches) P.openMobileSheet(html);
    }

    function renderCompactList() {
      compactList.innerHTML = visibleRecords.slice(0, 5).map((row) => `
        <button class="compact-item${row.municipio_id === selectedRecord?.municipio_id ? " active" : ""}" type="button" data-id="${row.municipio_id}">
          <span>${row.municipio_nome}</span><b>${P.formatNumber(row.score_prioridade_mvp * 100, 1)}</b>
        </button>
      `).join("") || '<div class="empty-state">Nenhum município encontrado.</div>';
      compactList.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
        const record = visibleRecords.find((row) => row.municipio_id === button.dataset.id);
        if (!record) return;
        map.setView([record.latitude, record.longitude], 9);
        selectRecord(record, true);
      }));
    }

    function render() {
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
        const marker = L.circleMarker([record.latitude, record.longitude], {
          radius: 4 + record.score_prioridade_mvp * 7,
          color: "#ffffff",
          fillColor: scoreColor(record.score_prioridade_mvp),
          fillOpacity: 0.88,
          weight: 1.5,
        });
        marker.bindTooltip(`<strong>${record.municipio_nome}</strong><br>Score: ${P.formatNumber(record.score_prioridade_mvp * 100, 1)}`, { direction: "top" });
        marker.on("click", () => selectRecord(record, true));
        marker.addTo(markerLayer);
        markers.set(record.municipio_id, marker);
      });
      if (!visibleRecords.some((row) => row.municipio_id === selectedRecord?.municipio_id)) {
        selectedRecord = visibleRecords.find((row) => row.municipio_id === requestedMunicipality) || visibleRecords[0] || null;
      }
      renderCompactList();
      if (selectedRecord) selectRecord(selectedRecord, false);
      else detailPanel.innerHTML = '<div class="empty-state">Nenhum município corresponde aos filtros.</div>';
    }

    typeSelect.addEventListener("change", () => {
      search.value = "";
      selectedRecord = null;
      render();
    });
    regionSelect.addEventListener("change", () => { selectedRecord = null; render(); });
    search.addEventListener("input", render);
    render();
  } catch (error) {
    console.error(error);
    container.textContent = "Não foi possível carregar os dados do mapa.";
  }
}

initMap();
