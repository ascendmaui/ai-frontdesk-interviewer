import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function CloserPacketPage() {
  return (
    <Shell bare>
      <div className="animate-rise space-y-6">
        <div>
          <p className="hl-eyebrow">Closer onboarding packet</p>
          <h1 className="hl-serif mt-1 text-3xl text-[var(--ink)]">
            Standards before you receive live leads
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            This page is a training and acknowledgement summary, not a substitute
            for the formal signed compensation, worker-classification, tax, or
            confidentiality agreements applicable to your engagement. The signed
            documents and applicable law control if anything conflicts.
          </p>
        </div>

        <PacketSection title="1 · Commission & collected revenue">
          <p>
            This is a commission-only closer program unless your signed agreement
            states otherwise. A verbal yes, signed proposal, unpaid invoice, failed
            card, or CRM status is not automatically commissionable revenue.
            Commission is earned and payable only as defined in the signed
            agreement after qualifying customer funds are collected and cleared.
          </p>
          <p>
            Refunds, cancellations, chargebacks, fraud, payment reversals, and
            credits can reduce or reverse unpaid or unvested commission when the
            signed agreement says they do. Exact percentages, timing, vesting,
            dispute handling, and any legally required compensation are governed by
            the formal agreement and applicable law.
          </p>
        </PacketSection>

        <PacketSection title="2 · Truthful selling & scope">
          <p>
            Never invent capabilities, integrations, discounts, customer results,
            guarantees, partnerships, scarcity, or deadlines. Use approved pricing
            and checkout only. If a customer asks for something outside confirmed
            scope, document it and get delivery approval before promising it.
          </p>
          <p>
            Do not give regulated professional advice on behalf of medical, legal,
            financial, or other clients. AI Front Desk can handle approved intake,
            routing, booking, and administrative workflows; qualified professionals
            retain their professional decisions.
          </p>
        </PacketSection>

        <PacketSection title="3 · Outreach, consent & opt-outs">
          <p>
            Use approved outreach systems and comply with applicable calling,
            messaging, email, platform, and privacy rules. Do not attempt to evade
            spam controls or conceal sender identity. Honor a clear request to stop
            immediately and record the opt-out in the approved system.
          </p>
        </PacketSection>

        <PacketSection title="4 · Confidentiality & data handling">
          <p>
            Customer, prospect, pricing, internal playbook, credential, and company
            information may be used only for authorized work. Handle the minimum
            data necessary. Do not copy confidential data into personal accounts or
            unapproved tools.
          </p>
          <p>
            Never put passwords, API keys, payment card data, bank credentials,
            Social Security numbers, tax IDs, identity documents, or equivalent
            secrets into this recruiting app, CRM free-text notes, Slack, ordinary
            email, or AI coach messages.
          </p>
        </PacketSection>

        <PacketSection title="5 · Secure payout & tax setup">
          <p>
            Banking and tax information must be completed only through the approved
            secure payout, tax, or e-sign provider supplied by operations. This app
            records only that the setup step was completed; it is not designed to
            collect or store the sensitive underlying identifiers.
          </p>
        </PacketSection>

        <PacketSection title="6 · CRM, handoff & customer care">
          <p>
            Log material deal facts and a real next step the same day. Do not mark a
            deal won before the approved payment system confirms the required
            payment status. Handoff must accurately state what was sold, pricing,
            billing cadence, stakeholders, promised actions, and confirmed scope.
          </p>
        </PacketSection>

        <PacketSection title="7 · Certification">
          <p>
            Live leads remain locked until required setup is complete, every
            required training module is read, the knowledge assessment is at least
            85%, and two voice roleplays score at least 8/10. Certification may be
            revoked for material policy, honesty, or customer-handling violations.
          </p>
        </PacketSection>

        <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-wash)] p-4 text-sm text-[var(--ink-soft)]">
          Formal e-sign, payout, and tax links appear in your candidate portal when
          configured by operations. Do not submit sensitive information anywhere
          else.
        </div>

        <Link href="/" className="text-sm font-semibold text-[var(--accent)]">
          ← Back to AI Front Desk
        </Link>
      </div>
    </Shell>
  );
}

function PacketSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="hl-card space-y-2 p-5">
      <h2 className="hl-serif text-xl text-[var(--ink)]">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--ink-muted)]">
        {children}
      </div>
    </section>
  );
}
