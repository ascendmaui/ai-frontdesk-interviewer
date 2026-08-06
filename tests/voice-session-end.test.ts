import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeSessionEnd } from "../src/lib/voice-session";

describe("looksLikeSessionEnd (shipped voice-session)", () => {
  it("detects screening close phrase", () => {
    assert.equal(
      looksLikeSessionEnd(
        "Thanks for your time. The interview is complete.",
      ),
      true,
    );
  });

  it("detects hiring manager close", () => {
    assert.equal(
      looksLikeSessionEnd(
        "The hiring manager interview is complete. We'll be in touch.",
      ),
      true,
    );
  });

  it("detects onboarding close", () => {
    assert.equal(
      looksLikeSessionEnd("Onboarding guidance is complete."),
      true,
    );
  });

  it("detects practice pitch close", () => {
    assert.equal(looksLikeSessionEnd("Practice pitch complete."), true);
  });

  it("detects wrap-up variants", () => {
    assert.equal(looksLikeSessionEnd("That wraps up our conversation today."), true);
    assert.equal(looksLikeSessionEnd("Thank you for your time today."), true);
  });

  it("does not false-positive mid-interview chatter", () => {
    assert.equal(
      looksLikeSessionEnd("Tell me about a complete sale you closed last quarter."),
      false,
    );
    assert.equal(
      looksLikeSessionEnd("How do you handle objections about price?"),
      false,
    );
    assert.equal(looksLikeSessionEnd(""), false);
  });
});
