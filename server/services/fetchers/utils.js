import fetch from 'node-fetch'

// --- User-Agent Rotation ---
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:126.0) Gecko/20100101 Firefox/126.0',
]

export function getRandomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// --- Token Bucket Rate Limiter ---
export function createRateLimiter({ tokensPerInterval, interval }) {
  const intervalMs = interval === 'minute' ? 60_000 : interval === 'second' ? 1_000 : interval
  let tokens = tokensPerInterval
  let lastRefill = Date.now()

  function refill() {
    const now = Date.now()
    const elapsed = now - lastRefill
    if (elapsed >= intervalMs) {
      tokens = tokensPerInterval
      lastRefill = now
    }
  }

  return {
    async removeTokens(count = 1) {
      refill()
      if (tokens >= count) {
        tokens -= count
        return
      }
      // Wait until next refill
      const waitMs = intervalMs - (Date.now() - lastRefill)
      await new Promise((r) => setTimeout(r, Math.max(waitMs, 100)))
      refill()
      tokens -= count
    },
  }
}

// --- Fetch with Retry ---
export async function fetchWithRetry(url, options = {}, { retries = 3, backoffMs = 1000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15_000),
      })

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10)
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, retryAfter * 1000))
          continue
        }
        return res
      }

      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)))
        continue
      }

      return res
    } catch (err) {
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)))
        continue
      }
      throw err
    }
  }
}

// --- Search Score Estimation ---
export function estimateSearchScore(title, snippet, keywords) {
  let score = 30
  const text = `${title} ${snippet}`.toLowerCase()

  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    const matches = text.match(regex)
    if (matches) score += matches.length * 10
  }

  const recencyWords = ['today', 'breaking', 'just', 'new', 'launch', 'released', '今天', '刚刚', '发布', '最新']
  for (const w of recencyWords) {
    if (text.includes(w)) score += 5
  }

  return Math.min(100, score)
}
