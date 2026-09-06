import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { Shell } from "@/components/Shell";

const QA_ROLES = [
  ["home-services-closer", "Home Services"],
  ["hvac-closer", "HVAC"],
  ["plumbing-closer", "Plumbing"],
  ["electrical-closer", "Electrical"],
  ["autobody-closer", "Auto Body"],
  ["auto-service-closer", "Auto Service"],
  ["medspa-closer", "Med Spa"],
  ["dental-closer", "Dental"],
  ["law-firm-closer", "Law Firm"],
] as const;

export default function AdminQaPage() {
  return (
    <Shell bare>
      <AdminNav />
      <div className="animate-rise space-y-6">
        <div>
          <p className="hl-eyebrow">Admin QA</p>
          <h1 className="hl-serif mt-1 text-3xl text-[var(--ink)]">
            Full-path test · no skipped candidate forms
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            Start here when you want to experience the real candidate journey. The QA
            link opens the actual application form and tags the application as an
            admin QA run. Complete each real screen normally. If the AI intentionally
            rejects or waitlists your test answers, use the existing Hiring admin
            controls to advance that QA candidate, then continue through the real
            offer, onboarding, setup, academy, roleplays, and certification screens.
          </p>
        </div>

        <div className="hl-card p-5">
          <h2 className="hl-serif text-xl text-[var(--ink)]">Start an actual application</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Use a unique test email alias so the run is easy to find in Hiring.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {QA_ROLES.map(([slug, label]) => (
              <Link
                key={slug}
                href={`/apply/${slug}?utm_source=admin_qa&utm_medium=internal&utm_campaign=full_path_test`}
                target="_blank"
                className="hl-btn-secondary justify-between"
              >
                Test {label} →
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <section className="hl-card-solid p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">Candidate path</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              Apply → Jordan screening → Morgan hiring manager → contingent offer → Riley onboarding → required setup/documents → academy → 85% assessment → two 8/10 voice roleplays → production ready.
            </p>
          </section>
          <section className="hl-card-solid p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">What to verify</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
              Required fields, mobile layout, microphone flow, transcripts, stage transitions, offer acceptance, secure-document warnings, all module gates, Coach, roleplay scoring, and live-lead lock/unlock.
            </p>
          </section>
        </div>

        <Link href="/admin" className="hl-btn-primary w-full">
          Open Hiring admin to review QA candidate →
        </Link>
      </div>
    </Shell>
  );
}
