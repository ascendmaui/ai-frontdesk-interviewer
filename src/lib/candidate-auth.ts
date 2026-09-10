import { portalTokenAuthorized } from "./portal-auth";
import type { InterviewRecord } from "./types";

export function candidateAuthorized(
  request: Request,
  record: InterviewRecord,
  bodyToken?: unknown,
) {
  const query = new URL(request.url).searchParams.get("t");
  const header = request.headers.get("x-candidate-token");
  return portalTokenAuthorized(
    String(bodyToken || query || header || ""),
    record.portalToken,
  );
}

export function candidateAuthError(
  request: Request,
  record: InterviewRecord,
  bodyToken?: unknown,
) {
  return candidateAuthorized(request, record, bodyToken)
    ? null
    : Response.json({ error: "Unauthorized" }, { status: 401 });
}
