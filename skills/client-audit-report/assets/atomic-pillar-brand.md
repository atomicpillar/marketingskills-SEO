# Atomic Pillar Agency — Brand Reference

Used by `client-audit-report` to build the client-facing deck. Internal
technical report doesn't need this — plain and functional is correct there.

- **Full name: "Atomic Pillar Agency."** Not just "Atomic Pillar" — always use the full name somewhere identifying (masthead, footer, prepared-by line), even if a short wordmark lockup only fits "ATOMIC PILLAR" visually.
- **Logo**: `atomic-pillar-logo.png` (this folder) — two overlapping "P" marks, gold over black, on white/transparent. Use at small sizes (36-56px) next to the wordmark, never stretched.
- **Wordmark lockup**: two lines next to the logo mark — "ATOMIC PILLAR" (bold caps, letter-spaced) with "AGENCY" beneath it (smaller, muted, letter-spaced). Match the reference logo file exactly; don't drop the "AGENCY" line.
- **Website**: atomicpillaragency.com
- **Standard "prepared by" contact**: Amanda Alphonso, Atomic Pillar Agency, (416) 845-6143, amanda@atomicpillar.com. Use this as the default contact block (Prepared for: client name/company/address — Prepared by: the line above — Date) unless the user gives a different name for a given report.
- **Positioning**: Toronto AI-first agency. Custom-built systems, not templates. Websites are framed as "autonomous lead machines" — AI chat, lead capture, booking, SEO-ready architecture — not just static brochures.
- **Services sold together**: a one-time website build/rebuild, PLUS an ongoing monthly SEO retainer. SEO is never a one-time deliverable — rankings need continuous work (content, citations, GBP activity, reporting), so every report's closing CTA should reflect a retainer for the SEO side, even if the website build itself is a one-time project. Do not use "no retainers" language for SEO work.
- **Tagline to reuse in a report's closing CTA**: something like "One-time website build, plus an ongoing SEO retainer — because rankings take real, continuous work to earn and keep." Adapt the wording, keep the substance: build once, retain for SEO.

## Colors

**Default: white/cream, not dark ink panels.** The first version of this
report used a dark ink panel for the client-facing pages and a client called
it "cartoonish." White background with black data/table accents and gold as
the single sparing accent is the correct default for anything client-facing.
Reserve the dark ink tone for small internal accents (a CTA band, a divider
banner) — never as a full-page background for client-facing content.

| Token | Hex | Use |
|---|---|---|
| Paper (white) | `#FFFFFF` | Default page background, including client-facing pages |
| Cream (warm off-white fill) | `#F6F0E4` / `#FBF8F2` | Card and table-row fills, stat tiles |
| Ink (near-black) | `#17150F` | Primary text; table header bars; small CTA bands/dividers only |
| Gold accent | `#B8823F` | The one accent — eyebrows, key phrases, left-border callouts, CTA highlights. Spend it sparingly. |
| Gold deep | `#8A6226` | Headline highlight spans, eyebrow text (needs to read on white) |
| Muted ink text | `#57503F` | Body copy |

One accent color (gold), used sparingly. Keep semantic colors (green/amber/red
for good/warn/bad findings) visually distinct from the gold accent.

## Type

- Display: **Sora** (Google Fonts) — geometric, modern. **Weight 600-700, not 800; keep headline sizes restrained (around 1.5-1.75rem for a client-page H1, not 2rem+).** A big, heavy, multi-color headline read as "childish" and "too AI" to a real client — Sora at large weights/sizes tips into a rounded, friendly-app look that undercuts a high-end, professional read. Smaller, more confident, more restrained is the correct default.
- Body: **Manrope** (Google Fonts) — clean, readable at small sizes.
- Never Inter, never Space Grotesk — both read as generic "AI tool" defaults.
- **Don't color individual words mid-headline** (a gold span on one word inside a sentence) — it reads as a marketing-blog trick, not a professional document. Keep gold for eyebrows, labels, numbers, and UI chrome; let headline text be one consistent color.

## Writing rules for anything client-facing

These came directly from client feedback on the first draft of this report
and apply to every future one:

1. **Don't overuse em dashes as a crutch.** Reaching for one in nearly every
   sentence is a classic AI tell. A single em dash for a genuine aside in a
   headline or key line is fine (this agency's own reference materials use
   them); a period, comma, or a new sentence is usually still the better
   default.
2. **No jargon.** A business owner does not know what an H1 tag, schema
   markup, TTFB, or Core Web Vitals are, and doesn't need to. Translate every
   technical finding into what it means for a customer or a visitor — see
   the translation table in `SKILL.md`.
3. **No invented numbers.** Business-impact language stays qualitative
   ("visitors leaving before they call") unless the client has shared real
   traffic/revenue figures — never invent a dollar estimate.
4. **Design like a real agency deck, not a generic AI template.** Avoid the
   cliché AI look entirely: no warm-cream-plus-serif-plus-terracotta, no
   Inter/Space Grotesk, no centered-everything, no emoji section markers, no
   oversized playful headlines with mid-sentence color changes (see Type
   above). Use the palette and type above, real photography/screenshots
   where available, and bold, confident layout choices that still read as
   restrained and high-end, not loud.
5. **Pointers and short, well-defined sections over dense paragraphs.**
   A business owner should be able to scan the page, not read an essay. Keep
   the cause-and-effect explanation from the translation table in `SKILL.md`
   (don't lose the substance that made run 2's report land), but format it
   as short bulleted findings with a bold lead-in phrase, or 2-3 sentence
   blocks under a clear subheading — not a wall of flowing prose. One idea
   per bullet or block.
6. **Name the urgency and the payoff, both grounded in real evidence.**
   Every report should include: (a) why waiting costs them specifically —
   named competitors already running ads or ranking on the exact searches
   they're missing, a reputation asset that needs active use, seasonal
   demand, whatever is actually true for this business — and (b) a short,
   concrete "what this gets you" outcomes section (more calls, a site that
   matches the reputation, a stronger competitive position). Urgency must
   come from real, cited findings already in the report — never manufactured
   scarcity or a countdown-timer trick.

## If the user hands you a reference document

If the user uploads a prior report (their own or a colleague's) as a style
reference, treat its structure and tone as the template to match, not just
inspiration — scorecards with letter grades, a table of the exact searches
tested against real competitor data, a 3-factor ranking framework
(Relevance/Proximity/Prominence), and a screenshots appendix have all proven
out in practice. Reuse real evidence they hand you (e.g. their own captured
Google search screenshots) directly in the appendix — extract images from an
uploaded PDF with `pdfimages` (poppler-utils) rather than redoing the
research. This is different from scraping Google yourself: a person already
did that lookup and handed you the result.
