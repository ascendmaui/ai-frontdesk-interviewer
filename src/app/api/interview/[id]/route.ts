import { NextResponse } from "next/server";
import { voiceForKind } from "@/lib/agent-voices";
import { getRole } from "@/lib/roles";
import { getInterview } from "@/lib/store";
import { candidateAuthError } from "@/lib/candidate-auth";

export const runtime = "nodejs";

/**
 * Public candidate-facing interview status.
 * Omits scores/transcripts; includes agent identity for correct UI.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const access = candidateAuthError(req, interview);
  if (access) return access;

  const role = getRole(interview.roleSlug);
  const kind = interview.kind || "screening";
  const profile = voiceForKind(kind);
  const isDone =
    interview.status === "completed" ||
    interview.status === "abandoned" ||
    Boolean(interview.scorecard);

  const rootId = interview.rootId || interview.id;
  const root = rootId !== interview.id ? await getInterview(rootId) : interview;

  return NextResponse.json({
    id: interview.id,
    rootId,
    kind,
    agentName: profile.agentName,
    agentTone: profile.tone,
    agentTitle: profile.title,
    voice: profile.voice,
    roleSlug: interview.roleSlug,
    roleTitle: role?.title,
    roleEmoji: role?.emoji,
    status: interview.status,
    isDone,
    pipelineStatus: root?.pipelineStatus || interview.pipelineStatus,
    portalToken: root?.portalToken || interview.portalToken,
    hmInterviewId: root?.hmInterviewId || interview.hmInterviewId,
    onboardingInterviewId:
      root?.onboardingInterviewId || interview.onboardingInterviewId,
    offerToken: root?.offer?.token || interview.offer?.token,
    candidate: {
      firstName: interview.candidate.firstName,
      lastName: interview.candidate.lastName,
    },
  });
}
