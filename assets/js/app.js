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
  closeMobileSheet,
  formatNumber,
  formatPercent,
  loadRankings,
  normalizedText,
  openMobileSheet,
  priorityLabel,
  scoreQuery,
  typeLabel,
};
