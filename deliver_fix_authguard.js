// deliver_fix_authguard.js — Rijeka hotfix
// AuthGuard must render <Outlet /> not {children} for React Router v6 layout routes
//
// node C:\Users\mikod\OneDrive\Desktop\Rijeka\deliver_fix_authguard.js

const fs   = require('fs')
const path = require('path')

const ROOT = 'C:\\Users\\mikod\\OneDrive\\Desktop\\Rijeka'

function write(rel, content) {
  const full = path.join(ROOT, rel.split('/').join(path.sep))
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf8')
  console.log('  ✅  ' + rel)
}

write('frontend/src/components/auth/AuthGuard.jsx',
`import { useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function AuthGuard() {
  const { session, loading } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

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

  return <Outlet />
}
`)

console.log(`
✅  Done.

Hard-refresh the browser (Ctrl+Shift+R) after running this script.
`)
