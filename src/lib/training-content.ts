/** In-app training content for sales closers. */

export type TrainModule = {
  id: string;
  title: string;
  minutes: number;
  body: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export const CORE_MODULES: TrainModule[] = [
  {
    id: "product",
    title: "Product & pricing",
    minutes: 8,
    body: `## What we sell

**AI Receptionist** — Setup $499 · $299/mo  
24/7 voice agent, missed-call text-back, lead qualification, booking, summaries.  
Pitch: "Every call answered, every lead captured."

**AI Front Office** (flagship) — Setup $999 · $799/mo  
Receptionist + website chat + automated follow-up + CRM/pipeline + review engine + monthly optimization.  
Pitch: "Your whole front desk, automated."

**AI Growth Partner** — Setup $2,500 · $1,900/mo  
Front Office + outbound sales agent + ads + creative + strategist.

## Hard rules
- Never invent discounts or features.
- Always book a clear next step.
- Log every deal in CRM the same day.
`,
  },
  {
    id: "process",
    title: "Sales process",
    minutes: 10,
    body: `## Call flow
1. **Rapport** — who they are, business type  
2. **Discovery** — missed calls, after-hours, no-shows, tools today  
3. **Pain amplify** — cost of a missed job / empty chair  
4. **Fit** — which package matches  
5. **Close** — demo, pilot, or kickoff date  
6. **CRM** — next step + date or it's not real  

## Objections
- "I have a receptionist" → day coverage vs nights/overflow  
- "Too expensive" → cost of 2–3 missed jobs  
- "I'll think about it" → specific follow-up + calendar hold  
`,
  },
  {
    id: "tools",
    title: "Tools & daily rhythm",
    minutes: 6,
    body: `## Slack
#sales · #wins · #product-updates · #general

## Daily rhythm
- Morning: pipeline note in #sales  
- Every call: CRM update before EOD  
- No deal without a dated next step  
- Celebrate wins in #wins  

## First 48 hours
1. Finish setup checklist  
2. Complete training quiz + practice pitch  
3. Shadow one recorded demo  
4. Book first practice live with manager  
`,
  },
  {
    id: "vertical",
    title: "Your vertical",
    minutes: 8,
    body: `Open your role's ICP from the portal. Know:
- Who buys (owner vs office manager)
- Top 3 pains
- Top 3 objections
- What "booked next step" looks like (estimate, consult, demo)

Practice the role-play out loud once before your first live dial.
`,
  },
];

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What is the monthly price of AI Receptionist?",
    options: ["$199", "$299", "$799", "$1,900"],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "Which package is the flagship front desk system?",
    options: [
      "AI Receptionist",
      "AI Front Office",
      "AI Growth Partner",
      "Website only",
    ],
    correctIndex: 1,
  },
  {
    id: "q3",
    prompt: "Is inventing a one-time discount to close today allowed?",
    options: ["Yes, always", "Only Fridays", "No", "Only for Growth Partner"],
    correctIndex: 2,
  },
  {
    id: "q4",
    prompt: "A deal without a dated next step in CRM is…",
    options: [
      "Fine if you remember",
      "Not a real deal",
      "Only for warm leads",
      "Manager's problem",
    ],
    correctIndex: 1,
  },
  {
    id: "q5",
    prompt: "Best response when owner says “I'll think about it”?",
    options: [
      "Hang up politely",
      "Offer 50% off",
      "Book a specific follow-up and calendar hold",
      "Argue until they agree",
    ],
    correctIndex: 2,
  },
  {
    id: "q6",
    prompt: "AI Front Office monthly price is…",
    options: ["$299", "$499", "$799", "$1,900"],
    correctIndex: 2,
  },
  {
    id: "q7",
    prompt: "Where do you post wins?",
    options: ["#general only", "#wins", "Email only", "Nowhere"],
    correctIndex: 1,
  },
  {
    id: "q8",
    prompt: "Should AI give medical or legal advice on calls?",
    options: ["Yes if asked", "No", "Only after hours", "Only for VIPs"],
    correctIndex: 1,
  },
];

export const QUIZ_PASS = 0.8;
export const PITCH_PASS = 7;
