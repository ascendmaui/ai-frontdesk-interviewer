import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractAreaCode,
  INDUSTRY_TO_ROLE,
  matchCloserForLead,
  type TerritoryAssignment,
} from "../src/lib/territories";

function closer(
  partial: Partial<TerritoryAssignment> &
    Pick<TerritoryAssignment, "closerId" | "areaCodes">,
): TerritoryAssignment {
  return {
    closerName: partial.closerName || "Test Closer",
    email: partial.email || "t@example.com",
    phone: partial.phone || "8645550100",
    roleSlug: partial.roleSlug || "hvac-closer",
    states: partial.states || [],
    active: partial.active !== false,
    createdAt: partial.createdAt || new Date().toISOString(),
    closerId: partial.closerId,
    areaCodes: partial.areaCodes,
  };
}

describe("extractAreaCode (shipped territories)", () => {
  it("parses 10-digit US numbers", () => {
    assert.equal(extractAreaCode("8645551212"), "864");
    assert.equal(extractAreaCode("(864) 555-1212"), "864");
  });

  it("parses +1 country code", () => {
    assert.equal(extractAreaCode("+1 704-555-0199"), "704");
    assert.equal(extractAreaCode("17045550199"), "704");
  });

  it("returns empty for incomplete phones", () => {
    assert.equal(extractAreaCode("555"), "");
    assert.equal(extractAreaCode(""), "");
  });
});

describe("INDUSTRY_TO_ROLE (shipped map)", () => {
  it("maps core industries to closer seats", () => {
    assert.equal(INDUSTRY_TO_ROLE.hvac, "hvac-closer");
    assert.equal(INDUSTRY_TO_ROLE.medspa, "medspa-closer");
    assert.equal(INDUSTRY_TO_ROLE.plumbing, "plumbing-closer");
  });

  it("maps roofing/landscaping under home-services", () => {
    assert.equal(INDUSTRY_TO_ROLE.roofing, "home-services-closer");
    assert.equal(INDUSTRY_TO_ROLE.landscaping, "home-services-closer");
  });
});

describe("matchCloserForLead (shipped matcher)", () => {
  const pool = [
    closer({
      closerId: "c1",
      closerName: "Ann",
      roleSlug: "hvac-closer",
      areaCodes: ["864", "803"],
      states: ["SC"],
    }),
    closer({
      closerId: "c2",
      closerName: "Bob",
      roleSlug: "hvac-closer",
      areaCodes: ["704"],
      states: ["NC"],
    }),
    closer({
      closerId: "c3",
      closerName: "Inactive",
      roleSlug: "hvac-closer",
      areaCodes: ["864"],
      active: false,
    }),
  ];

  it("matches by area code and role", () => {
    const m = matchCloserForLead(
      { areaCode: "864", roleSlug: "hvac-closer" },
      pool,
    );
    assert.ok(m);
    assert.equal(m!.closerId, "c1");
  });

  it("ignores inactive closers", () => {
    const m = matchCloserForLead({ areaCode: "864", roleSlug: "hvac-closer" }, [
      pool[2],
    ]);
    assert.equal(m, null);
  });

  it("falls back to state when NPA not covered", () => {
    const m = matchCloserForLead(
      { areaCode: "999", state: "NC", roleSlug: "hvac-closer" },
      pool,
    );
    assert.ok(m);
    assert.equal(m!.closerId, "c2");
  });

  it("returns null when no match", () => {
    const m = matchCloserForLead(
      { areaCode: "212", state: "NY", roleSlug: "hvac-closer" },
      pool,
    );
    assert.equal(m, null);
  });

  it("allows multi-vertical closer for any role", () => {
    const multi = closer({
      closerId: "mv",
      roleSlug: "multi-vertical-closer",
      areaCodes: ["305"],
    });
    const m = matchCloserForLead(
      { areaCode: "305", roleSlug: "medspa-closer" },
      [multi],
    );
    assert.ok(m);
    assert.equal(m!.closerId, "mv");
  });
});
