import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function Auth() {
  const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (username.length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return }
        await register(email, password, username)
        localStorage.setItem('justRegistered', 'true')
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(32,160,96,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
 
      <div style={{ width: '100%', maxWidth: 400, position: 'relative', animation: 'slideUp 0.4s ease forwards' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 35, color: 'var(--orange-dark)', letterSpacing: '-0.02em', marginBottom: 8 }}>
              PAISA WAR
            </div>
          </Link>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>
            {mode === 'login' ? 'Welcome back' : 'Join the game'}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account to start playing'}
          </p>
        </div>
 
        <div style={{ background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.4)', borderRadius: 20, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
          {/* Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.4)', borderRadius: 10, padding: 4, marginBottom: 24, border: '1px solid rgba(255, 255, 255, 0.5)' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: mode === m ? 'var(--green-action)' : 'transparent',
                  color: mode === m ? 'var(--bg-mint-white)' : 'var(--text-muted)',
                  fontSize: 18, fontWeight: 600, transition: 'all 0.2s', fontFamily: 'inherit',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
 
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <Input
                label="Username"
                id="username"
                type="text"
                placeholder="your_mogul_name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
 
            {error && (
              <div style={{ background: 'rgba(224,80,32,0.1)', border: '1px solid var(--orange-primary)', borderRadius: 8, padding: '10px 14px', fontSize: 16, color: 'var(--orange-dark)' }}>
                {error}
              </div>
            )}
 
            <Button type="submit" size="lg" loading={loading} style={{ width: '100%', marginTop: 4 }}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
 
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 16, color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ color: 'var(--green-primary)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16, fontWeight: 600 }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
