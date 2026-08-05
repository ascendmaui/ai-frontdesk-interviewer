"use client";

import { useEffect, useState } from "react";
import { CandidateShell } from "@/components/CandidateShell";
import { DoneView } from "@/components/DoneView";

export default function DonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [meta, setMeta] = useState<{
    rootId?: string;
    portalToken?: string;
  } | null>(null);

  useEffect(() => {
    void params.then((p) => {
      setId(p.id);
      fetch(`/api/interview/${p.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setMeta(d);
        })
        .catch(() => null);
    });
  }, [params]);

  if (!id) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <CandidateShell
      applicationId={meta?.rootId || id}
      token={meta?.portalToken}
      activePage="screening"
    >
      <DoneView interviewId={id} />
    </CandidateShell>
  );
}
