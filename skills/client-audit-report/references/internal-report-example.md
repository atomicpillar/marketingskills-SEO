# Internal Technical Report — Structure Reference

The internal report is for the agency, not the client. Full technical detail
is correct here; the translation into plain language happens separately in
the client-facing Growth Snapshot (see `SKILL.md` Step 5).

## Section order

1. **Cover / Executive Summary** — the sharpest 1-2 sentence hook, backed by
   real numbers, plus the top 2-3 findings and the recommended path.
2. **What's Already Working** — not optional. Skipping this makes the report
   read as a sales pitch instead of an audit. Credit real strengths: clean
   robots.txt/sitemap, unique titles, existing schema, decent copy, whatever
   is actually true.
3. **What's Costing Them** — each finding as its own block: issue, the
   exact evidence (a URL, a count, a quoted tag), and the fix. Technical
   language is fine here.
4. **Full SEO Findings table** — Issue / Impact / Evidence / Priority, every
   finding from Step 1's tool runs.
5. **Reputation vs. Website** — the GBP-vs-site comparison, or the
   claims-vs-proof version when GBP data isn't available yet.
6. **The Business Case** — translate findings to plain business
   consequences, still without inventing dollar figures.
7. **Recommended Path** — rebuild-first, SEO-second, with the reasoning.
8. **What We Couldn't Check This Pass** — state every gap plainly (no
   Search Console access, no CWV data, no screenshots, no GBP key) rather
   than presenting the report as more complete than it is.
9. **Next Step** — one clear CTA.

## Worked example: GTA Fine Interiors (first production run)

Findings pulled from a real audit, illustrating the level of specificity
expected — vague findings like "several broken links" or "could be faster"
are not acceptable; this level of detail is:

- "23 of 420 links checked return a 404, nearly all from the same stale
  WordPress `?p=####` shortlink pattern, appearing on the portfolio, both
  staging pages, about, contact, and most individual project pages."
- "Homepage has zero H1 tags; the one repeated heading ('TRANSFORM YOUR
  HOUSE INTO A DREAM HOME') appears 5 times as part of a slider."
- "'Award-winning' appears 7 times in the homepage copy. Zero testimonials,
  zero review mentions, zero star ratings, and no AggregateRating schema
  anywhere on the site."
- "Organization and BreadcrumbList schema are present and correctly
  formed — credit this; most small-business sites skip it entirely."
- "Homepage TTFB measured at ~1.14s via direct request timing — a partial
  signal only; full Core Web Vitals need `lighthouse-audit.js` or PageSpeed
  Insights directly."

Every finding traces to a specific tool run from Step 1. Build the same way:
run the tools, report exactly what they returned, and be explicit about
what wasn't captured.

## What changed after run 1, and why (read this before writing client pages)

Run 1 (GTA Fine Interiors) shipped the client-facing piece as a 2-slide deck
with stat cards. The client's exact feedback: "This can't be the result...
this is so stupid information... this deck is pathetic." The problem wasn't
the findings, it was the format — a slide canvas has room for a number and
one sentence, not an explanation. Two changes followed, both now baked into
`SKILL.md`: no more slide deck, one long document with client pages at the
end; and every client-facing finding has to explain the actual
cause-and-effect mechanism, not just state the number.

## Worked example of the explanatory style: Corner Contracting (run 2)

The internal finding: homepage H1 is the single word "SOLUTION." — no
service name, no location. The client-facing version doesn't just say "fix
your heading" — it explains the mechanism, using the business's own real
services and city:

> Here's how it works: when someone types "deck builder Barrie" or
> "interlock contractor near me" into Google, Google reads the words on
> your website to decide whether to show you. It pays the closest attention
> to two things: your page's title, and the biggest heading at the top of
> your homepage. Right now, the biggest heading on your homepage doesn't
> say "deck builder," "interlock," "landscaping," or "Barrie." It currently
> reads, in full: "SOLUTION." Google has no way to connect that word to a
> search for the work you actually do.

Same pattern for every other client-facing finding in that run: missing
meta descriptions explained as "the line under your link in search results
that Google is currently writing for you at random instead of you writing
it," missing trust signals (licensing, insurance, reviews) explained as
"often the single biggest thing that turns a visitor into a phone call."
Use real service words and the real city/region every time — generic advice
reads as generic advice; specific mechanism plus their own words reads as
an audit someone actually did.
