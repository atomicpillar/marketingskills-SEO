#!/usr/bin/env node
// Desktop + mobile full-page screenshots for the visual/design half of a
// client-audit-report — evidence for "your reputation doesn't match your
// website" findings, and raw material for a before/after in the report.

import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

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

function slugFor(url) {
  try {
    return new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '_')
  } catch {
    return 'site'
  }
}

const args = parseArgs(process.argv.slice(2))

async function main() {
  const url = args.url
  if (!url) {
    console.log(JSON.stringify({ error: '--url required', usage: 'node screenshot.js --url https://example.com [--out ./screenshots]' }))
    process.exit(1)
  }

  const outDir = args.out || './screenshots'
  mkdirSync(outDir, { recursive: true })
  const slug = slugFor(url)

  const browser = await chromium.launch({ headless: true })
  const saved = {}

  try {
    // Desktop
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await desktopPage.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() =>
      desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    )
    const desktopPath = join(outDir, `${slug}-desktop.png`)
    await desktopPage.screenshot({ path: desktopPath, fullPage: true })
    saved.desktop = desktopPath
    await desktopPage.close()

    // Mobile (iPhone 13 profile)
    const iPhone = devices['iPhone 13']
    const mobileContext = await browser.newContext({ ...iPhone })
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() =>
      mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    )
    const mobilePath = join(outDir, `${slug}-mobile.png`)
    await mobilePage.screenshot({ path: mobilePath, fullPage: true })
    saved.mobile = mobilePath

    // quick heuristics useful for the report's design commentary
    const mobileChecks = await mobilePage.evaluate(() => ({
      hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
      viewportConfigured: !!document.querySelector('meta[name="viewport"]'),
    }))
    await mobileContext.close()

    console.log(JSON.stringify({ url, files: saved, mobileChecks }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
