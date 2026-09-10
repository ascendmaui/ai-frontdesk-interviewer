/**
 * Sync durable applicant/interview state to Hearthline control-plane CRM spine.
 * Fire-and-log — never throws into hiring UX (mirrors provisionToHearthlineOs).
 */

import type { InterviewRecord } from "./types";

export type SpineSyncResult = {
  ok: boolean;
  error?: string;
  applicantId?: string;
  interviewId?: string;
};

function spineBase(): string {
  return (
    process.env.HEARTHLINE_SPINE_URL ||
    process.env.HEARTHLINE_OS_URL ||
    process.env.NEXT_PUBLIC_HEARTHLINE_OS_URL ||
    "https://hearthline-platform.vercel.app"
  ).replace(/\/$/, "");
}

function spineSecret(): string | undefined {
  return (
    process.env.HEARTHLINE_SPINE_SECRET ||
    process.env.HEARTHLINE_PROVISION_SECRET ||
    undefined
  );
}

export async function syncApplicantToSpine(
  interview: InterviewRecord,
): Promise<SpineSyncResult> {
  const secret = spineSecret();
  if (!secret) {
    console.warn("[spine-sync] HEARTHLINE_SPINE_SECRET not set — skip spine sync");
    return { ok: false, error: "HEARTHLINE_SPINE_SECRET not configured" };
  }

  const email = interview.candidate.email?.toLowerCase().trim();
  if (!email) return { ok: false, error: "Candidate email missing" };

  const sourceApplicationId = interview.rootId || interview.id;
  const payload = {
    sourceSystem: "ai-frontdesk-interviewer",
    sourceApplicationId,
    email,
    firstName: interview.candidate.firstName,
    lastName: interview.candidate.lastName,
    phone: interview.candidate.phone || null,
    roleSlug: interview.roleSlug,
    pipelineStatus: interview.pipelineStatus,
    interview: {
      kind: interview.kind || "screening",
      status: interview.status,
      score: interview.scorecard?.overallScore ?? null,
      recommendation:
        interview.scorecard?.recommendation != null
          ? String(interview.scorecard.recommendation)
          : null,
      transcript: interview.transcript ?? [],
      scorecard: interview.scorecard
        ? (interview.scorecard as unknown as Record<string, unknown>)
        : undefined,
      startedAt: interview.startedAt ?? null,
      completedAt: interview.completedAt ?? null,
      sourceInterviewId: interview.id,
    },
  };

  try {
    const res = await fetch(`${spineBase()}/api/spine/applicants/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hearthline-spine-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      applicantId?: string;
      interviewId?: string | null;
    };
    if (!res.ok) {
      console.error("[spine-sync] sync failed", res.status, data);
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      applicantId: data.applicantId,
      interviewId: data.interviewId ?? undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Spine sync network error";
    console.error("[spine-sync]", message);
    return { ok: false, error: message };
  }
}
