#!/usr/bin/env node
// Zero-dependency sitemap discovery and validation. Reads robots.txt
// `Sitemap:` declarations, tries common fallback paths, and validates each
// candidate — so a stale or broken `Sitemap:` line in robots.txt shows up as
// a real finding instead of being silently treated as "sitemap exists."
//
// No npm install needed — uses only Node 18+ built-ins (global fetch, URL).
// Ported from the open-source claude-seo project's sitemap_discovery.py
// logic, reimplemented here dependency-free (lightweight root-element regex
// instead of a full XML parser).

const MAX_ROBOTS_BYTES = 1_000_000
const MAX_SITEMAP_BYTES = 50_000_000
const MAX_DECLARED = 16
const MAX_TEXT_SITEMAP_LINES = 50_000
const COMMON_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap-index.xml', '/wp-sitemap.xml']

function parseArgs(argv) {
  const result = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { result[key] = next; i++ } else { result[key] = true }
    }
  }
  return result
}

async function fetchBounded(url, maxBytes) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketingSkillsAuditBot/1.0)' },
  })
  const contentType = res.headers.get('content-type') || ''
  const buf = await res.arrayBuffer()
  const tooLarge = buf.byteLength > maxBytes
  const text = Buffer.from(tooLarge ? buf.slice(0, maxBytes) : buf).toString('utf-8')
  return { status: res.status, contentType, text, tooLarge, byteLength: buf.byteLength }
}

function extractDeclaredSitemaps(robotsText) {
  const lines = robotsText.split(/\r?\n/)
  const found = []
  const re = /^\s*sitemap\s*:\s*(\S+)\s*$/i
  for (const line of lines) {
    const m = line.match(re)
    if (m) found.push(m[1])
  }
  return [...new Set(found)].slice(0, MAX_DECLARED)
}

function isValidAbsoluteHttpUrl(line) {
  if (/\s/.test(line)) return false
  try {
    const u = new URL(line)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    return true
  } catch {
    return false
  }
}

function validateCandidate(url, status, contentType, text, tooLarge) {
  if (tooLarge) return { valid: false, kind: null, error: 'too_large (exceeds 50MB)' }
  if (status >= 400) return { valid: false, kind: null, error: `HTTP ${status}` }
  if (!text || !text.trim()) return { valid: false, kind: null, error: 'empty response' }
  if (/<!DOCTYPE/i.test(text.slice(0, 2000))) {
    return { valid: false, kind: null, error: 'DOCTYPE is not allowed in sitemap XML' }
  }

  const trimmed = text.trim()
  const looksXml = trimmed.startsWith('<')
  const looksText = !looksXml && (contentType.includes('text/plain') || url.endsWith('.txt'))

  if (looksXml) {
    const rootMatch = trimmed.match(/<\s*([a-zA-Z0-9:_-]+)[\s>]/)
    const rootLocal = rootMatch ? rootMatch[1].replace(/^[a-zA-Z0-9]+:/, '').toLowerCase() : null
    if (!rootLocal || !['urlset', 'sitemapindex', 'rss', 'feed'].includes(rootLocal)) {
      return { valid: false, kind: 'xml', error: `unsupported XML root: ${rootLocal || 'unknown'}` }
    }
    const urlCount = (trimmed.match(/<loc>/gi) || []).length
    return { valid: true, kind: rootLocal === 'sitemapindex' ? 'sitemap_index' : 'urlset', urlCount }
  }

  if (looksText) {
    const lines = trimmed.split(/\r?\n/).filter(l => l.trim())
    if (lines.length > MAX_TEXT_SITEMAP_LINES) {
      return { valid: false, kind: 'text', error: `text sitemap exceeds ${MAX_TEXT_SITEMAP_LINES} lines` }
    }
    const bad = lines.find(l => !isValidAbsoluteHttpUrl(l.trim()))
    if (bad) return { valid: false, kind: 'text', error: `invalid URL line: ${bad.slice(0, 120)}` }
    return { valid: true, kind: 'text', urlCount: lines.length }
  }

  return { valid: false, kind: null, error: 'response is neither XML nor a recognizable text sitemap' }
}

async function checkCandidate(url, source) {
  try {
    const { status, contentType, text, tooLarge } = await fetchBounded(url, MAX_SITEMAP_BYTES)
    const result = validateCandidate(url, status, contentType, text, tooLarge)
    return { url, source, status_code: status, ...result }
  } catch (err) {
    return { url, source, status_code: null, valid: false, kind: null, error: err.message }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const url = args.url
  if (!url) {
    console.log(JSON.stringify({ error: '--url required', usage: 'node sitemap-check.js --url https://example.com' }))
    process.exit(1)
  }

  const origin = new URL(url).origin
  const robotsUrl = `${origin}/robots.txt`
  const warnings = []

  let declared = []
  try {
    const { status, text, tooLarge } = await fetchBounded(robotsUrl, MAX_ROBOTS_BYTES)
    if (status >= 400) {
      warnings.push(`robots.txt returned HTTP ${status} — falling back to common paths only`)
    } else {
      if (tooLarge) warnings.push('robots.txt exceeds 1MB, only the first portion was scanned')
      declared = extractDeclaredSitemaps(text)
    }
  } catch (err) {
    warnings.push(`robots.txt fetch failed: ${err.message} — falling back to common paths only`)
  }

  const candidates = []
  for (const d of declared) candidates.push({ url: d, source: 'robots.txt' })
  for (const p of COMMON_PATHS) {
    const full = `${origin}${p}`
    if (!candidates.some(c => c.url === full)) candidates.push({ url: full, source: 'common_path' })
  }

  const checked = []
  for (const c of candidates) {
    checked.push(await checkCandidate(c.url, c.source))
  }

  const found = checked.filter(c => c.valid)

  if (declared.length === 0) warnings.push('robots.txt declares no Sitemap: line')
  if (found.length === 0) warnings.push('no valid sitemap found at any declared or common-path location')

  console.log(JSON.stringify({
    target: url,
    robots_url: robotsUrl,
    declared,
    found,
    checked,
    warnings,
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
