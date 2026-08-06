"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Hiring", sub: "Interviews · offers" },
  { href: "/admin/crm", label: "CRM", sub: "Leads · territories" },
  { href: "/admin/systems", label: "Systems", sub: "Pipelines · Slack" },
  { href: "/leads", label: "Lead form", sub: "Public intake" },
];

export function AdminNav() {
  const path = usePathname() || "/admin";

  return (
    <nav className="mb-6" aria-label="Admin sections">
      <div className="hl-nav-strip">
        {LINKS.map((l) => {
          const active =
            l.href === "/admin"
              ? path === "/admin"
              : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`min-w-[7.5rem] shrink-0 rounded-2xl border px-3.5 py-2.5 transition ${
                active
                  ? "border-[var(--accent-border)] bg-[var(--accent-wash)] shadow-sm"
                  : "border-[var(--line)] bg-white/50 hover:bg-white/80"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--ink)]">
                {l.label}
              </p>
              <p className="text-[11px] text-[var(--ink-faint)]">{l.sub}</p>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
