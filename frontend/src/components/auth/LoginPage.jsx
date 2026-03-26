import { useState } from 'react'
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
