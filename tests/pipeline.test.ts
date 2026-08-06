import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hmOutcome,
  onboardingOutcome,
  screeningOutcome,
} from "../src/lib/pipeline";
import type { Scorecard } from "../src/lib/types";

function sc(
  recommendation: Scorecard["recommendation"],
  overallScore = 8,
): Scorecard {
  return {
    overallScore,
    recommendation,
    summary: "test",
    strengths: ["a"],
    developmentAreas: ["b"],
    scores: {},
  };
}

describe("screeningOutcome (shipped pipeline)", () => {
  it("advances strong/yes to hm_invited", () => {
    const out = screeningOutcome(sc("strong_yes"));
    assert.equal(out.pipelineStatus, "hm_invited");
    assert.equal(out.advanceToHm, true);
  });

  it("waitlists maybe", () => {
    const out = screeningOutcome(sc("maybe", 5));
    assert.equal(out.pipelineStatus, "waitlisted");
    assert.equal(out.advanceToHm, false);
  });

  it("rejects no", () => {
    const out = screeningOutcome(sc("no", 2));
    assert.equal(out.pipelineStatus, "rejected");
    assert.equal(out.advanceToHm, false);
  });

  it("demotes yes when multitask is very weak", () => {
    const out = screeningOutcome(sc("yes", 8), {
      answers: [],
      asked: 4,
      scoredCount: 4,
      correctCount: 0,
      skippedCount: 0,
      accuracy: 0,
      multitaskScore: 2,
      avgResponseMs: 1000,
    });
    assert.equal(out.advanceToHm, false);
    assert.equal(out.pipelineStatus, "waitlisted");
  });
});

describe("hmOutcome (shipped pipeline)", () => {
  it("creates offer on yes", () => {
    const out = hmOutcome(sc("yes", 8));
    assert.equal(out.createOffer, true);
    assert.equal(out.pipelineStatus, "offer_pending");
  });

  it("hm_maybe on maybe", () => {
    const out = hmOutcome(sc("maybe", 5));
    assert.equal(out.createOffer, false);
    assert.equal(out.pipelineStatus, "hm_maybe");
  });

  it("hm_rejected on no", () => {
    const out = hmOutcome(sc("no", 2));
    assert.equal(out.createOffer, false);
    assert.equal(out.pipelineStatus, "hm_rejected");
  });
});

describe("onboardingOutcome (shipped pipeline)", () => {
  it("moves to setup after solid onboarding", () => {
    assert.equal(onboardingOutcome(sc("yes", 8)), "setup_in_progress");
  });

  it("flags incomplete when score very low", () => {
    assert.equal(
      onboardingOutcome(sc("maybe", 2)),
      "onboarding_incomplete",
    );
  });
});
