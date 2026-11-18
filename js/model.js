// India Stockpile Planner: core model.
// Pure functions, no DOM. Every number the UI shows comes from here.
// All money in INR unless noted. Time horizon in years, durations in days.

export const SCENARIOS = {
  nipah: {
    label: "Nipah-like cluster (localised, high fatality)",
    note: "Spillover clusters like Kerala 2018, 2019, 2021 and 2023. Transmission is mostly in hospitals and households, so protection goes to health workers and contact-tracing teams in the affected state. Response lasts weeks, not months.",
    responseDays: 60,
    tiers: { hcw: true, community: true, critical: false },
    hcwShare: 0.35, // share of the state's health workforce actively exposed
    criticalShare: 0,
    n95PerHcwDay: 4, // high-risk isolation wards, frequent doffing
    n95PerCriticalDay: 1,
  },
  h5n1: {
    label: "H5N1-like pandemic influenza (national, severe)",
    note: "Sustained human-to-human spread across India. All health workers and a broad set of critical workers need protection for the first wave, before vaccines arrive.",
    responseDays: 150,
    tiers: { hcw: true, community: true, critical: true },
    hcwShare: 1,
    criticalShare: 1,
    n95PerHcwDay: 2,
    n95PerCriticalDay: 1,
  },
  diseasex: {
    label: "Novel respiratory virus, worst case (Blueprint scenario)",
    note: "Blueprint Biosecurity's planning case: as infectious as measles, as deadly as 1918 influenza. Every indoor critical worker needs a respirator for about 150 days until production can scale up.",
    responseDays: 150,
    tiers: { hcw: true, community: true, critical: true },
    hcwShare: 1,
    criticalShare: 1,
    n95PerHcwDay: 3,
    n95PerCriticalDay: 1.5,
  },
};

// Default assumptions. Each has a source key that the assumptions table explains.
export const DEFAULTS = {
  horizonYears: 5,
  // Workforce definitions
  activeShareDoctors: 0.8, // NMC/MoHFW assume 80% of registered doctors are active
  activeShareNurses: 0.6, // registers keep retired and emigrated nurses; discount 30-50%
  supportStaffPerClinician: 0.6, // ward staff, sanitation, lab, drivers per doctor+nurse
  criticalWorkerPctOfPop: 3.0, // % of population who are indoor critical workers (see notes)
  spareFactor: 0.10, // extra masks for sizing, loss and damage
  // Disposable N95
  n95PriceINR: 25, // bulk tender price per BIS IS 9473 FFP2 / NIOSH N95
  n95ShelfLifeYears: 5, // MoHFW, NASEM, Blueprint; try 3 for hot, humid storage
  // Elastomeric half-mask (EHMR)
  ehmrPriceINR: 1500, // per facepiece, bulk procurement at current prices
  ehmrLifeYears: 10, // Blueprint, FAS: 10+ years
  filterPairPriceINR: 400, // NASEM ~$5 per filter set
  filterDaysOfUse: 30, // days of use per filter pair in a response
  filterShelfLifeYears: 5,
  fitTestTrainingINR: 200, // per worker, one-time, for EHMR
  // Storage and logistics
  storageINRPerUnitYear: 1, // per N95 per year; NASEM US ~$0.034, India assumed lower
  ehmrStorageMultiple: 15, // NASEM: ~$0.47 vs $0.034 per unit-year
  // Crisis buying
  surgePriceMultiplier: 5, // India govt N95 price ₹12.25 (Sep 2019) to ₹63 (May 2020)
  n95CapacityPerDay: 3200000, // India's peak N95 output, Oct 2020 (~200 makers)
  // Mix
  ehmrShareHcw: 0.9, // Blueprint: ~90% EHMR, 10% PAPR or disposables
  ehmrShareCritical: 0.9,
  // What exists already
  extendedUse: 0, // 1 = health workers wear one N95 per shift (extended use)
  existingN95Stock: 0,
  committedBudgetINR: 0,
  usdINR: 84,
};

/** Head-counts by tier for one state (or the national total). */
export function workforce(state, scenario, a) {
  const clinicians = state.doctors * a.activeShareDoctors + state.nurses * a.activeShareNurses;
  const hcwCore = clinicians * (1 + a.supportStaffPerClinician);
  const community = state.anms * a.activeShareNurses + state.ashas;
  const critical = (state.population * a.criticalWorkerPctOfPop) / 100;
  const s = SCENARIOS[scenario];
  return {
    hcw: s.tiers.hcw ? hcwCore * s.hcwShare : 0,
    community: s.tiers.community ? community * s.hcwShare : 0,
    critical: s.tiers.critical ? critical * s.criticalShare : 0,
  };
}

/** Number of 'replacement purchases' needed over a horizon given shelf life (initial buy counts as 1). */
export function purchaseCycles(horizonYears, lifeYears) {
  if (lifeYears <= 0) return Infinity;
  return Math.ceil(horizonYears / lifeYears - 1e-9);
}

/**
 * Plan one strategy. strategy: 'disposable' | 'reusable' | 'mix'.
 * Returns stock sizes, a per-year spend schedule and totals.
 */
export function plan(state, scenarioKey, a, strategy, overrides = {}) {
  const s = { ...SCENARIOS[scenarioKey], ...overrides };
  if (a.extendedUse) s.n95PerHcwDay = 1;
  const w = workforce(state, scenarioKey, a);
  const days = s.responseDays;
  const H = a.horizonYears;

  const groups = [
    { key: "hcw", label: "Hospital health workers", n: w.hcw, perDay: s.n95PerHcwDay, ehmrShare: a.ehmrShareHcw },
    { key: "community", label: "ASHAs and ANMs", n: w.community, perDay: Math.max(1, s.n95PerCriticalDay), ehmrShare: a.ehmrShareHcw },
    { key: "critical", label: "Other critical workers", n: w.critical, perDay: s.n95PerCriticalDay, ehmrShare: a.ehmrShareCritical },
  ];

  const yearly = Array.from({ length: H }, () => ({ n95: 0, ehmr: 0, filters: 0, training: 0, storage: 0 }));
  let n95Units = 0, ehmrUnits = 0, filterPairs = 0, workersOnEhmr = 0, workersOnN95 = 0;

  for (const g of groups) {
    if (g.n <= 0) continue;
    const share = strategy === "disposable" ? 0 : strategy === "reusable" ? 1 : g.ehmrShare;
    const nE = g.n * share;
    const nD = g.n - nE;
    workersOnEhmr += nE;
    workersOnN95 += nD;
    n95Units += nD * g.perDay * days * (1 + a.spareFactor);
    ehmrUnits += nE * (1 + a.spareFactor);
    filterPairs += nE * Math.ceil(days / a.filterDaysOfUse);
  }

  // Existing stock offsets the first N95 purchase only.
  const firstN95Buy = Math.max(0, n95Units - a.existingN95Stock);

  // Spend by year: buy in year 1, re-buy whenever shelf life expires.
  for (let y = 0; y < H; y++) {
    if (y % Math.max(1, Math.round(a.n95ShelfLifeYears)) === 0) {
      yearly[y].n95 += (y === 0 ? firstN95Buy : n95Units) * a.n95PriceINR;
    }
    if (y % Math.max(1, Math.round(a.ehmrLifeYears)) === 0) {
      yearly[y].ehmr += ehmrUnits * a.ehmrPriceINR;
    }
    if (y % Math.max(1, Math.round(a.filterShelfLifeYears)) === 0) {
      yearly[y].filters += filterPairs * a.filterPairPriceINR;
    }
    if (y === 0) yearly[y].training += workersOnEhmr * a.fitTestTrainingINR;
    yearly[y].storage += (n95Units + ehmrUnits * a.ehmrStorageMultiple) * a.storageINRPerUnitYear;
  }

  const sum = (k) => yearly.reduce((t, r) => t + r[k], 0);
  const total = ["n95", "ehmr", "filters", "training", "storage"].reduce((t, k) => t + sum(k), 0);
  const gap = Math.max(0, total - a.committedBudgetINR);

  // Cost if nothing is stockpiled and India buys N95s for the same need at crisis prices.
  const allWorkers = workersOnEhmr + workersOnN95;
  const crisisUnits = groups.reduce((t, g) => t + g.n * g.perDay * days, 0);
  const crisisCost = crisisUnits * a.n95PriceINR * a.surgePriceMultiplier;

  return {
    strategy, scenario: s, workforce: w, groups, days,
    n95Units, ehmrUnits, filterPairs, workersOnEhmr, workersOnN95, allWorkers,
    yearly, total, gap, crisisCost, crisisUnits,
    // Days of India's whole peak (Oct 2020) N95 output needed to make this stock from scratch.
    productionDays: a.n95CapacityPerDay > 0 ? crisisUnits / a.n95CapacityPerDay : Infinity,
    costPerWorkerYear: allWorkers > 0 ? total / allWorkers / H : 0,
    replacementsN95: purchaseCycles(H, a.n95ShelfLifeYears),
    replacementsEhmr: purchaseCycles(H, a.ehmrLifeYears),
  };
}

/** Sum state rows into a national row. */
export function nationalTotal(states) {
  const keys = ["population", "doctors", "nurses", "anms", "ashas"];
  const t = { code: "IN", name: "All India" };
  for (const k of keys) t[k] = states.reduce((s, r) => s + (r[k] || 0), 0);
  return t;
}

// Formatting helpers
export function fmtNum(x) {
  if (!isFinite(x)) return "–";
  const abs = Math.abs(x);
  if (abs >= 1e7) return (x / 1e7).toFixed(abs >= 1e9 ? 0 : 1) + " crore";
  if (abs >= 1e5) return (x / 1e5).toFixed(1) + " lakh";
  return Math.round(x).toLocaleString("en-IN");
}
export function fmtINR(x) {
  if (!isFinite(x)) return "–";
  return "₹" + fmtNum(x);
}
export function fmtUSD(x, rate) {
  const u = x / rate;
  if (u >= 1e9) return "$" + (u / 1e9).toFixed(2) + "B";
  if (u >= 1e6) return "$" + (u / 1e6).toFixed(1) + "M";
  if (u >= 1e3) return "$" + (u / 1e3).toFixed(0) + "k";
  return "$" + Math.round(u);
}
