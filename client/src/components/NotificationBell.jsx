import { useEffect, useRef, useState } from 'react'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { api } from '../api'
import { socket } from '../realtime/socket'
import { SOURCE_META } from '../config/sources'

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sourceMeta(source) {
  return SOURCE_META[source] || {
    label: source || '未知来源',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.10)',
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef(null)

  const loadNotifications = async () => {
    try {
      const [items, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ])
      setNotifications(Array.isArray(items) ? items : [])
      setUnreadCount(count.unread || 0)
    } catch (err) {
      console.error('Notification load error:', err)
    }
  }

  useEffect(() => {
    loadNotifications()

    const refreshNotifications = () => loadNotifications()
    const updateCount = (payload = {}) => setUnreadCount(payload.unread || 0)

    socket.on('notification:created', refreshNotifications)
    socket.on('notification:count', updateCount)

    return () => {
      socket.off('notification:created', refreshNotifications)
      socket.off('notification:count', updateCount)
    }
  }, [])

  useEffect(() => {
    const handleClickAway = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickAway)
    return () => document.removeEventListener('mousedown', handleClickAway)
  }, [])

  const markAllRead = async () => {
    await api.markAllAsRead()
    await loadNotifications()
  }

  const markRead = async (id) => {
    await api.markAsRead(id)
    await loadNotifications()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-slate-200 transition hover:border-violet-300/30 hover:bg-violet-300/10"
        onClick={() => setOpen((value) => !value)}
        aria-label={`通知中心，${unreadCount} 条未读`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-[0_0_14px_rgba(244,63,94,0.7)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="panel-elevated animate-slide-in absolute right-0 top-[52px] z-[80] w-[min(380px,calc(100vw-24px))] rounded-xl p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-100">通知中心</p>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} 条未读消息` : '暂无未读消息'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-secondary min-h-8 px-2 text-xs"
                onClick={markAllRead}
              >
                <CheckCheck size={13} />
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.map((item) => {
                const meta = sourceMeta(item.source)
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border p-3"
                    style={{
                      background: item.is_read ? 'rgba(255,255,255,0.035)' : 'rgba(139,92,246,0.16)',
                      borderColor: item.is_read ? 'rgba(255,255,255,0.08)' : 'rgba(167,139,250,0.28)',
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="badge rounded-md" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-slate-500">{formatTime(item.created_at)}</span>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-bold leading-snug text-slate-100 transition hover:text-violet-200"
                    >
                      {item.title}
                      <ExternalLink size={11} className="ml-1 inline opacity-50" />
                    </a>

                    {!item.is_read && (
                      <button
                        type="button"
                        className="mt-2 text-xs font-bold text-violet-300 transition hover:text-violet-100"
                        onClick={() => markRead(item.id)}
                      >
                        标为已读
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="empty-state py-10">
                <Bell size={26} className="text-slate-600" />
                <p className="mt-3 text-sm text-slate-500">暂无通知</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
