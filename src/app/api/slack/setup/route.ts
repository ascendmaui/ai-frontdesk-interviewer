import { NextResponse } from "next/server";
import { adminAuthError } from "@/lib/admin-auth";
import { ensureSlackChannels, SLACK_CHANNELS } from "@/lib/slack-config";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;
  return NextResponse.json({
    channels: SLACK_CHANNELS,
    botConfigured: Boolean(process.env.SLACK_BOT_TOKEN),
    webhookConfigured: Boolean(process.env.SLACK_WEBHOOK_URL),
  });
}

export async function POST(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;
  try {
    const result = await ensureSlackChannels();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Slack setup failed";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
