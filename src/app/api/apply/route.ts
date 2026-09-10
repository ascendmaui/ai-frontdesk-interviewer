import { NextResponse } from "next/server";
import { getRole } from "@/lib/roles";
import { createInterview, newId, newPortalToken } from "@/lib/store";
import type { CandidateApplication, InterviewRecord } from "@/lib/types";

export const runtime = "nodejs";

const rate = new Map<string, { n: number; t: number }>();

function rateLimit(key: string, max = 8, windowMs = 3_600_000): boolean {
  const now = Date.now();
  const cur = rate.get(key);
  if (!cur || now - cur.t > windowMs) {
    rate.set(key, { n: 1, t: now });
    return true;
  }
  if (cur.n >= max) return false;
  cur.n += 1;
  return true;
}

function validEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Honeypot
  if (body.company_website) {
    return NextResponse.json({ id: "ok", interviewPath: "/" });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`ip:${ip}`) || !rateLimit(`em:${String(body.email || "")}`)) {
    return NextResponse.json(
      { error: "Too many applications. Try again later." },
      { status: 429 },
    );
  }

  const roleSlug = String(body.roleSlug || "");
  const role = getRole(roleSlug);
  if (!role) {
    return NextResponse.json({ error: "Unknown role" }, { status: 400 });
  }

  const candidate: CandidateApplication = {
    firstName: String(body.firstName || "")
      .trim()
      .slice(0, 60),
    lastName: String(body.lastName || "")
      .trim()
      .slice(0, 60),
    email: String(body.email || "")
      .trim()
      .toLowerCase()
      .slice(0, 120),
    phone: String(body.phone || "")
      .trim()
      .slice(0, 40),
    yearsInSales: String(body.yearsInSales || "").slice(0, 40),
    industryExperience: (["yes", "some", "no", ""].includes(
      String(body.industryExperience || ""),
    )
      ? String(body.industryExperience || "")
      : "") as CandidateApplication["industryExperience"],
    linkedin: String(body.linkedin || "")
      .trim()
      .slice(0, 200),
    consent: Boolean(body.consent),
    utmSource: String(body.utmSource || "").slice(0, 80),
    utmMedium: String(body.utmMedium || "").slice(0, 80),
    utmCampaign: String(body.utmCampaign || "").slice(0, 80),
    userAgent: String(body.userAgent || "").slice(0, 300),
  };

  if (!candidate.firstName || !candidate.lastName) {
    return NextResponse.json(
      { error: "First and last name are required" },
      { status: 400 },
    );
  }
  if (!validEmail(candidate.email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    );
  }
  if (candidate.phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { error: "Valid phone number is required" },
      { status: 400 },
    );
  }
  if (!candidate.consent) {
    return NextResponse.json(
      { error: "Consent is required to continue" },
      { status: 400 },
    );
  }

  const id = newId();
  const record: InterviewRecord = {
    id,
    rootId: id,
    kind: "screening",
    department: "sales_closer",
    roleSlug,
    status: "applied",
    pipelineStatus: "applied",
    portalToken: newPortalToken(),
    candidate,
    createdAt: new Date().toISOString(),
    transcript: [],
    training: { modulesRead: [], quizAttempts: 0 },
  };

  await createInterview(record);

  return NextResponse.json({
    id: record.id,
    roleSlug: record.roleSlug,
    portalToken: record.portalToken,
    interviewPath: `/interview/${record.id}?t=${record.portalToken}`,
    portalPath: `/portal/${record.id}?t=${record.portalToken}`,
  });
}
