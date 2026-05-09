import { useState, useEffect } from 'react'
import { Flame, RefreshCw, SlidersHorizontal, Inbox } from 'lucide-react'
import { api } from '../api'
import HotTopicCard from '../components/HotTopicCard'

function SkeletonTopicCard() {
  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-4 w-8" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-3/4 mb-3" />
      <div className="skeleton h-3 w-full mb-1" />
      <div className="skeleton h-3 w-2/3" />
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
      const [t, k] = await Promise.all([
        api.getHotTopics({
          source: filters.source || undefined,
          keyword_id: filters.keyword_id || undefined,
          sort: filters.sort === 'score' ? 'score' : undefined,
          limit: 100,
        }),
        api.getKeywords(),
      ])
      setTopics(t)
      setKeywords(k)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTopics() }, [filters])

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Flame size={22} style={{ color: 'var(--accent-orange)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>热点列表</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? '加载中...' : `共 ${topics.length} 条热点`}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 mr-1" style={{ color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={14} />
          <span className="text-xs font-medium">筛选</span>
        </div>

        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="px-3 py-2 select-field text-sm"
          aria-label="数据来源筛选"
        >
          <option value="">全部来源</option>
          <option value="hackernews">Hacker News</option>
          <option value="github">GitHub</option>
        </select>

        <select
          value={filters.keyword_id}
          onChange={(e) => setFilters({ ...filters, keyword_id: e.target.value })}
          className="px-3 py-2 select-field text-sm"
          aria-label="关键词筛选"
        >
          <option value="">全部关键词</option>
          {keywords.map((kw) => (
            <option key={kw.id} value={kw.id}>{kw.keyword}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="px-3 py-2 select-field text-sm"
          aria-label="排序方式"
        >
          <option value="latest">最新优先</option>
          <option value="score">热度优先</option>
        </select>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonTopicCard key={i} />
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <HotTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl empty-state" style={{ minHeight: '240px' }}>
          <Inbox size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>暂无热点数据</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            请先在"关键词"页面添加监控关键词
          </p>
        </div>
      )}
    </div>
  )
}
