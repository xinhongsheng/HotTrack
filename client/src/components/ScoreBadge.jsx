const tiers = [
  { min: 85, label: '高危热度', bg: 'var(--accent-red-dim)', text: 'var(--accent-red)', border: 'rgba(251,113,133,0.34)' },
  { min: 70, label: '强信号', bg: 'var(--accent-orange-dim)', text: 'var(--accent-orange)', border: 'rgba(245,158,11,0.34)' },
  { min: 45, label: '可观察', bg: 'var(--accent-blue-dim)', text: 'var(--accent-blue)', border: 'rgba(56,189,248,0.34)' },
  { min: 0, label: '弱信号', bg: 'rgba(112,128,150,0.16)', text: 'var(--text-muted)', border: 'rgba(112,128,150,0.28)' },
]

export default function ScoreBadge({ score = 0, size = 'sm' }) {
  const tier = tiers.find((item) => score >= item.min) || tiers[tiers.length - 1]
  const sizeClass = size === 'lg' ? 'px-3 py-2 text-lg' : 'px-2.5 py-1 text-xs'

  return (
    <div
      className={`metric-value rounded-lg border font-bold ${sizeClass}`}
      style={{ background: tier.bg, color: tier.text, borderColor: tier.border }}
      aria-label={`${tier.label}，评分 ${score || 0}`}
      title={tier.label}
    >
      {score || 0}
    </div>
  )
}
