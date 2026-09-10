import {
  COMPANY,
  REC_EMOJI,
  REC_LABEL,
  isQualified,
  type Recommendation,
} from "./company";
import { kindLabel, publicAppUrl, stagePath } from "./pipeline";
import { getRole } from "./roles";
import type { InterviewRecord, Scorecard } from "./types";

function rec(sc?: Scorecard): Recommendation {
  const r = String(sc?.recommendation || "maybe");
  if (r === "strong_yes" || r === "yes" || r === "maybe" || r === "no")
    return r;
  return "maybe";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(inner: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FAF5EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#231D15">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-size:20px;font-weight:400;color:#231D15;margin-bottom:18px;font-family:Georgia,'Times New Roman',serif">${escapeHtml(COMPANY.product)}</div>
    <div style="background:#FFFDF7;border:1px solid rgba(35,29,21,0.1);border-radius:20px;padding:28px 22px;box-shadow:0 10px 30px rgba(90,60,30,0.07)">
      ${inner}
    </div>
    <p style="color:#93876F;font-size:12px;margin-top:20px;line-height:1.4">Sent regarding your application with ${escapeHtml(COMPANY.brand)}. Reply if you have questions.</p>
  </div>
</body></html>`;
}

function ctaButton(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#BA5B33;color:#FFF8F0;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:99px">${escapeHtml(label)}</a></p>`;
}

let slackSkipLogged = false;

/** Slack posts only when NOTIFICATIONS_SLACK=true (default off — email + in-app preferred). */
export function slackNotificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_SLACK === "true";
}

export async function postSlack(
  interview: InterviewRecord,
  opts?: { nextSession?: InterviewRecord | null },
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  if (!slackNotificationsEnabled()) {
    if (!slackSkipLogged) {
      console.info(
        "[notifications] Slack skipped (NOTIFICATIONS_SLACK is not true; email + in-app preferred)",
      );
      slackSkipLogged = true;
    }
    return { ok: true, skipped: true };
  }

  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    return { ok: false, error: "SLACK_WEBHOOK_URL not configured" };
  }

  const role = getRole(interview.roleSlug);
  const recommendation = rec(interview.scorecard);
  const c = interview.candidate;
  const emoji = REC_EMOJI[recommendation];
  const label = REC_LABEL[recommendation];
  const score = interview.scorecard?.overallScore ?? "—";
  const duration = interview.durationSec
    ? `${Math.floor(interview.durationSec / 60)}m ${interview.durationSec % 60}s`
    : "—";
  const kind = interview.kind || "screening";
  const mt = interview.multitaskQuiz;

  const strengths = (interview.scorecard?.strengths || [])
    .slice(0, 3)
    .map((s) => `• ${s}`)
    .join("\n");

  const nextLine = opts?.nextSession
    ? `\n*Next:* ${kindLabel(opts.nextSession.kind)} → ${stagePath(opts.nextSession.id)}`
    : `\n*Pipeline:* ${interview.pipelineStatus}`;

  const text = [
    `${emoji} *${kindLabel(kind)}* — ${label}`,
    `*${c.firstName} ${c.lastName}* · ${role?.title || interview.roleSlug}`,
    `Score: *${score}/10* · Duration: ${duration} · Status: ${interview.pipelineStatus}`,
    mt
      ? `Multitask: ${mt.correctCount}/${mt.scoredCount} correct · ${mt.multitaskScore}/10`
      : "",
    `Email: ${c.email} · Phone: ${c.phone}`,
    interview.scorecard?.summary
      ? `\n_${interview.scorecard.summary}_`
      : "",
    strengths ? `\n*Strengths*\n${strengths}` : "",
    nextLine,
    `\nID: \`${interview.id}\``,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) {
      const body = await r.text();
      return { ok: false, error: `Slack ${r.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Slack post failed",
    };
  }
}

function candidateEmailContent(
  interview: InterviewRecord,
  nextSession?: InterviewRecord | null,
): { subject: string; text: string; html: string } {
  const role = getRole(interview.roleSlug);
  const recommendation = rec(interview.scorecard);
  const first = interview.candidate.firstName || "there";
  const roleTitle = role?.title || "Sales Closer";
  const brand = COMPANY.product;
  const score = interview.scorecard?.overallScore;
  const kind = interview.kind || "screening";
  void nextSession;
  const slackInvite = process.env.ONBOARDING_SLACK_INVITE_URL || "";
  const handbook = process.env.ONBOARDING_HANDBOOK_URL || "";

  // ─── Screening: never reveal scores or decisions — team reviews first ───
  if (kind === "screening") {
    const subject = `We received your ${roleTitle} interview — ${brand}`;
    const text = `Hi ${first},

Thank you for completing your ${roleTitle} interview with ${brand}.

Our hiring team will review your application and contact you by email or phone after the review. Typical response time is 1–3 business days.

There's nothing else you need to do right now.

— ${COMPANY.brand} Hiring
`;
    const html = emailShell(`
      <p style="margin:0 0 10px;color:#BA5B33;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Interview received</p>
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:400;color:#231D15;font-family:Georgia,serif">Thank you, ${escapeHtml(first)}</h1>
      <p style="color:#6E6455;line-height:1.6">Your <strong style="color:#231D15">${escapeHtml(roleTitle)}</strong> interview was submitted successfully.</p>
      <p style="color:#6E6455;line-height:1.6">Our hiring team will review your conversation and contact you after the review — usually within <strong style="color:#231D15">1–3 business days</strong>.</p>
      <p style="color:#93876F;font-size:14px">There's nothing else you need to do right now.</p>
    `);
    return { subject, text, html };
  }

  // ─── Hiring manager ───
  if (kind === "hiring_manager") {
    const offerToken = interview.offer?.token;
    const offerUrl = offerToken
      ? `${publicAppUrl()}/offer/${offerToken}`
      : "";
    if (isQualified(recommendation) && offerUrl) {
      const subject = `Your offer — ${roleTitle} at ${brand}`;
      const text = `Hi ${first},

You passed the hiring manager interview.${score != null ? ` Score: ${score}/10.` : ""}

Review and accept your offer here:
${offerUrl}

After you accept, you'll start onboarding with Riley and complete setup + training.

— ${COMPANY.brand} Hiring
`;
      const html = emailShell(`
        <p style="margin:0 0 10px;color:#BA5B33;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Offer</p>
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:400;color:#231D15;font-family:Georgia,serif">Great news, ${escapeHtml(first)}</h1>
        <p style="color:#6E6455;line-height:1.6">Morgan cleared you for the <strong>${escapeHtml(roleTitle)}</strong> seat. Review your offer to continue onboarding.</p>
        ${ctaButton(offerUrl, "Review & accept offer")}
      `);
      return { subject, text, html };
    }

    if (recommendation === "maybe") {
      const cal = COMPANY.calendarUrl;
      const subject = `Hiring manager interview received — ${brand}`;
      const text = `Hi ${first},\n\nThanks for meeting with Morgan. The team is reviewing and will follow up within a few business days.${cal ? `\nOptional: ${cal}` : ""}\n\n— ${COMPANY.brand} Hiring\n`;
      const html = emailShell(`
        <p style="margin:0 0 10px;color:#BA5B33;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Under review</p>
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:400;color:#231D15;font-family:Georgia,serif">Thanks, ${escapeHtml(first)}</h1>
        <p style="color:#6E6455;line-height:1.6">Morgan's notes are with the team. We'll follow up within a few business days.</p>
        ${cal ? ctaButton(cal, "Optional: book a human chat") : ""}
      `);
      return { subject, text, html };
    }

    const subject = `Update after your hiring manager interview`;
    const text = `Hi ${first},\n\nThank you for speaking with Morgan. We're not moving forward at this time.\n\n— ${COMPANY.brand} Hiring\n`;
    const html = emailShell(`
      <p style="margin:0 0 10px;color:#BA5B33;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Application update</p>
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:400;color:#231D15;font-family:Georgia,serif">Thank you, ${escapeHtml(first)}</h1>
      <p style="color:#6E6455;line-height:1.6">We're not moving forward after the hiring manager round. We appreciate your time.</p>
    `);
    return { subject, text, html };
  }

  // ─── Onboarding ───
  const subject = `Onboarding complete — next actions at ${brand}`;
  const slackStep = slackInvite
    ? `1. Join the team workspace (optional): ${slackInvite}`
    : `1. Team chat is optional — ops will share an invite if your role needs it`;
  const text = `Hi ${first},

You finished the onboarding voice session with Riley. Complete these today:
${slackStep}
2. Open handbook ${handbook || "(ops will send)"}
3. Confirm CRM/dialer access with ops if not live yet

Welcome to ${brand}.

— ${COMPANY.brand} Ops
`;
  const html = emailShell(`
    <p style="margin:0 0 10px;color:#BA5B33;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase">Onboarding</p>
    <h1 style="margin:0 0 14px;font-size:26px;font-weight:400;color:#231D15;font-family:Georgia,serif">You're set up, ${escapeHtml(first)}</h1>
    <p style="color:#6E6455;line-height:1.6">Riley walked you through day-one. Finish these:</p>
    <ol style="color:#6E6455;line-height:1.7;padding-left:18px">
      <li>${slackInvite ? `Join team chat (optional) — <a href="${slackInvite}" style="color:#BA5B33">invite link</a>` : "Team chat is optional — ops will share an invite if needed"}</li>
      <li>Open handbook ${handbook ? `— <a href="${handbook}" style="color:#BA5B33">checklist</a>` : ""}</li>
      <li>Confirm CRM &amp; dialer with ops if not provisioned</li>
    </ol>
    <p style="color:#93876F;font-size:14px">You'll get hiring updates by email and in the Hearthline app.</p>
  `);
  return { subject, text, html };
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "no resend" };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    return { ok: false, error: `Resend ${r.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
}): Promise<{ ok: boolean; error?: string }> {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);

  if (!user || !pass) {
    return { ok: false, error: "SMTP/Gmail credentials not configured" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transport.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "SMTP send failed",
    };
  }
}

async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const fromRaw =
    process.env.HIRING_FROM_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    "hiring@hearthline.ai";
  const from = fromRaw.includes("<")
    ? fromRaw
    : `${COMPANY.brand} Hiring <${fromRaw}>`;
  const payload = { ...opts, from };
  const hasSmtp = Boolean(
    (process.env.SMTP_USER || process.env.GMAIL_USER) &&
      (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
  );
  // Prefer Gmail/SMTP as primary path; Resend is an alternate when SMTP unset.
  if (hasSmtp) return sendViaSmtp(payload);
  if (process.env.RESEND_API_KEY) return sendViaResend(payload);
  return { ok: false, error: "No email provider configured (Gmail/SMTP or Resend)" };
}

export async function sendCandidateEmail(
  interview: InterviewRecord,
  nextSession?: InterviewRecord | null,
): Promise<{ ok: boolean; error?: string }> {
  const content = candidateEmailContent(interview, nextSession);
  return sendMail({
    to: interview.candidate.email,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });
}

export async function sendInternalEmail(
  interview: InterviewRecord,
  nextSession?: InterviewRecord | null,
): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.HIRING_NOTIFY_EMAIL;
  if (!to) return { ok: false, error: "HIRING_NOTIFY_EMAIL not set" };

  const role = getRole(interview.roleSlug);
  const recommendation = rec(interview.scorecard);
  const c = interview.candidate;
  const kind = interview.kind || "screening";
  const subject = `${REC_EMOJI[recommendation]} [${kind}] ${c.firstName} ${c.lastName} — ${role?.title} (${REC_LABEL[recommendation]})`;
  const text = [
    `Kind: ${kindLabel(kind)}`,
    `Candidate: ${c.firstName} ${c.lastName}`,
    `Email: ${c.email}`,
    `Phone: ${c.phone}`,
    `Role: ${role?.title}`,
    `Score: ${interview.scorecard?.overallScore ?? "—"}/10`,
    `Recommendation: ${REC_LABEL[recommendation]}`,
    `Pipeline: ${interview.pipelineStatus}`,
    interview.multitaskQuiz
      ? `Multitask: ${interview.multitaskQuiz.correctCount}/${interview.multitaskQuiz.scoredCount} · ${interview.multitaskQuiz.multitaskScore}/10`
      : "",
    nextSession
      ? `Next session: ${kindLabel(nextSession.kind)} ${stagePath(nextSession.id)}`
      : "",
    "",
    interview.scorecard?.summary || "",
    "",
    `ID: ${interview.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  return sendMail({
    to,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
  });
}

function spineBase(): string {
  return (
    process.env.HEARTHLINE_SPINE_URL ||
    process.env.HEARTHLINE_OS_URL ||
    process.env.NEXT_PUBLIC_HEARTHLINE_OS_URL ||
    "https://hearthline-platform.vercel.app"
  ).replace(/\/$/, "");
}

function spineSecret(): string | undefined {
  return (
    process.env.HEARTHLINE_SPINE_SECRET ||
    process.env.HEARTHLINE_PROVISION_SECRET ||
    undefined
  );
}

/**
 * Fire-and-log POST to Hearthline spine in-app notifications.
 * Never throws into hiring UX — spine failure must not fail the interview path.
 */
export async function notifySpineInApp(input: {
  title: string;
  body: string;
  audience?: "ops" | "applicant" | "rep" | "system";
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  userId?: string | null;
  organizationId?: string | null;
}): Promise<{ ok: boolean; error?: string; id?: string; skipped?: boolean }> {
  const secret = spineSecret();
  if (!secret) {
    return { ok: false, skipped: true, error: "HEARTHLINE_SPINE_SECRET not configured" };
  }

  try {
    const res = await fetch(`${spineBase()}/api/spine/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hearthline-spine-secret": secret,
      },
      body: JSON.stringify({
        title: input.title,
        body: input.body,
        audience: input.audience || "ops",
        channel: "in_app",
        href: input.href ?? undefined,
        entityType: input.entityType ?? undefined,
        entityId: input.entityId ?? undefined,
        payload: input.payload ?? {},
        userId: input.userId ?? undefined,
        organizationId: input.organizationId ?? undefined,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      id?: string;
      notification?: { id?: string };
    };
    if (!res.ok) {
      console.error("[notifications] spine in-app notify failed", res.status, data);
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    const id = data.id || data.notification?.id;
    console.info("[notifications] spine in-app notify ok", id || "");
    return { ok: true, id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Spine notify network error";
    console.error("[notifications] spine in-app notify", message);
    return { ok: false, error: message };
  }
}

/** Stage-aware notify used by /api/complete */
export async function notifyStageComplete(
  interview: InterviewRecord,
  opts?: {
    nextSession?: InterviewRecord | null;
    root?: InterviewRecord | null;
  },
): Promise<{
  slack: { ok: boolean; error?: string; skipped?: boolean };
  emailCandidate: { ok: boolean; error?: string };
  emailInternal: { ok: boolean; error?: string };
  spineInApp: { ok: boolean; error?: string; id?: string; skipped?: boolean };
}> {
  // Prefer root offer/token for HM complete
  const forEmail =
    interview.kind === "hiring_manager" && opts?.root?.offer
      ? { ...interview, offer: opts.root.offer, pipelineStatus: opts.root.pipelineStatus }
      : interview;

  const [slack, emailCandidate, emailInternal] = await Promise.all([
    postSlack(forEmail, opts),
    sendCandidateEmail(forEmail, opts?.nextSession),
    process.env.HIRING_NOTIFY_EMAIL
      ? sendInternalEmail(forEmail, opts?.nextSession)
      : Promise.resolve({ ok: true as const }),
  ]);

  // After email notify events succeed, also fan out to spine in-app (never fail hiring).
  let spineInApp: {
    ok: boolean;
    error?: string;
    id?: string;
    skipped?: boolean;
  } = { ok: false, skipped: true };
  if (emailCandidate.ok || emailInternal.ok) {
    const role = getRole(forEmail.roleSlug);
    const recommendation = rec(forEmail.scorecard);
    const c = forEmail.candidate;
    const kind = forEmail.kind || "screening";
    try {
      spineInApp = await notifySpineInApp({
        title: `${REC_LABEL[recommendation]} — ${c.firstName} ${c.lastName}`,
        body: `${kindLabel(kind)} · ${role?.title || forEmail.roleSlug} · score ${forEmail.scorecard?.overallScore ?? "—"}/10 · ${forEmail.pipelineStatus}`,
        audience: "ops",
        href: stagePath(forEmail.id),
        entityType: "interview",
        entityId: null,
        payload: {
          sourceSystem: "ai-frontdesk-interviewer",
          interviewId: forEmail.id,
          rootId: forEmail.rootId || forEmail.id,
          kind,
          recommendation,
          pipelineStatus: forEmail.pipelineStatus,
          candidateEmail: c.email,
          emailCandidateOk: emailCandidate.ok,
          emailInternalOk: emailInternal.ok,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "spine notify failed";
      console.error("[notifications] spine fan-out", message);
      spineInApp = { ok: false, error: message };
    }
  }

  return { slack, emailCandidate, emailInternal, spineInApp };
}

/** @deprecated use notifyStageComplete */
export async function notifyAll(interview: InterviewRecord) {
  return notifyStageComplete(interview);
}
