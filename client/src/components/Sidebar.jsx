import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Flame, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Radar, Settings, Tags } from 'lucide-react'
import { api } from '../api'
import { socket } from '../realtime/socket'

const navItems = [
  { path: '/', label: '情报总览', icon: LayoutDashboard },
  { path: '/keywords', label: '关键词', icon: Tags },
  { path: '/topics', label: '热点库', icon: Flame },
  { path: '/settings', label: '通知设置', icon: Settings },
]

export default function Sidebar({ open, onToggle }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getUnreadCount()
        setUnreadCount(data.unread || 0)
      } catch {}
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateUnread = (payload) => setUnreadCount(payload.unread || 0)
    socket.on('notification:count', updateUnread)
    return () => socket.off('notification:count', updateUnread)
  }, [])

  return (
    <aside
      aria-label="主导航"
      className={`glass fixed left-0 top-0 z-50 h-full transition-[width] duration-300 ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-3">
        <button
          onClick={onToggle}
          aria-label={open ? '收起侧边栏' : '展开侧边栏'}
          className="icon-btn"
          type="button"
        >
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>

        {open && (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative grid h-9 w-9 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10">
              <Radar size={20} style={{ color: 'var(--accent-green)' }} />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
            </div>
            <div className="min-w-0">
              <p className="metric-value truncate text-base font-bold">HotTrack</p>
              <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Live Intelligence
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="mt-5 px-2" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group relative mb-1 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors ${
                  isActive ? 'text-emerald-200' : 'hover:bg-white/[0.055]'
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'linear-gradient(90deg, rgba(52,211,153,0.18), rgba(56,189,248,0.08))' : 'transparent',
                border: isActive ? '1px solid rgba(52,211,153,0.2)' : '1px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              })}
            >
              <Icon size={18} className="shrink-0" />
              {open && <span className="truncate">{item.label}</span>}
              {item.path === '/topics' && unreadCount > 0 && open && (
                <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                  {unreadCount}
                </span>
              )}
              {!open && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  {item.label}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {open && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-breathe" />
              <span>监控任务运行中</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-md bg-black/20 px-2 py-1.5">
                <p style={{ color: 'var(--text-muted)' }}>状态</p>
                <p className="font-bold text-emerald-200">ONLINE</p>
              </div>
              <div className="rounded-md bg-black/20 px-2 py-1.5">
                <p style={{ color: 'var(--text-muted)' }}>未读</p>
                <p className="font-bold text-amber-200">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
