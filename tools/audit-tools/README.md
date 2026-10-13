# Audit Tools

Local tooling for `client-audit-report`, `seo-audit`, and `local-seo`. Two
families live here, both answering things a plain `fetch`/`curl`/Search
Console can't — but with different setup requirements:

- **Browser-based** (need one `npm install`, drive a real headless browser):
  `lighthouse-audit.js`, `schema-check.js`, `screenshot.js`. Not like
  `tools/clis/` — no hosted API, no signup/API key.
- **Zero-dependency** (no `npm install`, Node 18+ built-ins only, same
  convention as `tools/clis/`): `page-fields.js`, `sitemap-check.js`,
  `metadata-check.js`, `broken-links.js` (its one dependency, linkinator, is
  covered by the shared `npm install` below, but it needs no browser).

Every tool here is either a real, actively-maintained open-source project or
a small in-house script — nothing custom-built for scraping Google or any
other platform's private data.

| Tool | Script | What it fixes | Needs `npm install`? |
|------|--------|----------------|---|
| — (in-house) | `page-fields.js` | Title, meta description/robots, OG/Twitter tags, canonical, hreflang, headings (flags suspiciously short/numeric ones), per-image lazy-load method (won't false-flag Perfmatters/EWWW-optimized WordPress sites), internal/external links, static JSON-LD schema (with `@graph` flattening), word count — one JSON call, the fast first pass | No |
| — (in-house) | `sitemap-check.js` | Discovers sitemaps via robots.txt + common fallback paths and validates each one (malformed XML, DOCTYPE/XXE risk, wrong root element, oversized text sitemaps) — a stale `Sitemap:` declaration shows up as a real finding, not a false "exists" | No |
| — (in-house) | `metadata-check.js` | Flags templated/bulk-generated title+description pairs (description echoes the title, tails into a stock CTA) and rolls that up into a site-wide risk level across several pages | No |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) (Google, official) | `lighthouse-audit.js` | Real Core Web Vitals (LCP, CLS, TBT) and Performance/SEO/Accessibility/Best-Practices scores — no PageSpeed Insights API key needed | Yes |
| [Playwright](https://github.com/microsoft/playwright) (Microsoft, official) | `schema-check.js` | Renders the page so JS-injected JSON-LD schema (Yoast, RankMath, AIOSEO) is actually visible — `web_fetch`/`curl`/`page-fields.js` all strip or miss `<script>`-injected content | Yes |
| [Playwright](https://github.com/microsoft/playwright) | `screenshot.js` | Desktop + mobile full-page screenshots — the visual evidence for "your site doesn't reflect your reputation" findings | Yes |
| [Linkinator](https://github.com/JustinBeckwith/linkinator) (Google) | `broken-links.js` | Site-wide broken internal/external link crawl | Yes |

## Setup

```bash
cd tools/audit-tools
npm install
```

Only needed for the browser-based tools (and `broken-links.js`'s linkinator
dependency) — `page-fields.js`, `sitemap-check.js`, and `metadata-check.js`
run immediately with no setup. This session's environment already has
Chromium pre-installed for Playwright (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`),
so `npm install` should skip the browser download. On a machine without
that, Playwright downloads its own Chromium automatically — no separate
Chrome install required.

## Usage

All scripts output JSON to stdout, same convention as `tools/clis/`.

```bash
node page-fields.js --url https://example.com        # no npm install needed
node sitemap-check.js --url https://example.com       # no npm install needed
node metadata-check.js --url https://example.com      # no npm install needed
node metadata-check.js --pages pages.json             # site-wide rollup across many pages
node schema-check.js --url https://example.com
node lighthouse-audit.js --url https://example.com [--mobile]
node broken-links.js --url https://example.com [--concurrency 25]
node screenshot.js --url https://example.com [--out ./screenshots]
```

Run each against the client's site and the tool's own site quality speaks for
itself in the report — you don't need to editorialize a real LCP number or a
missing schema block.

## Notes

- Start with `page-fields.js` and `sitemap-check.js` — they need no setup
  and cover most of what a technical audit checks by hand every time. Reach
  for the Playwright-based tools when you specifically need JS-rendered
  schema, real Core Web Vitals, or a screenshot.
- `lighthouse-audit.js` and `screenshot.js` launch a real browser — expect
  each to take 10-30s per URL depending on the site.
- `schema-check.js` output feeds directly into `seo-audit`'s "Schema Markup
  Detection Limitation" section — it's the tool that section tells you to go
  find. `page-fields.js` only sees schema present in the raw server HTML; if
  it reports zero schema, that's not conclusive — confirm with
  `schema-check.js` before reporting "no schema found" (the CMS plugin may
  be injecting it client-side).
- None of these hit Google Maps, Google Search results, or any platform
  whose ToS forbids scraping. For Google Business Profile data, use
  `tools/clis/google-places.js` (the official Places API) instead — see
  `skills/local-seo/`.
