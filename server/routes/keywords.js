import { Router } from 'express'
import { queryAll, queryOne, runSQL } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const keywords = queryAll('SELECT * FROM keywords ORDER BY created_at DESC')
  res.json(keywords)
})

router.post('/', (req, res) => {
  const { keyword, category } = req.body
  if (!keyword?.trim()) {
    return res.status(400).json({ error: '关键词不能为空' })
  }
  const existing = queryOne('SELECT id FROM keywords WHERE keyword = ?', [keyword.trim()])
  if (existing) {
    return res.status(409).json({ error: '关键词已存在' })
  }
  runSQL('INSERT INTO keywords (keyword, category) VALUES (?, ?)', [keyword.trim(), category || 'general'])
  const newKeyword = queryOne('SELECT * FROM keywords WHERE keyword = ?', [keyword.trim()])
  res.status(201).json(newKeyword)
})

router.put('/:id', (req, res) => {
  const { keyword, category, is_active } = req.body
  const existing = queryOne('SELECT * FROM keywords WHERE id = ?', [req.params.id])
  if (!existing) {
    return res.status(404).json({ error: '关键词不存在' })
  }
  runSQL('UPDATE keywords SET keyword = ?, category = ?, is_active = ? WHERE id = ?', [
    keyword ?? existing.keyword,
    category ?? existing.category,
    is_active ?? existing.is_active,
    req.params.id,
  ])
  const updated = queryOne('SELECT * FROM keywords WHERE id = ?', [req.params.id])
  res.json(updated)
})

router.delete('/:id', (req, res) => {
  const existing = queryOne('SELECT * FROM keywords WHERE id = ?', [req.params.id])
  if (!existing) {
    return res.status(404).json({ error: '关键词不存在' })
  }
  runSQL('DELETE FROM keywords WHERE id = ?', [req.params.id])
  res.json({ message: '已删除' })
})

export default router
