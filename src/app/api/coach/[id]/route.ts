import { NextResponse } from "next/server";
import { certificationCheck } from "@/lib/certification";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SALES_CORE_MODULES } from "@/lib/sales-curriculum";
import { portalAuthError } from "@/lib/portal-auth";
import { getInterview } from "@/lib/store";
import { getAcademyForRole } from "@/lib/training-content";

export const runtime = "nodejs";

type CoachMode = "coach" | "call_prep" | "debrief";
type CoachMessage = { role: "user" | "assistant"; text: string };

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const limit = rateLimit(`coach:${id}:${clientIp(req)}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Coach rate limit reached. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  let body: {
    token?: string;
    message?: string;
    mode?: CoachMode;
    context?: string;
    recent?: CoachMessage[];
  } = {};
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

  const message = String(body.message || "")
    .trim()
    .slice(0, 6000);
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }
  const mode: CoachMode =
    body.mode === "call_prep" || body.mode === "debrief" ? body.mode : "coach";
  const recent = Array.isArray(body.recent)
    ? body.recent.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: String(m.text || "").slice(0, 2500),
      }))
    : [];

  const academy = getAcademyForRole(root.roleSlug);
  const certification = certificationCheck(root);
  const curriculum = [...SALES_CORE_MODULES, ...academy.modules]
    .map((m) => `### ${m.title}\n${m.body}`)
    .join("\n\n")
    .slice(0, 24000);

  const instructions = `You are the dedicated AI Sales Coach for AI Front Desk / Hearthline.

Your coaching style is direct, practical, supportive, concise, and high-standard. Teach one thing at a time. Do not flatter. Do not overwhelm the closer with a giant monologue. Ask useful follow-up questions when needed. Train closers to diagnose real business problems rather than pressure people.

Candidate: ${root.candidate.firstName} ${root.candidate.lastName}
Seat: ${academy.title}
Industry: ${academy.industry}
Certification: ${certification.certified ? "CERTIFIED" : "IN TRAINING"}
Current blockers: ${certification.blockers.join(" | ") || "none"}

NON-NEGOTIABLES:
- Never invent product capabilities, integrations, discounts, ROI, testimonials, scarcity, deadlines, or customer facts.
- Never tell a closer to evade spam filters, opt-outs, calling rules, platform rules, or privacy safeguards.
- Respect opt-outs immediately.
- Do not ask the closer to collect or paste passwords, card data, tax IDs, SSNs, API keys, or other secrets.
- Payment must use approved checkout/payment systems.
- Commission is governed by the signed agreement and qualifying collected/cleared customer funds; do not treat signatures or unpaid invoices as collected revenue.
- For medical/legal/financial or other regulated-client verticals, AI handles intake/booking within approved scope; do not teach the closer to promise professional advice.
- If a requested feature or claim is uncertain, coach the rep to say it must be confirmed before promising it.

MODE BEHAVIOR:
- coach: teach, quiz, challenge, or explain the sales process using the curriculum and the closer's question.
- call_prep: produce a compact pre-call plan: likely pain, 3 discovery questions, one demo path, likely objection, and a clean next-step close. Never invent facts about the specific prospect; clearly label unknowns.
- debrief: analyze the closer's notes/transcript supplied by the closer. Return: what worked, what was missed, the single biggest correction, CRM next step, and a better phrase/question for next time.

CERTIFICATION STANDARD:
- all required onboarding/setup acknowledgements complete;
- every required academy module read;
- knowledge assessment >=85%;
- two voice roleplays >=8/10.

CURRICULUM:
${curriculum}

VERTICAL TALK TRACKS:
${academy.talkTracks.map((x) => `- ${x}`).join("\n")}

VERTICAL OBJECTIONS:
${academy.objections.map((x) => `- ${x.objection}: ${x.reframe}`).join("\n")}

Keep ordinary answers under about 250 words unless the closer asks for deeper training.`;

  const context = String(body.context || "").slice(0, 8000);
  const history = recent
    .map((m) => `${m.role === "assistant" ? "COACH" : "CLOSER"}: ${m.text}`)
    .join("\n");
  const input = [
    history ? `RECENT CONVERSATION:\n${history}` : "",
    context ? `OPTIONAL CALL/DEBRIEF CONTEXT:\n${context}` : "",
    `MODE: ${mode}\nCLOSER: ${message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const model = process.env.OPENAI_SALES_COACH_MODEL || "gpt-5.6-sol";
      const r = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions,
          input,
          max_output_tokens: 1600,
          store: false,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        const reply = extractOpenAIText(data);
        if (reply) {
          return NextResponse.json({ reply, provider: "openai", model });
        }
      } else {
        console.error("[coach] OpenAI failed", r.status, safeApiError(data));
      }
    }

    const xaiKey = process.env.XAI_API_KEY;
    if (!xaiKey) {
      return NextResponse.json(
        {
          error:
            "Sales Coach is configured but no server-side AI provider key is available. Add OPENAI_API_KEY (preferred) or XAI_API_KEY.",
        },
        { status: 503 },
      );
    }
    const model = process.env.XAI_EVAL_MODEL || "grok-3-mini";
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: input },
        ],
        max_tokens: 1200,
        temperature: 0.35,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error(
        "[coach] xAI fallback failed",
        r.status,
        safeApiError(data),
      );
      return NextResponse.json(
        { error: "Coach provider unavailable" },
        { status: 502 },
      );
    }
    const reply = String(data?.choices?.[0]?.message?.content || "").trim();
    if (!reply) {
      return NextResponse.json(
        { error: "Coach returned no text" },
        { status: 502 },
      );
    }
    return NextResponse.json({ reply, provider: "xai-fallback", model });
  } catch (e) {
    console.error("[coach] request failed", e);
    return NextResponse.json(
      { error: "Coach request failed" },
      { status: 502 },
    );
  }
}

function extractOpenAIText(data: unknown): string {
  const d = data as {
    output_text?: string;
    output?: { content?: { type?: string; text?: string }[] }[];
  };
  if (typeof d?.output_text === "string" && d.output_text.trim()) {
    return d.output_text.trim();
  }
  const parts: string[] = [];
  for (const item of d?.output || []) {
    for (const c of item?.content || []) {
      if (c?.type === "output_text" && typeof c.text === "string") {
        parts.push(c.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function safeApiError(data: unknown): string {
  const d = data as { error?: { message?: string } | string };
  if (typeof d?.error === "string") return d.error.slice(0, 300);
  if (typeof d?.error?.message === "string")
    return d.error.message.slice(0, 300);
  return "provider error";
}
