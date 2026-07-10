import { RoleCard } from "@/components/RoleCard";
import { Shell } from "@/components/Shell";
import { COMPANY } from "@/lib/company";
import { ROLES } from "@/lib/roles";

export default function HomePage() {
  return (
    <Shell>
      <section className="mb-7 animate-rise sm:mb-9">
        <div className="hl-pill mb-3 inline-flex items-center gap-2 border border-[var(--line)] bg-white/55 px-3.5 py-1.5 text-[13px] text-[var(--ink-muted)] backdrop-blur-sm">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
            style={{ animation: "pulseDot 2.4s infinite" }}
          />
          Now hiring · ~15 min voice interviews
        </div>
        <h1 className="hl-serif text-balance text-[2.15rem] text-[var(--ink)] sm:text-[2.75rem]">
          Close AI for the industries{" "}
          <em className="italic text-[var(--accent)]">you know</em>
        </h1>
        <p className="mt-3.5 max-w-xl text-pretty text-[15.5px] leading-relaxed text-[var(--ink-muted)] sm:text-[17px]">
          Pick a sales closer seat at {COMPANY.brand}. Live voice screening
          with multitask Yes/No checks — passers move to a hiring manager
          round, then AI-guided onboarding.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map((role, i) => (
          <div
            key={role.slug}
            className="animate-rise"
            style={{ animationDelay: `${0.04 * i}s` }}
          >
            <RoleCard role={role} />
          </div>
        ))}
      </div>

      <p className="mt-9 text-center text-[12px] leading-relaxed text-[var(--ink-faint)]">
        Mobile-friendly · Safari, Chrome & Facebook browser · Powered by Grok
        Voice
      </p>
    </Shell>
  );
}
