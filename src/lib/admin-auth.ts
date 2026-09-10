/** Shared admin bearer check for platform APIs. */

import { createHash, timingSafeEqual } from "node:crypto";

function matches(value: string, expected: string) {
  const a = createHash("sha256").update(value).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function adminAuthed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return Boolean(token && matches(token, secret));
}

export function adminAuthError(req: Request): Response | null {
  if (!process.env.ADMIN_SECRET || process.env.ADMIN_SECRET.length < 32) {
    return new Response(
      JSON.stringify({ error: "ADMIN_SECRET not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  if (!adminAuthed(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
