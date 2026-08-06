"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/AdminNav";
import { AREA_CODE_REGIONS, INDUSTRY_TO_ROLE } from "@/lib/territories";

type Territory = {
  closerId: string;
  closerName: string;
  email: string;
  phone: string;
  roleSlug: string;
  areaCodes: string[];
  states: string[];
  active: boolean;
  createdAt: string;
};

type Lead = {
  id: string;
  source: string;
  industry: string;
  roleSlug: string;
  businessName?: string;
  contactName?: string;
  email?: string;
  phone: string;
  areaCode: string;
  state?: string;
  status: string;
  assignedCloserId?: string;
  assignedCloserName?: string;
  createdAt: string;
};

function authHeaders(secret: string) {
  return { Authorization: `Bearer ${secret}` };
}

export function CrmClient() {
  const [secret, setSecret] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"leads" | "territories">("leads");

  // New territory form
  const [form, setForm] = useState({
    closerName: "",
    email: "",
    phone: "",
    roleSlug: "hvac-closer",
    areaCodes: "",
    states: "",
  });

  useEffect(() => {
    const s = sessionStorage.getItem("af_admin_secret");
    if (s) setSecret(s);
  }, []);

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    try {
      sessionStorage.setItem("af_admin_secret", secret);
      const [lRes, tRes] = await Promise.all([
        fetch("/api/leads", { headers: authHeaders(secret) }),
        fetch("/api/territories", { headers: authHeaders(secret) }),
      ]);
      const lData = await lRes.json();
      const tData = await tRes.json();
      if (!lRes.ok) throw new Error(lData.error || "Leads unauthorized");
      if (!tRes.ok) throw new Error(tData.error || "Territories unauthorized");
      setLeads(lData.leads || []);
      setTerritories(tData.territories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  async function saveTerritory(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("/api/territories", {
        method: "POST",
        headers: {
          ...authHeaders(secret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          closerName: form.closerName,
          email: form.email,
          phone: form.phone,
          roleSlug: form.roleSlug,
          areaCodes: form.areaCodes
            .split(/[,\s]+/)
            .map((c) => c.trim())
            .filter(Boolean),
          states: form.states
            .split(/[,\s]+/)
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean),
          usePhoneAreaCode: true,
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(
        `✓ Territory saved for ${data.territory.closerName} · NPAs ${data.territory.areaCodes.join(", ")}`,
      );
      setForm({
        closerName: "",
        email: "",
        phone: "",
        roleSlug: form.roleSlug,
        areaCodes: "",
        states: "",
      });
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? `❌ ${e.message}` : "❌ Failed");
    }
  }

  async function setLeadStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          ...authHeaders(secret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeads((prev) => prev.map((l) => (l.id === id ? data.lead : l)));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="space-y-6 animate-rise">
      <AdminNav />

      <div>
        <p className="hl-eyebrow">Closer CRM</p>
        <h1 className="hl-serif text-[1.85rem] text-[var(--ink)]">
          Leads & territories
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Marketing leads route by phone area code (NPA) to closers who selected
          matching codes — ideally the same area code as the phone they dial from.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[180px]">
          <span className="text-[12px] font-medium text-[var(--ink-muted)]">
            Admin secret
          </span>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || !secret}
          className="min-h-11 rounded-[99px] bg-[var(--accent)] px-5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load CRM"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {msg && (
        <p className="rounded-xl border border-[var(--line)] bg-[var(--bg-deep)] px-3 py-2 text-sm">
          {msg}
        </p>
      )}

      <div className="flex gap-2">
        {(["leads", "territories"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === t
                ? "bg-[var(--ink)] text-white"
                : "border border-[var(--line)] text-[var(--ink-muted)]"
            }`}
          >
            {t} ({t === "leads" ? leads.length : territories.length})
          </button>
        ))}
      </div>

      {tab === "leads" && (
        <section className="space-y-3">
          {!leads.length && (
            <div className="hl-empty">
              <p className="font-semibold text-[var(--ink)]">No leads yet</p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Marketing intake is live at{" "}
                <a href="/leads" className="hl-link">
                  /leads
                </a>
                . Submit a demo request to populate this board.
              </p>
            </div>
          )}
          {leads.map((lead) => (
            <article key={lead.id} className="hl-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {lead.businessName || lead.contactName || "Lead"}{" "}
                    <span className="font-normal text-[var(--ink-faint)]">
                      · {lead.industry}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                    {lead.phone} · NPA{" "}
                    <code className="rounded bg-[var(--bg-deep)] px-1">
                      {lead.areaCode || "?"}
                    </code>
                    {lead.email ? ` · ${lead.email}` : ""}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                    {lead.assignedCloserName
                      ? `Assigned: ${lead.assignedCloserName}`
                      : "Unassigned"}{" "}
                    · {lead.roleSlug} · {lead.source}
                  </p>
                </div>
                <select
                  value={lead.status}
                  onChange={(e) => void setLeadStatus(lead.id, e.target.value)}
                  className="rounded-xl border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
                >
                  {["new", "routed", "working", "won", "lost", "unassigned"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </article>
          ))}
        </section>
      )}

      {tab === "territories" && (
        <section className="space-y-5">
          <form onSubmit={(e) => void saveTerritory(e)} className="hl-card space-y-3 p-4">
            <h2 className="font-semibold text-[var(--ink)]">
              Add / update closer territory
            </h2>
            <p className="text-[12px] text-[var(--ink-muted)]">
              Primary match is area code from their phone. Add extra NPAs they
              cover.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="Closer name"
                value={form.closerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, closerName: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              />
              <input
                placeholder="Phone (area code auto-detected)"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              />
              <select
                value={form.roleSlug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, roleSlug: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              >
                {Object.entries(INDUSTRY_TO_ROLE).map(([ind, slug]) => (
                  <option key={ind} value={slug}>
                    {ind} → {slug}
                  </option>
                ))}
                <option value="multi-vertical-closer">multi-vertical</option>
              </select>
              <input
                placeholder="Extra area codes (864, 803)"
                value={form.areaCodes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, areaCodes: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              />
              <input
                placeholder="States (SC, NC)"
                value={form.states}
                onChange={(e) =>
                  setForm((f) => ({ ...f, states: e.target.value }))
                }
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="min-h-11 rounded-[99px] bg-[var(--accent)] px-5 text-sm font-semibold text-white"
            >
              Save territory
            </button>
          </form>

          <div>
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Common NPAs (reference)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {AREA_CODE_REGIONS.map((r) => (
                <span
                  key={r.code}
                  className="rounded-full border border-[var(--line)] bg-white/60 px-2 py-0.5 text-[11px] text-[var(--ink-soft)]"
                  title={`${r.region}, ${r.state}`}
                >
                  {r.code} {r.state}
                </span>
              ))}
            </div>
          </div>

          {territories.map((t) => (
            <article key={t.closerId} className="hl-card p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--ink)]">
                    {t.closerName}{" "}
                    {!t.active && (
                      <span className="text-[var(--danger)]">· inactive</span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--ink-muted)]">
                    {t.email} · {t.phone || "no phone"}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--ink-faint)]">
                    {t.roleSlug}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[var(--ink)]">
                    NPAs: {t.areaCodes.join(", ") || "—"}
                  </p>
                  {t.states?.length > 0 && (
                    <p className="text-[12px] text-[var(--ink-faint)]">
                      States: {t.states.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
