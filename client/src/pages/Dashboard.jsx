import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart3, TrendingUp, Tags, Zap, RefreshCw, Flame, Radar } from 'lucide-react'
import { api } from '../api'
import HotTopicCard from '../components/HotTopicCard'

const CHART_COLORS = ['#f59e0b', '#a855f7', '#3b82f6', '#22c55e']

const statCards = [
  { key: 'total', label: '热点总数', icon: Flame, color: 'var(--accent-blue)', getColor: () => 'var(--accent-blue)' },
  { key: 'today', label: '今日新增', icon: Zap, color: 'var(--accent-green)', getColor: () => 'var(--accent-green)' },
  { key: 'activeKeywords', label: '活跃关键词', icon: Tags, color: 'var(--accent-orange)', getColor: () => 'var(--accent-orange)' },
  { key: 'avgScore', label: '平均热度', icon: TrendingUp, color: 'var(--accent-purple)', getColor: () => 'var(--accent-purple)' },
]

function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-16" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="skeleton h-3 w-28 mb-4" />
      <div className="skeleton h-[200px] w-full" />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="glass rounded-xl p-5 relative overflow-hidden group card-interactive">
      <div
        className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ color }}
      >
        <Icon size={28} />
      </div>
      <p className="section-title">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color, fontFamily: 'var(--font-mono)' }}>
        {value}
      </p>
    </div>
  )
}

const chartTooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: '12px',
  fontFamily: 'var(--font-sans)',
  boxShadow: 'var(--shadow-md)',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [latest, setLatest] = useState([])
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    try {
      const [s, t, k] = await Promise.all([
        api.getStats(),
        api.getHotTopics({ limit: 6, sort: 'score' }),
        api.getKeywords(),
      ])
      setStats(s)
      setLatest(t)
      setKeywords(k)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.triggerFetch()
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const sourceData = stats?.bySource?.map((s) => ({
    name: s.source === 'hackernews' ? 'Hacker News' : 'GitHub',
    value: s.count,
  })) || []

  const scoreDistribution = [
    { range: '80-100', count: latest.filter((t) => t.ai_score >= 80).length },
    { range: '60-79', count: latest.filter((t) => t.ai_score >= 60 && t.ai_score < 80).length },
    { range: '40-59', count: latest.filter((t) => t.ai_score >= 40 && t.ai_score < 60).length },
    { range: '0-39', count: latest.filter((t) => t.ai_score < 40).length },
  ]

  const statValues = {
    total: stats?.total || 0,
    today: stats?.today || 0,
    activeKeywords: keywords.filter((k) => k.is_active).length,
    avgScore: stats?.avgScore || 0,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Radar size={22} style={{ color: 'var(--accent-blue)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>雷达仪表盘</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>实时热点监控概览</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '抓取中...' : '立即抓取'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          statCards.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              value={statValues[card.key]}
              icon={card.icon}
              color={card.color}
            />
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            {/* Source Distribution */}
            <div className="glass rounded-xl p-5">
              <h3 className="section-title mb-4">数据来源分布</h3>
              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      style={{ fontSize: '11px', fill: 'var(--text-secondary)' }}
                    >
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  暂无数据
                </div>
              )}
            </div>

            {/* Score Distribution */}
            <div className="glass rounded-xl p-5">
              <h3 className="section-title mb-4">热度评分分布</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Latest Hot Topics */}
      <div>
        <h3 className="section-title mb-4">高分热点 TOP {latest.length}</h3>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-5">
                <div className="skeleton h-3 w-16 mb-3" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-3" />
                <div className="skeleton h-3 w-full mb-1" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : latest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {latest.map((topic) => (
              <HotTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl empty-state" style={{ minHeight: '200px' }}>
            <Flame size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>暂无热点数据</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>请先添加关键词，然后点击"立即抓取"</p>
          </div>
        )}
      </div>
    </div>
  )
}
