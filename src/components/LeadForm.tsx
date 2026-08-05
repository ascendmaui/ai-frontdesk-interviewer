"use client";

import { useState } from "react";
import { INDUSTRY_TO_ROLE } from "@/lib/territories";

const INDUSTRIES = Object.keys(INDUSTRY_TO_ROLE);

export function LeadForm() {
  const [form, setForm] = useState({
    industry: "hvac",
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    state: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{
    id: string;
    status: string;
    assignedCloserName?: string;
    areaCode?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: "marketing_landing",
          utmSource: params?.get("utm_source") || undefined,
          utmCampaign: params?.get("utm_campaign") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setDone(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="hl-card p-6 text-center animate-rise">
        <p className="hl-eyebrow">Received</p>
        <h1 className="hl-serif mt-1 text-2xl text-[var(--ink)]">
          Thanks — we&apos;ll be in touch
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          Your request was routed by area code{" "}
          <strong>{done.areaCode || "—"}</strong>
          {done.assignedCloserName
            ? ` to ${done.assignedCloserName}`
            : " to our team (a closer will claim it shortly)"}
          .
        </p>
        <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
          Ref: {done.id} · status {done.status}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4 animate-rise">
      <div>
        <p className="hl-eyebrow">AI Front Desk</p>
        <h1 className="hl-serif text-[1.85rem] text-[var(--ink)]">
          Get a demo for your business
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Tell us your industry — we match you with a local closer by phone area
          code.
        </p>
      </div>

      <div className="hl-card space-y-3 p-5">
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Industry
          </span>
          <select
            value={form.industry}
            onChange={(e) =>
              setForm((f) => ({ ...f, industry: e.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Business name
          </span>
          <input
            value={form.businessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessName: e.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Your name
          </span>
          <input
            value={form.contactName}
            onChange={(e) =>
              setForm((f) => ({ ...f, contactName: e.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Phone *
          </span>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            placeholder="(864) 555-0100"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Email
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            State
          </span>
          <input
            value={form.state}
            onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
            placeholder="SC"
            maxLength={2}
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Notes
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          />
        </label>

        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full min-h-12 rounded-[99px] bg-[var(--accent)] text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Sending…" : "Request demo"}
        </button>
      </div>
    </form>
  );
}
