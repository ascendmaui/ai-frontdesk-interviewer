/**
 * Provision hires into Hearthline OS (shared pipeline + Google team allowlist).
 * https://hearthline-gold.vercel.app/os
 */

import type { InterviewRecord } from "./types";

export type ProvisionResponse = {
  ok?: boolean;
  error?: string;
  email?: string;
  positionTitle?: string;
  teamRole?: string;
  assignedLeads?: { id: string; businessName: string; vertical: string }[];
  jobKit?: {
    osLoginUrl?: string;
    playbookUrl?: string;
    dailyTarget?: number;
    assignedLeadNames?: string[];
  };
  alreadyProvisioned?: boolean;
};

function osBase(): string {
  return (
    process.env.HEARTHLINE_OS_URL ||
    process.env.NEXT_PUBLIC_HEARTHLINE_OS_URL ||
    "https://hearthline-gold.vercel.app"
  ).replace(/\/$/, "");
}

function provisionSecret(): string | undefined {
  return (
    process.env.HEARTHLINE_PROVISION_SECRET ||
    process.env.HEARTHLINE_OS_PROVISION_SECRET ||
    undefined
  );
}

/** Fire-and-log provision; never throws to hiring pipeline. */
export async function provisionToHearthlineOs(
  root: InterviewRecord,
  opts?: { reassignLeads?: boolean; trigger?: string },
): Promise<ProvisionResponse> {
  const secret = provisionSecret();
  if (!secret) {
    console.warn(
      "[hearthline-os] HEARTHLINE_PROVISION_SECRET not set — skip provision",
    );
    return { error: "HEARTHLINE_PROVISION_SECRET not configured" };
  }

  const email = root.candidate.email?.toLowerCase().trim();
  if (!email) {
    return { error: "Candidate email missing" };
  }

  const payload = {
    email,
    firstName: root.candidate.firstName,
    lastName: root.candidate.lastName,
    phone: root.candidate.phone,
    roleSlug: root.roleSlug,
    applicationId: root.rootId || root.id,
    source: "ai-frontdesk-interviewer",
    reassignLeads: Boolean(opts?.reassignLeads),
    trigger: opts?.trigger,
  };

  try {
    const res = await fetch(`${osBase()}/api/os/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "x-hearthline-provision-secret": secret,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as ProvisionResponse;
    if (!res.ok) {
      console.error("[hearthline-os] provision failed", res.status, data);
      return { error: data.error || `HTTP ${res.status}` };
    }
    console.info(
      "[hearthline-os] provisioned",
      data.email,
      data.positionTitle,
      data.assignedLeads?.length,
    );
    return data;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Provision network error";
    console.error("[hearthline-os]", message);
    return { error: message };
  }
}

export function shouldProvisionOnStatus(status: string): boolean {
  return status === "production_ready";
}


export function describeProvisionMode(trigger?: string): "auto" | "manual" | "unknown" {
  if (!trigger) return "unknown";
  if (trigger.startsWith("auto_")) return "auto";
  if (trigger.startsWith("manual_")) return "manual";
  return "unknown";
}
