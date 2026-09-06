import type { Recommendation } from "./company";
import type { MultitaskResult } from "./multitask-quiz";

export type InterviewKind =
  | "screening"
  | "hiring_manager"
  | "onboarding"
  | "practice_pitch";

export type InterviewStatus =
  | "applied"
  | "in_progress"
  | "completed"
  | "abandoned"
  | "error";

export type PipelineStatus =
  | "applied"
  | "screening_in_progress"
  | "waitlisted"
  | "rejected"
  | "hm_invited"
  | "hm_in_progress"
  | "hm_maybe"
  | "hm_rejected"
  | "offer_pending"
  | "offer_accepted"
  | "offer_declined"
  | "onboarding_invited"
  | "onboarding_in_progress"
  | "onboarding_incomplete"
  | "onboarding_complete"
  | "setup_in_progress"
  | "setup_complete"
  | "training_in_progress"
  | "training_complete"
  | "production_ready";

export type TranscriptLine = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  partial?: boolean;
  at: number;
};

export type Scorecard = {
  overallScore?: number;
  recommendation?: Recommendation | string;
  summary?: string;
  strengths?: string[];
  developmentAreas?: string[];
  scores?: Record<string, number>;
  rolePlayNotes?: string;
  nextStep?: string;
  raw?: string;
};

/** Admin-only hiring verdict (never shown to candidates). */
export type HireVerdict = {
  decision: Recommendation | string;
  label: string;
  color: "green" | "yellow" | "gray" | "red";
  headline: string;
  confidence: "high" | "medium" | "low";
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
    multitaskAccuracy?: number;
    transcriptAvailable: boolean;
  };
};

export type CandidateApplication = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  yearsInSales?: string;
  industryExperience?: "yes" | "some" | "no" | "";
  linkedin?: string;
  consent: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userAgent?: string;
};

export type NotificationLog = {
  slack?: { ok: boolean; error?: string; at: string };
  emailCandidate?: { ok: boolean; error?: string; at: string };
  emailInternal?: { ok: boolean; error?: string; at: string };
};

export type OfferRecord = {
  id: string;
  token: string;
  title: string;
  body: string;
  roleSlug: string;
  createdAt: string;
  expiresAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  status: "pending" | "accepted" | "declined" | "expired";
};

export type SetupTask = {
  id: string;
  title: string;
  description: string;
  href?: string;
  required: boolean;
  completedAt?: string;
};

export type TrainingState = {
  modulesRead: string[];
  quizScore?: number;
  quizPassed?: boolean;
  quizAttempts: number;
  practicePitchSessionId?: string;
  practicePitchScore?: number;
  practicePitchPassed?: boolean;
  roleplayAttempts?: number;
  roleplayPasses?: number;
  bestPitchScore?: number;
  completedAt?: string;
};

export type InterviewRecord = {
  id: string;
  rootId?: string;
  parentId?: string;
  kind: InterviewKind;
  department: "sales_closer";
  roleSlug: string;
  status: InterviewStatus;
  pipelineStatus: PipelineStatus;
  portalToken: string;
  candidate: CandidateApplication;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationSec?: number;
  transcript: TranscriptLine[];
  scorecard?: Scorecard;
  hireVerdict?: HireVerdict;
  multitaskQuiz?: MultitaskResult;
  /** Debug: last N realtime event types (admin only) */
  eventTypes?: string[];
  hmInterviewId?: string;
  onboardingInterviewId?: string;
  practicePitchSessionId?: string;
  offer?: OfferRecord;
  setupTasks?: SetupTask[];
  training?: TrainingState;
  notifications?: NotificationLog;
  errorMessage?: string;
};

export const INCOMPLETE_SEC = 180;
