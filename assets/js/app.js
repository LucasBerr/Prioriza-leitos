const BED_TYPES = {
  leitos_clinicos: "Leitos clínicos",
  leitos_cirurgicos: "Leitos cirúrgicos",
  leitos_obstetricos: "Leitos obstétricos",
  leitos_pediatricos: "Leitos pediátricos",
  uti_adulto: "UTI Adulto",
};

const PRIORITY_LABELS = {
  muito_alta: "Muito alta",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

const SCORE_DIMENSIONS = [
  { key: "demanda", field: "demanda_residente_normalizada", defaultWeight: 30 },
  { key: "oferta", field: "deficit_oferta_sus_normalizado", defaultWeight: 25 },
  { key: "evasao", field: "evasao_hospitalar_normalizada", defaultWeight: 20 },
  { key: "risco", field: "risco_populacional_normalizado", defaultWeight: 15 },
  { key: "crescimento", field: "crescimento_demanda_normalizado", defaultWeight: 10 },
];

const SCORE_WEIGHT_STORAGE_KEY = "prioriza-score-weights";
const DEFAULT_SCORE_WEIGHTS = Object.fromEntries(SCORE_DIMENSIONS.map((dimension) => [dimension.key, dimension.defaultWeight]));

let rankingsPromise;

function loadRankings() {
  if (!rankingsPromise) {
    rankingsPromise = fetch("data/rankings.json").then((response) => {
      if (!response.ok) throw new Error(`Falha ao carregar rankings: ${response.status}`);
      return response.json();
    });
  }
  return rankingsPromise;
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/d";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/d";
  return `${formatNumber(Number(value) * 100, digits)}%`;
}

function typeLabel(type) {
  return BED_TYPES[type] || type;
}

function priorityLabel(value) {
  return PRIORITY_LABELS[value] || value || "n/d";
}

function normalizedText(value) {
  return `${formatNumber(Number(value || 0) * 100, 1)}/100`;
}

function clampWeight(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

function sanitizeWeights(weights) {
  return Object.fromEntries(SCORE_DIMENSIONS.map((dimension) => [
    dimension.key,
    clampWeight(weights?.[dimension.key] ?? dimension.defaultWeight),
  ]));
}

function defaultScoreWeights() {
  return { ...DEFAULT_SCORE_WEIGHTS };
}

function loadScoreWeights() {
  try {
    const stored = window.localStorage.getItem(SCORE_WEIGHT_STORAGE_KEY);
    return stored ? sanitizeWeights(JSON.parse(stored)) : defaultScoreWeights();
  } catch (error) {
    console.warn("Não foi possível carregar os pesos salvos.", error);
    return defaultScoreWeights();
  }
}

function saveScoreWeights(weights) {
  window.localStorage.setItem(SCORE_WEIGHT_STORAGE_KEY, JSON.stringify(sanitizeWeights(weights)));
}

function scoreWeightTotal(weights) {
  const sanitized = sanitizeWeights(weights);
  return SCORE_DIMENSIONS.reduce((sum, dimension) => sum + sanitized[dimension.key], 0);
}

function hasCustomScoreWeights(weights = loadScoreWeights()) {
  const sanitized = sanitizeWeights(weights);
  return SCORE_DIMENSIONS.some((dimension) => sanitized[dimension.key] !== dimension.defaultWeight);
}

function weightedScore(record, weights = loadScoreWeights()) {
  const sanitized = sanitizeWeights(weights);
  return SCORE_DIMENSIONS.reduce((sum, dimension) => {
    const value = Number(record[dimension.field] || 0);
    return sum + value * sanitized[dimension.key];
  }, 0) / 100;
}

function scoreQuery(record) {
  const params = new URLSearchParams({
    municipio: record.municipio_id,
    tipo: record.tipo_leito,
  });
  return params.toString();
}

function openMobileSheet(content) {
  const sheet = document.querySelector("#mobile-sheet");
  const backdrop = document.querySelector("#sheet-backdrop");
  const mount = document.querySelector("#mobile-sheet-content");
  if (!sheet || !backdrop || !mount) return;
  mount.innerHTML = content;
  sheet.classList.add("open");
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
}

function closeMobileSheet() {
  const sheet = document.querySelector("#mobile-sheet");
  const backdrop = document.querySelector("#sheet-backdrop");
  if (!sheet || !backdrop) return;
  sheet.classList.remove("open");
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
}

document.querySelector("#sheet-close")?.addEventListener("click", closeMobileSheet);
document.querySelector("#sheet-backdrop")?.addEventListener("click", closeMobileSheet);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileSheet();
});

window.Prioriza = {
  BED_TYPES,
  SCORE_DIMENSIONS,
  closeMobileSheet,
  clampWeight,
  defaultScoreWeights,
  formatNumber,
  formatPercent,
  hasCustomScoreWeights,
  loadRankings,
  loadScoreWeights,
  normalizedText,
  openMobileSheet,
  priorityLabel,
  scoreQuery,
  scoreWeightTotal,
  saveScoreWeights,
  sanitizeWeights,
  typeLabel,
  weightedScore,
};
