import { Router } from 'express'
import { queryAll, queryOne, runSQL } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const { unread_only } = req.query
  let sql = `SELECT n.*, ht.title, ht.url, ht.source, ht.ai_score
    FROM notifications n
    JOIN hot_topics ht ON n.hot_topic_id = ht.id`
  if (unread_only === 'true') {
    sql += ' WHERE n.is_read = 0'
  }
  sql += ' ORDER BY n.created_at DESC LIMIT 50'
  const notifications = queryAll(sql)
  res.json(notifications)
})

router.get('/count', (req, res) => {
  const result = queryOne('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0')
  res.json({ unread: result?.count || 0 })
})

router.put('/:id/read', (req, res) => {
  runSQL('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id])
  res.json({ message: '已标记已读' })
})

router.put('/read-all', (req, res) => {
  runSQL('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
  res.json({ message: '全部已读' })
})

export default router
