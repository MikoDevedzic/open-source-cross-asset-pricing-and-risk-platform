import useMarketDataStore from '../../store/useMarketDataStore';
import { INTERP_METHODS } from '../../data/ratesCurves';
import { InnerTabs, InnerBody, ParamGrid, SectionLabel, DescBox } from './_DetailShared';

// ── Basis output strip ──────────────────────────────────────
function BasisOutputStrip({ curve }) {
  const active = curve.instruments.filter((i) => i.en);
  if (!active.length) return null;
  const isBp = active[0].unit === 'bp';

  return (
    <div className="crv-out">
      <div className="crv-out-hdr">
        <span>Basis Spreads</span>
        <span style={{ color: 'var(--text-mute)', letterSpacing: 0, textTransform: 'none', fontSize: '8.5px' }}>
          market quotes · real bootstrap Sprint 3
        </span>
      </div>
      <div className="crv-out-body">
        <div className="out-tbl-wrap">
          <table className="out-tbl">
            <thead>
              <tr><th>Tenor</th><th>Spread</th></tr>
            </thead>
            <tbody>
              {active.map((inst) => (
                <tr key={inst.tenor}>
                  <td className="di">{inst.tenor}</td>
                  <td className="bl">
                    {isBp ? `${inst.quote.toFixed(1)}bp` : `${inst.quote.toFixed(3)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Definition tab ──────────────────────────────────────────
function BasisDef({ curve }) {
  const isBp = curve.instruments[0]?.unit === 'bp';

  const code = `# Basis curve bootstrap pattern
# 1. Bootstrap base OIS curve first (already done)
discount_curve = ql.RelinkableYieldTermStructureHandle()
discount_curve.linkTo(${curve.baseCurveId.toLowerCase()}_curve)

# 2. Build basis helpers from market quotes
for tenor, spread in basis_quotes:
    helpers.append(ql.BasisSwapRateHelper(
        spread_handle, ql.Period(tenor),
        float_index, base_float_index,
        discount_curve))

# 3. Bootstrap simultaneous dual-curve
basis_curve = ql.PiecewiseLogLinearDiscount(
    settlement, helpers, ql.Actual360())`;

  return (
    <div>
      <SectionLabel>Basis Curve Definition</SectionLabel>
      <ParamGrid items={[
        { label: 'Curve Class',  value: 'BASIS',              cls: 'bl' },
        { label: 'Base Curve',   value: curve.baseLabel,      cls: 'ac' },
        { label: 'QL Helper',    value: curve.qlHelper,       cls: 'bl' },
        { label: 'Spread Unit',  value: isBp ? 'basis points (bp)' : '% rate', cls: 'am' },
      ]} />
      <SectionLabel>Description</SectionLabel>
      <DescBox>{curve.description}</DescBox>
      <SectionLabel>Bootstrap Logic</SectionLabel>
      <div className="cb">
        <button className="cb-copy" onClick={() => navigator.clipboard.writeText(code)}>copy</button>
        <pre style={{ margin: 0, fontSize: '9px', lineHeight: 1.8 }}>{code}</pre>
      </div>
    </div>
  );
}

// ── Instruments tab ─────────────────────────────────────────
function BasisInstruments({ curve }) {
  const { toggleInstrument, updateQuote } = useMarketDataStore();
  const isBp = curve.instruments[0]?.unit === 'bp';
  const active = curve.instruments.filter((i) => i.en).length;

  return (
    <div>
      <SectionLabel sub={`${active} active / ${curve.instruments.length}`}>
        Basis Swap Instruments
      </SectionLabel>
      <div className="inst-wrap">
        <table className="inst-table">
          <thead>
            <tr>
              <th>Active</th>
              <th>Type</th>
              <th>Tenor</th>
              <th>BBG Ticker</th>
              <th style={{ textAlign: 'right' }}>Spread</th>
            </tr>
          </thead>
          <tbody>
            {curve.instruments.map((inst, i) => (
              <tr key={i} className={inst.en ? '' : 'dis'}>
                <td>
                  <input
                    type="checkbox"
                    className="tog"
                    checked={inst.en}
                    onChange={(e) => toggleInstrument(curve.id, i, e.target.checked)}
                  />
                </td>
                <td className="di">{inst.type}</td>
                <td className="bl mo">{inst.tenor}</td>
                <td className="mo">{inst.ticker}</td>
                <td className="am mo" style={{ textAlign: 'right' }}>
                  <input
                    className={`qi bp`}
                    defaultValue={isBp ? inst.quote.toFixed(1) : inst.quote.toFixed(3)}
                    onBlur={(e) => updateQuote(curve.id, i, e.target.value)}
                  />{inst.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Bootstrap config tab ────────────────────────────────────
function BasisBootstrap({ curve }) {
  const { curveInterp, setInterp } = useMarketDataStore();
  const currentInterp = curveInterp[curve.id] || 'LogLinearDiscount';

  return (
    <div>
      <SectionLabel>Interpolation Method</SectionLabel>
      <div className="interp-grid">
        {INTERP_METHODS.map((m) => (
          <div
            key={m.id}
            className={`icard${currentInterp === m.id ? ' sel' : ''}`}
            onClick={() => setInterp(curve.id, m.id)}
          >
            <div className="icard-name">{m.name}</div>
            <div className="icard-ql">{m.ql}</div>
            <div className="icard-desc">{m.desc}</div>
            <div className="icard-tags">
              {m.tags.map((t) => (
                <span key={t} className={`itag${t === 'Recommended' ? ' rec' : ''}`}>{t}</span>
              ))}
              <span className="itag">{m.trait}</span>
            </div>
          </div>
        ))}
      </div>
      <SectionLabel>Parameters</SectionLabel>
      <div className="bp-row">
        <div className="bp-lbl">Pillar Choice</div>
        <select className="bp-sel">
          <option>LastRelevantDate</option>
          <option>MaturityDate</option>
        </select>
      </div>
      <div className="bp-row">
        <div className="bp-lbl">Extrapolation</div>
        <input type="checkbox" className="bp-tog" defaultChecked />
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────
export default function BasisDetail({ curve }) {
  const firstInst = curve.instruments[0];
  const isBp = firstInst?.unit === 'bp';
  const displayVal = isBp
    ? `${firstInst.quote.toFixed(1)}bp`
    : `${firstInst.quote.toFixed(3)}%`;
  const activeCount = curve.instruments.filter((i) => i.en).length;

  const tabs = [
    { id: 'def',  label: 'Definition' },
    { id: 'inst', label: 'Instruments', badge: activeCount },
    { id: 'boot', label: 'Bootstrap Config' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="crv-hdr">
        <div className="crv-hdr-row">
          <div className="crv-flag-lg">{curve.flag}</div>
          <div className="crv-hdr-info">
            <div className="crv-hdr-name">{curve.fullName}</div>
            <div className="crv-hdr-sub">
              Basis over: <span style={{ color: 'var(--accent)' }}>{curve.baseLabel}</span>
              {' · '}{curve.qlHelper}
            </div>
          </div>
          <div className="crv-rate-block">
            <div className="crv-rate-val" style={{ color: 'var(--blue)' }}>{displayVal}</div>
            <div className="crv-rate-lbl">{firstInst?.tenor} spread</div>
          </div>
        </div>
        <div className="crv-pills">
          <span className="pill p-blue">BASIS</span>
          <span className="pill p-green">RiskClass.IR</span>
          <span className="pill p-green">Base: {curve.baseLabel}</span>
          <span className="pill p-dim">{curve.qlHelper}</span>
          <span className="pill p-amber">{activeCount}/{curve.instruments.length} active</span>
        </div>
      </div>

      <InnerTabs tabs={tabs} />
      <InnerBody
        tabs={tabs}
        panels={{
          def:  <BasisDef curve={curve} />,
          inst: <BasisInstruments curve={curve} />,
          boot: <BasisBootstrap curve={curve} />,
        }}
      />
      <BasisOutputStrip curve={curve} />
    </div>
  );
}
