import { NextResponse } from "next/server";
import { getInterview, updateInterview } from "@/lib/store";
import type { TranscriptLine } from "@/lib/types";
import type { MultitaskAnswer } from "@/lib/multitask-quiz";
import { scoreMultitask } from "@/lib/multitask-quiz";

export const runtime = "nodejs";

/**
 * Live sync during an interview so transcript is not lost if the tab dies
 * before /api/complete runs.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: {
    transcript?: TranscriptLine[];
    durationSec?: number;
    multitaskAnswers?: MultitaskAnswer[];
    eventLog?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await getInterview(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Don't clobber a fully completed scored interview unless transcript is richer
  const incoming = Array.isArray(body.transcript) ? body.transcript : [];
  const current = existing.transcript || [];
  const useTranscript =
    incoming.length >= current.length ? incoming : current;

  const patch: Record<string, unknown> = {
    transcript: useTranscript,
  };
  if (typeof body.durationSec === "number") {
    patch.durationSec = body.durationSec;
  }
  if (Array.isArray(body.multitaskAnswers) && body.multitaskAnswers.length) {
    patch.multitaskQuiz = scoreMultitask(body.multitaskAnswers);
  }
  if (existing.status === "applied") {
    patch.status = "in_progress";
    patch.pipelineStatus =
      existing.pipelineStatus === "applied"
        ? "screening_in_progress"
        : existing.pipelineStatus;
  }

  await updateInterview(id, patch);
  return NextResponse.json({
    ok: true,
    transcriptLines: useTranscript.length,
  });
}
