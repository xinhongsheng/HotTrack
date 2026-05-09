import { useState, useEffect, useCallback } from 'react'
import { X, Radar } from 'lucide-react'
import { api } from '../api'

export default function Toast() {
  const [toasts, setToasts] = useState([])
  const [lastCheck, setLastCheck] = useState(null)

  const addToast = useCallback((notification) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, ...notification }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  useEffect(() => {
    const checkNew = async () => {
      try {
        const notifications = await api.getNotifications(true)
        const newOnes = lastCheck
          ? notifications.filter((n) => new Date(n.created_at) > new Date(lastCheck))
          : []

        for (const n of newOnes) {
          addToast(n)

          if (Notification.permission === 'granted') {
            new Notification('HotTrack 新热点', {
              body: n.title,
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
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-in glass-elevated rounded-xl p-4"
          style={{ borderColor: 'rgba(59,130,246,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Radar size={14} style={{ color: 'var(--accent-blue)' }} className="animate-breathe" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--accent-blue)' }}>新热点发现</p>
              <a
                href={toast.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-blue-400 transition-colors line-clamp-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {toast.title}
              </a>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
              aria-label="关闭通知"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
