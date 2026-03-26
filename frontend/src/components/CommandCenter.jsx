import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const MODULES = [
  { label: 'MARKET DATA',   sub: 'Curves · Surfaces · Fixings', path: '/configurations/market-data/curves', live: true  },
  { label: 'PRICER',        sub: 'IRS · CDS · FX · Swaption',   path: '/pricer',         live: false, sprint: 5  },
  { label: 'MARKET RISK',   sub: 'VaR · Stress · FRTB ES',      path: '/market-risk',    live: false, sprint: 8  },
  { label: 'PNL',           sub: 'Attribution · Desk · Trader', path: '/pnl',            live: false, sprint: 11 },
  { label: 'XVA',           sub: 'CVA · DVA · FVA · MVA · KVA', path: '/xva',            live: false, sprint: 12 },
  { label: 'CCR',           sub: 'Netting · Exposure · SA-CCR', path: '/ccr',            live: false, sprint: 14 },
  { label: 'ISDA SIMM',     sub: 'v2.6 · All 6 risk classes',   path: '/simm',           live: false, sprint: 16 },
  { label: 'BLOCKCHAIN',    sub: 'On-chain confirmation',        path: '/blockchain',     live: false, sprint: 18 },
]

export default function CommandCenter() {
  const { profile, signOut } = useAuthStore()
  const navigate  = useNavigate()
  const canvasRef = useRef(null)

  // ── Matrix rain ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx    = canvas.getContext('2d')
    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight

    const onResize = () => {
      w = canvas.width  = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789αβγδεζΣΩ∂∇∫±√∞≈∑∏ΔΦΨ'
    const fs    = 13
    const cols  = Math.floor(w / fs)
    const drops = Array(cols).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(3,6,10,0.1)'
      ctx.fillRect(0, 0, w, h)
      ctx.font      = fs + 'px JetBrains Mono, monospace'

      drops.forEach((y, i) => {
        const ch  = chars[Math.floor(Math.random() * chars.length)]
        const pct = Math.random()
        if (pct > 0.97)      ctx.fillStyle = '#ffffff'
        else if (pct > 0.85) ctx.fillStyle = 'rgba(14,201,160,0.9)'
        else                 ctx.fillStyle = 'rgba(14,201,160,0.25)'

        ctx.fillText(ch, i * fs, y * fs)
        if (y * fs > h && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      })
    }

    const interval = setInterval(draw, 55)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleTile = (mod) => {
    if (mod.live) navigate(mod.path)
  }

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#03060a', overflow: 'hidden' }}>

      {/* Matrix rain canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      {/* Glass overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(3,6,10,0.7) 0%, rgba(3,6,10,0.5) 50%, rgba(3,6,10,0.8) 100%)',
        backdropFilter: 'blur(1px)'
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', height: '48px',
          borderBottom: '1px solid rgba(14,201,160,0.15)',
          background: 'rgba(3,6,10,0.6)',
          backdropFilter: 'blur(8px)'
        }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px', fontWeight: 700, letterSpacing: '0.25em', color: '#0ec9a0' }}>
            RIJEKA
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {profile && (
              <>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.15em', color: '#e8a020' }}>
                  {profile.role.replace('_',' ').toUpperCase()}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, color: '#0ec9a0' }}>
                  {profile.trader_id}
                </span>
                <button onClick={handleSignOut} style={{
                  background: 'transparent', border: '1px solid rgba(14,201,160,0.2)',
                  color: '#5a7080', fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '9px', letterSpacing: '0.12em', padding: '0.2rem 0.5rem',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { e.target.style.borderColor='#d95040'; e.target.style.color='#d95040' }}
                onMouseLeave={e => { e.target.style.borderColor='rgba(14,201,160,0.2)'; e.target.style.color='#5a7080' }}
                >
                  EXIT
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>

          {/* Welcome */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 'clamp(2.5rem,6vw,5rem)', fontWeight: 700, letterSpacing: '0.2em', color: '#0ec9a0', lineHeight: 1 }}>
              RIJEKA
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(14,201,160,0.5)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
              Risk System
            </div>
            {profile && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#c8d4dc', marginTop: '1.5rem', fontStyle: 'italic', opacity: 0.7 }}>
                Welcome, {profile.trader_id}.
              </div>
            )}
          </div>

          {/* Module tiles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1px',
            width: '100%',
            maxWidth: '900px',
            background: 'rgba(14,201,160,0.08)',
            border: '1px solid rgba(14,201,160,0.15)'
          }}>
            {MODULES.map(mod => (
              <div
                key={mod.label}
                onClick={() => handleTile(mod)}
                style={{
                  background: 'rgba(11,18,25,0.85)',
                  padding: '1.5rem',
                  cursor: mod.live ? 'pointer' : 'default',
                  opacity: mod.live ? 1 : 0.45,
                  transition: 'background 0.15s',
                  backdropFilter: 'blur(4px)'
                }}
                onMouseEnter={e => { if (mod.live) e.currentTarget.style.background = 'rgba(14,201,160,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(11,18,25,0.85)' }}
              >
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: mod.live ? '#0ec9a0' : '#5a7080', marginBottom: '0.4rem' }}>
                  {mod.label}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#5a7080', lineHeight: 1.5 }}>
                  {mod.sub}
                </div>
                {!mod.live && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#3a4a56', marginTop: '0.75rem', letterSpacing: '0.1em' }}>
                    SPRINT {mod.sprint}
                  </div>
                )}
                {mod.live && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#0ec9a0', marginTop: '0.75rem', letterSpacing: '0.1em', opacity: 0.6 }}>
                    LIVE →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'rgba(90,112,128,0.5)', marginTop: '2rem', letterSpacing: '0.1em' }}>
            EARLY ACCESS · READ ONLY · hello@rijeka.app
          </div>
        </div>
      </div>
    </div>
  )
}
