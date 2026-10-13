# Technical Crawl Signals

Detail and evidence for the technical-audit line items in `SKILL.md` that
benefit from the full explanation rather than a checklist bullet.

## AI Crawler Access

Check robots.txt for AI-crawler-specific rules, and don't conflate two
different claims when reporting on them — **training access and
search/citation access are controlled by different bot names**, and
blocking one doesn't block the other:

| Company | Training crawler | Search/citation crawler |
|---|---|---|
| OpenAI | `GPTBot` | `OAI-SearchBot`, `ChatGPT-User` |
| Anthropic | `ClaudeBot` | `Claude-SearchBot`, `Claude-User` |
| Perplexity | — | `PerplexityBot`, `Perplexity-User` |
| Google | `Google-Extended` | `Googlebot` (standard), `Google-Agent`, `Google-GeminiNotebook` |
| Apple | `Applebot-Extended` | `Applebot` |
| Others | `Bytespider` (ByteDance), `CCBot` (Common Crawl), `cohere-ai` | — |

A client can allow `Googlebot`/`OAI-SearchBot`/`Claude-SearchBot` (so their
content can be *cited*) while blocking `GPTBot`/`ClaudeBot`/`Google-Extended`
(opting out of *training*) — that's a deliberate, common, and reasonable
combination; don't flag it as a misconfiguration. **User-triggered fetchers**
(`Google-Agent`, `ChatGPT-User` when a person asks ChatGPT to fetch a page,
`Google-GeminiNotebook`) generally ignore robots.txt entirely — blocking
them in robots.txt doesn't actually stop that traffic. See the `ai-seo`
skill for the broader AI-visibility strategy this feeds into.

## Googlebot's Practical Crawl Limits

Googlebot only processes the first ~2MB of a page's HTML (uncompressed) and
the first ~64MB of a PDF — content and JSON-LD schema beyond that point is
invisible to it, which matters on a page with a huge inline script or a
giant embedded data blob before the real content. Crawl rate itself
auto-adjusts based on server response health; there's no manual crawl-rate
control anymore (the old Search Console crawl-rate setting is gone).

## Lazy-Load Image Detection (don't false-flag WordPress optimization plugins)

Several popular WordPress image-optimization plugins deliberately strip the
native `loading="lazy"` attribute and substitute their own JS-driven
lazy-load — which looks identical to "no lazy loading at all" if you only
grep for the native attribute. Check in this order before concluding an
image isn't lazy-loaded:

1. `loading="lazy"` present → native, done.
2. `data-perfmatters-src` / `data-perfmatters-srcset` attributes, or a
   `perfmatters-lazy` / `perfmatters-lazy-loaded` class → Perfmatters plugin.
3. `data-ewww-src` / `data-eio` attributes, or a `lazyload-eio` /
   `lazyloaded-eio` class → EWWW Image Optimizer.
4. `data-src` / `data-lazy-src` / `data-original` / `data-srcset`
   attributes, or a `lazyload` / `lazyloaded` / `lazy` / `lazy-loaded` class
   → some other JS-generic lazy-loader (lazysizes and similar).
5. None of the above → genuinely not lazy-loaded, flag it for real.

`tools/audit-tools/page-fields.js` runs this detection automatically per
image and reports the method it found (`native` / `perfmatters` / `ewww` /
`js-generic` / `none`).

## Back-Button Hijacking

`history.pushState`/`replaceState` abuse that breaks the browser back button
(trapping a visitor on-page, or silently redirecting them somewhere else on
back-navigation) is a Google spam-policy violation — policy published
2026-04-13, enforced since 2026-06-15. Rare in practice, but worth a quick
manual check (land on the page, hit back) on any site built with heavy
client-side routing. A confirmed case is a serious, cite-the-policy
finding, not a minor one — it's grounds for a manual action, not just a
ranking suppression.

## JS-Rendered Signals: Prefer Server HTML Over JS-Injected

Google may honor a canonical tag, noindex directive, or JSON-LD block that
only appears after JavaScript runs — but inconsistently. Treat JS-injection
of any of these three as a real risk factor on a JS-heavy site (SPA
frameworks especially), not just an inconvenience for whoever's auditing it.
JS-injected structured data on `Product`-type pages specifically gets
less-frequent, less-reliable crawling than server-rendered schema — worth
calling out by name if found on an e-commerce client.
