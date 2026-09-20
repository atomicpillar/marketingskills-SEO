#!/usr/bin/env node
// Google Places API (New) — public business data only (name, address, rating,
// review count, review excerpts, photos, hours). Used for Google Business
// Profile / local SEO audits. This is the official API — never scrape Google
// Maps or Search result pages for this data (see tools/REGISTRY.md).

const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const BASE_URL = 'https://places.googleapis.com/v1'

if (!API_KEY) {
  console.error(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY environment variable required. Create one in a Google Cloud project with the "Places API (New)" enabled.' }))
  process.exit(1)
}

function parseArgs(args) {
  const result = { _: [] }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        result[key] = next
        i++
      } else {
        result[key] = true
      }
    } else {
      result._.push(arg)
    }
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
const [cmd] = args._

const DEFAULT_SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.primaryType',
  'places.businessStatus',
  'places.googleMapsUri',
].join(',')

const DEFAULT_DETAILS_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'reviews',
  'photos',
  'regularOpeningHours',
  'businessStatus',
  'primaryType',
  'types',
  'priceLevel',
].join(',')

async function callApi(method, path, { fieldMask, body } = {}) {
  const url = `${BASE_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': API_KEY,
  }
  if (fieldMask) headers['X-Goog-FieldMask'] = fieldMask

  if (args['dry-run']) {
    return { _dry_run: true, method, url, headers: { ...headers, 'X-Goog-Api-Key': '***' }, body }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try {
    const parsed = JSON.parse(text)
    if (!res.ok) return { status: res.status, error: parsed }
    return parsed
  } catch {
    return { status: res.status, body: text }
  }
}

function summarizeSearchResult(place) {
  return {
    placeId: place.id,
    name: place.displayName && place.displayName.text,
    address: place.formattedAddress,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    primaryType: place.primaryType,
    businessStatus: place.businessStatus,
    mapsUrl: place.googleMapsUri,
  }
}

function summarizeDetails(place) {
  const photos = Array.isArray(place.photos) ? place.photos : []
  const reviews = Array.isArray(place.reviews) ? place.reviews : []
  return {
    placeId: place.id,
    name: place.displayName && place.displayName.text,
    address: place.formattedAddress,
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
    website: place.websiteUri,
    mapsUrl: place.googleMapsUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    businessStatus: place.businessStatus,
    primaryType: place.primaryType,
    types: place.types,
    priceLevel: place.priceLevel,
    hours: place.regularOpeningHours && place.regularOpeningHours.weekdayDescriptions,
    photoCount: photos.length,
    photoNames: photos.map(p => p.name),
    reviews: reviews.map(r => ({
      rating: r.rating,
      relativeTime: r.relativePublishTimeDescription,
      text: r.text && r.text.text,
      authorName: r.authorAttribution && r.authorAttribution.displayName,
    })),
    _raw: place,
  }
}

async function main() {
  let result

  switch (cmd) {
    case 'search': {
      const query = args.query
      if (!query) { result = { error: '--query required, e.g. --query "Joe\'s Plumbing, Austin TX"' }; break }
      const maxResultCount = args['max-results'] ? Number(args['max-results']) : 5
      const raw = await callApi('POST', '/places:searchText', {
        fieldMask: DEFAULT_SEARCH_FIELDS,
        body: { textQuery: query, maxResultCount },
      })
      if (raw._dry_run || raw.error) { result = raw; break }
      result = { results: (raw.places || []).map(summarizeSearchResult) }
      break
    }

    case 'details': {
      const placeId = args['place-id']
      if (!placeId) { result = { error: '--place-id required (get one from `search`)' }; break }
      const fieldMask = args.fields || DEFAULT_DETAILS_FIELDS
      const raw = await callApi('GET', `/places/${encodeURIComponent(placeId)}`, { fieldMask })
      if (raw._dry_run || raw.error) { result = raw; break }
      result = summarizeDetails(raw)
      break
    }

    case 'photo-url': {
      const name = args.name
      if (!name) { result = { error: '--name required (a photo resource name from `details`, e.g. places/ABC123/photos/XYZ)' }; break }
      const maxWidth = args['max-width'] || '1200'
      const url = `${BASE_URL}/${name}/media?maxWidthPx=${encodeURIComponent(maxWidth)}&key=${args['dry-run'] ? '***' : API_KEY}`
      result = { url, note: 'GET this URL (it 302-redirects to the actual image) to download or embed the photo.' }
      break
    }

    default:
      result = {
        error: 'Unknown command',
        usage: {
          search: 'search --query "Business Name, City State" [--max-results 5]',
          details: 'details --place-id <id> [--fields <comma-separated field mask>]',
          'photo-url': 'photo-url --name <photo resource name from details> [--max-width 1200]',
        },
        note: 'Requires GOOGLE_PLACES_API_KEY with "Places API (New)" enabled on a Google Cloud project. This calls the official API — never scrape Google Maps or Search result pages for this data.',
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
