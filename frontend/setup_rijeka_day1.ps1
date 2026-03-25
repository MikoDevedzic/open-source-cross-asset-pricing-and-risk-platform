# Rijeka — Day 1 Setup Script
# Run this from: C:\Users\mikod\OneDrive\Desktop\Rijeka\frontend
# Command: powershell -ExecutionPolicy Bypass -File setup_rijeka_day1.ps1

Write-Host "Setting up Rijeka Day 1 files..." -ForegroundColor Cyan

# ── Create folder structure ────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "src\components\layout" | Out-Null
Write-Host "Created src/components/layout" -ForegroundColor Green

# ── vite.config.js ────────────────────────────────────────────────────────
Set-Content -Path "vite.config.js" -Encoding UTF8 -Value @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    }
  }
})
'@
Write-Host "Created vite.config.js" -ForegroundColor Green

# ── src/index.css ─────────────────────────────────────────────────────────
Set-Content -Path "src\index.css" -Encoding UTF8 -Value @'
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');
@import "tailwindcss";

:root {
  --bg:         #060a0e;
  --bg-deep:    #03060a;
  --panel:      #0b1219;
  --panel-2:    #0f1820;
  --border:     #192433;
  --border-hi:  #213040;
  --text:       #7da8c0;
  --text-hi:    #b8d8e8;
  --text-dim:   #344e62;
  --accent:     #0ec9a0;
  --accent-dim: #097a61;
  --amber:      #e8a020;
  --blue:       #3d8bc8;
  --purple:     #9060cc;
  --red:        #c84040;
  --mono:       'JetBrains Mono', monospace;
  --appbar-h:   48px;
  --cfgnav-h:   38px;
  --mdnav-h:    36px;
  --sidebar-w:  260px;
}

*, *::before, *::after { box-sizing: border-box; }

html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--mono);
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-deep); }
::-webkit-scrollbar-thumb { background: var(--border-hi); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

.rj-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.rj-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
  letter-spacing: 0.04em;
}
'@
Write-Host "Created src/index.css" -ForegroundColor Green

# ── src/main.jsx ──────────────────────────────────────────────────────────
Set-Content -Path "src\main.jsx" -Encoding UTF8 -Value @'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
'@
Write-Host "Created src/main.jsx" -ForegroundColor Green

# ── src/App.jsx ───────────────────────────────────────────────────────────
Set-Content -Path "src\App.jsx" -Encoding UTF8 -Value @'
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
        <Route path="org-hierarchy"  element={<StubPage label="Org Hierarchy"     sprint={2} note="Day 4" />} />
        <Route path="market-risk"    element={<StubPage label="Market Risk Config" sprint={10} />} />
        <Route path="ccr"            element={<StubPage label="CCR Config"         sprint={14} />} />
        <Route path="onboarding"     element={<StubPage label="Onboarding"         sprint={7} />} />
        <Route path="methodology"    element={<StubPage label="Methodology"        sprint={19} />} />
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
          <Route path="/pricer"           element={<StubPage label="Pricer"      sprint={5}  />} />
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
'@
Write-Host "Created src/App.jsx" -ForegroundColor Green

# ── src/components/layout/AppBar.jsx ──────────────────────────────────────
Set-Content -Path "src\components\layout\AppBar.jsx" -Encoding UTF8 -Value @'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'MARKET DATA', path: '/configurations/market-data' },
  { label: 'PRICER',      path: '/pricer',      sprint: 5  },
  { label: 'MARKET RISK', path: '/market-risk', sprint: 10 },
  { label: 'CCR',         path: '/ccr',         sprint: 14 },
  { label: 'SIMM',        path: '/simm',        sprint: 16 },
  { label: 'PNL',         path: '/pnl',         sprint: 11 },
  { label: 'BLOCKCHAIN',  path: '/blockchain',  sprint: 18 },
  { label: 'CONFIG',      path: '/configurations' },
]

export default function AppBar() {
  const { pathname } = useLocation()

  function isActive(item) {
    if (item.path === '/configurations') return pathname.startsWith('/configurations')
    return pathname.startsWith(item.path)
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 'var(--appbar-h)', zIndex: 100,
      background: 'var(--bg-deep)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '24px',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontWeight: 600,
        fontSize: '15px', letterSpacing: '0.12em',
        color: 'var(--accent)', userSelect: 'none',
      }}>
        RIJEKA
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

      <nav style={{ display: 'flex', alignItems: 'stretch', height: '100%' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          const isStub = !!item.sprint
          return (
            <NavLink key={item.path} to={item.path}
              title={isStub ? `Sprint ${item.sprint}` : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0 14px', textDecoration: 'none',
                fontSize: '11px', fontWeight: 500,
                letterSpacing: '0.08em', fontFamily: 'var(--mono)',
                color: active ? 'var(--accent)' : isStub ? 'var(--text-dim)' : 'var(--text)',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div style={{ marginLeft: 'auto' }}>
        <span className="rj-badge" style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          color: 'var(--text-dim)',
        }}>S2</span>
      </div>
    </header>
  )
}
'@
Write-Host "Created AppBar.jsx" -ForegroundColor Green

# ── src/components/layout/CfgNav.jsx ──────────────────────────────────────
Set-Content -Path "src\components\layout\CfgNav.jsx" -Encoding UTF8 -Value @'
import { NavLink, useLocation } from 'react-router-dom'

const CFG_ITEMS = [
  { label: 'Market Data',   path: '/configurations/market-data' },
  { label: 'Org Hierarchy', path: '/configurations/org-hierarchy' },
  { label: 'Onboarding',    path: '/configurations/onboarding',  sprint: 7  },
  { label: 'Market Risk',   path: '/configurations/market-risk', sprint: 10 },
  { label: 'CCR',           path: '/configurations/ccr',         sprint: 14 },
  { label: 'Methodology',   path: '/configurations/methodology', sprint: 19 },
]

export default function CfgNav() {
  const { pathname } = useLocation()

  return (
    <div style={{
      position: 'fixed', top: 'var(--appbar-h)', left: 0, right: 0,
      height: 'var(--cfgnav-h)', zIndex: 90,
      background: 'var(--panel)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '4px',
    }}>
      <span className="rj-label" style={{ marginRight: 12 }}>CONFIGURATIONS</span>
      <div style={{ width: 1, height: 16, background: 'var(--border)', marginRight: 8 }} />

      {CFG_ITEMS.map(item => {
        const active = pathname.startsWith(item.path)
        const isStub = !!item.sprint
        return (
          <NavLink key={item.path} to={item.path} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 3,
            textDecoration: 'none', fontSize: '11px',
            fontFamily: 'var(--mono)', letterSpacing: '0.04em',
            fontWeight: active ? 500 : 400,
            color: active ? 'var(--accent)' : isStub ? 'var(--text-dim)' : 'var(--text)',
            background: active ? 'var(--accent-dim)' : 'transparent',
            border: active ? '1px solid var(--accent-dim)' : '1px solid transparent',
          }}>
            {item.label}
            {isStub && <span style={{ marginLeft: 5, fontSize: 9, color: 'var(--text-dim)' }}>S{item.sprint}</span>}
          </NavLink>
        )
      })}
    </div>
  )
}
'@
Write-Host "Created CfgNav.jsx" -ForegroundColor Green

# ── src/components/layout/MdNav.jsx ───────────────────────────────────────
Set-Content -Path "src\components\layout\MdNav.jsx" -Encoding UTF8 -Value @'
import { NavLink, useLocation } from 'react-router-dom'

const MD_ITEMS = [
  { label: 'Curves',    path: '/configurations/market-data/curves'    },
  { label: 'Surfaces',  path: '/configurations/market-data/surfaces'  },
  { label: 'Fixings',   path: '/configurations/market-data/fixings'   },
  { label: 'Snap',      path: '/configurations/market-data/snap'      },
  { label: 'Snapshots', path: '/configurations/market-data/snapshots' },
]

export default function MdNav() {
  const { pathname } = useLocation()

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(var(--appbar-h) + var(--cfgnav-h))',
      left: 0, right: 0,
      height: 'var(--mdnav-h)', zIndex: 80,
      background: 'var(--panel-2)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: '2px',
    }}>
      {MD_ITEMS.map(item => {
        const active = pathname.startsWith(item.path)
        return (
          <NavLink key={item.path} to={item.path} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 9px', borderRadius: 2,
            textDecoration: 'none', fontSize: '11px',
            fontFamily: 'var(--mono)', letterSpacing: '0.04em',
            color: active ? 'var(--text-hi)' : 'var(--text)',
            borderBottom: active ? '1px solid var(--text-hi)' : '1px solid transparent',
          }}>
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )
}
'@
Write-Host "Created MdNav.jsx" -ForegroundColor Green

# ── src/components/layout/StubPage.jsx ────────────────────────────────────
Set-Content -Path "src\components\layout\StubPage.jsx" -Encoding UTF8 -Value @'
export default function StubPage({ label, sprint, note }) {
  return (
    <div style={{
      paddingTop: 'calc(var(--appbar-h) + var(--cfgnav-h) + var(--mdnav-h))',
      height: '100%',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 8,
      color: 'var(--text-dim)', fontFamily: 'var(--mono)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text)', letterSpacing: '0.06em' }}>{label}</div>
      {sprint && <div style={{ fontSize: 11 }}>Sprint {sprint}</div>}
      {note   && <div style={{ fontSize: 10, opacity: 0.6 }}>{note}</div>}
    </div>
  )
}
'@
Write-Host "Created StubPage.jsx" -ForegroundColor Green

# ── Remove Vite default files we don't need ────────────────────────────────
Remove-Item -Force -ErrorAction SilentlyContinue "src\App.css"
Remove-Item -Force -ErrorAction SilentlyContinue "src\assets\react.svg"
Write-Host "Cleaned up Vite defaults" -ForegroundColor Green

Write-Host ""
Write-Host "Day 1 setup complete. All files created." -ForegroundColor Cyan
Write-Host "Go to http://localhost:5173 in your browser." -ForegroundColor Cyan
