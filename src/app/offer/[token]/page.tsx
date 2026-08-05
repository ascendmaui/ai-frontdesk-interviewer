"use client";

import { useEffect, useState } from "react";
import { CandidateShell } from "@/components/CandidateShell";
import { OfferClient } from "@/components/OfferClient";

export default function OfferPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState("");
  const [appId, setAppId] = useState<string | undefined>();
  const [portalToken, setPortalToken] = useState<string | undefined>();

  useEffect(() => {
    void params.then((p) => {
      setToken(p.token);
      fetch(`/api/offer/${p.token}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.applicationId) setAppId(d.applicationId);
          if (d.portalToken) setPortalToken(d.portalToken);
        })
        .catch(() => null);
    });
  }, [params]);

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)]">
        <div className="animate-spin-accent h-8 w-8 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <CandidateShell
      applicationId={appId}
      token={portalToken}
      activePage="offer"
    >
      <OfferClient token={token} />
    </CandidateShell>
  );
}
