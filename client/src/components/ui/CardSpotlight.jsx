import { useRef } from 'react'
import { cn } from '../../lib/utils'

export default function CardSpotlight({ as: Component = 'div', className = '', children, ...props }) {
  const ref = useRef(null)

  const handleMouseMove = (event) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    ref.current.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`)
    ref.current.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`)
  }

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn('card-spotlight', className)}
      {...props}
    >
      {children}
    </Component>
  )
}
