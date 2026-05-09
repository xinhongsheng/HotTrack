import fetch from 'node-fetch'
import { createRateLimiter, fetchWithRetry } from './utils.js'

const API_KEY = process.env.TWITTER_API_KEY
const BASE_URL = process.env.TWITTER_API_BASE_URL || 'https://api.twitterapi.io'
const limiter = createRateLimiter({ tokensPerInterval: 15, interval: 'minute' })

export async function searchTwitter(keywords = []) {
  if (!API_KEY) return []

  const query = keywords.join(' OR ')
  if (!query.trim()) return []

  try {
    await limiter.removeTokens(1)

    const url = `${BASE_URL}/twitter/search/tweets?query=${encodeURIComponent(query)}&count=20`
    const res = await fetchWithRetry(url, {
      headers: { 'x-api-key': API_KEY },
    })

    if (!res.ok) {
      console.warn(`[twitter] API returned ${res.status}`)
      return []
    }

    const data = await res.json()
    const tweets = data.tweets || data.statuses || data.data || []

    return tweets.map((t) => ({
      title: (t.text || t.full_text || '').slice(0, 120),
      url: `https://x.com/i/status/${t.id_str || t.id}`,
      source: 'twitter',
      summary: t.text || t.full_text || '',
      score: (t.favorite_count || t.public_metrics?.like_count || 0) +
             (t.retweet_count || t.public_metrics?.retweet_count || 0) * 2,
    }))
  } catch (err) {
    console.error('[twitter] fetch error:', err.message)
    return []
  }
}
