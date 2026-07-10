"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function OfferClient({ token }: { token: string }) {
  const [data, setData] = useState<{
    title?: string;
    body?: string;
    status?: string;
    candidate?: { firstName?: string };
    applicationId?: string;
    portalToken?: string;
    error?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    status?: string;
    portalPath?: string;
    onboardingPath?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/offer/${token}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: "Could not load offer" }));
  }, [token]);

  async function act(action: "accept" | "decline") {
    setBusy(true);
    try {
      const res = await fetch(`/api/offer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setResult(j);
      setData((d) => (d ? { ...d, status: j.status } : d));
    } catch (e) {
      setData((d) => ({
        ...(d || {}),
        error: e instanceof Error ? e.message : "Failed",
      }));
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  if (data.error && !data.title) {
    return (
      <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] p-4 text-[var(--danger)]">
        {data.error}
      </p>
    );
  }

  const accepted = data.status === "accepted" || result?.status === "accepted";
  const declined = data.status === "declined" || result?.status === "declined";

  return (
    <div className="animate-rise space-y-5">
      <p className="hl-eyebrow">Contingent offer</p>
      <h1 className="hl-serif text-[2rem] text-[var(--ink)] sm:text-[2.4rem]">
        {data.title}
      </h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Hi {data.candidate?.firstName || "there"} — review carefully, then
        accept to unlock onboarding.
      </p>

      <div
        className="hl-card-solid prose-sm max-w-none p-5 text-[15px] leading-relaxed text-[var(--ink-soft)] [&_h3]:hl-serif [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:text-[var(--ink)] [&_li]:my-1 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: data.body || "" }}
      />

      {data.error && (
        <p className="text-sm text-[var(--danger)]">{data.error}</p>
      )}

      {accepted && (
        <div className="rounded-[22px] border border-[var(--success-border)] bg-[var(--success-bg)] p-5">
          <p className="hl-serif text-xl text-[var(--ink)]">Offer accepted</p>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Next: onboarding voice with Riley, then setup & training.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {result?.onboardingPath && (
              <Link href={result.onboardingPath} className="hl-btn-primary w-full">
                Start onboarding with Riley →
              </Link>
            )}
            {data.applicationId && (
              <Link
                href={`/portal/${data.applicationId}?t=${data.portalToken || ""}`}
                className="hl-btn-secondary w-full"
              >
                Open candidate portal
              </Link>
            )}
          </div>
        </div>
      )}

      {declined && (
        <div className="hl-card p-5 text-sm text-[var(--ink-muted)]">
          Offer declined. If this was a mistake, contact hiring.
        </div>
      )}

      {!accepted && !declined && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("accept")}
            className="hl-btn-primary w-full"
          >
            {busy ? "Saving…" : "Accept offer"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("decline")}
            className="hl-btn-secondary w-full"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
