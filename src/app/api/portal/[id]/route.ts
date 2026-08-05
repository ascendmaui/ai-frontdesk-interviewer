import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { pipelineSteps } from "@/lib/pipeline";
import { getRole } from "@/lib/roles";
import { setupProgress } from "@/lib/setup-tasks";
import { getInterview, updateInterview } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";

  const interview = await getInterview(id);
  if (!interview) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Always load root application
  const rootId = interview.rootId || interview.id;
  const root = (await getInterview(rootId)) || interview;

  if (t && root.portalToken && t !== root.portalToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = getRole(root.roleSlug);
  const progress = setupProgress(root.setupTasks);

  const osBase = (
    process.env.HEARTHLINE_OS_URL ||
    process.env.NEXT_PUBLIC_HEARTHLINE_OS_URL ||
    "https://hearthline-gold.vercel.app"
  ).replace(/\/$/, "");

  return NextResponse.json({
    id: root.id,
    portalToken: root.portalToken,
    roleSlug: root.roleSlug,
    roleTitle: role?.title,
    roleEmoji: role?.emoji,
    industry: role?.industry,
    pipelineStatus: root.pipelineStatus,
    hearthlineOs: {
      loginUrl: `${osBase}/os/login`,
      jobKitUrl: `${osBase}/os/job-kit`,
      dashboardUrl: `${osBase}/os`,
      playbookUrl: `${osBase}/os/playbook`,
      note:
        "Sign in with the same Google email you applied with. Your seat, leads, and job kit unlock after production ready.",
    },
    steps: pipelineSteps(root.pipelineStatus),
    candidate: {
      firstName: root.candidate.firstName,
      lastName: root.candidate.lastName,
      email: root.candidate.email,
    },
    hmInterviewId: root.hmInterviewId,
    onboardingInterviewId: root.onboardingInterviewId,
    offer: root.offer
      ? {
          token: root.offer.token,
          status: root.offer.status,
          title: root.offer.title,
        }
      : null,
    setupTasks: root.setupTasks || [],
    setupProgress: progress,
    training: root.training || { modulesRead: [], quizAttempts: 0 },
    calendarUrl: COMPANY.calendarUrl || null,
    screeningScore: root.scorecard?.overallScore,
    multitask: root.multitaskQuiz
      ? {
          score: root.multitaskQuiz.multitaskScore,
          correct: root.multitaskQuiz.correctCount,
          scored: root.multitaskQuiz.scoredCount,
        }
      : null,
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: { token?: string; taskId?: string; complete?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (body.token && root.portalToken !== body.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!body.taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  const tasks = [...(root.setupTasks || [])];
  const idx = tasks.findIndex((t) => t.id === body.taskId);
  if (idx < 0) {
    return NextResponse.json({ error: "Unknown task" }, { status: 404 });
  }

  if (body.complete !== false) {
    tasks[idx] = { ...tasks[idx], completedAt: new Date().toISOString() };
  } else {
    tasks[idx] = { ...tasks[idx], completedAt: undefined };
  }

  const progress = setupProgress(tasks);
  let pipelineStatus = root.pipelineStatus;
  if (
    progress.requiredDone &&
    (pipelineStatus === "setup_in_progress" ||
      pipelineStatus === "onboarding_complete" ||
      pipelineStatus === "onboarding_invited")
  ) {
    pipelineStatus = "training_in_progress";
  } else if (
    !progress.requiredDone &&
    root.offer?.status === "accepted" &&
    pipelineStatus !== "production_ready"
  ) {
    pipelineStatus = "setup_in_progress";
  }

  const updated = await updateInterview(id, {
    setupTasks: tasks,
    pipelineStatus,
    training: root.training || { modulesRead: [], quizAttempts: 0 },
  });

  return NextResponse.json({
    ok: true,
    setupTasks: updated?.setupTasks,
    setupProgress: progress,
    pipelineStatus: updated?.pipelineStatus,
  });
}
