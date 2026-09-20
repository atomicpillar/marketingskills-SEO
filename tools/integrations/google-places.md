# Google Places API (New)

Official Google API for public business data — the legitimate way to pull Google Business Profile (GBP) signals (rating, review count, review text, photos, hours, category) for a **local SEO / GBP audit**, including on businesses you don't yet manage. This is not the same as the Business Profile Performance API (search views, calls, direction requests) — that one requires the business owner to grant access and is out of reach for a pre-engagement prospect audit.

## Capabilities

| Integration | Available | Notes |
|-------------|-----------|-------|
| API | ✓ | Text Search, Place Details, Place Photos |
| MCP | - | Not available |
| CLI | ✓ | [google-places.js](../clis/google-places.js) |
| SDK | - | Use the REST API directly |

## Authentication

- **Type**: API key
- **Get one**: Google Cloud Console → APIs & Services → enable **"Places API (New)"** → Credentials → Create API Key. Restrict the key to Places API (New) and, ideally, by IP/referrer.
- **Env var**: `GOOGLE_PLACES_API_KEY`
- **Cost**: Pay-as-you-go; a $200/month recurring credit on most GCP billing accounts covers a large number of one-off lookups for agency audit use. Check current pricing at [developers.google.com/maps/billing](https://developers.google.com/maps/billing) before running audits at volume.
- **Header pattern**: `X-Goog-Api-Key: {key}` + `X-Goog-FieldMask: {comma-separated fields}` (the New Places API requires an explicit field mask on every request — no mask, no response).

## Common Agent Operations

### Resolve a business to a place ID

```bash
node tools/clis/google-places.js search --query "Joe's Plumbing, Austin TX"
```

```
POST https://places.googleapis.com/v1/places:searchText
X-Goog-Api-Key: {key}
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.primaryType,places.businessStatus,places.googleMapsUri
Content-Type: application/json

{"textQuery": "Joe's Plumbing, Austin TX"}
```

### Pull full profile details (rating, reviews, hours, photos)

```bash
node tools/clis/google-places.js details --place-id <id from search>
```

```
GET https://places.googleapis.com/v1/places/{placeId}
X-Goog-Api-Key: {key}
X-Goog-FieldMask: id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,reviews,photos,regularOpeningHours,businessStatus,primaryType,types
```

Returns up to 5 of the most relevant reviews (full text, rating, author name, relative time) and a `photos[]` array of photo resource names.

### Get a usable photo URL

```bash
node tools/clis/google-places.js photo-url --name "places/{placeId}/photos/{photoId}" --max-width 1200
```

Builds the Photo media URL (`GET` it directly — it 302-redirects to the actual image). Useful for pulling a client's best GBP photos into a report as evidence of what they already have.

## Key Fields for a GBP Audit

- `rating` / `userRatingCount` — the headline reputation numbers
- `reviews[].text` — real review quotes (never fabricate these — always cite the API response)
- `photos.length` — total photo count (a stale/thin profile often has under 5)
- `regularOpeningHours` — completeness and accuracy check
- `websiteUri` — confirm it matches the actual site being audited (a mismatch is itself a finding)
- `primaryType` / `types` — category accuracy
- `businessStatus` — flag anything other than `OPERATIONAL`

## What This API Cannot Get You

- Search impressions, calls, direction requests, or any Business Profile Insights data — that requires the owner to grant Business Profile API access.
- Review response rate, post frequency/recency, Q&A activity — not exposed by any public API. Assess these by visually opening the public Maps listing (a one-off manual look, not automated scraping) and noting what you see.

**Never scrape Google Maps or Google Search result pages to fill these gaps** — it violates Google's Terms of Service and is unnecessary; the API covers the objective, citable data, and a manual look covers the rest.

## When to Use

- Building the Google Business Profile section of a `client-audit-report`
- Any `local-seo` audit
- Comparing a business's public reputation against what its website actually shows

## Relevant Skills

- local-seo
- client-audit-report
- seo-audit
- aso (same audit pattern, for app store listings instead of GBP)
