"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Module = { id: string; title: string; minutes: number; body: string };
type Q = { id: string; prompt: string; options: string[] };
type AcademyMeta = {
  title: string;
  industry: string;
  tagline: string;
  processSteps: { title: string; detail: string }[];
  talkTracks: string[];
  objections: { objection: string; reframe: string }[];
};

export function TrainClient({ id, token }: { id: string; token: string }) {
  const [academy, setAcademy] = useState<AcademyMeta | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [training, setTraining] = useState<{
    modulesRead: string[];
    quizPassed?: boolean;
    quizScore?: number;
    practicePitchPassed?: boolean;
    practicePitchScore?: number;
  }>({ modulesRead: [] });
  const [open, setOpen] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [pitchPath, setPitchPath] = useState<string | null>(null);
  const [tab, setTab] = useState<"modules" | "tracks" | "quiz" | "pitch">(
    "modules",
  );

  const load = useCallback(() => {
    fetch(`/api/train/${id}?t=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        setAcademy(d.academy || null);
        setModules(d.modules || []);
        setQuiz(d.quiz || []);
        setTraining(d.training || { modulesRead: [] });
      });
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(moduleId: string) {
    await fetch(`/api/train/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "read_module", moduleId }),
    });
    load();
  }

  async function submitQuiz() {
    const res = await fetch(`/api/train/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "submit_quiz", answers }),
    });
    const j = await res.json();
    if (j.passed) setMsg(`Quiz passed — ${j.correct}/${j.total}`);
    else setMsg(`Score ${j.training?.quizScore}% — need 80%. Try again.`);
    load();
  }

  async function startPitch() {
    const res = await fetch(`/api/train/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action: "start_pitch" }),
    });
    const j = await res.json();
    if (j.interviewPath) setPitchPath(j.interviewPath);
  }

  const readCount = training.modulesRead?.length || 0;

  return (
    <div className="animate-rise space-y-5">
      <div>
        <p className="hl-eyebrow">Industry academy</p>
        <h1 className="hl-serif mt-1 text-[1.85rem] text-[var(--ink)]">
          {academy?.title || "Closer academy"}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {academy?.tagline || "Seat-specific training"}
        </p>
        <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
          {academy?.industry} · Modules {readCount}/{modules.length} · Quiz{" "}
          {training.quizPassed
            ? `passed (${training.quizScore}%)`
            : training.quizScore != null
              ? `${training.quizScore}%`
              : "not yet"}{" "}
          · Pitch{" "}
          {training.practicePitchPassed
            ? `passed (${training.practicePitchScore}/10)`
            : "not yet"}
        </p>
      </div>

      <Link
        href={`/portal/${id}?t=${token}`}
        className="text-sm font-medium text-[var(--accent)]"
      >
        ← Back to portal
      </Link>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["modules", "Modules"],
            ["tracks", "Talk tracks"],
            ["quiz", "Quiz"],
            ["pitch", "Practice pitch"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === k
                ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                : "border-[var(--line)] text-[var(--ink-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "modules" && (
        <section className="space-y-3">
          {modules.map((m) => {
            const read = training.modulesRead?.includes(m.id);
            const isOpen = open === m.id;
            return (
              <div key={m.id} className="hl-card-solid overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                  onClick={() => setOpen(isOpen ? null : m.id)}
                >
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{m.title}</p>
                    <p className="text-xs text-[var(--ink-faint)]">
                      ~{m.minutes} min {read ? "· read ✓" : ""}
                    </p>
                  </div>
                  <span className="text-[var(--ink-faint)]">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-[var(--line)] px-4 pb-4">
                    <div className="prose-sm whitespace-pre-wrap pt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                      {m.body}
                    </div>
                    {!read && (
                      <button
                        type="button"
                        onClick={() => void markRead(m.id)}
                        className="hl-btn-primary mt-3 w-full"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {tab === "tracks" && academy && (
        <section className="space-y-4">
          <div className="hl-card p-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--accent)]">
              Your process
            </p>
            <ol className="mt-2 space-y-2">
              {academy.processSteps.map((s, i) => (
                <li key={s.title} className="text-sm text-[var(--ink-soft)]">
                  <span className="font-semibold text-[var(--ink)]">
                    {i + 1}. {s.title}
                  </span>
                  <br />
                  {s.detail}
                </li>
              ))}
            </ol>
          </div>
          <div className="hl-card-solid p-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--ink-faint)]">
              Talk tracks
            </p>
            <ul className="mt-2 space-y-2">
              {academy.talkTracks.map((t) => (
                <li
                  key={t}
                  className="rounded-xl border border-[var(--line)] bg-white/50 px-3 py-2 text-sm italic text-[var(--ink-soft)]"
                >
                  “{t}”
                </li>
              ))}
            </ul>
          </div>
          <div className="hl-card-solid p-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--ink-faint)]">
              Objections
            </p>
            <div className="mt-2 space-y-3">
              {academy.objections.map((o) => (
                <div key={o.objection}>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    “{o.objection}”
                  </p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    → {o.reframe}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "quiz" && (
        <section className="hl-card space-y-4 p-5">
          <h2 className="hl-serif text-xl">
            Knowledge quiz · {academy?.industry || "your seat"}
          </h2>
          <p className="text-xs text-[var(--ink-faint)]">
            Includes product basics + industry questions. Pass at 80%.
          </p>
          {quiz.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-[var(--ink)]">{q.prompt}</p>
              <div className="mt-2 grid gap-2">
                {q.options.map((opt, i) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm ${
                      answers[q.id] === i
                        ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                        : "border-[var(--line)] bg-white/60 text-[var(--ink-soft)]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => void submitQuiz()}
            className="hl-btn-primary w-full"
          >
            Submit quiz
          </button>
          {msg && <p className="text-sm text-[var(--ink-muted)]">{msg}</p>}
        </section>
      )}

      {tab === "pitch" && (
        <section className="hl-card p-5">
          <h2 className="hl-serif text-xl">Practice pitch with Coach</h2>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Live voice role-play for <strong>{academy?.industry}</strong> — you
            sell, Coach plays the owner. Need 7/10. Voice: Rex (energetic
            coach).
          </p>
          {pitchPath ? (
            <Link href={pitchPath} className="hl-btn-primary mt-3 w-full">
              Open practice pitch →
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void startPitch()}
              className="hl-btn-primary mt-3 w-full"
            >
              Start practice pitch
            </button>
          )}
        </section>
      )}
    </div>
  );
}
