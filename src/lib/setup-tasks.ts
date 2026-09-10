import type { SetupTask } from "./types";

export function buildSetupTasks(): SetupTask[] {
  const packetUrl = "/documents/closer-packet";
  const hearthlineBase = (process.env.HEARTHLINE_OS_URL || "https://hearthline-platform.vercel.app").replace(/\/$/, "");
  return [
    {
      id: "commission-agreement",
      title: "Review & sign commission agreement",
      description:
        "Required. Review commission-only terms, when commission is earned on qualifying collected/cleared customer funds, and refund/chargeback treatment. The formal signed agreement controls.",
      href: process.env.ONBOARDING_COMMISSION_AGREEMENT_URL || packetUrl,
      required: true,
    },
    {
      id: "confidentiality-data-use",
      title: "Confidentiality & data-use acknowledgement",
      description:
        "Required. Confirm customer/company information is used only for approved work, minimum necessary data is handled, and credentials or sensitive identifiers are never pasted into CRM notes or AI chats.",
      href: process.env.ONBOARDING_CONFIDENTIALITY_URL || packetUrl,
      required: true,
    },
    {
      id: "sales-compliance",
      title: "Sales conduct & outreach compliance",
      description:
        "Required. Agree to truthful claims, approved pricing/scope, immediate opt-out handling, no fake scarcity, no promises outside confirmed scope, and applicable communication rules.",
      href: process.env.ONBOARDING_COMPLIANCE_URL || packetUrl,
      required: true,
    },
    {
      id: "payout-profile",
      title: "Set up secure commission payout profile",
      description:
        "Required. Complete payout details only in the approved secure payout provider. Never send banking credentials through this app, Slack, CRM notes, or email.",
      href: process.env.ONBOARDING_PAYOUT_URL || undefined,
      required: true,
    },
    {
      id: "tax-form",
      title: "Complete secure tax-form workflow",
      description:
        "Required when applicable. Use the approved secure tax/e-sign provider only. Do not enter or store SSNs, tax IDs, identity documents, or equivalent sensitive identifiers in this recruiting app or CRM notes.",
      href: process.env.ONBOARDING_TAX_FORM_URL || undefined,
      required: true,
    },
    {
      id: "slack",
      title: "Join Slack",
      description:
        "Accept the workspace invite and set your display name to First Last. Join #sales, #wins, #product-updates, and #general.",
      href: process.env.ONBOARDING_SLACK_INVITE_URL || undefined,
      required: true,
    },
    {
      id: "handbook",
      title: "Read the closer handbook",
      description:
        "Review company product, pricing, sales process, handoff standards, and compliance. The academy will test this material.",
      href: process.env.ONBOARDING_HANDBOOK_URL || packetUrl,
      required: true,
    },
    {
      id: "hearthline-os",
      title: "Sign in to Hearthline OS",
      description:
        "Use the same Google email you applied with. After certification, your seat unlocks live leads and your job kit.",
      href: `${hearthlineBase}/app`,
      required: true,
    },
    {
      id: "crm",
      title: "Confirm CRM access",
      description:
        "Log in to CRM and open your pipeline board. If you cannot log in, contact operations before handling live leads.",
      href: process.env.ONBOARDING_CRM_URL || `${hearthlineBase}/app`,
      required: true,
    },
    {
      id: "dialer",
      title: "Confirm dialer / phone tool",
      description:
        "Verify the approved calling workflow works, including caller identity and opt-out handling, before live lead access.",
      href: process.env.ONBOARDING_DIALER_URL || undefined,
      required: true,
    },
    {
      id: "calendar",
      title: "Connect calendar for demos",
      description:
        "Ensure your booking calendar is available for qualified discovery/demo calls.",
      href: process.env.FINAL_INTERVIEW_CALENDAR_URL || undefined,
      required: false,
    },
    {
      id: "signature",
      title: "Set email signature",
      description:
        "Name · Sales · AI Front Desk · approved contact details. Do not claim titles, credentials, or partnerships you do not have.",
      required: false,
    },
  ];
}

export function setupProgress(tasks: SetupTask[] | undefined): {
  done: number;
  total: number;
  requiredDone: boolean;
} {
  const list = tasks || [];
  const required = list.filter((t) => t.required);
  const done = list.filter((t) => t.completedAt).length;
  const requiredDone = required.length > 0 && required.every((t) => t.completedAt);
  return { done, total: list.length, requiredDone };
}
