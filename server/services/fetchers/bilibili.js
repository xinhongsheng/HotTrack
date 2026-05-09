import { createRateLimiter, fetchWithRetry } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

export async function searchBilibili(keywords = []) {
  try {
    await limiter.removeTokens(1)

    const res = await fetchWithRetry('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.bilibili.com',
      },
    })

    if (!res.ok) {
      console.warn(`[bilibili] returned ${res.status}`)
      return []
    }

    const json = await res.json()
    const list = json?.data?.list || []
    const results = list.map((item) => ({
      title: item.title || '',
      url: item.short_link_v2 || `https://www.bilibili.com/video/${item.bvid}`,
      source: 'bilibili',
      summary: item.desc || '',
      score: (item.stat?.view || 0) + (item.stat?.like || 0) * 2,
    })).filter((item) => item.title && item.url)

    console.log(`[bilibili] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[bilibili] fetch error:', err.message)
    return []
  }
}
