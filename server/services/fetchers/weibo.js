import * as cheerio from 'cheerio'
import { getRandomUA, createRateLimiter, fetchWithRetry, estimateSearchScore } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 5, interval: 'minute' })

function getDateStr() {
  return new Date().toISOString().split('T')[0]
}

export async function searchWeibo(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(query)}&timescope=custom:1:${getDateStr()}`
    const headers = {
      'User-Agent': getRandomUA(),
      'Accept': 'text/html',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    }

    // Use cookie if available for better results
    if (process.env.WEIBO_COOKIE) {
      headers['Cookie'] = process.env.WEIBO_COOKIE
    }

    const res = await fetchWithRetry(url, { headers })

    if (!res.ok) {
      console.warn(`[weibo] returned ${res.status}`)
      return []
    }

    const html = await res.text()
    const $ = cheerio.load(html)
    const results = []

    // Try multiple selector patterns as Weibo's HTML varies
    $('div[action-type="feed_list_item"], div.card-wrap, article').each((_, el) => {
      const title = $(el).find('.txt, .txt_box, p[class*="txt"]').text().trim().slice(0, 120)
      const mid = $(el).attr('mid') || $(el).attr('mblogid') || ''
      let href = ''
      if (mid) {
        href = `https://weibo.com/detail/${mid}`
      } else {
        const link = $(el).find('a[href*="/detail/"], a[href*="weibo.com"]').attr('href')
        if (link) href = link.startsWith('http') ? link : `https:${link}`
      }

      if (title && href) {
        results.push({
          title,
          url: href,
          source: 'weibo',
          summary: title,
          score: estimateSearchScore(title, '', keywords),
        })
      }
    })

    if (results.length === 0 && !process.env.WEIBO_COOKIE) {
      console.warn('[weibo] No results. Consider setting WEIBO_COOKIE env var for better results.')
    }

    console.log(`[weibo] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[weibo] fetch error:', err.message)
    return []
  }
}
