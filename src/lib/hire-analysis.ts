import type { Recommendation } from "./company";
import type { MultitaskResult } from "./multitask-quiz";
import type { Scorecard, TranscriptLine } from "./types";

/**
 * Normalized hiring verdict shown only in admin.
 */
export type HireVerdict = {
  decision: Recommendation;
  label: string;
  color: "green" | "yellow" | "gray" | "red";
  headline: string;
  confidence: "high" | "medium" | "low";
  summary: string;
  overallScore: number;
  strengths: string[];
  risks: string[];
  nextAction: string;
  evidence: {
    talkTurns: number;
    candidateTurns: number;
    assistantTurns: number;
    durationSec: number;
    multitaskScore?: number;
    multitaskAccuracy?: number;
    transcriptAvailable: boolean;
  };
};

const LABELS: Record<Recommendation, { label: string; color: HireVerdict["color"]; headline: string }> = {
  strong_yes: {
    label: "Strong hire",
    color: "green",
    headline: "Strong hire — advance immediately",
  },
  yes: {
    label: "Hire / advance",
    color: "green",
    headline: "Good hire signal — move to next stage",
  },
  maybe: {
    label: "Maybe / hold",
    color: "yellow",
    headline: "Inconclusive — human review required",
  },
  no: {
    label: "No hire",
    color: "red",
    headline: "Do not advance — pass for this role",
  },
};

export function buildHireVerdict(opts: {
  scorecard?: Scorecard | null;
  multitask?: MultitaskResult | null;
  transcript?: TranscriptLine[];
  durationSec?: number;
}): HireVerdict {
  const transcript = opts.transcript || [];
  const spoken = transcript.filter(
    (t) => (t.role === "user" || t.role === "assistant") && t.text?.trim(),
  );
  const candidateTurns = spoken.filter((t) => t.role === "user").length;
  const assistantTurns = spoken.filter((t) => t.role === "assistant").length;
  const durationSec = opts.durationSec || 0;
  const transcriptAvailable = spoken.length > 0;

  let decision = (String(opts.scorecard?.recommendation || "maybe")
    .toLowerCase()
    .replace(/\s+/g, "_") as Recommendation);

  if (!["strong_yes", "yes", "maybe", "no"].includes(decision)) {
    decision = "maybe";
  }

  // Guardrails: no real conversation → cannot recommend hire
  if (!transcriptAvailable || candidateTurns < 2) {
    decision = "maybe";
  }
  if (durationSec > 0 && durationSec < 120) {
    decision = "maybe";
  }
  if (opts.multitask && opts.multitask.scoredCount >= 3 && opts.multitask.multitaskScore < 3.5) {
    if (decision === "strong_yes") decision = "yes";
    if (decision === "yes") decision = "maybe";
  }

  let overallScore = Number(opts.scorecard?.overallScore);
  if (Number.isNaN(overallScore) || overallScore <= 0) {
    overallScore = transcriptAvailable ? 5 : 1;
  }

  const meta = LABELS[decision];
  const strengths = opts.scorecard?.strengths?.length
    ? opts.scorecard.strengths
    : transcriptAvailable
      ? ["Conversation was captured — see transcript for details"]
      : [];
  const risks = opts.scorecard?.developmentAreas?.length
    ? opts.scorecard.developmentAreas
    : !transcriptAvailable
      ? [
          "No usable transcript was captured for this session",
          "Cannot score sales ability without conversation content",
        ]
      : candidateTurns < 3
        ? ["Very few candidate speaking turns — sample may be too thin"]
        : [];

  const summary =
    opts.scorecard?.summary ||
    (!transcriptAvailable
      ? "Interview ended without a usable transcript. Ask the candidate to re-run, or review multitask answers only."
      : "Automated scorecard incomplete — review the transcript manually.");

  const nextAction =
    decision === "strong_yes" || decision === "yes"
      ? opts.scorecard?.nextStep || "Advance to hiring manager interview or send offer."
      : decision === "no"
        ? "Send a polite rejection and archive the application."
        : !transcriptAvailable
          ? "Invite candidate to re-do the voice interview with a stable connection."
          : "Listen to the transcript and decide manually, or re-run AI analysis.";

  const confidence: HireVerdict["confidence"] =
    !transcriptAvailable || durationSec < 180
      ? "low"
      : spoken.length >= 8 && overallScore >= 7
        ? "high"
        : "medium";

  return {
    decision,
    label: meta.label,
    color: meta.color,
    headline: meta.headline,
    confidence,
    summary,
    overallScore,
    strengths,
    risks,
    nextAction,
    evidence: {
      talkTurns: spoken.length,
      candidateTurns,
      assistantTurns,
      durationSec,
      multitaskScore: opts.multitask?.multitaskScore,
      multitaskAccuracy: opts.multitask?.accuracy,
      transcriptAvailable,
    },
  };
}
