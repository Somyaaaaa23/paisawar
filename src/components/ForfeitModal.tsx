import { Button } from './ui/Button'

interface ForfeitModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export function ForfeitModal({ onCancel, onConfirm }: ForfeitModalProps) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 24, animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'var(--card-paper)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(0,0,0,0.1)',
        maxWidth: 400, width: '100%', borderRadius: 20, padding: 32,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 20 }}>
          ⚠️
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-dark)', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 12 }}>
          Forfeit Match?
        </h2>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 32 }}>
          Are you sure you want to leave? If you leave now, you will automatically <strong style={{ color: 'var(--orange-dark)' }}>lose this match</strong> and incur any rank point deductions.
          <br /><br />
          <strong style={{ color: '#ef4444' }}>Leaving the match may result in a deduction of 25 DC Coins.</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <Button variant="secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onClick={onConfirm} style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444', color: 'white' }}>
            Yes, Forfeit
          </Button>
        </div>
      </div>
    </div>
  )
}
