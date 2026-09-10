"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CandidateShell } from "@/components/CandidateShell";
import { InterviewRoom } from "@/components/InterviewRoom";
import type { ProcessStepId } from "@/lib/process-steps";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = useSearchParams().get("t") || "";
  const [id, setId] = useState("");
  const [meta, setMeta] = useState<{
    kind?: string;
    rootId?: string;
    portalToken?: string;
    pipelineStatus?: string;
    hmInterviewId?: string;
    onboardingInterviewId?: string;
    offerToken?: string;
    roleSlug?: string;
  } | null>(null);

  useEffect(() => {
    void params.then((p) => {
      setId(p.id);
      fetch(`/api/interview/${p.id}?t=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setMeta(d);
        })
        .catch(() => null);
    });
  }, [params, token]);

  if (!id) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  const kind = meta?.kind || "screening";
  const activePage: ProcessStepId =
    kind === "hiring_manager"
      ? "hiring_manager"
      : kind === "onboarding"
        ? "onboarding"
        : kind === "practice_pitch"
          ? "training"
          : "screening";

  return (
    <CandidateShell
      bare
      applicationId={meta?.rootId || id}
      token={meta?.portalToken}
      activePage={activePage}
      activeKind={kind}
    >
      <InterviewRoom interviewId={id} token={token} />
    </CandidateShell>
  );
}
