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
