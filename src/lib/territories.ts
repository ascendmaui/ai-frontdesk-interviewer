/**
 * Closer territories: area-code based matching for lead routing.
 * Closers pick home area codes; leads with matching phone NPAs route to them.
 */

export type TerritoryAssignment = {
  closerId: string;
  closerName: string;
  email: string;
  phone: string;
  roleSlug: string;
  /** Primary NPA area codes they cover, e.g. ["864", "803"] */
  areaCodes: string[];
  /** Optional US states as secondary filter */
  states: string[];
  active: boolean;
  createdAt: string;
};

export type MarketingLead = {
  id: string;
  source: string;
  industry: string;
  roleSlug: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone: string;
  areaCode: string;
  state?: string;
  status: "new" | "routed" | "working" | "won" | "lost" | "unassigned";
  assignedCloserId?: string;
  assignedCloserName?: string;
  notes?: string;
  createdAt: string;
  utmSource?: string;
  utmCampaign?: string;
};

/** Common NPAs by region (subset — expand as needed). */
export const AREA_CODE_REGIONS: { code: string; region: string; state: string }[] =
  [
    { code: "864", region: "Upstate SC", state: "SC" },
    { code: "803", region: "Midlands SC", state: "SC" },
    { code: "843", region: "Lowcountry SC", state: "SC" },
    { code: "854", region: "SC overlay", state: "SC" },
    { code: "704", region: "Charlotte", state: "NC" },
    { code: "980", region: "Charlotte overlay", state: "NC" },
    { code: "919", region: "Raleigh", state: "NC" },
    { code: "336", region: "Greensboro", state: "NC" },
    { code: "404", region: "Atlanta", state: "GA" },
    { code: "678", region: "Atlanta overlay", state: "GA" },
    { code: "770", region: "Atlanta metro", state: "GA" },
    { code: "470", region: "Atlanta overlay", state: "GA" },
    { code: "615", region: "Nashville", state: "TN" },
    { code: "629", region: "Nashville overlay", state: "TN" },
    { code: "901", region: "Memphis", state: "TN" },
    { code: "305", region: "Miami", state: "FL" },
    { code: "786", region: "Miami overlay", state: "FL" },
    { code: "407", region: "Orlando", state: "FL" },
    { code: "214", region: "Dallas", state: "TX" },
    { code: "469", region: "Dallas overlay", state: "TX" },
    { code: "713", region: "Houston", state: "TX" },
    { code: "281", region: "Houston metro", state: "TX" },
  ];

export function extractAreaCode(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1, 4);
  if (digits.length >= 10) return digits.slice(0, 3);
  return "";
}

export function matchCloserForLead(
  lead: Pick<MarketingLead, "areaCode" | "state" | "roleSlug">,
  closers: TerritoryAssignment[],
): TerritoryAssignment | null {
  const active = closers.filter(
    (c) => c.active && (!lead.roleSlug || c.roleSlug === lead.roleSlug || c.roleSlug === "multi-vertical-closer"),
  );
  if (!active.length) return null;

  const byCode = active.filter((c) => c.areaCodes.includes(lead.areaCode));
  if (byCode.length === 1) return byCode[0];
  if (byCode.length > 1) {
    // Round-robin-ish: pick first with fewest codes as proxy for capacity
    return byCode.sort((a, b) => a.areaCodes.length - b.areaCodes.length)[0];
  }

  if (lead.state) {
    const byState = active.filter((c) => c.states.includes(lead.state!));
    if (byState.length) return byState[0];
  }

  return null;
}

export const INDUSTRY_TO_ROLE: Record<string, string> = {
  hvac: "hvac-closer",
  plumbing: "plumbing-closer",
  electrical: "electrical-closer",
  medspa: "medspa-closer",
  dental: "dental-closer",
  autobody: "autobody-closer",
  "auto-service": "auto-service-closer",
  law: "law-firm-closer",
  "home-services": "home-services-closer",
  roofing: "home-services-closer",
  landscaping: "home-services-closer",
};
