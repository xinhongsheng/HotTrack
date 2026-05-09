import { useEffect, useState } from 'react'
import { Lightbulb, Plus, Search, Tags, Trash2 } from 'lucide-react'
import { api } from '../api'

const categories = [
  { value: 'general', label: '通用' },
  { value: 'ai', label: 'AI' },
  { value: 'tech', label: '科技' },
  { value: 'crypto', label: '加密' },
  { value: 'startup', label: '创业' },
]

const suggestedKeywords = ['AI', 'LLM', 'GPT', 'Claude', 'React', 'Rust', 'WebAssembly', 'Open Source']

function SkeletonKeyword() {
  return (
    <div className="panel rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="skeleton h-6 w-11 rounded-full" />
          <div className="skeleton h-4 w-28" />
        </div>
        <div className="skeleton h-8 w-8" />
      </div>
    </div>
  )
}

export default function Keywords() {
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.getKeywords()
      setKeywords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await api.createKeyword({ keyword: newKeyword.trim(), category: newCategory })
      setNewKeyword('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggle = async (keyword) => {
    await api.updateKeyword(keyword.id, { is_active: keyword.is_active ? 0 : 1 })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除这个关键词吗？')) return
    await api.deleteKeyword(id)
    load()
  }

  const handleQuickAdd = async (keyword) => {
    try {
      await api.createKeyword({ keyword })
      load()
    } catch {}
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold text-sky-200">
          <Tags size={13} />
          监控词库
        </div>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: 'var(--text-primary)' }}>关键词管理</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          配置需要持续扫描的主题、产品名或技术词，系统会按任务周期自动发现相关热点。
        </p>
      </div>

      <form onSubmit={handleAdd} className="panel rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="panel-title">新增监控关键词</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>建议使用短词或明确实体名，便于提高命中质量。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_auto]">
          <input
            type="text"
            value={newKeyword}
            onChange={(event) => setNewKeyword(event.target.value)}
            placeholder="输入关键词，例如 AI、LLM、React..."
            className="input-field px-4 py-2.5"
            required
            aria-label="关键词输入"
          />
          <select
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            className="select-field px-4 py-2.5"
            aria-label="选择分类"
          >
            {categories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
            <Plus size={15} />
            添加
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs text-rose-200" role="alert">
            {error}
          </p>
        )}
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="panel-title">监控列表</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {loading ? '加载中' : `${keywords.length} 个关键词`}
            </p>
          </div>
        </div>

        {loading ? (
          <>
            <SkeletonKeyword />
            <SkeletonKeyword />
            <SkeletonKeyword />
          </>
        ) : keywords.length === 0 ? (
          <div className="panel rounded-xl empty-state" style={{ minHeight: 190 }}>
            <Search size={34} style={{ color: 'var(--text-muted)' }} />
            <p className="mt-3 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>还没有关键词</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>添加关键词后即可开始追踪热点。</p>
          </div>
        ) : (
          keywords.map((keyword) => (
            <div key={keyword.id} className="panel card-interactive rounded-xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={() => handleToggle(keyword)}
                    aria-label={`${keyword.is_active ? '停用' : '启用'}关键词 ${keyword.keyword}`}
                    className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                    style={{ background: keyword.is_active ? 'var(--accent-green)' : 'rgba(112,128,150,0.28)' }}
                    type="button"
                  >
                    <span
                      className="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform"
                      style={{ left: keyword.is_active ? 23 : 4 }}
                    />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="truncate text-sm font-bold"
                        style={{ color: keyword.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      >
                        {keyword.keyword}
                      </span>
                      <span className="badge bg-white/[0.045]" style={{ color: 'var(--text-muted)' }}>
                        {categories.find((category) => category.value === keyword.category)?.label || keyword.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {keyword.is_active ? '正在监控' : '已暂停'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(keyword.id)}
                  className="btn-danger h-9 min-h-9 px-3 text-xs"
                  aria-label={`删除关键词 ${keyword.keyword}`}
                  type="button"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="panel rounded-xl p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb size={16} style={{ color: 'var(--accent-orange)' }} />
          <h2 className="panel-title">热门关键词推荐</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((keyword) => (
            <button
              key={keyword}
              onClick={() => handleQuickAdd(keyword)}
              className="btn-secondary min-h-9 px-3 text-xs"
              type="button"
            >
              <Plus size={13} />
              {keyword}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
