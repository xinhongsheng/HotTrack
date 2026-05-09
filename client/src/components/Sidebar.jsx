import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Tags, Flame, Settings, PanelLeftClose, PanelLeftOpen, Radar } from 'lucide-react'
import { api } from '../api'

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/keywords', label: '关键词', icon: Tags },
  { path: '/topics', label: '热点', icon: Flame },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Sidebar({ open, onToggle }) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getUnreadCount()
        setUnreadCount(data.unread)
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <aside
      aria-label="主导航"
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 glass ${
        open ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-white/5">
        <button
          onClick={onToggle}
          aria-label={open ? '收起侧边栏' : '展开侧边栏'}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        {open && (
          <div className="ml-3 flex items-center gap-2.5">
            <div className="relative">
              <Radar size={20} style={{ color: 'var(--accent-blue)' }} />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-glow" style={{ background: 'var(--accent-blue)' }} />
            </div>
            <span className="font-bold text-lg tracking-wide" style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
              HotTrack
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-2" role="navigation">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'text-blue-400'
                    : 'hover:bg-white/5'
                }`
              }
              style={({ isActive }) => isActive ? { background: 'var(--accent-blue-dim)' } : { color: 'var(--text-secondary)' }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {open && <span className="text-sm font-medium">{item.label}</span>}
              {!open && (
                <div
                  role="tooltip"
                  className="absolute left-full ml-2 px-2 py-1 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}
                >
                  {item.label}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Status */}
      {open && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-breathe" style={{ background: 'var(--accent-green)' }} />
              <span>监控运行中</span>
            </div>
            {unreadCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span
                  className="badge"
                  style={{ background: 'var(--accent-orange-dim)', color: 'var(--accent-orange)' }}
                >
                  {unreadCount}
                </span>
                <span style={{ color: 'var(--accent-orange)' }}>条新通知</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
