# Architecture — AI Front Desk Sales Closer Hiring OS

## Pipeline

```
Apply → Screening (Jordan + multitask) → HM (Morgan) → Offer accept
  → Onboarding (Riley) → Setup checklist → Train (quiz + practice pitch)
  → production_ready
```

## Stack

- Next.js App Router (UI + API)
- Grok Voice (realtime WebSocket) + Grok chat scorecards
- JSON file store (`data/interviews.json`) for local/single-node
- Slack webhook + Resend/SMTP email
- Hearthline design system (Instrument fonts, cream/terracotta)

## Key modules

| Module | Role |
|--------|------|
| `src/lib/roles.ts` | 10 vertical seats + Jordan prompts |
| `src/lib/agents.ts` | Morgan, Riley, Coach |
| `src/lib/multitask-quiz.ts` | Yes/No load test |
| `src/lib/pipeline.ts` | State machine helpers |
| `src/lib/store.ts` | Persistence |
| `src/app/api/complete` | Stage transitions |

## Multi-department later

`department: "sales_closer"` on every record. Future: `marketing`, `back_office` with new role packs and stage templates.

## Production note

For multi-instance Vercel, migrate `store.ts` to Postgres (Prisma). Schema shape matches `InterviewRecord` + related entities.
