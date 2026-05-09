import { cn } from '../../lib/utils'

const paths = [
  'M-120 160 C 140 20, 260 280, 560 120 S 920 40, 1180 220 S 1480 360, 1740 130',
  'M-80 420 C 160 280, 360 520, 620 340 S 1040 240, 1300 480 S 1510 620, 1760 390',
  'M-140 720 C 150 560, 420 790, 740 620 S 1120 510, 1420 710 S 1620 860, 1800 640',
  'M120 40 C 280 220, 460 120, 690 300 S 1060 420, 1260 230 S 1510 30, 1700 250',
]

export default function BackgroundBeams({ className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 h-full w-full overflow-hidden', className)}
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hottrack-beam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(20,184,166,0)" />
          <stop offset="36%" stopColor="rgba(45,212,191,0.30)" />
          <stop offset="68%" stopColor="rgba(251,191,36,0.18)" />
          <stop offset="100%" stopColor="rgba(56,189,248,0)" />
        </linearGradient>
      </defs>
      {paths.map((path, index) => (
        <path
          key={path}
          d={path}
          className="beam-line"
          style={{ animationDelay: `${index * 0.65}s` }}
          fill="none"
          stroke="url(#hottrack-beam)"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  )
}
