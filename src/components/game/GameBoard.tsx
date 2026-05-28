import { GameCard as GameCardComponent } from '../GameCard'
import { Button } from '../ui/Button'
import { PlayerBoard } from './PlayerBoard'
import { GameLog } from './GameLog'
import { TurnTimer } from './TurnTimer'
import type { GameState, GameCard } from '../../types/game'
import { formatWealth } from '../../types/game'
import { TURN_TIME_LIMIT_MS } from '../../lib/gameEngine'

export type UIPhase = 'playing' | 'decision' | 'targeting'

interface GameBoardProps {
  gameState: GameState
  myPlayerId: string
  isMultiplayer: boolean
  uiPhase: UIPhase
  onlinePlayers?: Set<string>
  onDrawCard: () => void
  onPlayCard: (card: GameCard) => void
  onTargetSelect: (targetIndex: number) => void
  onDecision: (type: 'spend' | 'save' | 'invest') => void
  onTimeout: () => void
  onCancelTargeting: () => void
}

export function GameBoard({
  gameState,
  myPlayerId,
  isMultiplayer,
  uiPhase,
  onlinePlayers = new Set(),
  onDrawCard,
  onPlayCard,
  onTargetSelect,
  onDecision,
  onTimeout,
  onCancelTargeting,
}: GameBoardProps) {
  const myPlayerIndex = gameState.players.findIndex(p => p.id === myPlayerId)
  const isMyTurn = gameState.players[gameState.currentPlayerIndex]?.id === myPlayerId
  const myPlayer = myPlayerIndex >= 0 ? gameState.players[myPlayerIndex] : null
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  // Rearrange players for display so local player is always first
  const displayPlayers = [...gameState.players]
  if (myPlayerIndex > 0) {
    const me = displayPlayers.splice(myPlayerIndex, 1)[0]
    displayPlayers.unshift(me)
  }

  return (
    <div className="game-board-layout" style={{ flex: 1, display: 'flex', padding: '16px 24px', gap: 24, maxWidth: 1440, margin: '0 auto', width: '100%' }}>
      
      {/* LEFT COLUMN: Players & Action */}
      <div className="game-left-col" style={{ flex: '1 1 900px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Players */}
        <div className="players-container">
          {displayPlayers.map((player) => {
            const originalIndex = gameState.players.findIndex(p => p.id === player.id)
            return (
              <div key={player.id}>
                <PlayerBoard
                  player={player}
                  isCurrent={originalIndex === gameState.currentPlayerIndex}
                  isMe={player.id === myPlayerId}
                  isTarget={uiPhase === 'targeting' && player.id !== myPlayerId}
                  isOffline={isMultiplayer && !onlinePlayers.has(player.id)}
                  wealthGoal={gameState.wealthGoal}
                  seatIndex={originalIndex}
                  onClick={() => onTargetSelect(originalIndex)}
                />
              </div>
            )
          })}
        </div>

        {/* Action panel */}
        <div className="glass-panel" style={{
          borderRadius: 20, padding: '24px', minHeight: 480, boxShadow: 'none'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 23, color: 'var(--text-dark)', fontWeight: 700 }}>
            {isMyTurn ? <span style={{ color: '#60a5fa' }}>Your Turn</span> : <span>{currentPlayer?.name}'s Turn</span>}
          </h2>
          <div style={{ fontSize: 15, color: '#475569', fontWeight: 700 }}>TURN {gameState.turn}</div>
        </div>
        
        <TurnTimer 
          turnStartTime={gameState.turnStartTime} 
          timeLimit={TURN_TIME_LIMIT_MS} 
          active={
            gameState.phase !== 'game_over' && (
              isMyTurn || 
              (!isMultiplayer && gameState.players[0].id === myPlayerId) || 
              (isMultiplayer && gameState.players[0].id === myPlayerId && !onlinePlayers.has(gameState.players[gameState.currentPlayerIndex]?.id))
            )
          }
          onTimeout={onTimeout} 
        />

        {/* Not my turn */}
        {!isMyTurn && uiPhase === 'playing' && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 19, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              Waiting for {currentPlayer?.name}...
            </div>
            <div style={{ fontSize: 16, color: '#475569' }}>Their turn to play</div>
            {/* Show my hand while waiting */}
            {myPlayer && myPlayer.hand.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 15, color: '#475569', marginBottom: 10 }}>
                  Your hand ({myPlayer.hand.length} cards):
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {myPlayer.hand.map(card => (
                    <GameCardComponent key={card.id} card={card} compact disabled />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Draw phase */}
        {isMyTurn && gameState.phase === 'draw' && (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 18 }}>
              Your turn! Draw a card to start.
            </div>
            <Button size="lg" variant="gold" onClick={onDrawCard}>
              Draw a Card ({gameState.deck.length} left in deck)
            </Button>
            {myPlayer && myPlayer.hand.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 15, color: '#475569', marginBottom: 10 }}>Your current hand:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {myPlayer.hand.map(card => (
                    <GameCardComponent key={card.id} card={card} compact disabled />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Play phase — show full hand, pick one to play */}
        {isMyTurn && gameState.phase === 'play' && uiPhase === 'playing' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 16, color: '#94a3b8' }}>
                {gameState.drawnCard ? `Drew "${gameState.drawnCard.name}" — pick a card to play:` : 'Pick a card to play:'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {myPlayer?.hand.map(card => (
                <GameCardComponent key={card.id} card={card} onClick={() => onPlayCard(card)} />
              ))}
            </div>
          </div>
        )}

        {/* Decision card */}
        {uiPhase === 'decision' && gameState.pendingDecision && (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Left Side: Hand & Context */}
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ marginBottom: 16, display: 'none' /* hidden for cleaner look */ }}>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 4 }}>
                  {gameState.pendingDecision.card.name}
                </h3>
                <p style={{ fontSize: 16, color: '#475569' }}>{gameState.pendingDecision.card.flavor}</p>
              </div>
              
              <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                <p style={{ fontSize: 15, color: '#475569', marginBottom: 10 }}>Your current hand:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {myPlayer?.hand.map(card => (
                    <div key={card.id} style={{ position: 'relative' }}>
                      {card.id === gameState.pendingDecision!.card.id && (
                        <div style={{ position: 'absolute', inset: -4, borderRadius: 16, background: 'var(--blue-primary)', opacity: 0.3, filter: 'blur(8px)', animation: 'pulse 2s infinite' }} />
                      )}
                      <div style={{ transform: card.id === gameState.pendingDecision!.card.id ? 'translateY(-12px)' : 'none', transition: 'transform 0.2s ease', position: 'relative', zIndex: 1 }}>
                        <GameCardComponent card={card} compact onClick={() => onPlayCard(card)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side: Decision Options */}
            <div style={{ flex: '1 1 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: 24, animation: 'fadeIn 0.3s ease', maxHeight: '50vh', overflowY: 'auto', paddingRight: 8 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-dark)', marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                {gameState.pendingDecision.card.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12 }}>{gameState.pendingDecision.card.flavor}</p>
              
              {gameState.pendingDecision.card.options?.map(opt => {
                const colors = {
                  spend: { bg: 'rgba(234, 88, 12, 0.08)', border: '#ea580c', labelColor: '#c2410c', hoverBg: 'rgba(234, 88, 12, 0.15)', borderFocus: '#9a3412' },
                  save: { bg: 'rgba(16, 185, 129, 0.08)', border: '#10b981', labelColor: '#047857', hoverBg: 'rgba(16, 185, 129, 0.15)', borderFocus: '#059669' },
                  invest: { bg: 'rgba(59, 130, 246, 0.08)', border: '#3b82f6', labelColor: '#1d4ed8', hoverBg: 'rgba(59, 130, 246, 0.15)', borderFocus: '#1e40af' }
                }
                const c = colors[opt.type as keyof typeof colors] || colors.save
                const effectVal = opt.effect.value ?? 0
                const sign = effectVal >= 0 ? '+' : ''
                return (
                  <button
                    key={opt.type}
                    onClick={() => onDecision(opt.type as any)}
                    style={{
                      padding: '8px 12px', borderRadius: 10,
                      background: c.bg, border: `2px solid ${c.border}`,
                      color: 'var(--text-dark)', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = c.hoverBg; (e.currentTarget as HTMLButtonElement).style.borderColor = c.borderFocus }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = c.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = c.border }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 800, color: c.labelColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{opt.type}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, lineHeight: 1.2 }}>{opt.description}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: effectVal >= 0 ? '#059669' : '#c2410c', fontFamily: 'var(--font-display)' }}>
                      {sign}{formatWealth(Math.abs(effectVal))}
                      {opt.effect.type === 'wealth_next_turn' && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>next turn</span>}
                      {opt.effect.type === 'wealth_end_game' && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 4 }}>at game end</span>}
                    </div>
                    {opt.investRisk && opt.failEffect && (
                      <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, marginTop: 4, background: 'rgba(220, 38, 38, 0.1)', padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                        ⚠️ {opt.investRisk}% Risk: {opt.failEffect.value! < 0 ? '-' : '+'}{formatWealth(Math.abs(opt.failEffect.value ?? 0))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Action card targeting phase (Select opponent) */}
        {uiPhase === 'targeting' && gameState.playedCard && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 22, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 18, color: '#f1f5f9', fontWeight: 700, marginBottom: 8 }}>
              Select a target for {gameState.playedCard.name}
            </div>
            <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 20 }}>
              Click on an opponent's panel above to target them.
            </div>
            <Button variant="secondary" onClick={onCancelTargeting}>Cancel</Button>
          </div>
        )}
      </div>
      {/* END LEFT COLUMN */}
      </div>

      {/* RIGHT COLUMN: Game Log & Deck (Desktop only if space tight) */}
      <div className="game-right-col" style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GameLog log={gameState.log} />
      </div>
    </div>
  )
}
