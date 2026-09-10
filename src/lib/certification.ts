import { SALES_CORE_MODULES } from "./sales-curriculum";
import { setupProgress } from "./setup-tasks";
import { getAcademyForRole } from "./training-content";
import type { InterviewRecord } from "./types";

export const CERT_QUIZ_PASS = 0.85;
export const CERT_PITCH_PASS = 8;
export const CERT_ROLEPLAY_PASSES = 2;

export type CertificationCheck = {
  certified: boolean;
  blockers: string[];
  modulesRead: number;
  modulesTotal: number;
  quizScore: number;
  quizPassed: boolean;
  pitchScore: number;
  pitchPassed: boolean;
  roleplayPasses: number;
  roleplayRequired: number;
  setupReady: boolean;
  offerAccepted: boolean;
};

export function requiredModuleIds(roleSlug: string): string[] {
  const academy = getAcademyForRole(roleSlug);
  return [...academy.modules, ...SALES_CORE_MODULES].map((m) => m.id);
}

export function certificationCheck(root: InterviewRecord): CertificationCheck {
  const requiredIds = requiredModuleIds(root.roleSlug);
  const read = new Set(root.training?.modulesRead || []);
  const modulesRead = requiredIds.filter((id) => read.has(id)).length;
  const modulesTotal = requiredIds.length;
  const quizScore = Number(root.training?.quizScore || 0);
  const quizPassed = Boolean(root.training?.quizPassed) && quizScore >= CERT_QUIZ_PASS * 100;
  const pitchScore = Number(root.training?.practicePitchScore || 0);
  const roleplayPasses = Number(root.training?.roleplayPasses || 0);
  const pitchPassed = roleplayPasses >= CERT_ROLEPLAY_PASSES;
  const setupReady = setupProgress(root.setupTasks).requiredDone;
  const offerAccepted = root.offer?.status === "accepted";

  const blockers: string[] = [];
  if (!offerAccepted) blockers.push("Accept the formal offer/commission agreement path.");
  if (!setupReady) blockers.push("Complete every required onboarding/setup acknowledgement.");
  if (modulesRead < modulesTotal) blockers.push(`Read all required academy modules (${modulesRead}/${modulesTotal}).`);
  if (!quizPassed) blockers.push(`Pass the knowledge assessment at ${Math.round(CERT_QUIZ_PASS * 100)}% or higher.`);
  if (!pitchPassed) blockers.push(`Pass ${CERT_ROLEPLAY_PASSES} voice roleplays at ${CERT_PITCH_PASS}/10 or higher (${roleplayPasses}/${CERT_ROLEPLAY_PASSES}).`);

  return {
    certified: blockers.length === 0,
    blockers,
    modulesRead,
    modulesTotal,
    quizScore,
    quizPassed,
    pitchScore,
    pitchPassed,
    roleplayPasses,
    roleplayRequired: CERT_ROLEPLAY_PASSES,
    setupReady,
    offerAccepted,
  };
}
