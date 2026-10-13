# Marketing kit

Artwork and copy for **Hearthline AI Front Desk**. The product name, tagline, packages, prices, and industries are copied from this repo (`src/lib/company.ts`, `src/lib/sales-curriculum.ts`, `src/lib/roles.ts`). Colors and fonts are copied from `src/app/globals.css` and `src/app/layout.tsx`. The logo mark is the header circle in `src/components/Shell.tsx`.

Nothing here is a customer metric, rating, or testimonial. The store frames are layout templates, not screenshots of a shipped App Store or Mac App Store build.

## Index

| Path | What it is |
| --- | --- |
| `STYLE_GUIDE.md` | Names, logo, colors, type, voice, packages |
| `SOCIAL_COPY.md` | Bios, posts, banner alt text |
| `LANDING_COPY.md` | Hero, subhead, features, CTA, FAQ |
| `PRESS_BLURB.md` | Short, long, and boilerplate blurbs |
| `logo/logo.svg` | Mark + wordmark |
| `logo/logo.png` | Same lockup, transparent PNG |
| `logo/mark.svg` | Mark only |
| `logo/mark.png` | Mark only, transparent PNG |
| `logo/logo.html`, `logo/mark.html` | HTML sources used to rasterize the PNGs |
| `banners/x-header-1500x500.svg` | X header source, 1500×500 |
| `banners/x-header-1500x500.html` | X header source |
| `banners/x-header-1500x500.png` | X header export |
| `banners/linkedin-1584x396.svg` | LinkedIn cover source, 1584×396 |
| `banners/linkedin-1584x396.html` | LinkedIn cover source |
| `banners/linkedin-1584x396.png` | LinkedIn cover export |
| `banners/og-1200x630.svg` | Open Graph source, 1200×630 |
| `banners/og-1200x630.html` | Open Graph source |
| `banners/og-1200x630.png` | Open Graph export |
| `store/iphone-1290x2796.svg` | iPhone frame, 1290×2796 |
| `store/iphone-1290x2796.html` | iPhone frame (drawn at 430×932, exported at 3×) |
| `store/iphone-1290x2796.png` | iPhone frame export |
| `store/mac-2880x1800.svg` | Mac frame, 2880×1800 |
| `store/mac-2880x1800.html` | Mac frame (drawn at 1440×900, exported at 2×) |
| `store/mac-2880x1800.png` | Mac frame export |
| `fonts/` | Latin Instrument Sans and Instrument Serif subsets, plus SIL OFL |
| `assets/base.css` | Shared tokens for the HTML sources |
| `render.mjs` | Rebuilds the PNGs from the HTML with Chrome |

## Rebuild the PNGs

From the repo root, with Google Chrome available:

```bash
node marketing-kit/render.mjs
```

PNG exports are rasterized from the HTML so type uses Instrument Sans and Instrument Serif. SVG files are the vector sources and reference the same font files.
