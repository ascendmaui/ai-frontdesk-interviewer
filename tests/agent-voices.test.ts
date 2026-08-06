import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AGENT_VOICES, voiceForKind } from "../src/lib/agent-voices";

describe("agent voice map (shipped)", () => {
  it("assigns distinct names and voices per kind", () => {
    assert.equal(AGENT_VOICES.screening.agentName, "Jordan");
    assert.equal(AGENT_VOICES.screening.voice, "eve");
    assert.equal(AGENT_VOICES.hiring_manager.agentName, "Morgan");
    assert.equal(AGENT_VOICES.hiring_manager.voice, "sal");
    assert.equal(AGENT_VOICES.onboarding.agentName, "Riley");
    assert.equal(AGENT_VOICES.onboarding.voice, "ara");
    assert.equal(AGENT_VOICES.practice_pitch.agentName, "Coach");
    assert.equal(AGENT_VOICES.practice_pitch.voice, "rex");
  });

  it("voiceForKind falls back to screening", () => {
    const p = voiceForKind("unknown_kind");
    assert.equal(p.agentName, "Jordan");
  });

  it("all voices are unique", () => {
    const voices = Object.values(AGENT_VOICES).map((v) => v.voice);
    assert.equal(new Set(voices).size, voices.length);
  });
});
