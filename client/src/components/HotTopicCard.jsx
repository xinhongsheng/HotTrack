import { ExternalLink, Sparkles } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import { SOURCE_META } from '../config/sources'

export default function HotTopicCard({ topic }) {
  const src = SOURCE_META[topic.source] || SOURCE_META.hackernews
  const isNew = new Date(topic.fetched_at) > new Date(Date.now() - 3600000)

  return (
    <article
      className="relative rounded-xl overflow-hidden card-interactive"
      style={{ background: src.bg, border: `1px solid ${src.border}` }}
    >
      {/* Source bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: src.color }} />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="badge"
                style={{ background: src.bg, border: `1px solid ${src.border}`, color: src.color }}
              >
                {src.shortLabel}
              </span>
              {isNew && (
                <span
                  className="w-1.5 h-1.5 rounded-full animate-breathe"
                  style={{ background: 'var(--accent-green)' }}
                  title="1小时内新增"
                  aria-label="1小时内新增"
                />
              )}
              {topic.keyword && (
                <span
                  className="badge"
                  style={{ background: 'var(--accent-blue-dim)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent-blue)' }}
                >
                  {topic.keyword}
                </span>
              )}
            </div>
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold leading-snug hover:text-blue-400 transition-colors line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {topic.title}
            </a>
          </div>
          <ScoreBadge score={topic.ai_score} />
        </div>

        {/* Summary */}
        {topic.summary && (
          <p className="mt-2.5 text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {topic.summary}
          </p>
        )}

        {/* AI Analysis */}
        {topic.ai_analysis && topic.ai_analysis !== 'AI 分析未配置 (需设置 OPENROUTER_API_KEY)' && (
          <div
            className="mt-3 p-2.5 rounded-lg flex items-start gap-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
          >
            <Sparkles size={12} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-blue)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {topic.ai_analysis}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{new Date(topic.fetched_at).toLocaleString('zh-CN')}</span>
          {topic.url && (
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-slate-400 transition-colors truncate max-w-[200px]"
            >
              <ExternalLink size={10} />
              {new URL(topic.url).hostname}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
