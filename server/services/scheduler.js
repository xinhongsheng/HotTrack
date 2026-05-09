import cron from 'node-cron'
import { queryAll, queryOne, runSQL } from '../db.js'
import { fetchTopStories } from './fetchers/hackernews.js'
import { fetchTrending } from './fetchers/github.js'
import { batchAnalyze } from './ai.js'

let isRunning = false

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

    const [hnStories, ghRepos] = await Promise.all([
      fetchTopStories(30).catch(() => []),
      fetchTrending().catch(() => []),
    ])

    const allItems = [...hnStories, ...ghRepos]
    console.log(`Fetched ${allItems.length} items (${hnStories.length} HN, ${ghRepos.length} GH)`)

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
      }
      savedCount++
    }

    console.log(`Saved ${savedCount} new topics`)
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
