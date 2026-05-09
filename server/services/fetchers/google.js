import * as cheerio from 'cheerio'
import { getRandomUA, createRateLimiter, estimateSearchScore } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 3, interval: 'minute' })

export async function searchGoogle(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)
    // Random delay 2-5s to reduce detection
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000))

    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en`
    const res = await fetch(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })

    if (res.status === 429 || res.status === 503) {
      console.warn('[google] Blocked or rate-limited, skipping')
      return []
    }

    if (!res.ok) {
      console.warn(`[google] returned ${res.status}`)
      return []
    }

    const html = await res.text()
    if (html.includes('captcha') || html.includes('unusual traffic')) {
      console.warn('[google] CAPTCHA detected, skipping')
      return []
    }

    const $ = cheerio.load(html)
    const results = []

    $('div.g, div[data-sokoban-container]').each((_, el) => {
      const title = $(el).find('h3').text().trim()
      const href = $(el).find('a').first().attr('href')
      const snippet = $(el).find('div[data-sncf], div.VwiC3b, span.aCOpRe').text().trim()
      if (title && href && href.startsWith('http')) {
        results.push({
          title,
          url: href,
          source: 'google',
          summary: snippet,
          score: estimateSearchScore(title, snippet, keywords),
        })
      }
    })

    console.log(`[google] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[google] fetch error:', err.message)
    return []
  }
}
