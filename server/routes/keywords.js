import { Router } from 'express'
import { prisma } from '../db.ts'
import { keywordToApi } from '../serializers.ts'

const router = Router()

router.get('/', async (req, res) => {
  const keywords = await prisma.keyword.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(keywords.map(keywordToApi))
})

router.post('/', async (req, res) => {
  const { keyword, category } = req.body
  const normalized = keyword?.trim()

  if (!normalized) {
    return res.status(400).json({ error: '关键词不能为空' })
  }

  const existing = await prisma.keyword.findUnique({ where: { keyword: normalized } })
  if (existing) {
    return res.status(409).json({ error: '关键词已存在' })
  }

  const created = await prisma.keyword.create({
    data: {
      keyword: normalized,
      category: category || 'general',
    },
  })
  res.status(201).json(keywordToApi(created))
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { keyword, category, is_active } = req.body
  const existing = await prisma.keyword.findUnique({ where: { id } })

  if (!existing) {
    return res.status(404).json({ error: '关键词不存在' })
  }

  const updated = await prisma.keyword.update({
    where: { id },
    data: {
      keyword: keyword ?? existing.keyword,
      category: category ?? existing.category,
      isActive: is_active === undefined ? existing.isActive : Number(Boolean(is_active)),
    },
  })
  res.json(keywordToApi(updated))
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.keyword.findUnique({ where: { id } })

  if (!existing) {
    return res.status(404).json({ error: '关键词不存在' })
  }

  await prisma.keyword.delete({ where: { id } })
  res.json({ message: '已删除' })
})

export default router
