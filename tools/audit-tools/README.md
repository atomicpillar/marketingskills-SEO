# Audit Tools

Local, open-source browser/crawl tooling for `client-audit-report`, `seo-audit`,
and `local-seo`. These are **not** like `tools/clis/` — they don't call a hosted
API with a key, they drive a real headless browser. That means one `npm install`
before first use, and no signup/API key required (unlike `google-places.js` in
`tools/clis/`, which does need a key and stays zero-dependency).

Every tool here is a real, actively-maintained open-source project — nothing
custom-built for scraping Google or any other platform's private data. They
answer things a plain `fetch`/`curl`/Search Console can't:

| Tool | Script | What it fixes |
|------|--------|----------------|
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) (Google, official) | `lighthouse-audit.js` | Real Core Web Vitals (LCP, CLS, TBT) and Performance/SEO/Accessibility/Best-Practices scores — no PageSpeed Insights API key needed |
| [Playwright](https://github.com/microsoft/playwright) (Microsoft, official) | `schema-check.js` | Renders the page so JS-injected JSON-LD schema (Yoast, RankMath, AIOSEO) is actually visible — `web_fetch`/`curl` strip `<script>` tags |
| [Playwright](https://github.com/microsoft/playwright) | `screenshot.js` | Desktop + mobile full-page screenshots — the visual evidence for "your site doesn't reflect your reputation" findings |
| [Linkinator](https://github.com/JustinBeckwith/linkinator) (Google) | `broken-links.js` | Site-wide broken internal/external link crawl |

## Setup

```bash
cd tools/audit-tools
npm install
```

This session's environment already has Chromium pre-installed for Playwright
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`), so `npm install` should skip
the browser download. On a machine without that, Playwright downloads its own
Chromium automatically — no separate Chrome install required.

## Usage

All scripts output JSON to stdout, same convention as `tools/clis/`.

```bash
node schema-check.js --url https://example.com
node lighthouse-audit.js --url https://example.com [--mobile]
node broken-links.js --url https://example.com [--concurrency 25]
node screenshot.js --url https://example.com [--out ./screenshots]
```

Run each against the client's site and the tool's own site quality speaks for
itself in the report — you don't need to editorialize a real LCP number or a
missing schema block.

## Notes

- `lighthouse-audit.js` and `screenshot.js` launch a real browser — expect
  each to take 10-30s per URL depending on the site.
- `schema-check.js` output feeds directly into `seo-audit`'s "Schema Markup
  Detection Limitation" section — it's the tool that section tells you to go
  find.
- None of these hit Google Maps, Google Search results, or any platform
  whose ToS forbids scraping. For Google Business Profile data, use
  `tools/clis/google-places.js` (the official Places API) instead — see
  `skills/local-seo/`.
