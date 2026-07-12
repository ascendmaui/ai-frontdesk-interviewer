import { NextResponse } from "next/server";
import { createOffer } from "@/lib/offer";
import { notifyStageComplete } from "@/lib/notifications";
import { buildSetupTasks } from "@/lib/setup-tasks";
import {
  createInterview,
  getInterview,
  listApplications,
  newId,
  updateInterview,
} from "@/lib/store";
import type { InterviewRecord, PipelineStatus } from "@/lib/types";

export const runtime = "nodejs";

function authed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(body.id || "");
  const action = String(body.action || "");
  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "reject") {
    await updateInterview(id, { pipelineStatus: "rejected" });
    return NextResponse.json({ ok: true, pipelineStatus: "rejected" });
  }

  if (action === "production_ready") {
    await updateInterview(id, { pipelineStatus: "production_ready" });
    return NextResponse.json({ ok: true, pipelineStatus: "production_ready" });
  }

  if (action === "send_offer") {
    const offer = createOffer(root.roleSlug);
    await updateInterview(id, {
      offer,
      pipelineStatus: "offer_pending",
    });
    const updated = await getInterview(id);
    if (updated) {
      await notifyStageComplete({
        ...updated,
        kind: "hiring_manager",
        scorecard: {
          recommendation: "yes",
          overallScore: updated.scorecard?.overallScore || 8,
          summary: "Admin issued offer.",
        },
      });
    }
    return NextResponse.json({ ok: true, offerToken: offer.token });
  }

  if (action === "force_hm") {
    if (!root.hmInterviewId) {
      const child = await spawn(root, "hiring_manager");
      await updateInterview(id, {
        hmInterviewId: child.id,
        pipelineStatus: "hm_invited",
      });
      return NextResponse.json({ ok: true, hmInterviewId: child.id });
    }
    await updateInterview(id, { pipelineStatus: "hm_invited" });
    return NextResponse.json({ ok: true, hmInterviewId: root.hmInterviewId });
  }

  if (action === "force_onboarding") {
    let oid = root.onboardingInterviewId;
    if (!oid) {
      const child = await spawn(root, "onboarding");
      oid = child.id;
    }
    await updateInterview(id, {
      onboardingInterviewId: oid,
      pipelineStatus: "onboarding_invited",
      setupTasks: root.setupTasks?.length ? root.setupTasks : buildSetupTasks(),
      offer: root.offer
        ? { ...root.offer, status: "accepted", acceptedAt: new Date().toISOString() }
        : root.offer,
    });
    return NextResponse.json({ ok: true, onboardingInterviewId: oid });
  }

  if (action === "list") {
    const apps = await listApplications(200);
    return NextResponse.json({ interviews: apps });
  }

  if (action === "reanalyze") {
    const { evaluateTranscript } = await import("@/lib/evaluate");
    const { applyDecision } = await import("@/lib/decision");
    const { buildHireVerdict } = await import("@/lib/hire-analysis");
    const { mergeMultitaskIntoScorecard } = await import("@/lib/pipeline");

    const transcript = root.transcript || [];
    const durationSec = root.durationSec || 0;
    let scorecard = await evaluateTranscript({
      roleSlug: root.roleSlug,
      candidateName: `${root.candidate.firstName} ${root.candidate.lastName}`,
      transcript,
      durationSec,
      kind: root.kind || "screening",
      multitask: root.multitaskQuiz,
    });
    scorecard = applyDecision(scorecard, durationSec);
    if (root.kind === "screening" && root.multitaskQuiz) {
      scorecard = mergeMultitaskIntoScorecard(scorecard, root.multitaskQuiz);
      scorecard = applyDecision(scorecard, durationSec);
    }
    const hireVerdict = buildHireVerdict({
      scorecard,
      multitask: root.multitaskQuiz,
      transcript,
      durationSec,
    });
    scorecard = {
      ...scorecard,
      recommendation: hireVerdict.decision,
      overallScore: hireVerdict.overallScore,
    };
    await updateInterview(id, {
      scorecard,
      hireVerdict,
      status: root.status === "in_progress" ? "completed" : root.status,
      completedAt: root.completedAt || new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, hireVerdict, scorecard });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function spawn(
  parent: InterviewRecord,
  kind: "hiring_manager" | "onboarding",
): Promise<InterviewRecord> {
  const id = newId();
  const rootId = parent.rootId || parent.id;
  const status: PipelineStatus =
    kind === "hiring_manager" ? "hm_invited" : "onboarding_invited";
  const record: InterviewRecord = {
    id,
    rootId,
    parentId: parent.id,
    kind,
    department: "sales_closer",
    roleSlug: parent.roleSlug,
    status: "applied",
    pipelineStatus: status,
    portalToken: parent.portalToken,
    candidate: parent.candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: parent.training || { modulesRead: [], quizAttempts: 0 },
  };
  await createInterview(record);
  return record;
}
