/**
 * Hearthline multi-system map — single source of truth for admin diagrams.
 */

export type SystemNode = {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: "live" | "building" | "planned";
};

export type FlowEdge = {
  from: string;
  to: string;
  label: string;
};

export const SYSTEMS: SystemNode[] = [
  {
    id: "marketing",
    name: "Marketing / Lead Gen",
    description:
      "Ads, social, landing pages by industry. Captures business leads and routes by area code into closer CRM.",
    url: "/leads",
    status: "live",
  },
  {
    id: "interviewer",
    name: "Sales Closer Interviewer OS",
    description:
      "Jordan screening → Morgan HM → Offer → Riley onboarding → Setup → Academy → Ready.",
    url: "/admin",
    status: "live",
  },
  {
    id: "crm",
    name: "Closer CRM + Territories",
    description:
      "Leads assigned by area code / state. Closers work only their territory.",
    url: "/admin/crm",
    status: "live",
  },
  {
    id: "hearthline",
    name: "Hearthline control plane",
    description:
      "Canonical CRM spine + product app (hearthline-platform). Gold URLs deprecated.",
    url: "https://hearthline-platform.vercel.app",
    status: "live",
  },
  {
    id: "slack",
    name: "Slack workspace",
    description:
      "#sales #wins #hiring-closers #leads-inbound #onboarding #product-updates — setup from /admin/systems",
    url: "/admin/systems#slack",
    status: "live",
  },
];

export const HIRING_FUNNEL = [
  { id: "apply", label: "Apply", sub: ["Role pick", "Form + consent", "UTMs"] },
  {
    id: "screen",
    label: "Screening · Jordan (Eve)",
    sub: ["Voice interview", "Multitask Yes/No", "AI scorecard (admin only)"],
  },
  {
    id: "hm",
    label: "Hiring manager · Morgan (Sal)",
    sub: ["Work ethic", "Pipeline day plan", "Culture"],
  },
  {
    id: "offer",
    label: "Offer",
    sub: ["Digital offer", "Accept / decline", "Admin force-issue"],
  },
  {
    id: "onboard",
    label: "Onboarding · Riley (Ara)",
    sub: ["Slack", "CRM", "Dialer", "Daily rhythm"],
  },
  {
    id: "setup",
    label: "Setup checklist",
    sub: ["Portal tasks", "Required tools"],
  },
  {
    id: "train",
    label: "Industry academy · Coach (Rex)",
    sub: ["Seat modules", "Knowledge >=85%", "Two roleplays >=8/10"],
  },
  {
    id: "ready",
    label: "Production ready",
    sub: ["Certification active", "Territory active", "Receive leads"],
  },
];

export const MARKETING_FUNNEL = [
  { id: "m1", label: "Ad / social creative", sub: ["Industry pack", "UTM links"] },
  { id: "m2", label: "Landing / form", sub: ["Industry select", "Phone capture"] },
  { id: "m3", label: "Lead record", sub: ["Area code parse", "Role map"] },
  { id: "m4", label: "Territory match", sub: ["Closer assignment", "Slack #leads-inbound"] },
  { id: "m5", label: "Closer CRM", sub: ["Work lead", "Book demo"] },
];

export const SALES_FUNNEL = [
  { id: "s1", label: "Closer gets lead", sub: ["Certified + production-ready gate"] },
  { id: "s2", label: "Discovery call", sub: ["Script from academy"] },
  { id: "s3", label: "Demo / audit", sub: ["Hearthline packages"] },
  { id: "s4", label: "Close", sub: ["Next step in CRM"] },
  { id: "s5", label: "Win → #wins", sub: ["Ops install"] },
];

export const FLOWS: FlowEdge[] = [
  { from: "hearthline", to: "marketing", label: "brand traffic" },
  { from: "marketing", to: "crm", label: "industry leads" },
  { from: "marketing", to: "interviewer", label: "closer applicants" },
  { from: "interviewer", to: "crm", label: "certified closers" },
  { from: "crm", to: "slack", label: "alerts" },
  { from: "interviewer", to: "slack", label: "hiring scorecards" },
];
