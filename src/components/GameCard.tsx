import { motion } from 'framer-motion'
import type { GameCard as GameCardType } from '../types/game'
import { FileWarning, Shield, Zap, IndianRupee } from 'lucide-react'

interface GameCardProps {
  card: GameCardType
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  compact?: boolean
  faceDown?: boolean
}

const TYPE_COLORS = {
  action: {
    bg: 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)',
    border: '#fca5a5',
    borderHover: '#ef4444',
    badge: '#ef4444',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    icon: Zap,
  },
  decision: {
    bg: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)',
    border: '#86efac',
    borderHover: '#22c55e',
    badge: '#22c55e',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    icon: FileWarning,
  },
  defense: {
    bg: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)',
    border: '#93c5fd',
    borderHover: '#3b82f6',
    badge: '#3b82f6',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    icon: Shield,
  },
}

// Per-tier visual configuration
const TIER_CONFIG: Record<string, {
  color: string
  glow: string
  shimmer: boolean
  frameLabel: string
}> = {
  common:    { color: '#6b7280', glow: 'none', shimmer: false, frameLabel: 'COMMON' },
  rare:      { color: '#3b82f6', glow: '0 4px 14px rgba(59,130,246,0.2)', shimmer: false, frameLabel: 'RARE' },
  epic:      { color: '#a855f7', glow: '0 6px 20px rgba(168,85,247,0.3)', shimmer: true, frameLabel: 'EPIC' },
  legendary: { color: '#eab308', glow: '0 8px 30px rgba(234,179,8,0.45)', shimmer: true, frameLabel: 'LEGENDARY' },
}

export function GameCard({ card, onClick, selected, disabled, compact, faceDown }: GameCardProps) {
  const colors = TYPE_COLORS[card.type] ?? TYPE_COLORS.decision
  const tier = TIER_CONFIG[card.tier] ?? TIER_CONFIG.common
  const isLegendary = card.tier === 'legendary'
  const Icon = colors.icon

  if (faceDown) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: compact ? 80 : 140,
          height: compact ? 110 : 200,
          borderRadius: compact ? 12 : 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #004030, #002020)',
          border: '3px dashed #FFD050',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          flexShrink: 0,
        }}
      >
        <IndianRupee className="text-yellow-400" size={compact ? 24 : 40} />
      </motion.div>
    )
  }

  // Base dimensions
  const width = compact ? 90 : 140
  const height = compact ? 120 : 200
  const padding = compact ? '8px' : '12px'

  return (
    <motion.button
      layoutId={card.id}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{
        opacity: disabled ? 0.5 : 1,
        y: selected ? -10 : 0,
        scale: selected ? 1.05 : 1,
      }}
      whileHover={onClick && !disabled && !selected ? { y: -5, scale: 1.05, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' } : {}}
      whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{
        width,
        height,
        background: colors.bg,
        border: `2px solid ${selected ? '#eab308' : colors.border}`,
        borderRadius: compact ? 12 : 16,
        cursor: onClick && !disabled ? 'pointer' : 'default',
        padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 4 : 8,
        boxShadow: selected ? '0 0 0 2px #fef08a, 0 8px 16px rgba(0,0,0,0.1)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick && !disabled && !selected) {
          e.currentTarget.style.borderColor = colors.borderHover
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = colors.border
        }
      }}
    >
      {/* Top shimmer bar for epic/legendary */}
      {tier.shimmer && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: isLegendary ? 4 : 3,
          background: isLegendary
            ? 'linear-gradient(90deg, transparent, #fde047, #fef08a, #fde047, transparent)'
            : 'linear-gradient(90deg, transparent, #d8b4fe, #e9d5ff, #d8b4fe, transparent)',
          animation: 'shimmer 2.5s linear infinite',
        }} />
      )}

      {/* Tier Badge */}
      <div style={{
        position: 'absolute',
        top: -4,
        left: -4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tier.color,
        color: '#fff',
        fontSize: compact ? 9 : 10,
        fontWeight: 800,
        padding: compact ? '4px 6px' : '4px 8px',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 10,
      }}>
        {compact ? tier.frameLabel[0] : tier.frameLabel}
      </div>

      {/* Rupee decoration */}
      <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.5 }}>
        <IndianRupee size={12} color="#ca8a04" />
      </div>

      {/* Icon Area */}
      <div style={{
        marginTop: compact ? 8 : 12,
        width: compact ? 36 : 48,
        height: compact ? 36 : 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.iconBg,
        color: colors.iconColor,
        borderRadius: 8,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <Icon size={compact ? 20 : 24} />
      </div>

      {/* Title */}
      <div style={{
        fontSize: compact ? 10 : 12,
        fontWeight: 800,
        color: '#1f2937',
        textAlign: 'center',
        lineHeight: 1.1,
        marginTop: 2,
      }}>
        {card.name}
      </div>

      {/* Description */}
      {!compact && (
        <div style={{
          fontSize: 9,
          color: '#4b5563',
          textAlign: 'center',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}>
          {card.flavor}
        </div>
      )}

      {/* Invest options indicator (only for full view) */}
      {!compact && card.type === 'decision' && card.options && (
        <div style={{ marginTop: 'auto', display: 'flex', gap: 2, width: '100%', padding: '0 4px' }}>
          {card.options.map(opt => {
            const optColor = opt.type === 'save' ? '#22c55e' : opt.type === 'invest' ? '#3b82f6' : '#ef4444'
            return (
              <div key={opt.type} style={{
                flex: 1,
                height: 4,
                background: optColor,
                borderRadius: 2,
                opacity: 0.7
              }} />
            )
          })}
        </div>
      )}
    </motion.button>
  )
}
