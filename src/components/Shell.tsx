import Link from "next/link";
import { COMPANY } from "@/lib/company";

export function Shell({
  children,
  bare,
}: {
  children: React.ReactNode;
  bare?: boolean;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Warm ambient wash — Claude / Hearthline style */}
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
        <div
          className="absolute -left-28 top-48 h-64 w-64 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, rgba(200,150,90,.14), transparent 70%)",
          }}
        />
      </div>

      {!bare && (
        <header className="relative z-20 border-b border-[var(--line)] bg-[rgba(250,245,236,0.78)] pt-[env(safe-area-inset-top)] backdrop-blur-[18px]">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3.5 sm:max-w-2xl sm:px-6">
            <Link
              href="/"
              className="flex min-h-11 items-center gap-2.5 text-[var(--ink)]"
            >
              <span
                className="inline-block h-[30px] w-[30px] shrink-0 rounded-full shadow-[0_4px_12px_rgba(186,91,51,.35)]"
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
                  Careers · Voice interviews
                </p>
              </div>
            </Link>
            <span className="hl-pill inline-flex items-center gap-1.5 border border-[var(--line)] bg-white/55 px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                style={{ animation: "pulseDot 2.4s infinite" }}
              />
              Hiring
            </span>
          </div>
        </header>
      )}

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5 sm:max-w-2xl sm:px-6 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
