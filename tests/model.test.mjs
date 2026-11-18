// Run with: node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { plan, DEFAULTS, purchaseCycles, nationalTotal } from "../js/model.js";

const kerala = { code: "KL", name: "Kerala", population: 35_000_000, doctors: 60_000, nurses: 250_000, anms: 10_000, ashas: 26_000 };

test("purchase cycles follow shelf life", () => {
  assert.equal(purchaseCycles(5, 3), 2);
  assert.equal(purchaseCycles(5, 5), 1);
  assert.equal(purchaseCycles(5, 7), 1);
  assert.equal(purchaseCycles(5, 1), 5);
});

test("disposable N95 stock = workers x per-day x days x spares", () => {
  const a = { ...DEFAULTS };
  const p = plan(kerala, "nipah", a, "disposable");
  const hcw = (60_000 * a.activeShareDoctors + 250_000 * a.activeShareNurses) * (1 + a.supportStaffPerClinician) * 0.35;
  const comm = (10_000 * a.activeShareNurses + 26_000) * 0.35;
  const expected = (hcw * 4 + comm * 1) * 60 * (1 + a.spareFactor);
  assert.ok(Math.abs(p.n95Units - expected) < 1);
  assert.equal(p.ehmrUnits, 0);
});

test("all-elastomeric buys one facepiece per worker and no N95s", () => {
  const p = plan(kerala, "h5n1", DEFAULTS, "reusable");
  assert.equal(p.n95Units, 0);
  assert.ok(Math.abs(p.ehmrUnits - p.allWorkers * (1 + DEFAULTS.spareFactor)) < 1);
});

test("elastomerics beat disposables over 5 years for long responses", () => {
  const d = plan(kerala, "diseasex", DEFAULTS, "disposable");
  const r = plan(kerala, "diseasex", DEFAULTS, "reusable");
  assert.ok(r.total < d.total);
});

test("committed budget reduces the gap, existing stock cuts the first N95 buy", () => {
  const a = { ...DEFAULTS, committedBudgetINR: 1e9 };
  const p = plan(kerala, "nipah", a, "disposable");
  assert.equal(p.gap, Math.max(0, p.total - 1e9));
  const b = { ...DEFAULTS, existingN95Stock: 1e6 };
  const q = plan(kerala, "nipah", b, "disposable");
  const base = plan(kerala, "nipah", DEFAULTS, "disposable");
  assert.ok(Math.abs(base.yearly[0].n95 - q.yearly[0].n95 - 1e6 * DEFAULTS.n95PriceINR) < 1);
});

test("national total sums states", () => {
  const t = nationalTotal([kerala, { ...kerala, code: "X" }]);
  assert.equal(t.population, 70_000_000);
});
