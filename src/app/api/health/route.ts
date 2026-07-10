import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-frontdesk-interviewer",
    time: new Date().toISOString(),
    xai: Boolean(process.env.XAI_API_KEY),
    slack: Boolean(process.env.SLACK_WEBHOOK_URL),
    email: Boolean(
      process.env.RESEND_API_KEY ||
        process.env.GMAIL_APP_PASSWORD ||
        process.env.SMTP_PASS,
    ),
  });
}
