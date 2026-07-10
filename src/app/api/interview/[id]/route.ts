import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { getRole } from "@/lib/roles";
import { getInterview } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = getRole(interview.roleSlug);
  const kind = interview.kind || "screening";
  const isDone =
    interview.status === "completed" ||
    interview.status === "abandoned" ||
    Boolean(interview.scorecard);

  const agentName =
    kind === "hiring_manager"
      ? "Morgan"
      : kind === "onboarding"
        ? "Riley"
        : kind === "practice_pitch"
          ? "Coach"
          : "Jordan";

  const rootId = interview.rootId || interview.id;
  const root = rootId !== id ? await getInterview(rootId) : interview;

  let hmInterviewId = interview.hmInterviewId || root?.hmInterviewId;
  let onboardingInterviewId =
    interview.onboardingInterviewId || root?.onboardingInterviewId;
  const offer = interview.offer || root?.offer;
  const portalToken = interview.portalToken || root?.portalToken;

  return NextResponse.json({
    id: interview.id,
    rootId,
    kind,
    agentName,
    roleSlug: interview.roleSlug,
    roleTitle: role?.title,
    roleEmoji: role?.emoji,
    industry: role?.industry,
    status: interview.status,
    pipelineStatus: interview.pipelineStatus || root?.pipelineStatus,
    enableMultitaskQuiz: kind === "screening",
    portalToken,
    portalPath: portalToken
      ? `/portal/${rootId}?t=${portalToken}`
      : undefined,
    candidate: {
      firstName: interview.candidate.firstName,
      lastName: interview.candidate.lastName,
      email: isDone ? interview.candidate.email : undefined,
    },
    durationSec: interview.durationSec,
    scorecard: isDone ? interview.scorecard : undefined,
    multitaskQuiz: isDone
      ? interview.multitaskQuiz || root?.multitaskQuiz
      : undefined,
    hmInterviewId: isDone ? hmInterviewId : undefined,
    onboardingInterviewId: isDone ? onboardingInterviewId : undefined,
    offer: isDone && offer
      ? { token: offer.token, status: offer.status }
      : undefined,
    calendarUrl: COMPANY.calendarUrl || null,
    createdAt: interview.createdAt,
    transcript: isDone ? interview.transcript : undefined,
    notifications: isDone ? interview.notifications : undefined,
  });
}
