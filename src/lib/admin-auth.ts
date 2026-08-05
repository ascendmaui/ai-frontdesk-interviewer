/** Shared admin bearer check for platform APIs. */

export function adminAuthed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return Boolean(token && token === secret);
}

export function adminAuthError(req: Request): Response | null {
  if (!process.env.ADMIN_SECRET) {
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
