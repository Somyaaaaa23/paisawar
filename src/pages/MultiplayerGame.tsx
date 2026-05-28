import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import type { GameState, GameCard as GameCardType } from '../types/game'
import { formatWealth } from '../types/game'
import {
  processDecision, processAction, advanceTurn, startDrawPhase, forceSkipTurn
} from '../lib/gameEngine'
import { pushGameState, leaveRoom } from '../lib/multiplayerEngine'
import { saveGameResult } from '../lib/auth'
import Confetti from 'react-confetti'
import { supabase } from '../lib/supabase'
import { ForfeitModal } from '../components/ForfeitModal'
import { playSound } from '../lib/audio'
import { GameBoard, UIPhase } from '../components/game/GameBoard'

type PagePhase = UIPhase | 'loading' | 'result'

export function MultiplayerGame() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [uiPhase, setUiPhase] = useState<PagePhase>('loading')
  const [notification, setNotification] = useState<string | null>(null)
  const [showForfeitModal, setShowForfeitModal] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set())
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')
  
  // Use a string representation for stable useEffect dependencies
  const onlinePlayersStr = Array.from(onlinePlayers).sort().join(',')

  // Use refs to avoid stale closures in async callbacks and subscriptions
  const gameStateRef = useRef<GameState | null>(null)
  const uiPhaseRef = useRef<PagePhase>('loading')
  const resultSavedRef = useRef(false)
  const profileRef = useRef(profile)
  profileRef.current = profile

  const myPlayerId = profile?.id ?? ''

  // Derive these from gameState on every render
  const myPlayerIndex = gameState?.players.findIndex(p => p.id === myPlayerId) ?? -1
  const myPlayer = myPlayerIndex >= 0 ? gameState?.players[myPlayerIndex] ?? null : null

  function setPhase(phase: PagePhase) {
    uiPhaseRef.current = phase
    setUiPhase(phase)
  }

  function notify(msg: string) {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  async function saveResult(state: GameState) {
    if (resultSavedRef.current) return
    const p = profileRef.current
    if (!p) return
    resultSavedRef.current = true
    const isWinner = state.winner?.id === p.id
    const myFinalPlayer = state.players.find(pl => pl.id === p.id)
    const myWealth = myFinalPlayer?.wealth ?? 0
    const placement = [...state.players]
      .sort((a, b) => b.wealth - a.wealth)
      .findIndex(pl => pl.id === p.id) + 1
    await saveGameResult(p.id, p.username, isWinner, myWealth, placement, state.players.length, p.win_streak ?? 0, {
      investChoices: myFinalPlayer?.investChoices ?? 0,
      emiDamageTaken: myFinalPlayer?.emiDamageTaken ?? false
    })
    await refreshProfile()
  }

  function applyRemoteState(gs: GameState) {
    setGameState(gs)
    gameStateRef.current = gs
    if (gs.phase === 'game_over') {
      setPhase('result')
      saveResult(gs)
      if (gs.winner?.id === myPlayerId) playSound('win')
      else playSound('lose')
    } else {
      // Only reset to 'playing' if not mid-local-interaction
      const cur = uiPhaseRef.current
      if (cur !== 'decision' && cur !== 'targeting' && cur !== 'result') {
        setPhase('playing')
      }
    }
  }

  // Helper to determine if we should accept remote state over local optimistic state
  const shouldApplyRemoteState = useCallback((remoteState: GameState) => {
    const localState = gameStateRef.current
    if (!localState) return true
    
    // Always accept if the remote state advanced to a newer turn
    if (remoteState.turn > localState.turn) return true
    
    // Always accept if the number of active players decreased (someone forfeited)
    const remoteActiveCount = remoteState.players.filter(p => !p.hasForfeited).length
    const localActiveCount = localState.players.filter(p => !p.hasForfeited).length
    if (remoteActiveCount < localActiveCount) return true
    
    // If it's NOT our turn, we must accept phase/log changes from the active player
    const isMyTurnLocally = localState.players[localState.currentPlayerIndex]?.id === myPlayerId
    if (!isMyTurnLocally) {
      if (remoteState.phase !== localState.phase || 
          remoteState.currentPlayerIndex !== localState.currentPlayerIndex ||
          JSON.stringify(remoteState.log[0]) !== JSON.stringify(localState.log[0])) {
        return true
      }
    }
    
    return false
  }, [myPlayerId])

  // Single effect: subscribe first, then do initial fetch.
  // This way we never miss an update that arrives between fetch and subscribe.
  useEffect(() => {
    if (!roomId) return

    // Use a unique channel name for the game view so it doesn't clash with the lobby channel
    const channel = supabase
      .channel(`game-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineIds = new Set<string>()
        Object.values(state).forEach(presences => {
          presences.forEach((p: any) => {
            if (p.player_id) onlineIds.add(p.player_id)
          })
        })
        setOnlinePlayers(onlineIds)
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'multiplayer_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as { game_state: GameState | null }
          if (updated.game_state && shouldApplyRemoteState(updated.game_state)) {
            applyRemoteState(updated.game_state)
          }
        },
      )
      .on('broadcast', { event: 'game_state_changed' }, (payload) => {
        const updated = payload.payload as { game_state: GameState | null }
        if (updated.game_state && shouldApplyRemoteState(updated.game_state)) {
          applyRemoteState(updated.game_state)
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          if (myPlayerId) await channel.track({ player_id: myPlayerId })
          
          // Initial fetch after subscription is live — no missed updates
          const { data } = await supabase
            .from('multiplayer_rooms')
            .select('game_state, status')
            .eq('id', roomId)
            .single()
          if (data?.game_state) {
            applyRemoteState(data.game_state as GameState)
          }
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          setConnectionStatus('disconnected')
        }
      })

    return () => { channel.unsubscribe() }
  }, [roomId, shouldApplyRemoteState]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeout = useCallback(async () => {
    const gs = gameStateRef.current
    if (!gs || gs.phase === 'game_over') return
    
    const activePlayerId = gs.players[gs.currentPlayerIndex].id
    const isHost = gs.players[0].id === myPlayerId
    const isMe = activePlayerId === myPlayerId
    
    // If we are not host or active player, only allow timeout if active player is offline
    if (!isHost && !isMe && onlinePlayers.has(activePlayerId)) return

    const newState = forceSkipTurn(gs)
    setGameState(newState)
    gameStateRef.current = newState
    setPhase(newState.phase === 'game_over' ? 'result' : 'playing')
    await pushState(newState)
    playSound('lose')
    notify(`Time ran out for ${gs.players[gs.currentPlayerIndex].name}!`)
  }, [myPlayerId, onlinePlayers])

  async function pushState(state: GameState) {
    if (!roomId) return
    await pushGameState(roomId, state)
  }

  // Auto-forfeit offline opponents after 15s grace period
  useEffect(() => {
    const gs = gameStateRef.current
    if (!gs || gs.phase === 'game_over' || !roomId || !myPlayerId) return
    
    // Only the host manages the auto-forfeit to prevent race conditions
    const isHost = gs.players[0]?.id === myPlayerId
    if (!isHost) return

    // Find players who are in the game but not in onlinePlayers
    const offlinePlayerIds = gs.players
      .filter(p => !p.hasForfeited)
      .map(p => p.id)
      .filter(id => !onlinePlayers.has(id))

    if (offlinePlayerIds.length === 0) return

    // Start 15s timer
    const timer = setTimeout(async () => {
      // Re-evaluate after 15s using latest refs
      const currentGs = gameStateRef.current
      if (!currentGs || currentGs.phase === 'game_over') return
      
      let forfeitState = { ...currentGs }
      let didForfeit = false

      offlinePlayerIds.forEach(offlineId => {
        if (!onlinePlayers.has(offlineId)) {
          // They are STILL offline after 15s, force forfeit
          const updatedPlayers = forfeitState.players.map(p => 
            p.id === offlineId ? { ...p, wealth: 0, hasForfeited: true } : p
          )
          const offlinePlayer = forfeitState.players.find(p => p.id === offlineId)
          forfeitState = {
            ...forfeitState,
            players: updatedPlayers,
            log: [`${offlinePlayer?.name} disconnected and forfeited.`, ...forfeitState.log].slice(0, 20)
          }
          didForfeit = true

          // Pass turn if it was their turn
          if (currentGs.players[currentGs.currentPlayerIndex].id === offlineId) {
             forfeitState = advanceTurn(forfeitState)
          }
        }
      })

      if (didForfeit) {
        // Check win condition
        const activeCount = forfeitState.players.filter(p => !p.hasForfeited).length
        if (activeCount <= 1) {
          const winner = forfeitState.players.filter(p => !p.hasForfeited)[0] ?? forfeitState.players[0]
          forfeitState = {
            ...forfeitState,
            winner,
            phase: 'game_over',
            log: [`🏆 Everyone else disconnected! ${winner.name} WINS!`, ...forfeitState.log].slice(0, 20)
          }
        }

        setGameState(forfeitState)
        gameStateRef.current = forfeitState
        await pushState(forfeitState)
        if (forfeitState.phase === 'game_over') {
          saveResult(forfeitState)
        }
      }
    }, 15000)

    return () => clearTimeout(timer)
  }, [onlinePlayersStr, roomId, myPlayerId])

  // --- Game action handlers ---

  async function handleDrawCard() {
    const gs = gameStateRef.current
    if (!gs || gs.players[gs.currentPlayerIndex]?.id !== myPlayerId) return
    if (gs.phase !== 'draw') return

    const { state: drawn } = startDrawPhase(gs, myPlayerIndex)
    const updated = { ...drawn, phase: 'play' as const }
    setGameState(updated)
    gameStateRef.current = updated
    playSound('draw')
    // Don't push yet — player needs to pick a card
  }

  async function handlePlayCard(card: GameCardType) {
    const gs = gameStateRef.current
    if (!gs || gs.players[gs.currentPlayerIndex]?.id !== myPlayerId) return
    if (gs.phase !== 'play') return

    if (card.type === 'decision') {
      const updated = { ...gs, pendingDecision: { card, playerIndex: myPlayerIndex } }
      setGameState(updated)
      gameStateRef.current = updated
      setPhase('decision')
      // Don't push — decision hasn't been made yet
    } else if (card.type === 'action') {
      if (card.effect?.target === 'target') {
        const updated = { ...gs, pendingTarget: { card, playerIndex: myPlayerIndex, effect: card.effect } }
        setGameState(updated)
        gameStateRef.current = updated
        setPhase('targeting')
        // Don't push — target not picked yet
      } else {
        // AoE or self action — apply immediately
        const next = processAction(gs, myPlayerIndex, card, myPlayerIndex)
        const final = next.phase !== 'game_over' ? advanceTurn(next) : next
        setGameState(final)
        gameStateRef.current = final
        setPhase(final.phase === 'game_over' ? 'result' : 'playing')
        await pushState(final)
        playSound('play')
        if (final.phase === 'game_over') saveResult(final)
        notify(`Played ${card.name}!`)
      }
    } else if (card.type === 'defense') {
      // Playing defense as regular turn action — discard it and end turn
      const discard = [...gs.discardPile, card]
      const hand = gs.players[myPlayerIndex].hand.filter(c => c.id !== card.id)
      const players = gs.players.map((p, i) => i === myPlayerIndex ? { ...p, hand } : p)
      const next = advanceTurn({ ...gs, players, discardPile: discard })
      setGameState(next)
      gameStateRef.current = next
      setPhase(next.phase === 'game_over' ? 'result' : 'playing')
      await pushState(next)
      playSound('defend')
      if (next.phase === 'game_over') saveResult(next)
      notify('Discarded defense card.')
    }
  }

  async function handleDecision(choice: 'spend' | 'save' | 'invest') {
    const gs = gameStateRef.current
    if (!gs?.pendingDecision) return
    const { card } = gs.pendingDecision
    const next = processDecision(gs, myPlayerIndex, choice, card)
    const final = next.phase !== 'game_over' ? advanceTurn(next) : next
    const cleared = { ...final, pendingDecision: null }
    setGameState(cleared)
    gameStateRef.current = cleared
    setPhase(final.phase === 'game_over' ? 'result' : 'playing')
    await pushState(cleared)
    playSound('play')
    if (final.phase === 'game_over') saveResult(final)
    notify(`${choice.charAt(0).toUpperCase() + choice.slice(1)}!`)
  }

  async function handleTargetSelect(targetIndex: number) {
    const gs = gameStateRef.current
    if (!gs?.pendingTarget) return
    const { card } = gs.pendingTarget
    const next = processAction(gs, myPlayerIndex, card, targetIndex)
    const final = next.phase !== 'game_over' ? advanceTurn(next) : next
    const cleared = { ...final, pendingTarget: null }
    setGameState(cleared)
    gameStateRef.current = cleared
    setPhase(final.phase === 'game_over' ? 'result' : 'playing')
    await pushState(cleared)
    playSound('attack')
    if (final.phase === 'game_over') saveResult(final)
    notify(`${card.name} hit ${gs.players[targetIndex].name}!`)
  }



  const handleForfeit = async () => {
    setShowForfeitModal(false)
    const gs = gameStateRef.current
    if (!gs || !roomId || !myPlayerId) {
      if (roomId && myPlayerId) {
        await leaveRoom(roomId, myPlayerId).catch(() => {})
      }
      navigate('/dashboard')
      return
    }

    const updatedPlayers = gs.players.map(p => {
      if (p.id === myPlayerId) {
        return { ...p, wealth: 0, hasForfeited: true }
      }
      return p
    })
    
    let forfeitState = { 
      ...gs, 
      players: updatedPlayers, 
      log: [`${myPlayer?.name} forfeited the match.`, ...gs.log].slice(0, 20)
    }

    // If it's our turn, pass turn.
    if (gs.currentPlayerIndex === myPlayerIndex) {
      forfeitState = advanceTurn(forfeitState)
    } else {
      const activePlayers = updatedPlayers.filter(p => !p.hasForfeited)
      if (activePlayers.length <= 1) {
        const remainingWinner = activePlayers[0] ?? updatedPlayers[0]
        forfeitState = {
          ...forfeitState,
          winner: remainingWinner,
          phase: 'game_over',
          log: [`🏆 Everyone else forfeited! ${remainingWinner.name} WINS!`, ...forfeitState.log].slice(0, 20),
        }
      }
    }
    
    setGameState(forfeitState)
    gameStateRef.current = forfeitState
    
    // Background the async tasks so navigation is instant
    Promise.resolve().then(async () => {
      try {
        await pushState(forfeitState)
        await leaveRoom(roomId, myPlayerId).catch(() => {})

        // Record loss and deduct 25 coins
        if (profile) {
          await saveGameResult(profile.id, profile.username, false, 0, gs.players.length, gs.players.length, profile.win_streak ?? 0)
          await supabase.from('profiles').update({ daanik_coins: Math.max(0, (profile.daanik_coins || 0) - 25) }).eq('id', profile.id)
        }
      } catch (e) {
        console.error(e)
      }
    })
    
    navigate('/dashboard')
  }

  // ---- Render ----

  if (uiPhase === 'loading' || !gameState) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--green-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid var(--green-primary)',
          borderTopColor: 'var(--gold)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ color: 'var(--gray)', fontSize: 18 }}>Loading game...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (uiPhase === 'result') {
    const sorted = [...gameState.players].sort((a, b) => b.wealth - a.wealth)
    const myFinalPlayer = gameState.players.find(p => p.id === myPlayerId)
    const isWinner = gameState.winner?.id === myPlayerId
    const placement = sorted.findIndex(p => p.id === myPlayerId) + 1
    const ordinal = placement === 1 ? 'st' : placement === 2 ? 'nd' : placement === 3 ? 'rd' : 'th'

    return (
      <div style={{ minHeight: '100vh', background: 'var(--green-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {isWinner && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} colors={['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#f1f5f9']} />}
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: 'clamp(50px, 15vw, 80px)', marginBottom: 16 }}>
            {isWinner ? '🏆' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '💪'}
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 8vw, 40px)', fontWeight: 800, fontFamily: 'var(--font-display)', color: isWinner ? 'var(--gold)' : 'var(--green-light)', marginBottom: 8 }}>
            {isWinner ? 'Victory!' : `${placement}${ordinal} Place`}
          </h1>
          <p style={{ color: 'var(--gray)', marginBottom: 28, fontSize: 20 }}>
            Final wealth: {formatWealth(myFinalPlayer?.wealth ?? 0)}
          </p>

          <div style={{ background: 'var(--green-deep)', border: '1px solid var(--green-primary)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Final Rankings
            </h3>
            {sorted.map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--green-primary)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 25, width: 28 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={{
                    fontSize: 18,
                    fontWeight: p.id === myPlayerId ? 700 : 500,
                    color: p.id === myPlayerId ? 'var(--green-bright)' : 'var(--green-light)',
                  }}>
                    {p.name}{p.id === myPlayerId ? ' (you)' : ''}
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-bright)', fontFamily: 'var(--font-display)' }}>
                  {formatWealth(p.wealth)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Button variant="gold" size="lg" onClick={() => navigate('/multiplayer')}>Play Again</Button>
            <Button variant="secondary" onClick={async () => {
              if (roomId && myPlayerId) {
                await leaveRoom(roomId, myPlayerId).catch(() => {})
              }
              navigate('/dashboard')
            }}>Dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}>
        <button onClick={() => setShowForfeitModal(true)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← LEAVE
        </button>
        <div className="desktop-only" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#0f172a', position: 'absolute', left: '50%', transform: 'translateX(-50%)', letterSpacing: '-0.02em' }}>
          PAISA<span style={{ color: '#10b981' }}>WAR</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>ONLINE</span>
          </div>
        </div>
      </div>

      {showForfeitModal && (
        <ForfeitModal 
          onCancel={() => setShowForfeitModal(false)}
          onConfirm={handleForfeit}
        />
      )}

      {connectionStatus === 'disconnected' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, color: 'white', flexDirection: 'column', gap: 16
        }}>
          <div style={{ width: 44, height: 44, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>Connection Lost</h2>
          <p style={{ color: '#94a3b8', fontSize: 18 }}>Attempting to reconnect to game server...</p>
        </div>
      )}

      {notification && (
        <div style={{
          position: 'fixed', top: 68, right: 20,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, padding: '11px 18px',
          fontSize: 18, color: '#f1f5f9', zIndex: 200,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {notification}
        </div>
      )}

      <GameBoard
        gameState={gameState}
        myPlayerId={myPlayerId}
        isMultiplayer={true}
        uiPhase={uiPhase as UIPhase}
        onlinePlayers={onlinePlayers}
        onDrawCard={handleDrawCard}
        onPlayCard={handlePlayCard}
        onTargetSelect={handleTargetSelect}
        onDecision={handleDecision}
        onTimeout={handleTimeout}
        onCancelTargeting={() => {
          setPhase('playing')
        }}
      />
    </div>
  )
}
