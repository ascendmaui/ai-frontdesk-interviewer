import { NextResponse } from "next/server";
import { getRole } from "@/lib/roles";
import { getInterview, listInterviews } from "@/lib/store";
import { adminAuthError } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * Full application review payload for admin:
 * root + all stage sessions with transcripts and scores.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = adminAuthError(req); if (access) return access;

  const { id } = await ctx.params;
  const interview = await getInterview(id);
  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rootId = interview.rootId || interview.id;
  const root = (await getInterview(rootId)) || interview;
  const role = getRole(root.roleSlug);

  // Collect all sessions in this application chain
  const all = await listInterviews(500);
  const sessions = all
    .filter(
      (s) => s.id === rootId || s.rootId === rootId || s.parentId === rootId,
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map((s) => ({
      id: s.id,
      kind: s.kind || "screening",
      status: s.status,
      pipelineStatus: s.pipelineStatus,
      createdAt: s.createdAt,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      durationSec: s.durationSec,
      scorecard: s.scorecard,
      hireVerdict: s.hireVerdict,
      multitaskQuiz: s.multitaskQuiz,
      transcript: s.transcript || [],
      eventTypes: s.eventTypes,
      errorMessage: s.errorMessage,
      notifications: s.notifications,
    }));

  // Prefer session with richest scorecard/transcript for top-level verdict
  const best =
    sessions.find((s) => s.hireVerdict) ||
    sessions.find((s) => s.scorecard) ||
    sessions[0];

  return NextResponse.json({
    application: {
      id: root.id,
      roleSlug: root.roleSlug,
      roleTitle: role?.title,
      roleEmoji: role?.emoji,
      industry: role?.industry,
      department: root.department || "sales_closer",
      pipelineStatus: root.pipelineStatus,
      portalToken: root.portalToken,
      createdAt: root.createdAt,
      candidate: root.candidate,
      offer: root.offer,
      setupTasks: root.setupTasks,
      training: root.training,
      hmInterviewId: root.hmInterviewId,
      onboardingInterviewId: root.onboardingInterviewId,
      scorecard: root.scorecard || best?.scorecard,
      hireVerdict: root.hireVerdict || best?.hireVerdict,
      multitaskQuiz: root.multitaskQuiz || best?.multitaskQuiz,
    },
    sessions,
    media: {
      audioRecording: null,
      note: "Live audio streams through Grok Voice and is not saved as a playable file. The full transcript + AI hire analysis below is the review package. Use Re-run analysis if scores are missing.",
    },
  });
}
