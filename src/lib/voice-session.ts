import {
  SAMPLE_RATE,
  base64Pcm16ToFloat32,
  float32ToBase64Pcm16,
  resampleLinear,
  rmsLevel,
} from "./audio";
import type { TranscriptLine } from "./types";

export type { TranscriptLine };

export type SessionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "ending"
  | "ended"
  | "error";

export type VoiceSessionHandlers = {
  onStatus?: (status: SessionStatus, detail?: string) => void;
  onTranscript?: (lines: TranscriptLine[]) => void;
  onLevel?: (level: number) => void;
  onSpeaking?: (who: "user" | "assistant" | null) => void;
  onError?: (message: string) => void;
  onEventType?: (type: string) => void;
  /** Fired when the agent signals the session is complete (auto-end). */
  onAgentSessionComplete?: () => void;
};

/** Phrases that mean the agent finished and we should auto-end. */
export function looksLikeSessionEnd(text: string): boolean {
  const t = text.toLowerCase();
  const patterns = [
    "interview is complete",
    "interview complete",
    "session is complete",
    "session complete",
    "onboarding guidance is complete",
    "onboarding is complete",
    "onboarding complete",
    "practice pitch complete",
    "practice pitch is complete",
    "hiring manager interview is complete",
    "this concludes our",
    "that concludes our",
    "we've completed",
    "we have completed",
    "thank you for your time today",
    "thanks for your time today",
    "nothing else from my side",
    "i'll let you go",
    "you're all set for now",
    "that wraps up",
    "this wraps up",
  ];
  return patterns.some((p) => t.includes(p));
}

type SessionTokenResponse = {
  value?: string;
  client_secret?: string | { value?: string };
  error?: string;
  voice?: string;
  model?: string;
  instructions?: string;
  greeting?: string;
  keyterms?: string[];
  agentName?: string;
  kind?: string;
};

function extractToken(data: SessionTokenResponse): string | null {
  if (typeof data.value === "string" && data.value) return data.value;
  if (typeof data.client_secret === "string" && data.client_secret)
    return data.client_secret;
  if (
    data.client_secret &&
    typeof data.client_secret === "object" &&
    typeof data.client_secret.value === "string"
  ) {
    return data.client_secret.value;
  }
  return null;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Browser client for xAI Grok Voice Agent.
 * Mobile-safe: unlock AudioContext on user gesture before start().
 */
export class VoiceSession {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private silentGain: GainNode | null = null;
  private playbackTime = 0;
  private transcript: TranscriptLine[] = [];
  private assistantPartialId: string | null = null;
  private userPartialId: string | null = null;
  private closed = false;
  private micMuted = false;
  private activeSources: AudioBufferSourceNode[] = [];
  private eventTypes: string[] = [];
  private seenItemIds = new Set<string>();
  private lastAssistantFinal = "";
  private sessionEndFired = false;
  private sessionEndTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private handlers: VoiceSessionHandlers = {}) {}

  private maybeScheduleAutoEnd(assistantText: string) {
    if (this.sessionEndFired || !looksLikeSessionEnd(assistantText)) return;
    this.lastAssistantFinal = assistantText;
    if (this.sessionEndTimer) clearTimeout(this.sessionEndTimer);
    // Wait for TTS to finish playing roughly, then end
    this.sessionEndTimer = setTimeout(() => {
      if (this.sessionEndFired || this.closed) return;
      this.sessionEndFired = true;
      this.handlers.onAgentSessionComplete?.();
    }, 4500);
  }

  getTranscript() {
    return [...this.transcript];
  }

  getEventTypes() {
    return [...this.eventTypes];
  }

  setMuted(muted: boolean) {
    this.micMuted = muted;
    this.mediaStream?.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }

  /** Call from a click/tap handler before start() for iOS / FB browser. */
  async unlockAudio(): Promise<void> {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new Ctx();
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
    // Play tiny silent buffer to unlock
    try {
      const buf = this.audioContext.createBuffer(1, 1, 22050);
      const src = this.audioContext.createBufferSource();
      src.buffer = buf;
      src.connect(this.audioContext.destination);
      src.start(0);
    } catch {
      /* ignore */
    }
  }

  async start(interviewId: string, candidateToken: string) {
    if (this.ws) return;
    this.closed = false;
    this.handlers.onStatus?.("connecting");

    try {
      await this.unlockAudio();

      const [stream, tokenRes] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        }),
        fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, token: candidateToken }),
        }),
      ]);

      this.mediaStream = stream;

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(
          err.error || `Failed to create session (${tokenRes.status})`,
        );
      }

      const tokenJson = (await tokenRes.json()) as SessionTokenResponse;
      const token = extractToken(tokenJson);
      if (!token) throw new Error("No ephemeral token returned from server");

      const model = tokenJson.model || "grok-voice-latest";
      const url = `wss://api.x.ai/v1/realtime?model=${encodeURIComponent(model)}`;

      const ws = new WebSocket(url, [`xai-client-secret.${token}`]);
      this.ws = ws;

      ws.onopen = async () => {
        const instructions =
          tokenJson.instructions || "You are a helpful interview assistant.";
        const voice = tokenJson.voice || "eve";
        const keyterms = tokenJson.keyterms || [
          "Hearthline",
          "AI Front Desk",
        ];

        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              voice,
              instructions,
              turn_detection: {
                type: "server_vad",
                threshold: 0.85,
                silence_duration_ms: 800,
                prefix_padding_ms: 300,
              },
              audio: {
                input: {
                  format: { type: "audio/pcm", rate: SAMPLE_RATE },
                  transcription: {
                    model: "grok-transcribe",
                    language_hint: "en",
                    keyterms,
                  },
                },
                output: { format: { type: "audio/pcm", rate: SAMPLE_RATE } },
              },
            },
          }),
        );

        const agentLabel = tokenJson.agentName || "the agent";
        const greet =
          tokenJson.greeting ||
          `Welcome. I'm ${agentLabel}.`;

        ws.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "force_message",
              role: "assistant",
              interruptible: true,
              content: [{ type: "output_text", text: greet }],
            },
          }),
        );

        setTimeout(() => {
          if (this.closed || ws.readyState !== WebSocket.OPEN) return;
          const continueHint =
            tokenJson.kind === "hiring_manager"
              ? "Continue the hiring manager interview after the greeting. Do not re-ask for name, email, or phone."
              : tokenJson.kind === "onboarding"
                ? "Continue onboarding after the greeting. Walk through Slack, tools, and first 48 hours."
                : tokenJson.kind === "practice_pitch"
                  ? "Continue the practice pitch after the greeting. Brief them, then role-play as the owner."
                  : "Continue the interview naturally after the greeting. Set expectations for a ~12–15 minute interview with a role-play, then ask for a 45-second intro. Do not re-ask for name, email, or phone.";
          ws.send(
            JSON.stringify({
              type: "response.create",
              response: {
                instructions: continueHint,
              },
            }),
          );
        }, 500);

        await this.startMicCapture();
        this.handlers.onStatus?.("live");
        this.pushSystem(
          `Connected — speak naturally when ${agentLabel} finishes.`,
        );
      };

      ws.onmessage = (ev) => this.handleServerEvent(ev.data);
      ws.onerror = () => {
        this.handlers.onError?.(
          "Connection error. Try again on Wi‑Fi, or open in Chrome/Safari.",
        );
        this.handlers.onStatus?.("error", "WebSocket error");
      };
      ws.onclose = () => {
        if (!this.closed) this.handlers.onStatus?.("ended");
        this.cleanupMedia(false);
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start session";
      const friendly =
        /Permission|NotAllowed|getUserMedia/i.test(msg)
          ? "Microphone permission blocked. Allow mic access and try again."
          : msg;
      this.handlers.onError?.(friendly);
      this.handlers.onStatus?.("error", friendly);
      this.cleanupMedia(true);
      throw e;
    }
  }

  async stop() {
    this.closed = true;
    this.handlers.onStatus?.("ending");
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
    this.stopPlayback();
    this.cleanupMedia(true);
    this.handlers.onStatus?.("ended");
    this.handlers.onSpeaking?.(null);
  }

  private cleanupMedia(stopTracks: boolean) {
    try {
      this.workletNode?.disconnect();
      this.sourceNode?.disconnect();
      this.silentGain?.disconnect();
    } catch {
      /* ignore */
    }
    this.workletNode = null;
    this.sourceNode = null;
    this.silentGain = null;
    if (stopTracks) {
      this.mediaStream?.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
      if (this.audioContext && this.audioContext.state !== "closed") {
        void this.audioContext.close();
      }
      this.audioContext = null;
    }
  }

  private stopPlayback() {
    for (const s of this.activeSources) {
      try {
        s.stop();
      } catch {
        /* ignore */
      }
    }
    this.activeSources = [];
    this.playbackTime = 0;
  }

  private async startMicCapture() {
    if (!this.mediaStream) return;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new Ctx();
    }
    const ctx = this.audioContext;
    if (ctx.state === "suspended") await ctx.resume();

    const source = ctx.createMediaStreamSource(this.mediaStream);
    this.sourceNode = source;

    const bufferSize = 4096;
    const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
    this.workletNode = processor;

    processor.onaudioprocess = (e) => {
      if (this.closed || this.micMuted || !this.ws || this.ws.readyState !== 1)
        return;
      const input = e.inputBuffer.getChannelData(0);
      this.handlers.onLevel?.(rmsLevel(input));
      const resampled = resampleLinear(input, ctx.sampleRate, SAMPLE_RATE);
      const b64 = float32ToBase64Pcm16(resampled);
      this.ws.send(
        JSON.stringify({ type: "input_audio_buffer.append", audio: b64 }),
      );
    };

    source.connect(processor);
    const silent = ctx.createGain();
    silent.gain.value = 0;
    this.silentGain = silent;
    processor.connect(silent);
    silent.connect(ctx.destination);
  }

  private playPcmBase64(b64: string) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new Ctx({ sampleRate: SAMPLE_RATE });
    }
    const ctx = this.audioContext;
    if (ctx.state === "suspended") void ctx.resume();

    const samples = base64Pcm16ToFloat32(b64);
    if (samples.length === 0) return;

    const forCtx =
      ctx.sampleRate === SAMPLE_RATE
        ? samples
        : resampleLinear(samples, SAMPLE_RATE, ctx.sampleRate);

    const buffer = ctx.createBuffer(1, forCtx.length, ctx.sampleRate);
    const channel = new Float32Array(forCtx.length);
    channel.set(forCtx);
    buffer.copyToChannel(channel, 0);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    if (this.playbackTime < now) this.playbackTime = now + 0.02;
    src.start(this.playbackTime);
    this.playbackTime += buffer.duration;
    this.activeSources.push(src);
    src.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== src);
    };
    this.handlers.onSpeaking?.("assistant");
  }

  private pushLine(line: TranscriptLine) {
    this.transcript = [...this.transcript, line];
    this.handlers.onTranscript?.(this.getTranscript());
  }

  private updateLine(id: string, text: string, partial?: boolean) {
    this.transcript = this.transcript.map((l) =>
      l.id === id ? { ...l, text, partial } : l,
    );
    this.handlers.onTranscript?.(this.getTranscript());
  }

  private pushSystem(text: string) {
    this.pushLine({
      id: uid("sys"),
      role: "system",
      text,
      at: Date.now(),
    });
  }

  private extractItemText(item: Record<string, unknown> | undefined): {
    role: "user" | "assistant" | null;
    text: string;
    id?: string;
  } {
    if (!item || typeof item !== "object") return { role: null, text: "" };
    const roleRaw = String(item.role || "");
    const role =
      roleRaw === "user" || roleRaw === "assistant"
        ? (roleRaw as "user" | "assistant")
        : null;
    const content = item.content;
    let text = "";
    if (typeof item.transcript === "string") text = item.transcript;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const p = part as Record<string, unknown>;
        const t =
          (typeof p.transcript === "string" && p.transcript) ||
          (typeof p.text === "string" && p.text) ||
          (typeof p.output_text === "string" && p.output_text) ||
          "";
        if (t) text = text ? `${text} ${t}` : t;
      }
    }
    return {
      role,
      text: text.trim(),
      id: typeof item.id === "string" ? item.id : undefined,
    };
  }

  private handleServerEvent(raw: string | Blob) {
    if (typeof raw !== "string") return;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }

    const type = String(event.type || "");
    if (type) {
      this.eventTypes.push(type);
      if (this.eventTypes.length > 80) this.eventTypes.shift();
      this.handlers.onEventType?.(type);
    }

    switch (type) {
      case "input_audio_buffer.speech_started":
        this.handlers.onSpeaking?.("user");
        this.stopPlayback();
        break;

      case "input_audio_buffer.speech_stopped":
        this.handlers.onSpeaking?.(null);
        break;

      case "response.output_audio.delta":
      case "response.audio.delta": {
        const delta = (event.delta as string) || (event.audio as string);
        if (delta) this.playPcmBase64(delta);
        break;
      }

      case "response.output_audio_transcript.delta":
      case "response.audio_transcript.delta": {
        const delta = String(event.delta || "");
        if (!delta) break;
        if (!this.assistantPartialId) {
          this.assistantPartialId = uid("a");
          this.pushLine({
            id: this.assistantPartialId,
            role: "assistant",
            text: delta,
            partial: true,
            at: Date.now(),
          });
        } else {
          const existing = this.transcript.find(
            (l) => l.id === this.assistantPartialId,
          );
          this.updateLine(
            this.assistantPartialId,
            (existing?.text || "") + delta,
            true,
          );
        }
        break;
      }

      case "response.output_audio_transcript.done":
      case "response.audio_transcript.done": {
        const text = String(event.transcript || "");
        const finalText =
          text ||
          this.transcript.find((l) => l.id === this.assistantPartialId)?.text ||
          "";
        if (this.assistantPartialId) {
          this.updateLine(this.assistantPartialId, finalText, false);
        } else if (finalText) {
          this.pushLine({
            id: uid("a"),
            role: "assistant",
            text: finalText,
            at: Date.now(),
          });
        }
        this.assistantPartialId = null;
        if (finalText) this.maybeScheduleAutoEnd(finalText);
        break;
      }

      case "conversation.item.input_audio_transcription.completed":
      case "conversation.item.input_audio_transcription.done": {
        const text = String(event.transcript || "");
        if (text) {
          if (this.userPartialId) {
            this.updateLine(this.userPartialId, text, false);
          } else {
            this.pushLine({
              id: uid("u"),
              role: "user",
              text,
              at: Date.now(),
            });
          }
        }
        this.userPartialId = null;
        break;
      }

      case "conversation.item.input_audio_transcription.updated":
      case "conversation.item.input_audio_transcription.delta": {
        const text = String(
          (event.transcript as string) || (event.delta as string) || "",
        );
        if (!text) break;
        if (!this.userPartialId) {
          this.userPartialId = uid("u");
          this.pushLine({
            id: this.userPartialId,
            role: "user",
            text,
            partial: true,
            at: Date.now(),
          });
        } else if (type.endsWith("updated")) {
          this.updateLine(this.userPartialId, text, true);
        } else {
          const existing = this.transcript.find(
            (l) => l.id === this.userPartialId,
          );
          this.updateLine(
            this.userPartialId,
            (existing?.text || "") + text,
            true,
          );
        }
        break;
      }

      // History items (including force_message / seeded turns)
      case "conversation.item.added":
      case "conversation.item.created": {
        const item = (event.item || event) as Record<string, unknown>;
        const extracted = this.extractItemText(item);
        if (!extracted.role || !extracted.text) break;
        const key = extracted.id || `${extracted.role}:${extracted.text.slice(0, 40)}`;
        if (this.seenItemIds.has(key)) break;
        this.seenItemIds.add(key);
        // Avoid duplicating live partials already tracked
        const last = this.transcript[this.transcript.length - 1];
        if (
          last &&
          last.role === extracted.role &&
          (last.text === extracted.text ||
            extracted.text.startsWith(last.text) ||
            last.text.startsWith(extracted.text))
        ) {
          this.updateLine(last.id, extracted.text, false);
          break;
        }
        this.pushLine({
          id: extracted.id || uid(extracted.role === "user" ? "u" : "a"),
          role: extracted.role,
          text: extracted.text,
          at: Date.now(),
        });
        break;
      }

      case "response.output_item.done": {
        const item = event.item as Record<string, unknown> | undefined;
        const extracted = this.extractItemText(item);
        if (extracted.role === "assistant" && extracted.text) {
          if (this.assistantPartialId) {
            this.updateLine(this.assistantPartialId, extracted.text, false);
            this.assistantPartialId = null;
          } else {
            const key = extracted.id || `a:${extracted.text.slice(0, 40)}`;
            if (!this.seenItemIds.has(key)) {
              this.seenItemIds.add(key);
              this.pushLine({
                id: extracted.id || uid("a"),
                role: "assistant",
                text: extracted.text,
                at: Date.now(),
              });
            }
          }
        }
        break;
      }

      case "response.done": {
        this.handlers.onSpeaking?.(null);
        // Fallback: scan last assistant line if done event had no transcript.done
        const lastA = [...this.transcript]
          .reverse()
          .find((l) => l.role === "assistant" && l.text && !l.partial);
        if (lastA?.text) this.maybeScheduleAutoEnd(lastA.text);
        break;
      }

      case "error": {
        const err = event.error as { message?: string } | undefined;
        const message =
          err?.message || (event.message as string) || "Voice API error";
        this.handlers.onError?.(message);
        break;
      }

      default:
        break;
    }
  }
}
