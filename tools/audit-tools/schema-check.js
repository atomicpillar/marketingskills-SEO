#!/usr/bin/env node
// Renders a page in a real browser and extracts what curl/web_fetch can't see:
// JS-injected JSON-LD schema, the rendered title/meta/H1s, and canonical tag.
// Fixes the exact gap documented in skills/seo-audit/SKILL.md ("Schema Markup
// Detection Limitation") — most CMS SEO plugins (Yoast, RankMath, AIOSEO)
// inject JSON-LD client-side, which never appears in static HTML.

import { chromium } from 'playwright'

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

const args = parseArgs(process.argv.slice(2))

async function main() {
  const url = args.url
  if (!url) {
    console.log(JSON.stringify({ error: '--url required', usage: 'node schema-check.js --url https://example.com' }))
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (compatible; MarketingSkillsAuditBot/1.0)' })
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() =>
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    )

    const data = await page.evaluate(() => {
      const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      const schema = jsonLdScripts.map(s => {
        try { return JSON.parse(s.textContent) } catch { return { _parseError: true, raw: s.textContent.slice(0, 500) } }
      })

      const microdataItems = Array.from(document.querySelectorAll('[itemscope]')).map(el => el.getAttribute('itemtype')).filter(Boolean)

      const headings = {}
      for (const level of ['h1', 'h2', 'h3']) {
        headings[level] = Array.from(document.querySelectorAll(level)).map(el => el.textContent.trim()).filter(Boolean)
      }

      const canonical = document.querySelector('link[rel="canonical"]')
      const metaDescription = document.querySelector('meta[name="description"]')
      const metaRobots = document.querySelector('meta[name="robots"]')
      const viewport = document.querySelector('meta[name="viewport"]')
      const images = Array.from(document.querySelectorAll('img'))
      const imagesMissingAlt = images.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').length

      return {
        title: document.title,
        metaDescription: metaDescription ? metaDescription.getAttribute('content') : null,
        metaRobots: metaRobots ? metaRobots.getAttribute('content') : null,
        canonical: canonical ? canonical.getAttribute('href') : null,
        viewportConfigured: !!viewport,
        headings,
        h1Count: headings.h1.length,
        imageCount: images.length,
        imagesMissingAlt,
        schemaCount: schema.length,
        schema,
        microdataTypes: [...new Set(microdataItems)],
      }
    })

    console.log(JSON.stringify({
      url,
      finalUrl: page.url(),
      httpStatus: response ? response.status() : null,
      ...data,
    }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
