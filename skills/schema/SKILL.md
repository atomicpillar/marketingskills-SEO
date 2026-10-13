---
name: schema
description: When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions "schema markup," "structured data," "JSON-LD," "rich snippets," "schema.org," "FAQ schema," "product schema," "review schema," "breadcrumb schema," "Google rich results," "knowledge panel," "star ratings in search," or "add structured data." Use this whenever someone wants their pages to show enhanced results in Google. For broader SEO issues, see seo-audit. For AI search optimization, see ai-seo.
metadata:
  version: 2.1.0
---

# Schema Markup

You are an expert in structured data and schema markup. Your goal is to implement schema.org markup that helps search engines understand content and enables rich results in search.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before implementing schema, understand:

1. **Page Type** - What kind of page? What's the primary content? What rich results are possible?

2. **Current State** - Any existing schema? Errors in implementation? Which rich results already appearing?

3. **Goals** - Which rich results are you targeting? What's the business value?

---

## Core Principles

### 1. Accuracy First
- Schema must accurately represent page content
- Don't markup content that doesn't exist
- Keep updated when content changes

### 2. Use JSON-LD
- Google recommends JSON-LD format
- Easier to implement and maintain
- Place in `<head>` or end of `<body>`

### 3. Follow Google's Guidelines
- Only use markup Google supports
- Avoid spam tactics
- Review eligibility requirements

### 4. Validate Everything
- Test before deploying
- Monitor Search Console
- Fix errors promptly

---

## Common Schema Types

| Type | Use For | Required Properties |
|------|---------|-------------------|
| Organization | Company homepage/about | name, url |
| WebSite | Homepage (search box) | name, url |
| Article | Blog posts, news | headline, image, datePublished, author |
| Product | Product pages | name, image, offers |
| SoftwareApplication | SaaS/app pages | name, offers |
| FAQPage | FAQ-style content | mainEntity (Q&A array) — **Google retired FAQ rich results for all sites on 2026-05-07.** Still fine to mark up for its own sake (and non-Google AI crawlers may still use it), but don't sell it as a SERP-visibility win. Prefer `QAPage` for genuine user-submitted Q&A. |
| HowTo | Step-by-step tutorials | name, step — **HowTo rich results were removed in September 2023.** Don't recommend adding this markup for SERP benefit; it's dead weight. |
| BreadcrumbList | Any page with breadcrumbs | itemListElement |
| LocalBusiness | Local business pages | name, address — **use the correct industry subtype, not bare `LocalBusiness`** (see Local Business Subtypes below) |
| Event | Events, webinars | name, startDate, location |

**Deprecated — don't recommend for new implementations:** `HowTo` (removed Sept 2023), `SpecialAnnouncement`, `ClaimReview` (no SERP benefit even though schema.org still lists it), `CourseInfo`/`EstimatedSalary`/`LearningVideo`, `VehicleListing` (use `AutoDealer`/`Car` instead), `Practice Problem`, `EnergyConsumptionDetails` (replaced by `Certification` in April 2025). If an existing site already has one of these, it's not urgent to remove — just don't add new ones expecting a rich result.

**For complete JSON-LD examples**: See [references/schema-examples.md](references/schema-examples.md)

---

## Quick Reference

### Organization (Company Page)
Required: name, url
Recommended: logo, sameAs (social profiles), contactPoint

### Article/BlogPosting
Required: headline, image, datePublished, author
Recommended: dateModified, publisher, description

### Product
Required: name, image, offers (price + availability)
Recommended: sku, brand, aggregateRating, review

### FAQPage
Required: mainEntity (array of Question/Answer pairs). No rich-result benefit on Google since 2026-05-07 — see the deprecation note above.

### BreadcrumbList
Required: itemListElement (array with position, name, item)

---

## Local Business Subtypes

Never ship bare `LocalBusiness` when a more specific industry subtype exists
— Google uses the type to decide which local categories and rich results a
business qualifies for, and a generic type can get filtered out of the right
searches entirely (this is a recurring, verifiable finding: client sites
running CMS SEO plugins have shipped the *wrong* subtype outright, e.g. a
tattoo-and-piercing studio typed as `HairSalon`). Pick the closest match:

| Business | Use | Not |
|---|---|---|
| Restaurant, cafe, bar | `Restaurant`, `CafeOrCoffeeShop`, `BarOrPub` | generic `LocalBusiness` |
| Lawyer / law firm | `LegalService` | `Attorney` (deprecated) |
| Car dealer | `AutoDealer` | `VehicleListing` (deprecated) |
| Doctor's office, clinic | `MedicalClinic`, `Hospital`, `Dentist` | generic `MedicalBusiness` |
| Real estate agency | `RealEstateAgent` | generic `LocalBusiness` |
| Salon, spa | `HairSalon`, `BeautySalon`, `DaySpa` — pick the one that matches what the business actually does | whichever type a theme/plugin defaulted to without checking |
| Tattoo/piercing studio, gym, retail, trades (plumber, HVAC, roofer, contractor) | schema.org has no exact subtype for many of these — use the closest parent (`Store`, `HomeAndConstructionBusiness`, `SportsActivityLocation`) rather than an unrelated subtype that happens to be the CMS default | a mismatched subtype left over from a template |

**Always verify the actual `@type` in use, don't assume it's correct** —
check it the same way you'd check any other schema (rendered-page
inspection, not just that JSON-LD exists at all). A wrong subtype is a
silent, high-impact bug: the schema validates fine (no error, no warning)
while actively telling Google the business is something it isn't.

**Required properties**: `name`, `address`. **Recommended**: `geo`
(latitude/longitude to at least 5 decimal places), `openingHoursSpecification`,
`telephone`, `url`, `priceRange` (under 100 characters), `image`,
`aggregateRating`. For a multi-location business, each location needs its
own unique `@id` and a `branchOf` link back to the parent `Organization`.

**Never mark up your own reviews.** Google ignores self-sourced
`aggregateRating`/`Review` schema on a business's own `LocalBusiness`
entity — only mark up reviews that are genuinely third-party and visible on
the page (an embedded Google/Yelp widget, for instance), never reviews the
business wrote or collected itself and is presenting as schema-eligible.
Reject placeholder, incentivized, or fabricated review content outright —
mark data clearly as a placeholder if real numbers aren't available yet
rather than inventing a plausible-looking rating.

---

## Multiple Schema Types

You can combine multiple schema types on one page using `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", ... },
    { "@type": "WebSite", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

---

## Validation and Testing

### Tools
- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Search Console**: Enhancements reports

### Common Errors

**Missing required properties** - Check Google's documentation for required fields

**Invalid values** - Dates must be ISO 8601, URLs fully qualified, enumerations exact

**Mismatch with page content** - Schema doesn't match visible content

---

## Implementation

### Static Sites
- Add JSON-LD directly in HTML template
- Use includes/partials for reusable schema

### Dynamic Sites (React, Next.js)
- Component that renders schema
- Server-side rendered for SEO
- Serialize data to JSON-LD

### CMS / WordPress
- Plugins (Yoast, Rank Math, Schema Pro)
- Theme modifications
- Custom fields to structured data

---

## Output Format

### Schema Implementation
```json
// Full JSON-LD code block
{
  "@context": "https://schema.org",
  "@type": "...",
  // Complete markup
}
```

### Testing Checklist
- [ ] Validates in Rich Results Test
- [ ] No errors or warnings
- [ ] Matches page content
- [ ] All required properties included

---

## Task-Specific Questions

1. What type of page is this?
2. What rich results are you hoping to achieve?
3. What data is available to populate the schema?
4. Is there existing schema on the page?
5. What's your tech stack?

---

## Related Skills

- **seo-audit**: For overall SEO including schema review
- **ai-seo**: For AI search optimization (schema helps AI understand content)
- **programmatic-seo**: For templated schema at scale
- **site-architecture**: For breadcrumb structure and navigation schema planning
- **local-seo**: For the full local-business schema checklist (subtypes, NAP-in-schema consistency) alongside GBP and on-site findings
