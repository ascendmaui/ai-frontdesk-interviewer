"use client";

import { useCallback, useEffect, useState } from "react";
import { REC_EMOJI, REC_LABEL, type Recommendation } from "@/lib/company";
import {
  ADVANCE_REQUIREMENTS,
  DIMENSION_RUBRIC,
  SCORE_BANDS,
  bandForScore,
  explainScore,
} from "@/lib/scoring-rubric";

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
  hireVerdict?: {
    decision?: string;
    label?: string;
    headline?: string;
    overallScore?: number;
    confidence?: string;
  };
  multitaskQuiz?: {
    multitaskScore?: number;
    correctCount?: number;
    scoredCount?: number;
  };
  portalToken?: string;
};

type HireVerdictView = {
  decision: string;
  label: string;
  color: string;
  headline: string;
  confidence: string;
  summary: string;
  overallScore: number;
  strengths: string[];
  risks: string[];
  nextAction: string;
  evidence: {
    talkTurns: number;
    candidateTurns: number;
    assistantTurns: number;
    durationSec: number;
    multitaskScore?: number;
    transcriptAvailable: boolean;
  };
};

type SessionDetail = {
  id: string;
  kind: string;
  status: string;
  durationSec?: number;
  createdAt: string;
  completedAt?: string;
  scorecard?: {
    overallScore?: number;
    recommendation?: string;
    summary?: string;
    strengths?: string[];
    developmentAreas?: string[];
    scores?: Record<string, number>;
    rolePlayNotes?: string;
    nextStep?: string;
  };
  hireVerdict?: HireVerdictView;
  multitaskQuiz?: {
    multitaskScore?: number;
    correctCount?: number;
    scoredCount?: number;
    accuracy?: number;
    skippedCount?: number;
    avgResponseMs?: number;
    answers?: {
      questionId: string;
      answer: boolean | null;
      correct: boolean | null;
      responseMs: number;
      timedOut?: boolean;
    }[];
  };
  transcript: {
    id: string;
    role: string;
    text: string;
    at: number;
  }[];
  eventTypes?: string[];
};

type Detail = {
  application: {
    id: string;
    roleTitle?: string;
    roleEmoji?: string;
    industry?: string;
    roleSlug: string;
    pipelineStatus: string;
    createdAt: string;
    candidate: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      yearsInSales?: string;
      industryExperience?: string;
      linkedin?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    };
    scorecard?: SessionDetail["scorecard"];
    hireVerdict?: SessionDetail["hireVerdict"];
    multitaskQuiz?: SessionDetail["multitaskQuiz"];
    offer?: { token?: string; status?: string };
  };
  sessions: SessionDetail[];
  media?: { audioRecording: null; note: string };
};

function authHeaders(secret: string) {
  return { Authorization: `Bearer ${secret}` };
}

function mmss(sec?: number) {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export function AdminClient() {
  const [secret, setSecret] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [actionLinks, setActionLinks] = useState<Record<
    string,
    string | null
  > | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/interviews", {
        headers: authHeaders(secret),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unauthorized");
      setRows(data.interviews || []);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("af_admin_secret", secret);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    const s = sessionStorage.getItem("af_admin_secret");
    if (s) setSecret(s);
  }, []);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/interviews/${id}`, {
        headers: authHeaders(secret),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setDetail(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setDetailLoading(false);
    }
  }

  async function action(id: string, actionName: string, roleSlug?: string) {
    setMsg(null);
    setBusyAction(actionName);
    setActionLinks(null);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: {
          ...authHeaders(secret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action: actionName, roleSlug }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(`❌ ${j.error || "Action failed"}`);
        return;
      }
      const prov = j.hearthlineProvision;
      if (prov?.error) setMsg(`✓ ${j.message || actionName} · OS: ${prov.error}`);
      else if (prov?.email)
        setMsg(
          `✓ ${j.message || actionName} · OS: ${prov.positionTitle} · ${prov.assignedLeads?.length || 0} leads → ${prov.email}`,
        );
      else setMsg(`✓ ${j.message || actionName}`);
      if (j.links) setActionLinks(j.links);
      // Prefer returned application id for test user create
      const refreshId = j.id || id;
      await load();
      if (refreshId) await openDetail(refreshId);
    } catch (e) {
      setMsg(e instanceof Error ? `❌ ${e.message}` : "❌ Network error");
    } finally {
      setBusyAction(null);
    }
  }

  const filtered = rows.filter((r) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      r.candidate.firstName.toLowerCase().includes(q) ||
      r.candidate.lastName.toLowerCase().includes(q) ||
      r.candidate.email.toLowerCase().includes(q) ||
      r.roleSlug.toLowerCase().includes(q) ||
      (r.pipelineStatus || "").toLowerCase().includes(q)
    );
  });

  // Detail view
  if (detail) {
    const app = detail.application;
    const rec = (app.scorecard?.recommendation || "maybe") as Recommendation;
    return (
      <div className="animate-rise space-y-5">
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="text-sm font-medium text-[var(--accent)]"
        >
          ← Back to list
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="hl-eyebrow">Review</p>
            <h1 className="hl-serif text-[1.85rem] text-[var(--ink)]">
              {app.roleEmoji} {app.candidate.firstName}{" "}
              {app.candidate.lastName}
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {app.roleTitle} · {app.pipelineStatus?.replace(/_/g, " ")}
            </p>
          </div>
          <div className="text-right">
            <p className="hl-serif text-3xl text-[var(--ink)]">
              {app.hireVerdict?.overallScore ??
                app.scorecard?.overallScore ??
                "—"}
              <span className="text-base text-[var(--ink-faint)]">/10</span>
            </p>
            <p className="text-sm font-medium text-[var(--accent)]">
              {REC_EMOJI[rec]}{" "}
              {app.hireVerdict?.label || REC_LABEL[rec] || rec}
            </p>
          </div>
        </div>

        {/* Hire verdict banner */}
        <div
          className={`rounded-[22px] border p-5 ${
            app.hireVerdict?.color === "green"
              ? "border-[var(--success-border)] bg-[var(--success-bg)]"
              : app.hireVerdict?.color === "red"
                ? "border-[var(--danger-border)] bg-[var(--danger-bg)]"
                : "border-[var(--accent-border)] bg-[var(--accent-wash)]"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
            AI hire analysis
            {app.hireVerdict?.confidence
              ? ` · ${app.hireVerdict.confidence} confidence`
              : ""}
          </p>
          <p className="hl-serif mt-1 text-xl text-[var(--ink)]">
            {app.hireVerdict?.headline ||
              (app.scorecard
                ? `${REC_LABEL[rec] || "Review needed"}`
                : "No analysis yet — click Re-run analysis")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
            {app.hireVerdict?.summary ||
              app.scorecard?.summary ||
              "This interview has no scorecard yet. If a transcript exists below, re-run analysis."}
          </p>
          {app.hireVerdict?.nextAction && (
            <p className="mt-3 text-sm font-medium text-[var(--ink)]">
              Recommended next step: {app.hireVerdict.nextAction}
            </p>
          )}
          {app.hireVerdict?.evidence && (
            <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
              Evidence: {app.hireVerdict.evidence.candidateTurns} candidate
              turns · {app.hireVerdict.evidence.assistantTurns} agent turns ·{" "}
              {Math.floor((app.hireVerdict.evidence.durationSec || 0) / 60)}m
              talk · transcript{" "}
              {app.hireVerdict.evidence.transcriptAvailable
                ? "captured"
                : "MISSING"}
              {app.hireVerdict.evidence.multitaskScore != null
                ? ` · multitask ${app.hireVerdict.evidence.multitaskScore}/10`
                : ""}
            </p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {!!app.hireVerdict?.strengths?.length && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-[var(--success)]">
                  Strengths
                </p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--ink-soft)]">
                  {app.hireVerdict.strengths.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!app.hireVerdict?.risks?.length && (
              <div>
                <p className="text-[11px] font-semibold uppercase text-[var(--accent)]">
                  Risks / gaps
                </p>
                <ul className="mt-1 space-y-1 text-sm text-[var(--ink-soft)]">
                  {app.hireVerdict.risks.map((s) => (
                    <li key={s}>· {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Contact card */}
        <div className="hl-card-solid grid gap-2 p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--ink-faint)]">Email</span>
            <br />
            <a
              className="font-medium text-[var(--accent)]"
              href={`mailto:${app.candidate.email}`}
            >
              {app.candidate.email}
            </a>
          </p>
          <p>
            <span className="text-[var(--ink-faint)]">Phone</span>
            <br />
            <a
              className="font-medium text-[var(--ink)]"
              href={`tel:${app.candidate.phone}`}
            >
              {app.candidate.phone}
            </a>
          </p>
          <p>
            <span className="text-[var(--ink-faint)]">Sales experience</span>
            <br />
            {app.candidate.yearsInSales || "—"} · industry:{" "}
            {app.candidate.industryExperience || "—"}
          </p>
          <p>
            <span className="text-[var(--ink-faint)]">UTM</span>
            <br />
            {[app.candidate.utmSource, app.candidate.utmMedium, app.candidate.utmCampaign]
              .filter(Boolean)
              .join(" / ") || "—"}
          </p>
          {app.candidate.linkedin && (
            <p className="sm:col-span-2">
              <span className="text-[var(--ink-faint)]">LinkedIn</span>
              <br />
              <a
                href={app.candidate.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)]"
              >
                {app.candidate.linkedin}
              </a>
            </p>
          )}
        </div>

        {/* Pipeline walkthrough */}
        <div className="hl-card-solid space-y-3 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            Pipeline controls (testing + ops)
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["reanalyze", "Re-run analysis"],
                ["simulate_pass_screening", "Force pass → HM"],
                ["force_hm", "Invite / open HM"],
                ["send_offer", "Create offer"],
                ["force_onboarding", "Start onboarding"],
                ["unlock_training", "Unlock training"],
                ["production_ready", "MANUAL · Mark production ready (+ OS provision)"],
                ["provision_hearthline", "MANUAL · Provision → Hearthline OS"],
                // AUTO: training complete / practice pitch pass (no button)
                ["reject", "Reject"],
              ] as const
            ).map(([act, label]) => (
              <button
                key={act}
                type="button"
                disabled={busyAction === act}
                onClick={() => void action(app.id, act)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                  act === "reject"
                    ? "border-[var(--danger-border)] text-[var(--danger)]"
                    : act === "simulate_pass_screening" || act === "force_hm"
                      ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                      : "border-[var(--line-strong)] text-[var(--ink-soft)]"
                }`}
              >
                {busyAction === act ? "Working…" : label}
              </button>
            ))}
          </div>
          {msg && (
            <p
              className={`text-sm ${
                msg.startsWith("❌")
                  ? "text-[var(--danger)]"
                  : "text-[var(--success)]"
              }`}
            >
              {msg}
            </p>
          )}
          {actionLinks && (
            <div className="flex flex-col gap-2 border-t border-[var(--line)] pt-3">
              <p className="text-[11px] font-semibold uppercase text-[var(--ink-faint)]">
                Open next step
              </p>
              {actionLinks.hmInterviewUrl && (
                <a
                  href={actionLinks.hmInterviewUrl}
                  className="hl-btn-primary text-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Talk to hiring manager (Morgan) →
                </a>
              )}
              {actionLinks.offerUrl && (
                <a
                  href={actionLinks.offerUrl}
                  className="hl-btn-secondary text-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open offer page →
                </a>
              )}
              {actionLinks.onboardingUrl && (
                <a
                  href={actionLinks.onboardingUrl}
                  className="hl-btn-secondary text-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Talk to onboarding (Riley) →
                </a>
              )}
              {actionLinks.trainUrl && (
                <a
                  href={actionLinks.trainUrl}
                  className="hl-btn-secondary text-center text-sm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open training academy →
                </a>
              )}
              {actionLinks.portalUrl && (
                <a
                  href={actionLinks.portalUrl}
                  className="text-center text-sm font-medium text-[var(--accent)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  Candidate portal →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Scoring explanation */}
        <div className="hl-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
              Why this score · what it takes to advance
            </p>
            <button
              type="button"
              className="text-xs font-medium text-[var(--accent)]"
              onClick={() => setShowRubric((v) => !v)}
            >
              {showRubric ? "Hide full rubric" : "Show full rubric"}
            </button>
          </div>
          {(() => {
            const score =
              app.hireVerdict?.overallScore ?? app.scorecard?.overallScore;
            const band = bandForScore(score);
            const turns =
              detail.sessions.reduce(
                (n, s) =>
                  n +
                  (s.transcript || []).filter((t) => t.role === "user").length,
                0,
              ) || 0;
            const explanations = explainScore({
              overallScore: score,
              recommendation:
                app.hireVerdict?.decision || app.scorecard?.recommendation,
              candidateTurns: turns,
              durationSec: detail.sessions.reduce(
                (n, s) => n + (s.durationSec || 0),
                0,
              ),
              multitaskScore:
                app.multitaskQuiz?.multitaskScore ??
                app.hireVerdict?.evidence?.multitaskScore,
            });
            return (
              <>
                <p className="hl-serif text-lg text-[var(--ink)]">{band.label}</p>
                <ul className="space-y-1.5 text-sm text-[var(--ink-soft)]">
                  {explanations.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
                {app.scorecard?.scores && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(app.scorecard.scores).map(([k, v]) => {
                      const dim = DIMENSION_RUBRIC.find((d) => d.key === k);
                      return (
                        <div
                          key={k}
                          className="rounded-lg border border-[var(--line)] bg-white/60 px-2 py-2 text-xs"
                          title={dim?.whatItMeasures}
                        >
                          <div className="flex justify-between">
                            <span className="capitalize text-[var(--ink-faint)]">
                              {dim?.label || k}
                            </span>
                            <span className="font-semibold">{v}/10</span>
                          </div>
                          {dim && (
                            <p className="mt-1 text-[10px] leading-snug text-[var(--ink-faint)]">
                              ≥6: {dim.toScore6}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {showRubric && (
                  <div className="space-y-2 border-t border-[var(--line)] pt-3">
                    {SCORE_BANDS.map((b) => (
                      <div
                        key={b.label}
                        className="rounded-xl border border-[var(--line)] bg-white/50 p-3 text-xs"
                      >
                        <p className="font-semibold text-[var(--ink)]">
                          {b.label}
                        </p>
                        <p className="mt-1 text-[var(--ink-muted)]">{b.meaning}</p>
                        <p className="mt-1 text-[var(--accent)]">{b.advance}</p>
                      </div>
                    ))}
                    <p className="text-[12px] text-[var(--ink-muted)]">
                      Auto-advance: {ADVANCE_REQUIREMENTS.autoAdvance}
                    </p>
                    <p className="text-[12px] text-[var(--ink-muted)]">
                      Borderline: {ADVANCE_REQUIREMENTS.borderline}
                    </p>
                    <p className="text-[12px] text-[var(--ink-muted)]">
                      Block: {ADVANCE_REQUIREMENTS.block}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Voice / recording note */}
        <div className="rounded-xl border border-[var(--line)] bg-white/50 px-3 py-3 text-[12px] text-[var(--ink-muted)]">
          <p className="font-semibold text-[var(--ink)]">Voice recording</p>
          <p className="mt-1">
            Live audio streams through Grok Voice and is not stored as a
            downloadable file in this app. Review the full transcript below. For
            account-level voice usage, open the xAI console.
          </p>
          <a
            href="https://console.x.ai/"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block font-medium text-[var(--accent)]"
          >
            Open xAI console →
          </a>
          {detail.media?.note && (
            <p className="mt-2 text-[var(--ink-faint)]">{detail.media.note}</p>
          )}
        </div>

        {/* Sessions */}
        {detail.sessions.map((session) => (
          <SessionReview key={session.id} session={session} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-rise">
      <p className="hl-eyebrow">Internal</p>
      <h1 className="hl-serif text-[2rem] text-[var(--ink)]">
        Interview review
      </h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Scores, multitask results, and full transcripts. Candidates never see
        this data. Use pipeline controls to walk HM → offer → onboarding → train
        without redoing forms.
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
          {loading ? "Loading…" : "Load interviews"}
        </button>
      </div>

      {secret && (
        <button
          type="button"
          disabled={!!busyAction}
          onClick={() =>
            void action("", "create_test_user", "hvac-closer")
          }
          className="hl-btn-secondary w-full text-sm"
        >
          {busyAction === "create_test_user"
            ? "Creating…"
            : "Create admin test user (skip forms · jump to HM)"}
        </button>
      )}
      {msg && !detail && (
        <p
          className={`text-sm ${
            msg.startsWith("❌") ? "text-[var(--danger)]" : "text-[var(--success)]"
          }`}
        >
          {msg}
        </p>
      )}
      {actionLinks && !detail && (
        <div className="hl-card space-y-2 p-4">
          <p className="text-xs font-semibold uppercase text-[var(--ink-faint)]">
            Test pipeline links
          </p>
          {actionLinks.hmInterviewUrl && (
            <a
              className="block font-medium text-[var(--accent)]"
              href={actionLinks.hmInterviewUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open HM interview →
            </a>
          )}
          {actionLinks.portalUrl && (
            <a
              className="block text-sm text-[var(--ink-muted)]"
              href={actionLinks.portalUrl}
              target="_blank"
              rel="noreferrer"
            >
              Portal →
            </a>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search name, email, role…"
          className="hl-input mt-0"
        />
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {msg && <p className="text-sm text-[var(--success)]">{msg}</p>}
      {detailLoading && (
        <p className="text-sm text-[var(--ink-faint)]">Loading review…</p>
      )}

      <div className="space-y-2">
        {filtered.map((r) => {
          const rec = (r.scorecard?.recommendation ||
            "maybe") as Recommendation;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => void openDetail(r.id)}
              className="hl-card-solid flex w-full flex-col gap-1 p-4 text-left transition hover:border-[var(--accent-border)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[var(--ink)]">
                  {REC_EMOJI[rec] || "·"} {r.candidate.firstName}{" "}
                  {r.candidate.lastName}
                </p>
                <p className="truncate text-sm text-[var(--ink-muted)]">
                  {r.roleSlug} · {r.candidate.email} · {r.candidate.phone}
                </p>
                <p className="text-[11px] text-[var(--ink-faint)]">
                  {(r.pipelineStatus || r.status).replace(/_/g, " ")} ·{" "}
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="hl-serif text-2xl text-[var(--ink)]">
                  {r.hireVerdict?.overallScore ??
                    r.scorecard?.overallScore ??
                    "—"}
                  <span className="text-sm text-[var(--ink-faint)]">/10</span>
                </p>
                <p className="text-xs font-medium text-[var(--accent)]">
                  {r.hireVerdict?.label || REC_LABEL[rec] || rec || "No grade"}
                </p>
                {r.multitaskQuiz?.multitaskScore != null && (
                  <p className="text-[11px] text-[var(--ink-faint)]">
                    Multitask {r.multitaskQuiz.multitaskScore}/10
                    {r.multitaskQuiz.scoredCount
                      ? ` · ${r.multitaskQuiz.correctCount}/${r.multitaskQuiz.scoredCount}`
                      : ""}
                  </p>
                )}
                <p className="mt-1 text-[11px] font-medium text-[var(--accent)]">
                  Open review →
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {!loading && rows.length === 0 && (
        <p className="text-sm text-[var(--ink-faint)]">
          Load with your admin secret to see interviews.
        </p>
      )}
    </div>
  );
}

function SessionReview({ session }: { session: SessionDetail }) {
  const rec = (session.scorecard?.recommendation || "") as Recommendation | "";
  const lines = (session.transcript || []).filter(
    (t) => t.role === "user" || t.role === "assistant",
  );

  return (
    <section className="hl-card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            {session.kind.replace(/_/g, " ")}
          </p>
          <p className="text-sm text-[var(--ink-muted)]">
            {mmss(session.durationSec)} · {session.status}
            {session.completedAt
              ? ` · ${new Date(session.completedAt).toLocaleString()}`
              : ""}
          </p>
        </div>
        {session.scorecard?.overallScore != null && (
          <div className="text-right">
            <p className="hl-serif text-2xl">
              {session.scorecard.overallScore}
              <span className="text-sm text-[var(--ink-faint)]">/10</span>
            </p>
            {rec && (
              <p className="text-xs text-[var(--accent)]">
                {REC_LABEL[rec as Recommendation] || rec}
              </p>
            )}
          </div>
        )}
      </div>

      {session.scorecard?.summary && (
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          {session.scorecard.summary}
        </p>
      )}

      {session.scorecard?.scores && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(session.scorecard.scores).map(([k, v]) => (
            <div
              key={k}
              className="flex justify-between rounded-lg border border-[var(--line)] bg-white/60 px-2 py-1.5 text-xs"
            >
              <span className="capitalize text-[var(--ink-faint)]">
                {k.replace(/([A-Z])/g, " $1")}
              </span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      )}

      {!!session.scorecard?.strengths?.length && (
        <div>
          <p className="text-[11px] font-semibold uppercase text-[var(--ink-faint)]">
            Strengths
          </p>
          <ul className="mt-1 space-y-1 text-sm text-[var(--success)]">
            {session.scorecard.strengths.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      )}

      {!!session.scorecard?.developmentAreas?.length && (
        <div>
          <p className="text-[11px] font-semibold uppercase text-[var(--ink-faint)]">
            Development
          </p>
          <ul className="mt-1 space-y-1 text-sm text-[var(--accent)]">
            {session.scorecard.developmentAreas.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      )}

      {session.multitaskQuiz && (session.multitaskQuiz.scoredCount || 0) > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-white/50 p-3 text-sm">
          <p className="font-semibold text-[var(--ink)]">Multitask pop-ups</p>
          <p className="text-[var(--ink-muted)]">
            {session.multitaskQuiz.correctCount}/
            {session.multitaskQuiz.scoredCount} correct · score{" "}
            {session.multitaskQuiz.multitaskScore}/10
            {session.multitaskQuiz.skippedCount
              ? ` · ${session.multitaskQuiz.skippedCount} timed out`
              : ""}
            {session.multitaskQuiz.avgResponseMs
              ? ` · avg ${Math.round(session.multitaskQuiz.avgResponseMs / 1000)}s`
              : ""}
          </p>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
          Transcript ({lines.length} turns)
        </p>
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">
            No transcript captured for this session.
          </p>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-xl border border-[var(--line)] bg-[#fffdf7] p-3">
            {lines.map((line) => {
              const isUser = line.role === "user";
              return (
                <div
                  key={line.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed ${
                      isUser
                        ? "rounded-br-md border border-[var(--accent-border)] bg-[var(--accent-wash)]"
                        : "rounded-bl-md border border-[var(--line)] bg-white"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                      {isUser ? "Candidate" : "Agent"}
                      {line.at
                        ? ` · ${new Date(line.at).toLocaleTimeString()}`
                        : ""}
                    </p>
                    {line.text}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
