import { useEffect, useState } from 'react'
import { Flame, Inbox, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import HotTopicCard from '../components/HotTopicCard'
import { SOURCE_META } from '../config/sources'

function SkeletonTopicCard() {
  return (
    <div className="panel rounded-xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="skeleton h-5 w-10 rounded-full" />
        <div className="skeleton h-4 w-16" />
      </div>
      <div className="skeleton mb-2 h-4 w-full" />
      <div className="skeleton mb-4 h-4 w-3/4" />
      <div className="skeleton h-14 w-full" />
    </div>
  )
}

export default function HotTopics() {
  const [topics, setTopics] = useState([])
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState({
    source: '',
    keyword_id: '',
    sort: 'latest',
  })

  const loadTopics = async () => {
    try {
      const [topicsData, keywordsData] = await Promise.all([
        api.getHotTopics({
          source: filters.source || undefined,
          keyword_id: filters.keyword_id || undefined,
          sort: filters.sort === 'score' ? 'score' : undefined,
          limit: 100,
        }),
        api.getKeywords(),
      ])
      setTopics(topicsData)
      setKeywords(keywordsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTopics()
  }, [filters])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await api.triggerFetch()
      await loadTopics()
    } catch (err) {
      console.error(err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-xs font-bold text-orange-200">
            <Flame size={13} />
            热点信号库
          </div>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--text-primary)' }}>热点库</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {loading ? '正在同步热点数据' : `当前筛选命中 ${topics.length} 条热点`}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary px-4 py-2 text-sm"
          type="button"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '刷新中' : '刷新热点'}
        </button>
      </div>

      <section className="panel rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <SlidersHorizontal size={15} />
          <span className="section-title">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={filters.source}
            onChange={(event) => setFilters({ ...filters, source: event.target.value })}
            className="select-field px-3 py-2 text-sm"
            aria-label="数据来源筛选"
          >
            <option value="">全部来源</option>
            {Object.entries(SOURCE_META).map(([id, meta]) => (
              <option key={id} value={id}>{meta.label}</option>
            ))}
          </select>

          <select
            value={filters.keyword_id}
            onChange={(event) => setFilters({ ...filters, keyword_id: event.target.value })}
            className="select-field px-3 py-2 text-sm"
            aria-label="关键词筛选"
          >
            <option value="">全部关键词</option>
            {keywords.map((keyword) => (
              <option key={keyword.id} value={keyword.id}>{keyword.keyword}</option>
            ))}
          </select>

          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
            className="select-field px-3 py-2 text-sm"
            aria-label="排序方式"
          >
            <option value="latest">最新优先</option>
            <option value="score">热度优先</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <SkeletonTopicCard key={index} />
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {topics.map((topic) => (
            <HotTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="panel rounded-xl empty-state" style={{ minHeight: 260 }}>
          <Inbox size={42} style={{ color: 'var(--text-muted)' }} />
          <p className="mt-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>暂无热点数据</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>调整筛选条件，或先在关键词页添加监控目标。</p>
        </div>
      )}
    </div>
  )
}
