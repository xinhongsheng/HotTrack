import { useState, useEffect } from 'react'
import { Tags, Plus, Trash2, Search, Lightbulb } from 'lucide-react'
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
    <div className="glass rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="skeleton w-10 h-5 rounded-full" />
        <div className="skeleton h-4 w-24" />
      </div>
      <div className="skeleton h-3 w-8" />
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

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.createKeyword({ keyword: newKeyword, category: newCategory })
      setNewKeyword('')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleToggle = async (kw) => {
    await api.updateKeyword(kw.id, { is_active: kw.is_active ? 0 : 1 })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('确定删除该关键词？')) return
    await api.deleteKeyword(id)
    load()
  }

  const handleQuickAdd = async (kw) => {
    try {
      await api.createKeyword({ keyword: kw })
      load()
    } catch {}
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Tags size={22} style={{ color: 'var(--accent-blue)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>关键词管理</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>配置需要监控的关键词</p>
      </div>

      {/* Add Form */}
      <form onSubmit={handleAdd} className="glass rounded-xl p-5">
        <label className="section-title block mb-3">添加新关键词</label>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="输入关键词，如: AI、LLM、React..."
            className="flex-1 min-w-[200px] px-4 py-2.5 input-field"
            required
            aria-label="关键词输入"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-4 py-2.5 select-field"
            aria-label="选择分类"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
          >
            <Plus size={14} />
            添加
          </button>
        </div>
        {error && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--accent-red)' }} role="alert">
            {error}
          </p>
        )}
      </form>

      {/* Keywords List */}
      <div className="space-y-2">
        {loading ? (
          <>
            <SkeletonKeyword />
            <SkeletonKeyword />
            <SkeletonKeyword />
          </>
        ) : keywords.length === 0 ? (
          <div className="glass rounded-xl empty-state" style={{ minHeight: '160px' }}>
            <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>还没有关键词</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>添加关键词开始监控热点</p>
          </div>
        ) : (
          keywords.map((kw) => (
            <div
              key={kw.id}
              className="glass rounded-xl p-4 flex items-center justify-between group card-interactive"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggle(kw)}
                  aria-label={`${kw.is_active ? '停用' : '启用'}关键词 ${kw.keyword}`}
                  className={`w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer ${
                    kw.is_active ? '' : ''
                  }`}
                  style={{ background: kw.is_active ? 'var(--accent-blue)' : 'var(--bg-elevated)' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300"
                    style={{ left: kw.is_active ? '21px' : '2px' }}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className="font-medium text-sm"
                    style={{ color: kw.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {kw.keyword}
                  </span>
                  <span
                    className="badge"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)' }}
                  >
                    {categories.find((c) => c.value === kw.category)?.label || kw.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(kw.id)}
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white/5 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
                aria-label={`删除关键词 ${kw.keyword}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quick Add Suggestions */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={14} style={{ color: 'var(--accent-orange)' }} />
          <h3 className="section-title" style={{ margin: 0 }}>热门关键词推荐</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedKeywords.map((kw) => (
            <button
              key={kw}
              onClick={() => handleQuickAdd(kw)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(59,130,246,0.3)'
                e.target.style.color = 'var(--accent-blue)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)'
                e.target.style.color = 'var(--text-secondary)'
              }}
            >
              + {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
