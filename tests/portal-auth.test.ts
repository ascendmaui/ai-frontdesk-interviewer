import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  portalAuthError,
  portalTokenAuthorized,
} from "../src/lib/portal-auth";

describe("portalTokenAuthorized (shipped)", () => {
  it("rejects missing token when portalToken is set", () => {
    assert.equal(portalTokenAuthorized("", "secret-token"), false);
    assert.equal(portalTokenAuthorized(null, "secret-token"), false);
    assert.equal(portalTokenAuthorized(undefined, "secret-token"), false);
  });

  it("rejects wrong token", () => {
    assert.equal(portalTokenAuthorized("nope", "secret-token"), false);
  });

  it("accepts exact match", () => {
    assert.equal(portalTokenAuthorized("secret-token", "secret-token"), true);
  });

  it("allows access when record has no portal token", () => {
    assert.equal(portalTokenAuthorized("", ""), true);
    assert.equal(portalTokenAuthorized(undefined, null), true);
  });
});

describe("portalAuthError (shipped)", () => {
  it("returns 401 shape when unauthorized", () => {
    const err = portalAuthError("", "tok");
    assert.ok(err);
    assert.equal(err!.status, 401);
    assert.equal(err!.error, "Unauthorized");
  });

  it("returns null when authorized", () => {
    assert.equal(portalAuthError("tok", "tok"), null);
  });
});
