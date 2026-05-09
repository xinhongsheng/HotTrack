import cron from 'node-cron'
import { queryAll, queryOne, runSQL } from '../db.js'
import { getActiveFetchers } from './fetchers/index.js'
import { batchAnalyze } from './ai.js'
import { sendDigestEmail } from './email.js'

let isRunning = false

const TIMEOUT_MS = 30_000

async function runFetchersStaggered(activeFetchers, keywordStrings) {
  // Group by tier for staggered execution
  const tiers = new Map()
  for (const f of activeFetchers) {
    const tier = f.tier || 1
    if (!tiers.has(tier)) tiers.set(tier, [])
    tiers.get(tier).push(f)
  }

  const allItems = []
  const sortedTiers = [...tiers.keys()].sort()

  for (let i = 0; i < sortedTiers.length; i++) {
    const tierFetchers = tiers.get(sortedTiers[i])
    const results = await Promise.allSettled(
      tierFetchers.map(async (fetcher) => {
        try {
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS)
          )
          const items = await Promise.race([fetcher.fetchFn(keywordStrings), timeout])
          console.log(`[${fetcher.name}] fetched ${items.length} items`)
          return items
        } catch (err) {
          console.error(`[${fetcher.name}] fetch error:`, err.message)
          return []
        }
      })
    )

    for (const r of results) {
      if (r.status === 'fulfilled') allItems.push(...r.value)
    }

    // Stagger between tiers (except last)
    if (i < sortedTiers.length - 1) {
      await new Promise((r) => setTimeout(r, 3000))
    }
  }

  return allItems
}

async function fetchAndAnalyze() {
  if (isRunning) {
    console.log('Fetch already in progress, skipping...')
    return
  }

  isRunning = true
  console.log(`[${new Date().toISOString()}] Starting fetch cycle...`)

  try {
    const keywords = queryAll('SELECT * FROM keywords WHERE is_active = 1')

    if (keywords.length === 0) {
      console.log('No active keywords, skipping fetch')
      return
    }

    const activeFetchers = getActiveFetchers()
    const keywordStrings = keywords.map((k) => k.keyword)

    const allItems = await runFetchersStaggered(activeFetchers, keywordStrings)
    console.log(`Fetched ${allItems.length} total items from ${activeFetchers.length} sources`)

    const keywordPatterns = keywords.map((k) => ({
      id: k.id,
      pattern: new RegExp(k.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    }))

    const matchedItems = allItems.filter((item) => {
      const text = `${item.title} ${item.summary || ''}`
      return keywordPatterns.some((kp) => kp.pattern.test(text))
    })

    console.log(`Matched ${matchedItems.length} items against keywords`)

    if (matchedItems.length === 0) return

    const existingUrls = new Set(queryAll('SELECT url FROM hot_topics').map((r) => r.url))
    const newItems = matchedItems.filter((item) => !existingUrls.has(item.url))

    if (newItems.length === 0) {
      console.log('No new items to process')
      return
    }

    const analyzed = await batchAnalyze(newItems)

    let savedCount = 0
    const highScoreTopics = []

    for (const item of analyzed) {
      const matchedKw = keywordPatterns.find((kp) =>
        kp.pattern.test(`${item.title} ${item.summary || ''}`)
      )

      if (item.isRelevant === false) continue

      runSQL(
        'INSERT INTO hot_topics (title, url, source, summary, ai_score, ai_analysis, keyword_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.title, item.url, item.source, item.summary || '', item.score || 0, item.analysis || '', matchedKw?.id || null]
      )

      const newTopic = queryOne('SELECT id FROM hot_topics WHERE url = ?', [item.url])
      if (newTopic && item.score >= 60) {
        runSQL('INSERT INTO notifications (hot_topic_id) VALUES (?)', [newTopic.id])
        highScoreTopics.push({ title: item.title, url: item.url, source: item.source, score: item.score })
      }
      savedCount++
    }

    console.log(`Saved ${savedCount} new topics`)

    if (highScoreTopics.length > 0) {
      await sendDigestEmail(highScoreTopics)
    }
  } catch (err) {
    console.error('Fetch cycle error:', err)
  } finally {
    isRunning = false
  }
}

export function startScheduler() {
  fetchAndAnalyze()

  cron.schedule('*/30 * * * *', () => {
    fetchAndAnalyze()
  })

  console.log('Scheduler started (every 30 minutes)')
}

export { fetchAndAnalyze }
