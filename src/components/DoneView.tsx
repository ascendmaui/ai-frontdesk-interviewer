"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { REC_LABEL, isQualified, type Recommendation } from "@/lib/company";

type Payload = {
  id: string;
  rootId?: string;
  roleTitle?: string;
  roleEmoji?: string;
  kind?: string;
  status?: string;
  pipelineStatus?: string;
  portalPath?: string;
  portalToken?: string;
  candidate?: { firstName?: string; lastName?: string; email?: string };
  durationSec?: number;
  scorecard?: {
    overallScore?: number;
    recommendation?: string;
    summary?: string;
    strengths?: string[];
    developmentAreas?: string[];
    scores?: Record<string, number>;
  };
  multitaskQuiz?: {
    correctCount?: number;
    scoredCount?: number;
    multitaskScore?: number;
  };
  hmInterviewId?: string;
  onboardingInterviewId?: string;
  offer?: { token?: string; status?: string };
  calendarUrl?: string | null;
  notifications?: { emailCandidate?: { ok?: boolean } };
};

export function DoneView({ interviewId }: { interviewId: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Could not load results"));
  }, [interviewId]);

  if (error) {
    return (
      <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  const rec = (data.scorecard?.recommendation || "maybe") as Recommendation;
  const qualified = isQualified(rec);
  const mins = data.durationSec
    ? `${Math.floor(data.durationSec / 60)}m ${data.durationSec % 60}s`
    : "—";
  const first = data.candidate?.firstName || "there";
  const kind = data.kind || "screening";
  const rootId = data.rootId || data.id;

  const cta = (() => {
    if (kind === "screening" && qualified && data.hmInterviewId) {
      return {
        href: `/interview/${data.hmInterviewId}`,
        label: "Start hiring manager interview →",
      };
    }
    if (kind === "hiring_manager" && data.offer?.token) {
      return {
        href: `/offer/${data.offer.token}`,
        label: "Review your offer →",
      };
    }
    if (
      (kind === "onboarding" || kind === "hiring_manager") &&
      data.onboardingInterviewId &&
      data.offer?.status === "accepted"
    ) {
      return {
        href: `/interview/${data.onboardingInterviewId}`,
        label: "Continue onboarding →",
      };
    }
    if (kind === "practice_pitch") {
      return {
        href: data.portalPath || `/portal/${rootId}`,
        label: "Back to portal →",
      };
    }
    return null;
  })();

  let headline = "Session complete";
  let sub = "";
  if (kind === "screening") {
    if (qualified && data.hmInterviewId) {
      headline = "Screening passed";
      sub = "Next: hiring manager interview with Morgan.";
    } else if (rec === "maybe") {
      headline = "Interview received";
      sub = "We're keeping your profile on file.";
    } else {
      headline = "Not moving forward this round";
      sub = "You're welcome to try another vertical later.";
    }
  } else if (kind === "hiring_manager") {
    if (data.offer?.token) {
      headline = "You're cleared for an offer";
      sub = "Review and accept to unlock onboarding.";
    } else if (rec === "maybe") {
      headline = "Under review";
      sub = "The team will follow up shortly.";
    } else {
      headline = "Not moving forward";
      sub = "Thank you for meeting with Morgan.";
    }
  } else if (kind === "onboarding") {
    headline = "Onboarding session complete";
    sub = "Finish your setup checklist and training in the portal.";
  } else if (kind === "practice_pitch") {
    headline = "Practice pitch complete";
    sub = qualified
      ? "Strong pitch — check portal for readiness."
      : "Review coaching notes and try again if needed.";
  }

  return (
    <div className="space-y-5 animate-rise">
      <div className="text-center">
        <p className="text-3xl">{data.roleEmoji || "✓"}</p>
        <h1 className="hl-serif mt-2 text-[1.85rem] text-[var(--ink)] sm:text-[2.25rem]">
          {headline}
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {data.roleTitle} · {mins}
          {data.pipelineStatus
            ? ` · ${data.pipelineStatus.replace(/_/g, " ")}`
            : ""}
        </p>
      </div>

      <div
        className={`rounded-[22px] border p-5 ${
          qualified || kind === "onboarding"
            ? "border-[var(--success-border)] bg-[var(--success-bg)]"
            : "hl-card"
        }`}
      >
        <p className="hl-eyebrow">For {first}</p>
        <p className="hl-serif mt-2 text-[1.35rem] text-[var(--ink)]">{sub}</p>
        {data.candidate?.email && (
          <p className="mt-3 text-[12px] text-[var(--ink-faint)]">
            {data.candidate.email}
          </p>
        )}
      </div>

      {cta && (
        <Link href={cta.href} className="hl-btn-primary w-full">
          {cta.label}
        </Link>
      )}

      {data.portalPath && (
        <Link href={data.portalPath} className="hl-btn-secondary w-full">
          Open candidate portal
        </Link>
      )}

      {data.calendarUrl && (rec === "maybe" || rec === "strong_yes") && (
        <a
          href={data.calendarUrl}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-sm font-medium text-[var(--accent)]"
        >
          Optional: book a human conversation →
        </a>
      )}

      {data.multitaskQuiz && (data.multitaskQuiz.scoredCount || 0) > 0 && (
        <div className="hl-card-solid p-5">
          <p className="hl-eyebrow">Multitask check</p>
          <p className="hl-serif mt-1 text-2xl text-[var(--ink)]">
            {data.multitaskQuiz.correctCount}/{data.multitaskQuiz.scoredCount}{" "}
            correct
            <span className="text-base text-[var(--ink-faint)]">
              {" "}
              · {data.multitaskQuiz.multitaskScore}/10
            </span>
          </p>
        </div>
      )}

      {data.scorecard && (
        <div className="hl-card-solid space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                Overall score
              </p>
              <p className="hl-serif text-4xl text-[var(--ink)]">
                {data.scorecard.overallScore ?? "—"}
                <span className="text-lg text-[var(--ink-faint)]">/10</span>
              </p>
            </div>
            <span className="hl-pill border border-[var(--accent-border)] bg-[var(--accent-wash)] px-3 py-1.5 text-sm font-semibold text-[var(--accent)]">
              {REC_LABEL[rec] || rec}
            </span>
          </div>
          {data.scorecard.summary && (
            <p className="text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
              {data.scorecard.summary}
            </p>
          )}
          {data.scorecard.scores && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.scorecard.scores).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between rounded-[12px] border border-[var(--line)] bg-white/60 px-2.5 py-2 text-xs"
                >
                  <span className="capitalize text-[var(--ink-faint)]">
                    {k.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-semibold text-[var(--ink)]">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Link href="/" className="hl-btn-secondary w-full">
        Browse other roles
      </Link>
    </div>
  );
}
