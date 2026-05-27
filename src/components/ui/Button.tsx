import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', children, loading, className = '', disabled, ...props }: ButtonProps) {
  const variantStyle = {
    primary: { background: 'var(--green-action)', color: 'var(--white)', border: '1px solid var(--green-bright)' },
    secondary: { background: 'var(--green-deep)', color: 'var(--green-light)', border: '1px solid var(--green-primary)' },
    ghost: { background: 'transparent', color: 'var(--gray-light)' },
    danger: { background: 'var(--orange-primary)', color: 'var(--white)', border: '1px solid var(--orange-bright)' },
    gold: { background: 'var(--gold)', color: 'var(--green-black)', border: '1px solid var(--coin-orange)' },
  }

  const sizeStyle = {
    sm: { padding: '6px 12px', fontSize: '15px' },
    md: { padding: '10px 20px', fontSize: '17px' },
    lg: { padding: '14px 28px', fontSize: '19px' },
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        borderRadius: '10px',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.2s',
        fontFamily: 'inherit',
        ...variantStyle[variant],
        ...sizeStyle[size],
      }}
    >
      {loading && (
        <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
      )}
      {children}
    </button>
  )
}
