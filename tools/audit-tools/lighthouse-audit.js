#!/usr/bin/env node
// Real Core Web Vitals and Lighthouse category scores, run locally — no
// PageSpeed Insights API key needed. Uses the official `lighthouse` package
// against a locally-launched Chromium (reuses Playwright's bundled browser
// if no system Chrome is found via CHROME_PATH).

import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'
import { existsSync, readdirSync } from 'node:fs'
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

function findChromePath() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH
  const pwPath = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (pwPath && existsSync(pwPath)) {
    const dirs = readdirSync(pwPath).filter(d => d.startsWith('chromium-'))
    for (const dir of dirs) {
      const candidates = [
        join(pwPath, dir, 'chrome-linux', 'chrome'),
        join(pwPath, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
      ]
      for (const c of candidates) if (existsSync(c)) return c
    }
  }
  return undefined // let chrome-launcher auto-detect a system Chrome
}

const args = parseArgs(process.argv.slice(2))

async function main() {
  const url = args.url
  if (!url) {
    console.log(JSON.stringify({ error: '--url required', usage: 'node lighthouse-audit.js --url https://example.com [--mobile]' }))
    process.exit(1)
  }

  const chromePath = findChromePath()
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    chromePath,
  })

  try {
    const formFactor = args.mobile ? 'mobile' : 'desktop'
    const config = formFactor === 'mobile'
      ? undefined // lighthouse's default config is already mobile-throttled
      : {
          extends: 'lighthouse:default',
          settings: { formFactor: 'desktop', screenEmulation: { disabled: true } },
        }

    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
    }, config)

    const lhr = runnerResult.lhr
    const audit = (id) => lhr.audits[id] ? { value: lhr.audits[id].numericValue, display: lhr.audits[id].displayValue, score: lhr.audits[id].score } : null

    console.log(JSON.stringify({
      url,
      formFactor,
      fetchTime: lhr.fetchTime,
      scores: {
        performance: Math.round((lhr.categories.performance?.score || 0) * 100),
        seo: Math.round((lhr.categories.seo?.score || 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      },
      coreWebVitals: {
        lcp: audit('largest-contentful-paint'),
        cls: audit('cumulative-layout-shift'),
        tbt: audit('total-blocking-time'),
        fcp: audit('first-contentful-paint'),
        speedIndex: audit('speed-index'),
        timeToInteractive: audit('interactive'),
      },
      topOpportunities: (lhr.audits ? Object.values(lhr.audits) : [])
        .filter(a => a.details && a.details.type === 'opportunity' && a.numericValue > 0)
        .sort((a, b) => b.numericValue - a.numericValue)
        .slice(0, 8)
        .map(a => ({ id: a.id, title: a.title, savingsMs: Math.round(a.numericValue), description: a.description })),
      failedAudits: (lhr.audits ? Object.values(lhr.audits) : [])
        .filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary')
        .map(a => ({ id: a.id, title: a.title, description: a.description })),
    }, null, 2))
  } finally {
    await chrome.kill()
  }
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
