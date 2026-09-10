import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-frontdesk-interviewer",
    time: new Date().toISOString(),
  });
}
