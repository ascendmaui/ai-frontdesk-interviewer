import { isQualified, type Recommendation } from "./company";
import type {
  InterviewKind,
  InterviewRecord,
  PipelineStatus,
  Scorecard,
} from "./types";
import { scoreMultitask, type MultitaskResult } from "./multitask-quiz";

export function publicAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function stagePath(id: string): string {
  return `${publicAppUrl()}/interview/${id}`;
}

export function donePath(id: string): string {
  return `${publicAppUrl()}/done/${id}`;
}

/**
 * After screening: map scorecard + multitask → pipeline next step.
 */
export function screeningOutcome(
  scorecard: Scorecard | undefined,
  multitask?: MultitaskResult | null,
): {
  pipelineStatus: PipelineStatus;
  recommendation: Recommendation;
  advanceToHm: boolean;
} {
  const rec = (scorecard?.recommendation || "maybe") as Recommendation;
  let adjusted = rec;

  // Weak multitask can demote borderline pass
  if (multitask && multitask.scoredCount >= 3) {
    if (multitask.multitaskScore < 4 && (rec === "yes" || rec === "strong_yes")) {
      adjusted = "maybe";
    }
    if (multitask.multitaskScore >= 8 && rec === "maybe") {
      // slight bump only to maybe stays maybe; strong multitask noted but no auto-pass
    }
    if (multitask.multitaskScore < 3 && rec === "yes") {
      adjusted = "maybe";
    }
  }

  if (isQualified(adjusted)) {
    return {
      pipelineStatus: "hm_invited",
      recommendation: adjusted,
      advanceToHm: true,
    };
  }
  if (adjusted === "maybe") {
    return {
      pipelineStatus: "waitlisted",
      recommendation: adjusted,
      advanceToHm: false,
    };
  }
  return {
    pipelineStatus: "rejected",
    recommendation: adjusted,
    advanceToHm: false,
  };
}

export function hmOutcome(scorecard: Scorecard | undefined): {
  pipelineStatus: PipelineStatus;
  createOffer: boolean;
} {
  const rec = (scorecard?.recommendation || "maybe") as Recommendation;
  if (isQualified(rec)) {
    // Pass → offer pending (not auto-onboard until accept)
    return { pipelineStatus: "offer_pending", createOffer: true };
  }
  if (rec === "maybe") {
    return { pipelineStatus: "hm_maybe", createOffer: false };
  }
  return { pipelineStatus: "hm_rejected", createOffer: false };
}

export function onboardingOutcome(scorecard?: Scorecard): PipelineStatus {
  if (scorecard && Number(scorecard.overallScore) < 4) {
    return "onboarding_incomplete";
  }
  // After Riley: setup checklist
  return "setup_in_progress";
}

export function pipelineSteps(status: PipelineStatus): {
  id: string;
  label: string;
  state: "done" | "current" | "todo";
}[] {
  const order = [
    { id: "screen", label: "Screen", match: ["applied", "screening_in_progress", "waitlisted", "rejected", "hm_invited", "hm_in_progress", "hm_maybe", "hm_rejected", "offer_pending", "offer_accepted", "offer_declined", "onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"] },
    { id: "hm", label: "Hiring mgr", match: ["hm_invited", "hm_in_progress", "hm_maybe", "hm_rejected", "offer_pending", "offer_accepted", "offer_declined", "onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"] },
    { id: "offer", label: "Offer", match: ["offer_pending", "offer_accepted", "offer_declined", "onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"] },
    { id: "onboard", label: "Onboard", match: ["onboarding_invited", "onboarding_in_progress", "onboarding_incomplete", "onboarding_complete", "setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"] },
    { id: "setup", label: "Setup", match: ["setup_in_progress", "setup_complete", "training_in_progress", "training_complete", "production_ready"] },
    { id: "train", label: "Train", match: ["training_in_progress", "training_complete", "production_ready"] },
    { id: "ready", label: "Ready", match: ["production_ready"] },
  ] as const;

  const currentIdx = (() => {
    if (status === "production_ready") return 6;
    if (status.startsWith("training") || status === "training_complete") return 5;
    if (status.startsWith("setup") || status === "setup_complete") return 4;
    if (status.includes("onboarding")) return 3;
    if (status.startsWith("offer")) return 2;
    if (status.startsWith("hm_") || status === "hm_invited") return 1;
    if (status === "rejected" || status === "waitlisted") return 0;
    return 0;
  })();

  return order.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: i < currentIdx ? "done" : i === currentIdx ? "current" : "todo",
  }));
}

export function kindLabel(kind: InterviewKind): string {
  switch (kind) {
    case "hiring_manager":
      return "Hiring manager interview";
    case "onboarding":
      return "Onboarding guide";
    case "practice_pitch":
      return "Practice pitch";
    default:
      return "Sales closer screening";
  }
}

export function mergeMultitaskIntoScorecard(
  scorecard: Scorecard,
  multitask: MultitaskResult | null | undefined,
): Scorecard {
  if (!multitask || multitask.asked === 0) return scorecard;
  const scores = {
    ...(scorecard.scores || {}),
    multitasking: multitask.multitaskScore,
  };
  // Soft blend overall if model score exists
  let overall = scorecard.overallScore;
  if (typeof overall === "number") {
    overall = Math.round((overall * 0.85 + multitask.multitaskScore * 0.15) * 10) / 10;
  }
  const summaryExtra =
    multitask.scoredCount > 0
      ? ` Multitask pop-ups: ${multitask.correctCount}/${multitask.scoredCount} correct (${Math.round(multitask.accuracy * 100)}%), score ${multitask.multitaskScore}/10.`
      : "";
  return {
    ...scorecard,
    overallScore: overall,
    scores,
    summary: `${scorecard.summary || ""}${summaryExtra}`.trim(),
  };
}

export function ensureMultitaskResult(
  raw: MultitaskResult | { answers?: MultitaskResult["answers"] } | undefined,
): MultitaskResult | undefined {
  if (!raw) return undefined;
  if ("multitaskScore" in raw && typeof raw.multitaskScore === "number") {
    return raw as MultitaskResult;
  }
  if (raw.answers) return scoreMultitask(raw.answers);
  return undefined;
}

export function parentPipelineId(interview: InterviewRecord): string {
  return interview.rootId || interview.id;
}
