// ─────────────────────────────────────────────────────────────────────────────
//  deliver_day5.js  ·  Rijeka Sprint 2 Day 5
//  Legal Entities + Counterparties — complete file replacement
//
//  Usage:
//    copy C:\Users\mikod\Downloads\deliver_day5.js C:\Users\mikod\OneDrive\Desktop\Rijeka\deliver_day5.js
//    node C:\Users\mikod\OneDrive\Desktop\Rijeka\deliver_day5.js
//
//  ⚠️  BEFORE RUNNING: check that your CurvesWorkspace component is at
//      frontend/src/components/market-data/CurvesWorkspace.jsx
//      If it's named differently, update the import in App.jsx (search: CurvesWorkspace)
// ─────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

const ROOT = 'C:\\Users\\mikod\\OneDrive\\Desktop\\Rijeka';

function write(rel, content) {
  const full = path.join(ROOT, rel.split('/').join(path.sep));
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  console.log('  \u2705  ' + rel);
}

console.log('\nRijeka Day 5 \u2014 delivering files...\n');

// ─────────────────────────────────────────────────────────────────────────────
//  1.  LegalEntities.jsx
// ─────────────────────────────────────────────────────────────────────────────
write('frontend/src/components/onboarding/LegalEntities.jsx',
`import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const OIS_CURVES = [
  'USD_SOFR','EUR_ESTR','GBP_SONIA','JPY_TONAR','CHF_SARON',
  'AUD_AONIA','CAD_CORRA','SGD_SORA','HKD_HONIA','NOK_NOWA',
  'SEK_STIBOR_OIS','DKK_CIBOR_OIS','NZD_NZOCR',
  'MXN_TIIE_OIS','BRL_CDI','ZAR_ZARONIA','INR_MIBOROIS','CNY_SHIBOR_OIS'
]

const CURRENCIES = [
  'USD','EUR','GBP','JPY','CHF','AUD','CAD',
  'SGD','HKD','NOK','SEK','DKK','NZD','MXN','BRL','ZAR','INR','CNY'
]

const EMPTY = {
  lei:'', name:'', short_name:'', home_currency:'USD',
  jurisdiction:'US', regulatory_regime:'', simm_version:'v2.6',
  im_threshold_m:'', ois_curve_id:'', is_own_entity:false
}

const L = {
  display:'block', fontSize:'10px', fontFamily:'var(--mono)',
  color:'var(--text-dim)', letterSpacing:'0.08em', marginBottom:'4px'
}
const INP = {
  background:'var(--bg)', border:'1px solid var(--panel-3)',
  color:'var(--text)', fontFamily:'var(--mono)', fontSize:'12px',
  padding:'5px 8px', borderRadius:'2px', outline:'none',
  width:'100%', boxSizing:'border-box'
}

function Btn({ color, size, onClick, disabled, children }) {
  const c = color || 'var(--accent)'
  const lg = size === 'lg'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:'transparent',
      border:'1px solid ' + c,
      color: c,
      fontFamily:'var(--mono)',
      fontSize: lg ? '12px' : '10px',
      padding: lg ? '6px 16px' : '3px 8px',
      borderRadius:'2px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      letterSpacing:'0.05em',
      opacity: disabled ? 0.5 : 1,
      whiteSpace:'nowrap'
    }}>{children}</button>
  )
}

function Badge({ color, children }) {
  return (
    <span style={{
      fontSize:'9px', fontFamily:'var(--mono)', letterSpacing:'0.06em',
      padding:'2px 6px', borderRadius:'2px', whiteSpace:'nowrap',
      background:'color-mix(in srgb, ' + color + ' 14%, transparent)',
      color: color,
      border:'1px solid color-mix(in srgb, ' + color + ' 35%, transparent)'
    }}>{children}</span>
  )
}

function Cell({ children, dim }) {
  return (
    <div style={{
      fontSize:'11px', fontFamily:'var(--mono)',
      color: dim ? 'var(--text-dim)' : 'var(--text)',
      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
    }}>{children || '\u2014'}</div>
  )
}

const COLS = '150px 1fr 90px 55px 64px 56px 56px 108px'

export default function LegalEntities() {
  const [rows,         setRows]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [saving,       setSaving]       = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [editName,     setEditName]     = useState('')
  const editRef = useRef(null)

  useEffect(function() { load() }, [])
  useEffect(function() { if (editRef.current) editRef.current.focus() }, [editId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('legal_entities').select('*')
      .order('is_own_entity', { ascending: false })
      .order('name')
    setRows(data || [])
    setLoading(false)
  }

  function f(patch) {
    setForm(function(prev) { return Object.assign({}, prev, patch) })
  }

  async function save() {
    if (!form.lei.trim() || !form.name.trim()) {
      alert('LEI and Name are required.')
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('legal_entities').insert({
      lei:               form.lei.trim().toUpperCase(),
      name:              form.name.trim().toUpperCase(),
      short_name:        form.short_name.trim().toUpperCase() || null,
      home_currency:     form.home_currency,
      jurisdiction:      form.jurisdiction.trim().toUpperCase(),
      regulatory_regime: form.regulatory_regime
        ? form.regulatory_regime.split(',').map(function(s) {
            return s.trim().toUpperCase()
          }).filter(Boolean)
        : [],
      simm_version:      form.simm_version || 'v2.6',
      im_threshold_m:    form.im_threshold_m ? parseFloat(form.im_threshold_m) : null,
      ois_curve_id:      form.ois_curve_id   || null,
      is_own_entity:     form.is_own_entity,
      created_by:        user ? user.id : null
    })
    if (!error) {
      setShowAdd(false)
      setForm(EMPTY)
      await load()
    } else {
      alert('Save failed: ' + error.message)
    }
    setSaving(false)
  }

  async function commitRename(id) {
    const n = editName.trim().toUpperCase()
    setEditId(null)
    if (!n) return
    await supabase.from('legal_entities').update({ name: n }).eq('id', id)
    await load()
  }

  async function toggle(id, val) {
    await supabase.from('legal_entities').update({ is_active: val }).eq('id', id)
    await load()
  }

  async function hardDelete(id) {
    if (!window.confirm('Permanently delete this legal entity? This cannot be undone.')) return
    await supabase.from('legal_entities').delete().eq('id', id)
    await load()
  }

  const active   = rows.filter(function(e) { return e.is_active })
  const inactive = rows.filter(function(e) { return !e.is_active })
  const visible  = showInactive ? rows : active

  return (
    <div style={{ padding:'24px', maxWidth:'1400px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start',
          justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'var(--accent)', fontFamily:'var(--mono)',
              letterSpacing:'0.1em', marginBottom:'4px' }}>
            CONFIGURATIONS / ONBOARDING
          </div>
          <h1 style={{ fontSize:'20px', color:'var(--text)', fontFamily:'var(--mono)',
              fontWeight:400, margin:0 }}>
            LEGAL ENTITIES
          </h1>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', paddingTop:'4px' }}>
          {inactive.length > 0 && (
            <Btn color='var(--amber)'
              onClick={function() { setShowInactive(function(s) { return !s }) }}>
              {showInactive
                ? '\u25b2 HIDE INACTIVE'
                : '\u25bc INACTIVE (' + inactive.length + ')'}
            </Btn>
          )}
          <Btn onClick={function() {
            setShowAdd(function(s) { return !s })
            setForm(EMPTY)
          }}>
            {showAdd ? '\u2715 CANCEL' : '+ ADD ENTITY'}
          </Btn>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <div style={{
          border:'1px dashed var(--accent)', borderRadius:'4px',
          padding:'20px', marginBottom:'20px', background:'var(--panel)'
        }}>
          <div style={{ fontSize:'11px', color:'var(--accent)', fontFamily:'var(--mono)',
              letterSpacing:'0.08em', marginBottom:'16px' }}>
            NEW LEGAL ENTITY
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>

            <div>
              <label style={L}>LEI *</label>
              <input style={INP} value={form.lei}
                placeholder="5493001RKX8CS1BEYF67"
                onChange={function(e) { f({ lei: e.target.value }) }} />
            </div>
            <div>
              <label style={L}>NAME *</label>
              <input style={INP} value={form.name}
                placeholder="JP MORGAN CHASE & CO"
                onChange={function(e) { f({ name: e.target.value }) }} />
            </div>
            <div>
              <label style={L}>SHORT NAME</label>
              <input style={INP} value={form.short_name}
                placeholder="JPMC"
                onChange={function(e) { f({ short_name: e.target.value }) }} />
            </div>

            <div>
              <label style={L}>HOME CURRENCY</label>
              <select style={Object.assign({}, INP, { cursor:'pointer' })}
                value={form.home_currency}
                onChange={function(e) { f({ home_currency: e.target.value }) }}>
                {CURRENCIES.map(function(c) { return <option key={c}>{c}</option> })}
              </select>
            </div>
            <div>
              <label style={L}>JURISDICTION</label>
              <input style={INP} value={form.jurisdiction}
                placeholder="US"
                onChange={function(e) { f({ jurisdiction: e.target.value.toUpperCase() }) }} />
            </div>
            <div>
              <label style={L}>
                REGULATORY REGIME
                <span style={{ opacity:0.6, fontSize:'9px', marginLeft:'4px' }}>(comma-sep)</span>
              </label>
              <input style={INP} value={form.regulatory_regime}
                placeholder="EMIR, DODD-FRANK, MIFID2"
                onChange={function(e) { f({ regulatory_regime: e.target.value }) }} />
            </div>

            <div>
              <label style={L}>SIMM VERSION</label>
              <input style={INP} value={form.simm_version}
                onChange={function(e) { f({ simm_version: e.target.value }) }} />
            </div>
            <div>
              <label style={L}>IM THRESHOLD (M)</label>
              <input style={INP} type="number" step="0.01" value={form.im_threshold_m}
                placeholder="50.00"
                onChange={function(e) { f({ im_threshold_m: e.target.value }) }} />
            </div>
            <div>
              <label style={L}>OIS DISCOUNT CURVE</label>
              <select style={Object.assign({}, INP, { cursor:'pointer' })}
                value={form.ois_curve_id}
                onChange={function(e) { f({ ois_curve_id: e.target.value }) }}>
                <option value="">\u2014 NONE \u2014</option>
                {OIS_CURVES.map(function(c) { return <option key={c}>{c}</option> })}
              </select>
            </div>

          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'20px', marginTop:'16px' }}>
            <label style={{
              display:'flex', alignItems:'center', gap:'8px',
              fontFamily:'var(--mono)', fontSize:'12px',
              color:'var(--text-dim)', cursor:'pointer'
            }}>
              <input type="checkbox" checked={form.is_own_entity}
                onChange={function(e) { f({ is_own_entity: e.target.checked }) }}
                style={{ accentColor:'var(--accent)' }} />
              OWN ENTITY (self)
            </label>
            <Btn size='lg' onClick={save} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE ENTITY'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)',
            fontSize:'12px', padding:'60px 0', textAlign:'center' }}>
          LOADING...
        </div>
      ) : visible.length === 0 ? (
        <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)',
            fontSize:'12px', padding:'60px 0', textAlign:'center' }}>
          NO LEGAL ENTITIES \u2014 CLICK + ADD ENTITY
        </div>
      ) : (
        <div style={{ border:'1px solid var(--panel-3)', borderRadius:'4px', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:COLS,
              padding:'8px 12px', gap:'8px', background:'var(--panel-2)',
              borderBottom:'1px solid var(--panel-3)' }}>
            {['LEI','NAME','SHORT','CCY','JURIS','SIMM','TYPE','ACTIONS'].map(function(h) {
              return (
                <div key={h} style={{ fontSize:'10px', fontFamily:'var(--mono)',
                    color:'var(--text-dim)', letterSpacing:'0.08em' }}>{h}</div>
              )
            })}
          </div>

          {/* Rows */}
          {visible.map(function(e) {
            var leftColor = e.is_own_entity ? 'var(--accent)' : 'var(--blue)'
            return (
              <div key={e.id} style={{
                display:'grid', gridTemplateColumns:COLS,
                padding:'10px 12px', gap:'8px', alignItems:'center',
                borderLeft:'2px solid ' + leftColor,
                borderBottom:'1px solid var(--panel-3)',
                background: e.is_active ? 'var(--panel)' : 'transparent',
                opacity: e.is_active ? 1 : 0.48
              }}>

                <Cell dim>{e.lei}</Cell>

                {editId === e.id
                  ? <input ref={editRef}
                      style={Object.assign({}, INP, { fontSize:'12px' })}
                      value={editName}
                      onChange={function(ev) { setEditName(ev.target.value) }}
                      onBlur={function() { commitRename(e.id) }}
                      onKeyDown={function(ev) {
                        if (ev.key === 'Enter')  commitRename(e.id)
                        if (ev.key === 'Escape') setEditId(null)
                      }} />
                  : <div
                      style={{ fontSize:'12px', fontFamily:'var(--mono)',
                          color:'var(--text)', cursor:'pointer',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      onDoubleClick={function() {
                        setEditId(e.id)
                        setEditName(e.name)
                      }}
                      title="Double-click to rename">
                      {e.name}
                    </div>
                }

                <Cell dim>{e.short_name}</Cell>
                <Cell>{e.home_currency}</Cell>
                <Cell dim>{e.jurisdiction}</Cell>
                <Cell dim>{e.simm_version}</Cell>

                <div>
                  <Badge color={e.is_own_entity ? 'var(--accent)' : 'var(--blue)'}>
                    {e.is_own_entity ? 'OWN' : 'CPTY'}
                  </Badge>
                </div>

                <div style={{ display:'flex', gap:'4px' }}>
                  {e.is_active
                    ? <Btn color='var(--red)'
                        onClick={function() { toggle(e.id, false) }}>
                        DEACT
                      </Btn>
                    : <>
                        <Btn color='var(--accent)'
                          onClick={function() { toggle(e.id, true) }}>
                          REACT
                        </Btn>
                        <Btn color='var(--red)'
                          onClick={function() { hardDelete(e.id) }}>
                          DEL
                        </Btn>
                      </>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop:'8px', fontSize:'10px', color:'var(--text-dim)',
          fontFamily:'var(--mono)' }}>
        {active.length} ACTIVE
        {inactive.length > 0 ? ' \u00b7 ' + inactive.length + ' INACTIVE' : ''}
        {rows.length > 0 ? ' \u00b7 DOUBLE-CLICK NAME TO RENAME' : ''}
      </div>
    </div>
  )
}
`);

// ─────────────────────────────────────────────────────────────────────────────
//  2.  Counterparties.jsx
// ─────────────────────────────────────────────────────────────────────────────
write('frontend/src/components/onboarding/Counterparties.jsx',
`import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const CSA_DISCOUNT_MAP = {
  USD: 'USD_SOFR',
  EUR: 'EUR_ESTR',
  GBP: 'GBP_SONIA',
  JPY: 'JPY_TONAR',
  CHF: 'CHF_SARON',
  AUD: 'AUD_AONIA',
  CAD: 'CAD_CORRA'
}
const CSA_CURRENCIES = ['USD','EUR','GBP','JPY','CHF','AUD','CAD']
const CSA_TYPES      = ['VM_ONLY','VM_IM','NO_CSA']
const IM_MODELS      = ['SIMM','GRID','SCHEDULE']

const CSA_COLOR = {
  VM_ONLY: 'var(--accent)',
  VM_IM:   'var(--blue)',
  NO_CSA:  'var(--amber)'
}

const EMPTY = {
  legal_entity_id:'', name:'', isda_agreement:'',
  csa_type:'VM_ONLY', csa_currency:'USD', csa_threshold_m:'',
  csa_mta_k:'', discount_curve_id:'USD_SOFR', im_model:'SIMM'
}

const L = {
  display:'block', fontSize:'10px', fontFamily:'var(--mono)',
  color:'var(--text-dim)', letterSpacing:'0.08em', marginBottom:'4px'
}
const INP = {
  background:'var(--bg)', border:'1px solid var(--panel-3)',
  color:'var(--text)', fontFamily:'var(--mono)', fontSize:'12px',
  padding:'5px 8px', borderRadius:'2px', outline:'none',
  width:'100%', boxSizing:'border-box'
}

function Btn({ color, size, onClick, disabled, children }) {
  const c = color || 'var(--accent)'
  const lg = size === 'lg'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:'transparent',
      border:'1px solid ' + c,
      color: c,
      fontFamily:'var(--mono)',
      fontSize: lg ? '12px' : '10px',
      padding: lg ? '6px 16px' : '3px 8px',
      borderRadius:'2px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      letterSpacing:'0.05em',
      opacity: disabled ? 0.5 : 1,
      whiteSpace:'nowrap'
    }}>{children}</button>
  )
}

function Badge({ color, children }) {
  return (
    <span style={{
      fontSize:'9px', fontFamily:'var(--mono)', letterSpacing:'0.06em',
      padding:'2px 6px', borderRadius:'2px', whiteSpace:'nowrap',
      background:'color-mix(in srgb, ' + color + ' 14%, transparent)',
      color: color,
      border:'1px solid color-mix(in srgb, ' + color + ' 35%, transparent)'
    }}>{children}</span>
  )
}

function Cell({ children, dim }) {
  return (
    <div style={{
      fontSize:'11px', fontFamily:'var(--mono)',
      color: dim ? 'var(--text-dim)' : 'var(--text)',
      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
    }}>{children || '\u2014'}</div>
  )
}

const COLS = '1fr 140px 80px 52px 120px 65px 108px'

export default function Counterparties() {
  const [cps,          setCps]          = useState([])
  const [les,          setLes]          = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showAdd,      setShowAdd]      = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [form,         setForm]         = useState(EMPTY)
  const [saving,       setSaving]       = useState(false)
  const [editId,       setEditId]       = useState(null)
  const [editName,     setEditName]     = useState('')
  const editRef = useRef(null)

  useEffect(function() { load() }, [])

  // auto-map discount curve when CSA currency changes
  useEffect(function() {
    var mapped = CSA_DISCOUNT_MAP[form.csa_currency]
    if (mapped) {
      setForm(function(prev) { return Object.assign({}, prev, { discount_curve_id: mapped }) })
    }
  }, [form.csa_currency])

  useEffect(function() { if (editRef.current) editRef.current.focus() }, [editId])

  async function load() {
    setLoading(true)
    var [cpRes, leRes] = await Promise.all([
      supabase.from('counterparties')
        .select('*, legal_entity:legal_entity_id(name, short_name, lei)')
        .order('name'),
      supabase.from('legal_entities')
        .select('id, name, short_name')
        .eq('is_active', true)
        .order('name')
    ])
    setCps(cpRes.data || [])
    setLes(leRes.data || [])
    setLoading(false)
  }

  function f(patch) {
    setForm(function(prev) { return Object.assign({}, prev, patch) })
  }

  async function save() {
    if (!form.name.trim()) {
      alert('Name is required.')
      return
    }
    setSaving(true)
    var hasCSA = form.csa_type !== 'NO_CSA'
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('counterparties').insert({
      legal_entity_id:   form.legal_entity_id || null,
      name:              form.name.trim().toUpperCase(),
      isda_agreement:    form.isda_agreement.trim() || null,
      csa_type:          form.csa_type,
      csa_currency:      hasCSA ? form.csa_currency : null,
      csa_threshold_m:   hasCSA && form.csa_threshold_m
        ? parseFloat(form.csa_threshold_m) : null,
      csa_mta_k:         hasCSA && form.csa_mta_k
        ? parseFloat(form.csa_mta_k) : null,
      discount_curve_id: hasCSA ? (form.discount_curve_id || null) : null,
      im_model:          form.im_model,
      created_by:        user ? user.id : null
    })
    if (!error) {
      setShowAdd(false)
      setForm(EMPTY)
      await load()
    } else {
      alert('Save failed: ' + error.message)
    }
    setSaving(false)
  }

  async function commitRename(id) {
    var n = editName.trim().toUpperCase()
    setEditId(null)
    if (!n) return
    await supabase.from('counterparties').update({ name: n }).eq('id', id)
    await load()
  }

  async function toggle(id, val) {
    await supabase.from('counterparties').update({ is_active: val }).eq('id', id)
    await load()
  }

  async function hardDelete(id) {
    if (!window.confirm('Permanently delete this counterparty? This cannot be undone.')) return
    await supabase.from('counterparties').delete().eq('id', id)
    await load()
  }

  var active   = cps.filter(function(c) { return c.is_active })
  var inactive = cps.filter(function(c) { return !c.is_active })
  var visible  = showInactive ? cps : active

  var hasCSA = form.csa_type !== 'NO_CSA'

  return (
    <div style={{ padding:'24px', maxWidth:'1400px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start',
          justifyContent:'space-between', marginBottom:'20px' }}>
        <div>
          <div style={{ fontSize:'10px', color:'var(--accent)', fontFamily:'var(--mono)',
              letterSpacing:'0.1em', marginBottom:'4px' }}>
            CONFIGURATIONS / ONBOARDING
          </div>
          <h1 style={{ fontSize:'20px', color:'var(--text)', fontFamily:'var(--mono)',
              fontWeight:400, margin:0 }}>
            COUNTERPARTIES
          </h1>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', paddingTop:'4px' }}>
          {inactive.length > 0 && (
            <Btn color='var(--amber)'
              onClick={function() { setShowInactive(function(s) { return !s }) }}>
              {showInactive
                ? '\u25b2 HIDE INACTIVE'
                : '\u25bc INACTIVE (' + inactive.length + ')'}
            </Btn>
          )}
          <Btn onClick={function() {
            setShowAdd(function(s) { return !s })
            setForm(EMPTY)
          }}>
            {showAdd ? '\u2715 CANCEL' : '+ ADD COUNTERPARTY'}
          </Btn>
        </div>
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <div style={{
          border:'1px dashed var(--accent)', borderRadius:'4px',
          padding:'20px', marginBottom:'20px', background:'var(--panel)'
        }}>
          <div style={{ fontSize:'11px', color:'var(--accent)', fontFamily:'var(--mono)',
              letterSpacing:'0.08em', marginBottom:'16px' }}>
            NEW COUNTERPARTY
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px' }}>

            <div>
              <label style={L}>NAME *</label>
              <input style={INP} value={form.name}
                placeholder="GOLDMAN SACHS INTL"
                onChange={function(e) { f({ name: e.target.value }) }} />
            </div>
            <div>
              <label style={L}>LEGAL ENTITY</label>
              <select style={Object.assign({}, INP, { cursor:'pointer' })}
                value={form.legal_entity_id}
                onChange={function(e) { f({ legal_entity_id: e.target.value }) }}>
                <option value="">\u2014 NONE \u2014</option>
                {les.map(function(le) {
                  return (
                    <option key={le.id} value={le.id}>
                      {le.short_name ? le.short_name + ' \u2014 ' : ''}{le.name}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label style={L}>ISDA AGREEMENT</label>
              <input style={INP} value={form.isda_agreement}
                placeholder="ISDA 2002 MASTER"
                onChange={function(e) { f({ isda_agreement: e.target.value }) }} />
            </div>

            <div>
              <label style={L}>CSA TYPE</label>
              <select style={Object.assign({}, INP, { cursor:'pointer' })}
                value={form.csa_type}
                onChange={function(e) { f({ csa_type: e.target.value }) }}>
                {CSA_TYPES.map(function(t) { return <option key={t}>{t}</option> })}
              </select>
            </div>

            {hasCSA && <>
              <div>
                <label style={L}>CSA CURRENCY</label>
                <select style={Object.assign({}, INP, { cursor:'pointer' })}
                  value={form.csa_currency}
                  onChange={function(e) { f({ csa_currency: e.target.value }) }}>
                  {CSA_CURRENCIES.map(function(c) { return <option key={c}>{c}</option> })}
                </select>
              </div>
              <div>
                <label style={L}>DISCOUNT CURVE <span style={{ opacity:.6, fontSize:'9px' }}>(auto-mapped)</span></label>
                <input style={INP} value={form.discount_curve_id}
                  onChange={function(e) { f({ discount_curve_id: e.target.value }) }} />
              </div>
              <div>
                <label style={L}>CSA THRESHOLD (M)</label>
                <input style={INP} type="number" step="0.01"
                  value={form.csa_threshold_m} placeholder="50.00"
                  onChange={function(e) { f({ csa_threshold_m: e.target.value }) }} />
              </div>
              <div>
                <label style={L}>CSA MTA (K)</label>
                <input style={INP} type="number" step="0.001"
                  value={form.csa_mta_k} placeholder="0.500"
                  onChange={function(e) { f({ csa_mta_k: e.target.value }) }} />
              </div>
            </>}

            <div>
              <label style={L}>IM MODEL</label>
              <select style={Object.assign({}, INP, { cursor:'pointer' })}
                value={form.im_model}
                onChange={function(e) { f({ im_model: e.target.value }) }}>
                {IM_MODELS.map(function(m) { return <option key={m}>{m}</option> })}
              </select>
            </div>

          </div>

          {!hasCSA && (
            <div style={{ marginTop:'12px', fontSize:'10px', fontFamily:'var(--mono)',
                color:'var(--amber)', opacity:.7 }}>
              NO_CSA \u2014 CSA fields will be stored as null
            </div>
          )}

          <div style={{ marginTop:'16px' }}>
            <Btn size='lg' onClick={save} disabled={saving}>
              {saving ? 'SAVING...' : 'SAVE COUNTERPARTY'}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)',
            fontSize:'12px', padding:'60px 0', textAlign:'center' }}>
          LOADING...
        </div>
      ) : visible.length === 0 ? (
        <div style={{ color:'var(--text-dim)', fontFamily:'var(--mono)',
            fontSize:'12px', padding:'60px 0', textAlign:'center' }}>
          NO COUNTERPARTIES \u2014 CLICK + ADD COUNTERPARTY
        </div>
      ) : (
        <div style={{ border:'1px solid var(--panel-3)', borderRadius:'4px', overflow:'hidden' }}>

          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:COLS,
              padding:'8px 12px', gap:'8px', background:'var(--panel-2)',
              borderBottom:'1px solid var(--panel-3)' }}>
            {['NAME','LEGAL ENTITY','CSA TYPE','CCY','DISCOUNT CURVE','IM MODEL','ACTIONS']
              .map(function(h) {
                return (
                  <div key={h} style={{ fontSize:'10px', fontFamily:'var(--mono)',
                      color:'var(--text-dim)', letterSpacing:'0.08em' }}>{h}</div>
                )
              })}
          </div>

          {/* Rows */}
          {visible.map(function(cp) {
            var csaColor = CSA_COLOR[cp.csa_type] || 'var(--text-dim)'
            var leLabel  = cp.legal_entity
              ? (cp.legal_entity.short_name || cp.legal_entity.name)
              : null
            return (
              <div key={cp.id} style={{
                display:'grid', gridTemplateColumns:COLS,
                padding:'10px 12px', gap:'8px', alignItems:'center',
                borderLeft:'2px solid ' + csaColor,
                borderBottom:'1px solid var(--panel-3)',
                background: cp.is_active ? 'var(--panel)' : 'transparent',
                opacity: cp.is_active ? 1 : 0.48
              }}>

                {editId === cp.id
                  ? <input ref={editRef}
                      style={Object.assign({}, INP, { fontSize:'12px' })}
                      value={editName}
                      onChange={function(ev) { setEditName(ev.target.value) }}
                      onBlur={function() { commitRename(cp.id) }}
                      onKeyDown={function(ev) {
                        if (ev.key === 'Enter')  commitRename(cp.id)
                        if (ev.key === 'Escape') setEditId(null)
                      }} />
                  : <div
                      style={{ fontSize:'12px', fontFamily:'var(--mono)',
                          color:'var(--text)', cursor:'pointer',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      onDoubleClick={function() {
                        setEditId(cp.id)
                        setEditName(cp.name)
                      }}
                      title="Double-click to rename">
                      {cp.name}
                    </div>
                }

                <Cell dim>{leLabel}</Cell>

                <div>
                  <Badge color={csaColor}>{cp.csa_type}</Badge>
                </div>

                <Cell dim>{cp.csa_currency}</Cell>
                <Cell dim>{cp.discount_curve_id}</Cell>
                <Cell dim>{cp.im_model}</Cell>

                <div style={{ display:'flex', gap:'4px' }}>
                  {cp.is_active
                    ? <Btn color='var(--red)'
                        onClick={function() { toggle(cp.id, false) }}>
                        DEACT
                      </Btn>
                    : <>
                        <Btn color='var(--accent)'
                          onClick={function() { toggle(cp.id, true) }}>
                          REACT
                        </Btn>
                        <Btn color='var(--red)'
                          onClick={function() { hardDelete(cp.id) }}>
                          DEL
                        </Btn>
                      </>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop:'8px', fontSize:'10px', color:'var(--text-dim)',
          fontFamily:'var(--mono)' }}>
        {active.length} ACTIVE
        {inactive.length > 0 ? ' \u00b7 ' + inactive.length + ' INACTIVE' : ''}
        {cps.length > 0 ? ' \u00b7 DOUBLE-CLICK NAME TO RENAME' : ''}
        {' \u00b7 CSA CURRENCY \u2192 DISCOUNT CURVE AUTO-MAPPED'}
      </div>
    </div>
  )
}
`);

// ─────────────────────────────────────────────────────────────────────────────
//  3.  CfgNav.jsx  — adds ONBOARDING section
// ─────────────────────────────────────────────────────────────────────────────
write('frontend/src/components/layout/CfgNav.jsx',
`import { NavLink } from 'react-router-dom'

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
`);

// ─────────────────────────────────────────────────────────────────────────────
//  4.  App.jsx  — adds legal-entities + counterparties routes
//
//  ⚠️  VERIFY: CurvesWorkspace import path below.
//      If your market-data component is named differently, update that import.
// ─────────────────────────────────────────────────────────────────────────────
write('frontend/src/App.jsx',
`import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import LoginPage    from './components/auth/LoginPage'
import SignupPage   from './components/auth/SignupPage'
import ConfirmPage  from './components/auth/ConfirmPage'
import AuthGuard    from './components/auth/AuthGuard'
import CommandCenter from './components/CommandCenter'
import AppBar       from './components/layout/AppBar'
import CfgNav       from './components/layout/CfgNav'
import StubPage     from './components/layout/StubPage'

// ⚠️ VERIFY: adjust filename if yours differs
import CurvesWorkspace from './components/market-data/CurvesWorkspace'

import OrgHierarchy from './components/org/OrgHierarchy'
import LegalEntities from './components/onboarding/LegalEntities'
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
`);

// ─────────────────────────────────────────────────────────────────────────────
//  SQL — print to console
// ─────────────────────────────────────────────────────────────────────────────

const SQL = `
-- =====================================================================
--  Rijeka Day 5  |  Legal Entities + Counterparties
--  Run in Supabase SQL Editor  (Settings > SQL Editor)
-- =====================================================================

-- ── legal_entities ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS legal_entities (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lei               TEXT        UNIQUE NOT NULL,
  name              TEXT        NOT NULL,
  short_name        TEXT,
  home_currency     TEXT        NOT NULL,
  jurisdiction      TEXT        NOT NULL,
  regulatory_regime TEXT[],
  simm_version      TEXT        NOT NULL DEFAULT 'v2.6',
  im_threshold_m    NUMERIC(12,2),
  ois_curve_id      TEXT,
  is_own_entity     BOOLEAN     NOT NULL DEFAULT FALSE,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID        REFERENCES auth.users(id)
);

ALTER TABLE legal_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "le_select" ON legal_entities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "le_insert" ON legal_entities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "le_update" ON legal_entities
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "le_delete" ON legal_entities
  FOR DELETE TO authenticated USING (true);

-- ── counterparties ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS counterparties (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_entity_id   UUID        REFERENCES legal_entities(id),
  name              TEXT        NOT NULL,
  isda_agreement    TEXT,
  csa_type          TEXT        CHECK (csa_type IN ('VM_ONLY','VM_IM','NO_CSA')),
  csa_currency      TEXT,
  csa_threshold_m   NUMERIC(12,2),
  csa_mta_k         NUMERIC(12,2),
  discount_curve_id TEXT,
  im_model          TEXT        NOT NULL DEFAULT 'SIMM',
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID        REFERENCES auth.users(id)
);

ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_select" ON counterparties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cp_insert" ON counterparties
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cp_update" ON counterparties
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "cp_delete" ON counterparties
  FOR DELETE TO authenticated USING (true);

-- ── verify ─────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('legal_entities','counterparties');
-- should return 2 rows
`;

console.log('\n' + '\u2550'.repeat(64));
console.log('  SUPABASE SQL \u2014 run this in Supabase SQL Editor');
console.log('\u2550'.repeat(64));
console.log(SQL);
console.log('\u2550'.repeat(64));

console.log(`
\u2705  All files written.

NEXT STEPS:
  1. Run the SQL above in Supabase > SQL Editor
  2. Restart the dev server (Ctrl+C then npm run dev)
  3. Navigate to /configurations/legal-entities

  \u26a0\ufe0f  VERIFY:  App.jsx imports CurvesWorkspace from
       './components/market-data/CurvesWorkspace'
       If your file is named differently, update that one line.

  CommandCenter tiles for Legal Entities + Counterparties
  can be wired in Day 6 or whenever you want them on the dashboard.
`);
