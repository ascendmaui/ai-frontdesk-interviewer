"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MultitaskOverlay } from "@/components/MultitaskOverlay";
import {
  QUIZ_FIRST_DELAY_MS,
  QUIZ_INTERVAL_MS,
  buildQuizForRole,
  type MultitaskAnswer,
  type MultitaskQuestion,
} from "@/lib/multitask-quiz";
import {
  VoiceSession,
  type SessionStatus,
  type TranscriptLine,
} from "@/lib/voice-session";

type Meta = {
  id: string;
  roleTitle?: string;
  roleEmoji?: string;
  roleSlug?: string;
  kind?: string;
  agentName?: string;
  agentTone?: string;
  voice?: string;
  candidate?: { firstName?: string; lastName?: string };
  status?: string;
  enableMultitaskQuiz?: boolean;
};

export function InterviewRoom({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [phase, setPhase] = useState<"ready" | "live" | "finishing">("ready");
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [level, setLevel] = useState(0);
  const [speaking, setSpeaking] = useState<"user" | "assistant" | null>(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  // Multitask quiz
  const [quizQueue, setQuizQueue] = useState<MultitaskQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(-1);
  const [activeQuestion, setActiveQuestion] = useState<MultitaskQuestion | null>(
    null,
  );
  const [multitaskAnswers, setMultitaskAnswers] = useState<MultitaskAnswer[]>(
    [],
  );
  const quizStarted = useRef(false);
  const quizTimers = useRef<number[]>([]);

  const sessionRef = useRef<VoiceSession | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const multitaskRef = useRef<MultitaskAnswer[]>([]);
  const endingRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const syncToServer = useCallback(async () => {
    const durationSec = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    try {
      await fetch(`/api/interview/${interviewId}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptRef.current,
          durationSec,
          multitaskAnswers: multitaskRef.current,
          eventTypes: sessionRef.current?.getEventTypes?.() || [],
        }),
        keepalive: true,
      });
    } catch {
      /* best-effort */
    }
  }, [interviewId]);

  const kind = meta?.kind || "screening";
  const agentName =
    meta?.agentName ||
    (kind === "hiring_manager"
      ? "Morgan"
      : kind === "onboarding"
        ? "Riley"
        : kind === "practice_pitch"
          ? "Coach"
          : "Jordan");
  const isScreening = kind === "screening";

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  useEffect(() => {
    multitaskRef.current = multitaskAnswers;
  }, [multitaskAnswers]);

  useEffect(() => {
    fetch(`/api/interview/${interviewId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setMeta(d);
          if (
            d.status === "completed" ||
            d.status === "abandoned" ||
            d.scorecard
          ) {
            router.replace(`/done/${interviewId}`);
          }
          if (d.roleSlug && (d.kind || "screening") === "screening") {
            setQuizQueue(buildQuizForRole(d.roleSlug));
          }
        }
      })
      .catch(() => setError("Could not load interview"));
  }, [interviewId, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, showTranscript]);

  useEffect(() => {
    if (phase !== "live" || status !== "live") return;
    const id = window.setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase, status]);

  // Persist transcript every 8s while live
  useEffect(() => {
    if (phase !== "live" || status !== "live") return;
    void syncToServer();
    syncTimerRef.current = window.setInterval(() => {
      void syncToServer();
    }, 8000);
    return () => {
      if (syncTimerRef.current) window.clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    };
  }, [phase, status, syncToServer]);

  // Flush on tab close
  useEffect(() => {
    const onHide = () => {
      if (phase === "live" && transcriptRef.current.length) {
        void syncToServer();
      }
    };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
    };
  }, [phase, syncToServer]);

  const clearQuizTimers = useCallback(() => {
    quizTimers.current.forEach((t) => window.clearTimeout(t));
    quizTimers.current = [];
  }, []);

  useEffect(() => {
    return () => {
      void sessionRef.current?.stop();
      clearQuizTimers();
      if (syncTimerRef.current) window.clearInterval(syncTimerRef.current);
    };
  }, [clearQuizTimers]);

  const scheduleQuiz = useCallback(
    (queue: MultitaskQuestion[]) => {
      if (!queue.length || quizStarted.current) return;
      quizStarted.current = true;
      clearQuizTimers();
      queue.forEach((q, i) => {
        const delay = QUIZ_FIRST_DELAY_MS + i * QUIZ_INTERVAL_MS;
        const t = window.setTimeout(() => {
          setQuizIndex(i);
          setActiveQuestion(q);
        }, delay);
        quizTimers.current.push(t);
      });
    },
    [clearQuizTimers],
  );

  const onMultitaskAnswer = useCallback((answer: MultitaskAnswer) => {
    setMultitaskAnswers((prev) => [...prev, answer]);
    setActiveQuestion(null);
  }, []);

  const finish = useCallback(
    async (fromStatus?: SessionStatus) => {
      if (endingRef.current) return;
      endingRef.current = true;
      setPhase("finishing");
      setStatus("ending");
      setActiveQuestion(null);
      clearQuizTimers();

      const durationSec = startedAtRef.current
        ? Math.floor((Date.now() - startedAtRef.current) / 1000)
        : elapsed;

      const eventTypes = sessionRef.current?.getEventTypes?.() || [];
      const finalTranscript =
        sessionRef.current?.getTranscript?.() || transcriptRef.current;

      try {
        await sessionRef.current?.stop();
      } catch {
        /* ignore */
      }
      sessionRef.current = null;

      // Final sync before score
      try {
        await fetch(`/api/interview/${interviewId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            durationSec,
            multitaskAnswers: multitaskRef.current,
            eventTypes,
          }),
          keepalive: true,
        });
      } catch {
        /* best-effort */
      }

      try {
        const res = await fetch("/api/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            transcript: finalTranscript,
            durationSec,
            multitaskAnswers: multitaskRef.current,
            eventTypes,
            force: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not finalize");
        router.replace(`/done/${interviewId}`);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Could not save interview. Check connection.",
        );
        endingRef.current = false;
        setPhase("live");
        if (fromStatus) setStatus(fromStatus);
      }
    },
    [clearQuizTimers, elapsed, interviewId, router],
  );

  const start = useCallback(async () => {
    setError(null);
    setPhase("live");
    setStatus("connecting");
    setTranscript([]);
    setMultitaskAnswers([]);
    setActiveQuestion(null);
    setElapsed(0);
    startedAtRef.current = null;
    endingRef.current = false;
    quizStarted.current = false;

    const session = new VoiceSession({
      onStatus: (s) => {
        setStatus(s);
        if (s === "live" && !startedAtRef.current) {
          startedAtRef.current = Date.now();
          if (isScreening && quizQueue.length) {
            scheduleQuiz(quizQueue);
          }
        }
        if (s === "ended" && !endingRef.current && startedAtRef.current) {
          const dur = Math.floor((Date.now() - startedAtRef.current) / 1000);
          if (dur > 60) void finish("ended");
        }
      },
      onTranscript: setTranscript,
      onLevel: setLevel,
      onSpeaking: setSpeaking,
      onError: (msg) => setError(msg),
    });
    sessionRef.current = session;

    try {
      await session.unlockAudio();
      await session.start(interviewId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start");
      setPhase("ready");
      setStatus("error");
    }
  }, [finish, interviewId, isScreening, quizQueue, scheduleQuiz]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sessionRef.current?.setMuted(next);
  };

  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");
  const levelPct = Math.min(100, Math.round(level * 400));

  const readyCopy = useMemo(() => {
    if (kind === "hiring_manager") {
      return {
        title: `Hiring manager round, ${meta?.candidate?.firstName || ""}`.trim(),
        body: `You'll speak with ${agentName} (~10–12 min) — senior hiring manager voice. Deeper dive on how you'd run the seat day to day.`,
        bullets: [
          "No pop-up quiz this round — focus on the conversation",
          "Be ready to walk through a Monday pipeline plan",
          "Honest answers beat polished scripts",
          `Voice: ${meta?.agentTone || "decisive, senior"}`,
        ],
      };
    }
    if (kind === "onboarding") {
      return {
        title: "Onboarding with Riley",
        body: "Walk through Slack, tools, and your first 48 hours. Have a note app ready if you like.",
        bullets: [
          "You'll get invite links by email too",
          "Ask questions anytime",
          "Ops provisions CRM/dialer if not live yet",
        ],
      };
    }
    return {
      title: "Ready when you are",
      body: `${meta?.roleTitle || "Sales Closer"} · ~12–15 min with ${agentName}. While you talk, Yes/No boxes may pop up — answer them without stopping the conversation.`,
      bullets: [
        "Speak naturally — multitask pop-ups test real closer load",
        "Includes industry role-play",
        "After you finish, our team reviews and will contact you",
      ],
    };
  }, [agentName, kind, meta?.candidate?.firstName, meta?.agentTone, meta?.roleTitle]);

  if (phase === "finishing") {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center animate-rise">
        <div className="animate-spin-accent h-10 w-10 rounded-full border-2 border-[rgba(186,91,51,0.2)] border-t-[var(--accent)]" />
        <p className="hl-serif mt-5 text-2xl text-[var(--ink)]">
          Wrapping up…
        </p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--ink-muted)]">
          Scoring your session
          {isScreening ? " and multitask answers" : ""}, then routing next
          steps. Keep this tab open.
        </p>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="space-y-5 animate-rise">
        <div className="hl-card p-5 sm:p-6">
          <p className="text-3xl">{meta?.roleEmoji || "🎙️"}</p>
          <h1 className="hl-serif mt-2 text-[1.75rem] text-[var(--ink)] sm:text-[2rem]">
            {readyCopy.title}
            {meta?.candidate?.firstName
              ? `, ${meta.candidate.firstName}`
              : ""}
          </h1>
          <p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
            {readyCopy.body}
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-[var(--ink-muted)]">
            {readyCopy.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-[var(--accent)]">·</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void start()}
          className="hl-btn-primary w-full"
        >
          Start session
        </button>
        <p className="text-center text-[11.5px] text-[var(--ink-faint)]">
          Tap once to unlock mic + audio (required on iPhone / Facebook
          browser).
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-28 animate-rise">
      <div className="flex items-center justify-between text-[13px]">
        <span className="truncate font-medium text-[var(--ink-soft)]">
          {meta?.roleEmoji} {meta?.roleTitle}
          {meta?.kind && meta.kind !== "screening"
            ? ` · ${meta.kind === "hiring_manager" ? "HM" : "Onboarding"}`
            : ""}
        </span>
        <span className="font-mono text-[var(--ink)]">
          {mm}:{ss}
        </span>
      </div>

      <div className="hl-card flex flex-col items-center px-4 py-8">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full transition-opacity"
            style={{
              background:
                "radial-gradient(circle, rgba(225,144,107,.35), transparent 70%)",
              opacity: speaking === "assistant" ? 1 : 0.45,
            }}
          />
          <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-card-solid)] shadow-[0_8px_24px_rgba(90,60,30,0.08)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              {meta?.kind === "onboarding"
                ? "Guide"
                : meta?.kind === "hiring_manager"
                  ? "Hiring mgr"
                  : "Interviewer"}
            </p>
            <p className="hl-serif text-[1.45rem] text-[var(--ink)]">
              {agentName}
            </p>
            {speaking === "assistant" && (
              <div className="mt-2 flex h-4 items-end gap-[3px]">
                {[0, 0.15, 0.3, 0.45, 0.6].map((d) => (
                  <span
                    key={d}
                    className="w-[3.5px] rounded-sm bg-[var(--accent)]"
                    style={{
                      height: 16,
                      animation: `wave 1s ease-in-out ${d}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--ink-muted)]">
          {status === "connecting"
            ? "Connecting secure voice…"
            : speaking === "assistant"
              ? `${agentName} is speaking`
              : speaking === "user"
                ? "Listening to you"
                : "Live — speak anytime"}
        </p>

        {isScreening && multitaskAnswers.length > 0 && (
          <p className="mt-2 text-[12px] text-[var(--ink-faint)]">
            Multitask answered: {multitaskAnswers.length}
            {quizQueue.length ? ` / ${quizQueue.length}` : ""}
          </p>
        )}

        <div className="mt-5 w-full max-w-xs">
          <div className="mb-1 flex justify-between text-[11px] text-[var(--ink-faint)]">
            <span>Mic</span>
            <span>{muted ? "Muted" : "Open"}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[rgba(35,29,21,0.08)]">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${muted ? 0 : levelPct}%`,
                background: muted
                  ? "#c4b8a8"
                  : "linear-gradient(90deg, #E1906B, #BA5B33)",
              }}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3.5 py-2.5 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className={`min-h-14 rounded-[99px] border text-sm font-semibold transition ${
            muted
              ? "border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)]"
              : "border-[var(--line-strong)] bg-white/50 text-[var(--ink-soft)]"
          }`}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button
          type="button"
          onClick={() => void finish()}
          className="hl-btn-dark min-h-14"
        >
          End session
        </button>
      </div>

      <button
        type="button"
        onClick={() => setShowTranscript((v) => !v)}
        className="min-h-11 text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      >
        {showTranscript ? "Hide transcript" : "Show live transcript"}
      </button>

      {showTranscript && (
        <div className="max-h-[40dvh] space-y-2.5 overflow-y-auto rounded-[20px] border border-[var(--line)] bg-white/50 p-3.5">
          {transcript.length === 0 && (
            <p className="text-sm text-[var(--ink-faint)]">Waiting for speech…</p>
          )}
          {transcript.map((line) => (
            <Bubble key={line.id} line={line} agentName={agentName} />
          ))}
          <div ref={endRef} />
        </div>
      )}

      {isScreening && (
        <MultitaskOverlay
          question={activeQuestion}
          index={Math.max(0, quizIndex)}
          total={quizQueue.length || 1}
          onAnswer={onMultitaskAnswer}
        />
      )}
    </div>
  );
}

function Bubble({
  line,
  agentName,
}: {
  line: TranscriptLine;
  agentName: string;
}) {
  if (line.role === "system") {
    return (
      <p className="text-center text-[11px] text-[var(--ink-faint)]">
        {line.text}
      </p>
    );
  }
  const isUser = line.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] px-3.5 py-2.5 text-[14px] leading-relaxed ${
          isUser
            ? "rounded-[16px_16px_4px_16px] border border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--ink)]"
            : "rounded-[16px_16px_16px_4px] border border-[var(--line)] bg-[var(--bg-card-solid)] text-[var(--ink)]"
        } ${line.partial ? "opacity-70" : ""}`}
      >
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
          {isUser ? "You" : agentName}
        </p>
        {line.text}
      </div>
    </div>
  );
}
