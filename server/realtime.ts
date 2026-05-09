import { Server } from 'socket.io'
import { prisma } from './db.ts'

let io: Server | null = null

export function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  })

  io.on('connection', (socket) => {
    socket.emit('server:ready', { timestamp: new Date().toISOString() })
  })

  return io
}

export function emitRealtime(event, payload = {}) {
  if (!io) return
  io.emit(event, payload)
}

export async function emitNotificationCount() {
  const unread = await prisma.notification.count({ where: { isRead: 0 } })
  emitRealtime('notification:count', { unread })
  return unread
}
