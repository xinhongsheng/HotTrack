import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Flame, RadioTower, Tags, TrendingUp, Zap } from 'lucide-react'
import { api } from '../api'
import HotTopicCard from '../components/HotTopicCard'
import { CHART_COLORS, SOURCE_META } from '../config/sources'
import { socket } from '../realtime/socket'

const SOURCE_NAMES = Object.fromEntries(
  Object.entries(SOURCE_META).map(([key, value]) => [key, value.label])
)

const statCards = [
  { key: 'total', label: '总热点', helper: '多平台情报池', icon: Flame, color: '#8b5cf6' },
  { key: 'today', label: '今日新增', helper: '最近 24 小时', icon: Zap, color: '#67e8f9' },
  { key: 'urgent', label: '紧急热点', helper: 'AI 评分 85+', icon: RadioTower, color: '#fb7185' },
  { key: 'activeKeywords', label: '监控关键词', helper: '正在追踪', icon: Tags, color: '#86efac' },
]

function SkeletonCard() {
  return (
    <div className="panel rounded-xl p-5">
      <div className="skeleton mb-4 h-3 w-20" />
      <div className="skeleton h-9 w-16" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="panel rounded-xl p-5">
      <div className="skeleton mb-5 h-4 w-32" />
      <div className="skeleton h-[240px] w-full" />
    </div>
  )
}

function StatCard({ label, helper, value, icon: Icon, color }) {
  return (
    <div className="radar-card panel rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">{label}</p>
          <p className="metric-value mt-2 text-4xl font-bold" style={{ color }}>
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {helper}
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border bg-white/[0.035]" style={{ borderColor: `${color}40`, color }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

const chartTooltipStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  boxShadow: 'var(--shadow-md)',
}

function renderPieLabel({ name, value, x, y, textAnchor }) {
  return (
    <text x={x} y={y} fill="var(--text-secondary)" textAnchor={textAnchor} dominantBaseline="central" fontSize={11}>
      {`${name} ${value}`}
    </text>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [latest, setLatest] = useState([])
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [statsData, topicsData, keywordsData] = await Promise.all([
        api.getStats(),
        api.getHotTopics({ limit: 6, sort: 'score' }),
        api.getKeywords(),
      ])
      setStats(statsData)
      setLatest(topicsData)
      setKeywords(keywordsData)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const refreshData = () => loadData()
    socket.on('hot-topic:created', refreshData)
    socket.on('notification:created', refreshData)
    socket.on('fetch:completed', refreshData)
    window.addEventListener('hottrack:refresh', refreshData)

    return () => {
      socket.off('hot-topic:created', refreshData)
      socket.off('notification:created', refreshData)
      socket.off('fetch:completed', refreshData)
      window.removeEventListener('hottrack:refresh', refreshData)
    }
  }, [])

  const sourceData = stats?.bySource?.map((item) => ({
    name: SOURCE_NAMES[item.source] || item.source,
    value: item.count,
  })) || []

  const scoreDistribution = useMemo(() => [
    { range: '85+', count: latest.filter((item) => item.ai_score >= 85).length },
    { range: '70-84', count: latest.filter((item) => item.ai_score >= 70 && item.ai_score < 85).length },
    { range: '45-69', count: latest.filter((item) => item.ai_score >= 45 && item.ai_score < 70).length },
    { range: '<45', count: latest.filter((item) => item.ai_score < 45).length },
  ], [latest])

  const statValues = {
    total: stats?.total || 0,
    today: stats?.today || 0,
    urgent: latest.filter((topic) => topic.ai_score >= 85).length,
    activeKeywords: keywords.filter((keyword) => keyword.is_active).length,
  }

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? statCards.map((card) => <SkeletonCard key={card.key} />)
          : statCards.map((card) => (
            <StatCard
              key={card.key}
              label={card.label}
              helper={card.helper}
              value={statValues[card.key]}
              icon={card.icon}
              color={card.color}
            />
          ))}
      </div>

      <section className="panel rounded-xl p-5">
        <div className="mb-5 flex items-center gap-2">
          <Flame size={18} className="text-orange-400" />
          <h2 className="panel-title">高分热点 TOP {latest.length}</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl bg-white/[0.035] p-5">
                <div className="skeleton mb-3 h-4 w-32" />
                <div className="skeleton mb-2 h-4 w-full" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : latest.length > 0 ? (
          <div className="space-y-4">
            {latest.map((topic) => (
              <HotTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="empty-state py-14">
            <Flame size={34} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>暂无热点数据</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>添加关键词后，点击右上角“立即检查”开始采集。</p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {loading ? (
          <>
            <SkeletonChart />
            <SkeletonChart />
          </>
        ) : (
          <>
            <section className="panel rounded-xl p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="panel-title">来源分布</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>各平台热点信号占比</p>
                </div>
                <span className="badge bg-white/[0.04]" style={{ color: 'var(--text-secondary)' }}>
                  {sourceData.length} 源
                </span>
              </div>

              {sourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                      label={renderPieLabel}
                      labelLine={{ stroke: 'rgba(168,181,198,0.36)' }}
                    >
                      {sourceData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state h-[250px]">
                  <Flame size={30} style={{ color: 'var(--text-muted)' }} />
                  <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>暂无来源数据</p>
                </div>
              )}
            </section>

            <section className="panel rounded-xl p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="panel-title">热度评分分布</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>最近高分热点的 AI 评分区间</p>
                </div>
                <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} />
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" tick={{ fill: '#6f8092', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6f8092', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="var(--accent-green)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
