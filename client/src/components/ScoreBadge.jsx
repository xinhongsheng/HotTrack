import { Flame, Zap } from 'lucide-react'

export function getScoreTier(score = 0) {
  if (score >= 85) {
    return {
      label: 'CRITICAL',
      title: '高危热度',
      icon: Flame,
      bg: 'rgba(251, 113, 133, 0.18)',
      text: 'var(--accent-red)',
      border: 'rgba(251, 113, 133, 0.38)',
    }
  }

  if (score >= 70) {
    return {
      label: 'HIGH',
      title: '高热度',
      icon: Flame,
      bg: 'var(--accent-orange-dim)',
      text: 'var(--accent-orange)',
      border: 'rgba(245, 158, 11, 0.38)',
    }
  }

  if (score >= 45) {
    return {
      label: 'MEDIUM',
      title: '中等热度',
      icon: Zap,
      bg: 'rgba(234, 179, 8, 0.16)',
      text: '#facc15',
      border: 'rgba(234, 179, 8, 0.34)',
    }
  }

  return {
    label: 'LOW',
    title: '低热度',
    icon: Zap,
    bg: 'rgba(112, 128, 150, 0.16)',
    text: 'var(--text-muted)',
    border: 'rgba(112, 128, 150, 0.28)',
  }
}

export default function ScoreBadge({ score = 0, size = 'sm', showScore = true }) {
  const tier = getScoreTier(score)
  const Icon = tier.icon
  const sizeClass = size === 'lg' ? 'px-3 py-2 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <div
      className={`metric-value inline-flex shrink-0 items-center gap-1.5 rounded-full border font-bold ${sizeClass}`}
      style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}
      aria-label={`${tier.title}，评分 ${score || 0}`}
      title={`${tier.title} ${score || 0}`}
    >
      <Icon size={13} />
      <span>{tier.label}</span>
      {showScore && <span className="opacity-80">{score || 0}</span>}
    </div>
  )
}
