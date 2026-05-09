import * as cheerio from 'cheerio'
import { getRandomUA, createRateLimiter, fetchWithRetry, estimateSearchScore } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 20, interval: 'minute' })

export async function searchDuckDuckGo(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html',
      },
    })

    if (!res.ok) {
      console.warn(`[duckduckgo] returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    // DDG lite uses table layout with result links
    $('a.result-link, td a[href]').each((_, el) => {
      const title = $(el).text().trim()
      const href = $(el).attr('href')
      if (!title || !href || !href.startsWith('http') || href.includes('duckduckgo.com')) return

      // Try to get snippet from adjacent row
      const snippet = $(el).closest('tr').next('tr').find('td').text().trim()
      results.push({
        title,
        url: href,
        source: 'duckduckgo',
        summary: snippet,
        score: estimateSearchScore(title, snippet, keywords),
      })
    })

    console.log(`[duckduckgo] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[duckduckgo] fetch error:', err.message)
    return []
  }
}
