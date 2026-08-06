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

/** Common NPAs by region (practical SE + national hubs — not exhaustive). */
export const AREA_CODE_REGIONS: { code: string; region: string; state: string }[] =
  [
    { code: "864", region: "Upstate SC", state: "SC" },
    { code: "803", region: "Midlands SC", state: "SC" },
    { code: "843", region: "Lowcountry SC", state: "SC" },
    { code: "854", region: "SC overlay", state: "SC" },
    { code: "704", region: "Charlotte", state: "NC" },
    { code: "980", region: "Charlotte overlay", state: "NC" },
    { code: "919", region: "Raleigh", state: "NC" },
    { code: "984", region: "Raleigh overlay", state: "NC" },
    { code: "336", region: "Greensboro", state: "NC" },
    { code: "910", region: "Wilmington", state: "NC" },
    { code: "252", region: "Eastern NC", state: "NC" },
    { code: "404", region: "Atlanta", state: "GA" },
    { code: "678", region: "Atlanta overlay", state: "GA" },
    { code: "770", region: "Atlanta metro", state: "GA" },
    { code: "470", region: "Atlanta overlay", state: "GA" },
    { code: "706", region: "N Georgia", state: "GA" },
    { code: "912", region: "Savannah", state: "GA" },
    { code: "615", region: "Nashville", state: "TN" },
    { code: "629", region: "Nashville overlay", state: "TN" },
    { code: "901", region: "Memphis", state: "TN" },
    { code: "865", region: "Knoxville", state: "TN" },
    { code: "423", region: "Chattanooga", state: "TN" },
    { code: "305", region: "Miami", state: "FL" },
    { code: "786", region: "Miami overlay", state: "FL" },
    { code: "954", region: "Fort Lauderdale", state: "FL" },
    { code: "561", region: "Palm Beach", state: "FL" },
    { code: "407", region: "Orlando", state: "FL" },
    { code: "321", region: "Orlando/Space Coast", state: "FL" },
    { code: "813", region: "Tampa", state: "FL" },
    { code: "727", region: "St Petersburg", state: "FL" },
    { code: "904", region: "Jacksonville", state: "FL" },
    { code: "214", region: "Dallas", state: "TX" },
    { code: "469", region: "Dallas overlay", state: "TX" },
    { code: "972", region: "Dallas metro", state: "TX" },
    { code: "713", region: "Houston", state: "TX" },
    { code: "281", region: "Houston metro", state: "TX" },
    { code: "832", region: "Houston overlay", state: "TX" },
    { code: "512", region: "Austin", state: "TX" },
    { code: "210", region: "San Antonio", state: "TX" },
    { code: "212", region: "Manhattan", state: "NY" },
    { code: "646", region: "Manhattan overlay", state: "NY" },
    { code: "917", region: "NYC mobile", state: "NY" },
    { code: "718", region: "Outer boroughs", state: "NY" },
    { code: "310", region: "West LA", state: "CA" },
    { code: "424", region: "West LA overlay", state: "CA" },
    { code: "213", region: "Downtown LA", state: "CA" },
    { code: "323", region: "LA metro", state: "CA" },
    { code: "415", region: "San Francisco", state: "CA" },
    { code: "628", region: "SF overlay", state: "CA" },
    { code: "408", region: "San Jose", state: "CA" },
    { code: "312", region: "Chicago", state: "IL" },
    { code: "773", region: "Chicago metro", state: "IL" },
    { code: "202", region: "Washington DC", state: "DC" },
    { code: "703", region: "N Virginia", state: "VA" },
    { code: "571", region: "N Virginia overlay", state: "VA" },
    { code: "804", region: "Richmond", state: "VA" },
    { code: "757", region: "Hampton Roads", state: "VA" },
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
