import { randomBytes, randomUUID } from "node:crypto";
import { readState, mutateState } from "./persistence";
import { syncApplicantToSpine } from "./spine-sync";
import type { InterviewRecord } from "./types";

export function newId() {
  return "int_" + randomUUID();
}

export function newPortalToken() {
  return "pt_" + randomBytes(32).toString("base64url");
}

export async function createInterview(record: InterviewRecord) {
  const created = await mutateState((data) => {
    if (data.interviews.some((x) => x.id === record.id)) {
      throw new Error("Duplicate interview");
    }
    data.interviews.unshift(record);
    return structuredClone(record);
  });
  try {
    await syncApplicantToSpine(created);
  } catch (e) {
    console.error("[store] spine sync after createInterview", e);
  }
  return created;
}

export async function getInterview(id: string) {
  return (await readState()).interviews.find((x) => x.id === id) || null;
}

export async function getByPortalToken(token: string) {
  if (!token) return null;
  return (
    (await readState()).interviews.find(
      (x) => x.portalToken === token || x.offer?.token === token,
    ) || null
  );
}

export async function getByOfferToken(token: string) {
  if (!token) return null;
  return (
    (await readState()).interviews.find((x) => x.offer?.token === token) || null
  );
}

export async function updateInterview(
  id: string,
  patch: Partial<InterviewRecord>,
) {
  const updated = await mutateState((data) => {
    const index = data.interviews.findIndex((x) => x.id === id);
    if (index < 0) return null;
    data.interviews[index] = { ...data.interviews[index], ...patch, id };
    return structuredClone(data.interviews[index]);
  });
  if (updated) {
    try {
      await syncApplicantToSpine(updated);
    } catch (e) {
      console.error("[store] spine sync after updateInterview", e);
    }
  }
  return updated;
}

export async function listInterviews(limit = 200) {
  return (await readState()).interviews.slice(0, limit);
}

export async function listApplications(limit = 200) {
  return (await readState()).interviews
    .filter((x) => x.kind === "screening" || !x.parentId)
    .slice(0, limit);
}
