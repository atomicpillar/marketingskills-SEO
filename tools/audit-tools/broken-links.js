#!/usr/bin/env node
// Site-wide broken link check via linkinator (open source, MIT). Recurses
// through internal pages and checks every link found — internal and
// outbound — for broken (4xx/5xx) responses.

import { LinkChecker } from 'linkinator'

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
    console.log(JSON.stringify({ error: '--url required', usage: 'node broken-links.js --url https://example.com [--concurrency 25]' }))
    process.exit(1)
  }

  const checker = new LinkChecker()
  const result = await checker.check({
    path: url,
    recurse: true,
    concurrency: args.concurrency ? Number(args.concurrency) : 25,
  })

  const broken = result.links.filter(l => l.state === 'BROKEN')
  const skipped = result.links.filter(l => l.state === 'SKIPPED')

  console.log(JSON.stringify({
    url,
    passed: result.passed,
    totalLinksChecked: result.links.length,
    brokenCount: broken.length,
    broken: broken.map(l => ({ url: l.url, status: l.status, foundOn: l.parent })),
    skippedCount: skipped.length,
  }, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
