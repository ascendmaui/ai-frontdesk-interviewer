import { evaluateSystemForKind } from "./agents";
import { COMPANY, PRODUCT_KNOWLEDGE } from "./company";
import { getRole } from "./roles";
import type {
  InterviewKind,
  Scorecard,
  TranscriptLine,
} from "./types";
import type { MultitaskResult } from "./multitask-quiz";

export async function evaluateTranscript(opts: {
  roleSlug: string;
  candidateName: string;
  transcript: TranscriptLine[];
  durationSec?: number;
  kind?: InterviewKind;
  multitask?: MultitaskResult | null;
}): Promise<Scorecard> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not set");

  const kind = opts.kind || "screening";
  const role = getRole(opts.roleSlug);
  const lines = opts.transcript
    .filter((l) => l.role === "user" || l.role === "assistant")
    .map(
      (l) =>
        `${l.role === "user" ? "Candidate" : "Interviewer"}: ${l.text}`,
    )
    .join("\n");

  if (!lines.trim()) {
    return {
      overallScore: 1,
      recommendation: "maybe",
      summary:
        "NO TRANSCRIPT CAPTURED. Cannot grade sales ability. Candidate should re-run the voice interview on a stable connection and press End interview when finished so scoring can run.",
      strengths: [],
      developmentAreas: [
        "No conversation text available for scoring",
        "Ensure mic permission and complete the full interview",
      ],
      scores: {
        rapport: 1,
        discovery: 1,
        productClarity: 1,
        objectionHandling: 1,
        closing: 1,
        verticalFit: 1,
        coachability: 1,
        energy: 1,
        multitasking: opts.multitask?.multitaskScore || 1,
      },
      rolePlayNotes: "Role-play not captured.",
      nextStep:
        "Invite candidate to re-take the interview; do not hire based on this empty session.",
    };
  }

  const multitaskBlock =
    opts.multitask && opts.multitask.asked > 0
      ? `\nMultitask yes/no pop-ups during call: ${opts.multitask.correctCount}/${opts.multitask.scoredCount} correct, skipped ${opts.multitask.skippedCount}, multitaskScore ${opts.multitask.multitaskScore}/10, avg response ${opts.multitask.avgResponseMs}ms.`
      : "";

  const baseSystem =
    kind === "screening"
      ? `You are a hiring scorecard assistant for ${COMPANY.brand} (${COMPANY.product}).
Score a voice SCREENING interview for: ${role?.title || opts.roleSlug} (${role?.industry || "sales"}).
Evaluation emphasis: ${role?.weightNotes || "general sales closing"}
Include multitasking ability if pop-up data is provided (do not invent pop-up results).
You MUST produce a clear hire recommendation for a sales closer seat.
recommendation meanings:
- strong_yes: exceptional closer signal — advance immediately
- yes: solid hire / advance to next stage
- maybe: incomplete or mixed — human must decide
- no: do not hire for this role

Return ONLY valid JSON:
{
  "overallScore": number 1-10,
  "recommendation": "strong_yes" | "yes" | "maybe" | "no",
  "summary": string (2-4 sentences: who they are as a seller + hire recommendation rationale),
  "strengths": string[2-4],
  "developmentAreas": string[1-3],
  "scores": {
    "rapport": number 1-10,
    "discovery": number 1-10,
    "productClarity": number 1-10,
    "objectionHandling": number 1-10,
    "closing": number 1-10,
    "verticalFit": number 1-10,
    "coachability": number 1-10,
    "energy": number 1-10,
    "multitasking": number 1-10
  },
  "rolePlayNotes": string,
  "nextStep": string (concrete ops action)
}
Be fair and specific. Thin or incomplete interviews → maybe + conservative scores. Never invent transcript content.
Product context:
${PRODUCT_KNOWLEDGE}
Vertical ICP: ${role?.icp || "local businesses"}`
      : evaluateSystemForKind(kind, role?.title || opts.roleSlug) +
        `\nCompany: ${COMPANY.brand}. Product:\n${PRODUCT_KNOWLEDGE}`;

  const r = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.XAI_EVAL_MODEL || "grok-3-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: baseSystem },
        {
          role: "user",
          content: `Candidate: ${opts.candidateName}\nKind: ${kind}\nRole: ${role?.title}\nDuration seconds: ${opts.durationSec ?? "unknown"}${multitaskBlock}\n\nTranscript:\n${lines}`,
        },
      ],
    }),
  });

  const data = await r.json();
  if (!r.ok) {
    throw new Error(
      data?.error?.message || data?.error || `Evaluation failed (${r.status})`,
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");

  try {
    return JSON.parse(content) as Scorecard;
  } catch {
    return { raw: content, recommendation: "maybe", overallScore: 5 };
  }
}
