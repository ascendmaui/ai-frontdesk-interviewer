import { NextResponse } from "next/server";
import { adminAuthError } from "@/lib/admin-auth";
import { listTerritories, upsertTerritory } from "@/lib/platform-store";
import { extractAreaCode } from "@/lib/territories";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;
  const territories = await listTerritories();
  return NextResponse.json({ territories });
}

export async function POST(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;

  let body: {
    closerId?: string;
    closerName?: string;
    email?: string;
    phone?: string;
    roleSlug?: string;
    areaCodes?: string[];
    states?: string[];
    active?: boolean;
    /** If true, derive primary area code from phone */
    usePhoneAreaCode?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const closerName = String(body.closerName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  if (!closerName || !email) {
    return NextResponse.json(
      { error: "closerName and email required" },
      { status: 400 },
    );
  }

  let areaCodes = Array.isArray(body.areaCodes)
    ? body.areaCodes.map((c) => String(c).replace(/\D/g, "").slice(0, 3)).filter(Boolean)
    : [];

  if (body.usePhoneAreaCode !== false && phone) {
    const fromPhone = extractAreaCode(phone);
    if (fromPhone && !areaCodes.includes(fromPhone)) {
      areaCodes = [fromPhone, ...areaCodes];
    }
  }

  if (!areaCodes.length) {
    return NextResponse.json(
      { error: "At least one area code required (or a phone with NPA)" },
      { status: 400 },
    );
  }

  const closerId =
    body.closerId ||
    `closer_${email.replace(/[^a-z0-9]/gi, "_").slice(0, 40)}`;

  try {
    const row = await upsertTerritory({
      closerId,
      closerName,
      email,
      phone,
      roleSlug: body.roleSlug || "multi-vertical-closer",
      areaCodes,
      states: Array.isArray(body.states) ? body.states : [],
      active: body.active !== false,
    });
    return NextResponse.json({ ok: true, territory: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
