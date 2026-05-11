import { createRateLimiter, fetchWithRetry } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

const WEIBO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://weibo.com',
}

async function fetchHotBand() {
  try {
    await limiter.removeTokens(1)
    const res = await fetchWithRetry('https://weibo.com/ajax/statuses/hot_band', {
      headers: WEIBO_HEADERS,
    })

    if (!res.ok) {
      console.warn(`[weibo] hot_band returned ${res.status}`)
      return []
    }

    const data = await res.json()
    if (data.ok !== 1 || !data.data?.band_list) {
      console.warn('[weibo] hot_band response invalid')
      return []
    }

    return data.data.band_list
  } catch (err) {
    console.error('[weibo] hot_band error:', err.message)
    return []
  }
}

function matchKeywords(word, keywords) {
  if (!keywords.length) return true
  const lower = word.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}

export async function searchWeibo(keywords = []) {
  try {
    const bandList = await fetchHotBand()
    if (!bandList.length) return []

    const results = bandList
      .filter((item) => matchKeywords(item.word || item.note || '', keywords))
      .map((item) => {
        const word = item.word || item.note || ''
        const hot = item.num || item.raw_hot || 0
        const category = item.category || ''
        const url = `https://s.weibo.com/weibo?q=${encodeURIComponent(word)}`

        return {
          title: word,
          url,
          source: 'weibo',
          summary: category ? `${category} · ${hot.toLocaleString()}热度` : `${hot.toLocaleString()}热度`,
          score: Math.min(100, Math.floor(Math.log10(hot + 1) * 15)),
        }
      })

    console.log(`[weibo] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[weibo] fetch error:', err.message)
    return []
  }
}
