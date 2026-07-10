# AI Front Desk · Sales Closer Hiring OS

End-to-end **mobile-first** hiring pipeline for industry sales closers:

**Apply → AI screen (+ multitask) → Hiring manager → Digital offer → Onboarding voice → Setup checklist → Training → Production ready**

Powered by **Grok Voice**. Designed like **Hearthline / Claude** (cream paper + terracotta).

## Quick start

```bash
cd ~/ai-frontdesk-interviewer
cp .env.local.example .env.local   # add XAI_API_KEY
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pipeline stages

| Stage | Agent | Outcome |
|-------|--------|---------|
| Screening | Jordan | Pass → HM · Maybe → waitlist · Fail → reject |
| Multitask | UI pop-ups | Scores into card; weak scores demote pass |
| Hiring manager | Morgan | Pass → **offer** · Maybe → admin review · Fail → reject |
| Offer | `/offer/[token]` | Accept → onboarding unlocked |
| Onboarding | Riley | Setup checklist |
| Setup | Portal tasks | Slack, CRM, dialer, handbook |
| Train | Modules + quiz + Coach pitch | Auto `production_ready` when all pass |
| Admin | `/admin` | Kanban + force actions |

## Candidate URLs

- `/` — role grid (10 verticals)
- `/apply/[slug]` — form
- `/interview/[id]` — live voice
- `/done/[id]` — score + next CTA
- `/offer/[token]` — accept/decline
- `/portal/[id]?t=…` — home base
- `/train/[id]?t=…` — academy

## Ops

- `/admin` — `ADMIN_SECRET`
- Slack webhook on every stage complete
- Email: Resend or Gmail SMTP

See `docs/ARCHITECTURE.md` and `docs/RUNBOOK.md`.

## Deploy (Vercel)

1. Push repo to GitHub  
2. Import project in Vercel  
3. Set env vars from `.env.local.example`  
4. Deploy  

**Note:** Local data is `data/interviews.json` (gitignored). For multi-instance production, migrate store to Postgres.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
