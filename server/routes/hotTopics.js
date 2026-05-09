import { Router } from 'express'
import { queryAll, queryOne } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { source, keyword_id, sort, limit } = req.query
  let sql = 'SELECT ht.*, k.keyword FROM hot_topics ht LEFT JOIN keywords k ON ht.keyword_id = k.id WHERE 1=1'
  const params = []

  if (source) {
    sql += ' AND ht.source = ?'
    params.push(source)
  }
  if (keyword_id) {
    sql += ' AND ht.keyword_id = ?'
    params.push(keyword_id)
  }

  sql += sort === 'score' ? ' ORDER BY ht.ai_score DESC' : ' ORDER BY ht.fetched_at DESC'
  sql += ' LIMIT ?'
  params.push(parseInt(limit) || 50)

  const topics = queryAll(sql, params)
  res.json(topics)
})

router.get('/stats', (req, res) => {
  const total = queryOne('SELECT COUNT(*) as count FROM hot_topics')
  const today = queryOne("SELECT COUNT(*) as count FROM hot_topics WHERE fetched_at >= date('now')")
  const bySource = queryAll('SELECT source, COUNT(*) as count FROM hot_topics GROUP BY source')
  const avgScore = queryOne('SELECT AVG(ai_score) as avg FROM hot_topics WHERE ai_score > 0')
  res.json({
    total: total?.count || 0,
    today: today?.count || 0,
    bySource,
    avgScore: Math.round(avgScore?.avg || 0),
  })
})

router.get('/:id', (req, res) => {
  const topic = queryOne(
    'SELECT ht.*, k.keyword FROM hot_topics ht LEFT JOIN keywords k ON ht.keyword_id = k.id WHERE ht.id = ?',
    [req.params.id]
  )
  if (!topic) {
    return res.status(404).json({ error: '热点不存在' })
  }
  res.json(topic)
})

export default router
