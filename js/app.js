import { SCENARIOS, DEFAULTS, plan, nationalTotal, fmtNum, fmtINR, fmtUSD } from "./model.js";
import { STATES, DATA_NOTES } from "../data/states.js";

const $ = (id) => document.getElementById(id);
const STRATS = {
  disposable: { label: "Disposable N95", color: "--s-disposable" },
  mix: { label: "90% elastomeric", color: "--s-mix" },
  reusable: { label: "All elastomeric", color: "--s-reusable" },
};

// Labels and steps for every assumption shown in the advanced panel.
const FIELDS = [
  ["horizonYears", "Planning horizon, years", 1],
  ["n95CapacityPerDay", "India N95 output at peak, per day", 100000],
  ["activeShareDoctors", "Share of registered doctors active", 0.05],
  ["activeShareNurses", "Share of registered nurses and ANMs active", 0.05],
  ["supportStaffPerClinician", "Support staff per doctor or nurse", 0.1],
  ["spareFactor", "Spare stock factor", 0.01],
  ["n95ShelfLifeYears", "N95 shelf life, years", 1],
  ["ehmrLifeYears", "Elastomeric life, years", 1],
  ["filterDaysOfUse", "Days of use per filter pair", 1],
  ["filterShelfLifeYears", "Filter shelf life, years", 1],
  ["fitTestTrainingINR", "Fit test and training, ₹ per worker", 10],
  ["storageINRPerUnitYear", "Storage, ₹ per N95 per year", 0.1],
  ["ehmrStorageMultiple", "Elastomeric volume vs one N95", 1],
  ["ehmrShareHcw", "Elastomeric share, health workers (mix)", 0.05],
  ["ehmrShareCritical", "Elastomeric share, critical workers (mix)", 0.05],
  ["existingN95Stock", "N95s already in stock", 1000],
  ["committedBudgetINR", "Budget already committed, ₹", 100000],
  ["usdINR", "₹ per US dollar", 1],
];
const PRICE_FIELDS = ["n95PriceINR", "ehmrPriceINR", "filterPairPriceINR", "surgePriceMultiplier"];

const state = {
  stateCode: "KL",
  scenario: "nipah",
  days: null, // null = scenario default
  strat: "mix",
  a: { ...DEFAULTS },
  sort: { key: "total", dir: -1 },
};

const ALL = [nationalTotal(STATES), ...STATES];
const byCode = Object.fromEntries(ALL.map((s) => [s.code, s]));
const cssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// ---------- URL state (so a plan can be shared as a link) ----------
function readHash() {
  const p = new URLSearchParams(location.hash.slice(1));
  if (p.get("s") && byCode[p.get("s")]) state.stateCode = p.get("s");
  if (p.get("sc") && SCENARIOS[p.get("sc")]) state.scenario = p.get("sc");
  if (p.get("d")) state.days = +p.get("d");
  if (p.get("st") && STRATS[p.get("st")]) state.strat = p.get("st");
  for (const k of Object.keys(DEFAULTS)) if (p.has(k)) state.a[k] = +p.get(k);
}
function writeHash() {
  const p = new URLSearchParams({ s: state.stateCode, sc: state.scenario, st: state.strat });
  if (state.days != null) p.set("d", state.days);
  for (const k of Object.keys(DEFAULTS)) if (state.a[k] !== DEFAULTS[k]) p.set(k, state.a[k]);
  history.replaceState(null, "", "#" + p.toString());
}

// ---------- Controls ----------
function buildControls() {
  const sel = $("state");
  sel.innerHTML = ALL.map((s) => `<option value="${s.code}">${s.name}</option>`).join("");
  $("scenario").innerHTML = Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${s.label}</option>`).join("");
  $("advFields").innerHTML = FIELDS.map(([k, l, step]) =>
    `<label>${l}<input type="number" id="${k}" step="${step}" min="0"></label>`).join("");

  sel.onchange = () => { state.stateCode = sel.value; update(); };
  $("scenario").onchange = () => { state.scenario = $("scenario").value; state.days = null; update(); };
  $("days").oninput = () => { state.days = +$("days").value; update(); };
  $("extendedUse").onchange = () => { state.a.extendedUse = $("extendedUse").checked ? 1 : 0; update(); };
  $("crit").oninput = () => { state.a.criticalWorkerPctOfPop = +$("crit").value; update(); };
  for (const k of [...PRICE_FIELDS, ...FIELDS.map((f) => f[0])]) {
    $(k).oninput = () => { const v = parseFloat($(k).value); if (isFinite(v)) { state.a[k] = v; update(false); } };
  }
  $("reset").onclick = () => { state.a = { ...DEFAULTS }; state.days = null; update(); };
  document.querySelectorAll("#stratTabs button").forEach((b) => (b.onclick = () => { state.strat = b.dataset.s; update(); }));
  $("share").onclick = async () => {
    writeHash();
    try { await navigator.clipboard.writeText(location.href); toast("Link copied"); } catch { toast("Copy the address bar to share"); }
  };
  $("csv").onclick = downloadCSV;
}
function syncControls(syncInputs) {
  const s = SCENARIOS[state.scenario];
  $("state").value = state.stateCode;
  $("scenario").value = state.scenario;
  $("scenarioNote").textContent = s.note;
  const days = state.days ?? s.responseDays;
  $("days").value = days;
  $("daysOut").textContent = days + " days";
  $("crit").value = state.a.criticalWorkerPctOfPop;
  $("critOut").textContent = state.a.criticalWorkerPctOfPop.toFixed(1) + "%";
  $("crit").disabled = !s.tiers.critical;
  $("extendedUse").checked = !!state.a.extendedUse;
  if (syncInputs) for (const k of [...PRICE_FIELDS, ...FIELDS.map((f) => f[0])]) $(k).value = state.a[k];
  document.querySelectorAll("#stratTabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.s === state.strat));
}
function toast(msg) { $("toast").textContent = msg; setTimeout(() => ($("toast").textContent = ""), 2500); }

// ---------- Compute ----------
function plansFor(row) {
  const ov = state.days != null ? { responseDays: state.days } : {};
  return Object.fromEntries(Object.keys(STRATS).map((k) => [k, plan(row, state.scenario, state.a, k, ov)]));
}

// ---------- Render ----------
let cumChart, yearChart;
function render() {
  const row = byCode[state.stateCode];
  const P = plansFor(row);
  const cur = P[state.strat];
  const a = state.a;
  const usd = (x) => fmtUSD(x, a.usdINR);
  const best = Object.values(P).reduce((m, p) => (p.total < m.total ? p : m));
  const saving = P.disposable.total - P.mix.total;

  $("kpis").innerHTML = [
    kpi("Workers to protect", fmtNum(cur.allWorkers), `${row.name}, ${cur.days} days`),
    kpi("Disposable N95 stock", fmtNum(P.disposable.n95Units), `bought ${P.disposable.replacementsN95}× in ${a.horizonYears} yrs (${a.n95ShelfLifeYears}-yr shelf life)`),
    kpi("Or elastomerics", fmtNum(P.reusable.ehmrUnits), `+ ${fmtNum(P.reusable.filterPairs)} filter pairs`),
    kpi(`${a.horizonYears}-yr cost, ${STRATS[state.strat].label}`, fmtINR(cur.total), `${usd(cur.total)} · ${fmtINR(cur.costPerWorkerYear)} per worker-year`, true),
    kpi("Saving vs disposables", saving > 0 ? fmtINR(saving) : "none", saving > 0 ? `${Math.round((saving / P.disposable.total) * 100)}% less with 90% elastomeric` : "disposables are cheaper here"),
    kpi("Funding gap", fmtINR(cur.gap), a.committedBudgetINR > 0 ? `after ${fmtINR(a.committedBudgetINR)} committed` : "nothing committed yet", false, true),
    kpi("If bought in the crisis", fmtINR(cur.crisisCost), `N95s at ${a.surgePriceMultiplier}× price, if supply even exists`, false, true),
    kpi("Time to make it in a crisis", Math.round(cur.productionDays) + " days", `of all India's peak 2020 N95 output (${fmtNum(a.n95CapacityPerDay)}/day)`, false, cur.productionDays > 14),
  ].join("");

  // Cumulative cost chart
  const years = Array.from({ length: a.horizonYears }, (_, i) => `Year ${i + 1}`);
  const cum = (p) => { let t = 0; return p.yearly.map((r) => (t += r.n95 + r.ehmr + r.filters + r.training + r.storage)); };
  const ds = Object.entries(STRATS).map(([k, s]) => ({
    label: s.label, data: cum(P[k]), borderColor: cssVar(s.color), backgroundColor: cssVar(s.color),
    stepped: "before", borderWidth: k === state.strat ? 3 : 1.5, pointRadius: k === state.strat ? 4 : 2,
  }));
  cumChart = drawChart(cumChart, "cumChart", { type: "line", data: { labels: years, datasets: ds }, options: chartOpts(true) });

  // Spend by year, stacked by item
  const items = [["n95", "N95s", "--s-disposable"], ["ehmr", "Elastomerics", "--s-reusable"], ["filters", "Filters", "--s-mix"], ["training", "Fit testing", "--muted"], ["storage", "Storage", "--line"]];
  const yds = items.map(([k, l, c]) => ({ label: l, data: cur.yearly.map((r) => r[k]), backgroundColor: cssVar(c) }))
    .filter((d) => d.data.some((v) => v > 0));
  yearChart = drawChart(yearChart, "yearChart", { type: "bar", data: { labels: years, datasets: yds }, options: { ...chartOpts(true), scales: stackedScales() } });

  $("buyTable").innerHTML = `<thead><tr><th>Item</th><th>Quantity</th><th>${a.horizonYears}-yr cost</th></tr></thead><tbody>
    ${trow("Disposable N95s", cur.n95Units, cur.yearly.reduce((t, r) => t + r.n95, 0))}
    ${trow("Elastomeric facepieces", cur.ehmrUnits, cur.yearly.reduce((t, r) => t + r.ehmr, 0))}
    ${trow("Filter pairs", cur.filterPairs, cur.yearly.reduce((t, r) => t + r.filters, 0))}
    ${trow("Fit testing and training", cur.workersOnEhmr, cur.yearly.reduce((t, r) => t + r.training, 0))}
    ${trow("Storage and rotation", null, cur.yearly.reduce((t, r) => t + r.storage, 0))}
    <tr class="total"><td>Total</td><td></td><td>${fmtINR(cur.total)}</td></tr></tbody>`;

  $("workTable").innerHTML = `<thead><tr><th>Group</th><th>People</th><th>N95s per day</th><th>Disposable stock</th></tr></thead><tbody>
    ${cur.groups.map((g) => `<tr><td>${g.label}</td><td>${fmtNum(g.n)}</td><td>${g.n ? g.perDay : "–"}</td><td>${fmtNum(g.n * g.perDay * cur.days * (1 + a.spareFactor))}</td></tr>`).join("")}
    <tr class="total"><td>Total</td><td>${fmtNum(cur.allWorkers)}</td><td></td><td>${fmtNum(P.disposable.n95Units)}</td></tr></tbody>`;

  renderStateTable();
  renderMethod(row, cur, best);
}
const kpi = (k, v, s, hero, warn) => `<div class="kpi${hero ? " hero" : ""}${warn ? " warn" : ""}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
const trow = (l, q, c) => `<tr><td>${l}</td><td>${q == null ? "" : fmtNum(q)}</td><td>${fmtINR(c)}</td></tr>`;

function chartOpts(legend) {
  const ink = cssVar("--muted"), line = cssVar("--line");
  return {
    responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: legend, labels: { color: ink, boxWidth: 12 } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmtINR(c.parsed.y)}` } },
    },
    scales: {
      x: { ticks: { color: ink }, grid: { color: line } },
      y: { ticks: { color: ink, callback: (v) => fmtINR(v) }, grid: { color: line }, beginAtZero: true },
    },
  };
}
function stackedScales() {
  const s = chartOpts(true).scales;
  s.x.stacked = true; s.y.stacked = true; return s;
}
function drawChart(existing, id, cfg) {
  if (typeof Chart === "undefined") return null;
  if (existing) existing.destroy();
  return new Chart($(id), cfg);
}

function stateRows() {
  return STATES.map((s) => {
    const p = plansFor(s);
    return { code: s.code, name: s.name, pop: s.population, workers: p.mix.allWorkers, n95: p.disposable.n95Units, total: p.mix.total, disp: p.disposable.total, perCap: p.mix.total / s.population, est: s.est };
  });
}
function renderStateTable() {
  const rows = stateRows();
  const { key, dir } = state.sort;
  rows.sort((a, b) => (typeof a[key] === "string" ? a[key].localeCompare(b[key]) : a[key] - b[key]) * dir);
  const cols = [["name", "State"], ["pop", "Population"], ["workers", "Workers"], ["n95", "N95 stock if disposable"], ["disp", "Cost, disposable"], ["total", "Cost, 90% elastomeric"], ["perCap", "₹ per resident"]];
  $("stateTable").innerHTML = `<thead><tr>${cols.map(([k, l]) => `<th data-k="${k}">${l}${k === key ? (dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead><tbody>
    ${rows.map((r) => `<tr data-c="${r.code}" class="${r.code === state.stateCode ? "sel" : ""}"><td>${r.name}${r.est ? " *" : ""}</td><td>${fmtNum(r.pop)}</td><td>${fmtNum(r.workers)}</td><td>${fmtNum(r.n95)}</td><td>${fmtINR(r.disp)}</td><td>${fmtINR(r.total)}</td><td>₹${r.perCap.toFixed(1)}</td></tr>`).join("")}
  </tbody>`;
  $("stateTable").querySelectorAll("th").forEach((th) => (th.onclick = () => {
    const k = th.dataset.k; state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : -1 }; renderStateTable();
  }));
  $("stateTable").querySelectorAll("tbody tr").forEach((tr) => (tr.onclick = () => {
    state.stateCode = tr.dataset.c; update(); window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}

function renderMethod(row, cur, best) {
  const a = state.a, s = cur.scenario;
  $("methodBody").innerHTML = `
  <p>For <b>${row.name}</b> under <b>${s.label}</b>, the planner counts the people who must keep working face to face, multiplies by how many respirators each uses per day and by the length of the response, then prices holding that stock for ${a.horizonYears} years.</p>
  <h3>1. Who needs protection</h3>
  <p>Hospital health workers = (${a.activeShareDoctors} × registered doctors + ${a.activeShareNurses} × registered nurses) × (1 + ${a.supportStaffPerClinician} support staff each) × ${Math.round(s.hcwShare * 100)}% exposed in this scenario. ASHAs (all in post) and active ANMs are counted separately because they do home visits and contact tracing. ${s.tiers.critical ? `Other indoor critical workers = ${a.criticalWorkerPctOfPop}% of the population.` : "This scenario does not include other critical workers."}</p>
  <h3>2. Disposable strategy</h3>
  <p>${a.extendedUse ? "Health workers are assumed to wear one N95 per shift (extended use), which cuts demand several-fold but depends on guidance and fit holding up." : `Health workers use ${s.n95PerHcwDay} N95s per day (single use as they move between patients). Tick extended use to see one per shift.`}</p>
  <p>N95 stock = workers × N95s per day × ${cur.days} days × (1 + ${a.spareFactor} spare). Stock is re-bought every ${a.n95ShelfLifeYears} years as it expires (try 3 years for hot, humid storage, where filters lose charge faster): ${cur.replacementsN95} purchase(s) over ${a.horizonYears} years.</p>
  <h3>3. Elastomeric strategy</h3>
  <p>One facepiece per worker (plus spares), lasting ${a.ehmrLifeYears} years, with a new filter pair every ${a.filterDaysOfUse} days of use, and a one-time fit test and training cost. The "90% elastomeric" mix follows Blueprint Biosecurity's recommendation of about 90% elastomerics and 10% other options, which here are disposables.</p>
  <h3>4. Funding gap and crisis buying</h3>
  <p>Funding gap = ${a.horizonYears}-year cost minus budget already committed. The crisis line prices the same N95 need bought after the outbreak starts at ${a.surgePriceMultiplier}× normal price. In India the government's N95 price rose from ₹12.25 to ₹63 between September 2019 and May 2020, about 5×; 15× was seen elsewhere. In practice supply may not exist at any price when exporting countries restrict sales.</p>
  <p>Cheapest strategy with these inputs: <b>${STRATS[best.strategy].label}</b>.</p>
  <h3>Data</h3>
  <p>${DATA_NOTES}</p>
  <p>Full assumptions, ranges and sources are in <a href="docs/assumptions.md">docs/assumptions.md</a> and the model is in <a href="js/model.js">js/model.js</a>. Rows marked * use estimated workforce figures.</p>`;
}

function downloadCSV() {
  const rows = stateRows();
  const head = "state,population,workers,n95_stock_disposable,cost_disposable_inr,cost_90pct_elastomeric_inr,inr_per_resident,estimated";
  const body = rows.map((r) => [r.name, Math.round(r.pop), Math.round(r.workers), Math.round(r.n95), Math.round(r.disp), Math.round(r.total), r.perCap.toFixed(2), r.est ? "yes" : "no"].join(","));
  const blob = new Blob([head + "\n" + body.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const el = Object.assign(document.createElement("a"), { href: url, download: `india-stockpile-${state.scenario}.csv` });
  el.click(); URL.revokeObjectURL(url);
}

function update(syncInputs = true) {
  syncControls(syncInputs);
  render();
  writeHash();
}

readHash();
buildControls();
update();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => render());
