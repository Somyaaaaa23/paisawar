import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: `2px solid ${error ? 'var(--orange-primary)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '10px',
          padding: '12px 14px',
          color: 'var(--text-dark)',
          fontSize: '16px',
          fontWeight: 500,
          outline: 'none',
          width: '100%',
          transition: 'all 0.2s',
          ...style,
        }}
        onFocus={(e) => { 
          e.target.style.borderColor = 'var(--green-primary)';
          e.target.style.background = '#ffffff';
        }}
        onBlur={(e) => { 
          e.target.style.borderColor = error ? 'var(--orange-primary)' : 'rgba(0,0,0,0.1)';
          e.target.style.background = 'rgba(255, 255, 255, 0.7)';
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '15px', color: 'var(--orange-primary)' }}>{error}</span>}
    </div>
  )
}
