import * as cheerio from 'cheerio'
import { getRandomUA, createRateLimiter, fetchWithRetry, estimateSearchScore } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

export async function searchBing(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=20`
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
      },
    })

    if (!res.ok) {
      console.warn(`[bing] returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('li.b_algo').each((_, el) => {
      const title = $(el).find('h2 a').text().trim()
      const href = $(el).find('h2 a').attr('href')
      const snippet = $(el).find('.b_caption p').text().trim()
      if (title && href) {
        results.push({
          title,
          url: href,
          source: 'bing',
          summary: snippet,
          score: estimateSearchScore(title, snippet, keywords),
        })
      }
    })

    console.log(`[bing] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[bing] fetch error:', err.message)
    return []
  }
}
