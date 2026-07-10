import { NextResponse } from "next/server";
import { notifyStageComplete } from "@/lib/notifications";
import { publicAppUrl } from "@/lib/pipeline";
import { buildSetupTasks } from "@/lib/setup-tasks";
import {
  createInterview,
  getByOfferToken,
  getInterview,
  newId,
  updateInterview,
} from "@/lib/store";
import type { InterviewRecord } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const rec = await getByOfferToken(token);
  if (!rec?.offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  return NextResponse.json({
    title: rec.offer.title,
    body: rec.offer.body,
    status: rec.offer.status,
    roleSlug: rec.roleSlug,
    candidate: {
      firstName: rec.candidate.firstName,
      lastName: rec.candidate.lastName,
    },
    expiresAt: rec.offer.expiresAt,
    applicationId: rec.rootId || rec.id,
    portalToken: rec.portalToken,
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  let body: { action?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = body.action === "decline" ? "decline" : "accept";

  const rec = await getByOfferToken(token);
  if (!rec?.offer) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }
  if (rec.offer.status !== "pending") {
    return NextResponse.json({
      ok: true,
      status: rec.offer.status,
      applicationId: rec.rootId || rec.id,
    });
  }

  const rootId = rec.rootId || rec.id;
  const now = new Date().toISOString();

  if (action === "decline") {
    const offer = {
      ...rec.offer,
      status: "declined" as const,
      declinedAt: now,
    };
    await updateInterview(rootId, {
      offer,
      pipelineStatus: "offer_declined",
    });
    if (rec.id !== rootId) {
      await updateInterview(rec.id, { offer, pipelineStatus: "offer_declined" });
    }
    return NextResponse.json({
      ok: true,
      status: "declined",
      applicationId: rootId,
    });
  }

  // Accept → spawn onboarding if needed
  let onboardingId = rec.onboardingInterviewId;
  const root = (await getInterview(rootId)) || rec;
  if (!onboardingId) {
    const child = await createOnboarding(root);
    onboardingId = child.id;
  }

  const offer = {
    ...rec.offer,
    status: "accepted" as const,
    acceptedAt: now,
  };

  await updateInterview(rootId, {
    offer,
    pipelineStatus: "onboarding_invited",
    onboardingInterviewId: onboardingId,
    setupTasks: root.setupTasks?.length ? root.setupTasks : buildSetupTasks(),
  });

  // Slack/email soft notify
  const updated = await getInterview(rootId);
  if (updated) {
    await notifyStageComplete(
      {
        ...updated,
        kind: "onboarding",
        scorecard: {
          recommendation: "yes",
          overallScore: 10,
          summary: "Offer accepted — onboarding unlocked.",
        },
      },
      {
        nextSession: onboardingId
          ? await getInterview(onboardingId)
          : null,
      },
    ).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    status: "accepted",
    applicationId: rootId,
    onboardingPath: `/interview/${onboardingId}`,
    portalPath: `/portal/${rootId}?t=${root.portalToken}`,
    publicUrl: publicAppUrl(),
  });
}

async function createOnboarding(
  parent: InterviewRecord,
): Promise<InterviewRecord> {
  const id = newId();
  const rootId = parent.rootId || parent.id;
  const record: InterviewRecord = {
    id,
    rootId,
    parentId: parent.id,
    kind: "onboarding",
    department: "sales_closer",
    roleSlug: parent.roleSlug,
    status: "applied",
    pipelineStatus: "onboarding_invited",
    portalToken: parent.portalToken,
    candidate: parent.candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: parent.training || { modulesRead: [], quizAttempts: 0 },
  };
  await createInterview(record);
  return record;
}
