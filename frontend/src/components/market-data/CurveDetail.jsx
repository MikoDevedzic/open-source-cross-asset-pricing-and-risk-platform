import useMarketDataStore from '../../store/useMarketDataStore';
import OISDetail from './OISDetail';
import BasisDetail from './BasisDetail';
import XCCYDetail from './XCCYDetail';
import FundingDetail from './FundingDetail';

export default function CurveDetail({ curveId }) {
  const curve = useMarketDataStore((s) => s.getCurveById(curveId));
  if (!curve) return null;

  switch (curve.curve_class) {
    case 'OIS':     return <OISDetail     curve={curve} />;
    case 'BASIS':   return <BasisDetail   curve={curve} />;
    case 'XCCY':    return <XCCYDetail    curve={curve} />;
    case 'FUNDING': return <FundingDetail curve={curve} />;
    default:        return null;
  }
}
