import { Router } from 'express'
import { prisma } from '../db.ts'
import { topicToApi } from '../serializers.ts'

const router = Router()

router.get('/', async (req, res) => {
  const { source, keyword_id, sort, limit } = req.query
  const where = {}

  if (source) where.source = String(source)
  if (keyword_id) where.keywordId = Number(keyword_id)

  const topics = await prisma.hotTopic.findMany({
    where,
    include: { keyword: true },
    orderBy: sort === 'score' ? { aiScore: 'desc' } : { fetchedAt: 'desc' },
    take: Number(limit) || 50,
  })

  res.json(topics.map(topicToApi))
})

router.get('/stats', async (req, res) => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [total, today, bySource, avgScore] = await Promise.all([
    prisma.hotTopic.count(),
    prisma.hotTopic.count({ where: { fetchedAt: { gte: startOfToday } } }),
    prisma.hotTopic.groupBy({
      by: ['source'],
      _count: { source: true },
    }),
    prisma.hotTopic.aggregate({
      _avg: { aiScore: true },
      where: { aiScore: { gt: 0 } },
    }),
  ])

  res.json({
    total,
    today,
    bySource: bySource.map((item) => ({ source: item.source, count: item._count.source })),
    avgScore: Math.round(avgScore._avg.aiScore || 0),
  })
})

router.get('/:id', async (req, res) => {
  const topic = await prisma.hotTopic.findUnique({
    where: { id: Number(req.params.id) },
    include: { keyword: true },
  })

  if (!topic) {
    return res.status(404).json({ error: '热点不存在' })
  }

  res.json(topicToApi(topic))
})

export default router
