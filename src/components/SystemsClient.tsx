"use client";

import { useCallback, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import {
  FLOWS,
  HIRING_FUNNEL,
  MARKETING_FUNNEL,
  SALES_FUNNEL,
  SYSTEMS,
} from "@/lib/platform-map";
import { SLACK_CHANNELS } from "@/lib/slack-config";
import { AGENT_VOICES } from "@/lib/agent-voices";

function authHeaders(secret: string) {
  return { Authorization: `Bearer ${secret}` };
}

type SlackResult = {
  ok?: boolean;
  message?: string;
  error?: string;
  botConfigured?: boolean;
  webhookConfigured?: boolean;
  channels?: { name: string; id?: string; ok: boolean; error?: string }[];
};

export function SystemsClient() {
  const [secret, setSecret] = useState("");
  const [slack, setSlack] = useState<SlackResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runSlackSetup = useCallback(async () => {
    if (!secret) {
      setMsg("Enter admin secret first");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/slack/setup", {
        method: "POST",
        headers: authHeaders(secret),
      });
      const data = await res.json();
      setSlack(data);
      setMsg(data.message || data.error || (data.ok ? "Done" : "Partial"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [secret]);

  const statusColor = (s: string) =>
    s === "live"
      ? "text-[var(--success)]"
      : s === "building"
        ? "text-[var(--accent)]"
        : "text-[var(--ink-faint)]";

  return (
    <div className="space-y-6 animate-rise">
      <AdminNav />

      <div>
        <p className="hl-eyebrow">Operator overview</p>
        <h1 className="hl-serif text-[1.85rem] text-[var(--ink)]">
          Platform systems
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)]">
          How hiring, marketing, sales, Slack, and Hearthline OS connect. Use
          this diagram with the CRM panel to run the full funnel.
        </p>
      </div>

      {/* Systems cards */}
      <section className="grid gap-3 sm:grid-cols-2">
        {SYSTEMS.map((sys) => (
          <div key={sys.id} className="hl-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-[var(--ink)]">{sys.name}</h2>
              <span
                className={`text-[11px] font-semibold uppercase ${statusColor(sys.status)}`}
              >
                {sys.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              {sys.description}
            </p>
            {sys.url && (
              <a
                href={sys.url}
                className="mt-3 inline-block text-sm font-medium text-[var(--accent)]"
              >
                Open →
              </a>
            )}
          </div>
        ))}
      </section>

      {/* Flow diagram */}
      <section className="hl-card p-5">
        <h2 className="hl-serif text-xl text-[var(--ink)]">System links</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Data and people flow between products
        </p>
        <ul className="mt-4 space-y-2">
          {FLOWS.map((f) => (
            <li
              key={`${f.from}-${f.to}`}
              className="flex flex-wrap items-center gap-2 text-sm"
            >
              <span className="rounded-full bg-[var(--bg-deep)] px-2.5 py-1 font-medium text-[var(--ink)]">
                {SYSTEMS.find((s) => s.id === f.from)?.name || f.from}
              </span>
              <span className="text-[var(--ink-faint)]">→</span>
              <span className="rounded-full bg-[var(--accent-wash)] px-2.5 py-1 font-medium text-[var(--accent)]">
                {SYSTEMS.find((s) => s.id === f.to)?.name || f.to}
              </span>
              <span className="text-[12px] text-[var(--ink-faint)]">
                {f.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pipeline diagrams */}
      <PipelineSection
        title="Hiring pipeline"
        steps={HIRING_FUNNEL}
        id="hiring"
      />
      <PipelineSection
        title="Marketing → lead gen pipeline"
        steps={MARKETING_FUNNEL}
        id="marketing"
      />
      <PipelineSection
        title="Sales closer pipeline"
        steps={SALES_FUNNEL}
        id="sales"
      />

      {/* Agent roster */}
      <section className="hl-card p-5">
        <h2 className="hl-serif text-xl text-[var(--ink)]">Voice agents</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Distinct names + Grok voices so candidates never confuse who
          they&apos;re talking to
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            Object.entries(AGENT_VOICES) as [
              string,
              (typeof AGENT_VOICES)[keyof typeof AGENT_VOICES],
            ][]
          ).map(([kind, p]) => (
            <div
              key={kind}
              className="rounded-2xl border border-[var(--line)] bg-white/50 px-3.5 py-3"
            >
              <p className="hl-serif text-lg text-[var(--ink)]">
                {p.agentName}
              </p>
              <p className="text-sm text-[var(--ink-muted)]">{p.title}</p>
              <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                Voice ID: <code>{p.voice}</code> · {p.tone}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">
                {kind}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Slack setup */}
      <section className="hl-card space-y-4 p-5" id="slack">
        <div>
          <h2 className="hl-serif text-xl text-[var(--ink)]">
            Slack workspace
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Create standard channels and verify bot/webhook env. Requires{" "}
            <code className="text-[12px]">SLACK_BOT_TOKEN</code> with
            channels:manage, channels:read, chat:write.
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {SLACK_CHANNELS.map((c) => (
            <li
              key={c.name}
              className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1 text-sm"
              title={c.purpose}
            >
              #{c.name}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[180px]">
            <span className="text-[12px] font-medium text-[var(--ink-muted)]">
              Admin secret
            </span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              placeholder="ADMIN_SECRET"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runSlackSetup()}
            className="min-h-11 rounded-[99px] bg-[var(--accent)] px-5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Setting up…" : "Create / verify channels"}
          </button>
        </div>

        {msg && (
          <p className="rounded-xl border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 text-sm">
            {msg}
          </p>
        )}

        {slack?.channels && (
          <ul className="space-y-1 text-sm">
            {slack.channels.map((c) => (
              <li key={c.name} className="flex gap-2">
                <span>{c.ok ? "✓" : "✗"}</span>
                <span className="font-medium">#{c.name}</span>
                <span className="text-[var(--ink-faint)]">
                  {c.id || c.error || ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        {(slack?.botConfigured != null || slack?.webhookConfigured != null) && (
          <p className="text-[12px] text-[var(--ink-faint)]">
            Bot token: {slack.botConfigured ? "set" : "missing"} · Webhook:{" "}
            {slack.webhookConfigured ? "set" : "missing"}
          </p>
        )}
      </section>
    </div>
  );
}

function PipelineSection({
  title,
  steps,
  id,
}: {
  title: string;
  steps: { id: string; label: string; sub: string[] }[];
  id: string;
}) {
  return (
    <section className="hl-card p-5" id={id}>
      <h2 className="hl-serif text-xl text-[var(--ink)]">{title}</h2>
      <ol className="mt-4 space-y-0">
        {steps.map((step, i) => (
          <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[13px] top-8 h-[calc(100%-1.5rem)] w-[2px] bg-[var(--accent-border)]"
              />
            )}
            <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="font-semibold text-[var(--ink)]">{step.label}</p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {step.sub.map((s) => (
                  <li
                    key={s}
                    className="rounded-full bg-[var(--bg-deep)] px-2 py-0.5 text-[11px] text-[var(--ink-soft)]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
