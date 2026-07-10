/** Shared company + product knowledge for all vertical closers. */

export const COMPANY = {
  brand: "Hearthline",
  product: "AI Front Desk",
  tagline: "AI employees for local businesses",
  supportEmail: process.env.HIRING_FROM_EMAIL || "hiring@hearthline.ai",
  calendarUrl: process.env.FINAL_INTERVIEW_CALENDAR_URL || "",
};

export const PRODUCT_KNOWLEDGE = `
## Products (know these numbers and pitches)

### Bundles
1. **AI Receptionist** — Setup $499 · $299/mo
   - 24/7 AI voice agent, missed-call text-back, lead qualification, appointment booking, call summaries
   - Pitch: "Every call answered, every lead captured."

2. **AI Front Office** (flagship) — Setup $999 · $799/mo
   - Everything in Receptionist + website chat agent, automated follow-up (text + email), CRM & pipeline, review engine, monthly optimization
   - Pitch: "Your whole front desk, automated — phones, chat, follow-up, and reviews as one system."

3. **AI Growth Partner** — Setup $2,500 · $1,900/mo
   - Everything in Front Office + AI outbound sales agent, AI search/ChatGPT ads, Meta ads, landing pages & creative, dedicated strategist
   - Pitch: "The full growth machine — front office plus outbound, ads, and content, managed for you."

### Common standalone services
- AI Voice Receptionist, AI Sales Agent, Support Assistant, Website Chat Agent
- Websites & landing pages, follow-up workflows, CRM setup, review engine, Meta ads, agent installs
`.trim();

export type Recommendation = "strong_yes" | "yes" | "maybe" | "no";

export const REC_LABEL: Record<Recommendation, string> = {
  strong_yes: "Strong yes",
  yes: "Yes — advance",
  maybe: "Maybe",
  no: "Pass",
};

export const REC_EMOJI: Record<Recommendation, string> = {
  strong_yes: "🟢",
  yes: "🟡",
  maybe: "⚪",
  no: "🔴",
};

/** Pass bar for candidate-facing "qualified for next step" messaging. */
export function isQualified(rec: Recommendation | string | undefined): boolean {
  return rec === "strong_yes" || rec === "yes";
}
