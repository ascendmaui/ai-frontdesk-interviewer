import { NextResponse } from "next/server";
import { listApplications } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const url = new URL(req.url);
  const q = url.searchParams.get("secret") || "";

  if (token !== secret && q !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const interviews = await listApplications(200);
  return NextResponse.json({ interviews });
}
