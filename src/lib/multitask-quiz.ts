/**
 * Pop-up Yes/No questions during the live voice interview.
 * Measures multitasking under cognitive load while talking to Jordan.
 */

export type MultitaskQuestion = {
  id: string;
  prompt: string;
  /** Correct answer for knowledge checks. null = no right answer (self-report). */
  correct: boolean | null;
  category: "product" | "process" | "integrity" | "vertical" | "multitask";
  /** Seconds before auto-timeout counts as skipped */
  timeoutSec?: number;
};

export type MultitaskAnswer = {
  questionId: string;
  answer: boolean | null; // null = skipped / timeout
  correct: boolean | null;
  responseMs: number;
  answeredAt: number;
  timedOut?: boolean;
};

export type MultitaskResult = {
  answers: MultitaskAnswer[];
  asked: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scoredCount: number; // questions with a correct answer
  accuracy: number; // 0-1 among scored
  avgResponseMs: number;
  multitaskScore: number; // 1-10
};

const GENERAL: MultitaskQuestion[] = [
  {
    id: "g1",
    prompt: "Our AI Receptionist starts at $299/month (plus setup). Is that true?",
    correct: true,
    category: "product",
  },
  {
    id: "g2",
    prompt: "Is it okay to invent a fake discount just to close a deal today?",
    correct: false,
    category: "integrity",
  },
  {
    id: "g3",
    prompt:
      "Should you still book a next step even if the owner only wants to “think about it”?",
    correct: true,
    category: "process",
  },
  {
    id: "g4",
    prompt: "Is AI Front Office our flagship package (phones + chat + follow-up + CRM)?",
    correct: true,
    category: "product",
  },
  {
    id: "g5",
    prompt: "Should you hang up immediately when a prospect sounds busy?",
    correct: false,
    category: "process",
  },
  {
    id: "g6",
    prompt:
      "Can you keep talking while tapping an answer? (Self-check — there is no wrong answer.)",
    correct: null,
    category: "multitask",
  },
  {
    id: "g7",
    prompt: "Is commission uncapped for closers who hit quota (as we position it)?",
    correct: true,
    category: "process",
  },
  {
    id: "g8",
    prompt: "Should you oversell features we don’t actually offer to win the deal?",
    correct: false,
    category: "integrity",
  },
];

const VERTICAL: Record<string, MultitaskQuestion[]> = {
  "hvac-closer": [
    {
      id: "v-hvac-1",
      prompt: "Do HVAC owners often miss emergency calls after hours?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-hvac-2",
      prompt: "Is seasonal demand (summer/winter) irrelevant to HVAC closing?",
      correct: false,
      category: "vertical",
    },
  ],
  "plumbing-closer": [
    {
      id: "v-plumb-1",
      prompt: "Do many plumbers still answer the phone while on a truck job?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-plumb-2",
      prompt: "Should you promise AI will fix a slab leak?",
      correct: false,
      category: "vertical",
    },
  ],
  "electrical-closer": [
    {
      id: "v-elec-1",
      prompt: "Can job qualification (EV charger vs outlet) matter for electricians?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-elec-2",
      prompt: "Is permit work always something AI should approve alone?",
      correct: false,
      category: "vertical",
    },
  ],
  "medspa-closer": [
    {
      id: "v-med-1",
      prompt: "Does tone/brand matter more at a med spa than a rough trade shop?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-med-2",
      prompt: "Should the AI give medical advice over the phone?",
      correct: false,
      category: "vertical",
    },
  ],
  "dental-closer": [
    {
      id: "v-den-1",
      prompt: "Do missed new-patient calls hurt dental practices?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-den-2",
      prompt: "Should AI diagnose a toothache on the call?",
      correct: false,
      category: "vertical",
    },
  ],
  "autobody-closer": [
    {
      id: "v-body-1",
      prompt: "Do storm spikes overload body shop front offices?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-body-2",
      prompt: "Is insurance / DRP awareness useless in collision sales?",
      correct: false,
      category: "vertical",
    },
  ],
  "auto-service-closer": [
    {
      id: "v-auto-1",
      prompt: "Do repair shops lose work when the phone rings and nobody answers?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-auto-2",
      prompt: "Should you skip follow-up on declined services?",
      correct: false,
      category: "vertical",
    },
  ],
  "law-firm-closer": [
    {
      id: "v-law-1",
      prompt: "Is after-hours intake valuable for PI firms?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-law-2",
      prompt: "Should AI give legal advice during intake?",
      correct: false,
      category: "vertical",
    },
  ],
  "home-services-closer": [
    {
      id: "v-home-1",
      prompt: "Is speed-to-lead critical after a storm for roofers?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-home-2",
      prompt: "Should you let hot estimate leads sit overnight?",
      correct: false,
      category: "vertical",
    },
  ],
  "multi-vertical-closer": [
    {
      id: "v-multi-1",
      prompt: "Should a multi-vertical closer change discovery by industry?",
      correct: true,
      category: "vertical",
    },
    {
      id: "v-multi-2",
      prompt: "Is one identical script perfect for every business type?",
      correct: false,
      category: "vertical",
    },
  ],
};

/** Build shuffled queue set for a role (~6–8 questions). */
export function buildQuizForRole(roleSlug: string): MultitaskQuestion[] {
  const vertical = VERTICAL[roleSlug] || VERTICAL["home-services-closer"];
  const pool = [...GENERAL, ...vertical];
  // Prefer scored questions first, keep 1 multitask self-check
  const scored = shuffle(pool.filter((q) => q.correct !== null));
  const self = pool.filter((q) => q.correct === null);
  const picked = [...scored.slice(0, 6), ...self.slice(0, 1)];
  return shuffle(picked).map((q) => ({
    ...q,
    timeoutSec: q.timeoutSec ?? 18,
  }));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function scoreMultitask(answers: MultitaskAnswer[]): MultitaskResult {
  const scored = answers.filter((a) => a.correct !== null);
  const correctCount = scored.filter((a) => a.correct === true).length;
  const incorrectCount = scored.filter((a) => a.correct === false).length;
  const skippedCount = answers.filter(
    (a) => a.answer === null || a.timedOut,
  ).length;
  const scoredCount = scored.length;
  const accuracy = scoredCount ? correctCount / scoredCount : 0;
  const timed = answers.filter((a) => a.answer !== null);
  const avgResponseMs = timed.length
    ? timed.reduce((s, a) => s + a.responseMs, 0) / timed.length
    : 0;

  // Score: accuracy 70% + speed bonus 20% + completion 10%
  const speedFactor =
    avgResponseMs <= 0
      ? 0.5
      : avgResponseMs < 4000
        ? 1
        : avgResponseMs < 8000
          ? 0.75
          : avgResponseMs < 14000
            ? 0.5
            : 0.3;
  const completion =
    answers.length === 0
      ? 0
      : (answers.length - skippedCount) / Math.max(answers.length, 1);
  const raw = accuracy * 0.7 + speedFactor * 0.2 + completion * 0.1;
  const multitaskScore = Math.max(
    1,
    Math.min(10, Math.round(raw * 10 * 10) / 10),
  );

  return {
    answers,
    asked: answers.length,
    correctCount,
    incorrectCount,
    skippedCount,
    scoredCount,
    accuracy,
    avgResponseMs: Math.round(avgResponseMs),
    multitaskScore,
  };
}

/** First popup delay & spacing during live interview (ms). */
export const QUIZ_FIRST_DELAY_MS = 45_000;
export const QUIZ_INTERVAL_MS = 75_000;
