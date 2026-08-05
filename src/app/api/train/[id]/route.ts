import { NextResponse } from "next/server";
import {
  getAcademyForRole,
  PITCH_PASS,
  QUIZ_PASS,
} from "@/lib/training-content";
import {
  createInterview,
  getInterview,
  newId,
  updateInterview,
} from "@/lib/store";
import type { InterviewRecord } from "@/lib/types";
import { provisionToHearthlineOs } from "@/lib/hearthline-os";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t") || "";
  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (t && root.portalToken !== t) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const academy = getAcademyForRole(root.roleSlug);

  return NextResponse.json({
    academy: {
      title: academy.title,
      industry: academy.industry,
      tagline: academy.tagline,
      processSteps: academy.processSteps,
      talkTracks: academy.talkTracks,
      objections: academy.objections,
    },
    modules: academy.modules.map(({ id, title, minutes, body }) => ({
      id,
      title,
      minutes,
      body,
    })),
    quiz: academy.quiz.map(({ id, prompt, options }) => ({
      id,
      prompt,
      options,
    })),
    training: root.training || { modulesRead: [], quizAttempts: 0 },
    roleSlug: root.roleSlug,
    passMark: Math.round(QUIZ_PASS * 100),
    pitchPass: PITCH_PASS,
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

  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (body.token && root.portalToken !== body.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const academy = getAcademyForRole(root.roleSlug);

  const training = {
    modulesRead: [...(root.training?.modulesRead || [])],
    quizScore: root.training?.quizScore,
    quizPassed: root.training?.quizPassed,
    quizAttempts: root.training?.quizAttempts || 0,
    practicePitchSessionId: root.training?.practicePitchSessionId,
    practicePitchScore: root.training?.practicePitchScore,
    practicePitchPassed: root.training?.practicePitchPassed,
    completedAt: root.training?.completedAt,
  };

  if (body.action === "read_module" && body.moduleId) {
    if (!training.modulesRead.includes(body.moduleId)) {
      training.modulesRead.push(body.moduleId);
    }
    await updateInterview(id, {
      training,
      pipelineStatus:
        root.pipelineStatus === "setup_complete" ||
        root.pipelineStatus === "setup_in_progress"
          ? "training_in_progress"
          : root.pipelineStatus,
    });
    return NextResponse.json({ ok: true, training });
  }

  if (body.action === "submit_quiz" && body.answers) {
    let correct = 0;
    for (const q of academy.quiz) {
      if (body.answers[q.id] === q.correctIndex) correct += 1;
    }
    const score = correct / academy.quiz.length;
    training.quizAttempts += 1;
    training.quizScore = Math.round(score * 100);
    training.quizPassed = score >= QUIZ_PASS;

    let pipelineStatus = root.pipelineStatus;
    if (
      training.quizPassed &&
      training.practicePitchPassed &&
      training.modulesRead.length >= 3
    ) {
      training.completedAt = new Date().toISOString();
      pipelineStatus = "production_ready";
    } else {
      pipelineStatus = "training_in_progress";
    }

    await updateInterview(id, { training, pipelineStatus });
    let hearthlineProvision = null;
    if (pipelineStatus === "production_ready") {
      const latest = (await getInterview(id)) || root;
      hearthlineProvision = await provisionToHearthlineOs(latest);
    }
    return NextResponse.json({
      ok: true,
      training,
      correct,
      total: academy.quiz.length,
      passed: training.quizPassed,
      pipelineStatus,
      hearthlineProvision,
    });
  }

  if (body.action === "start_pitch") {
    let pitchId = root.practicePitchSessionId;
    if (!pitchId) {
      const child = await createPitch(root);
      pitchId = child.id;
      training.practicePitchSessionId = pitchId;
      await updateInterview(id, {
        practicePitchSessionId: pitchId,
        training,
        pipelineStatus: "training_in_progress",
      });
    }
    return NextResponse.json({
      ok: true,
      interviewPath: `/interview/${pitchId}`,
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
