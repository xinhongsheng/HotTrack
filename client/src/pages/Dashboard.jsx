import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Flame, Radar, RefreshCw, Tags, TrendingUp, Zap } from 'lucide-react'
import { api } from '../api'
import HotTopicCard from '../components/HotTopicCard'
import { CHART_COLORS, SOURCE_META } from '../config/sources'

const SOURCE_NAMES = Object.fromEntries(
  Object.entries(SOURCE_META).map(([key, value]) => [key, value.label])
)

const statCards = [
  { key: 'total', label: '热点总数', helper: '累计捕获信号', icon: Flame, color: 'var(--accent-blue)' },
  { key: 'today', label: '今日新增', helper: '最近 24 小时', icon: Zap, color: 'var(--accent-green)' },
  { key: 'activeKeywords', label: '监控关键词', helper: '正在运行', icon: Tags, color: 'var(--accent-orange)' },
  { key: 'avgScore', label: '平均热度', helper: 'AI 评分均值', icon: TrendingUp, color: 'var(--accent-purple)' },
]

function SkeletonCard() {
  return (
    <div className="panel rounded-xl p-5">
      <div className="skeleton mb-4 h-3 w-24" />
      <div className="skeleton h-9 w-20" />
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

function PageHeader({ refreshing, onRefresh }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
          <Activity size={13} />
          实时情报雷达
        </div>
        <div className="flex items-center gap-3">
          <Radar size={30} style={{ color: 'var(--accent-green)' }} />
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--text-primary)' }}>
            情报总览
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>
          汇总多来源热点、关键词命中与 AI 热度评分，快速判断今天值得跟进的技术信号。
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="btn-primary px-4 py-2 text-sm"
        type="button"
      >
        <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        {refreshing ? '抓取中' : '立即抓取'}
      </button>
    </div>
  )
}

function StatCard({ label, helper, value, icon: Icon, color }) {
  return (
    <div className="radar-card card-interactive panel rounded-xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-title">{label}</p>
          <p className="metric-value mt-2 text-3xl font-bold" style={{ color }}>
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
  const [refreshing, setRefreshing] = useState(false)

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

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.triggerFetch()
      await loadData()
    } finally {
      setRefreshing(false)
    }
  }

  const sourceData = stats?.bySource?.map((item) => ({
    name: SOURCE_NAMES[item.source] || item.source,
    value: item.count,
  })) || []

  const scoreDistribution = [
    { range: '80-100', count: latest.filter((item) => item.ai_score >= 80).length },
    { range: '60-79', count: latest.filter((item) => item.ai_score >= 60 && item.ai_score < 80).length },
    { range: '40-59', count: latest.filter((item) => item.ai_score >= 40 && item.ai_score < 60).length },
    { range: '0-39', count: latest.filter((item) => item.ai_score < 40).length },
  ]

  const statValues = {
    total: stats?.total || 0,
    today: stats?.today || 0,
    activeKeywords: keywords.filter((keyword) => keyword.is_active).length,
    avgScore: stats?.avgScore || 0,
  }

  return (
    <div className="space-y-7">
      <PageHeader refreshing={refreshing} onRefresh={handleRefresh} />

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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.15fr]">
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
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>观察各平台信号占比</p>
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
              <div className="mb-5">
                <h2 className="panel-title">热度评分分布</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>最近高分热点的 AI 评分区间</p>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" tick={{ fill: '#708096', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#708096', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="count" fill="var(--accent-green)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        )}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="panel-title">高分热点 TOP {latest.length}</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>优先查看高热度、高相关性内容</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="panel rounded-xl p-5">
                <div className="skeleton mb-3 h-4 w-20" />
                <div className="skeleton mb-2 h-4 w-full" />
                <div className="skeleton mb-4 h-4 w-3/4" />
                <div className="skeleton h-16 w-full" />
              </div>
            ))}
          </div>
        ) : latest.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {latest.map((topic) => (
              <HotTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        ) : (
          <div className="panel rounded-xl empty-state" style={{ minHeight: 220 }}>
            <Flame size={34} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>暂无热点数据</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>先添加关键词，再点击“立即抓取”。</p>
          </div>
        )}
      </section>
    </div>
  )
}
