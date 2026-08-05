import { NextResponse } from "next/server";
import { applyDecision } from "@/lib/decision";
import { evaluateTranscript } from "@/lib/evaluate";
import { buildHireVerdict } from "@/lib/hire-analysis";
import {
  scoreMultitask,
  type MultitaskAnswer,
  type MultitaskResult,
} from "@/lib/multitask-quiz";
import { notifyStageComplete } from "@/lib/notifications";
import { createOffer } from "@/lib/offer";
import {
  hmOutcome,
  mergeMultitaskIntoScorecard,
  onboardingOutcome,
  screeningOutcome,
} from "@/lib/pipeline";
import { buildSetupTasks } from "@/lib/setup-tasks";
import {
  createInterview,
  getInterview,
  newId,
  newPortalToken,
  updateInterview,
} from "@/lib/store";
import type {
  InterviewRecord,
  PipelineStatus,
  TranscriptLine,
} from "@/lib/types";
import { INCOMPLETE_SEC } from "@/lib/types";
import { provisionToHearthlineOs } from "@/lib/hearthline-os";
import { activateCloserTerritory } from "@/lib/platform-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    interviewId?: string;
    transcript?: TranscriptLine[];
    durationSec?: number;
    multitaskAnswers?: MultitaskAnswer[];
    eventTypes?: string[];
    force?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const interviewId = String(body.interviewId || "");
  if (!interviewId) {
    return NextResponse.json(
      { error: "interviewId is required" },
      { status: 400 },
    );
  }

  const existing = await getInterview(interviewId);
  if (!existing) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const kind = existing.kind || "screening";
  // Prefer the richer of client vs already-synced transcript
  const clientTx = Array.isArray(body.transcript) ? body.transcript : [];
  const savedTx = existing.transcript || [];
  const transcript =
    clientTx.length >= savedTx.length ? clientTx : savedTx;
  const durationSec =
    typeof body.durationSec === "number"
      ? body.durationSec
      : existing.durationSec || 0;

  let multitask: MultitaskResult | undefined = existing.multitaskQuiz;
  if (Array.isArray(body.multitaskAnswers) && body.multitaskAnswers.length) {
    multitask = scoreMultitask(body.multitaskAnswers);
  }

  if (existing.status === "completed" && existing.scorecard && !body.force) {
    return NextResponse.json({ interview: existing, cached: true });
  }

  try {
    let scorecard = await evaluateTranscript({
      roleSlug: existing.roleSlug,
      candidateName: `${existing.candidate.firstName} ${existing.candidate.lastName}`,
      transcript,
      durationSec,
      kind: kind === "practice_pitch" ? "hiring_manager" : kind,
      multitask,
    });
    scorecard = applyDecision(scorecard, durationSec);
    if (kind === "screening" && multitask) {
      scorecard = mergeMultitaskIntoScorecard(scorecard, multitask);
      scorecard = applyDecision(scorecard, durationSec);
    }

    const hireVerdict = buildHireVerdict({
      scorecard,
      multitask,
      transcript,
      durationSec,
    });
    // Align scorecard recommendation with guarded verdict
    scorecard = {
      ...scorecard,
      recommendation: hireVerdict.decision,
      overallScore: hireVerdict.overallScore,
    };

    const incomplete = durationSec > 0 && durationSec < INCOMPLETE_SEC;
    const status = incomplete ? "abandoned" : "completed";

    let pipelineStatus: PipelineStatus = existing.pipelineStatus;
    let hmInterviewId = existing.hmInterviewId;
    let onboardingInterviewId = existing.onboardingInterviewId;
    let practicePitchSessionId = existing.practicePitchSessionId;
    let offer = existing.offer;
    let setupTasks = existing.setupTasks;
    let training = existing.training;
    let childSession: InterviewRecord | null = null;

    if (kind === "screening") {
      if (incomplete) {
        pipelineStatus = "waitlisted";
      } else {
        const out = screeningOutcome(scorecard, multitask);
        scorecard = { ...scorecard, recommendation: out.recommendation };
        pipelineStatus = out.pipelineStatus;
        if (out.advanceToHm) {
          childSession = await createChildSession(existing, "hiring_manager");
          hmInterviewId = childSession.id;
        }
      }
    } else if (kind === "hiring_manager") {
      if (incomplete) {
        pipelineStatus = "hm_maybe";
      } else {
        const out = hmOutcome(scorecard);
        pipelineStatus = out.pipelineStatus;
        if (out.createOffer) {
          offer = createOffer(existing.roleSlug);
        }
      }
    } else if (kind === "onboarding") {
      pipelineStatus = incomplete
        ? "onboarding_incomplete"
        : onboardingOutcome(scorecard);
      if (pipelineStatus === "setup_in_progress") {
        setupTasks = buildSetupTasks();
      }
    } else if (kind === "practice_pitch") {
      const score = Number(scorecard.overallScore) || 0;
      const passed = score >= 7;
      training = {
        ...(existing.training || { modulesRead: [], quizAttempts: 0 }),
        practicePitchSessionId: interviewId,
        practicePitchScore: score,
        practicePitchPassed: passed,
      };
      const rootId = existing.rootId || existing.parentId || interviewId;
      const root = await getInterview(rootId);
      if (root) {
        const quizOk = root.training?.quizPassed;
        const modulesOk = (root.training?.modulesRead?.length || 0) >= 3;
        const nextTrain =
          quizOk && modulesOk && passed
            ? {
                ...training,
                modulesRead: root.training?.modulesRead || [],
                quizScore: root.training?.quizScore,
                quizPassed: root.training?.quizPassed,
                quizAttempts: root.training?.quizAttempts || 0,
                completedAt: new Date().toISOString(),
              }
            : {
                ...root.training,
                ...training,
              };
        pipelineStatus =
          quizOk && modulesOk && passed
            ? "production_ready"
            : "training_in_progress";
        await updateInterview(rootId, {
          training: nextTrain,
          practicePitchSessionId: interviewId,
          pipelineStatus,
        });
        training = nextTrain;
      }
      scorecard = {
        ...scorecard,
        recommendation: passed ? "yes" : "maybe",
      };
    }

    let interview = await updateInterview(interviewId, {
      status,
      transcript,
      durationSec,
      completedAt: new Date().toISOString(),
      scorecard,
      hireVerdict,
      multitaskQuiz: multitask,
      pipelineStatus,
      hmInterviewId,
      onboardingInterviewId,
      practicePitchSessionId,
      offer,
      setupTasks,
      training,
      eventTypes: Array.isArray(body.eventTypes)
        ? body.eventTypes.slice(-80)
        : existing.eventTypes,
    });

    if (!interview) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    const rootId = interview.rootId || interview.id;
    if (rootId !== interviewId) {
      await updateInterview(rootId, {
        pipelineStatus:
          kind === "practice_pitch"
            ? (await getInterview(rootId))?.pipelineStatus || pipelineStatus
            : pipelineStatus,
        ...(hmInterviewId ? { hmInterviewId } : {}),
        ...(onboardingInterviewId ? { onboardingInterviewId } : {}),
        ...(offer ? { offer } : {}),
        ...(setupTasks ? { setupTasks } : {}),
      });
    } else {
      await updateInterview(rootId, {
        hmInterviewId,
        onboardingInterviewId,
        pipelineStatus,
        offer,
        setupTasks,
      });
    }

    if (kind === "hiring_manager" && offer) {
      await updateInterview(rootId, {
        offer,
        pipelineStatus: "offer_pending",
      });
      interview =
        (await updateInterview(interviewId, {
          offer,
          pipelineStatus: "offer_pending",
        })) || interview;
    }

    const hasSpeech = transcript.some(
      (t) => t.role === "user" && t.text.trim().length > 5,
    );
    let notifications = interview.notifications || {};

    if (hasSpeech || status === "completed") {
      const rootForNotify = (await getInterview(rootId)) || interview;
      const results = await notifyStageComplete(
        {
          ...interview,
          offer: offer || interview.offer || rootForNotify.offer,
        },
        {
          nextSession: childSession,
          root: rootForNotify,
        },
      );
      const at = new Date().toISOString();
      notifications = {
        slack: { ...results.slack, at },
        emailCandidate: { ...results.emailCandidate, at },
        emailInternal: { ...results.emailInternal, at },
      };
      interview =
        (await updateInterview(interviewId, { notifications })) || interview;
    }

    // When training finishes → production_ready, provision into Hearthline OS
    // and activate area-code territory so marketing leads route to them
    let hearthlineProvision = null;
    let territory = null;
    const rootAfter = (await getInterview(rootId)) || interview;
    if (
      rootAfter.pipelineStatus === "production_ready" ||
      pipelineStatus === "production_ready"
    ) {
      hearthlineProvision = await provisionToHearthlineOs(rootAfter, {
        trigger: "auto_practice_pitch_complete",
      });
      try {
        territory = await activateCloserTerritory({
          closerId: rootId,
          closerName: `${rootAfter.candidate.firstName} ${rootAfter.candidate.lastName}`.trim(),
          email: rootAfter.candidate.email,
          phone: rootAfter.candidate.phone,
          roleSlug: rootAfter.roleSlug,
        });
      } catch (e) {
        console.error("[complete] territory activate failed", e);
      }
    }

    return NextResponse.json({
      interview,
      nextSession: childSession
        ? { id: childSession.id, kind: childSession.kind }
        : null,
      offerToken: offer?.token,
      hearthlineProvision,
      territory,
      cached: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Complete failed";
    await updateInterview(interviewId, {
      transcript,
      durationSec,
      multitaskQuiz: multitask,
      status: "error",
      errorMessage: message,
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function createChildSession(
  parent: InterviewRecord,
  kind: "hiring_manager" | "onboarding" | "practice_pitch",
): Promise<InterviewRecord> {
  const id = newId();
  const rootId = parent.rootId || parent.id;
  const root = (await getInterview(rootId)) || parent;
  const record: InterviewRecord = {
    id,
    rootId,
    parentId: parent.id,
    kind,
    department: "sales_closer",
    roleSlug: parent.roleSlug,
    status: "applied",
    pipelineStatus:
      kind === "hiring_manager"
        ? "hm_invited"
        : kind === "onboarding"
          ? "onboarding_invited"
          : "training_in_progress",
    portalToken: root.portalToken || newPortalToken(),
    candidate: parent.candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: root.training || { modulesRead: [], quizAttempts: 0 },
  };
  await createInterview(record);
  return record;
}
