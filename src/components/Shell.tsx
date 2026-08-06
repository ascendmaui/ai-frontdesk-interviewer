"use client";

import Link from "next/link";
import { COMPANY } from "@/lib/company";
import {
  ProcessMenu,
  type ProcessMenuContext,
} from "@/components/ProcessMenu";

export function Shell({
  children,
  bare,
  process,
}: {
  children: React.ReactNode;
  bare?: boolean;
  /** Candidate pipeline nav — only unlocked steps are clickable */
  process?: ProcessMenuContext;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(closest-side at 50% 0%, rgba(225,144,107,.28), transparent 72%)",
            animation: "drift 26s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-24 top-20 h-72 w-72 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(closest-side, rgba(186,91,51,.12), transparent 70%)",
          }}
        />
      </div>

      <header className="relative z-20 border-b border-[var(--line)] bg-[rgba(250,245,236,0.82)] pt-[env(safe-area-inset-top)] backdrop-blur-[20px]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3.5 sm:max-w-2xl sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5 text-[var(--ink)]"
          >
            <span
              className="inline-block h-[30px] w-[30px] shrink-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 32% 30%, #E1906B, #BA5B33 70%)",
                boxShadow:
                  "inset 0 0 0 1px rgba(255,255,255,.35), 0 4px 12px rgba(186,91,51,.35)",
              }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="hl-serif truncate text-[22px] leading-none tracking-[0.005em]">
                {COMPANY.product}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-[var(--ink-faint)]">
                {bare
                  ? "Secure voice session"
                  : process
                    ? "Your hiring path"
                    : "Careers · Sales closers"}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {!process && (
              <span className="hl-pill hidden items-center gap-1.5 border border-[var(--line)] bg-white/55 px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)] sm:inline-flex">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                  style={{ animation: "pulseDot 2.4s infinite" }}
                />
                Live hiring
              </span>
            )}
            {process && <ProcessMenu context={process} />}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 sm:max-w-2xl sm:px-6 sm:pt-8">
        {children}
      </main>

      <footer className="relative z-10 border-t border-[var(--line)] bg-[rgba(241,234,220,0.45)]">
        <div className="mx-auto flex max-w-lg flex-col gap-2 px-4 py-5 text-center sm:max-w-2xl sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left">
          <p className="text-[11px] text-[var(--ink-faint)]">
            © {new Date().getFullYear()} {COMPANY.brand} · AI Front Desk
          </p>
          <div className="flex justify-center gap-4 text-[12px]">
            <Link href="/" className="hl-link">
              Careers
            </Link>
            <Link href="/leads" className="hl-link">
              Demo for businesses
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
