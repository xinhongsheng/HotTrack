import { ExternalLink, Search, Sparkles } from 'lucide-react'
import ScoreBadge from './ScoreBadge'
import CardSpotlight from './ui/CardSpotlight'
import { SOURCE_META } from '../config/sources'

function formatHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'external'
  }
}

function formatTime(value) {
  if (!value) return '未知时间'
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SourceTag({ source }) {
  const meta = SOURCE_META[source] || SOURCE_META.hackernews
  const Icon = meta.icon || Search

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
      <Icon size={14} style={{ color: meta.color }} />
      {meta.label}
    </span>
  )
}

export default function HotTopicCard({ topic }) {
  const src = SOURCE_META[topic.source] || SOURCE_META.hackernews
  const fetchedAt = topic.fetched_at ? new Date(topic.fetched_at) : null
  const isNew = fetchedAt && fetchedAt > new Date(Date.now() - 3600000)
  const hasAnalysis = topic.ai_analysis && !topic.ai_analysis.includes('OPENROUTER_API_KEY')

  return (
    <CardSpotlight
      as="article"
      className="card-interactive relative rounded-xl border"
      style={{
        background: `linear-gradient(180deg, ${src.bg}, rgba(8,13,18,0.82))`,
        borderColor: src.border,
      }}
    >
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: src.color }} />

      <div className="relative z-10 p-4 pl-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <ScoreBadge score={topic.ai_score} showScore={false} />
          <SourceTag source={topic.source} />
          {topic.keyword && (
            <span className="badge rounded-md" style={{ background: 'rgba(45,212,191,0.10)', color: 'var(--accent-green)' }}>
              {topic.keyword}
            </span>
          )}
          {isNew && (
            <span className="badge border border-amber-300/25 bg-amber-300/10 text-amber-200">
              新信号
            </span>
          )}
        </div>

        <a
          href={topic.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-50 transition-colors hover:text-teal-100"
        >
          {topic.title || '未命名热点'}
        </a>

        {topic.summary && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {topic.summary}
          </p>
        )}

        {hasAnalysis && (
          <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--accent-green)' }}>
              <Sparkles size={13} />
              AI 选题研判
            </div>
            <p className="line-clamp-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {topic.ai_analysis}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="metric-value text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {formatTime(topic.fetched_at)}
          </span>
          {topic.url && (
            <a
              href={topic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 items-center gap-1 transition-colors hover:text-sky-300"
            >
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{formatHost(topic.url)}</span>
            </a>
          )}
        </div>
      </div>
    </CardSpotlight>
  )
}
