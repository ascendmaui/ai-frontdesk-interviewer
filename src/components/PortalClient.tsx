"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AreaOpt = { code: string; region: string; state: string };

type PortalData = {
  id: string;
  portalToken: string;
  roleTitle?: string;
  roleEmoji?: string;
  industry?: string;
  pipelineStatus: string;
  steps: { id: string; label: string; state: string }[];
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
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
    practicePitchPassed?: boolean;
  };
  calendarUrl?: string | null;
  hearthlineOs?: {
    loginUrl: string;
    jobKitUrl: string;
    dashboardUrl: string;
    playbookUrl: string;
    note: string;
  };
  territory?: { areaCodes: string[]; states: string[]; active: boolean } | null;
  suggestedAreaCode?: string | null;
  areaCodeOptions?: AreaOpt[];
  canEditTerritory?: boolean;
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
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [states, setStates] = useState("");
  const [terrMsg, setTerrMsg] = useState<string | null>(null);
  const [terrBusy, setTerrBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/portal/${id}?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErr(d.error);
        else {
          setData(d);
          const codes =
            d.territory?.areaCodes?.length
              ? d.territory.areaCodes
              : d.suggestedAreaCode
                ? [d.suggestedAreaCode]
                : [];
          setSelectedCodes(codes);
          setStates((d.territory?.states || []).join(", "));
        }
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

  async function saveTerritory() {
    setTerrBusy(true);
    setTerrMsg(null);
    try {
      const res = await fetch(`/api/portal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action: "save_territory",
          areaCodes: selectedCodes,
          states: states
            .split(/[,\s]+/)
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setTerrMsg(
        `Territory saved · NPAs ${j.territory.areaCodes.join(", ")}`,
      );
      load();
    } catch (e) {
      setTerrMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setTerrBusy(false);
    }
  }

  function toggleCode(code: string) {
    setSelectedCodes((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : prev.length >= 12
          ? prev
          : [...prev, code],
    );
  }

  if (err) {
    return (
      <div className="hl-empty border-[var(--danger-border)] bg-[var(--danger-bg)]">
        <p className="font-semibold text-[var(--danger)]">Portal unavailable</p>
        <p className="mt-1 text-sm text-[var(--danger)]">{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
        <p className="text-sm text-[var(--ink-faint)]">Loading your path…</p>
      </div>
    );
  }

  const primary = primaryAction(data);
  const showTerritory = data.canEditTerritory;

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

      {primary &&
        (primary.external ? (
          <a
            href={primary.href}
            target="_blank"
            rel="noreferrer"
            className="hl-btn-primary w-full"
          >
            {primary.label}
          </a>
        ) : (
          <Link href={primary.href} className="hl-btn-primary w-full">
            {primary.label}
          </Link>
        ))}

      {data.pipelineStatus === "production_ready" && data.hearthlineOs && (
        <div className="hl-card space-y-3 border border-[var(--success-border)] bg-[var(--success-bg)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--success)]">
            Production ready
          </p>
          <h2 className="hl-serif text-xl text-[var(--ink)]">
            Your Hearthline OS seat
          </h2>
          <p className="text-sm text-[var(--ink-muted)]">
            {data.hearthlineOs.note}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={data.hearthlineOs.loginUrl}
              target="_blank"
              rel="noreferrer"
              className="hl-btn-primary flex-1"
            >
              Sign in to Hearthline OS
            </a>
            <a
              href={data.hearthlineOs.jobKitUrl}
              target="_blank"
              rel="noreferrer"
              className="hl-btn-secondary flex-1"
            >
              Job kit
            </a>
          </div>
        </div>
      )}

      {!!data.setupTasks?.length && (
        <section className="space-y-3">
          <h2 className="hl-serif text-xl text-[var(--ink)]">
            Setup checklist ({data.setupProgress.done}/
            {data.setupProgress.total})
          </h2>
          {data.setupTasks.map((task) => (
            <div key={task.id} className="hl-card-solid p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => void toggleTask(task.id, !task.completedAt)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ${
                    task.completedAt
                      ? "border-[var(--success-border)] bg-[var(--success-bg)] text-[var(--success)]"
                      : "border-[var(--line-strong)] bg-white"
                  }`}
                  aria-label={
                    task.completedAt ? "Mark incomplete" : "Mark complete"
                  }
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
          {data.training.quizPassed ? "passed" : "not yet"} · Pitch:{" "}
          {data.training.practicePitchPassed ? "passed" : "not yet"}
        </p>
        <Link
          href={`/train/${data.id}?t=${data.portalToken}`}
          className="hl-btn-secondary mt-3 w-full"
        >
          Open training →
        </Link>
      </section>

      {showTerritory && (
        <section className="hl-card space-y-3 p-5">
          <div>
            <h2 className="hl-serif text-xl text-[var(--ink)]">
              Your territory
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Pick area codes that match the phone you dial from. Leads with
              those NPAs route to you first.
              {data.suggestedAreaCode
                ? ` Your phone suggests ${data.suggestedAreaCode}.`
                : ""}
            </p>
          </div>
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
            {(data.areaCodeOptions || []).map((r) => {
              const on = selectedCodes.includes(r.code);
              return (
                <button
                  key={r.code}
                  type="button"
                  onClick={() => toggleCode(r.code)}
                  title={`${r.region}, ${r.state}`}
                  className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${
                    on
                      ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                      : "border-[var(--line)] bg-white/60 text-[var(--ink-soft)]"
                  }`}
                >
                  {r.code} {r.state}
                </button>
              );
            })}
          </div>
          <label className="block">
            <span className="text-[12px] font-medium text-[var(--ink-muted)]">
              States (optional, comma-separated)
            </span>
            <input
              value={states}
              onChange={(e) => setStates(e.target.value)}
              className="hl-input"
              placeholder="SC, NC"
            />
          </label>
          <p className="text-[12px] text-[var(--ink-faint)]">
            Selected: {selectedCodes.join(", ") || "none"} (max 12)
          </p>
          {terrMsg && (
            <p className="text-sm text-[var(--ink-soft)]">{terrMsg}</p>
          )}
          <button
            type="button"
            disabled={terrBusy || !selectedCodes.length}
            onClick={() => void saveTerritory()}
            className="hl-btn-primary w-full disabled:opacity-50"
          >
            {terrBusy ? "Saving…" : "Save territory"}
          </button>
        </section>
      )}

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

function primaryAction(
  data: PortalData,
): { href: string; label: string; external?: boolean } | null {
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
  if (s === "setup_in_progress") {
    return null;
  }
  if (s === "training_in_progress" || s === "setup_complete") {
    return {
      href: `/train/${data.id}?t=${data.portalToken}`,
      label: "Continue training →",
    };
  }
  if (s === "production_ready") {
    if (data.hearthlineOs?.loginUrl) {
      return {
        href: data.hearthlineOs.loginUrl,
        label: "Open Hearthline OS (your seat) →",
        external: true,
      };
    }
    return null;
  }
  if (s === "applied" || s === "screening_in_progress") {
    return { href: `/interview/${data.id}`, label: "Continue screening →" };
  }
  return null;
}
