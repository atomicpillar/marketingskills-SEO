#!/usr/bin/env node
// Zero-dependency detector for templated / bulk-generated title+description
// pairs — the pattern where a meta description is just the title echoed
// back with a stock call-to-action tacked on ("X | Brand - Try it free
// today!"), usually a sign of programmatic/AI-bulk metadata generation
// rather than a human writing each page's pitch.
//
// No npm install needed — Node 18+ built-ins only.
// Ported from the open-source claude-seo project's metadata_template.py
// logic (string/regex checks, no model call).
//
// Usage:
//   node metadata-check.js --title "..." --description "..."
//   node metadata-check.js --url https://example.com/page
//   node metadata-check.js --pages pages.json
//     (pages.json: [{ "url": "...", "title": "...", "description": "..." }, ...])

import { readFileSync } from 'fs'

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

const CTA_TAIL_RE = new RegExp(
  '(' + [
    'try (it )?(free|now)( now)?',
    'try (it )?today',
    'start( your)?( the)? (free|now)([\\w\\s]{0,20})?',
    '(learn|read|find out|see) (more )?now',
    'get started( (now|free|today))?',
    'check (it out|your [\\w]+) now',
    '(boost|improve|upgrade)( your)?([\\w\\s]{0,20})?now',
    'sign up( (free|now|today))?',
  ].join('|') + ')\\s*\\.?\\s*$',
  'i'
)

function normalise(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleCore(title) {
  if (!title) return ''
  const parts = title.split(/\s[|–—-]\s/)
  return parts[0].trim()
}

function checkPair(title, description) {
  const flags = []
  const normTitle = normalise(title)
  const normDesc = normalise(description)
  const normCore = normalise(titleCore(title))

  if (!normTitle || !normDesc) {
    return { flags, severity: 'none', note: 'missing title or description, skipped' }
  }

  // Check 1 & 2: description echoes title-core, optionally followed by a stock CTA tail
  if (normCore.length >= 25) {
    const prefix = normCore.slice(0, 60)
    if (normDesc.startsWith(prefix)) {
      const remainder = normDesc.slice(prefix.length).replace(/^[\s\-–—:|.]+/, '')
      const ctaMatch = remainder.match(CTA_TAIL_RE)
      if (ctaMatch) {
        flags.push({ check: 'templated-metadata', severity: 'high', detail: `description opens with the title, closes with a stock CTA ("${ctaMatch[0].trim()}")` })
      } else {
        flags.push({ check: 'description-echoes-title', severity: 'medium', detail: 'description restates the title with no new information' })
      }
    }
  }

  // Check 3: brand suffix (the part after the separator) also appears, mid-description, verbatim
  const sepMatch = (title || '').match(/\s[|–—-]\s(.+)$/)
  if (sepMatch) {
    const brand = sepMatch[1].trim()
    if (brand.length >= 2 && brand.length <= 30) {
      const normBrand = normalise(brand)
      if (normBrand && !normDesc.startsWith(normBrand) && normDesc.includes(normBrand)) {
        flags.push({ check: 'brand-suffix-in-description', severity: 'low', detail: `brand suffix "${brand}" appears mid-description — possible concatenation artifact` })
      }
    }
  }

  // Check 4: exact duplicate
  if (normTitle.length >= 25 && normTitle === normDesc) {
    flags.push({ check: 'description-duplicates-title', severity: 'medium', detail: 'description is character-for-character the same as the title' })
  }

  const severityOrder = { high: 3, medium: 2, low: 1, none: 0 }
  const severity = flags.reduce((max, f) => (severityOrder[f.severity] > severityOrder[max] ? f.severity : max), 'none')
  return { flags, severity }
}

async function fetchTitleAndDescription(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketingSkillsAuditBot/1.0)' },
  })
  const html = await res.text()
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const descMatch = html.match(/<meta\s+[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*("([^"]*)"|'([^']*)')[^>]*>/i)
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : null
  const description = descMatch ? (descMatch[2] ?? descMatch[3] ?? null) : null
  return { url, title, description }
}

function rollUp(results) {
  const templated = results.filter(r => r.severity === 'high' || r.severity === 'medium')
  const total = results.length
  const ratio = total ? templated.length / total : 0

  let site_risk = 'low'
  if (templated.length >= 3 && ratio >= 0.3) site_risk = 'high'
  else if (templated.length >= 3 && ratio >= 0.1) site_risk = 'medium'
  const isolated = templated.length > 0 && templated.length <= 2

  const ctaCounts = {}
  for (const r of results) {
    for (const f of r.flags) {
      if (f.check === 'templated-metadata') {
        const m = f.detail.match(/\("([^"]+)"\)/)
        const phrase = m ? m[1].toLowerCase() : 'unknown'
        ctaCounts[phrase] = (ctaCounts[phrase] || 0) + 1
      }
    }
  }
  const sharedCtaTail = Object.entries(ctaCounts).some(([, count]) => count >= 3)

  return {
    pages_checked: total,
    templated_count: templated.length,
    templated_ratio: Number(ratio.toFixed(3)),
    site_risk,
    isolated,
    shared_cta_phrases: ctaCounts,
    shared_cta_tail: sharedCtaTail,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.pages) {
    const raw = readFileSync(args.pages, 'utf-8')
    const pages = JSON.parse(raw)
    const results = pages.map(p => ({ url: p.url, ...checkPair(p.title, p.description) }))
    console.log(JSON.stringify({ pages: results, summary: rollUp(results) }, null, 2))
    return
  }

  if (args.url) {
    const page = await fetchTitleAndDescription(args.url)
    const result = checkPair(page.title, page.description)
    console.log(JSON.stringify({ url: page.url, title: page.title, description: page.description, ...result }, null, 2))
    return
  }

  if (args.title || args.description) {
    const result = checkPair(args.title, args.description)
    console.log(JSON.stringify({ title: args.title, description: args.description, ...result }, null, 2))
    return
  }

  console.log(JSON.stringify({
    error: 'provide --title + --description, --url, or --pages <file.json>',
    usage: [
      'node metadata-check.js --title "..." --description "..."',
      'node metadata-check.js --url https://example.com/page',
      'node metadata-check.js --pages pages.json',
    ],
  }))
  process.exit(1)
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
