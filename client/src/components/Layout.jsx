import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Flame, RefreshCw } from 'lucide-react'
import { api } from '../api'
import NotificationBell from './NotificationBell'

const navItems = [
  { path: '/', label: '仪表盘', end: true },
  { path: '/keywords', label: '关键词' },
  { path: '/topics', label: '搜索' },
  { path: '/settings', label: '设置' },
]

export default function Layout({ children }) {
  const [checking, setChecking] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    try {
      await api.triggerFetch()
    } catch (err) {
      console.error('Fetch trigger error:', err)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh">
      <header className="relative z-40 border-b border-violet-300/12 bg-[#09080f]/92 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[144px] w-full max-w-[1500px] flex-col justify-between gap-5 px-4 py-3 sm:px-6 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 shadow-[0_0_24px_rgba(139,92,246,0.35)]">
                <Flame size={24} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-violet-300">热点监控</p>
                <p className="truncate text-sm text-slate-500">AI 实时热点追踪</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCheck}
                disabled={checking}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                {checking ? '检查中' : '立即检查'}
              </button>
              <NotificationBell />
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg border px-5 py-2.5 text-sm font-bold transition ${
                    isActive
                      ? 'border-violet-400/45 bg-violet-500/22 text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.16)]'
                      : 'border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
