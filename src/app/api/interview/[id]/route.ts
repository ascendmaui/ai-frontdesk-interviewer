import { NextResponse } from "next/server";
import { getRole } from "@/lib/roles";
import { getInterview } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Public candidate-facing interview status.
 * Never returns scorecard, transcript, multitask, or pipeline decisions.
 */
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

  return NextResponse.json({
    id: interview.id,
    kind,
    roleTitle: role?.title,
    roleEmoji: role?.emoji,
    status: interview.status,
    isDone,
    candidate: {
      firstName: interview.candidate.firstName,
      lastName: interview.candidate.lastName,
    },
    // Explicitly omit: scorecard, transcript, multitask, offer, pipeline, notifications
  });
}
