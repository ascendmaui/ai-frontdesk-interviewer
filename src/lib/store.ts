import { promises as fs } from "fs";
import path from "path";
import type { InterviewRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "interviews.json");

/**
 * Durable store:
 * - Prefer GitHub Contents API when GITHUB_TOKEN + GITHUB_REPO set (works on Vercel)
 * - Else local JSON file (local dev)
 */

type StoreShape = { interviews: InterviewRecord[] };

const GH_REPO =
  process.env.GITHUB_REPO || "johnmatveyev-lab/ai-frontdesk-interviewer";
const GH_PATH = process.env.GITHUB_STORE_PATH || "data/production-interviews.json";
const GH_BRANCH = process.env.GITHUB_STORE_BRANCH || "data-store";

function ghToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

function useGitHub(): boolean {
  return Boolean(ghToken() && process.env.VERCEL);
}

async function ensureLocal() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify({ interviews: [] }, null, 2));
  }
}

async function readLocal(): Promise<StoreShape> {
  await ensureLocal();
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed.interviews) return { interviews: [] };
    return parsed;
  } catch {
    return { interviews: [] };
  }
}

async function writeLocal(data: StoreShape) {
  await ensureLocal();
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, FILE);
}

type GhFile = { sha?: string; content?: string };

async function ghGetFile(): Promise<{ data: StoreShape; sha?: string }> {
  const token = ghToken()!;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}?ref=${GH_BRANCH}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (r.status === 404) {
    return { data: { interviews: [] } };
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`GitHub store read failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const json = (await r.json()) as GhFile;
  if (!json.content) return { data: { interviews: [] }, sha: json.sha };
  const decoded = Buffer.from(json.content, "base64").toString("utf8");
  try {
    const parsed = JSON.parse(decoded) as StoreShape;
    return { data: { interviews: parsed.interviews || [] }, sha: json.sha };
  } catch {
    return { data: { interviews: [] }, sha: json.sha };
  }
}

async function ghPutFile(data: StoreShape, sha?: string) {
  const token = ghToken()!;
  // Ensure branch exists (best-effort)
  await ensureDataBranch(token);

  const url = `https://api.github.com/repos/${GH_REPO}/contents/${GH_PATH}`;
  const body: Record<string, string> = {
    message: `chore(store): update interviews ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(data, null, 2), "utf8").toString(
      "base64",
    ),
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;

  const r = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    // retry once without sha if conflict / missing
    if (r.status === 409 || r.status === 422) {
      const again = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          message: body.message,
          content: body.content,
          branch: GH_BRANCH,
          ...(sha ? {} : {}),
        }),
      });
      if (again.ok) return;
    }
    throw new Error(`GitHub store write failed: ${r.status} ${t.slice(0, 200)}`);
  }
}

async function ensureDataBranch(token: string) {
  const refUrl = `https://api.github.com/repos/${GH_REPO}/git/ref/heads/${GH_BRANCH}`;
  const check = await fetch(refUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (check.ok) return;

  // Get main SHA
  const mainRef = await fetch(
    `https://api.github.com/repos/${GH_REPO}/git/ref/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );
  if (!mainRef.ok) return;
  const main = (await mainRef.json()) as { object?: { sha?: string } };
  const sha = main.object?.sha;
  if (!sha) return;

  await fetch(`https://api.github.com/repos/${GH_REPO}/git/refs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: `refs/heads/${GH_BRANCH}`, sha }),
  });
}

async function readAll(): Promise<StoreShape> {
  if (useGitHub()) {
    try {
      const { data } = await ghGetFile();
      return data;
    } catch (e) {
      console.error("[store] GitHub read failed, empty store", e);
      return { interviews: [] };
    }
  }
  return readLocal();
}

async function writeAll(data: StoreShape) {
  if (useGitHub()) {
    const { sha } = await ghGetFile().catch(() => ({ sha: undefined }));
    await ghPutFile(data, sha);
    return;
  }
  await writeLocal(data);
}

export function newId(): string {
  return `int_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function newPortalToken(): string {
  return `pt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function createInterview(
  record: InterviewRecord,
): Promise<InterviewRecord> {
  const data = await readAll();
  data.interviews.unshift(record);
  await writeAll(data);
  return record;
}

export async function getInterview(
  id: string,
): Promise<InterviewRecord | null> {
  const data = await readAll();
  return data.interviews.find((i) => i.id === id) || null;
}

export async function getByPortalToken(
  token: string,
): Promise<InterviewRecord | null> {
  const data = await readAll();
  return (
    data.interviews.find(
      (i) => i.portalToken === token || i.offer?.token === token,
    ) || null
  );
}

export async function getByOfferToken(
  token: string,
): Promise<InterviewRecord | null> {
  const data = await readAll();
  return data.interviews.find((i) => i.offer?.token === token) || null;
}

export async function updateInterview(
  id: string,
  patch: Partial<InterviewRecord>,
): Promise<InterviewRecord | null> {
  const data = await readAll();
  const idx = data.interviews.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  data.interviews[idx] = { ...data.interviews[idx], ...patch };
  await writeAll(data);
  return data.interviews[idx];
}

export async function listInterviews(limit = 200): Promise<InterviewRecord[]> {
  const data = await readAll();
  return data.interviews.slice(0, limit);
}

export async function listApplications(
  limit = 200,
): Promise<InterviewRecord[]> {
  const data = await readAll();
  return data.interviews
    .filter((i) => i.kind === "screening" || !i.parentId)
    .slice(0, limit);
}
