import { Routes, Route, Navigate } from 'react-router-dom'
import AppBar from './components/layout/AppBar'
import CfgNav from './components/layout/CfgNav'
import MdNav from './components/layout/MdNav'
import StubPage from './components/layout/StubPage'

function MarketDataLayout() {
  return (
    <>
      <MdNav />
      <Routes>
        <Route index element={<Navigate to="curves" replace />} />
        <Route path="curves"    element={<StubPage label="Curves"    sprint={2} note="Day 2" />} />
        <Route path="surfaces"  element={<StubPage label="Surfaces"  sprint={2} note="Day 2" />} />
        <Route path="fixings"   element={<StubPage label="Fixings"   sprint={2} note="Day 2" />} />
        <Route path="snap"      element={<StubPage label="Snap"      sprint={2} note="Day 2" />} />
        <Route path="snapshots" element={<StubPage label="Snapshots" sprint={2} note="Day 2" />} />
      </Routes>
    </>
  )
}

function ConfigurationsLayout() {
  return (
    <>
      <CfgNav />
      <Routes>
        <Route index element={<Navigate to="market-data" replace />} />
        <Route path="market-data/*"  element={<MarketDataLayout />} />
        <Route path="org-hierarchy"  element={<StubPage label="Org Hierarchy"  sprint={2} note="Day 4" />} />
        <Route path="market-risk"    element={<StubPage label="Market Risk Config" sprint={10} />} />
        <Route path="ccr"            element={<StubPage label="CCR Config"     sprint={14} />} />
        <Route path="onboarding"     element={<StubPage label="Onboarding"     sprint={7} />} />
        <Route path="methodology"    element={<StubPage label="Methodology"    sprint={19} />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppBar />
      <div style={{ flex: 1, paddingTop: 'var(--appbar-h)', overflow: 'hidden' }}>
        <Routes>
          <Route index element={<Navigate to="/configurations/market-data" replace />} />
          <Route path="/pricer"           element={<StubPage label="Pricer"      sprint={5} />} />
          <Route path="/pnl"              element={<StubPage label="PnL"         sprint={11} />} />
          <Route path="/market-risk"      element={<StubPage label="Market Risk" sprint={10} />} />
          <Route path="/ccr"              element={<StubPage label="CCR"         sprint={14} />} />
          <Route path="/simm"             element={<StubPage label="SIMM"        sprint={16} />} />
          <Route path="/blockchain"       element={<StubPage label="Blockchain"  sprint={18} />} />
          <Route path="/configurations/*" element={<ConfigurationsLayout />} />
        </Routes>
      </div>
    </div>
  )
}
