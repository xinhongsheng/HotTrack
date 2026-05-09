import * as cheerio from 'cheerio'
import { getRandomUA, createRateLimiter, fetchWithRetry, estimateSearchScore } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

export async function searchSogou(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://www.sogou.com/web?query=${encodeURIComponent(query)}`
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    })

    if (!res.ok) {
      console.warn(`[sogou] returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    $('div.vrwrap, div.rb, div[class*="results"]').each((_, el) => {
      const title = $(el).find('h3 a').text().trim()
      let href = $(el).find('h3 a').attr('href') || ''
      const snippet = $(el).find('p.str_info, div.str-text, div.space-txt, p[class*="star-wiki"]').text().trim()

      if (title && href) {
        if (!href.startsWith('http')) {
          href = `https://www.sogou.com${href}`
        }
        results.push({
          title,
          url: href,
          source: 'sogou',
          summary: snippet,
          score: estimateSearchScore(title, snippet, keywords),
        })
      }
    })

    console.log(`[sogou] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[sogou] fetch error:', err.message)
    return []
  }
}
