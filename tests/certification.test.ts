import test from "node:test";
import assert from "node:assert/strict";
import {
  certificationCheck,
  CERT_PITCH_PASS,
  CERT_QUIZ_PASS,
  CERT_ROLEPLAY_PASSES,
  requiredModuleIds,
} from "../src/lib/certification";
import type { InterviewRecord } from "../src/lib/types";

function root(overrides: Partial<InterviewRecord> = {}): InterviewRecord {
  const modules = requiredModuleIds("hvac-closer");
  return {
    id: "int_cert_test",
    kind: "screening",
    department: "sales_closer",
    roleSlug: "hvac-closer",
    status: "completed",
    pipelineStatus: "training_in_progress",
    portalToken: "portal_test",
    candidate: {
      firstName: "QA",
      lastName: "Closer",
      email: "qa@example.com",
      phone: "8645550100",
      consent: true,
    },
    createdAt: new Date().toISOString(),
    transcript: [],
    offer: {
      id: "offer_test",
      token: "off_test",
      title: "Test",
      body: "Test",
      roleSlug: "hvac-closer",
      createdAt: new Date().toISOString(),
      status: "accepted",
    },
    setupTasks: [
      {
        id: "required",
        title: "Required",
        description: "Required",
        required: true,
        completedAt: new Date().toISOString(),
      },
    ],
    training: {
      modulesRead: modules,
      quizScore: Math.round(CERT_QUIZ_PASS * 100),
      quizPassed: true,
      quizAttempts: 1,
      practicePitchScore: CERT_PITCH_PASS,
      practicePitchPassed: true,
      roleplayAttempts: CERT_ROLEPLAY_PASSES,
      roleplayPasses: CERT_ROLEPLAY_PASSES,
    },
    ...overrides,
  };
}

test("certification passes only when every gate is satisfied", () => {
  const result = certificationCheck(root());
  assert.equal(result.certified, true);
  assert.deepEqual(result.blockers, []);
});

test("three read modules are not enough", () => {
  const r = root();
  r.training = {
    ...r.training!,
    modulesRead: requiredModuleIds(r.roleSlug).slice(0, 3),
  };
  const result = certificationCheck(r);
  assert.equal(result.certified, false);
  assert.match(result.blockers.join(" "), /Read all required academy modules/);
});

test("quiz below 85 percent blocks certification", () => {
  const r = root();
  r.training = { ...r.training!, quizScore: 84, quizPassed: false };
  const result = certificationCheck(r);
  assert.equal(result.certified, false);
  assert.match(result.blockers.join(" "), /85%/);
});

test("one passing roleplay is not enough", () => {
  const r = root();
  r.training = {
    ...r.training!,
    roleplayAttempts: 1,
    roleplayPasses: 1,
    practicePitchPassed: false,
  };
  const result = certificationCheck(r);
  assert.equal(result.certified, false);
  assert.match(result.blockers.join(" "), /2 voice roleplays/);
});

test("incomplete required setup blocks certification", () => {
  const r = root();
  r.setupTasks = [
    {
      id: "required",
      title: "Required",
      description: "Required",
      required: true,
    },
  ];
  const result = certificationCheck(r);
  assert.equal(result.certified, false);
  assert.match(result.blockers.join(" "), /onboarding\/setup/);
});

test("unaccepted offer blocks certification", () => {
  const r = root();
  r.offer = { ...r.offer!, status: "pending" };
  const result = certificationCheck(r);
  assert.equal(result.certified, false);
  assert.match(result.blockers.join(" "), /Accept the formal offer/);
});
