import test from "node:test";
import assert from "node:assert/strict";
import { buildSetupTasks, setupProgress } from "../src/lib/setup-tasks";

test("closer setup includes required legal/compliance/payout/tax gates", () => {
  const tasks = buildSetupTasks();
  const required = new Set(tasks.filter((t) => t.required).map((t) => t.id));
  for (const id of [
    "commission-agreement",
    "confidentiality-data-use",
    "sales-compliance",
    "payout-profile",
    "tax-form",
    "handbook",
    "hearthline-os",
    "crm",
    "dialer",
  ]) {
    assert.equal(required.has(id), true, `${id} should be required`);
  }
  // Slack is optional unless ONBOARDING_SLACK_INVITE_URL is set
  const slack = tasks.find((t) => t.id === "slack");
  assert.ok(slack);
  if (!process.env.ONBOARDING_SLACK_INVITE_URL) {
    assert.equal(slack.required, false);
  }
});

test("tax workflow explicitly forbids plaintext sensitive identifiers", () => {
  const tax = buildSetupTasks().find((t) => t.id === "tax-form");
  assert.ok(tax);
  assert.match(tax.description, /Do not enter or store SSNs, tax IDs/i);
});

test("setup is not ready until all required tasks are complete", () => {
  const tasks = buildSetupTasks();
  assert.equal(setupProgress(tasks).requiredDone, false);
  const done = tasks.map((t) =>
    t.required ? { ...t, completedAt: new Date().toISOString() } : t,
  );
  assert.equal(setupProgress(done).requiredDone, true);
});
