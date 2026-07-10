import { NextResponse } from "next/server";
import { buildAgentInstructions } from "@/lib/agents";
import {
  buildInterviewerInstructions,
  getRole,
  greetingForRole,
} from "@/lib/roles";
import { getInterview, updateInterview } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "XAI_API_KEY is not set. Add it to .env.local (see .env.local.example).",
      },
      { status: 500 },
    );
  }

  let body: { interviewId?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const interviewId = String(body.interviewId || "");
  if (!interviewId) {
    return NextResponse.json(
      { error: "interviewId is required" },
      { status: 400 },
    );
  }

  const interview = await getInterview(interviewId);
  if (!interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  if (interview.status === "completed") {
    return NextResponse.json(
      { error: "This session is already completed" },
      { status: 409 },
    );
  }

  const role = getRole(interview.roleSlug);
  if (!role) {
    return NextResponse.json({ error: "Role missing" }, { status: 400 });
  }

  const kind = interview.kind || "screening";
  let instructions: string;
  let greeting: string;
  let agentName: string;
  let voice =
    process.env.XAI_VOICE ||
    (kind === "hiring_manager"
      ? "sal"
      : kind === "onboarding"
        ? "ara"
        : "eve");

  if (kind === "screening") {
    instructions = buildInterviewerInstructions(role, {
      firstName: interview.candidate.firstName,
      lastName: interview.candidate.lastName,
      yearsInSales: interview.candidate.yearsInSales,
      industryExperience: interview.candidate.industryExperience,
    });
    // Multitask note in prompt
    instructions += `

## Multitasking pop-ups
During this interview the CANDIDATE will see Yes/No questions appear on their screen while you keep talking.
Do NOT stop the interview for those pop-ups. If they mention the pop-ups, acknowledge briefly ("Yep — keep talking, those are intentional multitask checks") and continue.
Do not read the pop-up questions aloud.`;
    greeting = greetingForRole(role, interview.candidate.firstName);
    agentName = "Jordan";
  } else {
    const agent = buildAgentInstructions(kind, interview.roleSlug, {
      firstName: interview.candidate.firstName,
      lastName: interview.candidate.lastName,
      yearsInSales: interview.candidate.yearsInSales,
      industryExperience: interview.candidate.industryExperience,
    });
    instructions = agent.instructions;
    greeting = agent.greeting;
    agentName = agent.agentName;
    if (!process.env.XAI_VOICE) voice = agent.voiceHint;
  }

  const model = process.env.XAI_VOICE_MODEL || "grok-voice-latest";
  const keyterms = [
    "Hearthline",
    "AI Front Desk",
    "AI Receptionist",
    "AI Front Office",
    "AI Growth Partner",
    "Slack",
    ...(role.keyterms || []),
  ];

  try {
    const r = await fetch("https://api.x.ai/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_after: { seconds: 900 },
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            data?.error ||
            `xAI token request failed (${r.status})`,
        },
        { status: r.status },
      );
    }

    const pipelineStatus =
      kind === "hiring_manager"
        ? "hm_in_progress"
        : kind === "onboarding"
          ? "onboarding_in_progress"
          : kind === "practice_pitch"
            ? "training_in_progress"
            : "screening_in_progress";

    await updateInterview(interviewId, {
      status: "in_progress",
      pipelineStatus,
      startedAt: interview.startedAt || new Date().toISOString(),
    });

    // Mirror pipeline on root if child
    if (interview.rootId && interview.rootId !== interviewId) {
      await updateInterview(interview.rootId, { pipelineStatus });
    }

    return NextResponse.json({
      ...data,
      voice,
      model,
      instructions,
      greeting,
      keyterms,
      kind,
      agentName,
      enableMultitaskQuiz: kind === "screening",
      roleSlug: role.slug,
      roleTitle: role.title,
      candidateFirstName: interview.candidate.firstName,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Token request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
