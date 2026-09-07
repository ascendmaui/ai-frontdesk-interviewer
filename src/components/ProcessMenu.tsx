"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PROCESS_STEPS,
  currentStepId,
  hrefForStep,
  isStepUnlocked,
  type ProcessStepId,
} from "@/lib/process-steps";
import type { PipelineStatus } from "@/lib/types";

export type ProcessMenuContext = {
  applicationId?: string;
  portalToken?: string;
  screeningId?: string;
  hmInterviewId?: string | null;
  offerToken?: string | null;
  onboardingInterviewId?: string | null;
  roleSlug?: string;
  pipelineStatus?: PipelineStatus | string;
  /** Active page kind for highlight */
  activeKind?: string;
  activePage?: ProcessStepId;
};

export function ProcessMenu({ context }: { context?: ProcessMenuContext }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const status = context?.pipelineStatus || "applied";
  const active =
    context?.activePage ||
    currentStepId(status, context?.activeKind);

  const links = {
    hasApplication: Boolean(context?.applicationId || context?.screeningId),
    hmInterviewId: context?.hmInterviewId,
    offerToken: context?.offerToken,
    onboardingInterviewId: context?.onboardingInterviewId,
    portalToken: context?.portalToken,
  };

  return (
    <>
      {/* Desktop / wide: compact top step bar */}
      <div className="mr-1 hidden max-w-[min(100vw-8rem,28rem)] items-center gap-1 overflow-x-auto md:flex">
        {PROCESS_STEPS.map((step) => {
          const unlocked = isStepUnlocked(step.id, status, links);
          const href = unlocked
            ? hrefForStep(step.id, {
                applicationId: context?.applicationId,
                portalToken: context?.portalToken,
                screeningId: context?.screeningId,
                hmInterviewId: context?.hmInterviewId,
                offerToken: context?.offerToken,
                onboardingInterviewId: context?.onboardingInterviewId,
                roleSlug: context?.roleSlug,
              })
            : null;
          const isCurrent = step.id === active;
          const chip = (
            <span
              className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                isCurrent
                  ? "bg-[var(--accent)] text-white"
                  : unlocked
                    ? "bg-[var(--bg-deep)] text-[var(--ink-soft)]"
                    : "bg-transparent text-[var(--ink-faint)] opacity-50"
              }`}
            >
              {step.shortLabel}
            </span>
          );
          if (unlocked && href) {
            return (
              <Link key={step.id} href={href} title={step.description}>
                {chip}
              </Link>
            );
          }
          return (
            <span key={step.id} title={unlocked ? step.description : "Locked"}>
              {chip}
            </span>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Open process menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white/70 text-[var(--ink)] shadow-sm"
      >
        <span className="flex flex-col gap-[5px]" aria-hidden>
          <span className="block h-[2px] w-5 rounded bg-[var(--ink)]" />
          <span className="block h-[2px] w-5 rounded bg-[var(--ink)]" />
          <span className="block h-[2px] w-5 rounded bg-[var(--ink)]" />
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav
            className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-[var(--bg-card-solid)] shadow-2xl"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <div>
                <p className="hl-serif text-lg text-[var(--ink)]">Your path</p>
                <p className="text-[11px] text-[var(--ink-faint)]">
                  Steps unlock as you progress
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] text-lg text-[var(--ink-muted)]"
              >
                ×
              </button>
            </div>

            <ol className="flex-1 overflow-y-auto px-3 py-3">
              {PROCESS_STEPS.map((step, i) => {
                const unlocked = isStepUnlocked(step.id, status, links);
                const href = unlocked
                  ? hrefForStep(step.id, {
                      applicationId: context?.applicationId,
                      portalToken: context?.portalToken,
                      screeningId: context?.screeningId,
                      hmInterviewId: context?.hmInterviewId,
                      offerToken: context?.offerToken,
                      onboardingInterviewId: context?.onboardingInterviewId,
                      roleSlug: context?.roleSlug,
                    })
                  : null;
                const isCurrent = step.id === active;

                const inner = (
                  <div
                    className={`flex gap-3 rounded-2xl border px-3 py-3 transition ${
                      isCurrent
                        ? "border-[var(--accent-border)] bg-[var(--accent-wash)]"
                        : unlocked
                          ? "border-[var(--line)] bg-white/60"
                          : "border-transparent bg-transparent opacity-45"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCurrent
                          ? "bg-[var(--accent)] text-white"
                          : unlocked
                            ? "bg-[var(--bg-deep)] text-[var(--ink-soft)]"
                            : "bg-[var(--line)] text-[var(--ink-faint)]"
                      }`}
                    >
                      {unlocked ? i + 1 : "🔒"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {step.label}
                        {step.agent ? (
                          <span className="ml-1 font-normal text-[var(--ink-faint)]">
                            · {step.agent}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-snug text-[var(--ink-muted)]">
                        {step.description}
                      </p>
                      {!unlocked && (
                        <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
                          Locked until you reach this stage
                        </p>
                      )}
                    </div>
                  </div>
                );

                if (unlocked && href) {
                  return (
                    <li key={step.id} className="mb-2">
                      <Link href={href} onClick={() => setOpen(false)}>
                        {inner}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={step.id} className="mb-2">
                    {inner}
                  </li>
                );
              })}
            </ol>

            <div className="border-t border-[var(--line)] px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-[var(--accent)]"
              >
                ← All open seats
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
