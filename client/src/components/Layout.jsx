import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Flame, LayoutDashboard, RadioTower, RefreshCw, Settings, Tags } from 'lucide-react'
import { api } from '../api'
import BackgroundBeams from './ui/BackgroundBeams'
import Spotlight from './ui/Spotlight'
import NotificationBell from './NotificationBell'

const navItems = [
  { path: '/', label: '情报总览', icon: LayoutDashboard, end: true },
  { path: '/keywords', label: '关键词', icon: Tags },
  { path: '/topics', label: '热点库', icon: Flame },
  { path: '/settings', label: '设置', icon: Settings },
]

export default function Layout({ children }) {
  const [checking, setChecking] = useState(false)

  const handleCheck = async () => {
    setChecking(true)
    try {
      await api.triggerFetch()
      window.dispatchEvent(new Event('hottrack:refresh'))
    } catch (err) {
      console.error('Fetch trigger error:', err)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh">
      <Spotlight />
      <BackgroundBeams className="opacity-60" />

      <header className="relative z-40 border-b border-white/10 bg-[#030507]/80 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-4 py-4 sm:px-6 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-teal-200/20 bg-teal-300/10 shadow-[0_0_34px_rgba(45,212,191,0.20)]">
                <RadioTower size={23} className="text-teal-200" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.95)]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xl font-bold text-slate-50">HotTrack</p>
                  <span className="badge border border-teal-200/20 bg-teal-300/10 text-teal-100">Creator Signal OS</span>
                </div>
                <p className="truncate text-sm text-slate-400">
                  第一时间捕捉 AI、技术与创作机会，把热点变成选题。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-slate-400 md:flex">
                <span className="h-2 w-2 rounded-full bg-teal-300 animate-breathe" />
                Live intelligence online
              </div>
              <button
                type="button"
                onClick={handleCheck}
                disabled={checking}
                className="btn-primary px-5 text-sm"
              >
                <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                {checking ? '正在扫描' : '立即扫描'}
              </button>
              <NotificationBell />
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2" aria-label="主导航">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                      isActive
                        ? 'border-teal-200/30 bg-teal-300/12 text-teal-50 shadow-[0_0_22px_rgba(45,212,191,0.12)]'
                        : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.045] hover:text-slate-200'
                    }`
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto w-full max-w-[1520px] px-4 py-7 sm:px-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
