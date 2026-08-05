/**
 * Slack workspace blueprint for Hearthline sales OS.
 * Channel creation requires SLACK_BOT_TOKEN with channels:manage / groups:write.
 * Notifications use SLACK_WEBHOOK_URL (incoming webhook).
 */

export const SLACK_CHANNELS = [
  {
    name: "sales",
    purpose: "Daily pipeline notes and closer chatter",
    is_private: false,
  },
  {
    name: "wins",
    purpose: "Closed deals and celebration",
    is_private: false,
  },
  {
    name: "product-updates",
    purpose: "AI Front Desk product and pricing changes",
    is_private: false,
  },
  {
    name: "hiring-closers",
    purpose: "Interview scorecards and hiring funnel alerts",
    is_private: false,
  },
  {
    name: "leads-inbound",
    purpose: "Marketing leads routed into closer territories",
    is_private: false,
  },
  {
    name: "onboarding",
    purpose: "New closer setup questions",
    is_private: false,
  },
  {
    name: "general",
    purpose: "Company-wide",
    is_private: false,
  },
] as const;

export type SlackSetupResult = {
  ok: boolean;
  channels: { name: string; id?: string; ok: boolean; error?: string }[];
  webhookConfigured: boolean;
  botConfigured: boolean;
  message: string;
};

export async function ensureSlackChannels(): Promise<SlackSetupResult> {
  const bot = process.env.SLACK_BOT_TOKEN;
  const webhookConfigured = Boolean(process.env.SLACK_WEBHOOK_URL);
  const botConfigured = Boolean(bot);

  if (!bot) {
    return {
      ok: false,
      channels: SLACK_CHANNELS.map((c) => ({
        name: c.name,
        ok: false,
        error: "SLACK_BOT_TOKEN not set",
      })),
      webhookConfigured,
      botConfigured: false,
      message:
        "Set SLACK_BOT_TOKEN (bot with channels:manage) to auto-create channels. Webhook alone can still post hiring alerts.",
    };
  }

  const channels: SlackSetupResult["channels"] = [];

  for (const ch of SLACK_CHANNELS) {
    try {
      // Try create
      const create = await fetch("https://slack.com/api/conversations.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bot}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: ch.name,
          is_private: ch.is_private,
        }),
      });
      const data = await create.json();
      if (data.ok) {
        channels.push({ name: ch.name, id: data.channel?.id, ok: true });
        // Set purpose
        if (data.channel?.id && ch.purpose) {
          await fetch("https://slack.com/api/conversations.setPurpose", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${bot}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              channel: data.channel.id,
              purpose: ch.purpose,
            }),
          });
        }
        continue;
      }
      // Already exists — look up
      if (data.error === "name_taken") {
        const list = await fetch(
          "https://slack.com/api/conversations.list?types=public_channel,private_channel&limit=200",
          { headers: { Authorization: `Bearer ${bot}` } },
        );
        const listed = await list.json();
        const found = (listed.channels || []).find(
          (c: { name: string }) => c.name === ch.name,
        );
        channels.push({
          name: ch.name,
          id: found?.id,
          ok: true,
          error: "already exists",
        });
        continue;
      }
      channels.push({ name: ch.name, ok: false, error: data.error });
    } catch (e) {
      channels.push({
        name: ch.name,
        ok: false,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  const ok = channels.every((c) => c.ok);
  return {
    ok,
    channels,
    webhookConfigured,
    botConfigured,
    message: ok
      ? "Slack channels ready."
      : "Some channels failed — check bot scopes (channels:manage, channels:read, chat:write).",
  };
}

export async function postSlackChannel(
  channel: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  const bot = process.env.SLACK_BOT_TOKEN;
  if (!bot) {
    // Fall back to generic webhook
    const url = process.env.SLACK_WEBHOOK_URL;
    if (!url) return { ok: false, error: "No Slack bot or webhook" };
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `[#${channel}] ${text}` }),
    });
    return r.ok ? { ok: true } : { ok: false, error: await r.text() };
  }

  const r = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bot}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });
  const data = await r.json();
  return data.ok
    ? { ok: true }
    : { ok: false, error: data.error || "post failed" };
}
