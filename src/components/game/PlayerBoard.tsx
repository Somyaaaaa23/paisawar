import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PlayerState } from '../../types/game'
import { formatWealth } from '../../types/game'

interface PlayerBoardProps {
  player: PlayerState
  isCurrent: boolean
  isMe: boolean
  isTarget: boolean
  isOffline?: boolean
  wealthGoal: number
  seatIndex?: number
  onClick?: () => void
}

// Distinct color themes per seat — matching the screenshot's green, purple, red, gold palette
const SEAT_THEMES = [
  { bg: 'linear-gradient(145deg, #1a4a2e, #0d2b1a)', border: '#2d7a4a', glow: 'rgba(34,197,94,0.35)', accent: '#4ade80', nameBg: '#166534' },
  { bg: 'linear-gradient(145deg, #2e1a4a, #1a0d2b)', border: '#6d4a9e', glow: 'rgba(139,92,246,0.35)', accent: '#a78bfa', nameBg: '#4c1d95' },
  { bg: 'linear-gradient(145deg, #4a1a1a, #2b0d0d)', border: '#9e4a4a', glow: 'rgba(239,68,68,0.35)', accent: '#f87171', nameBg: '#7f1d1d' },
  { bg: 'linear-gradient(145deg, #3a2e0a, #221a04)', border: '#b8860b', glow: 'rgba(245,158,11,0.4)', accent: '#fbbf24', nameBg: '#78350f' },
]

// Avatar pool — assigned by name initial for consistency
const AVATARS = ['👨‍💼', '👩‍💼', '🧑‍💼', '👨‍🦱', '👩‍🦱', '🧔', '👩‍🦰', '👨‍🦰']

function getAvatar(player: PlayerState, seatIndex: number): string {
  if (player.profile?.avatar_url) return player.profile.avatar_url
  if (player.isBot) return '🤖'
  return AVATARS[seatIndex % AVATARS.length]
}

// Rupee shield icon (SVG inline as component)
function RupeeShield({ color }: { color: string }) {
  return (
    <div style={{
      width: 32, height: 34,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Shield shape */}
      <svg width="32" height="34" viewBox="0 0 32 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2L3 8V17C3 24.18 8.64 30.88 16 32C23.36 30.88 29 24.18 29 17V8L16 2Z"
          fill={color + '33'} stroke={color} strokeWidth="1.5" />
      </svg>
      <span style={{
        position: 'absolute', fontSize: 13, fontWeight: 800,
        color: color, fontFamily: 'Space Grotesk, sans-serif',
        lineHeight: 1, marginTop: 2,
      }}>₹</span>
    </div>
  )
}

export function PlayerBoard({ player, isCurrent, isMe, isTarget, isOffline, wealthGoal, seatIndex = 0, onClick }: PlayerBoardProps) {
  const wealthPct = Math.min(100, (player.wealth / wealthGoal) * 100)
  const theme = SEAT_THEMES[seatIndex % SEAT_THEMES.length]
  const avatar = getAvatar(player, seatIndex)

  const [prevWealth, setPrevWealth] = useState(player.wealth)
  const [floatingText, setFloatingText] = useState<{ id: number; diff: number }[]>([])
  const [isShaking, setIsShaking] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (player.wealth !== prevWealth) {
      const diff = player.wealth - prevWealth
      setPrevWealth(player.wealth)
      if (diff !== 0) {
        setFloatingText(prev => [...prev, { id: Date.now(), diff }])
        if (diff < 0) {
          setIsShaking(true)
          timeoutId = setTimeout(() => setIsShaking(false), 500)
        }
      }
    }
    return () => { if (timeoutId) clearTimeout(timeoutId) }
  }, [player.wealth, prevWealth])

  // How many cards to show as shield icons (capped at 5 to keep layout clean)
  const shieldCount = Math.min(player.hand.length, 5)
  const extraCards = player.hand.length > 5 ? player.hand.length - 5 : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: 1, scale: 1, y: 0,
        x: isShaking ? [-5, 5, -5, 5, -2, 2, 0] : 0,
      }}
      transition={{ x: { duration: 0.35 }, default: { duration: 0.4, ease: 'easeOut' } }}
      whileHover={isTarget ? { scale: 1.05, y: -5 } : { y: -2 }}
      whileTap={isTarget ? { scale: 0.95 } : {}}
      onClick={isTarget ? onClick : undefined}
      className="player-board-wrapper"
      style={{
        background: theme.bg,
        border: `2px solid ${isCurrent ? '#fef08a' : theme.border}`,
        borderRadius: 16,
        cursor: isTarget ? 'pointer' : 'default',
        position: 'relative',
        opacity: isOffline ? 0.55 : 1,
        boxShadow: isCurrent
          ? `0 0 0 2px #fef08a, 0 8px 24px ${theme.glow}`
          : isTarget
          ? '0 0 0 2px #ef4444, 0 8px 24px rgba(239, 68, 68, 0.4)'
          : '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        flexShrink: 0,
        userSelect: 'none',
        backdropFilter: 'blur(8px)',
        overflow: 'visible',
      }}
    >
      {/* Floating wealth change text */}
      <AnimatePresence>
        {floatingText.map(ft => (
          <motion.div
            key={ft.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -80, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 20, right: 12, zIndex: 50,
              fontSize: 28, fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif',
              color: ft.diff > 0 ? '#4ade80' : '#f87171',
              pointerEvents: 'none',
              textShadow: '0 2px 8px rgba(0,0,0,0.7)',
            }}
            onAnimationComplete={() => setFloatingText(prev => prev.filter(item => item.id !== ft.id))}
          >
            {ft.diff > 0 ? '+' : ''}₹{Math.abs(ft.diff).toLocaleString()}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Seat number badge — top-right corner */}
      <div style={{
        position: 'absolute', top: -10, right: -10,
        width: 28, height: 28, borderRadius: '50%',
        background: theme.nameBg,
        border: `2px solid ${theme.accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: theme.accent,
        fontFamily: 'Space Grotesk, sans-serif',
        boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
        zIndex: 10,
      }}>
        {seatIndex + 1}
      </div>

      {/* PLAYING / OFFLINE / SKIP badge */}
      {isCurrent && !isOffline && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'absolute', top: -12, left: 12,
            background: theme.nameBg, border: `1px solid ${theme.accent}`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 800, color: theme.accent,
            letterSpacing: '0.12em', zIndex: 10,
          }}
        >
          PLAYING
        </motion.div>
      )}
      {isOffline && (
        <div style={{
          position: 'absolute', top: -12, left: 12,
          background: '#1e293b', border: '1px solid #475569',
          borderRadius: 20, padding: '3px 10px',
          fontSize: 10, fontWeight: 800, color: '#64748b',
          letterSpacing: '0.12em', zIndex: 10,
        }}>
          OFFLINE
        </div>
      )}
      {isTarget && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 0.7 }}
          style={{
            position: 'absolute', top: -12, left: 12,
            background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 10, fontWeight: 800, color: '#f87171',
            letterSpacing: '0.12em', zIndex: 10,
          }}
        >
          ⚡ TARGET
        </motion.div>
      )}

      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div className="player-board-avatar" style={{
          width: '2.5em', height: '2.5em', borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: `2px solid ${theme.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px rgba(0,0,0,0.3)`
        }}>
          {avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {player.name}
            {isMe && <span style={{ color: theme.accent, marginLeft: 4, fontSize: 12 }}>(You)</span>}
          </div>
          {player.skippedTurns > 0 && (
            <div style={{
              fontSize: 11, color: '#f59e0b', fontWeight: 700,
              background: 'rgba(245,158,11,0.15)', borderRadius: 4,
              padding: '1px 6px', display: 'inline-block', marginTop: 2,
            }}>
              SKIP ×{player.skippedTurns}
            </div>
          )}
        </div>
      </div>

      {/* Wealth Row */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 'clamp(6px, 2vw, 10px)', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
        <RupeeShield color={theme.accent} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: theme.accent, lineHeight: 1 }}>
            {formatWealth(player.wealth)}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, background: 'rgba(255,255,255,0.08)',
        borderRadius: 2, overflow: 'hidden', marginBottom: 10, marginTop: 10,
      }}>
        <motion.div
          animate={{ width: `${wealthPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${theme.accent}88, ${theme.accent})`,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Card shields */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        {Array.from({ length: shieldCount }).map((_, i) => (
          <RupeeShield key={i} color={theme.accent} />
        ))}
        {extraCards > 0 && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: theme.accent,
            marginLeft: 2, opacity: 0.8,
          }}>
            +{extraCards}
          </div>
        )}
        {player.hand.length === 0 && (
          <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>No cards</div>
        )}
      </div>
    </motion.div>
  )
}
