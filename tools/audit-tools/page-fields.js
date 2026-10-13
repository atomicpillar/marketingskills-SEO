#!/usr/bin/env node
// Zero-dependency on-page field extractor. Fetches raw HTML (no browser, no
// JS execution — pairs with schema-check.js for the JS-rendered case) and
// pulls everything an audit checks by hand every time: title, meta
// description/robots, OG/Twitter tags, canonical, hreflang, headings (with
// suspicious-heading detection), images (with lazy-load-method detection so
// WordPress optimization plugins don't get false-flagged), internal/external
// links, JSON-LD schema (with @graph flattening), and word count.
//
// No npm install needed — uses only Node 18+ built-ins (global fetch, URL).
// Ported from the open-source claude-seo project's parse_html.py logic,
// reimplemented here as regex-based parsing to stay dependency-free.

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

function decodeEntities(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}

function getAttr(tag, name) {
  const re = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const m = tag.match(re)
  if (!m) return null
  return decodeEntities(m[2] ?? m[3] ?? m[4] ?? '')
}

function hasClass(tag, needle) {
  const cls = getAttr(tag, 'class') || ''
  return cls.split(/\s+/).includes(needle)
}

function resolveUrl(base, href) {
  try { return new URL(href, base).toString() } catch { return null }
}

function stripTagsToText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim()
}

function wordCount(bodyHtml) {
  const stripped = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
  const text = stripTagsToText(stripped)
  const matches = text.match(/\b\w+\b/g)
  return matches ? matches.length : 0
}

function isSuspiciousHeading(text) {
  const t = text.trim()
  if (t.length <= 3) return true
  const stripped = t.replace(/[,.+\-%\s]/g, '')
  if (stripped.length > 0 && /^\d+$/.test(stripped)) return true
  return false
}

function detectLazyMethod(imgTag) {
  if (/loading\s*=\s*["']?lazy["']?/i.test(imgTag)) return 'native'
  if (/data-perfmatters-(src|srcset)\s*=/i.test(imgTag) || hasClass(imgTag, 'perfmatters-lazy') || hasClass(imgTag, 'perfmatters-lazy-loaded')) return 'perfmatters'
  if (/data-(ewww-src|eio)\s*=/i.test(imgTag) || hasClass(imgTag, 'lazyload-eio') || hasClass(imgTag, 'lazyloaded-eio')) return 'ewww'
  if (/data-(src|lazy-src|original|srcset)\s*=/i.test(imgTag) || ['lazyload', 'lazyloaded', 'lazy', 'lazy-loaded'].some(c => hasClass(imgTag, c))) return 'js-generic'
  return 'none'
}

function extractHeadings(html, level) {
  const re = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi')
  const out = []
  let m
  while ((m = re.exec(html))) {
    const text = stripTagsToText(m[1])
    if (text) out.push(text)
  }
  return out
}

function extractSchema(html) {
  const re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const out = []
  let m
  while ((m = re.exec(html))) {
    let parsed
    try { parsed = JSON.parse(m[1].trim()) } catch { continue } // silently skip malformed blocks, matching claude-seo behavior
    if (Array.isArray(parsed)) {
      for (const item of parsed) out.push(item)
    } else if (parsed && Array.isArray(parsed['@graph'])) {
      for (const item of parsed['@graph']) out.push(item)
    } else if (parsed) {
      out.push(parsed)
    }
  }
  return out
}

function extractMetaMap(html, prefix) {
  const re = /<meta\s+[^>]*>/gi
  const map = {}
  let m
  while ((m = re.exec(html))) {
    const tag = m[0]
    const property = getAttr(tag, 'property') || getAttr(tag, 'name')
    if (property && property.toLowerCase().startsWith(prefix)) {
      const content = getAttr(tag, 'content')
      if (content !== null) map[property] = content
    }
  }
  return map
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const url = args.url
  if (!url) {
    console.log(JSON.stringify({ error: '--url required', usage: 'node page-fields.js --url https://example.com' }))
    process.exit(1)
  }

  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MarketingSkillsAuditBot/1.0; +https://github.com/coreyhaines31/marketingskills)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  })
  const finalUrl = res.url || url
  const html = await res.text()

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? stripTagsToText(titleMatch[1]) : null

  const metaDescMatch = html.match(/<meta\s+[^>]*name\s*=\s*["']description["'][^>]*>/i)
  const metaDescription = metaDescMatch ? getAttr(metaDescMatch[0], 'content') : null

  const metaRobotsMatch = html.match(/<meta\s+[^>]*name\s*=\s*["']robots["'][^>]*>/i)
  const metaRobots = metaRobotsMatch ? getAttr(metaRobotsMatch[0], 'content') : null

  const openGraph = extractMetaMap(html, 'og:')
  const twitterCard = extractMetaMap(html, 'twitter:')

  const linkTagRe = /<link\s+[^>]*>/gi
  let canonical = null
  const hreflang = []
  let lm
  while ((lm = linkTagRe.exec(html))) {
    const tag = lm[0]
    const rel = (getAttr(tag, 'rel') || '').toLowerCase().split(/\s+/)
    if (rel.includes('canonical') && !canonical) {
      canonical = resolveUrl(finalUrl, getAttr(tag, 'href'))
    }
    if (rel.includes('alternate')) {
      const hl = getAttr(tag, 'hreflang')
      const href = getAttr(tag, 'href')
      if (hl && href) hreflang.push({ lang: hl, href: resolveUrl(finalUrl, href) })
    }
  }

  const headings = {}
  const suspicious = {}
  for (let level = 1; level <= 6; level++) {
    const key = `h${level}`
    headings[key] = extractHeadings(html, level)
    const sus = headings[key].filter(isSuspiciousHeading)
    if (sus.length) suspicious[`${key}_suspicious`] = sus
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const bodyHtml = bodyMatch ? bodyMatch[1] : html

  const imgRe = /<img\s+[^>]*>/gi
  const images = []
  let im
  while ((im = imgRe.exec(bodyHtml))) {
    const tag = im[0]
    const src = getAttr(tag, 'src') || getAttr(tag, 'data-src') || getAttr(tag, 'data-lazy-src')
    images.push({
      src: src ? resolveUrl(finalUrl, src) : null,
      alt: getAttr(tag, 'alt'),
      width: getAttr(tag, 'width'),
      height: getAttr(tag, 'height'),
      loading: getAttr(tag, 'loading'),
      lazy_method: detectLazyMethod(tag),
    })
  }
  const imagesMissingAlt = images.filter(i => !i.alt || i.alt.trim() === '').length

  const base = new URL(finalUrl)
  const aRe = /<a\s+[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi
  const linksInternal = []
  const linksExternal = []
  let am
  while ((am = aRe.exec(bodyHtml))) {
    const rawHref = decodeEntities(am[2] ?? am[3] ?? '')
    if (!rawHref || rawHref.startsWith('#') || /^javascript:/i.test(rawHref)) continue
    const resolved = resolveUrl(finalUrl, rawHref)
    if (!resolved) continue
    const text = stripTagsToText(am[4]).slice(0, 100)
    const relAttr = getAttr(am[0].split('>')[0] + '>', 'rel')
    const entry = { href: resolved, text, rel: relAttr }
    try {
      const linkHost = new URL(resolved).hostname
      if (linkHost === base.hostname) linksInternal.push(entry)
      else linksExternal.push(entry)
    } catch { /* unparseable, skip */ }
  }

  const schema = extractSchema(html)

  console.log(JSON.stringify({
    url,
    finalUrl,
    httpStatus: res.status,
    title,
    titleLength: title ? title.length : 0,
    metaDescription,
    metaDescriptionLength: metaDescription ? metaDescription.length : 0,
    metaRobots,
    openGraph,
    twitterCard,
    canonical,
    hreflang,
    headings,
    ...suspicious,
    h1Count: headings.h1.length,
    images,
    imageCount: images.length,
    imagesMissingAlt,
    links: { internal: linksInternal, external: linksExternal },
    internalLinkCount: linksInternal.length,
    externalLinkCount: linksExternal.length,
    schema,
    schemaCount: schema.length,
    schemaTypes: [...new Set(schema.map(s => s && s['@type']).filter(Boolean).flat())],
    wordCount: wordCount(bodyHtml),
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
