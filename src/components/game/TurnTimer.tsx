import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { playSound } from '../../lib/audio'
import { Timer } from 'lucide-react'

interface TurnTimerProps {
  turnStartTime: number
  timeLimit: number
  onTimeout: () => void
  active: boolean
}

export function TurnTimer({ turnStartTime, timeLimit, onTimeout, active }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  
  useEffect(() => {
    if (!active) return

    const checkTime = () => {
      const elapsed = Date.now() - turnStartTime
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(remaining)
      
      // Play a ticking sound when time is running out (under 5 seconds)
      if (remaining > 0 && remaining <= 5000 && remaining % 1000 < 100) {
        playSound('play') // tick
      }

      if (remaining <= 0) {
        onTimeout()
      }
    }

    const timer = setInterval(checkTime, 100)
    checkTime()
    return () => clearInterval(timer)
  }, [turnStartTime, timeLimit, active, onTimeout])

  if (!active) return null

  const pct = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100))
  const isDanger = timeLeft <= 10000

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDanger ? '#ef4444' : '#64748b', fontSize: 12, fontWeight: 700 }}>
          <Timer size={14} className={isDanger ? 'animate-pulse' : ''} />
          {isDanger ? 'HURRY UP!' : 'TIME REMAINING'}
        </div>
        <div style={{ color: isDanger ? '#ef4444' : '#94a3b8', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
          {Math.ceil(timeLeft / 1000)}s
        </div>
      </div>
      <div style={{
        width: '100%', height: 8, background: 'rgba(0,0,0,0.05)',
        borderRadius: 4, overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <motion.div
          animate={{ 
            width: `${pct}%`, 
            backgroundColor: isDanger ? '#ef4444' : '#10b981',
            boxShadow: isDanger ? '0 0 8px rgba(239,68,68,0.5)' : 'none'
          }}
          transition={{ duration: 0.1, ease: 'linear' }}
          style={{ height: '100%', borderRadius: 3 }}
        />
      </div>
    </div>
  )
}
