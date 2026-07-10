"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Role } from "@/lib/roles";

type Props = { role: Role };

export function ApplyForm({ role }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [yearsInSales, setYearsInSales] = useState("");
  const [industryExperience, setIndustryExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [consent, setConsent] = useState(false);

  const utm = useMemo(
    () => ({
      utmSource: search.get("utm_source") || "",
      utmMedium: search.get("utm_medium") || "",
      utmCampaign: search.get("utm_campaign") || "",
    }),
    [search],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleSlug: role.slug,
          firstName,
          lastName,
          email,
          phone,
          yearsInSales,
          industryExperience,
          linkedin,
          consent,
          ...utm,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit");
      router.push(`/interview/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 animate-rise">
      {/* honeypot */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        aria-hidden
      />
      <div className="hl-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{role.emoji}</span>
          <div>
            <p className="text-[12px] text-[var(--ink-faint)]">
              You&apos;re applying for
            </p>
            <h1 className="hl-serif text-[1.45rem] leading-tight text-[var(--ink)]">
              {role.title}
            </h1>
            <p className="text-[13px] text-[var(--ink-muted)]">{role.industry}</p>
          </div>
        </div>
        <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
          {role.blurb}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="hl-label">
          First name
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="hl-input"
            enterKeyHint="next"
          />
        </label>
        <label className="hl-label">
          Last name
          <input
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="hl-input"
            enterKeyHint="next"
          />
        </label>
      </div>

      <label className="hl-label">
        Email
        <input
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="hl-input"
          enterKeyHint="next"
        />
      </label>

      <label className="hl-label">
        Phone
        <input
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-5555"
          className="hl-input"
          enterKeyHint="next"
        />
      </label>

      <label className="hl-label">
        Years in sales
        <select
          value={yearsInSales}
          onChange={(e) => setYearsInSales(e.target.value)}
          className="hl-input"
        >
          <option value="">Select…</option>
          <option value="0-1">0–1</option>
          <option value="1-3">1–3</option>
          <option value="3-5">3–5</option>
          <option value="5-10">5–10</option>
          <option value="10+">10+</option>
        </select>
      </label>

      <fieldset>
        <legend className="hl-label">
          Sold to {role.shortLabel.toLowerCase()} / this industry before?
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              ["yes", "Yes"],
              ["some", "Some"],
              ["no", "No"],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setIndustryExperience(val)}
              className={`min-h-12 rounded-[14px] border text-sm font-medium transition ${
                industryExperience === val
                  ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                  : "border-[var(--line)] bg-white/50 text-[var(--ink-soft)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="hl-label">
        LinkedIn{" "}
        <span className="font-normal text-[var(--ink-faint)]">(optional)</span>
        <input
          type="url"
          inputMode="url"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/…"
          className="hl-input"
        />
      </label>

      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--line)] bg-white/45 p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded border-[var(--line-strong)] accent-[var(--accent)]"
          required
        />
        <span className="text-[13.5px] leading-snug text-[var(--ink-muted)]">
          I agree this interview may be recorded and transcribed for hiring. I
          consent to be contacted by phone, email, or text about this role.
        </span>
      </label>

      {error && (
        <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="hl-btn-primary w-full">
        {loading ? "Starting…" : "Continue to voice interview"}
      </button>

      <p className="text-center text-[11.5px] leading-relaxed text-[var(--ink-faint)]">
        Use headphones if you can. Works best in Safari, Chrome, or the Facebook
        in-app browser with mic permission allowed.
      </p>
    </form>
  );
}
