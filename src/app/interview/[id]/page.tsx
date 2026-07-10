import { InterviewRoom } from "@/components/InterviewRoom";
import { Shell } from "@/components/Shell";
import { COMPANY } from "@/lib/company";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Shell bare>
      <div className="mx-auto max-w-lg pt-[max(0.5rem,env(safe-area-inset-top))] sm:max-w-xl">
        <div className="mb-5 flex items-center gap-2.5 px-0.5">
          <span
            className="inline-block h-7 w-7 shrink-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 32% 30%, #E1906B, #BA5B33 70%)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,.35), 0 4px 12px rgba(186,91,51,.35)",
            }}
            aria-hidden
          />
          <div>
            <p className="hl-serif text-[1.15rem] leading-none text-[var(--ink)]">
              {COMPANY.product}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
              Live interview
            </p>
          </div>
        </div>
        <InterviewRoom interviewId={id} />
      </div>
    </Shell>
  );
}
