/**
 * Platform data: marketing leads + closer territories.
 * Stored alongside interviews (GitHub on Vercel / local JSON).
 */

import { promises as fs } from "fs";
import path from "path";
import type { MarketingLead, TerritoryAssignment } from "./territories";
import {
  extractAreaCode,
  INDUSTRY_TO_ROLE,
  matchCloserForLead,
} from "./territories";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "platform.json");

type PlatformShape = {
  territories: TerritoryAssignment[];
  leads: MarketingLead[];
};

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(
      FILE,
      JSON.stringify({ territories: [], leads: [] }, null, 2),
    );
  }
}

async function readAll(): Promise<PlatformShape> {
  // Prefer GitHub on Vercel for durability
  if (process.env.VERCEL && (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)) {
    try {
      return await ghRead();
    } catch (e) {
      console.error("[platform-store] gh read failed", e);
    }
  }
  await ensure();
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const p = JSON.parse(raw) as PlatformShape;
    return {
      territories: p.territories || [],
      leads: p.leads || [],
    };
  } catch {
    return { territories: [], leads: [] };
  }
}

async function writeAll(data: PlatformShape) {
  if (process.env.VERCEL && (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)) {
    try {
      await ghWrite(data);
      return;
    } catch (e) {
      console.error("[platform-store] gh write failed", e);
      throw e;
    }
  }
  await ensure();
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

const GH_REPO =
  process.env.GITHUB_REPO || "johnmatveyev-lab/ai-frontdesk-interviewer";
const GH_PATH = "data/platform.json";
const GH_BRANCH = process.env.GITHUB_STORE_BRANCH || "data-store";

function ghToken() {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

async function ghRead(): Promise<PlatformShape> {
  const token = ghToken()!;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });
  if (r.status === 404) return { territories: [], leads: [] };
  if (!r.ok) throw new Error(`gh read ${r.status}`);
  const json = await r.json();
  const decoded = Buffer.from(json.content, "base64").toString("utf8");
  const p = JSON.parse(decoded) as PlatformShape;
  return { territories: p.territories || [], leads: p.leads || [] };
}

async function ghWrite(data: PlatformShape) {
  const token = ghToken()!;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`;
  // get sha
  let sha: string | undefined;
  const get = await fetch(`${url}?ref=${GH_BRANCH}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (get.ok) {
    const j = await get.json();
    sha = j.sha;
  }
  for (let i = 0; i < 4; i++) {
    const body: Record<string, string> = {
      message: `chore(platform): update leads/territories ${new Date().toISOString()}`,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      branch: GH_BRANCH,
    };
    if (sha) body.sha = sha;
    const r = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (r.ok) return;
    if (r.status === 409 || r.status === 422) {
      const again = await fetch(`${url}?ref=${GH_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (again.ok) sha = (await again.json()).sha;
      continue;
    }
    throw new Error(`gh write ${r.status} ${await r.text()}`);
  }
}

export async function listTerritories() {
  return (await readAll()).territories;
}

export async function upsertTerritory(
  t: Omit<TerritoryAssignment, "createdAt"> & { createdAt?: string },
) {
  const data = await readAll();
  const idx = data.territories.findIndex((x) => x.closerId === t.closerId);
  const row: TerritoryAssignment = {
    ...t,
    createdAt: t.createdAt || new Date().toISOString(),
    active: t.active !== false,
  };
  if (idx >= 0) data.territories[idx] = row;
  else data.territories.unshift(row);
  await writeAll(data);
  return row;
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

  const data = await readAll();
  const match = matchCloserForLead(
    { areaCode, state: input.state, roleSlug },
    data.territories,
  );

  const lead: MarketingLead = {
    id: `lead_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
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
  await writeAll(data);
  return lead;
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
  const data = await readAll();
  const idx = data.leads.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  data.leads[idx] = { ...data.leads[idx], ...patch };
  await writeAll(data);
  return data.leads[idx];
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
