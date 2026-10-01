const P = window.Prioriza;

const DIMENSIONS = [
  {
    key: "demanda",
    name: "Demanda residente",
    icon: "DR",
    field: "demanda_residente_normalizado_0_100",
    defaultWeight: 30,
    short: "Pressão de internações da população residente.",
    source: "SIH/SUS e Ministério da Saúde / DATASUS",
    indicator: "Internações de residentes por mil pessoas da população-alvo.",
    raw: (row) => `${P.formatNumber(row.demanda_residente_taxa_por_1000_pop_alvo, 2)} por mil (${P.formatNumber(row.internacoes_residentes)} internações)`,
    explanation: "Mede a demanda dos moradores, mesmo quando a internação ocorreu em outro município.",
  },
  {
    key: "oferta",
    name: "Déficit de oferta regional",
    icon: "DO",
    field: "deficit_oferta_regional_normalizado_0_100",
    defaultWeight: 30,
    short: "Pressão regional por leito e deslocamento até a oferta.",
    source: "CNES, Ministério da Saúde / DATASUS e rotas",
    indicator: "70% pressão regional por leito e 30% penalidade de deslocamento.",
    raw: (row) => `${P.formatNumber(row.pressao_regional_por_leito, 1)} pessoas por leito; rota ${P.formatHours(row.duracao_rota_horas)}`,
    explanation: "Considera a população-alvo dos municípios associados ao polo de referência e o tempo de viagem até a oferta.",
  },
  {
    key: "evasao",
    name: "Evasão intermunicipal",
    icon: "EH",
    field: "evasao_hospitalar_normalizada_0_100",
    defaultWeight: 15,
    short: "Parcela de residentes internados fora do município.",
    source: "SIH/SUS",
    indicator: "Internações fora do município divididas pelas internações de residentes.",
    raw: (row) => `${P.formatPercent(row.evasao_hospitalar_percentual, 1)} (${P.formatNumber(row.internacoes_fora_municipio)} fora do município)`,
    explanation: "Preserva a distinção entre município de residência e município de internação.",
  },
  {
    key: "risco",
    name: "Risco populacional",
    icon: "RP",
    field: "risco_populacional_normalizado_0_100",
    defaultWeight: 10,
    short: "Perfil populacional pertinente ao tipo de leito.",
    source: "IBGE",
    indicator: "Proporção do subgrupo de risco adequado ao tipo de leito.",
    raw: (row) => `${P.formatNumber(row.populacao_alvo)} pessoas na população-alvo`,
    explanation: "O denominador muda por tipo: população infantil para pediátricos, mulheres em idade fértil para obstétricos e população adulta para UTI Adulto.",
  },
  {
    key: "crescimento",
    name: "Tendência de crescimento",
    icon: "CD",
    field: "pontuacao_normalizada_tendencia",
    defaultWeight: 15,
    short: "Crescimento histórico da população-alvo em cinco anos.",
    source: "Ministério da Saúde / DATASUS",
    indicator: "CAGR da população-alvo entre 2021 e 2025.",
    raw: (row) => `CAGR ${P.formatPercent(row.taxa_anual_composta_percentual, 2)}; variação de ${P.formatNumber(row.variacao_absoluta_2021_2025)} pessoas`,
    explanation: "A tendência histórica não é previsão. Faixas congeladas classificam sem crescimento, crescimento positivo e crescimento alto.",
  },
];

const DEFAULT_WEIGHTS = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.key, dimension.defaultWeight]));
const SIMULATION_TOLERANCE = 0.01;

let selectedDimension = DIMENSIONS[0].key;
let expandedDimension = DIMENSIONS[0].key;
let currentRecord;
let currentTypeRecords = [];
let currentWeights = P.loadScoreWeights();

function clampWeight(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function totalWeight() {
  return DIMENSIONS.reduce((sum, dimension) => sum + clampWeight(currentWeights[dimension.key]), 0);
}

function weightText(value, digits = 0) {
  return `${P.formatNumber(value, digits)}%`;
}

function normalizedValue(record, dimension) {
  return Number(record[dimension.field] || 0);
}

function contributionPoints(record, dimension) {
  return normalizedValue(record, dimension) * clampWeight(currentWeights[dimension.key]) / 100;
}

function simulatedScore(record) {
  return DIMENSIONS.reduce((sum, dimension) => sum + contributionPoints(record, dimension), 0);
}

function isWeightSumValid() {
  return Math.abs(totalWeight() - 100) <= SIMULATION_TOLERANCE;
}

function detailHTML(dimension, record) {
  const normalized = normalizedValue(record, dimension);
  const weight = clampWeight(currentWeights[dimension.key]);
  const contribution = contributionPoints(record, dimension);
  return `
    <div class="side-panel-header">
      <div class="big-icon" aria-hidden="true">${dimension.icon}</div>
      <div>
        <p class="section-title">Componente selecionado</p>
        <h2>${dimension.name}</h2>
        <span class="score-badge">Normalizado: ${P.normalizedText(normalized)}</span>
      </div>
    </div>
    <dl class="detail-list">
      <div class="detail-item"><dt>O que representa</dt><dd>${dimension.explanation}</dd></div>
      <div class="detail-item"><dt>Fonte dos dados</dt><dd>${dimension.source}</dd></div>
      <div class="detail-item"><dt>Indicador utilizado</dt><dd>${dimension.indicator}</dd></div>
      <div class="detail-item"><dt>Valor observado</dt><dd>${dimension.raw(record)}</dd></div>
      <div class="detail-item"><dt>Normalização</dt><dd>O valor publicado para este componente é ${P.normalizedText(normalized)}. Consulte a descrição do indicador para a regra específica.</dd></div>
      <div class="detail-item"><dt>Peso original da metodologia</dt><dd>${weightText(dimension.defaultWeight)}</dd></div>
      <div class="detail-item"><dt>Peso nesta simulação</dt><dd>${weightText(weight)}</dd></div>
      <div class="detail-item"><dt>Contribuição ponderada</dt><dd>${P.formatNumber(contribution, 2)} pontos no score simulado.</dd></div>
    </dl>
    <div class="calc-box"><strong>Cálculo simulado:</strong> ${P.formatNumber(normalized, 1)} × ${weightText(weight)} = ${P.formatNumber(contribution, 2)} pontos.</div>
  `;
}

function calculationDiagramHTML(record) {
  const score = simulatedScore(record);
  const total = Math.max(score, 0);
  const segments = DIMENSIONS.map((dimension) => {
    const contribution = contributionPoints(record, dimension);
    const width = total > 0 ? (contribution / total) * 100 : 0;
    return `
      <span
        class="stacked-segment dim-${dimension.key}"
        style="--segment-width:${width}%"
        title="${dimension.name}: ${P.formatNumber(contribution, 2)} pontos">
      </span>
    `;
  }).join("");

  const legend = DIMENSIONS.map((dimension) => `
    <div class="diagram-legend-item">
      <span class="legend-dot dim-${dimension.key}" aria-hidden="true"></span>
      <span>${dimension.name}</span>
      <strong>${P.formatNumber(contributionPoints(record, dimension), 2)}</strong>
    </div>
  `).join("");

  return `
    <div class="diagram-header">
      <div>
        <p class="section-title">Diagrama do cálculo</p>
        <h3>Contribuição de cada dimensão para o score simulado</h3>
      </div>
      <strong>${P.formatNumber(score, 2)} pontos</strong>
    </div>
    <div class="stacked-bar" aria-hidden="true">${segments}</div>
    <div class="diagram-legend">${legend}</div>
  `;
}

function updateSimulationView(record) {
  const sum = totalWeight();
  const valid = isWeightSumValid();
  const score = simulatedScore(record);
  const sumBadge = document.querySelector("#weight-sum");
  const finalBand = document.querySelector("#final-band");
  const saveButton = document.querySelector("#save-weights");

  document.querySelector("#final-score").textContent = P.formatNumber(score, 2);

  if (sumBadge) {
    sumBadge.textContent = valid
      ? `Soma dos pesos: ${weightText(sum)}`
      : `Atenção: pesos somam ${weightText(sum)} — ajuste para 100%`;
    sumBadge.classList.toggle("is-ok", valid);
    sumBadge.classList.toggle("is-warning", !valid);
  }

  if (finalBand) {
    finalBand.textContent = valid
      ? "Simulação com soma 100%"
      : "Simulação exploratória: soma diferente de 100%";
  }

  if (saveButton) {
    saveButton.disabled = !valid;
  }

  DIMENSIONS.forEach((dimension) => {
    const card = document.querySelector(`.dimension-card[data-key="${dimension.key}"]`);
    const weight = clampWeight(currentWeights[dimension.key]);
    const contribution = contributionPoints(record, dimension);
    if (!card) return;
    card.querySelector(".weight-current").textContent = weightText(weight);
    card.querySelector(".contribution-value").textContent = P.formatNumber(contribution, 2);
    card.querySelector(".weight-fill").style.setProperty("--bar-width", `${weight}%`);
    card.querySelector(".weight-slider").value = weight;
    card.querySelector(".weight-number").value = weight;
  });

  document.querySelector("#contribution-list").innerHTML = DIMENSIONS.map((dimension) => `
    <div class="contribution">
      <span>${dimension.name}</span>
      <strong>+ ${P.formatNumber(contributionPoints(record, dimension), 2)}</strong>
    </div>
  `).join("");

  document.querySelector("#calculation-diagram").innerHTML = calculationDiagramHTML(record);

  const dimension = DIMENSIONS.find((item) => item.key === selectedDimension) || DIMENSIONS[0];
  document.querySelector("#dimension-detail").innerHTML = detailHTML(dimension, record);
}

function render(record, typeRecords) {
  currentRecord = record;
  currentTypeRecords = typeRecords;
  const cards = document.querySelector("#dimension-cards");
  cards.innerHTML = DIMENSIONS.map((dimension) => {
    const value = normalizedValue(record, dimension);
    const weight = clampWeight(currentWeights[dimension.key]);
    const contribution = contributionPoints(record, dimension);
    return `
      <article class="dimension-card ${dimension.key === selectedDimension ? "is-active" : ""} ${dimension.key === expandedDimension ? "is-expanded" : ""}" data-key="${dimension.key}">
        <button class="dimension-summary" type="button" data-key="${dimension.key}" aria-expanded="${dimension.key === expandedDimension}">
          <div class="dimension-top">
            <span class="dim-icon" aria-hidden="true">${dimension.icon}</span>
            <b>${P.formatNumber(value, 1)}</b>
          </div>
          <h3>${dimension.name}</h3>
          <p>${dimension.short}</p>
          <span class="mobile-expand-hint">Toque para ajustar o peso</span>
        </button>
        <div class="dimension-metrics" aria-label="Resumo de ${dimension.name}">
          <div><span>Normalizado</span><strong>${P.normalizedText(value)}</strong></div>
          <div><span>Peso atual</span><strong class="weight-current">${weightText(weight)}</strong></div>
          <div><span>Contribuição</span><strong><span class="contribution-value">${P.formatNumber(contribution, 2)}</span> pts</strong></div>
        </div>
        <div class="weight-controls">
          <div class="weight-meta">
            <span>Barra do peso escolhido</span>
            <strong>Padrão: ${weightText(dimension.defaultWeight)}</strong>
          </div>
          <div class="bar-track weight-track" aria-hidden="true"><div class="bar-fill weight-fill" style="--bar-width:${weight}%"></div></div>
          <label class="slider-label" for="weight-slider-${dimension.key}">
            <span>Peso de ${dimension.name}</span>
            <input class="weight-slider" id="weight-slider-${dimension.key}" data-key="${dimension.key}" type="range" min="0" max="100" step="1" value="${weight}">
          </label>
          <label class="number-label" for="weight-number-${dimension.key}">
            <span>Peso em %</span>
            <input class="weight-number" id="weight-number-${dimension.key}" data-key="${dimension.key}" type="number" min="0" max="100" step="1" value="${weight}" inputmode="numeric">
          </label>
        </div>
      </article>
    `;
  }).join("");

  document.querySelector("#score-year").textContent = record.ano;
  document.querySelector("#score-rank").textContent = `${typeRecords.findIndex((row) => row.municipio_id === record.municipio_id) + 1}º de ${typeRecords.length}`;
  document.querySelector("#back-to-map").href = `index.html?${P.scoreQuery(record)}`;

  cards.querySelectorAll(".dimension-summary").forEach((button) => button.addEventListener("click", () => {
    selectedDimension = button.dataset.key;
    expandedDimension = expandedDimension === button.dataset.key ? "" : button.dataset.key;
    render(currentRecord, currentTypeRecords);
  }));

  cards.querySelectorAll(".weight-slider, .weight-number").forEach((input) => input.addEventListener("input", (event) => {
    currentWeights[event.target.dataset.key] = clampWeight(event.target.value);
    updateSimulationView(currentRecord);
  }));

  updateSimulationView(record);
}

async function initScore() {
  try {
    const payload = await P.loadRankings();
    const municipalitySelect = document.querySelector("#score-municipality");
    const typeSelect = document.querySelector("#score-bed-type");
    const resetButton = document.querySelector("#reset-weights");
    const saveButton = document.querySelector("#save-weights");
    const saveStatus = document.querySelector("#save-status");
    const params = new URLSearchParams(window.location.search);
    const requestedMunicipality = params.get("municipio");
    const requestedType = params.get("tipo");

    function updateSaveStatus(message) {
      if (saveStatus) saveStatus.textContent = message;
    }

    updateSaveStatus(P.hasCustomScoreWeights(currentWeights) ? "Pesos personalizados salvos" : "Pesos padrão em uso");

    Object.entries(P.BED_TYPES).forEach(([value, label]) => typeSelect.add(new Option(label, value)));
    typeSelect.value = P.BED_TYPES[requestedType] ? requestedType : "uti_adulto";

    function typeRecords() {
      return payload.records
        .filter((row) => row.tipo_leito === typeSelect.value)
        .sort((a, b) => P.weightedScore(b, currentWeights) - P.weightedScore(a, currentWeights) || a.municipio_nome.localeCompare(b.municipio_nome, "pt-BR"));
    }

    function fillMunicipalities(preferredId) {
      const records = typeRecords();
      municipalitySelect.innerHTML = "";
      [...records].sort((a, b) => a.municipio_nome.localeCompare(b.municipio_nome, "pt-BR"))
        .forEach((row) => municipalitySelect.add(new Option(row.municipio_nome, row.municipio_id)));
      municipalitySelect.value = records.some((row) => row.municipio_id === preferredId) ? preferredId : records[0].municipio_id;
      const record = records.find((row) => row.municipio_id === municipalitySelect.value);
      const query = P.scoreQuery(record);
      history.replaceState(null, "", `?${query}`);
      render(record, records);
    }

    typeSelect.addEventListener("change", () => fillMunicipalities(municipalitySelect.value));
    municipalitySelect.addEventListener("change", () => {
      const records = typeRecords();
      const record = records.find((row) => row.municipio_id === municipalitySelect.value);
      history.replaceState(null, "", `?${P.scoreQuery(record)}`);
      render(record, records);
    });
    resetButton?.addEventListener("click", () => {
      currentWeights = { ...DEFAULT_WEIGHTS };
      updateSaveStatus("Pesos padrão restaurados nesta simulação");
      render(currentRecord, currentTypeRecords);
    });
    saveButton?.addEventListener("click", () => {
      if (!isWeightSumValid()) return;
      P.saveScoreWeights(currentWeights);
      updateSaveStatus(P.hasCustomScoreWeights(currentWeights) ? "Pesos personalizados salvos" : "Pesos padrão salvos");
    });
    fillMunicipalities(requestedMunicipality);
  } catch (error) {
    console.error(error);
    document.querySelector("#dimension-cards").innerHTML = '<div class="empty-state">Não foi possível carregar os dados do score.</div>';
  }
}

initScore();
