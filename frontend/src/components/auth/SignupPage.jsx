import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, previewTraderId } from '../../store/useAuthStore'

export default function SignupPage() {
  const { signUp } = useAuthStore()

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
          <p className="auth-sub" style={{ marginTop: '0.5rem' }}>Check your email</p>
          <p className="auth-sub" style={{ marginTop: '0.5rem' }}>
            Confirmation link sent to <span className="auth-email-highlight">{email}</span>
          </p>
          {traderId && (
            <div className="auth-handle-preview" style={{ marginTop: '1.5rem' }}>
              <span className="auth-handle-label">YOUR HANDLE</span>
              <span className="auth-handle-value">{traderId}</span>
            </div>
          )}
          <Link to="/login" className="auth-link"
            style={{ marginTop: '2rem', display: 'block', textAlign: 'center', fontSize: '11px' }}>
            Back to login
          </Link>
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
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: '0.5rem', opacity: 0.35 }}>
          <a href="mailto:hello@rijeka.app" className="auth-link">hello@rijeka.app</a>
        </p>
      </div>
    </div>
  )
}
