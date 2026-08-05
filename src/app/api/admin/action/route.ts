import { NextResponse } from "next/server";
import { createOffer } from "@/lib/offer";
import { notifyStageComplete } from "@/lib/notifications";
import { publicAppUrl } from "@/lib/pipeline";
import { buildSetupTasks } from "@/lib/setup-tasks";
import {
  createInterview,
  getInterview,
  listApplications,
  newId,
  newPortalToken,
  updateInterview,
} from "@/lib/store";
import type { InterviewKind, InterviewRecord, PipelineStatus } from "@/lib/types";
import { provisionToHearthlineOs } from "@/lib/hearthline-os";

export const runtime = "nodejs";

function authed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const q = new URL(req.url).searchParams.get("secret") || "";
  return token === secret || q === secret;
}

function links(root: InterviewRecord, extra?: Partial<InterviewRecord>) {
  const r = { ...root, ...extra };
  const base = publicAppUrl();
  return {
    appUrl: base,
    portalUrl: r.portalToken
      ? `${base}/portal/${r.rootId || r.id}?t=${r.portalToken}`
      : null,
    hmInterviewUrl: r.hmInterviewId
      ? `${base}/interview/${r.hmInterviewId}`
      : null,
    onboardingUrl: r.onboardingInterviewId
      ? `${base}/interview/${r.onboardingInterviewId}`
      : null,
    offerUrl: r.offer?.token ? `${base}/offer/${r.offer.token}` : null,
    trainUrl: r.portalToken
      ? `${base}/train/${r.rootId || r.id}?t=${r.portalToken}`
      : null,
    xaiConsoleUrl: "https://console.x.ai/",
    xaiVoiceDocsUrl:
      "https://docs.x.ai/developers/model-capabilities/audio/voice-agent",
  };
}

export async function POST(req: Request) {
  if (!authed(req)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — check ADMIN_SECRET matches Vercel env (dev-admin-change-me by default).",
      },
      { status: 401 },
    );
  }

  let body: { action?: string; id?: string; roleSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = String(body.action || "");

  // Create a full admin test candidate without doing the form/interview
  if (action === "create_test_user") {
    const roleSlug = String(body.roleSlug || "hvac-closer");
    const id = newId();
    const portalToken = newPortalToken();
    const mockTranscript = [
      {
        id: "sys_test",
        role: "system" as const,
        text: "Admin test session (simulated transcript).",
        at: Date.now(),
      },
      {
        id: "a_test1",
        role: "assistant" as const,
        text: "Hi Admin, welcome to your HVAC Sales Closer interview. I'm Jordan. Give me a 45-second intro.",
        at: Date.now(),
      },
      {
        id: "u_test1",
        role: "user" as const,
        text: "I'm Admin Tester. I've closed home services for three years, hit 110% of quota, average deal about four thousand, strong on inbound and follow-up.",
        at: Date.now(),
      },
      {
        id: "a_test2",
        role: "assistant" as const,
        text: "Great. Walk me through how you'd sell AI Front Office to a busy HVAC owner.",
        at: Date.now(),
      },
      {
        id: "u_test2",
        role: "user" as const,
        text: "I'd start with discovery — missed after-hours calls, how many jobs a week, who answers the phone. Then show every missed call is paid-for demand leaking. Recommend Front Office at 799 a month, book a kickoff this week.",
        at: Date.now(),
      },
    ];
    const record: InterviewRecord = {
      id,
      rootId: id,
      kind: "screening",
      department: "sales_closer",
      roleSlug,
      status: "completed",
      pipelineStatus: "hm_invited",
      portalToken,
      candidate: {
        firstName: "Admin",
        lastName: "Tester",
        email: process.env.HIRING_NOTIFY_EMAIL || "admin@hearthline.test",
        phone: "555-0100",
        yearsInSales: "3-5",
        industryExperience: "yes",
        consent: true,
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      durationSec: 600,
      transcript: mockTranscript,
      scorecard: {
        overallScore: 8,
        recommendation: "yes",
        summary:
          "Admin test profile seeded for pipeline walkthrough. Solid discovery and close language on a simulated HVAC pitch.",
        strengths: [
          "Clear quota story",
          "Discovery-first pitch",
          "Asks for kickoff",
        ],
        developmentAreas: ["Can tighten product packaging language"],
        scores: {
          rapport: 8,
          discovery: 8,
          productClarity: 7,
          objectionHandling: 7,
          closing: 8,
          verticalFit: 8,
          coachability: 8,
          energy: 8,
          multitasking: 7,
        },
        nextStep: "Invite to hiring manager interview.",
      },
      hireVerdict: {
        decision: "yes",
        label: "Hire / advance",
        color: "green",
        headline: "Good hire signal — move to next stage",
        confidence: "high",
        summary:
          "Seeded test candidate for admin pipeline testing. Treat as a pass for walkthrough purposes.",
        overallScore: 8,
        strengths: ["Clear closer language", "Industry-relevant discovery"],
        risks: ["Simulated transcript — not a live voice call"],
        nextAction: "Open hiring manager interview and continue the pipeline.",
        evidence: {
          talkTurns: 4,
          candidateTurns: 2,
          assistantTurns: 2,
          durationSec: 600,
          multitaskScore: 7,
          transcriptAvailable: true,
        },
      },
      training: { modulesRead: [], quizAttempts: 0 },
    };

    const hm = await spawn(record, "hiring_manager");
    record.hmInterviewId = hm.id;
    await createInterview(record);

    const full = (await getInterview(id))!;
    return NextResponse.json({
      ok: true,
      id,
      message: "Test admin candidate created (score 8, HM ready).",
      links: links(full),
    });
  }

  const id = String(body.id || "");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const root = await getInterview(id);
  if (!root) {
    return NextResponse.json(
      { error: `Application not found: ${id}` },
      { status: 404 },
    );
  }

  // Always operate on root application when possible
  const rootId = root.rootId || root.id;
  const app = (await getInterview(rootId)) || root;

  if (action === "reject") {
    await updateInterview(rootId, { pipelineStatus: "rejected" });
    return NextResponse.json({
      ok: true,
      pipelineStatus: "rejected",
      links: links({ ...app, pipelineStatus: "rejected" }),
    });
  }

  if (action === "production_ready") {
    await updateInterview(rootId, {
      pipelineStatus: "production_ready",
      training: {
        ...(app.training || { modulesRead: [], quizAttempts: 0 }),
        quizPassed: true,
        practicePitchPassed: true,
        completedAt: new Date().toISOString(),
      },
    });
    const updated = (await getInterview(rootId))!;
    const hearthlineProvision = await provisionToHearthlineOs(updated, {
      reassignLeads: true,
    });
    return NextResponse.json({
      ok: true,
      pipelineStatus: "production_ready",
      hearthlineProvision,
      links: links({ ...app, pipelineStatus: "production_ready" }),
    });
  }

  if (action === "provision_hearthline") {
    const updated = (await getInterview(rootId))!;
    const hearthlineProvision = await provisionToHearthlineOs(updated, {
      reassignLeads: true,
    });
    return NextResponse.json({
      ok: true,
      message: hearthlineProvision.error
        ? `Provision error: ${hearthlineProvision.error}`
        : `Provisioned ${hearthlineProvision.email} as ${hearthlineProvision.positionTitle}`,
      hearthlineProvision,
      links: links(updated),
    });
  }

  if (action === "send_offer") {
    const offer = createOffer(app.roleSlug);
    await updateInterview(rootId, {
      offer,
      pipelineStatus: "offer_pending",
    });
    // Also stamp on screening record if different
    if (app.id !== id) {
      await updateInterview(id, { offer, pipelineStatus: "offer_pending" }).catch(
        () => null,
      );
    }
    const updated = (await getInterview(rootId))!;
    try {
      await notifyStageComplete({
        ...updated,
        kind: "hiring_manager",
        scorecard: {
          recommendation: "yes",
          overallScore: updated.scorecard?.overallScore || 8,
          summary: "Admin issued offer for review.",
        },
      });
    } catch {
      /* email optional */
    }
    return NextResponse.json({
      ok: true,
      offerToken: offer.token,
      message: "Offer created. Open the offer link to accept as the candidate.",
      links: links(updated),
    });
  }

  if (action === "force_hm" || action === "invite_hm") {
    let hmId = app.hmInterviewId;
    if (!hmId) {
      const child = await spawn(app, "hiring_manager");
      hmId = child.id;
    }
    await updateInterview(rootId, {
      hmInterviewId: hmId,
      pipelineStatus: "hm_invited",
    });
    const updated = (await getInterview(rootId))!;
    return NextResponse.json({
      ok: true,
      hmInterviewId: hmId,
      message: "Hiring manager session ready. Open the HM link to talk to Morgan.",
      links: links(updated),
    });
  }

  if (action === "force_onboarding" || action === "start_onboarding") {
    let oid = app.onboardingInterviewId;
    if (!oid) {
      const child = await spawn(app, "onboarding");
      oid = child.id;
    }
    const offer =
      app.offer?.status === "accepted"
        ? app.offer
        : app.offer
          ? {
              ...app.offer,
              status: "accepted" as const,
              acceptedAt: new Date().toISOString(),
            }
          : {
              ...createOffer(app.roleSlug),
              status: "accepted" as const,
              acceptedAt: new Date().toISOString(),
            };

    await updateInterview(rootId, {
      onboardingInterviewId: oid,
      pipelineStatus: "onboarding_invited",
      setupTasks: app.setupTasks?.length ? app.setupTasks : buildSetupTasks(),
      offer,
    });
    const updated = (await getInterview(rootId))!;
    return NextResponse.json({
      ok: true,
      onboardingInterviewId: oid,
      message: "Onboarding unlocked. Open Riley link or portal setup.",
      links: links(updated),
    });
  }

  if (action === "unlock_training") {
    await updateInterview(rootId, {
      pipelineStatus: "training_in_progress",
      setupTasks: (app.setupTasks || buildSetupTasks()).map((t) => ({
        ...t,
        completedAt: t.completedAt || new Date().toISOString(),
      })),
    });
    const updated = (await getInterview(rootId))!;
    return NextResponse.json({
      ok: true,
      message: "Training unlocked (setup marked complete).",
      links: links(updated),
    });
  }

  if (action === "simulate_pass_screening") {
    let hmId = app.hmInterviewId;
    if (!hmId) {
      const child = await spawn(app, "hiring_manager");
      hmId = child.id;
    }
    await updateInterview(rootId, {
      status: "completed",
      pipelineStatus: "hm_invited",
      hmInterviewId: hmId,
      durationSec: app.durationSec || 600,
      completedAt: app.completedAt || new Date().toISOString(),
      scorecard: {
        overallScore: 8,
        recommendation: "yes",
        summary:
          "Admin forced a pass for pipeline testing. Live score may have been lower.",
        strengths: ["Admin override for testing"],
        developmentAreas: ["Replace with live strong interview when ready"],
        nextStep: "Complete hiring manager interview with Morgan.",
      },
      hireVerdict: {
        decision: "yes",
        label: "Hire / advance",
        color: "green",
        headline: "Admin forced pass for pipeline walkthrough",
        confidence: "medium",
        summary: "Forced pass so you can test HM → offer → onboarding → train.",
        overallScore: 8,
        strengths: ["Pipeline testing"],
        risks: ["Not a real model score"],
        nextAction: "Open HM interview link.",
        evidence: {
          talkTurns: (app.transcript || []).length,
          candidateTurns: (app.transcript || []).filter((t) => t.role === "user")
            .length,
          assistantTurns: (app.transcript || []).filter(
            (t) => t.role === "assistant",
          ).length,
          durationSec: app.durationSec || 600,
          transcriptAvailable: (app.transcript || []).length > 0,
        },
      },
    });
    const updated = (await getInterview(rootId))!;
    return NextResponse.json({
      ok: true,
      message: "Screening forced to PASS. Open HM interview.",
      links: links(updated),
    });
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

    // Prefer longest transcript among root + children
    const all = await listApplications(500);
    const related = all.filter(
      (s) => s.id === rootId || s.rootId === rootId || s.parentId === rootId,
    );
    // also load by listing all interviews
    const { listInterviews } = await import("@/lib/store");
    const every = await listInterviews(500);
    const chain = every.filter(
      (s) => s.id === rootId || s.rootId === rootId || s.parentId === rootId,
    );
    const best = [...chain, app].sort(
      (a, b) => (b.transcript?.length || 0) - (a.transcript?.length || 0),
    )[0];

    const transcript = best.transcript || [];
    const durationSec = best.durationSec || app.durationSec || 0;
    const multitask = best.multitaskQuiz || app.multitaskQuiz;

    let scorecard = await evaluateTranscript({
      roleSlug: app.roleSlug,
      candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      transcript,
      durationSec,
      kind: "screening",
      multitask,
    });
    scorecard = applyDecision(scorecard, durationSec);
    if (multitask) {
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
    await updateInterview(rootId, {
      scorecard,
      hireVerdict,
      transcript: transcript.length ? transcript : app.transcript,
      durationSec,
      multitaskQuiz: multitask,
      status: "completed",
      completedAt: app.completedAt || new Date().toISOString(),
    });
    // also update best child session if different
    if (best.id !== rootId) {
      await updateInterview(best.id, { scorecard, hireVerdict });
    }
    return NextResponse.json({
      ok: true,
      hireVerdict,
      scorecard,
      message: `Re-analyzed using ${transcript.length} transcript lines.`,
      links: links({ ...app, scorecard, hireVerdict }),
    });
  }

  return NextResponse.json(
    { error: `Unknown action: ${action}` },
    { status: 400 },
  );
}

async function spawn(
  parent: InterviewRecord,
  kind: InterviewKind,
): Promise<InterviewRecord> {
  const id = newId();
  const rootId = parent.rootId || parent.id;
  const status: PipelineStatus =
    kind === "hiring_manager"
      ? "hm_invited"
      : kind === "onboarding"
        ? "onboarding_invited"
        : "training_in_progress";
  const record: InterviewRecord = {
    id,
    rootId,
    parentId: parent.id,
    kind: kind === "practice_pitch" ? "practice_pitch" : kind,
    department: "sales_closer",
    roleSlug: parent.roleSlug,
    status: "applied",
    pipelineStatus: status,
    portalToken: parent.portalToken || newPortalToken(),
    candidate: parent.candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: parent.training || { modulesRead: [], quizAttempts: 0 },
  };
  await createInterview(record);
  return record;
}
