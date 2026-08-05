import type { PipelineStatus } from "./types";

export type ProcessStepId =
  | "apply"
  | "screening"
  | "hiring_manager"
  | "offer"
  | "onboarding"
  | "setup"
  | "training"
  | "ready";

export type ProcessStep = {
  id: ProcessStepId;
  label: string;
  shortLabel: string;
  description: string;
  agent?: string;
};

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "apply",
    label: "1. Apply",
    shortLabel: "Apply",
    description: "Choose your seat and submit your application",
  },
  {
    id: "screening",
    label: "2. Screening interview",
    shortLabel: "Screening",
    description: "Voice interview with Jordan + multitask checks",
    agent: "Jordan",
  },
  {
    id: "hiring_manager",
    label: "3. Hiring manager",
    shortLabel: "Hiring mgr",
    description: "Deep-dive conversation with Morgan",
    agent: "Morgan",
  },
  {
    id: "offer",
    label: "4. Offer",
    shortLabel: "Offer",
    description: "Review and accept your contingent offer",
  },
  {
    id: "onboarding",
    label: "5. Onboarding",
    shortLabel: "Onboard",
    description: "Setup walkthrough with Riley",
    agent: "Riley",
  },
  {
    id: "setup",
    label: "6. Setup checklist",
    shortLabel: "Setup",
    description: "Slack, CRM, dialer, and tools",
  },
  {
    id: "training",
    label: "7. Industry academy",
    shortLabel: "Train",
    description: "Seat-specific modules, quiz, and practice pitch",
    agent: "Coach",
  },
  {
    id: "ready",
    label: "8. Production ready",
    shortLabel: "Ready",
    description: "You're cleared to sell in your vertical",
  },
];

/** Highest unlocked step index based on pipeline status */
export function unlockedStepIndex(status: PipelineStatus | string): number {
  const s = status || "applied";
  if (s === "production_ready") return 7;
  if (s.includes("training") || s === "training_complete") return 6;
  if (s.includes("setup") || s === "setup_complete") return 5;
  if (s.includes("onboarding")) return 4;
  if (s.startsWith("offer")) return 3;
  if (s.startsWith("hm_") || s === "hm_invited") return 2;
  if (
    s === "screening_in_progress" ||
    s === "waitlisted" ||
    s === "rejected" ||
    s === "hm_invited" ||
    s.includes("completed")
  )
    return 2; // after screening, HM may be available
  if (s === "applied") return 1; // can start screening once applied
  return 1;
}

/**
 * More precise unlock map for navigation.
 * A step is clickable only if the candidate has reached it.
 */
export function isStepUnlocked(
  stepId: ProcessStepId,
  status: PipelineStatus | string,
  links: {
    hasApplication?: boolean;
    hmInterviewId?: string | null;
    offerToken?: string | null;
    onboardingInterviewId?: string | null;
    portalToken?: string | null;
  },
): boolean {
  const s = status || "applied";
  const order = PROCESS_STEPS.map((x) => x.id);
  const idx = order.indexOf(stepId);

  const reached: Record<ProcessStepId, boolean> = {
    apply: true,
    screening: Boolean(links.hasApplication),
    hiring_manager:
      Boolean(links.hmInterviewId) ||
      ["hm_invited", "hm_in_progress", "hm_maybe", "hm_rejected", "offer_pending", "offer_accepted", "offer_declined", "onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"].includes(s),
    offer:
      Boolean(links.offerToken) ||
      ["offer_pending", "offer_accepted", "offer_declined", "onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"].includes(s),
    onboarding:
      Boolean(links.onboardingInterviewId) ||
      ["onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"].includes(s),
    setup:
      ["setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready", "onboarding_complete"].includes(s),
    training:
      ["training_in_progress", "training_complete", "production_ready", "setup_complete"].includes(s) ||
      (s === "setup_complete"),
    ready: s === "production_ready",
  };

  return reached[stepId] === true;
}

export function hrefForStep(
  stepId: ProcessStepId,
  ctx: {
    applicationId?: string;
    portalToken?: string;
    screeningId?: string;
    hmInterviewId?: string | null;
    offerToken?: string | null;
    onboardingInterviewId?: string | null;
    roleSlug?: string;
  },
): string | null {
  const { applicationId, portalToken, screeningId, hmInterviewId, offerToken, onboardingInterviewId, roleSlug } = ctx;
  switch (stepId) {
    case "apply":
      return roleSlug ? `/apply/${roleSlug}` : "/";
    case "screening":
      return screeningId || applicationId
        ? `/interview/${screeningId || applicationId}`
        : null;
    case "hiring_manager":
      return hmInterviewId ? `/interview/${hmInterviewId}` : null;
    case "offer":
      return offerToken ? `/offer/${offerToken}` : null;
    case "onboarding":
      return onboardingInterviewId
        ? `/interview/${onboardingInterviewId}`
        : null;
    case "setup":
      return applicationId && portalToken
        ? `/portal/${applicationId}?t=${portalToken}`
        : null;
    case "training":
      return applicationId && portalToken
        ? `/train/${applicationId}?t=${portalToken}`
        : null;
    case "ready":
      return applicationId && portalToken
        ? `/portal/${applicationId}?t=${portalToken}`
        : null;
    default:
      return null;
  }
}

export function currentStepId(
  status: PipelineStatus | string,
  kind?: string,
): ProcessStepId {
  if (kind === "hiring_manager") return "hiring_manager";
  if (kind === "onboarding") return "onboarding";
  if (kind === "practice_pitch") return "training";
  if (kind === "screening") return "screening";

  const s = status || "applied";
  if (s === "production_ready") return "ready";
  if (s.includes("training")) return "training";
  if (s.includes("setup")) return "setup";
  if (s.includes("onboarding")) return "onboarding";
  if (s.startsWith("offer")) return "offer";
  if (s.startsWith("hm_")) return "hiring_manager";
  if (s === "applied" || s === "screening_in_progress") return "screening";
  return "screening";
}
