import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: '16px', fontWeight: 500, color: 'var(--gray-light)' }}>
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          background: 'var(--green-deep)',
          border: `1px solid ${error ? 'var(--orange-primary)' : 'var(--green-primary)'}`,
          borderRadius: '10px',
          padding: '10px 14px',
          color: 'var(--green-light)',
          fontSize: '18px',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.2s',
          ...style,
        }}
        onFocus={(e) => { e.target.style.borderColor = 'var(--green-bright)'; }}
        onBlur={(e) => { e.target.style.borderColor = error ? 'var(--orange-primary)' : 'var(--green-primary)'; }}
        {...props}
      />
      {error && <span style={{ fontSize: '15px', color: 'var(--orange-primary)' }}>{error}</span>}
    </div>
  )
}
