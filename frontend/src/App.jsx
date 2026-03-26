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
