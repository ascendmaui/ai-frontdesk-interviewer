import type { SetupTask } from "./types";

export function buildSetupTasks(): SetupTask[] {
  return [
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
        "Skim company product, pricing, and sales process. You'll quiz on this in training.",
      href: process.env.ONBOARDING_HANDBOOK_URL || "/train",
      required: true,
    },
    {
      id: "hearthline-os",
      title: "Sign in to Hearthline OS",
      description:
        "Use the same Google email you applied with. After training, your seat unlocks leads + job kit. Open Job kit for scripts, ICP, and your queue.",
      href:
        process.env.HEARTHLINE_OS_URL
          ? `${process.env.HEARTHLINE_OS_URL.replace(/\/$/, "")}/app`
          : "https://hearthline-platform.vercel.app/app",
      required: true,
    },
    {
      id: "crm",
      title: "Confirm CRM access",
      description:
        "Log in to CRM and open your pipeline board. If you can't log in, message ops.",
      href: process.env.ONBOARDING_CRM_URL || "https://hearthline-platform.vercel.app/app",
      required: true,
    },
    {
      id: "dialer",
      title: "Confirm dialer / phone tool",
      description:
        "Verify outbound calling works (or note that ops is provisioning within 1 business day).",
      href: process.env.ONBOARDING_DIALER_URL || undefined,
      required: true,
    },
    {
      id: "calendar",
      title: "Connect calendar for demos",
      description: "Ensure your booking calendar is open for discovery calls.",
      href: process.env.FINAL_INTERVIEW_CALENDAR_URL || undefined,
      required: false,
    },
    {
      id: "signature",
      title: "Set email signature",
      description:
        "Name · Sales · AI Front Desk · phone. Use company brand colors if available.",
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
  const requiredDone = required.every((t) => t.completedAt);
  return { done, total: list.length, requiredDone };
}
