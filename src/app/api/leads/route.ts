import { NextResponse } from "next/server";
import { adminAuthError } from "@/lib/admin-auth";
import { createLead, listLeads, updateLeadStatus } from "@/lib/platform-store";
import { postSlackChannel } from "@/lib/slack-config";

export const runtime = "nodejs";

/** Public marketing lead intake (no admin auth). */
export async function POST(req: Request) {
  let body: {
    industry?: string;
    phone?: string;
    email?: string;
    contactName?: string;
    businessName?: string;
    state?: string;
    source?: string;
    utmSource?: string;
    utmCampaign?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  const industry = String(body.industry || "").trim().toLowerCase();
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "Valid phone number required" },
      { status: 400 },
    );
  }
  if (!industry) {
    return NextResponse.json({ error: "industry is required" }, { status: 400 });
  }

  try {
    const lead = await createLead({
      industry,
      phone,
      email: body.email,
      contactName: body.contactName,
      businessName: body.businessName,
      state: body.state,
      source: body.source || "marketing_form",
      utmSource: body.utmSource,
      utmCampaign: body.utmCampaign,
      notes: body.notes,
    });

    // Notify Slack #leads-inbound (best-effort)
    const assignLine = lead.assignedCloserName
      ? `→ *${lead.assignedCloserName}*`
      : "→ *unassigned* (no closer in that area code)";
    void postSlackChannel(
      "leads-inbound",
      [
        `📥 *New marketing lead*`,
        `*${lead.businessName || lead.contactName || "Unknown"}* · ${lead.industry}`,
        `Phone: ${lead.phone} · NPA \`${lead.areaCode || "?"}\``,
        assignLine,
        lead.email ? `Email: ${lead.email}` : "",
        `ID: \`${lead.id}\``,
      ]
        .filter(Boolean)
        .join("\n"),
    ).catch(() => null);

    return NextResponse.json({
      ok: true,
      lead: {
        id: lead.id,
        status: lead.status,
        areaCode: lead.areaCode,
        roleSlug: lead.roleSlug,
        assignedCloserName: lead.assignedCloserName,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create lead failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/** Admin: list leads */
export async function GET(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;
  const leads = await listLeads(300);
  return NextResponse.json({ leads });
}

/** Admin: update lead status / reassign */
export async function PATCH(req: Request) {
  const err = adminAuthError(req);
  if (err) return err;
  let body: {
    id?: string;
    status?: string;
    assignedCloserId?: string;
    assignedCloserName?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const updated = await updateLeadStatus(body.id, {
    status: body.status as
      | "new"
      | "routed"
      | "working"
      | "won"
      | "lost"
      | "unassigned"
      | undefined,
    assignedCloserId: body.assignedCloserId,
    assignedCloserName: body.assignedCloserName,
    notes: body.notes,
  });
  if (!updated) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ lead: updated });
}
