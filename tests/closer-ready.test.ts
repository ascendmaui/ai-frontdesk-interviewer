import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Structural + import tests: production_ready paths must call
 * runProductionReadyEffects (OS + territory), not OS-only provision.
 */
describe("production_ready territory activation (shipped source)", () => {
  const root = join(process.cwd(), "src");

  it("closer-ready module activates territory after provision", () => {
    const src = readFileSync(join(root, "lib/closer-ready.ts"), "utf8");
    assert.match(src, /activateCloserTerritory/);
    assert.match(src, /provisionToHearthlineOs/);
    assert.match(src, /export async function runProductionReadyEffects/);
  });

  it("train quiz path uses runProductionReadyEffects", () => {
    const src = readFileSync(join(root, "app/api/train/[id]/route.ts"), "utf8");
    assert.match(src, /runProductionReadyEffects/);
    assert.match(src, /auto_training_complete/);
    // Must not call provision-only without territory helper
    assert.doesNotMatch(
      src,
      /provisionToHearthlineOs\(latest,\s*\{\s*trigger:\s*"auto_training_complete"/,
    );
  });

  it("admin production_ready uses runProductionReadyEffects", () => {
    const src = readFileSync(
      join(root, "app/api/admin/action/route.ts"),
      "utf8",
    );
    assert.match(src, /runProductionReadyEffects/);
    assert.match(src, /manual_mark_production_ready/);
  });

  it("complete route uses runProductionReadyEffects", () => {
    const src = readFileSync(join(root, "app/api/complete/route.ts"), "utf8");
    assert.match(src, /runProductionReadyEffects/);
  });
});

describe("portal/train require token (shipped source)", () => {
  it("portal GET/PATCH use portalAuthError", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/api/portal/[id]/route.ts"),
      "utf8",
    );
    assert.match(src, /portalAuthError/);
    // Old pattern only checked when token present AND mismatch
    assert.doesNotMatch(
      src,
      /if \(t && root\.portalToken && t !== root\.portalToken\)/,
    );
    assert.doesNotMatch(
      src,
      /if \(body\.token && root\.portalToken !== body\.token\)/,
    );
  });

  it("train GET/POST use portalAuthError", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/api/train/[id]/route.ts"),
      "utf8",
    );
    assert.match(src, /portalAuthError/);
    assert.doesNotMatch(src, /if \(t && root\.portalToken !== t\)/);
    assert.doesNotMatch(
      src,
      /if \(body\.token && root\.portalToken !== body\.token\)/,
    );
  });
});
