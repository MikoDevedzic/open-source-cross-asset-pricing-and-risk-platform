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
