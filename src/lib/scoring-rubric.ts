/**
 * Transparent scoring rubric for sales closer interviews.
 * Shown only in admin — explains why a score is 2 vs 6 vs 9, and what it takes to advance.
 */

export type ScoreBand = {
  min: number;
  max: number;
  label: string;
  meaning: string;
  advance: string;
  color: "red" | "yellow" | "green" | "gray";
};

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 0,
    max: 2,
    label: "1–2 · Unusable / incomplete",
    meaning:
      "No usable conversation, almost no candidate speech, technical failure, or candidate barely engaged. Cannot evaluate sales ability.",
    advance:
      "Do not advance. Invite a re-run on a stable connection, or reject if they abandoned.",
    color: "red",
  },
  {
    min: 3,
    max: 4,
    label: "3–4 · Weak / not ready",
    meaning:
      "Some speech but little structure: weak discovery, vague experience, poor energy, or failed basic product/process understanding. Multitask often poor.",
    advance:
      "No hire for this seat. Optional: suggest another vertical only if something salvageable.",
    color: "red",
  },
  {
    min: 5,
    max: 5,
    label: "5 · Borderline",
    meaning:
      "Basic conversation exists. Can introduce themselves and answer simple questions, but discovery, closing, or vertical fit is thin. Role-play is shallow.",
    advance:
      "Hold. Human must listen to transcript. Only force HM if you personally see potential the model missed.",
    color: "yellow",
  },
  {
    min: 6,
    max: 6,
    label: "6 · Maybe with coaching",
    meaning:
      "Clearer sales background, some good answers, but gaps in objection handling, product clarity, or close discipline. Could develop with training.",
    advance:
      "Maybe invite to HM if multitask ≥5 and transcript shows coachability. Otherwise waitlist.",
    color: "yellow",
  },
  {
    min: 7,
    max: 8,
    label: "7–8 · Hire / advance",
    meaning:
      "Solid closer signal: rapport, discovery questions, coherent product story, handles pushback, asks for next step. Multitask competent. Role-play believable.",
    advance:
      "Advance to hiring manager (Morgan). Strong candidates can go to offer after HM.",
    color: "green",
  },
  {
    min: 9,
    max: 10,
    label: "9–10 · Strong hire",
    meaning:
      "Exceptional: crisp intro with numbers, sharp discovery, owns objections, closes cleanly for HVAC/medspa/etc. ICP, high energy, coachable, multitask strong.",
    advance: "Priority advance — HM immediately, then offer path.",
    color: "green",
  },
];

export const DIMENSION_RUBRIC: {
  key: string;
  label: string;
  whatItMeasures: string;
  toScore6: string;
  toScore8: string;
}[] = [
  {
    key: "rapport",
    label: "Rapport",
    whatItMeasures: "Warmth, confidence, conversational presence",
    toScore6: "Polite, clear, not robotic",
    toScore8: "Natural, engaging, sounds like someone owners would trust",
  },
  {
    key: "discovery",
    label: "Discovery",
    whatItMeasures: "Asks about pain, process, volume, tools",
    toScore6: "Asks 1–2 relevant questions",
    toScore8: "Probes missed calls, after-hours, who answers phone, booking flow",
  },
  {
    key: "productClarity",
    label: "Product clarity",
    whatItMeasures: "Explains AI Front Desk value in plain English",
    toScore6: "Gets the idea of 24/7 answering + booking",
    toScore8: "Can contrast Receptionist vs Front Office and tie to ROI",
  },
  {
    key: "objectionHandling",
    label: "Objections",
    whatItMeasures: "Reframes price, “have a receptionist”, “think about it”",
    toScore6: "Doesn’t freeze; attempts a reframe",
    toScore8: "Calm, specific, ends with a next step",
  },
  {
    key: "closing",
    label: "Closing",
    whatItMeasures: "Asks for demo, kickoff, or calendar hold",
    toScore6: "Mentions a next step",
    toScore8: "Books a concrete time/outcome without being sleazy",
  },
  {
    key: "verticalFit",
    label: "Vertical fit",
    whatItMeasures: "Sounds credible for that industry (HVAC, med spa, etc.)",
    toScore6: "Uses generic local-business language correctly",
    toScore8: "Uses industry pains (emergency calls, consults, storm spikes)",
  },
  {
    key: "coachability",
    label: "Coachability",
    whatItMeasures: "Takes feedback, admits gaps, adjusts mid-call",
    toScore6: "Doesn’t argue with interviewer",
    toScore8: "Incorporates coaching and improves in role-play",
  },
  {
    key: "energy",
    label: "Energy",
    whatItMeasures: "Drive, pace, resilience",
    toScore6: "Audible and present",
    toScore8: "High-energy closer without shouting or fluff",
  },
  {
    key: "multitasking",
    label: "Multitasking",
    whatItMeasures: "Yes/No pop-ups while talking",
    toScore6: "Answers most prompts without freezing the call",
    toScore8: "Fast, accurate, stays in conversation",
  },
];

export function bandForScore(score: number | undefined | null): ScoreBand {
  const s = typeof score === "number" && !Number.isNaN(score) ? score : 0;
  return (
    SCORE_BANDS.find((b) => s >= b.min && s <= b.max) || SCORE_BANDS[0]
  );
}

export function explainScore(opts: {
  overallScore?: number | null;
  recommendation?: string | null;
  transcriptTurns?: number;
  candidateTurns?: number;
  durationSec?: number;
  multitaskScore?: number;
}): string[] {
  const lines: string[] = [];
  const score = opts.overallScore ?? 0;
  const band = bandForScore(score);
  lines.push(`Band: ${band.label}`);
  lines.push(band.meaning);

  if (!opts.candidateTurns || opts.candidateTurns < 2) {
    lines.push(
      "Major penalty: very few candidate speaking turns — model cannot observe real selling behavior.",
    );
  }
  if (opts.durationSec != null && opts.durationSec < 180) {
    lines.push(
      `Duration ${Math.round(opts.durationSec)}s is under the 3-minute sample threshold — treated as incomplete for advance.`,
    );
  }
  if (opts.multitaskScore != null && opts.multitaskScore < 4) {
    lines.push(
      `Multitask score ${opts.multitaskScore}/10 is weak — closers must handle UI load while talking.`,
    );
  }
  if (score <= 2) {
    lines.push(
      "A 2/10 almost always means incomplete capture, abandoned call, or no evaluable sales content — not a full “bad closer” judgment after a long strong call.",
    );
  }
  lines.push(`To move forward: ${band.advance}`);
  return lines;
}

/** What it takes to clear the bar for HM invite */
export const ADVANCE_REQUIREMENTS = {
  autoAdvance: "Overall ≥ 7 (recommendation yes / strong_yes) and interview ≥ ~3 minutes with real candidate speech.",
  borderline:
    "Score 5–6: admin can still Invite to HM if transcript shows potential.",
  block:
    "Score ≤ 4 or empty transcript: re-run interview or reject; do not auto-advance.",
};
