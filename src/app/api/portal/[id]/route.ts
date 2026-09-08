import { NextResponse } from "next/server";
import { COMPANY } from "@/lib/company";
import { pipelineSteps } from "@/lib/pipeline";
import {
  listTerritories,
  upsertTerritory,
} from "@/lib/platform-store";
import { portalAuthError } from "@/lib/portal-auth";
import { getRole } from "@/lib/roles";
import { setupProgress } from "@/lib/setup-tasks";
import { getInterview, updateInterview } from "@/lib/store";
import {
  AREA_CODE_REGIONS,
  extractAreaCode,
} from "@/lib/territories";

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

  const auth = portalAuthError(t, root.portalToken);
  if (auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const role = getRole(root.roleSlug);
  const progress = setupProgress(root.setupTasks);

  const osBase = (
    process.env.HEARTHLINE_OS_URL ||
    process.env.NEXT_PUBLIC_HEARTHLINE_OS_URL ||
    "https://hearthline-platform.vercel.app"
  ).replace(/\/$/, "");

  const territories = await listTerritories().catch(() => []);
  const myTerritory = territories.find((x) => x.closerId === root.id) || null;
  const phoneNpa = extractAreaCode(root.candidate.phone || "");

  // Candidate-safe: never expose scores / multitask / hire verdicts
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
      phone: root.candidate.phone,
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
    training: {
      modulesRead: root.training?.modulesRead || [],
      quizPassed: root.training?.quizPassed,
      practicePitchPassed: root.training?.practicePitchPassed,
    },
    calendarUrl: COMPANY.calendarUrl || null,
    territory: myTerritory
      ? {
          areaCodes: myTerritory.areaCodes,
          states: myTerritory.states,
          active: myTerritory.active,
        }
      : null,
    suggestedAreaCode: phoneNpa || null,
    areaCodeOptions: AREA_CODE_REGIONS.slice(0, 80),
    canEditTerritory: [
      "setup_in_progress",
      "setup_complete",
      "training_in_progress",
      "training_complete",
      "production_ready",
      "onboarding_complete",
    ].includes(root.pipelineStatus),
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: {
    token?: string;
    taskId?: string;
    complete?: boolean;
    action?: string;
    areaCodes?: string[];
    states?: string[];
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const auth = portalAuthError(body.token, root.portalToken);
  if (auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Territory self-serve
  if (body.action === "save_territory") {
    const allowed = [
      "setup_in_progress",
      "setup_complete",
      "training_in_progress",
      "training_complete",
      "production_ready",
      "onboarding_complete",
    ].includes(root.pipelineStatus);
    if (!allowed) {
      return NextResponse.json(
        { error: "Territory unlocks after onboarding" },
        { status: 403 },
      );
    }
    let areaCodes = Array.isArray(body.areaCodes)
      ? body.areaCodes
          .map((c) => String(c).replace(/\D/g, "").slice(0, 3))
          .filter((c) => c.length === 3)
      : [];
    const phoneNpa = extractAreaCode(root.candidate.phone || "");
    if (phoneNpa && !areaCodes.includes(phoneNpa)) {
      areaCodes = [phoneNpa, ...areaCodes];
    }
    if (!areaCodes.length) {
      return NextResponse.json(
        { error: "Select at least one area code" },
        { status: 400 },
      );
    }
    areaCodes = [...new Set(areaCodes)].slice(0, 12);
    const states = Array.isArray(body.states)
      ? body.states
          .map((s) => String(s).toUpperCase().slice(0, 2))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    try {
      const territory = await upsertTerritory({
        closerId: root.id,
        closerName:
          `${root.candidate.firstName} ${root.candidate.lastName}`.trim(),
        email: root.candidate.email,
        phone: root.candidate.phone,
        roleSlug: root.roleSlug,
        areaCodes,
        states,
        active: true,
      });
      return NextResponse.json({
        ok: true,
        territory: {
          areaCodes: territory.areaCodes,
          states: territory.states,
          active: territory.active,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
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
