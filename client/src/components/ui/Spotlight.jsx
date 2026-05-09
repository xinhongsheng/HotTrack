import { cn } from '../../lib/utils'

export default function Spotlight({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute -top-36 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-80 blur-3xl',
        'bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.20),rgba(56,189,248,0.09)_32%,transparent_66%)]',
        className
      )}
    />
  )
}
