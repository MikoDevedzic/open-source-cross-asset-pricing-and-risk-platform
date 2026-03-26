// deliver_fix_appjsx.js — Rijeka Day 5 hotfix
// Restores initAuth() call that was dropped in Day 5 delivery
//
// node C:\Users\mikod\OneDrive\Desktop\Rijeka\deliver_fix_appjsx.js

const fs   = require('fs')
const path = require('path')

const ROOT = 'C:\\Users\\mikod\\OneDrive\\Desktop\\Rijeka'

function write(rel, content) {
  const full = path.join(ROOT, rel.split('/').join(path.sep))
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf8')
  console.log('  ✅  ' + rel)
}

write('frontend/src/App.jsx',
`import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import LoginPage     from './components/auth/LoginPage'
import SignupPage    from './components/auth/SignupPage'
import ConfirmPage   from './components/auth/ConfirmPage'
import AuthGuard     from './components/auth/AuthGuard'
import CommandCenter from './components/CommandCenter'
import AppBar        from './components/layout/AppBar'
import CfgNav        from './components/layout/CfgNav'

// ⚠️ VERIFY: adjust filename if yours differs
import CurvesWorkspace from './components/market-data/CurvesWorkspace'

import OrgHierarchy   from './components/org/OrgHierarchy'
import LegalEntities  from './components/onboarding/LegalEntities'
import Counterparties from './components/onboarding/Counterparties'

// Layout wrapper for all /configurations/* routes
function CfgLayout() {
  return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'100vh', background:'var(--bg)', overflow:'hidden'
    }}>
      <AppBar />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <CfgNav />
        <main style={{ flex:1, overflowY:'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const initAuth = useAuthStore((s) => s.initAuth)

  // ← this was the missing line — kicks off session check on mount
  useEffect(() => { initAuth() }, [initAuth])

  return (
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route path="/confirm" element={<ConfirmPage />} />

        {/* ── Protected ── */}
        <Route element={<AuthGuard />}>
          <Route path="/command-center" element={<CommandCenter />} />

          {/* Configurations workspace */}
          <Route element={<CfgLayout />}>
            <Route path="/configurations/market-data/curves" element={<CurvesWorkspace />} />
            <Route path="/configurations/org-hierarchy"      element={<OrgHierarchy />} />
            <Route path="/configurations/legal-entities"     element={<LegalEntities />} />
            <Route path="/configurations/counterparties"     element={<Counterparties />} />
          </Route>
        </Route>

        {/* ── Fallbacks ── */}
        <Route path="/"  element={<Navigate to="/command-center" replace />} />
        <Route path="*"  element={<Navigate to="/command-center" replace />} />
      </Routes>
    </Router>
  )
}
`)

console.log(`
✅  Done.

  node C:\\Users\\mikod\\OneDrive\\Desktop\\Rijeka\\deliver_fix_appjsx.js

Then hard-refresh the browser (Ctrl+Shift+R).
You should go straight through to /command-center.
`)
