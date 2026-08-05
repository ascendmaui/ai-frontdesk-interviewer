"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PortalData = {
  id: string;
  portalToken: string;
  roleTitle?: string;
  roleEmoji?: string;
  industry?: string;
  pipelineStatus: string;
  steps: { id: string; label: string; state: string }[];
  candidate: { firstName: string; lastName: string; email: string };
  hmInterviewId?: string;
  onboardingInterviewId?: string;
  offer?: { token: string; status: string; title: string } | null;
  setupTasks: {
    id: string;
    title: string;
    description: string;
    href?: string;
    required: boolean;
    completedAt?: string;
  }[];
  setupProgress: { done: number; total: number; requiredDone: boolean };
  training: {
    modulesRead: string[];
    quizPassed?: boolean;
    quizScore?: number;
    practicePitchPassed?: boolean;
    practicePitchScore?: number;
  };
  calendarUrl?: string | null;
  multitask?: { score: number; correct: number; scored: number } | null;
  hearthlineOs?: {
    loginUrl: string;
    jobKitUrl: string;
    dashboardUrl: string;
    playbookUrl: string;
    note: string;
  };
  error?: string;
};

export function PortalClient({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const [data, setData] = useState<PortalData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/portal/${id}?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else setData(d);
      })
      .catch(() => setErr("Could not load portal"));
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTask(taskId: string, complete: boolean) {
    const res = await fetch(`/api/portal/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, taskId, complete }),
    });
    if (res.ok) load();
  }

  if (err) {
    return (
      <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-[var(--danger)]">
        {err}
      </p>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  const primary = primaryAction(data);

  return (
    <div className="animate-rise space-y-6">
      <div>
        <p className="hl-eyebrow">Candidate portal</p>
        <h1 className="hl-serif mt-1 text-[1.85rem] text-[var(--ink)]">
          {data.roleEmoji} Hi {data.candidate.firstName}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {data.roleTitle} · {data.pipelineStatus.replace(/_/g, " ")}
        </p>
      </div>

      {/* Progress rail */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {data.steps.map((s) => (
          <div
            key={s.id}
            className={`min-w-[4.5rem] flex-1 rounded-xl border px-2 py-2 text-center text-[11px] font-medium ${
              s.state === "done"
                ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
                : s.state === "current"
                  ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-white/40 text-[var(--ink-faint)]"
            }`}
          >
            {s.label}
          </div>
        ))}
      </div>

      {primary && (
        primary.external ? (
          <a href={primary.href} className="hl-btn-primary w-full" target="_blank" rel="noreferrer">
            {primary.label}
          </a>
        ) : (
        <Link href={primary.href} className="hl-btn-primary w-full">
          {primary.label}
        </Link>
        )
      )}

      {data.multitask && (
        <div className="hl-card px-4 py-3 text-sm text-[var(--ink-muted)]">
          Multitask screen: {data.multitask.correct}/{data.multitask.scored} ·{" "}
          {data.multitask.score}/10
        </div>
      )}

      {data.pipelineStatus === "production_ready" && data.hearthlineOs && (
        <section className="hl-card-solid space-y-3 p-5">
          <h2 className="hl-serif text-xl text-[var(--ink)]">Your Hearthline OS seat</h2>
          <p className="text-sm text-[var(--ink-muted)]">{data.hearthlineOs.note}</p>
          <p className="text-sm text-[var(--ink)]">
            Use <strong>{data.candidate.email}</strong> with Google. You're provisioned as{" "}
            <strong>{data.roleTitle || "Sales Closer"}</strong> with vertical leads and a full job kit.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={data.hearthlineOs.loginUrl}
              className="hl-btn-primary flex-1 text-center"
              target="_blank"
              rel="noreferrer"
            >
              Sign in to Hearthline OS
            </a>
            <a
              href={data.hearthlineOs.jobKitUrl}
              className="hl-btn-secondary flex-1 text-center"
              target="_blank"
              rel="noreferrer"
            >
              Job kit (after login)
            </a>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--ink-muted)]">
            <li>Today queue — ranked dials for your vertical</li>
            <li>Job kit — ICP, scripts, products, first-week plan</li>
            <li>Playbook — channel hierarchy + daily cadence</li>
          </ul>
        </section>
      )}

      {/* Setup */}
      {!!data.setupTasks?.length && (
        <section className="space-y-3">
          <h2 className="hl-serif text-xl text-[var(--ink)]">
            Setup checklist ({data.setupProgress.done}/{data.setupProgress.total})
          </h2>
          {data.setupTasks.map((task) => (
            <div key={task.id} className="hl-card-solid p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void toggleTask(task.id, !task.completedAt)
                  }
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                    task.completedAt
                      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
                      : "border-[var(--line-strong)] bg-white"
                  }`}
                  aria-label={task.completedAt ? "Mark incomplete" : "Mark complete"}
                >
                  {task.completedAt ? "✓" : ""}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--ink)]">
                    {task.title}
                    {task.required && (
                      <span className="ml-1 text-[11px] font-normal text-[var(--accent)]">
                        required
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[13.5px] text-[var(--ink-muted)]">
                    {task.description}
                  </p>
                  {task.href && (
                    <a
                      href={task.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
                    >
                      Open link →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="hl-card p-4">
        <h2 className="hl-serif text-xl text-[var(--ink)]">Training</h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Modules read: {data.training.modulesRead?.length || 0} · Quiz:{" "}
          {data.training.quizPassed
            ? `passed (${data.training.quizScore}%)`
            : data.training.quizScore != null
              ? `${data.training.quizScore}%`
              : "not yet"}{" "}
          · Pitch:{" "}
          {data.training.practicePitchPassed
            ? `passed (${data.training.practicePitchScore}/10)`
            : data.training.practicePitchScore != null
              ? `${data.training.practicePitchScore}/10`
              : "not yet"}
        </p>
        <Link
          href={`/train/${data.id}?t=${data.portalToken}`}
          className="hl-btn-secondary mt-3 w-full"
        >
          Open training →
        </Link>
      </section>

      {data.calendarUrl && (
        <a
          href={data.calendarUrl}
          className="block text-center text-sm font-medium text-[var(--accent)]"
          target="_blank"
          rel="noreferrer"
        >
          Optional: book a human conversation →
        </a>
      )}
    </div>
  );
}

function primaryAction(data: PortalData): { href: string; label: string; external?: boolean } | null {
  const s = data.pipelineStatus;
  if (s === "hm_invited" || s === "hm_in_progress") {
    if (data.hmInterviewId)
      return {
        href: `/interview/${data.hmInterviewId}`,
        label: "Continue hiring manager interview →",
      };
  }
  if (s === "offer_pending" && data.offer?.token) {
    return {
      href: `/offer/${data.offer.token}`,
      label: "Review your offer →",
    };
  }
  if (
    s === "onboarding_invited" ||
    s === "onboarding_in_progress" ||
    s === "onboarding_incomplete"
  ) {
    if (data.onboardingInterviewId)
      return {
        href: `/interview/${data.onboardingInterviewId}`,
        label: "Continue onboarding with Riley →",
      };
  }
  if (s === "setup_in_progress" || s === "training_in_progress") {
    return {
      href: `/train/${data.id}?t=${data.portalToken}`,
      label: "Continue training →",
    };
  }
  if (s === "production_ready") {
    if (data.hearthlineOs?.loginUrl) {
      return {
        href: data.hearthlineOs.loginUrl,
        label: "Open Hearthline OS (your queue) →",
        external: true as const,
      };
    }
    return null;
  }
  if (s === "applied" || s === "screening_in_progress") {
    return { href: `/interview/${data.id}`, label: "Continue screening →" };
  }
  return null;
}
