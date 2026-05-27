import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

const FEATURE_CARDS = [
  { icon: '🎴', title: 'Real Indian Money Decisions', desc: 'Every card puts you in a situation you might face in real life. SIPs, EMIs, Tax Raids, IPOs — your choices decide your fate.' },
  { icon: '⚔️', title: 'Attack & Defend', desc: 'Play Action cards to attack rivals with Tax Raids, Market Crashes, and UPI Frauds. Counter with Defense cards.' },
  { icon: '👑', title: 'Mogul Rank Ladder', desc: 'Climb from Rookie to DAANIK Legend through 8 rank tiers. RP gained, RP lost — the ladder never lies.' },
  { icon: '🏦', title: 'DAANIK Economy', desc: 'Earn DAANIK Coins, trade cards, join Guilds, and invest in the in-game stock market that mirrors player behavior.' },
  { icon: '📅', title: 'Prestige Seasons', desc: '30-day seasons with unique themes — IPO Boom, Crypto Cycle, Election Economy. New rules every month.' },
  { icon: '⚡', title: 'Daily Contracts', desc: '3 contracts reset every midnight. Miss them and they\'re gone. Build your streak, earn rare cards.' },
]

const PREVIEW_CARDS = [
  { name: 'Diwali Bonus', type: 'decision', color: '#209060', icon: '🟢', tier: 'COMMON', effect: '+₹50,000', desc: 'Gain wealth' },
  { name: 'Market Crash', type: 'action', color: '#E05020', icon: '🔴', tier: 'RARE', effect: '-20%', desc: 'All lose wealth' },
  { name: 'Emergency Fund', type: 'defense', color: '#1070C0', icon: '🔵', tier: 'COMMON', effect: 'BLOCK', desc: 'Stop an attack' },
  { name: 'The Black Swan', type: 'action', color: '#FFD050', icon: '⚡', tier: 'LEGENDARY', effect: 'CRISIS', desc: 'Extreme event' },
]

export function Landing() {
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 50,
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(238, 239, 224, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--green-primary)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--green-primary)', letterSpacing: '-0.02em' }}>
          PAISA WAR
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/auth" style={{ color: 'var(--text-dark)', textDecoration: 'none', fontSize: 18, fontWeight: 500 }}>Sign In</Link>
          <Link to="/auth?mode=register">
            <Button size="sm">Play Now</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background is now handled globally in index.css */}

        <div style={{ animation: 'fadeIn 0.6s ease forwards', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(224,80,32,0.3)', background: 'rgba(224,80,32,0.08)', marginBottom: 24 }}>
            <span style={{ fontSize: 15, color: 'var(--orange-dark)', fontWeight: 600, letterSpacing: '0.05em' }}>THE MONEY DECISION GAME</span>
          </div>

          <h1 style={{ fontSize: 'clamp(48px, 8vw, 88px)', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
            <span style={{ color: 'var(--text-dark)' }}>Earn.</span>{' '}
            <span style={{ color: 'var(--orange-dark)' }}>Attack.</span>{' '}
            <span style={{ color: 'var(--green-primary)' }}>Dominate.</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
            A fast-paced financial card game with real Indian money decisions. Race to ₹50 Lakhs through SIPs, Market Crashes, Tax Raids, and more.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth?mode=register">
              <Button size="lg" variant="gold">Start Playing Free</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Floating Cards Preview */}
        <div style={{ marginTop: 64, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {PREVIEW_CARDS.map((card, i) => (
            <div key={card.name} style={{
              width: 120, height: 168,
              background: 'var(--card-paper)',
              border: `2px solid ${card.color}`,
              borderRadius: 12,
              padding: 12,
              display: 'flex', flexDirection: 'column', gap: 8,
              animation: `floatCard ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: card.color, fontWeight: 800 }}>{card.icon} {card.type.toUpperCase()}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: card.color, color: card.color === '#FFD050' ? '#000' : '#fff' }}>{card.tier[0]}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-soft-black)', fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
                {card.name}
              </div>
              <div style={{ flex: 1, borderRadius: 6, background: 'rgba(255,255,255,0.5)', border: `1px solid ${card.color}33`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: card.color === '#FFD050' ? '#d97706' : card.color }}>{card.effect}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.2 }}>{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="glass-panel" style={{ padding: '32px 24px', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: '1px solid var(--green-primary)', borderBottom: '1px solid var(--green-primary)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 24, textAlign: 'center' }}>
          {[
            { label: 'Cards', value: '108' },
            { label: 'Player Goal', value: '₹50L' },
            { label: 'Rank Tiers', value: '8' },
            { label: 'Game Time', value: '20-30 min' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 35, fontWeight: 800, color: 'var(--orange-dark)', fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: 45, fontFamily: 'var(--font-display)', color: 'var(--green-primary)', marginBottom: 8 }}>Why Paisa War?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 56, fontSize: 18 }}>Everything you love about competitive card games, built around Indian financial life.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {FEATURE_CARDS.map(f => (
            <div key={f.title} className="glass-panel" style={{
              padding: '28px', borderRadius: '24px',
              transition: 'all 0.3s ease',
              border: '1px solid var(--green-primary)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--blue-primary)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--green-primary)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{f.title}</h3>
              <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass-panel" style={{ padding: '80px 24px', textAlign: 'center', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: '1px solid var(--green-primary)', borderBottom: '1px solid var(--green-primary)' }}>
        <h2 style={{ fontSize: 50, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--green-primary)', marginBottom: 16 }}>Ready to build your empire?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 23, marginBottom: 40 }}>Join thousands of players racing to ₹50 Lakhs.</p>
        <Link to="/auth?mode=register">
          <Button size="lg" variant="gold">Play Now — It's Free</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 24px', borderTop: '1px solid var(--green-primary)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--orange-dark)', marginBottom: 8 }}>PAISA WAR</div>
        <div>The Money Decision Game — For entertainment & financial literacy purposes.</div>
      </footer>
    </div>
  )
}
