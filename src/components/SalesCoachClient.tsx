"use client";

import { useMemo, useState } from "react";

type Mode = "coach" | "call_prep" | "debrief";
type Msg = { role: "user" | "assistant"; text: string };

export function SalesCoachClient({ id, token }: { id: string; token: string }) {
  const [mode, setMode] = useState<Mode>("coach");
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  const placeholder = useMemo(() => {
    if (mode === "call_prep") return "What do you know about the prospect and what are you trying to accomplish?";
    if (mode === "debrief") return "What happened on the call? What decision or objection did you get?";
    return "Ask Coach anything, practice an objection, or tell me what you want to improve…";
  }, [mode]);

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    const recent = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", text: message }]);
    setText("");
    try {
      const res = await fetch(`/api/coach/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message, mode, context, recent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coach request failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", text: String(data.reply || "") },
      ]);
      setProvider(data.provider || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Coach request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="hl-card space-y-4 p-5">
      <div>
        <p className="hl-eyebrow">AI Sales Coach</p>
        <h2 className="hl-serif mt-1 text-2xl text-[var(--ink)]">Coach stays with you</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--ink-muted)]">
          Train before certification, prep before a live call, or debrief afterward. Coach is direct, practical, and grounded in the approved offer and your vertical.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["coach", "Coach me"],
            ["call_prep", "Pre-call prep"],
            ["debrief", "Call debrief"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              mode === key
                ? "border-[var(--accent-border)] bg-[var(--accent-wash)] text-[var(--accent)]"
                : "border-[var(--line)] bg-white/50 text-[var(--ink-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(mode === "call_prep" || mode === "debrief") && (
        <label className="block">
          <span className="hl-label">
            {mode === "debrief" ? "Optional call notes / transcript" : "Optional prospect context"}
          </span>
          <textarea
            className="hl-input min-h-[7rem]"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={
              mode === "debrief"
                ? "Paste non-sensitive call notes or transcript here. Do not include payment credentials, passwords, tax IDs, or other secrets."
                : "Business type, known pain, source, prior conversation. Leave unknowns unknown."
            }
          />
        </label>
      )}

      {!!messages.length && (
        <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-2xl border border-[var(--line)] bg-white/40 p-3">
          {messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "assistant"
                  ? "mr-6 bg-[var(--bg-deep)] text-[var(--ink-soft)]"
                  : "ml-6 bg-[var(--accent-wash)] text-[var(--ink)]"
              }`}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                {m.role === "assistant" ? "Coach" : "You"}
              </p>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
        </div>
      )}

      <label className="block">
        <span className="hl-label">Message Coach</span>
        <textarea
          className="hl-input min-h-[6rem]"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void send();
            }
          }}
        />
      </label>
      <button
        type="button"
        disabled={busy || !text.trim()}
        onClick={() => void send()}
        className="hl-btn-primary w-full disabled:opacity-50"
      >
        {busy ? "Coach is thinking…" : "Ask Coach"}
      </button>
      <p className="text-[11px] text-[var(--ink-faint)]">
        Ctrl/⌘ + Enter sends. Never paste passwords, payment credentials, SSNs, tax IDs, or API keys.
        {provider ? ` · Provider: ${provider}` : ""}
      </p>
      {error && (
        <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </section>
  );
}
