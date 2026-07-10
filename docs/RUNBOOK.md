# Ops runbook

## Daily

1. Open `/admin` with `ADMIN_SECRET`
2. Review kanban columns
3. `hm_maybe` → Force HM, Send Offer, or Reject
4. Check Slack for scorecards

## Stuck candidates

| Situation | Action |
|-----------|--------|
| Passed HM, no offer | Admin → **Offer** |
| Accepted offer, no Riley | Admin → **Onboard** |
| Finished train, not ready | Admin → **Ready** |
| Bad hire | **Reject** |

## Env checklist (Vercel)

- `XAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (production URL)
- `ADMIN_SECRET`
- `SLACK_WEBHOOK_URL`
- `RESEND_API_KEY` + `HIRING_FROM_EMAIL` (or Gmail SMTP)
- `ONBOARDING_SLACK_INVITE_URL`, `ONBOARDING_HANDBOOK_URL`, `ONBOARDING_CRM_URL`
- `FINAL_INTERVIEW_CALENDAR_URL`
- Optional: `OFFER_COMP_BLURB`, `OFFER_START_BLURB`

## Health

`GET /api/health` → `{ ok, xai, slack, email }`
