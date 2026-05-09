const tiers = [
  { min: 80, bg: 'var(--accent-red-dim)', text: 'var(--accent-red)', border: 'rgba(239,68,68,0.3)' },
  { min: 60, bg: 'var(--accent-orange-dim)', text: 'var(--accent-orange)', border: 'rgba(245,158,11,0.3)' },
  { min: 40, bg: 'rgba(234,179,8,0.12)', text: '#eab308', border: 'rgba(234,179,8,0.3)' },
  { min: 0, bg: 'rgba(100,116,139,0.15)', text: 'var(--text-muted)', border: 'rgba(100,116,139,0.3)' },
]

export default function ScoreBadge({ score, size = 'sm' }) {
  const tier = tiers.find((t) => score >= t.min) || tiers[tiers.length - 1]
  const sizeClass = size === 'lg' ? 'text-lg px-3 py-1' : 'text-xs px-2 py-0.5'

  return (
    <div
      className={`border rounded-lg font-bold flex-shrink-0 ${sizeClass}`}
      style={{
        background: tier.bg,
        color: tier.text,
        borderColor: tier.border,
        fontFamily: 'var(--font-mono)',
      }}
      aria-label={`评分 ${score || 0}`}
    >
      {score || 0}
    </div>
  )
}
