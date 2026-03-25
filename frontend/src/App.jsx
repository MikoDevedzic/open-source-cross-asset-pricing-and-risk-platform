import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppBar from './components/layout/AppBar';
import CfgNav from './components/layout/CfgNav';
import MdNav from './components/layout/MdNav';
import StubPage from './components/layout/StubPage';
import CurvesWorkspace from './components/market-data/CurvesWorkspace';

// ── Asset-class sub-views for Curves (Credit/FX/Equity/Commodity stubs) ──
function CurvesRates()     { return <CurvesWorkspace />; }
function CurvesCredit()    { return <SprintStub sprint={8}  title="Credit Spread Curves"      desc="Survival probability and hazard rate curves per counterparty. 12 CreditQ buckets + 2 CreditNonQ." arch="engines/bootstrap/credit.py" />; }
function CurvesFX()        { return <SprintStub sprint={6}  title="FX Forward Curves"         desc="Derived curves — domestic OIS ÷ foreign OIS + FX forward points (CIP). All G13 pairs vs USD." arch="engines/instruments/rates_fx/xccy.py" />; }
function CurvesEquity()    { return <SprintStub sprint={12} title="Equity Curves"             desc="Dividend curves, borrow/repo curves per equity name or index." arch="engines/instruments/equity/eqforward.py" />; }
function CurvesCommodity() { return <SprintStub sprint={12} title="Commodity Forward Curves"  desc="Forward price curves per sector (energy, metals, agriculture). Seasonality stripping for power/gas." arch="engines/instruments/commodity/cmdfwd.py" />; }

// ── Sprint stub component ─────────────────────────────────────
function SprintStub({ sprint, title, desc, arch }) {
  return (
    <div className="sprint-stub">
      <div className="stub-box">
        <div className="stub-sprint">Sprint {sprint}</div>
        <div className="stub-title">{title}</div>
        <div className="stub-desc">{desc}</div>
        {arch && <div className="stub-arch">{arch}</div>}
      </div>
    </div>
  );
}

// ── Curves section: AC nav + routed sub-views ─────────────────
function CurvesSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Asset-class nav */}
      <div className="ac-nav" id="crv-ac-nav">
        <AcBtn to="rates"     label="Rates"     color="var(--accent)"  />
        <AcBtn to="credit"    label="Credit"    color="var(--amber)"   sprint={8} />
        <AcBtn to="fx"        label="FX"        color="var(--blue)"    sprint={6} />
        <AcBtn to="equity"    label="Equity"    color="var(--purple)"  sprint={12} />
        <AcBtn to="commodity" label="Commodity" color="var(--red)"     sprint={12} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route index element={<Navigate to="rates" replace />} />
          <Route path="rates"     element={<CurvesRates />} />
          <Route path="credit"    element={<CurvesCredit />} />
          <Route path="fx"        element={<CurvesFX />} />
          <Route path="equity"    element={<CurvesEquity />} />
          <Route path="commodity" element={<CurvesCommodity />} />
        </Routes>
      </div>
    </div>
  );
}

// ── AC nav button with active state via URL ───────────────────
import { NavLink } from 'react-router-dom';
function AcBtn({ to, label, color, sprint }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `ac-btn${isActive ? ' active' : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <span className="ac-dot" style={{ background: color }} />
      <span className="ac-label">{label}</span>
      {sprint && <span className="ac-sprint">Sprint {sprint}</span>}
    </NavLink>
  );
}

// ── Market Data section wrapper ───────────────────────────────
function MarketDataSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <MdNav />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route index element={<Navigate to="curves" replace />} />
          <Route path="curves/*"    element={<CurvesSection />} />
          <Route path="surfaces"    element={<StubPage title="Surfaces"  sprint={4} />} />
          <Route path="fixings"     element={<StubPage title="Fixings"   sprint={2} />} />
          <Route path="snap"        element={<StubPage title="Snap"      sprint={2} />} />
          <Route path="snapshots"   element={<StubPage title="Snapshots" sprint={2} />} />
        </Routes>
      </div>
    </div>
  );
}

// ── Config section wrapper ─────────────────────────────────────
function ConfigSection() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <CfgNav />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route index element={<Navigate to="market-data" replace />} />
          <Route path="market-data/*" element={<MarketDataSection />} />
          <Route path="org-hierarchy" element={<StubPage title="Org Hierarchy"   sprint={4} />} />
          <Route path="onboarding"    element={<StubPage title="Onboarding"      sprint={7} />} />
          <Route path="market-risk"   element={<StubPage title="Market Risk"     sprint={10} />} />
          <Route path="ccr"           element={<StubPage title="CCR"             sprint={14} />} />
          <Route path="methodology"   element={<StubPage title="Methodology"     sprint={19} />} />
        </Routes>
      </div>
    </div>
  );
}

// ── Root layout ───────────────────────────────────────────────
function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppBar />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route index element={<Navigate to="/config" replace />} />
          <Route path="/pricer"       element={<StubPage title="Pricer"       sprint={3} />} />
          <Route path="/market-risk"  element={<StubPage title="Market Risk"  sprint={5} />} />
          <Route path="/ccr"          element={<StubPage title="CCR"          sprint={9} />} />
          <Route path="/simm"         element={<StubPage title="SIMM"         sprint={11} />} />
          <Route path="/pnl"          element={<StubPage title="PnL"          sprint={7} />} />
          <Route path="/blockchain"   element={<StubPage title="Blockchain"   sprint={16} />} />
          <Route path="/config/*"     element={<ConfigSection />} />
        </Routes>
      </div>
    </div>
  );
}

// ── App root ──────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Layout />} />
      </Routes>
    </BrowserRouter>
  );
}
