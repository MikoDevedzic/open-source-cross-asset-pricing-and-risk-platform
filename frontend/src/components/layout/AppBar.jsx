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
      }}>RIJEKA</div>
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
              }}>
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
