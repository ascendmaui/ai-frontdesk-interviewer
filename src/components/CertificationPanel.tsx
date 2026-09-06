"use client";

import { useCallback, useEffect, useState } from "react";

type Cert = {
  certified: boolean;
  blockers: string[];
  modulesRead: number;
  modulesTotal: number;
  quizScore: number;
  quizPassed: boolean;
  pitchScore: number;
  pitchPassed: boolean;
  roleplayPasses: number;
  roleplayRequired: number;
  setupReady: boolean;
  offerAccepted: boolean;
};

export function CertificationPanel({ id, token }: { id: string; token: string }) {
  const [cert, setCert] = useState<Cert | null>(null);

  const load = useCallback(() => {
    fetch(`/api/train/${id}?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setCert(d.certification || null))
      .catch(() => setCert(null));
  }, [id, token]);

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (!cert) return null;

  const gates = [
    ["Offer / agreement", cert.offerAccepted],
    ["Required onboarding", cert.setupReady],
    [`All modules ${cert.modulesRead}/${cert.modulesTotal}`, cert.modulesRead >= cert.modulesTotal],
    [`Quiz ${cert.quizScore || 0}% / 85%`, cert.quizPassed],
    [`Roleplays ${cert.roleplayPasses}/${cert.roleplayRequired} · 8/10+`, cert.pitchPassed],
  ] as const;

  return (
    <section
      className={`rounded-[22px] border p-5 ${
        cert.certified
          ? "border-[var(--success-border)] bg-[var(--success-bg)]"
          : "border-[var(--accent-border)] bg-[var(--accent-wash)]"
      }`}
    >
      <p className="hl-eyebrow">Certification gate</p>
      <h2 className="hl-serif mt-1 text-2xl text-[var(--ink)]">
        {cert.certified ? "Certified for live leads" : "Live leads stay locked until you pass"}
      </h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {gates.map(([label, done]) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--line)] bg-white/55 px-3 py-2 text-sm"
          >
            <span className={done ? "text-[var(--success)]" : "text-[var(--ink-muted)]"}>
              {done ? "✓" : "○"} {label}
            </span>
          </div>
        ))}
      </div>
      {!!cert.blockers.length && (
        <ul className="mt-3 space-y-1 text-sm text-[var(--ink-muted)]">
          {cert.blockers.map((b) => (
            <li key={b}>· {b}</li>
          ))}
        </ul>
      )}
      <button type="button" onClick={load} className="mt-3 text-xs font-semibold text-[var(--accent)]">
        Refresh certification status
      </button>
    </section>
  );
}
