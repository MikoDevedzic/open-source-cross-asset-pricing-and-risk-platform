$base = "C:\Users\mikod\OneDrive\Desktop\Rijeka"

# ── .env ─────────────────────────────────────────────────────
Set-Content "$base\frontend\.env" @'
VITE_SUPABASE_URL=https://upuewetohnocfshkhafg.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_jfdfyrFFT5BF2js3cFXJ8A_PH2o3jEa
'@

# ── .gitignore ────────────────────────────────────────────────
$gi = "$base\.gitignore"
if (-not (Select-String -Path $gi -Pattern "^\.env$" -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content $gi "`n.env"
}

# ── supabase.js ───────────────────────────────────────────────
Set-Content "$base\frontend\src\lib\supabase.js" @'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing Supabase env vars. Check your .env file.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: {
      getItem:    (key) => sessionStorage.getItem(key),
      setItem:    (key, value) => sessionStorage.setItem(key, value),
      removeItem: (key) => sessionStorage.removeItem(key),
    },
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true,
  }
})
'@

# ── useAuthStore.js ───────────────────────────────────────────
Set-Content "$base\frontend\src\store\useAuthStore.js" @'
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set, get) => ({
  session:     null,
  profile:     null,
  loading:     true,
  isNewSignup: false,

  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
      if (session) get().fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        set({ session, loading: false })
        if (event === 'SIGNED_IN' && session) {
          const isNew = await get().fetchProfile(session.user.id)
          if (isNew) set({ isNewSignup: true })
        }
        if (event === 'SIGNED_OUT') {
          set({ profile: null, isNewSignup: false })
        }
      }
    )
    return () => subscription.unsubscribe()
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) { console.error('Profile fetch error:', error); return false }
    const isNew = !get().profile
    set({ profile: data })
    return isNew
  },

  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + '/confirm' }
    })
    return { data, error }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null, isNewSignup: false })
  },

  clearNewSignup: () => set({ isNewSignup: false }),
}))

export function previewTraderId(email) {
  if (!email || !email.includes('@')) return ''
  const local = email.split('@')[0]
  return local
    .toUpperCase()
    .replace(/[^A-Z.]/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.|\.$/g, '')
}
'@

# ── AuthGuard.jsx ─────────────────────────────────────────────
Set-Content "$base\frontend\src\components\auth\AuthGuard.jsx" @'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function AuthGuard({ children }) {
  const { session, loading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { state: { from: location.pathname }, replace: true })
    }
  }, [session, loading, navigate, location])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)',
        fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: '13px',
        letterSpacing: '0.1em'
      }}>
        INITIALISING...
      </div>
    )
  }

  if (!session) return null
  return children
}
'@

# ── LoginPage.jsx ─────────────────────────────────────────────
Set-Content "$base\frontend\src\components\auth\LoginPage.jsx" @'
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginPage() {
  const { signIn } = useAuthStore()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const from = location.state?.from || '/configurations/market-data/curves'

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
    navigate(from, { replace: true })
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
'@

# ── SignupPage.jsx ────────────────────────────────────────────
Set-Content "$base\frontend\src\components\auth\SignupPage.jsx" @'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, previewTraderId } from '../../store/useAuthStore'

export default function SignupPage() {
  const { signUp } = useAuthStore()
  const navigate   = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  const traderId = previewTraderId(email)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error: err } = await signUp(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-logo">RIJEKA</div>
          <div className="auth-confirm-icon">✦</div>
          <h2 className="auth-title" style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--text)', letterSpacing: '0.05em', margin: '0 0 0.5rem' }}>Check your email</h2>
          <p className="auth-sub">We sent a confirmation link to<br /><span className="auth-email-highlight">{email}</span></p>
          <p className="auth-sub" style={{ marginTop: '1rem', opacity: 0.5 }}>Click the link to activate your account.</p>
          {traderId && (
            <div className="auth-handle-preview" style={{ marginTop: '1.5rem' }}>
              <span className="auth-handle-label">YOUR HANDLE</span>
              <span className="auth-handle-value">{traderId}</span>
            </div>
          )}
          <Link to="/login" className="auth-link" style={{ marginTop: '2rem', display: 'block', textAlign: 'center', fontSize: '11px' }}>Back to login</Link>
        </div>
      </div>
    )
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
          {traderId && (
            <div className="auth-handle-preview">
              <span className="auth-handle-label">YOUR HANDLE</span>
              <span className="auth-handle-value">{traderId}</span>
            </div>
          )}
          <div className="auth-field">
            <label className="auth-label">PASSWORD</label>
            <input className="auth-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          <div className="auth-field">
            <label className="auth-label">CONFIRM PASSWORD</label>
            <input className="auth-input" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'CREATING ACCOUNT...' : 'REQUEST ACCESS'}
          </button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
        <p className="auth-footer" style={{ marginTop: '0.5rem', opacity: 0.35 }}>
          <a href="mailto:hello@rijeka.app" className="auth-link">hello@rijeka.app</a>
        </p>
      </div>
    </div>
  )
}
'@

# ── ConfirmPage.jsx ───────────────────────────────────────────
Set-Content "$base\frontend\src\components\auth\ConfirmPage.jsx" @'
import { useEffect, useRef } from 'react'
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
    navigate('/configurations/market-data/curves', { replace: true })
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
              This is your permanent identity on the platform.<br />
              It will appear on every trade, snapshot, and audit event you touch.
            </p>
            <button className="auth-btn" onClick={handleEnter}>ENTER THE SYSTEM →</button>
            <p className="auth-footer" style={{ marginTop: '1.5rem', opacity: 0.35 }}>
              Early access · read-only · <a href="mailto:hello@rijeka.app" className="auth-link">hello@rijeka.app</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
'@

# ── AppBar.jsx ────────────────────────────────────────────────
Set-Content "$base\frontend\src\components\layout\AppBar.jsx" @'
import { useNavigate } from 'react-router-dom'
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
        <span className="appbar-logo" onClick={() => navigate('/configurations/market-data/curves')} style={{ cursor: 'pointer' }}>
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
            <button className="appbar-signout" onClick={handleSignOut} title="Sign out">EXIT</button>
          </>
        )}
      </div>
    </header>
  )
}
'@

# ── App.jsx ───────────────────────────────────────────────────
Set-Content "$base\frontend\src\App.jsx" @'
import { useEffect } from 'react'
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
            <Route path="org-hierarchy" element={<StubPage title="Org Hierarchy" sprint={4} />} />
            <Route path="onboarding"    element={<StubPage title="Onboarding"    sprint={7} />} />
            <Route path="market-risk"   element={<StubPage title="Market Risk Config" sprint={10} />} />
            <Route path="ccr"           element={<StubPage title="CCR Config"    sprint={14} />} />
            <Route path="methodology"   element={<StubPage title="Methodology"   sprint={19} />} />
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
    ? <Navigate to="/configurations/market-data/curves" replace />
    : <Navigate to="/login" replace />
}

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)
  useEffect(() => { const unsub = initAuth(); return unsub }, [initAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
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
'@

# ── auth CSS — append to index.css ───────────────────────────
$authCss = @'

/* ── AUTH PAGES ───────────────────────────────────────────── */
.auth-shell { display:flex; align-items:center; justify-content:center; min-height:100vh; background:var(--bg-deep); padding:2rem; }
.auth-card { width:100%; max-width:400px; background:var(--panel); border:1px solid var(--border); padding:2.5rem 2rem; display:flex; flex-direction:column; align-items:center; gap:0; }
.auth-card--confirm { max-width:460px; padding:3rem 2.5rem; }
.auth-logo { font-family:var(--mono); font-size:1.5rem; font-weight:700; letter-spacing:0.25em; color:var(--accent); margin-bottom:0.25rem; }
.auth-tagline { font-family:var(--mono); font-size:10px; letter-spacing:0.15em; color:var(--text-muted); text-transform:uppercase; margin-bottom:2rem; }
.auth-form { width:100%; display:flex; flex-direction:column; gap:1rem; margin-bottom:1.25rem; }
.auth-field { display:flex; flex-direction:column; gap:0.35rem; }
.auth-label { font-family:var(--mono); font-size:10px; letter-spacing:0.12em; color:var(--text-muted); }
.auth-input { background:var(--bg); border:1px solid var(--border); color:var(--text); font-family:var(--mono); font-size:13px; padding:0.6rem 0.75rem; outline:none; transition:border-color 0.15s; width:100%; box-sizing:border-box; }
.auth-input:focus { border-color:var(--accent); }
.auth-input::placeholder { color:var(--text-muted); opacity:0.5; }
.auth-handle-preview { background:var(--bg-deep); border:1px solid var(--accent); border-left:3px solid var(--accent); padding:0.5rem 0.75rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; width:100%; box-sizing:border-box; }
.auth-handle-label { font-family:var(--mono); font-size:9px; letter-spacing:0.12em; color:var(--text-muted); flex-shrink:0; }
.auth-handle-value { font-family:var(--mono); font-size:13px; font-weight:700; color:var(--accent); letter-spacing:0.05em; }
.auth-error { font-family:var(--mono); font-size:11px; color:var(--red); border:1px solid var(--red); padding:0.5rem 0.75rem; background:rgba(217,80,64,0.08); }
.auth-btn { background:var(--accent); color:var(--bg-deep); border:none; font-family:var(--mono); font-size:11px; font-weight:700; letter-spacing:0.15em; padding:0.75rem 1rem; cursor:pointer; transition:opacity 0.15s; width:100%; margin-top:0.25rem; }
.auth-btn:hover:not(:disabled) { opacity:0.85; }
.auth-btn:disabled { opacity:0.5; cursor:not-allowed; }
.auth-footer { font-family:var(--mono); font-size:11px; color:var(--text-muted); text-align:center; margin:0; }
.auth-link { color:var(--accent); text-decoration:none; }
.auth-link:hover { text-decoration:underline; }
.auth-sub { font-family:var(--mono); font-size:12px; color:var(--text-muted); text-align:center; line-height:1.6; margin:0; }
.auth-email-highlight { color:var(--text); }
.confirm-welcome { font-family:var(--mono); font-size:15px; color:var(--text); letter-spacing:0.05em; margin:1.5rem 0 2rem; text-align:center; font-style:italic; }
.confirm-handle-block { background:var(--bg-deep); border:1px solid var(--accent); padding:1.25rem 2rem; display:flex; flex-direction:column; align-items:center; gap:0.4rem; width:100%; box-sizing:border-box; margin-bottom:1.5rem; }
.confirm-handle-label { font-family:var(--mono); font-size:9px; letter-spacing:0.18em; color:var(--text-muted); }
.confirm-handle-value { font-family:var(--mono); font-size:22px; font-weight:700; color:var(--accent); letter-spacing:0.08em; }
.confirm-note { margin-bottom:1.5rem; font-size:11px; }
.auth-confirm-icon { font-size:2rem; color:var(--accent); margin:1rem 0; }
.appbar-role { font-family:var(--mono); font-size:9px; letter-spacing:0.15em; color:var(--amber); text-transform:uppercase; }
.appbar-trader { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--accent); letter-spacing:0.05em; }
.appbar-signout { background:transparent; border:1px solid var(--border); color:var(--text-muted); font-family:var(--mono); font-size:9px; letter-spacing:0.12em; padding:0.2rem 0.5rem; cursor:pointer; margin-left:0.5rem; transition:border-color 0.15s,color 0.15s; }
.appbar-signout:hover { border-color:var(--red); color:var(--red); }
'@

Add-Content "$base\frontend\src\index.css" $authCss

Write-Host ""
Write-Host "✓ All files written successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  cd frontend"
Write-Host "  npm install @supabase/supabase-js@latest"
Write-Host "  npm run dev"
