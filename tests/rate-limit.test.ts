import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rateLimit } from "../src/lib/rate-limit";

describe("rateLimit (shipped)", () => {
  it("allows under the limit then blocks", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
    assert.equal(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok, true);
    const blocked = rateLimit(key, { limit: 2, windowMs: 60_000 });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.ok(blocked.retryAfterSec >= 1);
    }
  });
});
