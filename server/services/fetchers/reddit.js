import { createRateLimiter, fetchWithRetry } from './utils.js'

const limiter = createRateLimiter({ tokensPerInterval: 10, interval: 'minute' })

export async function searchReddit(keywords = []) {
  const query = keywords.join(' ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=day&limit=25`
    const res = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'HotTrack/1.0 (https://github.com/hottrack)',
      },
    })

    if (!res.ok) {
      console.warn(`[reddit] returned ${res.status}`)
      return []
    }

    const json = await res.json()
    const children = json?.data?.children || []

    const results = children
      .map((child) => {
        const post = child.data
        if (!post?.title) return null

        const postUrl = post.url?.startsWith('http')
          ? post.url
          : `https://www.reddit.com${post.permalink}`

        return {
          title: post.title,
          url: postUrl,
          source: 'reddit',
          summary: (post.selftext || '').slice(0, 300),
          score: (post.score || 0) + (post.num_comments || 0) * 2,
        }
      })
      .filter(Boolean)

    console.log(`[reddit] fetched ${results.length} items`)
    return results
  } catch (err) {
    console.error('[reddit] fetch error:', err.message)
    return []
  }
}
