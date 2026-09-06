import { NextResponse } from "next/server";
import {
  certificationCheck,
  CERT_PITCH_PASS,
  CERT_QUIZ_PASS,
  CERT_ROLEPLAY_PASSES,
} from "@/lib/certification";
import { runProductionReadyEffects } from "@/lib/closer-ready";
import { portalAuthError } from "@/lib/portal-auth";
import {
  SALES_CORE_MODULES,
  SALES_CORE_QUIZ,
} from "@/lib/sales-curriculum";
import { getAcademyForRole } from "@/lib/training-content";
import {
  createInterview,
  getInterview,
  newId,
  updateInterview,
} from "@/lib/store";
import type { InterviewRecord, TrainingState } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t") || "";
  const record = await getInterview(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const rootId = record.rootId || record.id;
  const root = (await getInterview(rootId)) || record;
  const auth = portalAuthError(t, root.portalToken);
  if (auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const academy = getAcademyForRole(root.roleSlug);
  const modules = [...SALES_CORE_MODULES, ...academy.modules];
  const quiz = [...SALES_CORE_QUIZ, ...academy.quiz];

  return NextResponse.json({
    academy: {
      title: academy.title,
      industry: academy.industry,
      tagline: academy.tagline,
      processSteps: academy.processSteps,
      talkTracks: academy.talkTracks,
      objections: academy.objections,
    },
    modules: modules.map(({ id, title, minutes, body }) => ({
      id,
      title,
      minutes,
      body,
    })),
    quiz: quiz.map(({ id, prompt, options }) => ({ id, prompt, options })),
    training: root.training || { modulesRead: [], quizAttempts: 0 },
    roleSlug: root.roleSlug,
    passMark: Math.round(CERT_QUIZ_PASS * 100),
    pitchPass: CERT_PITCH_PASS,
    roleplayRequired: CERT_ROLEPLAY_PASSES,
    certification: certificationCheck(root),
    pipelineStatus: root.pipelineStatus,
    portalToken: root.portalToken,
    hmInterviewId: root.hmInterviewId,
    onboardingInterviewId: root.onboardingInterviewId,
    offerToken: root.offer?.token,
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let body: {
    token?: string;
    action?: string;
    moduleId?: string;
    answers?: Record<string, number>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const record = await getInterview(id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const rootId = record.rootId || record.id;
  const root = (await getInterview(rootId)) || record;
  const auth = portalAuthError(body.token, root.portalToken);
  if (auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const academy = getAcademyForRole(root.roleSlug);
  const modules = [...SALES_CORE_MODULES, ...academy.modules];
  const quiz = [...SALES_CORE_QUIZ, ...academy.quiz];
  const training: TrainingState = {
    modulesRead: [...(root.training?.modulesRead || [])],
    quizScore: root.training?.quizScore,
    quizPassed: root.training?.quizPassed,
    quizAttempts: root.training?.quizAttempts || 0,
    practicePitchSessionId: root.training?.practicePitchSessionId,
    practicePitchScore: root.training?.practicePitchScore,
    practicePitchPassed: root.training?.practicePitchPassed,
    roleplayAttempts: root.training?.roleplayAttempts || 0,
    roleplayPasses: root.training?.roleplayPasses || 0,
    bestPitchScore: root.training?.bestPitchScore,
    completedAt: root.training?.completedAt,
  };

  if (body.action === "read_module" && body.moduleId) {
    if (!modules.some((m) => m.id === body.moduleId)) {
      return NextResponse.json({ error: "Unknown module" }, { status: 400 });
    }
    if (!training.modulesRead.includes(body.moduleId)) {
      training.modulesRead.push(body.moduleId);
    }
    await updateInterview(rootId, {
      training,
      pipelineStatus:
        root.pipelineStatus === "production_ready"
          ? "production_ready"
          : "training_in_progress",
    });
    const final = await finalizeCertification(rootId);
    return NextResponse.json({ ok: true, training: final.root.training, certification: final.certification });
  }

  if (body.action === "submit_quiz" && body.answers) {
    let correct = 0;
    for (const q of quiz) {
      if (body.answers[q.id] === q.correctIndex) correct += 1;
    }
    const score = quiz.length ? correct / quiz.length : 0;
    training.quizAttempts += 1;
    training.quizScore = Math.round(score * 100);
    training.quizPassed = score >= CERT_QUIZ_PASS;

    await updateInterview(rootId, {
      training,
      pipelineStatus:
        root.pipelineStatus === "production_ready"
          ? "production_ready"
          : "training_in_progress",
    });
    const final = await finalizeCertification(rootId);
    return NextResponse.json({
      ok: true,
      training: final.root.training,
      correct,
      total: quiz.length,
      passed: training.quizPassed,
      pipelineStatus: final.root.pipelineStatus,
      certification: final.certification,
      hearthlineProvision: final.hearthlineProvision,
      territory: final.territory,
    });
  }

  if (body.action === "start_pitch") {
    const currentId = root.training?.practicePitchSessionId;
    if (currentId) {
      const current = await getInterview(currentId);
      if (current && (current.status === "applied" || current.status === "in_progress")) {
        return NextResponse.json({
          ok: true,
          interviewPath: `/interview/${current.id}`,
          resumed: true,
        });
      }
    }

    const child = await createPitch(root);
    training.practicePitchSessionId = child.id;
    await updateInterview(rootId, {
      practicePitchSessionId: child.id,
      training,
      pipelineStatus: "training_in_progress",
    });
    return NextResponse.json({
      ok: true,
      interviewPath: `/interview/${child.id}`,
      roleplayPasses: training.roleplayPasses || 0,
      roleplayRequired: CERT_ROLEPLAY_PASSES,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function createPitch(parent: InterviewRecord): Promise<InterviewRecord> {
  const id = newId();
  const rootId = parent.rootId || parent.id;
  const record: InterviewRecord = {
    id,
    rootId,
    parentId: parent.id,
    kind: "practice_pitch",
    department: "sales_closer",
    roleSlug: parent.roleSlug,
    status: "applied",
    pipelineStatus: "training_in_progress",
    portalToken: parent.portalToken,
    candidate: parent.candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: parent.training || { modulesRead: [], quizAttempts: 0 },
  };
  await createInterview(record);
  return record;
}

async function finalizeCertification(rootId: string): Promise<{
  root: InterviewRecord;
  certification: ReturnType<typeof certificationCheck>;
  hearthlineProvision: Awaited<ReturnType<typeof runProductionReadyEffects>>["hearthlineProvision"] | null;
  territory: Awaited<ReturnType<typeof runProductionReadyEffects>>["territory"] | null;
}> {
  let root = await getInterview(rootId);
  if (!root) throw new Error("Root application not found");
  let certification = certificationCheck(root);
  let hearthlineProvision = null;
  let territory = null;

  if (certification.certified && root.pipelineStatus !== "production_ready") {
    const training: TrainingState = {
      ...(root.training || { modulesRead: [], quizAttempts: 0 }),
      completedAt: root.training?.completedAt || new Date().toISOString(),
    };
    root =
      (await updateInterview(rootId, {
        training,
        pipelineStatus: "production_ready",
      })) || root;
    certification = certificationCheck(root);
    const effects = await runProductionReadyEffects(root, {
      trigger: "auto_certification_complete",
    });
    hearthlineProvision = effects.hearthlineProvision;
    territory = effects.territory;
  }

  return { root, certification, hearthlineProvision, territory };
}
