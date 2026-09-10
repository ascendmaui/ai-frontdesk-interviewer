import type { QuizQuestion, TrainModule } from "./training-content";

export const SALES_CORE_MODULES: TrainModule[] = [
  {
    id: "core-offer-icp",
    title: "1 · Offer, ICP & positioning",
    minutes: 12,
    body: `## Sell the outcome, not the acronym

Your job is to diagnose a revenue or operations problem that AI Front Desk can actually solve. Do not lead with model names, automations, or technical jargon.

### Core offers
- **AI Receptionist** — Setup $499 · $299/mo. 24/7 voice coverage, missed-call text-back, qualification, booking, summaries.
- **AI Front Office** — Setup $999 · $799/mo. Receptionist + web chat + automated follow-up + CRM/pipeline + review engine.
- **AI Growth Partner** — Setup $2,500 · $1,900/mo. Front Office + outbound sales agent + ads + creative + strategist.

### Ideal customer
Look for local businesses where one missed or slowly handled lead can be worth materially more than the monthly fee: home services, auto, dental, med spa, law, and similar appointment- or estimate-driven businesses.

### Positioning rule
Start with the business problem: missed calls, slow response, weak follow-up, booking friction, or front-desk overload. Only recommend a package after you understand the problem.

Never invent features, customer results, integrations, discounts, or urgency.`,
  },
  {
    id: "core-discovery",
    title: "2 · Discovery: diagnose before you prescribe",
    minutes: 14,
    body: `## The closer is a diagnostician

A good discovery call should uncover the current process, the leak, the economic impact, and the decision path.

### Core questions
1. How do new leads reach you today?
2. Who answers calls or messages when the team is busy or closed?
3. How quickly are web leads and missed calls followed up?
4. Where do leads most often fall through?
5. What is a typical new customer/job worth?
6. Roughly how many opportunities hit this process each week?
7. If this were fixed, what would improve first?
8. Who besides you needs to be comfortable with a change?

### Conversation discipline
Ask one question at a time. Listen to the full answer. Use the prospect's numbers and language. Do not manufacture ROI if they cannot provide enough data.

A useful summary sounds like: “So the issue isn't lead volume — it's that calls arriving while your team is on jobs are reaching voicemail and follow-up is inconsistent. Did I get that right?”`,
  },
  {
    id: "core-demo-value",
    title: "3 · Demo, value & honest ROI",
    minutes: 12,
    body: `## Demo the problem they described

Do not give a generic feature tour. Recreate the prospect's actual use case: after-hours call, missed-call recovery, qualification, booking, web chat, or follow-up.

### Demo structure
1. Restate their problem in one sentence.
2. Show the shortest workflow that fixes it.
3. Explain what the human team still owns.
4. Confirm whether the workflow fits their operation.
5. Quantify value only with numbers the prospect supplied or clearly labeled assumptions.

### ROI example
If a prospect says an average booked job is $800 and they believe they miss 5 qualified calls a month, you may illustrate the potential value of recovering some of those calls. Do not promise a particular conversion rate or revenue result.

The strongest value statement is specific and truthful, not dramatic.`,
  },
  {
    id: "core-pricing",
    title: "4 · Pricing, packaging & scope control",
    minutes: 10,
    body: `## Present the package that matches the diagnosis

- Receptionist: phone coverage / qualification / booking problem.
- Front Office: phone + chat + follow-up + pipeline problem.
- Growth Partner: broader acquisition plus front-office automation need.

State setup fee and recurring price clearly. Explain what is included and what requires confirmation. Never hide recurring charges or make up a discount.

If the prospect needs something outside the standard offer, say: “I can document that requirement and have the build team confirm scope before we promise it.”

Do not use fake scarcity, false deadlines, or unsupported competitor claims.`,
  },
  {
    id: "core-objections",
    title: "5 · Objection handling without pressure",
    minutes: 14,
    body: `## Treat objections as missing information

Use this sequence: acknowledge → clarify → answer → confirm.

**“We already have a receptionist.”** Clarify whether nights, weekends, overflow, missed calls, and follow-up are fully covered. The AI can complement staff rather than replace them.

**“Customers want humans.”** Agree that some conversations should stay human. Explain where AI can handle immediate intake, booking, routing, and overflow with a human handoff.

**“AI makes mistakes.”** Do not deny the risk. Explain guardrails, scoped workflows, escalation, testing, and human ownership of high-stakes decisions.

**“Too expensive.”** Ask what they are comparing it to and return to the quantified problem. Do not discount reflexively.

**“Send me information.”** Ask what they need to evaluate and agree on a specific next step instead of dumping a brochure into an inbox.`,
  },
  {
    id: "core-close-payment",
    title: "6 · Close, payment & next-step discipline",
    minutes: 10,
    body: `## A close is a clear decision and next step

When there is fit, summarize the agreed problem, recommended package, price, and implementation next step. Ask directly whether they want to move forward.

If they are ready, use only the approved company checkout/payment workflow. Never collect card numbers in notes, chat, email, or CRM free-text fields. Never ask a prospect to send payment credentials to you directly.

If they are not ready, identify the real remaining decision and schedule a concrete follow-up date. Every active deal must have an owner and a next step.`,
  },
  {
    id: "core-crm-followup",
    title: "7 · CRM, follow-up & pipeline hygiene",
    minutes: 10,
    body: `## If it is not in CRM, it did not happen

Same day, record the decision-maker, need, package discussed, price discussed, objections, promised actions, and next step. Use accurate won/lost reasons.

Follow-up should add value or move a decision forward. Do not spam. Respect opt-outs immediately and do not continue contacting someone who has clearly asked to stop.

Never falsify activity, backdate notes, or mark a deal won before collected payment is confirmed.`,
  },
  {
    id: "core-handoff",
    title: "8 · Customer handoff, expectations & retention",
    minutes: 9,
    body: `## A good sale survives implementation

Before handoff, confirm what was sold, scope, billing cadence, key workflows, stakeholders, launch expectations, and any promises that the delivery team must know.

Do not promise launch dates, integrations, custom features, or performance guarantees unless the approved offer explicitly supports them.

Clean handoffs reduce refunds, disputes, and churn. If a customer is unhappy, document facts and escalate rather than hiding the issue to protect commission.`,
  },
  {
    id: "core-compliance",
    title: "9 · Sales conduct, privacy & compliance",
    minutes: 12,
    body: `## Non-negotiable standards

- Be truthful about the company, product, pricing, capabilities, and your role.
- Honor opt-outs and channel-specific communication rules.
- Never provide medical, legal, financial, or other regulated professional advice on behalf of a client.
- Do not upload or paste unnecessary sensitive customer data into AI tools.
- Never store passwords, API keys, card numbers, Social Security numbers, tax IDs, or similar secrets in CRM notes or this recruiting app.
- Use approved secure systems for payment, tax, and identity information.
- Escalate uncertainty instead of improvising a promise.

A closed deal obtained through deception is a failed sale.`,
  },
  {
    id: "core-commission",
    title: "10 · Commission, collected revenue & reversals",
    minutes: 8,
    body: `## Know when commission is actually earned

This is a commission-only sales closer program unless a signed agreement says otherwise. Commission terms are governed by the signed compensation agreement and applicable law.

Operational rule: do not treat a signature, verbal yes, unpaid invoice, failed payment, or pending checkout as collected revenue. Commission is calculated and paid only according to the written agreement after qualifying customer funds are collected and cleared.

Refunds, cancellations, chargebacks, fraud, or payment reversals can affect unpaid or unvested commission as defined by the agreement. Never manipulate payment timing, CRM status, or customer expectations to accelerate a commission event.

If the written agreement and a dashboard number ever conflict, escalate it to operations rather than guessing.`,
  },
  {
    id: "core-certification",
    title: "11 · Certification & live-lead readiness",
    minutes: 7,
    body: `## Live leads are earned, not automatic

Before live leads unlock you must:
- complete every required setup/acknowledgement task;
- read every required academy module;
- score at least 85% on the knowledge assessment;
- pass at least two voice roleplays at 8/10 or better;
- remain in good standing with the offer and compliance requirements.

The roleplays test discovery, truthful positioning, objection handling, pricing accuracy, a clear next step, and CRM/handoff judgment. If you miss the bar, the coach tells you exactly what to improve and you can practice again.

After certification, the Sales Coach remains available for pre-call planning and post-call debriefs.`,
  },
];

export const SALES_CORE_QUIZ: QuizQuestion[] = [
  {
    id: "coreq1",
    prompt: "What should a closer lead with?",
    options: ["Model names", "A diagnosed business problem", "A discount", "A long feature list"],
    correctIndex: 1,
  },
  {
    id: "coreq2",
    prompt: "When may you claim a specific ROI result?",
    options: ["Whenever it sounds reasonable", "Only when supported by verified inputs/evidence and framed accurately", "Whenever a competitor does", "After the prospect objects"],
    correctIndex: 1,
  },
  {
    id: "coreq3",
    prompt: "What is the right response to a feature request outside standard scope?",
    options: ["Promise it", "Say the build team will confirm scope before a promise", "Ignore it", "Offer a secret discount"],
    correctIndex: 1,
  },
  {
    id: "coreq4",
    prompt: "Where should card numbers or tax IDs be stored?",
    options: ["CRM notes", "Email", "Approved secure payment/tax systems only", "Sales chat"],
    correctIndex: 2,
  },
  {
    id: "coreq5",
    prompt: "A prospect asks to stop receiving outreach. What do you do?",
    options: ["Try one more angle", "Honor the opt-out immediately", "Wait a week", "Switch channels"],
    correctIndex: 1,
  },
  {
    id: "coreq6",
    prompt: "When should a deal be treated as collected revenue for commission purposes?",
    options: ["At verbal yes", "At contract signature", "Only under the written agreement after qualifying funds are collected/cleared", "When the rep marks won"],
    correctIndex: 2,
  },
  {
    id: "coreq7",
    prompt: "What makes a good follow-up?",
    options: ["More messages", "A truthful value-add or concrete decision next step", "Changing the price each time", "Pretending there is a deadline"],
    correctIndex: 1,
  },
  {
    id: "coreq8",
    prompt: "What is required before live leads unlock?",
    options: ["Reading three modules", "One decent call", "All required setup + all modules + 85% quiz + required roleplay passes", "Manager friendship"],
    correctIndex: 2,
  },
  {
    id: "coreq9",
    prompt: "If AI may be wrong in a high-stakes workflow, the closer should:",
    options: ["Deny the risk", "Explain guardrails and human escalation", "Guarantee perfection", "Avoid mentioning it"],
    correctIndex: 1,
  },
  {
    id: "coreq10",
    prompt: "What protects retention after the sale?",
    options: ["A vague handoff", "Accurate scope, expectations, stakeholders, and documented promises", "Hiding objections", "Marking won early"],
    correctIndex: 1,
  },
];
