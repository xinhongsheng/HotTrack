import { getRandomUA, createRateLimiter, fetchWithRetry } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

export async function searchBilibili(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(query)}&page=1&page_size=20`
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': getRandomUA(),
        'Referer': 'https://www.bilibili.com',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`[bilibili] returned ${res.status}`)
      return []
    }

    const json = await res.json()
    const groups = json?.data?.result || []
    const results = []

    for (const group of groups) {
      if (!group.result) continue
      for (const item of group.result) {
        const title = (item.title || '').replace(/<[^>]*>/g, '')
        const itemUrl = item.arcurl
          ? `https:${item.arcurl}`
          : item.goto_url || ''
        if (title && itemUrl) {
          results.push({
            title,
            url: itemUrl,
            source: 'bilibili',
            summary: item.description || item.content || '',
            score: (item.play || 0) + (item.danmaku || 0),
          })
        }
      }
    }

    console.log(`[bilibili] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[bilibili] fetch error:', err.message)
    return []
  }
}
