import cron from 'node-cron'
import { prisma } from '../db.ts'
import { emitNotificationCount, emitRealtime } from '../realtime.ts'
import { getActiveFetchers } from './fetchers/index.js'
import { batchAnalyze } from './ai.js'
import { sendDigestEmail } from './email.js'

let isRunning = false

const TIMEOUT_MS = 30_000
const HIGH_SCORE_THRESHOLD = 60

async function runFetchersStaggered(activeFetchers, keywordStrings) {
  const tiers = new Map()
  for (const fetcher of activeFetchers) {
    const tier = fetcher.tier || 1
    if (!tiers.has(tier)) tiers.set(tier, [])
    tiers.get(tier).push(fetcher)
  }

  const allItems = []
  const sortedTiers = [...tiers.keys()].sort()

  for (let index = 0; index < sortedTiers.length; index++) {
    const tierFetchers = tiers.get(sortedTiers[index])
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

    for (const result of results) {
      if (result.status === 'fulfilled') allItems.push(...result.value)
    }

    if (index < sortedTiers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
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
  emitRealtime('fetch:started', { timestamp: new Date().toISOString() })
  console.log(`[${new Date().toISOString()}] Starting fetch cycle...`)

  try {
    const keywords = await prisma.keyword.findMany({ where: { isActive: 1 } })

    if (keywords.length === 0) {
      console.log('No active keywords, skipping fetch')
      emitRealtime('fetch:completed', { savedCount: 0, notificationCount: 0 })
      return
    }

    const activeFetchers = getActiveFetchers()
    const keywordStrings = keywords.map((keyword) => keyword.keyword)

    const allItems = await runFetchersStaggered(activeFetchers, keywordStrings)
    console.log(`Fetched ${allItems.length} total items from ${activeFetchers.length} sources`)

    const keywordPatterns = keywords.map((keyword) => ({
      id: keyword.id,
      pattern: new RegExp(keyword.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    }))

    const matchedItems = allItems.filter((item) => {
      const text = `${item.title} ${item.summary || ''}`
      return keywordPatterns.some((keywordPattern) => keywordPattern.pattern.test(text))
    })

    console.log(`Matched ${matchedItems.length} items against keywords`)

    if (matchedItems.length === 0) {
      emitRealtime('fetch:completed', { savedCount: 0, notificationCount: 0 })
      return
    }

    const existingTopics = await prisma.hotTopic.findMany({
      where: { url: { in: matchedItems.map((item) => item.url).filter(Boolean) } },
      select: { url: true },
    })
    const existingUrls = new Set(existingTopics.map((topic) => topic.url))
    const newItems = matchedItems.filter((item) => item.url && !existingUrls.has(item.url))

    if (newItems.length === 0) {
      console.log('No new items to process')
      emitRealtime('fetch:completed', { savedCount: 0, notificationCount: 0 })
      return
    }

    const analyzed = await batchAnalyze(newItems)

    let savedCount = 0
    const highScoreTopics = []

    for (const item of analyzed) {
      const matchedKeyword = keywordPatterns.find((keywordPattern) =>
        keywordPattern.pattern.test(`${item.title} ${item.summary || ''}`)
      )

      if (item.isRelevant === false) continue

      const topic = await prisma.hotTopic.create({
        data: {
          title: item.title,
          url: item.url,
          source: item.source,
          summary: item.summary || '',
          aiScore: item.score || 0,
          aiAnalysis: item.analysis || '',
          keywordId: matchedKeyword?.id || null,
        },
      })

      emitRealtime('hot-topic:created', { id: topic.id })

      if ((item.score || 0) >= HIGH_SCORE_THRESHOLD) {
        const notification = await prisma.notification.create({
          data: { hotTopicId: topic.id },
          include: { hotTopic: true },
        })
        emitRealtime('notification:created', {
          id: notification.id,
          hot_topic_id: notification.hotTopicId,
          title: notification.hotTopic.title,
          url: notification.hotTopic.url,
          source: notification.hotTopic.source,
          ai_score: notification.hotTopic.aiScore,
          created_at: notification.createdAt,
        })
        highScoreTopics.push({ title: item.title, url: item.url, source: item.source, score: item.score })
      }
      savedCount++
    }

    await emitNotificationCount()
    console.log(`Saved ${savedCount} new topics`)

    if (highScoreTopics.length > 0) {
      await sendDigestEmail(highScoreTopics)
    }

    emitRealtime('fetch:completed', {
      savedCount,
      notificationCount: highScoreTopics.length,
    })
  } catch (err) {
    console.error('Fetch cycle error:', err)
    emitRealtime('fetch:error', { message: err.message })
  } finally {
    isRunning = false
  }
}

export function startScheduler() {
  const task = cron.schedule('*/30 * * * *', () => fetchAndAnalyze(), {
    name: 'hottrack-fetch-cycle',
    timezone: 'Asia/Shanghai',
    noOverlap: true,
  })

  task.execute()
  console.log('Scheduler started (every 30 minutes)')
}

export { fetchAndAnalyze }
