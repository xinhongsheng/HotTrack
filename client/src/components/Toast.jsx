import { useCallback, useEffect, useState } from 'react'
import { Radar, X } from 'lucide-react'
import { api } from '../api'

export default function Toast() {
  const [toasts, setToasts] = useState([])
  const [lastCheck, setLastCheck] = useState(null)

  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...notification }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  useEffect(() => {
    const checkNew = async () => {
      try {
        const notifications = await api.getNotifications(true)
        const newOnes = lastCheck
          ? notifications.filter((item) => new Date(item.created_at) > new Date(lastCheck))
          : []

        for (const notification of newOnes) {
          addToast(notification)

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('HotTrack 发现新热点', {
              body: notification.title,
              icon: '/vite.svg',
            })
          }
        }

        setLastCheck(new Date().toISOString())
      } catch {}
    }

    checkNew()
    const interval = setInterval(checkNew, 30000)
    return () => clearInterval(interval)
  }, [lastCheck, addToast])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed right-4 top-4 z-[100] flex w-[calc(100vw-32px)] max-w-sm flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in glass-elevated rounded-xl p-4"
          style={{ borderColor: 'rgba(52,211,153,0.24)' }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-300/10 text-emerald-200">
              <Radar size={15} className="animate-breathe" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-bold" style={{ color: 'var(--accent-green)' }}>
                新热点信号
              </p>
              <a
                href={toast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-sm transition-colors hover:text-emerald-200"
                style={{ color: 'var(--text-primary)' }}
              >
                {toast.title}
              </a>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              className="icon-btn h-8 min-h-8 min-w-8"
              aria-label="关闭通知"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
