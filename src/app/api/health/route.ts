import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const slackWebhook = Boolean(process.env.SLACK_WEBHOOK_URL);
  const slackBot = Boolean(process.env.SLACK_BOT_TOKEN);
  const email = Boolean(
    process.env.RESEND_API_KEY ||
      process.env.GMAIL_APP_PASSWORD ||
      process.env.SMTP_PASS,
  );
  const hearthline = Boolean(
    process.env.HEARTHLINE_PROVISION_SECRET ||
      process.env.HEARTHLINE_OS_PROVISION_SECRET,
  );
  const github = Boolean(
    process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
  );

  return NextResponse.json({
    ok: true,
    service: "ai-frontdesk-interviewer",
    time: new Date().toISOString(),
    xai: Boolean(process.env.XAI_API_KEY),
    /** True if any Slack path can post (webhook or bot). */
    slack: slackWebhook || slackBot,
    slackWebhook,
    slackBot,
    email,
    hearthline,
    github,
    integrations: {
      xai: Boolean(process.env.XAI_API_KEY),
      slackWebhook,
      slackBot,
      email,
      hearthline,
      github,
    },
  });
}
