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
