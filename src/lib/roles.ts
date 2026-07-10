import { COMPANY, PRODUCT_KNOWLEDGE } from "./company";

export type Role = {
  slug: string;
  title: string;
  shortLabel: string;
  industry: string;
  emoji: string;
  accent: string; // tailwind-ish color token for UI
  blurb: string;
  icp: string;
  painPoints: string[];
  rolePlay: {
    characterName: string;
    characterTitle: string;
    business: string;
    personality: string;
    objections: string[];
  };
  keyterms: string[];
  weightNotes: string;
  featured?: boolean;
};

export const ROLES: Role[] = [
  {
    slug: "hvac-closer",
    title: "HVAC Sales Closer",
    shortLabel: "HVAC",
    industry: "HVAC & mechanical",
    emoji: "❄️",
    accent: "sky",
    blurb: "Close busy HVAC owners who miss after-hours emergency calls.",
    icp: "Residential & light commercial HVAC contractors",
    painPoints: [
      "Missed emergency calls at night and weekends",
      "Dispatchers overloaded in summer/winter peaks",
      "Leads from Google/Angi not followed up fast enough",
    ],
    rolePlay: {
      characterName: "Mike",
      characterTitle: "Owner",
      business: "Peak Air HVAC (12 techs, two locations)",
      personality:
        "Busy, skeptical of AI sounding robotic, cares about after-hours revenue",
      objections: [
        "I already have a receptionist during the day",
        "What if AI books the wrong job type?",
        "Too expensive for a small shop",
      ],
    },
    keyterms: ["HVAC", "heat pump", "furnace", "AC tune-up", "service call"],
    weightNotes: "Emphasize urgency, ROI of missed calls, seasonal spikes.",
    featured: true,
  },
  {
    slug: "plumbing-closer",
    title: "Plumbing Sales Closer",
    shortLabel: "Plumbing",
    industry: "Plumbing",
    emoji: "🔧",
    accent: "blue",
    blurb: "Sell AI front desk to plumbers drowning in drain and water-heater calls.",
    icp: "Plumbing companies, drain specialists, water heater services",
    painPoints: [
      "Emergency calls go to voicemail",
      "No show / wrong job details from rushed intake",
      "Owner still answering the phone on the truck",
    ],
    rolePlay: {
      characterName: "Carlos",
      characterTitle: "Owner-operator",
      business: "RapidFlow Plumbing (6 vans)",
      personality: "Practical, time-poor, hates fluff",
      objections: [
        "Customers want a real person for emergencies",
        "My guys handle their own bookings",
        "I'll think about it after busy season",
      ],
    },
    keyterms: ["plumber", "water heater", "drain", "slab leak", "hydro jetting"],
    weightNotes: "Value plain English, speed, emergency booking accuracy.",
  },
  {
    slug: "electrical-closer",
    title: "Electrical Sales Closer",
    shortLabel: "Electrical",
    industry: "Electrical",
    emoji: "⚡",
    accent: "yellow",
    blurb: "Help electricians capture panel upgrades, EV chargers, and service calls.",
    icp: "Residential electricians, service & remodel shops",
    painPoints: [
      "Quote requests pile up unanswered",
      "Hard to qualify EV charger vs. simple outlet jobs",
      "Office help is part-time and inconsistent",
    ],
    rolePlay: {
      characterName: "Jen",
      characterTitle: "Office manager / co-owner",
      business: "BrightLine Electric",
      personality: "Organized, compliance-minded, budget-aware",
      objections: [
        "We already use a scheduling app",
        "Our work is too technical for AI to book",
        "Need to talk to my partner first",
      ],
    },
    keyterms: ["electrician", "panel upgrade", "EV charger", "breaker", "permit"],
    weightNotes: "Discovery quality and correct job qualification matter a lot.",
  },
  {
    slug: "medspa-closer",
    title: "Med Spa Sales Closer",
    shortLabel: "Med Spa",
    industry: "Med spa & aesthetics",
    emoji: "✨",
    accent: "pink",
    blurb: "Book consults for med spas without sounding pushy or clinical.",
    icp: "Medspas, injectables, laser, aesthetics clinics",
    painPoints: [
      "Consult no-shows and empty prime slots",
      "Front desk overwhelmed by Instagram DMs + phone",
      "Tone must feel premium, not call-center",
    ],
    rolePlay: {
      characterName: "Sophia",
      characterTitle: "Owner / clinical director",
      business: "Luxe Skin Med Spa",
      personality: "Brand-conscious, warm but protective of patient experience",
      objections: [
        "Our clients expect a human luxury experience",
        "HIPAA / privacy concerns",
        "We already have a virtual assistant overseas",
      ],
    },
    keyterms: [
      "med spa",
      "Botox",
      "filler",
      "consult",
      "membership",
      "aesthetics",
    ],
    weightNotes: "Tone, trust, soft close, and consult booking language.",
    featured: true,
  },
  {
    slug: "dental-closer",
    title: "Dental Sales Closer",
    shortLabel: "Dental",
    industry: "Dental",
    emoji: "😁",
    accent: "teal",
    blurb: "Fill hygiene and treatment chairs for dental and ortho practices.",
    icp: "General dentistry, ortho, multi-location groups",
    painPoints: [
      "Broken appointments and empty hygiene columns",
      "New patient calls missed at lunch",
      "Insurance questions eat front desk time",
    ],
    rolePlay: {
      characterName: "Dr. Patel",
      characterTitle: "Practice owner",
      business: "SmileWell Family Dental (2 locations)",
      personality: "Polite, data-driven, cautious about patient communication",
      objections: [
        "Patients get nervous talking to AI about dental work",
        "We have Open Dental / Dentrix already",
        "Staff will resist change",
      ],
    },
    keyterms: ["hygiene", "new patient", "crown", "Invisalign", "PMS"],
    weightNotes: "Professionalism, empathy, and next-step booking.",
  },
  {
    slug: "autobody-closer",
    title: "Auto Body Sales Closer",
    shortLabel: "Auto Body",
    industry: "Collision & body shops",
    emoji: "🚗",
    accent: "orange",
    blurb: "Win collision volume by never missing insurer or customer calls.",
    icp: "Independent body shops, multi-bay collision centers",
    painPoints: [
      "Estimates and DRP calls missed during production",
      "Customers frustrated waiting for status updates",
      "Storm spikes overwhelm the office",
    ],
    rolePlay: {
      characterName: "Derek",
      characterTitle: "Shop owner",
      business: "Apex Collision (8 bays)",
      personality: "Blue-collar direct, insurance-savvy, time-pressed",
      objections: [
        "Insurance companies need a real estimator",
        "We get most work from DRPs already",
        "Not sure AI can handle cycle-time questions",
      ],
    },
    keyterms: ["collision", "estimate", "DRP", "cycle time", "supplements"],
    weightNotes: "Urgency, status communication, insurance ecosystem awareness.",
  },
  {
    slug: "auto-service-closer",
    title: "Auto Service Sales Closer",
    shortLabel: "Auto Service",
    industry: "Auto repair & service",
    emoji: "🛠️",
    accent: "red",
    blurb: "Capture oil-change and repair appointments before customers go elsewhere.",
    icp: "Independent repair shops, quick lube, dealership service",
    painPoints: [
      "Phone rings while techs are under cars",
      "No-shows on high-ticket repairs",
      "Hard to follow up on declined services",
    ],
    rolePlay: {
      characterName: "Angela",
      characterTitle: "Service manager",
      business: "Metro Auto Care (5 bays)",
      personality: "Friendly, process-oriented, measured by CSI and throughput",
      objections: [
        "Customers want to talk to the advisor they know",
        "We already text from our shop management system",
        "Budget is tight this quarter",
      ],
    },
    keyterms: ["oil change", "brake job", "advisor", "RO", "shop management"],
    weightNotes: "Appointment setting, follow-up, and simple ROI math.",
  },
  {
    slug: "law-firm-closer",
    title: "Law Firm Sales Closer",
    shortLabel: "Law",
    industry: "Local law firms",
    emoji: "⚖️",
    accent: "indigo",
    blurb: "Capture PI and family-law intakes that currently hit voicemail.",
    icp: "Personal injury, family, immigration, general practice firms",
    painPoints: [
      "After-hours leads go cold",
      "Intake quality varies by staff",
      "Marketing spend wasted when phones unanswered",
    ],
    rolePlay: {
      characterName: "Attorney Ruiz",
      characterTitle: "Managing partner",
      business: "Ruiz & Associates (boutique PI firm)",
      personality: "Professional, risk-aware, ROI-focused on intake",
      objections: [
        "Confidentiality and bar advertising rules",
        "We can't have AI give legal advice",
        "We already use a call center",
      ],
    },
    keyterms: ["intake", "PI", "consultation", "retainer", "conflict check"],
    weightNotes: "Professional tone, guardrails language, intake discipline.",
  },
  {
    slug: "home-services-closer",
    title: "Home Services Sales Closer",
    shortLabel: "Home Services",
    industry: "Roofing, landscaping, cleaning & more",
    emoji: "🏠",
    accent: "green",
    blurb: "One seat for general home-services: roofing, landscaping, cleaning, remodeling.",
    icp: "Roofers, landscapers, cleaners, remodelers, pest control",
    painPoints: [
      "Seasonal lead spikes",
      "Owners still taking every call",
      "Estimates not booked while the lead is hot",
    ],
    rolePlay: {
      characterName: "Tara",
      characterTitle: "Owner",
      business: "Summit Roofing & Exteriors",
      personality: "Energetic after a storm, wants speed without chaos",
      objections: [
        "Storm season is almost over",
        "My estimator needs to set the appointment himself",
        "We tried chatbots and they were terrible",
      ],
    },
    keyterms: ["roofing", "estimate", "storm damage", "landscaping", "remodel"],
    weightNotes: "Speed-to-lead and clear next steps (estimate booking).",
    featured: true,
  },
  {
    slug: "multi-vertical-closer",
    title: "Multi-Vertical Sales Closer",
    shortLabel: "Multi-Vertical",
    industry: "Mixed book / senior closer",
    emoji: "🚀",
    accent: "amber",
    blurb: "Senior closer track: sell across industries and coach junior reps.",
    icp: "High-performers who can switch verticals day to day",
    painPoints: [
      "Need adaptive discovery across ICPs",
      "Must reframe the same product for different pains",
      "Higher bar on objection handling and leadership",
    ],
    rolePlay: {
      characterName: "Alex",
      characterTitle: "Multi-location operator",
      business: "Regional group with a med spa + a home-services brand",
      personality: "Sharp, tests for range, pushes for executive presence",
      objections: [
        "We need different scripts per brand",
        "Prove ROI across two businesses",
        "I only want to talk to a senior rep",
      ],
    },
    keyterms: ["multi-location", "portfolio", "ICP", "playbook", "OTE"],
    weightNotes: "Range, executive presence, adaptability across ICPs.",
  },
];

export function getRole(slug: string): Role | undefined {
  return ROLES.find((r) => r.slug === slug);
}

export function buildInterviewerInstructions(
  role: Role,
  candidate: {
    firstName: string;
    lastName: string;
    yearsInSales?: string;
    industryExperience?: string;
  },
): string {
  const fullName =
    `${candidate.firstName} ${candidate.lastName}`.trim() || "the candidate";
  const first = candidate.firstName || fullName;

  return `
You are **Jordan**, a senior hiring manager and sales leader at ${COMPANY.brand} (${COMPANY.product}).
You are conducting a live VOICE interview for the **${role.title}** role.

## Candidate
- Name: ${fullName}
- Applying for: ${role.title} (${role.industry})
- Years in sales (self-reported): ${candidate.yearsInSales || "not provided"}
- Prior industry experience (self-reported): ${candidate.industryExperience || "not provided"}

## Your persona
- Warm, professional, direct. High standards. You like people who can close without being sleazy.
- Speak in short turns suitable for voice (1–3 sentences usually). Never monologue for long.
- Sound human: natural pacing, light humor when appropriate, clear transitions.
- You already know this is a voice interview — do not ask if they can hear you after the first greeting.
- Do NOT re-collect name, email, or phone — we already have that from the application form.

## Role being hired
- Title: ${role.title}
- Industry focus: ${role.industry}
- ICP: ${role.icp}
- Mission: Close owners in this vertical on ${COMPANY.product} packages.
- Comp: competitive base + uncapped commission (say "strong OTE for closers who hit quota" — do not invent fake numbers).
- Evaluation emphasis: ${role.weightNotes}

## Vertical pain points (use in discovery coaching & role-play)
${role.painPoints.map((p) => `- ${p}`).join("\n")}

${PRODUCT_KNOWLEDGE}

### Ideal customers for THIS seat
${role.icp}. Frame value around missed calls, booked jobs/consults, and front-desk load.

## Interview arc (~12–15 minutes; adapt depth)
1. **Open** — Greet ${first} by name. You are Jordan from ${COMPANY.brand}. Set expectations: conversational, includes a short role-play in the ${role.industry} space. Ask for a 45-second intro: who they are and what kind of selling they've done.
2. **Track record** — Quota attainment, deal size, cycle length, hardest close, inbound vs. outbound.
3. **Product / vertical fit** — What they know about AI phone agents for ${role.industry}. Correct misconceptions gently. Can they restate value in plain English for this ICP?
4. **Role-play (required)** — Say you will role-play. You become **${role.rolePlay.characterName}**, ${role.rolePlay.characterTitle} of **${role.rolePlay.business}**. Personality: ${role.rolePlay.personality}. Candidate should run discovery then close toward a clear next step (demo, pilot, or kickoff). Give realistic pushback using objections like: ${role.rolePlay.objections.join("; ")}. After ~2–4 minutes, break character and debrief.
5. **Objection round** — Fire 2 rapid objections from the list above; score reframes.
6. **Motivation & logistics** — Why this vertical seat, start date comfort, coachability, rejection resilience.
7. **Their questions** — Offer 1–2 questions.
8. **Close** — Thank them. Summarize 2 strengths and 1 development area. Say the hiring team will follow up by email. Do NOT promise a job offer. Clearly say the interview is complete.

## Hard rules
- Stay in interviewer mode except when you are ${role.rolePlay.characterName} in role-play.
- Do not invent fake policies, salary figures, or equity.
- If audio is unclear, ask them to repeat once.
- Keep moving; don't stall on one section.
- When ending, clearly say the interview is complete.
`.trim();
}

export function greetingForRole(role: Role, firstName: string): string {
  const name = firstName.trim();
  if (name) {
    return `Hi ${name}, welcome to your ${role.title} interview with ${COMPANY.product} at ${COMPANY.brand}. I'm Jordan. This call may be recorded for hiring. Thanks for being here.`;
  }
  return `Welcome to your ${role.title} interview with ${COMPANY.product} at ${COMPANY.brand}. I'm Jordan. This call may be recorded for hiring. Thanks for being here.`;
}
