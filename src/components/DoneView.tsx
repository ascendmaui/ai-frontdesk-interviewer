"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DoneMeta = {
  firstName: string | null;
  roleTitle: string | null;
  kind: string;
  pipelineStatus: string;
  portalToken?: string;
  rootId?: string;
  hmInterviewId?: string;
  onboardingInterviewId?: string;
  offerToken?: string;
};

/**
 * Candidate-facing completion screen.
 * Never shows scores or recommendations. Routes to the next unlocked funnel step.
 */
export function DoneView({ interviewId }: { interviewId: string }) {
  const [meta, setMeta] = useState<DoneMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setMeta({
            firstName: d.candidate?.firstName || null,
            roleTitle: d.roleTitle || null,
            kind: d.kind || "screening",
            pipelineStatus: d.pipelineStatus || "",
            portalToken: d.portalToken,
            rootId: d.rootId || d.id,
            hmInterviewId: d.hmInterviewId,
            onboardingInterviewId: d.onboardingInterviewId,
            offerToken: d.offerToken,
          });
        }
        setLoaded(true);
      })
      .catch(() => {
        setError("Could not load confirmation");
        setLoaded(true);
      });
  }, [interviewId]);

  if (!loaded) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
        {error}
      </p>
    );
  }

  const name = meta?.firstName || "there";
  const next = nextStepCta(meta);

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-wash)] text-2xl">
        ✓
      </div>

      <div>
        <p className="hl-eyebrow">Session complete</p>
        <h1 className="hl-serif mt-2 text-[2rem] text-[var(--ink)] sm:text-[2.4rem]">
          Thank you, {name}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-muted)]">
          Your{meta?.roleTitle ? ` ${meta.roleTitle}` : ""}{" "}
          {sessionLabel(meta?.kind)} has been submitted successfully.
        </p>
      </div>

      {next ? (
        <div className="hl-card space-y-3 p-6 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
            Next step
          </p>
          <p className="hl-serif text-xl text-[var(--ink)]">{next.title}</p>
          <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
            {next.body}
          </p>
          <Link
            href={next.href}
            className="hl-btn-primary mt-2 inline-flex w-full justify-center"
          >
            {next.cta}
          </Link>
        </div>
      ) : (
        <div className="hl-card p-6 text-left">
          <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
            Our hiring team will review your conversation and follow up by email
            or phone. There&apos;s nothing else you need to do right now.
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-[var(--ink-muted)]">
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              Typical review window: 1–3 business days
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent)]">·</span>
              Watch for a message from AI Front Desk / Hearthline hiring
            </li>
          </ul>
        </div>
      )}

      <p className="text-[13px] text-[var(--ink-faint)]">
        Questions? Reply to any hiring email you receive.
      </p>

      <Link href="/" className="hl-btn-secondary inline-flex w-full justify-center">
        Back to careers
      </Link>
    </div>
  );
}

function sessionLabel(kind?: string) {
  switch (kind) {
    case "hiring_manager":
      return "hiring manager interview";
    case "onboarding":
      return "onboarding session";
    case "practice_pitch":
      return "practice pitch";
    default:
      return "interview";
  }
}

function nextStepCta(meta: DoneMeta | null): {
  title: string;
  body: string;
  href: string;
  cta: string;
} | null {
  if (!meta) return null;
  const s = meta.pipelineStatus;

  if (
    (s === "hm_invited" || s === "hm_in_progress") &&
    meta.hmInterviewId
  ) {
    return {
      title: "Hiring manager with Morgan",
      body: "You advanced to the next round. Start when you're ready — about 10–12 minutes.",
      href: `/interview/${meta.hmInterviewId}`,
      cta: "Start hiring manager interview",
    };
  }

  if ((s === "offer_pending" || s.startsWith("offer")) && meta.offerToken) {
    return {
      title: "Review your offer",
      body: "Your contingent offer is ready. Accept to unlock onboarding.",
      href: `/offer/${meta.offerToken}`,
      cta: "Open offer letter",
    };
  }

  if (
    (s === "onboarding_invited" || s === "onboarding_in_progress") &&
    meta.onboardingInterviewId
  ) {
    return {
      title: "Onboarding with Riley",
      body: "Walk through Slack, CRM, and your first 48 hours.",
      href: `/interview/${meta.onboardingInterviewId}`,
      cta: "Start onboarding",
    };
  }

  if (
    (s === "setup_in_progress" ||
      s === "setup_complete" ||
      s === "onboarding_complete") &&
    meta.rootId &&
    meta.portalToken
  ) {
    return {
      title: "Setup checklist",
      body: "Complete required tools, then open the industry academy.",
      href: `/portal/${meta.rootId}?t=${meta.portalToken}`,
      cta: "Open setup portal",
    };
  }

  if (
    (s.includes("training") || s === "production_ready") &&
    meta.rootId &&
    meta.portalToken
  ) {
    return {
      title:
        s === "production_ready" ? "You're production ready" : "Industry academy",
      body:
        s === "production_ready"
          ? "Your seat is live. Check portal for territory and OS access."
          : "Modules, quiz, and practice pitch with Coach.",
      href:
        s === "production_ready"
          ? `/portal/${meta.rootId}?t=${meta.portalToken}`
          : `/train/${meta.rootId}?t=${meta.portalToken}`,
      cta: s === "production_ready" ? "Open portal" : "Continue training",
    };
  }

  return null;
}
