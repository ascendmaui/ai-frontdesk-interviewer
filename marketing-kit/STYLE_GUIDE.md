# AI Front Desk style guide

Visual and verbal rules for Hearthline’s **AI Front Desk**. Every color, font, and claim below is taken from this repository. Do not extend the system with new brand colors, typefaces, metrics, or testimonials.

## Names

| Use | Spelling | Source |
| --- | --- | --- |
| Company | Hearthline | `COMPANY.brand` in `src/lib/company.ts` |
| Product | AI Front Desk | `COMPANY.product` in `src/lib/company.ts` |
| Tagline | AI employees for local businesses | `COMPANY.tagline` in `src/lib/company.ts` |

The product name is two words: “Front Desk”. The in-app header sets the wordmark in Instrument Serif at 22px, `letter-spacing: 0.005em`, `line-height: 1`, next to the mark (`src/components/Shell.tsx`).

Default hiring mailbox in code, when `HIRING_FROM_EMAIL` is unset: `hiring@hearthline.ai`.

## Logo

The mark is the header circle, not a letterform. In the app it is 30×30:

- Fill: `radial-gradient(circle at 32% 30%, #E1906B, #BA5B33 70%)`
- Ring: `inset 0 0 0 1px rgba(255,255,255,.35)`
- Shadow: `0 4px 12px rgba(186,91,51,.35)`

Exported files scale that same gradient, ring, and shadow with the mark size.

| File | Use |
| --- | --- |
| `logo/logo.svg`, `logo/logo.png` | Mark plus “AI Front Desk” |
| `logo/mark.svg`, `logo/mark.png` | Mark alone (avatar, app icon) |

Place the lockup on `--bg` (`#faf5ec`), `--bg-card-solid` (`#fffdf7`), or white. The app does not ship a reversed (light-on-dark) wordmark. Clear space around the lockup should be at least the mark’s radius. Do not recolor the orb, add a monogram, or outline the wordmark.

## Color

Tokens from `:root` in `src/app/globals.css`. The viewport theme color in `src/app/layout.tsx` is `#FAF5EC`.

| Token | Value | Role in the app |
| --- | --- | --- |
| `--bg` | `#faf5ec` | Page background |
| `--bg-deep` | `#f1eadc` | Footer wash, deeper cream |
| `--bg-card` | `rgba(255, 255, 255, 0.62)` | Glass cards |
| `--bg-card-solid` | `#fffdf7` | Solid cards |
| `--ink` | `#231d15` | Primary text |
| `--ink-soft` | `#55493a` | Secondary text, labels |
| `--ink-muted` | `#6e6455` | Body copy |
| `--ink-faint` | `#93876f` | Meta, captions |
| `--accent` | `#ba5b33` | Terracotta: links, eyebrows, primary button |
| `--accent-hover` | `#9e4522` | Primary button hover |
| `--accent-soft` | `#e1906b` | Gradient highlight on the mark |
| `--accent-wash` | `rgba(186, 91, 51, 0.1)` | Selected / tinted chips |
| `--accent-border` | `rgba(186, 91, 51, 0.25)` | Accent chip borders |
| `--line` | `rgba(35, 29, 21, 0.1)` | Hairlines |
| `--line-strong` | `rgba(35, 29, 21, 0.18)` | Input and secondary borders |
| `--success` | `#2e6b54` | Positive status |
| `--danger` | `#9b2c2c` | Error status |
| `--on-accent` | `#fff8f0` | Label on the primary button (`.hl-btn-primary`) |

Selection color is `rgba(186, 91, 51, 0.22)`.

Page atmosphere, from `Shell.tsx`: a top wash `radial-gradient(closest-side at 50% 0%, rgba(225,144,107,.28), transparent 72%)` and a side orb `radial-gradient(closest-side, rgba(186,91,51,.12), transparent 70%)`.

Shadows: `--shadow` is `0 10px 30px rgba(90, 60, 30, 0.08)`; `--shadow-lg` is `0 22px 48px rgba(90, 60, 30, 0.13)`. Primary buttons add `0 12px 28px rgba(186, 91, 51, 0.28)`.

Radii: cards `22px`, pills `99px`.

## Type

Loaded in `src/app/layout.tsx` via `next/font/google`:

| Family | Weights / styles in the app | CSS variable | Fallback |
| --- | --- | --- | --- |
| Instrument Sans | 400, 500, 600, 700 | `--font-instrument-sans` | `"Helvetica Neue", system-ui, sans-serif` |
| Instrument Serif | 400 regular and italic | `--font-instrument-serif` | `Georgia, "Times New Roman", serif` |

Body size is `16.5px`. Headlines use `.hl-serif`: Instrument Serif, weight 400, `letter-spacing: -0.015em`, `line-height: 1.08`. The header wordmark overrides tracking to `0.005em` and line-height to `1`.

Eyebrows (`.hl-eyebrow`): size `0.78rem`, weight 600, `letter-spacing: 0.14em`, uppercase, color `--accent`.

Italic Instrument Serif in `--accent` is the app’s emphasis (see the homepage headline in `src/app/page.tsx`). Use it for one phrase, not whole paragraphs.

Latin-only woff2 subsets used to render this kit are in `fonts/`, under the SIL Open Font License (`fonts/OFL-InstrumentSans.txt`, `fonts/OFL-InstrumentSerif.txt`).

## Voice

Sell the published offer. The product knowledge and the sales curriculum both forbid invented features, discounts, customer results, integrations, and performance guarantees.

Safe to say, because the repo states it:

- Tagline: “AI employees for local businesses.”
- AI Receptionist pitch: “Every call answered, every lead captured.” This is positioning copy for that package, not a measured answer rate.
- AI Front Office pitch: “Your whole front desk, automated — phones, chat, follow-up, and reviews as one system.”
- AI Growth Partner pitch: “The full growth machine — front office plus outbound, ads, and content, managed for you.”

Do not say:

- Customer counts, ratings, uptime, conversion rates, or revenue results. None are published here.
- That a receptionist is replaced. Training copy says the AI can complement staff, with human handoff for conversations that should stay human.
- That the product gives medical, legal, or financial advice. Conduct rules forbid that. Dental training says the AI does not diagnose. Law-firm training says it must not give legal advice.
- That the customer voice agent is “Grok Voice.” Grok Voice is named for the hiring interviews in this repo, not in the customer package list.
- Launch dates, unnamed integrations, or discounts.

## Packages

Canonical list: `PRODUCT_KNOWLEDGE` in `src/lib/company.ts`. Prices match `src/lib/sales-curriculum.ts`.

| Package | Setup | Monthly | Included |
| --- | --- | --- | --- |
| AI Receptionist | $499 | $299 | 24/7 AI voice agent, missed-call text-back, lead qualification, appointment booking, call summaries |
| AI Front Office (flagship) | $999 | $799 | Everything in Receptionist, plus website chat agent, automated follow-up (text and email), CRM and pipeline, review engine, monthly optimization |
| AI Growth Partner | $2,500 | $1,900 | Everything in Front Office, plus AI outbound sales agent, AI search/ChatGPT ads, Meta ads, landing pages and creative, dedicated strategist |

Standalone services named in the same file: AI Voice Receptionist, AI Sales Agent, Support Assistant, Website Chat Agent, websites and landing pages, follow-up workflows, CRM setup, review engine, Meta ads, agent installs.

Industries named on closer seats in `src/lib/roles.ts`: HVAC and mechanical, plumbing, electrical, med spa and aesthetics, dental, collision and body shops, auto repair and service, local law (personal injury, family, immigration, general practice), roofing, landscaping, cleaning, remodeling, and pest control (listed on the home-services seat).

Demo requests use `/leads`. The form says the team matches the business to a closer by phone area code.
