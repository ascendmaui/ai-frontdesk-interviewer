import type { InterviewKind } from "./types";

/**
 * Distinct Grok voices per agent role.
 * Built-in IDs: eve, ara, leo, rex, sal
 */
export type AgentVoiceProfile = {
  agentName: string;
  voice: string;
  /** Short tone note for UI */
  tone: string;
  title: string;
};

export const AGENT_VOICES: Record<
  InterviewKind | "screening",
  AgentVoiceProfile
> = {
  screening: {
    agentName: "Jordan",
    voice: "eve",
    tone: "Warm, professional screener",
    title: "Screening interviewer",
  },
  hiring_manager: {
    agentName: "Morgan",
    voice: "sal",
    tone: "Decisive, senior hiring manager",
    title: "Hiring manager",
  },
  onboarding: {
    agentName: "Riley",
    voice: "ara",
    tone: "Friendly, patient onboarding guide",
    title: "Onboarding specialist",
  },
  practice_pitch: {
    agentName: "Coach",
    voice: "rex",
    tone: "Energetic sales coach / role-play partner",
    title: "Sales coach",
  },
};

export function voiceForKind(kind: InterviewKind | string): AgentVoiceProfile {
  const k = (kind || "screening") as InterviewKind;
  return AGENT_VOICES[k] || AGENT_VOICES.screening;
}
