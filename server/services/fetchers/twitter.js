import fetch from 'node-fetch'
import { createRateLimiter, fetchWithRetry } from './utils.js'

const BASE_URL = process.env.TWITTER_API_BASE_URL || 'https://api.twitterapi.io'
const limiter = createRateLimiter({ tokensPerInterval: 15, interval: 'minute' })

function formatSearchTerm(keyword) {
  const trimmed = String(keyword || '').trim()
  if (!trimmed) return ''
  return /\s/.test(trimmed) ? `"${trimmed.replace(/"/g, '\\"')}"` : trimmed
}

export function buildTwitterSearchQuery(keywords = []) {
  const terms = keywords.map(formatSearchTerm).filter(Boolean)
  if (terms.length === 0) return ''

  const sinceTime = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000)
  return `(${terms.join(' OR ')}) since_time:${sinceTime} min_faves:5 -is:reply`
}

export function normalizeTweet(tweet) {
  const text = tweet.text || tweet.full_text || ''
  const id = tweet.id_str || tweet.id
  const url = tweet.url || (id ? `https://x.com/i/status/${id}` : '')
  const likeCount = tweet.likeCount ?? tweet.favorite_count ?? tweet.public_metrics?.like_count ?? 0
  const retweetCount = tweet.retweetCount ?? tweet.retweet_count ?? tweet.public_metrics?.retweet_count ?? 0
  const replyCount = tweet.replyCount ?? tweet.public_metrics?.reply_count ?? 0
  const quoteCount = tweet.quoteCount ?? tweet.public_metrics?.quote_count ?? 0

  return {
    title: text.slice(0, 140) || url,
    url,
    source: 'twitter',
    summary: text,
    score: likeCount + retweetCount * 2 + replyCount + quoteCount,
  }
}

export async function searchTwitter(keywords = []) {
  const API_KEY = process.env.TWITTER_API_KEY || process.env.TWITTERAPI_IO_KEY
  if (!API_KEY) {
    console.warn('[twitter] TWITTER_API_KEY is not configured, skipping')
    return []
  }

  const query = buildTwitterSearchQuery(keywords)
  if (!query) return []

  try {
    await limiter.removeTokens(1)

    const params = new URLSearchParams({
      query,
      queryType: 'Latest',
    })
    const url = `${BASE_URL}/twitter/tweet/advanced_search?${params.toString()}`
    const res = await fetchWithRetry(url, {
      headers: { 'X-API-Key': API_KEY },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[twitter] API returned ${res.status}: ${body.slice(0, 200)}`)
      return []
    }

    const data = await res.json()
    const tweets = data.tweets || data.statuses || data.data || []

    return tweets
      .map((tweet) => ({ ...normalizeTweet(tweet), isReply: Boolean(tweet.in_reply_to_status_id || tweet.in_reply_to_id || tweet.isReply) }))
      .filter((item) => item.title && item.url && !item.isReply && item.score >= 5)
      .map(({ isReply, ...item }) => item)
  } catch (err) {
    console.error('[twitter] fetch error:', err.message)
    return []
  }
}
