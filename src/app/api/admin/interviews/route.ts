import { NextResponse } from "next/server";
import { listApplications } from "@/lib/store";
import { adminAuthError } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const access = adminAuthError(req); if (access) return access;

  const interviews = await listApplications(200);
  return NextResponse.json({ interviews });
}
