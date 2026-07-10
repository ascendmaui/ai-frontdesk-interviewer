import { COMPANY } from "./company";
import { getRole } from "./roles";
import type { OfferRecord } from "./types";
import { newId } from "./store";

export function createOffer(roleSlug: string): OfferRecord {
  const role = getRole(roleSlug);
  const title = `Sales Closer offer — ${role?.title || roleSlug}`;
  const body =
    process.env.OFFER_TERMS_HTML ||
    defaultOfferBody(role?.title || "Sales Closer", role?.industry || "");

  const token = `off_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return {
    id: newId().replace("int_", "offer_"),
    token,
    title,
    body,
    roleSlug,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    status: "pending",
  };
}

function defaultOfferBody(roleTitle: string, industry: string): string {
  return `
<p>Congratulations — you've been selected to move forward as a <strong>${roleTitle}</strong>${industry ? ` (${industry})` : ""} at <strong>${COMPANY.product}</strong> / ${COMPANY.brand}.</p>
<h3>Role</h3>
<ul>
<li>Close AI Front Desk packages for your vertical</li>
<li>Own pipeline hygiene in CRM</li>
<li>Hit activity and close standards set by sales leadership</li>
</ul>
<h3>Compensation</h3>
<p>${process.env.OFFER_COMP_BLURB || "Competitive base + uncapped commission (OTE discussed with your hiring manager). Final numbers confirmed in writing by ops within 3 business days of accept."}</p>
<h3>Start</h3>
<p>${process.env.OFFER_START_BLURB || "Target start within 7–14 days of acceptance, subject to tool access."}</p>
<h3>At-will</h3>
<p>Employment or contractor status is at-will / as agreed in the formal agreement. This page is a contingent offer to begin onboarding and training — not a multi-year contract.</p>
<p>By accepting, you agree to complete onboarding, setup, and training before live dials.</p>
`.trim();
}
