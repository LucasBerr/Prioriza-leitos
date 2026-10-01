const BED_TYPES = {
  uti_adulto: "UTI adulto",
  obstetrico: "Leitos obstétricos",
  pediatrico: "Leitos pediátricos",
};

const PRIORITY_LABELS = { muito_alta: "Muito alta", alta: "Alta", media: "Média", baixa: "Baixa" };
const SCORE_DIMENSIONS = [
  { key: "demanda", field: "demanda_residente_normalizado_0_100", defaultWeight: 30 },
  { key: "oferta", field: "deficit_oferta_regional_normalizado_0_100", defaultWeight: 30 },
  { key: "evasao", field: "evasao_hospitalar_normalizada_0_100", defaultWeight: 15 },
  { key: "crescimento", field: "pontuacao_normalizada_tendencia", defaultWeight: 15 },
  { key: "risco", field: "risco_populacional_normalizado_0_100", defaultWeight: 10 },
];
const SCORE_WEIGHT_STORAGE_KEY = "prioriza-score-weights";
const DEFAULT_SCORE_WEIGHTS = Object.fromEntries(SCORE_DIMENSIONS.map((item) => [item.key, item.defaultWeight]));
let rankingsPromise;

function loadRankings() {
  if (!rankingsPromise) rankingsPromise = fetch("data/rankings.json").then((response) => {
    if (!response.ok) throw new Error(`Falha ao carregar rankings: ${response.status}`);
    return response.json();
  });
  return rankingsPromise;
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/d";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value));
}
function formatPercent(value, digits = 0) { return value === null || value === undefined || Number.isNaN(Number(value)) ? "n/d" : `${formatNumber(value, digits)}%`; }
function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/d";
  const minutes = Math.round(Number(value) * 60);
  return minutes % 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${Math.floor(minutes / 60)}h`;
}
function typeLabel(type) { return BED_TYPES[type] || type; }
function priorityLabel(value) { return PRIORITY_LABELS[value] || value || "n/d"; }
function normalizedText(value) { return `${formatNumber(Number(value || 0), 1)}/100`; }
function clampWeight(value) { return Math.min(100, Math.max(0, Number.isNaN(Number(value)) ? 0 : Number(value))); }
function sanitizeWeights(weights) { return Object.fromEntries(SCORE_DIMENSIONS.map((item) => [item.key, clampWeight(weights?.[item.key] ?? item.defaultWeight)])); }
function defaultScoreWeights() { return { ...DEFAULT_SCORE_WEIGHTS }; }
function loadScoreWeights() {
  try { const stored = window.localStorage.getItem(SCORE_WEIGHT_STORAGE_KEY); return stored ? sanitizeWeights(JSON.parse(stored)) : defaultScoreWeights(); }
  catch (error) { console.warn("Não foi possível carregar os pesos salvos.", error); return defaultScoreWeights(); }
}
function saveScoreWeights(weights) { window.localStorage.setItem(SCORE_WEIGHT_STORAGE_KEY, JSON.stringify(sanitizeWeights(weights))); }
function scoreWeightTotal(weights) { const safe = sanitizeWeights(weights); return SCORE_DIMENSIONS.reduce((total, item) => total + safe[item.key], 0); }
function hasCustomScoreWeights(weights = loadScoreWeights()) { const safe = sanitizeWeights(weights); return SCORE_DIMENSIONS.some((item) => safe[item.key] !== item.defaultWeight); }
function weightedScore(record, weights = loadScoreWeights()) { const safe = sanitizeWeights(weights); return SCORE_DIMENSIONS.reduce((total, item) => total + Number(record[item.field] || 0) * safe[item.key], 0) / 100; }
function scoreQuery(record) { return new URLSearchParams({ municipio: record.municipio_id, tipo: record.tipo_leito }).toString(); }
function openMobileSheet(content) { const sheet = document.querySelector("#mobile-sheet"); const backdrop = document.querySelector("#sheet-backdrop"); const mount = document.querySelector("#mobile-sheet-content"); if (!sheet || !backdrop || !mount) return; mount.innerHTML = content; sheet.classList.add("open"); backdrop.classList.add("open"); backdrop.setAttribute("aria-hidden", "false"); }
function closeMobileSheet() { const sheet = document.querySelector("#mobile-sheet"); const backdrop = document.querySelector("#sheet-backdrop"); if (!sheet || !backdrop) return; sheet.classList.remove("open"); backdrop.classList.remove("open"); backdrop.setAttribute("aria-hidden", "true"); }
document.querySelector("#sheet-close")?.addEventListener("click", closeMobileSheet);
document.querySelector("#sheet-backdrop")?.addEventListener("click", closeMobileSheet);
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMobileSheet(); });

window.Prioriza = { BED_TYPES, SCORE_DIMENSIONS, closeMobileSheet, clampWeight, defaultScoreWeights, formatHours, formatNumber, formatPercent, hasCustomScoreWeights, loadRankings, loadScoreWeights, normalizedText, openMobileSheet, priorityLabel, scoreQuery, scoreWeightTotal, saveScoreWeights, sanitizeWeights, typeLabel, weightedScore };
