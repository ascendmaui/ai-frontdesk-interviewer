import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Warning = {
  code: string;
  message: string;
  severity: "info" | "warn" | "error";
};

function slackNotificationsEnabled(): boolean {
  return process.env.NOTIFICATIONS_SLACK === "true";
}

export async function GET() {
  const slackWebhook = Boolean(process.env.SLACK_WEBHOOK_URL);
  const slackBot = Boolean(process.env.SLACK_BOT_TOKEN);
  const slackConfigured = slackWebhook || slackBot;
  const slackWanted = slackNotificationsEnabled();

  const gmailOrSmtp = Boolean(
    (process.env.SMTP_USER || process.env.GMAIL_USER) &&
      (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
  );
  const resend = Boolean(process.env.RESEND_API_KEY);
  const email = gmailOrSmtp || resend;
  const hiringNotify = Boolean(process.env.HIRING_NOTIFY_EMAIL);

  const hearthline = Boolean(
    process.env.HEARTHLINE_SPINE_SECRET ||
      process.env.HEARTHLINE_PROVISION_SECRET ||
      process.env.HEARTHLINE_OS_PROVISION_SECRET,
  );
  const github = Boolean(process.env.GITHUB_TOKEN || process.env.GH_TOKEN);
  const xai = Boolean(process.env.XAI_API_KEY);

  const warnings: Warning[] = [];

  // Email is the preferred ops channel — warn when missing.
  if (!email) {
    warnings.push({
      code: "email_unconfigured",
      message:
        "No email path configured (prefer GMAIL_USER + GMAIL_APP_PASSWORD / SMTP, or RESEND_API_KEY).",
      severity: "warn",
    });
  } else if (!hiringNotify) {
    warnings.push({
      code: "hiring_notify_email_missing",
      message: "HIRING_NOTIFY_EMAIL not set — internal hiring alerts will be skipped.",
      severity: "warn",
    });
  }

  // Slack is optional. Only warn when explicitly enabled but unconfigured.
  // When NOTIFICATIONS_SLACK is false/unset and no tokens, omit warning (or info).
  if (slackWanted && !slackConfigured) {
    warnings.push({
      code: "slack_unconfigured",
      message:
        "NOTIFICATIONS_SLACK=true but neither SLACK_WEBHOOK_URL nor SLACK_BOT_TOKEN is set.",
      severity: "warn",
    });
  } else if (!slackWanted && slackConfigured) {
    warnings.push({
      code: "slack_optional_idle",
      message:
        "Slack tokens present but NOTIFICATIONS_SLACK is not true — Slack posts are skipped (email + in-app preferred).",
      severity: "info",
    });
  }
  // When Slack off and unconfigured: no slack_unconfigured warning.

  if (!hearthline) {
    warnings.push({
      code: "hearthline_spine_unconfigured",
      message:
        "HEARTHLINE_SPINE_SECRET (or provision secret) not set — spine sync / in-app notify skipped.",
      severity: "info",
    });
  }

  if (!xai) {
    warnings.push({
      code: "xai_unconfigured",
      message: "XAI_API_KEY not set — voice/eval will fail.",
      severity: "error",
    });
  }

  // Overall status: do NOT degrade solely because Slack is missing/optional.
  const hasError = warnings.some((w) => w.severity === "error");
  const hasWarn = warnings.some((w) => w.severity === "warn");
  const status = hasError ? "degraded" : hasWarn ? "ok_with_warnings" : "ok";

  return NextResponse.json({
    ok: !hasError,
    status,
    service: "ai-frontdesk-interviewer",
    time: new Date().toISOString(),
    xai,
    /** True only when Slack notifications are enabled AND a path is configured. */
    slack: slackWanted && slackConfigured,
    slackWebhook,
    slackBot,
    slackNotificationsEnabled: slackWanted,
    email,
    emailPath: gmailOrSmtp ? "gmail_smtp" : resend ? "resend" : null,
    hearthline,
    github,
    integrations: {
      xai,
      slackWebhook,
      slackBot,
      email,
      hearthline,
      github,
    },
    warnings,
  });
}
