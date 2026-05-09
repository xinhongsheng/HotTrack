import { Router } from 'express'
import { prisma } from '../db.ts'
import { emitNotificationCount } from '../realtime.ts'
import { notificationToApi } from '../serializers.ts'

const router = Router()

router.get('/', async (req, res) => {
  const { unread_only } = req.query
  const notifications = await prisma.notification.findMany({
    where: unread_only === 'true' ? { isRead: 0 } : undefined,
    include: { hotTopic: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json(notifications.map(notificationToApi))
})

router.get('/count', async (req, res) => {
  const unread = await prisma.notification.count({ where: { isRead: 0 } })
  res.json({ unread })
})

router.put('/:id/read', async (req, res) => {
  await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { isRead: 1 },
  })
  await emitNotificationCount()
  res.json({ message: '已标记已读' })
})

router.put('/read-all', async (req, res) => {
  await prisma.notification.updateMany({
    where: { isRead: 0 },
    data: { isRead: 1 },
  })
  await emitNotificationCount()
  res.json({ message: '全部已读' })
})

export default router
