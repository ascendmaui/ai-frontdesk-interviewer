/**
 * Portal / training token gate.
 * When an application has a portalToken, the client MUST supply it.
 * Missing or wrong token → unauthorized.
 */

export function portalTokenAuthorized(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  const exp = (expected || "").trim();
  if (!exp) return false; // Unmigrated records must never grant anonymous access.
  const got = (provided || "").trim();
  return got.length > 0 && got === exp;
}

export function portalAuthError(
  provided: string | null | undefined,
  expected: string | null | undefined,
): { error: string; status: 401 } | null {
  if (portalTokenAuthorized(provided, expected)) return null;
  return { error: "Unauthorized", status: 401 };
}
