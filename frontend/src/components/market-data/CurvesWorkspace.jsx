import CurvesSidebar from './CurvesSidebar';
import CurveDetail from './CurveDetail';
import useMarketDataStore from '../../store/useMarketDataStore';
import { RATES_CURVES } from '../../data/ratesCurves';

export default function CurvesWorkspace() {
  const selectedCurveId = useMarketDataStore((s) => s.selectedCurveId);

  const oisCount     = RATES_CURVES.filter((c) => c.curve_class === 'OIS').length;
  const basisCount   = RATES_CURVES.filter((c) => c.curve_class === 'BASIS').length;
  const xccyCount    = RATES_CURVES.filter((c) => c.curve_class === 'XCCY').length;
  const fundingCount = RATES_CURVES.filter((c) => c.curve_class === 'FUNDING').length;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <CurvesSidebar />

      {/* ── Main pane ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedCurveId ? (
          <CurveDetail curveId={selectedCurveId} />
        ) : (
          <EmptyState
            total={RATES_CURVES.length}
            ois={oisCount}
            basis={basisCount}
            xccy={xccyCount}
            funding={fundingCount}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ total, ois, basis, xccy, funding }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">⟨/⟩</div>
      <div className="empty-title">Select a curve</div>
      <div className="empty-sub">
        {total} curves — {ois} OIS · {basis} Basis · {xccy} XCCY · {funding} Funding
      </div>
    </div>
  );
}
