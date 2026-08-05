/**
 * Industry-specific training academy content for each sales closer seat.
 */

import { getRole, ROLES } from "./roles";

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

export type RoleAcademy = {
  roleSlug: string;
  title: string;
  industry: string;
  tagline: string;
  modules: TrainModule[];
  quiz: QuizQuestion[];
  processSteps: { title: string; detail: string }[];
  talkTracks: string[];
  objections: { objection: string; reframe: string }[];
};

const PRODUCT_CORE = `## What we sell (all seats)

**AI Receptionist** — Setup $499 · $299/mo  
24/7 voice agent, missed-call text-back, lead qualification, booking, summaries.  
Pitch: "Every call answered, every lead captured."

**AI Front Office** (flagship) — Setup $999 · $799/mo  
Receptionist + website chat + automated follow-up + CRM/pipeline + review engine.  
Pitch: "Your whole front desk, automated."

**AI Growth Partner** — Setup $2,500 · $1,900/mo  
Front Office + outbound sales agent + ads + creative + strategist.

## Hard rules
- Never invent discounts or features.
- Always book a clear next step with a date.
- Log every deal in CRM the same day.
`;

type VerticalPack = {
  tagline: string;
  verticalModule: string;
  processSteps: { title: string; detail: string }[];
  talkTracks: string[];
  objections: { objection: string; reframe: string }[];
  quizExtra: QuizQuestion[];
};

const VERTICAL: Record<string, VerticalPack> = {
  "hvac-closer": {
    tagline: "Close AI front desk for HVAC & mechanical contractors",
    verticalModule: `## HVAC seat playbook

### Who buys
Owner-operators and ops managers at residential/light commercial HVAC shops (5–30 techs).

### Language that works
- After-hours emergency calls, heat/AC season spikes, no-heat / no-cool
- Dispatch overload, "my wife still answers the phone"
- Lost jobs to competitors who answer first

### Best package default
Lead with **AI Front Office** for multi-location or heavy lead volume; **Receptionist** for smaller shops.

### Discovery questions
1. How many after-hours calls do you get in peak season?
2. Who answers when you're on a job?
3. What % of inbound is emergency vs maintenance?
4. How fast do you follow up Google/Angi leads?
`,
    processSteps: [
      { title: "Open with season reality", detail: "Name peak season pain in first 30 seconds." },
      { title: "Quantify missed calls", detail: "Get a number: calls/night, jobs lost, average ticket." },
      { title: "Demo the night call", detail: "Walk a no-cool call → booked first available." },
      { title: "Close to kickoff", detail: "Propose install before next heat wave / freeze." },
    ],
    talkTracks: [
      "Every no-cool call you miss tonight is a job you already paid to generate.",
      "Your techs shouldn't be the answering service at 9pm.",
      "We put a trained AI on your line 24/7 — books the job, texts confirmation, logs the lead.",
    ],
    objections: [
      {
        objection: "I already have a receptionist.",
        reframe:
          "Perfect for day coverage — AI owns nights, weekends, and overflow so nothing spills to voicemail.",
      },
      {
        objection: "What if AI books the wrong job type?",
        reframe:
          "We use your intake script and job types — bad fits get flagged for your team, not auto-dispatched wrong.",
      },
    ],
    quizExtra: [
      {
        id: "hvac1",
        prompt: "Best opening pain for HVAC owners?",
        options: [
          "Website redesign",
          "After-hours emergency missed calls",
          "Social media likes",
          "Office furniture",
        ],
        correctIndex: 1,
      },
      {
        id: "hvac2",
        prompt: "A strong HVAC discovery question is:",
        options: [
          "What's your favorite color?",
          "How many after-hours calls in peak season?",
          "Do you like AI in general?",
          "Can I have a discount?",
        ],
        correctIndex: 1,
      },
    ],
  },
  "plumbing-closer": {
    tagline: "Win plumbers who still answer the phone from the truck",
    verticalModule: `## Plumbing seat playbook

### Who buys
Owner-operators, 3–15 van shops, drain specialists, water heater focused teams.

### Language
- Emergency leaks, water heater swaps, slab leaks, hydro jetting
- "I'm on a job, can't answer"
- Wrong job details from rushed intake

### Default package
**Receptionist** for solo/small; **Front Office** when they run ads and need follow-up.
`,
    processSteps: [
      { title: "Truck-life open", detail: "Acknowledge they're often on a job when the phone rings." },
      { title: "Emergency math", detail: "Cost of one missed water-heater job vs monthly AI fee." },
      { title: "Intake accuracy", detail: "Show how AI captures address, urgency, and photos via text." },
      { title: "Book the install", detail: "Close to a pilot week on their busiest line." },
    ],
    talkTracks: [
      "You shouldn't lose a burst-pipe call because you're under a sink.",
      "AI qualifies emergency vs maintenance so your techs show up ready.",
    ],
    objections: [
      {
        objection: "Customers want a real person for emergencies.",
        reframe:
          "AI gets them help faster — books the slot and escalates true emergencies to you by text immediately.",
      },
    ],
    quizExtra: [
      {
        id: "plumb1",
        prompt: "Common plumbing closer pain?",
        options: [
          "Too many office staff",
          "Answering from the truck / missed emergencies",
          "Too few tools",
          "Free marketing",
        ],
        correctIndex: 1,
      },
    ],
  },
  "electrical-closer": {
    tagline: "Capture panel upgrades, EV chargers, and service calls",
    verticalModule: `## Electrical seat playbook

### Who buys
Residential electricians, service & remodel shops, EV charger installers.

### Language
- Panel upgrades, EV chargers, breakers, permits
- Quote requests that pile up
- Part-time office help

### Qualification matters
Teach AI to separate simple outlet vs full panel so techs aren't wasted.
`,
    processSteps: [
      { title: "Lead type split", detail: "Service vs remodel vs EV — different urgency." },
      { title: "Quote backlog", detail: "How long until someone calls a form fill back?" },
      { title: "Permit caution", detail: "AI books consults; humans own permit scope." },
      { title: "Close Front Office", detail: "Chat + phone + follow-up for remodel leads." },
    ],
    talkTracks: [
      "Every EV charger form that sits overnight is a job walking to another shop.",
      "AI books the consult; you still own the technical estimate.",
    ],
    objections: [
      {
        objection: "Our work is too technical for AI.",
        reframe:
          "AI doesn't design the panel — it captures the lead and books your estimator while the interest is hot.",
      },
    ],
    quizExtra: [
      {
        id: "elec1",
        prompt: "AI should primarily:",
        options: [
          "Pull permits alone",
          "Capture leads and book consults",
          "Design electrical plans",
          "Replace the master electrician",
        ],
        correctIndex: 1,
      },
    ],
  },
  "medspa-closer": {
    tagline: "Book premium consults without sounding call-center",
    verticalModule: `## Med spa seat playbook

### Who buys
Medspa owners, injectables, laser, aesthetics clinics — brand-conscious.

### Language
- Consults, memberships, no-shows, Instagram DMs
- Luxury tone — never pushy or clinical overstep
- Privacy / HIPAA-adjacent caution (no medical advice)

### Default package
**Front Office** (phone + chat + follow-up + reviews) is the usual hero.
`,
    processSteps: [
      { title: "Tone first", detail: "Match brand luxury in first 10 seconds." },
      { title: "Consult capacity", detail: "Empty prime slots and no-show rate." },
      { title: "Channel chaos", detail: "Phone + IG + website chat in one system." },
      { title: "Soft close", detail: "Book a consult or membership intro — no hard medical claims." },
    ],
    talkTracks: [
      "Your clients expect a luxury experience — AI can sound on-brand 24/7.",
      "Empty consult slots are revenue you already marketed for.",
    ],
    objections: [
      {
        objection: "Our clients expect a human.",
        reframe:
          "AI handles after-hours and overflow with your script; your team still does the in-person consult.",
      },
      {
        objection: "HIPAA / privacy concerns",
        reframe:
          "We don't diagnose — we book and capture contact; clinical details stay with your team and policies.",
      },
    ],
    quizExtra: [
      {
        id: "med1",
        prompt: "On a med spa call, AI must never:",
        options: [
          "Book a consult",
          "Give medical advice",
          "Confirm location hours",
          "Take a callback number",
        ],
        correctIndex: 1,
      },
    ],
  },
  "dental-closer": {
    tagline: "Fill hygiene columns and new-patient chairs",
    verticalModule: `## Dental seat playbook

### Who buys
GP dentists, multi-location groups, office managers under pressure on production.

### Language
- Hygiene openings, new patients, broken appointments, insurance questions
- Lunch-hour missed calls

### Guardrails
AI doesn't diagnose — it books and routes insurance FAQs carefully.
`,
    processSteps: [
      { title: "Production open", detail: "Empty hygiene = pure production loss." },
      { title: "New patient speed", detail: "Same-day call-back expectations." },
      { title: "No-show recovery", detail: "Automated follow-up after cancel." },
      { title: "Close with Front Office", detail: "Phone + reminders + reviews." },
    ],
    talkTracks: [
      "An empty hygiene column is production you already staffed for.",
      "AI books new patients while the front desk is checking someone out.",
    ],
    objections: [
      {
        objection: "Patients get nervous talking to AI.",
        reframe:
          "Warm script, clear handoff — most just want an appointment time, not a long chat.",
      },
    ],
    quizExtra: [
      {
        id: "den1",
        prompt: "Strong dental pain to open with?",
        options: [
          "Empty hygiene / new-patient gaps",
          "Choosing paint colors",
          "Server rack cooling",
          "Airline miles",
        ],
        correctIndex: 0,
      },
    ],
  },
  "autobody-closer": {
    tagline: "Never miss insurer or customer calls during production",
    verticalModule: `## Auto body / collision playbook

### Who buys
Independent body shops, multi-bay collision centers, DRP-heavy shops.

### Language
- Estimates, DRP, cycle time, supplements, storm spikes
- Customers wanting status while techs are in production

### Default
Receptionist for phone load; Front Office when marketing + reviews matter.
`,
    processSteps: [
      { title: "Storm / volume open", detail: "What happens when volume doubles?" },
      { title: "Estimate intake", detail: "Who catches DRP and retail estimate calls?" },
      { title: "Status without chaos", detail: "AI gives safe status updates; humans own supplements." },
      { title: "Close the pilot", detail: "One line, 30 days, measure missed calls." },
    ],
    talkTracks: [
      "When the shop is slammed, the phone is the first thing that breaks.",
      "AI catches estimate calls so your estimator stays on the floor.",
    ],
    objections: [
      {
        objection: "Insurance needs a real estimator.",
        reframe:
          "Agreed — AI books the estimate and captures photos; your estimator still owns the number.",
      },
    ],
    quizExtra: [
      {
        id: "body1",
        prompt: "DRP in collision means:",
        options: [
          "A discount code",
          "Direct repair program / insurer relationship",
          "A paint brand",
          "A loaner car only",
        ],
        correctIndex: 1,
      },
    ],
  },
  "auto-service-closer": {
    tagline: "Capture oil-change and repair appointments before they go elsewhere",
    verticalModule: `## Auto service playbook

### Who buys
Independent repair shops, quick lube, dealership service managers.

### Language
- RO, advisors, oil change, brakes, declined services, CSI
- Phones ringing while techs are under cars
`,
    processSteps: [
      { title: "Throughput pain", detail: "Missed calls during peak bay time." },
      { title: "Declined service follow-up", detail: "AI can text re-engagement later." },
      { title: "Advisor relief", detail: "AI books simple maintenance; advisors keep complex." },
      { title: "Close Receptionist or Front Office", detail: "Match to volume and marketing." },
    ],
    talkTracks: [
      "Every busy Saturday, someone hangs up and books down the street.",
      "AI books the oil change; your advisors stay on high-ticket ROs.",
    ],
    objections: [
      {
        objection: "Customers want their advisor.",
        reframe:
          "They can request a name — AI still captures the appointment instead of a voicemail.",
      },
    ],
    quizExtra: [
      {
        id: "auto1",
        prompt: "Best auto service open?",
        options: [
          "Missed calls during peak bay time",
          "Choosing tire colors",
          "Office coffee brands",
          "Stock market tips",
        ],
        correctIndex: 0,
      },
    ],
  },
  "law-firm-closer": {
    tagline: "Capture PI and family-law intakes that hit voicemail",
    verticalModule: `## Law firm seat playbook

### Who buys
PI, family, immigration, general practice managing partners / intake leads.

### Language
- Intake, consults, retainers, conflict checks, after-hours leads
- Marketing spend wasted when phones go unanswered

### Guardrails
AI never gives legal advice — intake + scheduling only.
`,
    processSteps: [
      { title: "Marketing ROI open", detail: "Paid leads dying after hours." },
      { title: "Intake quality", detail: "Consistent questions every time." },
      { title: "No legal advice", detail: "Book consult; attorneys own counsel." },
      { title: "Close with compliance tone", detail: "Professional, calm, documented." },
    ],
    talkTracks: [
      "You already paid for that after-hours lead — AI makes sure it becomes an intake.",
      "Consistent intake beats whoever happened to answer the phone.",
    ],
    objections: [
      {
        objection: "We can't have AI give legal advice.",
        reframe:
          "It won't — it captures facts and books a consult with your firm’s rules.",
      },
    ],
    quizExtra: [
      {
        id: "law1",
        prompt: "AI on law firm lines should:",
        options: [
          "Give legal advice",
          "Capture intake and book consults only",
          "Negotiate settlements",
          "File court documents",
        ],
        correctIndex: 1,
      },
    ],
  },
  "home-services-closer": {
    tagline: "Roofing, landscaping, cleaning, remodel — speed-to-lead wins",
    verticalModule: `## Home services playbook

### Who buys
Roofers, landscapers, cleaners, remodelers, pest control.

### Language
- Storm damage, estimates, seasonal spikes, owner still taking every call
- Speed-to-lead after form fills and Google calls
`,
    processSteps: [
      { title: "Speed-to-lead", detail: "Who answers in under 60 seconds?" },
      { title: "Estimate booking", detail: "AI books the estimate window while interest is hot." },
      { title: "Season / storm", detail: "Scale phone capacity without hiring overnight." },
      { title: "Close Front Office", detail: "Phone + chat + follow-up for multi-trade ops." },
    ],
    talkTracks: [
      "After a storm, the shop that answers first wins the roof.",
      "AI keeps estimating booked while you're on a ladder.",
    ],
    objections: [
      {
        objection: "Storm season is almost over.",
        reframe:
          "Off-season is when you install the system — so you're ready when volume returns.",
      },
    ],
    quizExtra: [
      {
        id: "home1",
        prompt: "Home services win on:",
        options: [
          "Slow follow-up",
          "Speed-to-lead and booked estimates",
          "Ignoring Google calls",
          "No CRM",
        ],
        correctIndex: 1,
      },
    ],
  },
  "multi-vertical-closer": {
    tagline: "Senior closer track — switch ICPs without losing the plot",
    verticalModule: `## Multi-vertical playbook

### Who you are
High-performer who can sell the same product to HVAC Monday and med spa Tuesday.

### Skills
- Reframe value by ICP in under 60 seconds
- Executive presence on Zoom
- Playbook discipline across industries
`,
    processSteps: [
      { title: "ICP in one line", detail: "Name who they are and their #1 missed-call cost." },
      { title: "Map package to pain", detail: "Receptionist vs Front Office vs Growth." },
      { title: "Role-switch test", detail: "Practice two verticals same day." },
      { title: "Close for multi-location", detail: "Standardize intake across brands." },
    ],
    talkTracks: [
      "Same product, different pain language — that's the multi-vertical skill.",
      "Owners don't buy AI — they buy answered phones and booked work.",
    ],
    objections: [
      {
        objection: "We need different scripts per brand.",
        reframe:
          "Exactly — we load brand-specific scripts; you sell the system that holds them.",
      },
    ],
    quizExtra: [
      {
        id: "multi1",
        prompt: "Multi-vertical closers must:",
        options: [
          "Use one identical script for every industry",
          "Reframe value by ICP quickly",
          "Avoid discovery",
          "Only sell one package forever",
        ],
        correctIndex: 1,
      },
    ],
  },
};

const CORE_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Monthly price of AI Receptionist?",
    options: ["$199", "$299", "$799", "$1,900"],
    correctIndex: 1,
  },
  {
    id: "q2",
    prompt: "Flagship front desk package?",
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
    prompt: "Inventing a discount to close today is:",
    options: ["Always OK", "OK on Fridays", "Not allowed", "Required"],
    correctIndex: 2,
  },
  {
    id: "q4",
    prompt: "A deal without a dated next step in CRM is:",
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
    prompt: "Best response to “I'll think about it”?",
    options: [
      "Hang up",
      "Offer 50% off",
      "Book a specific follow-up",
      "Argue until they agree",
    ],
    correctIndex: 2,
  },
  {
    id: "q6",
    prompt: "AI Front Office monthly price?",
    options: ["$299", "$499", "$799", "$1,900"],
    correctIndex: 2,
  },
];

const SALES_PROCESS_MODULE: TrainModule = {
  id: "process",
  title: "Sales process (all seats)",
  minutes: 10,
  body: `## Call flow
1. **Rapport** — who they are, business type  
2. **Discovery** — missed calls, after-hours, tools today  
3. **Pain amplify** — cost of missed work  
4. **Fit** — Receptionist vs Front Office vs Growth  
5. **Close** — demo, pilot, or kickoff date  
6. **CRM** — next step + date or it's not real  

## Daily rhythm
- Morning note in #sales  
- CRM update before EOD  
- Wins in #wins  
`,
};

const TOOLS_MODULE: TrainModule = {
  id: "tools",
  title: "Tools & first 48 hours",
  minutes: 6,
  body: `## Slack
#sales · #wins · #product-updates · #general

## First 48 hours
1. Finish setup checklist  
2. Complete this academy quiz + practice pitch  
3. Shadow one recorded demo  
4. Book practice live with manager  
`,
};

export function getAcademyForRole(roleSlug: string): RoleAcademy {
  const role = getRole(roleSlug) || ROLES[0];
  const pack = VERTICAL[role.slug] || VERTICAL["home-services-closer"];

  const modules: TrainModule[] = [
    {
      id: "product",
      title: "Product & pricing",
      minutes: 8,
      body: PRODUCT_CORE,
    },
    SALES_PROCESS_MODULE,
    {
      id: "vertical",
      title: `${role.shortLabel} industry deep-dive`,
      minutes: 12,
      body: pack.verticalModule,
    },
    {
      id: "talk-tracks",
      title: `${role.shortLabel} talk tracks & objections`,
      minutes: 8,
      body: [
        `## Talk tracks\n`,
        ...pack.talkTracks.map((t) => `- "${t}"`),
        `\n## Objection handling\n`,
        ...pack.objections.map(
          (o) => `**"${o.objection}"**\n→ ${o.reframe}\n`,
        ),
        `\n## Your process\n`,
        ...pack.processSteps.map(
          (s, i) => `${i + 1}. **${s.title}** — ${s.detail}`,
        ),
      ].join("\n"),
    },
    TOOLS_MODULE,
  ];

  return {
    roleSlug: role.slug,
    title: `${role.title} Academy`,
    industry: role.industry,
    tagline: pack.tagline,
    modules,
    quiz: [...CORE_QUIZ, ...pack.quizExtra],
    processSteps: pack.processSteps,
    talkTracks: pack.talkTracks,
    objections: pack.objections,
  };
}

/** @deprecated use getAcademyForRole */
export const CORE_MODULES = getAcademyForRole("hvac-closer").modules;
export const QUIZ = getAcademyForRole("hvac-closer").quiz;
export const QUIZ_PASS = 0.8;
export const PITCH_PASS = 7;
