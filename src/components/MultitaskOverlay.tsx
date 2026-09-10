"use client";

import { useEffect, useRef, useState } from "react";
import type { MultitaskQuestion } from "@/lib/multitask-quiz";
import type { MultitaskAnswer } from "@/lib/multitask-quiz";

type Props = {
  question: MultitaskQuestion | null;
  index: number;
  total: number;
  onAnswer: (answer: MultitaskAnswer) => void;
};

/**
 * Floating Yes/No card — does not pause the voice session.
 * Auto-skips on timeout to keep pressure realistic.
 */
export function MultitaskOverlay({ question, index, total, onAnswer }: Props) {
  const timeout = question?.timeoutSec ?? 18;
  const [secondsLeft, setSecondsLeft] = useState(timeout);
  const shownAt = useRef<number>(0);
  const answered = useRef(false);

  useEffect(() => {
    if (!question) return;
    answered.current = false;
    shownAt.current = Date.now();
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const auto = window.setTimeout(() => {
      if (answered.current) return;
      answered.current = true;
      const responseMs = Date.now() - shownAt.current;
      // Timeout: null answer; scored questions count as incorrect
      onAnswer({
        questionId: question.id,
        answer: null,
        correct: question.correct === null ? null : false,
        responseMs,
        answeredAt: Date.now(),
        timedOut: true,
      });
    }, timeout * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(auto);
    };
  }, [question, onAnswer, timeout]);

  if (!question) return null;

  function submit(value: boolean) {
    if (answered.current || !question) return;
    answered.current = true;
    const responseMs = Date.now() - shownAt.current;
    let correct: boolean | null = null;
    if (question.correct !== null) {
      correct = value === question.correct;
    }
    onAnswer({
      questionId: question.id,
      answer: value,
      correct,
      responseMs,
      answeredAt: Date.now(),
    });
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="dialog"
      aria-live="polite"
      aria-label="Multitask question"
    >
      <div className="pointer-events-auto w-full max-w-md animate-rise rounded-[22px] border border-[var(--accent-border)] bg-[rgba(255,253,247,0.97)] p-4 shadow-[0_18px_50px_rgba(90,60,30,0.22)] backdrop-blur-md sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="hl-pill border border-[var(--accent-border)] bg-[var(--accent-wash)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent)]">
            Multitask · {index + 1}/{total}
          </span>
          <span className="font-mono text-[12px] text-[var(--ink-faint)]">
            {secondsLeft}s
          </span>
        </div>
        <p className="mt-3 text-[15.5px] font-medium leading-snug text-[var(--ink)]">
          {question.prompt}
        </p>
        <p className="mt-1.5 text-[12px] text-[var(--ink-faint)]">
          Keep talking to Jordan — tap while you speak.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => submit(true)}
            className="min-h-12 rounded-[99px] bg-[var(--accent)] text-sm font-semibold text-[#FFF8F0] shadow-[0_8px_20px_rgba(186,91,51,0.28)] active:scale-[0.98]"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => submit(false)}
            className="min-h-12 rounded-[99px] border border-[var(--line-strong)] bg-white text-sm font-semibold text-[var(--ink)] active:scale-[0.98]"
          >
            No
          </button>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[rgba(35,29,21,0.08)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000 linear"
            style={{
              width: `${Math.max(0, (secondsLeft / (question.timeoutSec ?? 18)) * 100)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
