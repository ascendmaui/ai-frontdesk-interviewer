import { NextResponse } from "next/server";
import {
  certificationCheck,
  CERT_PITCH_PASS,
  CERT_ROLEPLAY_PASSES,
} from "@/lib/certification";
import { runProductionReadyEffects } from "@/lib/closer-ready";
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
  TrainingState,
  TranscriptLine,
} from "@/lib/types";
import { INCOMPLETE_SEC } from "@/lib/types";
import { candidateAuthError } from "@/lib/candidate-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    interviewId?: string;
    transcript?: TranscriptLine[];
    durationSec?: number;
    multitaskAnswers?: MultitaskAnswer[];
    eventTypes?: string[];
    force?: boolean;
    token?: string;
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
  const access = candidateAuthError(req, existing, body.token);
  if (access) return access;

  const kind = existing.kind || "screening";
  const clientTx = Array.isArray(body.transcript) ? body.transcript : [];
  const savedTx = existing.transcript || [];
  const transcript = clientTx.length >= savedTx.length ? clientTx : savedTx;
  const durationSec =
    typeof body.durationSec === "number"
      ? body.durationSec
      : existing.durationSec || 0;

  let multitask: MultitaskResult | undefined = existing.multitaskQuiz;
  if (Array.isArray(body.multitaskAnswers) && body.multitaskAnswers.length) {
    multitask = scoreMultitask(body.multitaskAnswers);
  }

  if (existing.status === "completed" && existing.scorecard) {
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
    scorecard = {
      ...scorecard,
      recommendation: hireVerdict.decision,
      overallScore: hireVerdict.overallScore,
    };

    const incomplete = durationSec > 0 && durationSec < INCOMPLETE_SEC;
    const status = incomplete ? "abandoned" : "completed";

    let pipelineStatus: PipelineStatus = existing.pipelineStatus;
    let hmInterviewId = existing.hmInterviewId;
    const onboardingInterviewId = existing.onboardingInterviewId;
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
      const passed = !incomplete && score >= CERT_PITCH_PASS;
      const rootId = existing.rootId || existing.parentId || interviewId;
      const root = await getInterview(rootId);
      const prior: TrainingState = root?.training ||
        existing.training || { modulesRead: [], quizAttempts: 0 };
      const roleplayAttempts = (prior.roleplayAttempts || 0) + 1;
      const roleplayPasses = (prior.roleplayPasses || 0) + (passed ? 1 : 0);
      const bestPitchScore = Math.max(prior.bestPitchScore || 0, score);
      const nextTrain: TrainingState = {
        ...prior,
        practicePitchSessionId: interviewId,
        practicePitchScore: score,
        bestPitchScore,
        roleplayAttempts,
        roleplayPasses,
        practicePitchPassed: roleplayPasses >= CERT_ROLEPLAY_PASSES,
      };
      training = nextTrain;
      practicePitchSessionId = interviewId;

      if (root) {
        await updateInterview(rootId, {
          training: nextTrain,
          practicePitchSessionId: interviewId,
          pipelineStatus:
            root.pipelineStatus === "production_ready"
              ? "production_ready"
              : "training_in_progress",
        });
        const refreshed = (await getInterview(rootId)) || root;
        const cert = certificationCheck(refreshed);
        if (cert.certified && refreshed.pipelineStatus !== "production_ready") {
          training = {
            ...nextTrain,
            completedAt: nextTrain.completedAt || new Date().toISOString(),
          };
          await updateInterview(rootId, {
            training,
            pipelineStatus: "production_ready",
          });
          pipelineStatus = "production_ready";
        } else {
          pipelineStatus = refreshed.pipelineStatus;
        }
      }

      scorecard = {
        ...scorecard,
        recommendation: passed ? "yes" : "maybe",
        nextStep: passed
          ? roleplayPasses >= CERT_ROLEPLAY_PASSES
            ? "Roleplay gate passed. Complete any remaining certification blockers."
            : `Pass ${CERT_ROLEPLAY_PASSES - roleplayPasses} more roleplay at ${CERT_PITCH_PASS}/10 or higher.`
          : `Practice again. Certification requires ${CERT_PITCH_PASS}/10 or higher on ${CERT_ROLEPLAY_PASSES} roleplays.`,
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
        ...(kind === "practice_pitch" && training ? { training } : {}),
      });
    } else {
      await updateInterview(rootId, {
        hmInterviewId,
        onboardingInterviewId,
        pipelineStatus,
        offer,
        setupTasks,
        ...(training ? { training } : {}),
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

    let hearthlineProvision = null;
    let territory = null;
    const rootAfter = (await getInterview(rootId)) || interview;
    if (rootAfter.pipelineStatus === "production_ready") {
      const effects = await runProductionReadyEffects(rootAfter, {
        trigger:
          kind === "practice_pitch"
            ? "auto_roleplay_certification_complete"
            : "auto_stage_complete",
      });
      hearthlineProvision = effects.hearthlineProvision;
      territory = effects.territory;
    }

    return NextResponse.json({
      interview,
      nextSession: childSession
        ? { id: childSession.id, kind: childSession.kind }
        : null,
      offerToken: offer?.token,
      certification:
        kind === "practice_pitch" ? certificationCheck(rootAfter) : undefined,
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
