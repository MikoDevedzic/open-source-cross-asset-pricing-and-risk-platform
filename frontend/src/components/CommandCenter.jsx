import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const MODULES = [
  { label: 'MARKET DATA',   sub: 'Curves · Surfaces · Fixings', path: '/configurations/market-data/curves', live: true  },
  { label: 'PRICER',        sub: 'IRS · CDS · FX · Swaption',   path: '/pricer',       live: false, sprint: 5  },
  { label: 'MARKET RISK',   sub: 'VaR · Stress · FRTB ES',      path: '/market-risk',  live: false, sprint: 8  },
  { label: 'PNL',           sub: 'Attribution · Desk · Trader',  path: '/pnl',          live: false, sprint: 11 },
  { label: 'XVA',           sub: 'CVA · DVA · FVA · MVA · KVA', path: '/xva',          live: false, sprint: 12 },
  { label: 'CCR',           sub: 'Netting · Exposure · SA-CCR', path: '/ccr',          live: false, sprint: 14 },
  { label: 'ISDA SIMM',     sub: 'v2.6 · All 6 risk classes',   path: '/simm',         live: false, sprint: 16 },
  { label: 'BLOCKCHAIN',    sub: 'On-chain confirmation',        path: '/blockchain',   live: false, sprint: 18 },
]

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789αβγδεζΣΩΔΦΨ∂∇∫±√∞≈∑∏01010110'

export default function CommandCenter() {
  const { profile, signOut } = useAuthStore()
  const navigate   = useNavigate()
  const canvasRef  = useRef(null)

  // Boot sequence state
  const [phase, setPhase]         = useState('rain')    // rain → title → welcome → tiles
  const [titleText, setTitleText] = useState('')
  const [welcomeText, setWelcomeText] = useState('')
  const [tilesVisible, setTilesVisible] = useState(false)
  const [visibleTiles, setVisibleTiles] = useState([])

  // ── Matrix rain ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width  = window.innerWidth
    let h = canvas.height = window.innerHeight
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', onResize)

    const fs = 13
    const cols = Math.floor(w / fs)
    const drops = Array.from({ length: cols }, () => Math.random() * -50)
    const speeds = Array.from({ length: cols }, () => 0.3 + Math.random() * 0.7)
    const brightCols = new Set(Array.from({ length: Math.floor(cols * 0.15) }, () => Math.floor(Math.random() * cols)))

    let frame = 0
    const draw = () => {
      ctx.fillStyle = 'rgba(3,6,10,0.18)'
      ctx.fillRect(0, 0, w, h)
      frame++

      drops.forEach((y, i) => {
        if (y < 0) { drops[i] += speeds[i]; return }
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
        const bright = brightCols.has(i)
        const head = Math.floor(y) * fs

        // Head character — brightest
        ctx.fillStyle = bright ? '#ffffff' : '#0ec9a0'
        ctx.font = `bold ${fs}px "JetBrains Mono", monospace`
        ctx.fillText(ch, i * fs, head)

        // Trail
        const trailLen = bright ? 18 : 12
        for (let t = 1; t < trailLen; t++) {
          const ty = head - t * fs
          if (ty < 0) continue
          const alpha = bright
            ? (1 - t / trailLen) * 0.9
            : (1 - t / trailLen) * 0.45
          const r = bright ? Math.floor(alpha * 14) : 14
          const g = bright ? Math.floor(alpha * 201) : Math.floor(alpha * 201)
          const b = bright ? Math.floor(alpha * 100) : Math.floor(alpha * 160)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          ctx.font = `${fs}px "JetBrains Mono", monospace`
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * fs, ty)
        }

        drops[i] += speeds[i]
        if (drops[i] * fs > h && Math.random() > 0.97) drops[i] = -Math.random() * 20
      })
    }

    const interval = setInterval(draw, 40)
    return () => { clearInterval(interval); window.removeEventListener('resize', onResize) }
  }, [])

  // ── Boot sequence ─────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return
    const target = 'RIJEKA'
    let i = 0
    // Phase 1: type title after 600ms
    const t1 = setTimeout(() => {
      setPhase('title')
      const ti = setInterval(() => {
        i++
        setTitleText(target.slice(0, i))
        if (i >= target.length) {
          clearInterval(ti)
          // Phase 2: welcome text after 400ms
          setTimeout(() => {
            setPhase('welcome')
            const welcome = `Welcome, ${profile.trader_id}.`
            let j = 0
            const tw = setInterval(() => {
              j++
              setWelcomeText(welcome.slice(0, j))
              if (j >= welcome.length) {
                clearInterval(tw)
                // Phase 3: tiles stagger in
                setTimeout(() => {
                  setPhase('tiles')
                  setTilesVisible(true)
                  MODULES.forEach((_, idx) => {
                    setTimeout(() => {
                      setVisibleTiles(prev => [...prev, idx])
                    }, idx * 80)
                  })
                }, 400)
              }
            }, 35)
          }, 400)
        }
      }, 80)
    }, 600)
    return () => clearTimeout(t1)
  }, [profile])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const s = {
    shell: { position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#03060a', fontFamily: '"JetBrains Mono", monospace' },
    canvas: { position: 'fixed', inset: 0, zIndex: 0 },
    overlay: { position: 'fixed', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at center, rgba(3,6,10,0.55) 0%, rgba(3,6,10,0.82) 100%)' },
    content: { position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100vh' },
    topbar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', height: '48px',
      borderBottom: '1px solid rgba(14,201,160,0.12)',
      background: 'rgba(3,6,10,0.7)', backdropFilter: 'blur(12px)'
    },
    logo: { fontSize: '13px', fontWeight: 700, letterSpacing: '0.25em', color: '#0ec9a0' },
    right: { display: 'flex', alignItems: 'center', gap: '1rem' },
    role: { fontSize: '9px', letterSpacing: '0.15em', color: '#e8a020', textTransform: 'uppercase' },
    trader: { fontSize: '11px', fontWeight: 700, color: '#0ec9a0', letterSpacing: '0.05em' },
    exit: {
      background: 'transparent', border: '1px solid rgba(14,201,160,0.2)',
      color: '#5a7080', fontFamily: '"JetBrains Mono", monospace',
      fontSize: '9px', letterSpacing: '0.12em', padding: '0.2rem 0.6rem', cursor: 'pointer',
      transition: 'all 0.15s'
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  }

  return (
    <div style={s.shell}>
      <canvas ref={canvasRef} style={s.canvas} />
      <div style={s.overlay} />
      <div style={s.content}>

        {/* Topbar */}
        <div style={s.topbar}>
          <span style={s.logo}>RIJEKA</span>
          <div style={s.right}>
            {profile && <>
              <span style={s.role}>{profile.role.replace('_',' ').toUpperCase()}</span>
              <span style={s.trader}>{profile.trader_id}</span>
              <button style={s.exit} onClick={handleSignOut}
                onMouseEnter={e => { e.target.style.borderColor='#d95040'; e.target.style.color='#d95040' }}
                onMouseLeave={e => { e.target.style.borderColor='rgba(14,201,160,0.2)'; e.target.style.color='#5a7080' }}>
                EXIT
              </button>
            </>}
          </div>
        </div>

        {/* Main */}
        <div style={s.main}>

          {/* Title */}
          <div style={{
            fontSize: 'clamp(3rem,8vw,6.5rem)', fontWeight: 700, letterSpacing: '0.25em',
            color: '#0ec9a0', lineHeight: 1, marginBottom: '0.5rem',
            textShadow: phase !== 'rain' ? '0 0 40px rgba(14,201,160,0.5), 0 0 80px rgba(14,201,160,0.2)' : 'none',
            transition: 'text-shadow 0.5s',
            minHeight: '1.2em', textAlign: 'center'
          }}>
            {titleText}
            {phase === 'title' && <span style={{ animation: 'blink 0.7s infinite', opacity: 1 }}>_</span>}
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(14,201,160,0.4)',
            textTransform: 'uppercase', marginBottom: '1.5rem', minHeight: '1.4em'
          }}>
            {phase !== 'rain' ? 'RISK SYSTEM' : ''}
          </div>

          {/* Welcome */}
          <div style={{
            fontSize: '14px', color: '#c8d4dc', fontStyle: 'italic',
            marginBottom: '2.5rem', minHeight: '1.6em', letterSpacing: '0.03em',
            textShadow: '0 0 20px rgba(200,212,220,0.3)'
          }}>
            {welcomeText}
            {phase === 'welcome' && <span style={{ animation: 'blink 0.7s infinite' }}>|</span>}
          </div>

          {/* Tiles */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1px', width: '100%', maxWidth: '860px',
            background: 'rgba(14,201,160,0.06)',
            border: '1px solid rgba(14,201,160,0.1)',
            opacity: tilesVisible ? 1 : 0, transition: 'opacity 0.3s'
          }}>
            {MODULES.map((mod, idx) => (
              <Tile key={mod.label} mod={mod} visible={visibleTiles.includes(idx)} onClick={() => mod.live && navigate(mod.path)} />
            ))}
          </div>

          <div style={{ marginTop: '2rem', fontSize: '9px', letterSpacing: '0.12em', color: 'rgba(90,112,128,0.4)', textAlign: 'center' }}>
            EARLY ACCESS · READ ONLY · hello@rijeka.app
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanline {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(200%); opacity: 0; }
        }
        @keyframes tilein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 8px rgba(14,201,160,0.2), inset 0 0 8px rgba(14,201,160,0.05); }
          50%      { box-shadow: 0 0 20px rgba(14,201,160,0.4), inset 0 0 16px rgba(14,201,160,0.1); }
        }
      `}</style>
    </div>
  )
}

function Tile({ mod, visible, onClick }) {
  const [hovered, setHovered] = useState(false)

  const style = {
    background: hovered
      ? (mod.live ? 'rgba(14,201,160,0.08)' : 'rgba(14,201,160,0.03)')
      : 'rgba(6,10,14,0.85)',
    padding: '1.4rem 1.25rem',
    cursor: mod.live ? 'pointer' : 'default',
    position: 'relative', overflow: 'hidden',
    backdropFilter: 'blur(4px)',
    transition: 'background 0.2s',
    opacity: visible ? 1 : 0,
    animation: visible ? 'tilein 0.3s ease forwards' : 'none',
    ...(mod.live && hovered ? { animation: 'pulse-glow 2s infinite' } : {}),
  }

  return (
    <div style={style} onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Scan line on hover */}
      {hovered && mod.live && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(14,201,160,0.6), transparent)',
          animation: 'scanline 0.4s ease forwards', pointerEvents: 'none', zIndex: 1
        }} />
      )}

      <div style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
        color: mod.live ? (hovered ? '#0ec9a0' : '#0ec9a0') : '#2a4055',
        marginBottom: '0.4rem',
        fontFamily: '"JetBrains Mono", monospace'
      }}>
        {mod.label}
      </div>
      <div style={{
        fontSize: '9px', color: mod.live ? '#3a6070' : '#1a2e3e',
        lineHeight: 1.6, fontFamily: '"JetBrains Mono", monospace'
      }}>
        {mod.sub}
      </div>
      <div style={{
        fontSize: '8px', marginTop: '0.75rem', letterSpacing: '0.1em',
        color: mod.live ? (hovered ? '#0ec9a0' : 'rgba(14,201,160,0.4)') : '#1a2030',
        fontFamily: '"JetBrains Mono", monospace'
      }}>
        {mod.live ? 'LIVE →' : `SPRINT ${mod.sprint}`}
      </div>
    </div>
  )
}
