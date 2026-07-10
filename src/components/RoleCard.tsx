import Link from "next/link";
import type { Role } from "@/lib/roles";

export function RoleCard({ role }: { role: Role }) {
  return (
    <Link
      href={`/apply/${role.slug}`}
      className="group relative flex min-h-[5.75rem] flex-col justify-between rounded-[22px] border border-white/80 bg-[rgba(255,255,255,0.58)] p-4 shadow-[0_10px_30px_rgba(90,60,30,0.07)] backdrop-blur-[14px] transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.98] sm:min-h-[6.5rem] sm:p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(90,60,30,0.12)]"
    >
      {role.featured && (
        <span className="absolute right-3 top-3 hl-pill border border-[var(--accent-border)] bg-[var(--accent-wash)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
          Hiring
        </span>
      )}
      <div className="flex items-start gap-3">
        <span className="text-[1.65rem] leading-none" aria-hidden>
          {role.emoji}
        </span>
        <div className="min-w-0 flex-1 pr-12">
          <h2 className="hl-serif text-[1.2rem] leading-snug text-[var(--ink)] sm:text-[1.3rem]">
            {role.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--ink-muted)]">
            {role.blurb}
          </p>
        </div>
      </div>
      <div className="mt-3.5 flex items-center justify-between">
        <span className="text-[12px] text-[var(--ink-faint)]">
          ~12–15 min voice
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line-strong)] text-sm text-[var(--ink-soft)] transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
          →
        </span>
      </div>
    </Link>
  );
}
