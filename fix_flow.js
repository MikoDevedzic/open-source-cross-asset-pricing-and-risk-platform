const fs = require('fs')
const path = require('path')

const base = 'C:\\Users\\mikod\\OneDrive\\Desktop\\Rijeka'

function write(relPath, content) {
  const full = path.join(base, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf8')
  console.log('✓ ' + relPath)
}

// ── CommandCenter.jsx ─────────────────────────────────────────
write('frontend/src/components/CommandCenter.jsx',
`import { useEffect, useRef } from 'react'
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
`)

// ── App.jsx — command center as default post-login route ──────
write('frontend/src/App.jsx',
`import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'

import AppBar          from './components/layout/AppBar'
import CfgNav          from './components/layout/CfgNav'
import MdNav           from './components/layout/MdNav'
import StubPage        from './components/layout/StubPage'
import AuthGuard       from './components/auth/AuthGuard'
import LoginPage       from './components/auth/LoginPage'
import SignupPage      from './components/auth/SignupPage'
import ConfirmPage     from './components/auth/ConfirmPage'
import CommandCenter   from './components/CommandCenter'
import CurvesWorkspace from './components/market-data/CurvesWorkspace'

function ConfigurationsLayout() {
  return (
    <div className="app-root">
      <AppBar />
      <div className="app-body">
        <CfgNav />
        <div className="app-content">
          <Routes>
            <Route path="market-data/*" element={<MarketDataLayout />} />
            <Route path="org-hierarchy" element={<StubPage title="Org Hierarchy"      sprint={4}  />} />
            <Route path="onboarding"    element={<StubPage title="Onboarding"         sprint={7}  />} />
            <Route path="market-risk"   element={<StubPage title="Market Risk Config" sprint={10} />} />
            <Route path="ccr"           element={<StubPage title="CCR Config"         sprint={14} />} />
            <Route path="methodology"   element={<StubPage title="Methodology"        sprint={19} />} />
            <Route index element={<Navigate to="market-data/curves" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

function MarketDataLayout() {
  return (
    <div className="md-root">
      <MdNav />
      <div className="md-content">
        <Routes>
          <Route path="curves/*" element={<CurvesWorkspace />} />
          <Route path="surfaces"  element={<StubPage title="Vol Surfaces" sprint={6} />} />
          <Route path="fixings"   element={<StubPage title="Fixings"      sprint={3} />} />
          <Route path="snap"      element={<StubPage title="Snap"         sprint={3} />} />
          <Route path="snapshots" element={<StubPage title="Snapshots"    sprint={3} />} />
          <Route index element={<Navigate to="curves" replace />} />
        </Routes>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { session, loading } = useAuthStore()
  if (loading) return null
  return session
    ? <Navigate to="/command-center" replace />
    : <Navigate to="/login" replace />
}

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)
  useEffect(() => { const unsub = initAuth(); return unsub }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />

        {/* Command center — first thing you see after auth */}
        <Route path="/command-center" element={<AuthGuard><CommandCenter /></AuthGuard>} />

        {/* App modules */}
        <Route path="/configurations/*" element={<AuthGuard><ConfigurationsLayout /></AuthGuard>} />
        <Route path="/pricer"       element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="Pricer"          sprint={5}  /></div></AuthGuard>} />
        <Route path="/pnl"          element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="PnL Attribution" sprint={11} /></div></AuthGuard>} />
        <Route path="/market-risk"  element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="Market Risk"     sprint={10} /></div></AuthGuard>} />
        <Route path="/ccr"          element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="CCR"             sprint={14} /></div></AuthGuard>} />
        <Route path="/simm"         element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="ISDA SIMM"       sprint={16} /></div></AuthGuard>} />
        <Route path="/blockchain"   element={<AuthGuard><div className="app-root"><AppBar /><StubPage title="Blockchain"      sprint={18} /></div></AuthGuard>} />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
`)

// ── LoginPage — navigate to /command-center after login ───────
write('frontend/src/components/auth/LoginPage.jsx',
`import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) {
      if (err.message.includes('Invalid login')) setError('Invalid email or password.')
      else if (err.message.includes('Email not confirmed')) setError('Please confirm your email first.')
      else setError(err.message)
      return
    }
    navigate('/command-center', { replace: true })
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">RIJEKA</div>
        <p className="auth-tagline">Open-source derivatives risk</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">EMAIL</label>
            <input className="auth-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
          </div>
          <div className="auth-field">
            <label className="auth-label">PASSWORD</label>
            <input className="auth-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/signup" className="auth-link">Request early access</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: '0.5rem', opacity: 0.35 }}>
          <a href="mailto:hello@rijeka.app" className="auth-link">hello@rijeka.app</a>
        </p>
      </div>
    </div>
  )
}
`)

// ── ConfirmPage — navigate to /command-center after confirm ───
write('frontend/src/components/auth/ConfirmPage.jsx',
`import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function ConfirmPage() {
  const { session, profile, loading, fetchProfile, clearNewSignup } = useAuthStore()
  const navigate  = useNavigate()
  const didFetch  = useRef(false)

  useEffect(() => {
    if (!didFetch.current && session && !profile) {
      didFetch.current = true
      fetchProfile(session.user.id)
    }
  }, [session, profile, fetchProfile])

  const handleEnter = () => {
    clearNewSignup()
    navigate('/command-center', { replace: true })
  }

  if (!loading && !session) {
    navigate('/login', { replace: true })
    return null
  }

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card--confirm">
        <div className="auth-logo">RIJEKA</div>
        {loading || !profile ? (
          <p className="auth-sub" style={{ opacity: 0.5, marginTop: '2rem' }}>Loading your profile...</p>
        ) : (
          <>
            <div className="confirm-welcome">Welcome to the river.</div>
            <div className="confirm-handle-block">
              <span className="confirm-handle-label">YOUR TRADER HANDLE</span>
              <span className="confirm-handle-value">{profile.trader_id}</span>
            </div>
            <p className="auth-sub confirm-note">
              This is your permanent identity on the platform.
            </p>
            <button className="auth-btn" onClick={handleEnter}>ENTER THE SYSTEM →</button>
            <p className="auth-footer" style={{ marginTop: '1.5rem', opacity: 0.35 }}>
              Early access · read-only ·{' '}
              <a href="mailto:hello@rijeka.app" className="auth-link">hello@rijeka.app</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
`)

// ── AppBar — RIJEKA → /command-center, EXIT fixed ─────────────
write('frontend/src/components/layout/AppBar.jsx',
`import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function AppBar() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="appbar">
      <div className="appbar-left">
        <span className="appbar-logo"
          onClick={() => navigate('/command-center')}
          style={{ cursor: 'pointer' }}>
          RIJEKA
        </span>
        <span className="appbar-separator">|</span>
        <span className="appbar-system">RISK SYSTEM</span>
      </div>
      <div className="appbar-right">
        {profile && (
          <>
            <span className="appbar-role">{profile.role.replace('_', ' ').toUpperCase()}</span>
            <span className="appbar-separator">·</span>
            <span className="appbar-trader">{profile.trader_id}</span>
            <button className="appbar-signout" onClick={handleSignOut}>EXIT</button>
          </>
        )}
      </div>
    </header>
  )
}
`)

console.log('\nAll files written.')
console.log('Refresh http://localhost:5173 to see changes.')
