/*
 * idle-engine-model.js
 * Source: "Automation Idler: Engine & Dev Plan" (Claude Docs doc) + the
 * "Idle Hands Pitch" deck slides currencies/upgrades/loop/tech.
 * NOTE: neither source contains code. This file turns the documented data
 * model and loop rules into a minimal, framework-free starting point so the
 * next idle prototype does not re-derive them. Rename entities freely.
 *
 * Core rule from the doc: "Engine first, town second." The engine records
 * Runs; the game layer only reads that record and draws it. Keep
 * applyRun() pure so web, phone, Steam and XR clients share it.
 *
 * Usage:
 *   const town = createTown();
 *   const b = addBuilding(town, { id:'lanterns', automationId:'reminders', minutesSaved: 5 });
 *   applyRun(town, { buildingId:'lanterns', outcome:'success', minutesSaved:5, aiCostUsd:0 });
 *   formatHours(town.hours) // "0.1 h"
 */

/** @typedef {'Camp'|'Hamlet'|'Village'|'Town'|'City'} TownTier */
/** @typedef {'idle'|'working'|'celebrating'|'broken'} VisualState */
/** @typedef {'success'|'failed'|'needs_attention'} RunOutcome */

export const TIERS = /** @type {TownTier[]} */ (['Camp', 'Hamlet', 'Village', 'Town', 'City']);

/** Placeholder thresholds; the doc says tier rises with active automations
 *  AND connected integrations. Tune with an economy sim. */
export const TIER_RULES = [
  { tier: 'Camp',    automations: 0,  integrations: 0 },
  { tier: 'Hamlet',  automations: 2,  integrations: 1 },
  { tier: 'Village', automations: 5,  integrations: 3 },
  { tier: 'Town',    automations: 10, integrations: 6 },
  { tier: 'City',    automations: 20, integrations: 10 },
];

export function createTown() {
  return {
    tier: /** @type {TownTier} */ ('Camp'),
    hours: 0,           // primary currency: real minutes saved / 60
    joy: 0,             // secondary currency from people/home buildings
    energy: { budgetUsd: 0, spentUsd: 0 }, // AI budget shown in-fiction ("lamp oil")
    integrations: /** @type {string[]} */ ([]),
    buildings: /** @type {Record<string, any>} */ ({}),
    runs: /** @type {any[]} */ ([]),   // append-only log; the source of truth
  };
}

export function addBuilding(town, { id, automationId, type = 'generic', joy = false, minutesSaved = 0 }) {
  town.buildings[id] = { id, automationId, type, joy, minutesSaved,
    level: 1, streak: 0, state: /** @type {VisualState} */ ('idle'), status: 'active' };
  return town.buildings[id];
}

/** Apply one engine Run to the town. Success pays Hours (and Joy for joy
 *  buildings), extends the streak and plays 'working'; failure sets 'broken'
 *  so the problem is visible in the world. AI cost is metered every run. */
export function applyRun(town, run) {
  const b = town.buildings[run.buildingId];
  if (!b) throw new Error(`unknown building ${run.buildingId}`);
  town.runs.push({ ...run, at: run.at ?? Date.now() });
  town.energy.spentUsd += run.aiCostUsd ?? 0;
  if (run.outcome === 'success') {
    const hrs = (run.minutesSaved ?? b.minutesSaved) / 60;
    town.hours += hrs;
    if (b.joy) town.joy += 1;
    b.streak += 1;
    b.state = 'working';
  } else {
    b.streak = 0;
    b.state = 'broken';
  }
  town.tier = computeTier(town);
  return b;
}

export function computeTier(town) {
  const active = Object.values(town.buildings).filter(b => b.status === 'active').length;
  let tier = TIERS[0];
  for (const r of TIER_RULES) if (active >= r.automations && town.integrations.length >= r.integrations) tier = r.tier;
  return tier;
}

/** Upgrade: spend Hours to raise a building level (1..5). Cost curve is a
 *  placeholder geometric curve; replace with the economy designer's table. */
export function upgradeCost(level, base = 2, growth = 1.8) { return base * Math.pow(growth, level - 1); }
export function tryUpgrade(town, buildingId) {
  const b = town.buildings[buildingId];
  if (!b || b.level >= 5) return false;
  const cost = upgradeCost(b.level);
  if (town.hours < cost) return false;
  town.hours -= cost; b.level += 1; b.state = 'celebrating';
  return true;
}

/** Remaining AI budget as a 0..1 "oil" gauge. */
export function energyLeft(town) {
  const { budgetUsd, spentUsd } = town.energy;
  return budgetUsd <= 0 ? 0 : Math.max(0, 1 - spentUsd / budgetUsd);
}

export function formatHours(h) {
  if (h < 10) return `${h.toFixed(1)} h`;
  if (h < 1000) return `${Math.round(h)} h`;
  return `${(h / 1000).toFixed(1)}k h`;
}

/** Cost-per-user straight from the run log (doc: "gives you cost per user
 *  straight from the data"). */
export function monthlyAiCost(town, sinceMs = Date.now() - 30 * 864e5) {
  return town.runs.filter(r => r.at >= sinceMs).reduce((s, r) => s + (r.aiCostUsd ?? 0), 0);
}
