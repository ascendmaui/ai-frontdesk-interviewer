import { randomUUID } from "node:crypto";
import { readState, mutateState } from "./persistence";
import { certificationCheck } from "./certification";
import { getInterview } from "./store";
import type { MarketingLead, TerritoryAssignment } from "./territories";
import {
  extractAreaCode,
  INDUSTRY_TO_ROLE,
  matchCloserForLead,
} from "./territories";
const readAll = readState;
export async function listTerritories() {
  return (await readAll()).territories;
}

export async function upsertTerritory(
  t: Omit<TerritoryAssignment, "createdAt"> & { createdAt?: string },
) {
  return mutateState(async (data) => {
    const idx = data.territories.findIndex((x) => x.closerId === t.closerId);
    const row: TerritoryAssignment = {
      ...t,
      createdAt: t.createdAt || new Date().toISOString(),
      active: t.active !== false && (await eligible(t.closerId)),
    };
    if (idx >= 0) data.territories[idx] = row;
    else data.territories.unshift(row);
    return row;
  });
}

export async function listLeads(limit = 200) {
  return (await readAll()).leads.slice(0, limit);
}

export async function createLead(input: {
  source?: string;
  industry: string;
  phone: string;
  email?: string;
  contactName?: string;
  businessName?: string;
  state?: string;
  utmSource?: string;
  utmCampaign?: string;
  notes?: string;
}): Promise<MarketingLead> {
  const areaCode = extractAreaCode(input.phone);
  const roleSlug =
    INDUSTRY_TO_ROLE[input.industry.toLowerCase()] ||
    INDUSTRY_TO_ROLE["home-services"] ||
    "home-services-closer";

  return mutateState(async (data) => {
    const match = matchCloserForLead(
      { areaCode, state: input.state, roleSlug },
      await Promise.all(
        data.territories.map(async (territory) => ({
          ...territory,
          active: territory.active && (await eligible(territory.closerId)),
        })),
      ),
    );

    const lead: MarketingLead = {
      id: `lead_${randomUUID()}`,
      source: input.source || "manual",
      industry: input.industry,
      roleSlug,
      businessName: input.businessName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      areaCode,
      state: input.state,
      status: match ? "routed" : "unassigned",
      assignedCloserId: match?.closerId,
      assignedCloserName: match?.closerName,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      utmSource: input.utmSource,
      utmCampaign: input.utmCampaign,
    };

    data.leads.unshift(lead);
    return lead;
  });
}

export async function updateLeadStatus(
  id: string,
  patch: Partial<
    Pick<
      MarketingLead,
      "status" | "assignedCloserId" | "assignedCloserName" | "notes"
    >
  >,
): Promise<MarketingLead | null> {
  return mutateState(async (data) => {
    const idx = data.leads.findIndex((l) => l.id === id);
    if (idx < 0) return null;
    if (patch.assignedCloserId && !(await eligible(patch.assignedCloserId)))
      throw new Error("Certification required for assigned closer");
    data.leads[idx] = { ...data.leads[idx], ...patch };
    return data.leads[idx];
  });
}

/** Activate a hired closer into the territory pool from their application phone. */
export async function activateCloserTerritory(input: {
  closerId: string;
  closerName: string;
  email: string;
  phone: string;
  roleSlug: string;
  extraAreaCodes?: string[];
  states?: string[];
}): Promise<TerritoryAssignment> {
  const primary = extractAreaCode(input.phone);
  const areaCodes = [
    ...new Set(
      [primary, ...(input.extraAreaCodes || [])].filter(Boolean) as string[],
    ),
  ];
  if (!areaCodes.length) {
    // Fallback so they still enter CRM as active (admin can edit codes)
    areaCodes.push("000");
  }
  return upsertTerritory({
    closerId: input.closerId,
    closerName: input.closerName,
    email: input.email,
    phone: input.phone,
    roleSlug: input.roleSlug,
    areaCodes,
    states: input.states || [],
    active: true,
  });
}
async function eligible(id: string) {
  const root = await getInterview(id);
  return (
    !!root &&
    root.pipelineStatus === "production_ready" &&
    certificationCheck(root).certified
  );
}
