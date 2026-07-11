"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Candidate-facing completion screen.
 * Never shows scores, recommendations, multitask results, or next-stage CTAs.
 * Ops reviews everything in /admin.
 */
export function DoneView({ interviewId }: { interviewId: string }) {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [roleTitle, setRoleTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setFirstName(d.candidate?.firstName || null);
          setRoleTitle(d.roleTitle || null);
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

  const name = firstName || "there";

  return (
    <div className="mx-auto max-w-lg animate-rise space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-wash)] text-2xl">
        ✓
      </div>

      <div>
        <p className="hl-eyebrow">Application received</p>
        <h1 className="hl-serif mt-2 text-[2rem] text-[var(--ink)] sm:text-[2.4rem]">
          Thank you, {name}
        </h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-muted)]">
          Your{roleTitle ? ` ${roleTitle}` : ""} interview has been submitted
          successfully.
        </p>
      </div>

      <div className="hl-card p-6 text-left">
        <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Our hiring team will review your conversation and follow up by email
          or phone after the review. There&apos;s nothing else you need to do
          right now.
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
          <li className="flex gap-2">
            <span className="text-[var(--accent)]">·</span>
            Keep this tab closed — your session is already saved
          </li>
        </ul>
      </div>

      <p className="text-[13px] text-[var(--ink-faint)]">
        Questions? Reply to any hiring email you receive, or contact the team
        that invited you to apply.
      </p>

      <Link href="/" className="hl-btn-secondary inline-flex w-full">
        Back to careers
      </Link>
    </div>
  );
}
