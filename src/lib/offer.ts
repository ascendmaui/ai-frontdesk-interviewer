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
  const comp =
    process.env.OFFER_COMMISSION_BLURB ||
    "Commission-only. Commission is earned and payable only as defined in the signed compensation agreement after qualifying customer funds are collected and cleared. No commission is earned merely because a prospect says yes, signs a proposal, or receives an unpaid invoice. Refunds, cancellations, chargebacks, fraud, credits, and payment reversals may reduce or reverse unpaid or unvested commission when the signed agreement provides for it. Exact percentage/split, timing, vesting, and dispute rules are stated in the formal agreement.";
  return `
<p>Congratulations — you've been selected to move forward as a <strong>${roleTitle}</strong>${industry ? ` (${industry})` : ""} with <strong>${COMPANY.product}</strong> / ${COMPANY.brand}.</p>
<h3>Role</h3>
<ul>
<li>Close approved AI Front Desk packages for your vertical</li>
<li>Maintain accurate pipeline, next-step, and customer handoff records</li>
<li>Use approved pricing, checkout, claims, outreach, and compliance workflows</li>
<li>Complete onboarding and certification before live leads unlock</li>
</ul>
<h3>Compensation</h3>
<p>${comp}</p>
<h3>Customer funds & reversals</h3>
<p>Do not treat a verbal commitment, CRM stage, failed payment, pending checkout, or unpaid invoice as collected revenue. Never change deal status or customer expectations to accelerate a commission event. Operations and the signed agreement determine the commissionable event.</p>
<h3>Start & certification</h3>
<p>${process.env.OFFER_START_BLURB || "Your target start is after required onboarding and certification. Live leads remain locked until required setup, academy modules, knowledge assessment, and roleplay standards are complete."}</p>
<h3>Formal agreement controls</h3>
<p>This page is a contingent offer and onboarding summary, not a substitute for the signed compensation, worker-classification, confidentiality, tax, or other agreement applicable to your engagement. The formal signed documents and applicable law control if anything conflicts with this page.</p>
<p>By accepting this contingent offer, you agree to proceed to onboarding and to review and execute the required formal documents before live lead access.</p>
`.trim();
}
