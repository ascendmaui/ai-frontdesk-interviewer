"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import type { ProcessMenuContext } from "@/components/ProcessMenu";
import type { ProcessStepId } from "@/lib/process-steps";

/**
 * Shell that loads pipeline state and enables the locked process hamburger menu.
 */
export function CandidateShell({
  children,
  applicationId,
  token,
  activePage,
  activeKind,
  bare,
}: {
  children: React.ReactNode;
  applicationId?: string;
  token?: string;
  activePage?: ProcessStepId;
  activeKind?: string;
  bare?: boolean;
}) {
  const [process, setProcess] = useState<ProcessMenuContext | undefined>(
    applicationId
      ? {
          applicationId,
          portalToken: token,
          activePage,
          activeKind,
          pipelineStatus: "applied",
        }
      : undefined,
  );

  useEffect(() => {
    if (!applicationId) return;
    const q = token ? `?t=${encodeURIComponent(token)}` : "";
    fetch(`/api/portal/${applicationId}${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || d.error) return;
        setProcess({
          applicationId: d.id,
          portalToken: d.portalToken || token,
          screeningId: d.id,
          hmInterviewId: d.hmInterviewId,
          offerToken: d.offer?.token,
          onboardingInterviewId: d.onboardingInterviewId,
          roleSlug: d.roleSlug,
          pipelineStatus: d.pipelineStatus,
          activePage,
          activeKind,
        });
      })
      .catch(() => null);
  }, [applicationId, token, activePage, activeKind]);

  return (
    <Shell bare={bare} process={process}>
      {children}
    </Shell>
  );
}
