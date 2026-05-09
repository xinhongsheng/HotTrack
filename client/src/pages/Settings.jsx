import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Bell, BellOff, CheckCircle2, Info, Radar, ExternalLink } from 'lucide-react'
import { api } from '../api'

export default function Settings() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPermission, setNotifPermission] = useState('default')

  useEffect(() => {
    loadNotifications()
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        api.getNotifications(),
        api.getUnreadCount(),
      ])
      setNotifications(notifs)
      setUnreadCount(count.unread)
    } catch {}
  }

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
    }
  }

  const handleMarkRead = async (id) => {
    await api.markAsRead(id)
    loadNotifications()
  }

  const handleMarkAllRead = async () => {
    await api.markAllAsRead()
    loadNotifications()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <SettingsIcon size={22} style={{ color: 'var(--accent-blue)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>设置</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>系统配置与通知管理</p>
      </div>

      {/* Notification Settings */}
      <div className="glass rounded-xl p-5">
        <h3 className="section-title mb-4">通知设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifPermission === 'granted' ? (
                <Bell size={18} style={{ color: 'var(--accent-green)' }} />
              ) : (
                <BellOff size={18} style={{ color: 'var(--text-muted)' }} />
              )}
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>浏览器通知</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>当发现新的高分热点时弹出桌面通知</p>
              </div>
            </div>
            {notifPermission === 'granted' ? (
              <span
                className="badge text-xs px-3 py-1"
                style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <CheckCircle2 size={12} className="mr-1" />
                已开启
              </span>
            ) : (
              <button
                onClick={requestNotifPermission}
                className="btn-primary px-4 py-1.5 text-xs"
              >
                开启通知
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title flex items-center gap-2" style={{ margin: 0 }}>
            通知记录
            {unreadCount > 0 && (
              <span
                className="badge"
                style={{ background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)' }}
              >
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs cursor-pointer transition-colors"
              style={{ color: 'var(--accent-blue)' }}
              onMouseEnter={(e) => e.target.style.color = '#60a5fa'}
              onMouseLeave={(e) => e.target.style.color = 'var(--accent-blue)'}
            >
              全部已读
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-lg transition-all"
                style={{
                  background: n.is_read ? 'rgba(255,255,255,0.02)' : 'var(--accent-blue-dim)',
                  border: n.is_read ? '1px solid transparent' : '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="badge"
                        style={{
                          background: n.source === 'hackernews' ? 'var(--accent-orange-dim)' : 'var(--accent-purple-dim)',
                          color: n.source === 'hackernews' ? 'var(--accent-orange)' : 'var(--accent-purple)',
                        }}
                      >
                        {n.source === 'hackernews' ? 'HN' : 'GH'}
                      </span>
                      {!n.is_read && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-blue)' }} />
                      )}
                    </div>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-blue-400 transition-colors line-clamp-1 flex items-center gap-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {n.title}
                      <ExternalLink size={10} className="flex-shrink-0 opacity-40" />
                    </a>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="text-xs flex-shrink-0 cursor-pointer transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                      已读
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Bell size={24} style={{ color: 'var(--text-muted)', opacity: 0.3 }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>暂无通知</p>
          </div>
        )}
      </div>

      {/* About */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} style={{ color: 'var(--text-muted)' }} />
          <h3 className="section-title" style={{ margin: 0 }}>关于</h3>
        </div>
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <Radar size={14} style={{ color: 'var(--accent-blue)' }} />
            <span>HotTrack v1.0.0 - 行业热点雷达</span>
          </div>
          <p>数据来源: Hacker News API、GitHub Trending</p>
          <p>AI 分析: OpenRouter API</p>
          <p>抓取频率: 每 30 分钟自动抓取</p>
        </div>
      </div>
    </div>
  )
}
