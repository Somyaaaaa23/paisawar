import { ScrollText } from 'lucide-react'

interface GameLogProps {
  log: string[]
}

export function GameLog({ log }: GameLogProps) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.45)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRadius: 20,
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 300,
      maxHeight: 500,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 12, marginBottom: 4 }}>
        <ScrollText size={18} color="var(--text-muted)" />
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          Game Log
        </h3>
      </div>
      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
        {log.length === 0 ? (
          <div style={{ fontSize: 15, color: 'var(--text-muted)', fontStyle: 'italic' }}>Game started. Waiting for first move...</div>
        ) : (
          log.slice(0, 10).map((entry, i) => (
            <div key={i} style={{
              fontSize: 15,
              color: i === 0 ? 'var(--text-dark)' : 'var(--text-muted)',
              fontWeight: i === 0 ? 600 : 400,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              lineHeight: 1.5,
            }}>
              <span style={{ color: i === 0 ? 'var(--blue-deep)' : 'var(--text-muted)', marginTop: 2 }}>•</span>
              {entry}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
