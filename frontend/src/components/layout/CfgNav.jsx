import { NavLink } from 'react-router-dom'

const SECTIONS = [
  {
    label: 'MARKET DATA',
    links: [
      { to:'/configurations/market-data/curves', label:'CURVES' }
    ]
  },
  {
    label: 'ORG',
    links: [
      { to:'/configurations/org-hierarchy', label:'ORG HIERARCHY' }
    ]
  },
  {
    label: 'ONBOARDING',
    links: [
      { to:'/configurations/legal-entities',  label:'LEGAL ENTITIES' },
      { to:'/configurations/counterparties',  label:'COUNTERPARTIES' }
    ]
  }
]

export default function CfgNav() {
  return (
    <nav style={{
      width:'200px', minWidth:'200px', flexShrink:0,
      background:'var(--panel)',
      borderRight:'1px solid var(--panel-3)',
      overflowY:'auto',
      padding:'16px 0'
    }}>
      {SECTIONS.map(function(section) {
        return (
          <div key={section.label} style={{ marginBottom:'20px' }}>
            <div style={{
              fontSize:'9px', fontFamily:'var(--mono)',
              color:'var(--text-dim)', letterSpacing:'0.14em',
              padding:'0 16px 6px', opacity:0.55
            }}>
              {section.label}
            </div>
            {section.links.map(function(link) {
              return (
                <NavLink key={link.to} to={link.to}
                  style={function(p) {
                    return {
                      display:'block', padding:'7px 16px',
                      fontFamily:'var(--mono)', fontSize:'11px',
                      letterSpacing:'0.06em', textDecoration:'none',
                      color: p.isActive ? 'var(--accent)' : 'var(--text-dim)',
                      background: p.isActive
                        ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                        : 'transparent',
                      borderLeft: p.isActive
                        ? '2px solid var(--accent)'
                        : '2px solid transparent'
                    }
                  }}>
                  {link.label}
                </NavLink>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
