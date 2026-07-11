import { NextResponse } from "next/server";
import { getRole } from "@/lib/roles";
import { getInterview, listInterviews } from "@/lib/store";

export const runtime = "nodejs";

function authed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const q = new URL(req.url).searchParams.get("secret") || "";
  return token === secret || q === secret;
}

/**
 * Full application review payload for admin:
 * root + all stage sessions with transcripts and scores.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    .filter((s) => s.id === rootId || s.rootId === rootId || s.parentId === rootId)
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
      multitaskQuiz: s.multitaskQuiz,
      transcript: s.transcript || [],
      errorMessage: s.errorMessage,
      notifications: s.notifications,
    }));

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
      // Latest / root-level scores for quick glance
      scorecard: root.scorecard,
      multitaskQuiz: root.multitaskQuiz,
    },
    sessions,
    // Voice: live audio is streamed via xAI and not persisted by default.
    // Transcript is the durable review artifact.
    media: {
      audioRecording: null,
      note: "Live audio is streamed through Grok Voice and is not stored. Full transcript is available for each stage below.",
    },
  });
}
