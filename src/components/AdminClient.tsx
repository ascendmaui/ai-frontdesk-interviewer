"use client";

import { useCallback, useState } from "react";
import { REC_EMOJI, REC_LABEL, type Recommendation } from "@/lib/company";

type Row = {
  id: string;
  roleSlug: string;
  status: string;
  pipelineStatus?: string;
  createdAt: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  scorecard?: {
    overallScore?: number;
    recommendation?: string;
    summary?: string;
  };
  multitaskQuiz?: { multitaskScore?: number };
  offer?: { token?: string; status?: string };
  hmInterviewId?: string;
  onboardingInterviewId?: string;
  portalToken?: string;
  notifications?: {
    slack?: { ok?: boolean };
    emailCandidate?: { ok?: boolean };
  };
};

const COLUMNS = [
  "applied",
  "screening_in_progress",
  "hm_invited",
  "hm_in_progress",
  "hm_maybe",
  "offer_pending",
  "onboarding_invited",
  "setup_in_progress",
  "training_in_progress",
  "production_ready",
  "waitlisted",
  "rejected",
  "hm_rejected",
  "offer_declined",
];

export function AdminClient() {
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/interviews", {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      setRows(data.interviews || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  async function action(id: string, actionName: string) {
    setMsg(null);
    const res = await fetch("/api/admin/action", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, action: actionName }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j.error || "Action failed");
      return;
    }
    setMsg(`OK: ${actionName}`);
    void load();
  }

  const byCol = (status: string) =>
    rows.filter(
      (r) =>
        (r.pipelineStatus || r.status) === status ||
        (!r.pipelineStatus && status === "applied" && r.status === "applied"),
    );

  return (
    <div className="space-y-4 animate-rise">
      <p className="hl-eyebrow">Internal</p>
      <h1 className="hl-serif text-[2rem] text-[var(--ink)]">Hiring OS</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Pipeline kanban · force advance · offer · production ready
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Admin secret"
          className="hl-input mt-0 flex-1"
        />
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !secret}
          className="hl-btn-primary sm:min-w-[120px]"
        >
          {loading ? "Loading…" : "Load"}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = byCol(col);
          if (!items.length && rows.length) return null;
          return (
            <div key={col} className="hl-card-solid p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                {col.replace(/_/g, " ")} ({items.length})
              </p>
              <div className="mt-2 space-y-2">
                {items.map((r) => {
                  const rec = (r.scorecard?.recommendation ||
                    "maybe") as Recommendation;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl border border-[var(--line)] bg-white/70 p-3 text-xs"
                    >
                      <p className="font-semibold text-[var(--ink)]">
                        {REC_EMOJI[rec] || "·"} {r.candidate.firstName}{" "}
                        {r.candidate.lastName}
                      </p>
                      <p className="text-[var(--ink-muted)]">
                        {r.roleSlug} · {r.scorecard?.overallScore ?? "—"}/10
                        {r.multitaskQuiz?.multitaskScore != null
                          ? ` · mt ${r.multitaskQuiz.multitaskScore}`
                          : ""}
                      </p>
                      <p className="truncate text-[var(--ink-faint)]">
                        {r.candidate.email}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-2 py-1"
                          onClick={() => void action(r.id, "send_offer")}
                        >
                          Offer
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-2 py-1"
                          onClick={() => void action(r.id, "force_hm")}
                        >
                          Force HM
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-2 py-1"
                          onClick={() => void action(r.id, "force_onboarding")}
                        >
                          Onboard
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--line)] px-2 py-1"
                          onClick={() => void action(r.id, "production_ready")}
                        >
                          Ready
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-[var(--danger-border)] px-2 py-1 text-[var(--danger)]"
                          onClick={() => void action(r.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                      {r.portalToken && (
                        <a
                          className="mt-1 inline-block text-[var(--accent)]"
                          href={`/portal/${r.id}?t=${r.portalToken}`}
                        >
                          Portal →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!loading && rows.length === 0 && (
        <p className="text-sm text-[var(--ink-faint)]">No applications yet.</p>
      )}
    </div>
  );
}
