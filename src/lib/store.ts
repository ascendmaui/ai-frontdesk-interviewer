import { promises as fs } from "fs";
import path from "path";
import type { InterviewRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "interviews.json");

type StoreShape = { interviews: InterviewRecord[] };

async function ensure() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify({ interviews: [] }, null, 2));
  }
}

async function readAll(): Promise<StoreShape> {
  await ensure();
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed.interviews) return { interviews: [] };
    return parsed;
  } catch {
    return { interviews: [] };
  }
}

async function writeAll(data: StoreShape) {
  await ensure();
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, FILE);
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

/** Root applications only (screening kind or no parent). */
export async function listApplications(limit = 200): Promise<InterviewRecord[]> {
  const data = await readAll();
  return data.interviews
    .filter((i) => i.kind === "screening" || !i.parentId)
    .slice(0, limit);
}
