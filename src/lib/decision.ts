import type { Recommendation } from "./company";
import type { Scorecard } from "./types";

/**
 * Normalize model output + apply business pass bar.
 * Decision: strong_yes / yes → qualified next step; maybe / no → decline path.
 */
export function normalizeRecommendation(
  scorecard: Scorecard | undefined,
  durationSec: number,
): Recommendation {
  if (durationSec > 0 && durationSec < 180) {
    // Under 3 minutes — incomplete interview, not a hard "no hire"
    return "maybe";
  }

  const raw = String(scorecard?.recommendation || "maybe")
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (raw.includes("strong")) return "strong_yes";
  if (raw === "yes" || raw.includes("advance") || raw.includes("hire"))
    return "yes";
  if (raw === "no" || raw.includes("pass") || raw.includes("reject"))
    return "no";

  const score = Number(scorecard?.overallScore);
  if (!Number.isNaN(score)) {
    if (score >= 8.5) return "strong_yes";
    if (score >= 7) return "yes";
    if (score >= 5) return "maybe";
    return "no";
  }

  return "maybe";
}

export function applyDecision(
  scorecard: Scorecard,
  durationSec: number,
): Scorecard {
  const recommendation = normalizeRecommendation(scorecard, durationSec);
  return { ...scorecard, recommendation };
}
