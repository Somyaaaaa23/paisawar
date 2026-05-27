import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
  onClick?: () => void
  hoverable?: boolean
  glow?: 'blue' | 'gold' | 'green' | 'red'
}

export function Card({ children, style, className, onClick, hoverable, glow }: CardProps) {
  const glowColors = {
    blue: 'var(--shadow-glow-blue)',
    gold: 'var(--shadow-glow-gold)',
    green: 'var(--shadow-glow-green)',
    red: 'var(--shadow-glow-orange)',
  }

  return (
    <div
      onClick={onClick}
      className={`glass-panel ${className ?? ''}`}
      style={{
        borderRadius: '20px',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: glow ? glowColors[glow] : '0 8px 32px rgba(0, 0, 0, 0.2)',
        ...style,
      }}
      onMouseEnter={hoverable && onClick ? (e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.16)'
        el.style.transform = 'translateY(-2px)'
      } : undefined}
      onMouseLeave={hoverable && onClick ? (e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'rgba(255,255,255,0.08)'
        el.style.transform = 'translateY(0)'
      } : undefined}
    >
      {children}
    </div>
  )
}
