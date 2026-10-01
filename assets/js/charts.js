const P = window.Prioriza;

const PLOT_CONFIG = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ["lasso2d", "select2d", "autoScale2d"],
};

const PLOT_LAYOUT = {
  autosize: true,
  font: { family: 'Inter, "Segoe UI", sans-serif', color: "#202b29", size: 12 },
  margin: { l: 120, r: 24, t: 20, b: 45 },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor: "rgba(0,0,0,0)",
  xaxis: {
    fixedrange: true,
    gridcolor: "#e2dfd6",
    rangemode: "tozero",
    title: "Score de prioridade relativa",
  },
  yaxis: { fixedrange: true, automargin: true },
};

function requirePlotly(container) {
  if (window.Plotly) return true;
  P.showError(container, "O grafico nao foi carregado. Verifique sua conexao com a biblioteca Plotly.");
  return false;
}

function topRecords(records, type, region = "todas", limit = 12) {
  return records
    .filter((row) => row.tipo_leito === type)
    .filter((row) => region === "todas" || row.macroregiao_saude === region)
    .sort((a, b) => b.score_padrao_0_100 - a.score_padrao_0_100)
    .slice(0, limit);
}

function plotRanking(container, rows) {
  if (!requirePlotly(container)) return;
  const ordered = [...rows].reverse();
  Plotly.react(
    container,
    [
      {
        type: "bar",
        orientation: "h",
        x: ordered.map((row) => row.score_padrao_0_100),
        y: ordered.map((row) => row.municipio_nome),
        customdata: ordered.map((row) => [
          P.formatNumber(row.internacoes_residentes),
          P.formatNumber(row.leitos_sus_locais_registrados, 1),
          P.formatNumber(row.evasao_hospitalar_percentual, 1),
        ]),
        hovertemplate:
          "<b>%{y}</b><br>Score: %{x:.3f}<br>Internacoes residentes: %{customdata[0]}" +
          "<br>Leitos SUS medios: %{customdata[1]}<br>Evasao: %{customdata[2]}%<extra></extra>",
        marker: {
          color: ordered.map((row) => row.score_padrao_0_100),
          colorscale: [
            [0, "#dbecef"],
            [0.55, "#2c6b57"],
            [1, "#a65f43"],
          ],
          line: { width: 0 },
        },
      },
    ],
    PLOT_LAYOUT,
    PLOT_CONFIG,
  );
}

function renderTable(body, rows) {
  if (!body) return;
  body.innerHTML = rows
    .map(
      (row, index) => `
        <tr>
          <td class="rank">${index + 1}</td>
          <td><strong>${row.municipio_nome}</strong><br><small>${row.macroregiao_saude || "n/d"}</small></td>
          <td class="score">${P.formatNumber(row.score_padrao_0_100, 1)}</td>
          <td>${P.formatNumber(row.internacoes_residentes)}</td>
          <td>${P.formatNumber(row.leitos_sus_locais_registrados, 1)}</td>
          <td><span class="priority-badge">${P.priorityLabel(row.faixa_prioridade)}</span></td>
        </tr>
      `,
    )
    .join("");
}

function populateMetrics(rows, year) {
  document.querySelectorAll("[data-score-year]").forEach((node) => {
    node.textContent = year;
  });
  document.querySelectorAll("[data-municipality-count]").forEach((node) => {
    node.textContent = new Set(rows.map((row) => row.municipio_id)).size;
  });
  document.querySelectorAll("[data-bed-count]").forEach((node) => {
    node.textContent = new Set(rows.map((row) => row.tipo_leito)).size;
  });
}

async function initHome() {
  const chart = document.querySelector("#home-ranking-chart");
  if (!chart) return;
  try {
    const payload = await P.loadRankings();
    populateMetrics(payload.records, payload.metadata.ano);
    const rows = topRecords(payload.records, "uti_adulto", "todas", 10);
    plotRanking(chart, rows);
    renderTable(document.querySelector("#home-ranking-body"), rows.slice(0, 5));
  } catch (error) {
    console.error(error);
    P.showError(chart, "Nao foi possivel carregar o ranking local.");
  }
}

async function initRankingPage() {
  const chart = document.querySelector("#ranking-chart");
  if (!chart) return;
  const typeSelect = document.querySelector("#type-filter");
  const regionSelect = document.querySelector("#region-filter");
  const tableBody = document.querySelector("#ranking-table-body");

  try {
    const payload = await P.loadRankings();
    populateMetrics(payload.records, payload.metadata.ano);
    Object.entries(P.BED_TYPES).forEach(([value, label]) => {
      typeSelect.add(new Option(label, value));
    });
    [...new Set(payload.records.map((row) => row.macroregiao_saude).filter(Boolean))]
      .sort()
      .forEach((region) => regionSelect.add(new Option(region, region)));

    const update = () => {
      const rows = topRecords(payload.records, typeSelect.value, regionSelect.value, 20);
      plotRanking(chart, rows.slice(0, 12));
      renderTable(tableBody, rows);
      document.querySelector("[data-ranking-title]").textContent = P.typeLabel(typeSelect.value);
    };
    typeSelect.addEventListener("change", update);
    regionSelect.addEventListener("change", update);
    update();
  } catch (error) {
    console.error(error);
    P.showError(chart, "Nao foi possivel carregar o ranking local.");
  }
}

async function initBedPage() {
  const chart = document.querySelector("#bed-ranking-chart");
  if (!chart) return;
  const type = document.body.dataset.bedType;
  try {
    const payload = await P.loadRankings();
    const rows = topRecords(payload.records, type, "todas", 15);
    populateMetrics(payload.records, payload.metadata.ano);
    plotRanking(chart, rows.slice(0, 10));
    renderTable(document.querySelector("#bed-ranking-body"), rows);

    const top = rows[0];
    const metrics = {
      "[data-top-municipality]": top?.municipio_nome,
      "[data-top-score]": P.formatNumber(top?.score_padrao_0_100, 1),
      "[data-top-demand]": P.formatNumber(top?.internacoes_residentes),
      "[data-top-beds]": P.formatNumber(top?.leitos_sus_locais_registrados, 1),
    };
    Object.entries(metrics).forEach(([selector, value]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = value || "n/d";
    });
  } catch (error) {
    console.error(error);
    P.showError(chart, "Nao foi possivel carregar os dados deste tipo de leito.");
  }
}

initHome();
initRankingPage();
initBedPage();
