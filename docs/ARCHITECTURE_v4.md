# Rijeka — Architecture Document v4.0
> Open-source full revaluation risk system for derivatives.
> ISDA SIMM naming conventions used throughout — risk classes, risk types,
> sensitivities, and margin calculations share one consistent vocabulary.
>
> v4.0 additions: Market Data History architecture — complete separation of
> historical time series from daily production, data quality tiers, coverage
> calendar, bulk ingestion framework, gap detection, VaR readiness checks.

---

## Vision

A complete risk system covering market risk, CCR, XVA, IM, and on-chain
confirmation. No front office. No trade entry. Pure risk analytics.

The system ingests trades from any source (FpML, CSV, API) and market data
from any source (Bloomberg, FRED, ECB, manual), then computes every risk
metric a derivatives book requires — intraday via sensitivities, EOD via
full revaluation.

**Design principle: beat every platform combined.**
JPM Athena, GS SecDB, Murex, Calypso, Orchestrade — this system must be
more transparent, more auditable, more flexible, and better documented
than all of them. Every architectural decision is made with that standard.

---

## ISDA SIMM Naming Convention — the universal language

Every variable, folder, class, and API endpoint follows ISDA SIMM
terminology. This ensures consistency across every module.

### Product Classes
```
ProductClass.RATES_FX          RatesFX    IRS, OIS, basis, XCCY, swaption,
                                           cap/floor, inflation, FX fwd/swap/option/NDF
ProductClass.CREDIT            Credit     CDS, CDX/iTraxx, TRS, CLN
ProductClass.EQUITY            Equity     equity fwd, option, TRS
ProductClass.COMMODITY         Commodity  commodity fwd, swap, option
ProductClass.CASH              Cash       bond, loan, bill, repo
```

### Risk Classes
```
RiskClass.IR                   Interest Rate
RiskClass.CREDIT_Q             Credit Qualifying
RiskClass.CREDIT_NON_Q         Credit Non-Qualifying
RiskClass.EQUITY               Equity
RiskClass.COMMODITY            Commodity
RiskClass.FX                   FX
```

### Risk Types
```
RiskType.DELTA                 First-order sensitivity to risk factor
RiskType.VEGA                  First-order sensitivity to implied vol
RiskType.CURVATURE             Second-order vol sensitivity (gamma of vega)
RiskType.BASE_CORR             Base correlation (CreditQ index only)
```

### Sensitivity naming
```
s_ik          Raw sensitivity of instrument i to risk factor k
WS_ik         Weighted sensitivity = RW_k × s_ik
K_b           Bucket margin = aggregated WS within bucket b
IM_rc         Risk class margin = aggregated K_b across buckets
IM_total      Total SIMM IM = aggregated IM_rc across risk classes
```

### Correlation parameters
```
rho_ij        Within-bucket correlation     (ρ)
gamma_bc      Cross-bucket correlation      (γ)
Sigma_ij      Covariance = σᵢ × σⱼ × ρᵢⱼ  (Σᵢⱼ)
```

### IR risk factor naming (SIMM standard tenors)
```
IR tenors:    2w  1m  3m  6m  1y  2y  3y  5y  10y  15y  20y  30y
Sub-curves:   OIS  Libor1m  Libor3m  Libor6m  Libor12m
              Inflation  CrossCurrencyBasis
```

### Credit risk factor naming
```
CreditQ tenors:    1y  2y  3y  5y  10y
CreditQ buckets:   1–12  (IG/HY × sector)
CreditNonQ:        1–2   (IG / HY+NR)
```

### Equity / Commodity / FX risk factor naming
```
Equity buckets:    1–12  (market cap × EM/DM × sector)
Commodity buckets: 1–17  (energy, metals, agri, emissions, freight)
FX categories:     1 (G13 most liquid)  2 (other G20)  3 (all others)
```

### Margin types
```
MarginType.VM      Variation Margin  — daily MTM settlement
MarginType.IM      Initial Margin    — SIMM or LCH model
```

---

## Market Data — Core Architecture Principle

**There are exactly three distinct data stores. They never overlap.**

```
┌─────────────────────────────────────────────────────────────────────┐
│  STORE 1: HISTORY                                                   │
│  Purpose:  Long time series for VaR, stress, LCH, backtesting       │
│  Horizon:  Up to 10 years (2520 business days)                      │
│  Writes:   Bulk import (CSV, Bloomberg BDH, FRED), daily EOD auto   │
│            New days appended. Old days IMMUTABLE. No overwrites.    │
│  Reads:    Risk engines only — VaR, LCH FHS, stress scenarios       │
│  Table:    market_history                                           │
├─────────────────────────────────────────────────────────────────────┤
│  STORE 2: PRODUCTION SNAPSHOTS                                      │
│  Purpose:  Committed EOD and intraday market data for official runs │
│  Horizon:  Current and recent dates (rolling 90-day hot cache)      │
│  Writes:   Snap tab → Stage → Commit. One snapshot per date/mode.   │
│            Immutable once committed. Amendment requires new version.│
│  Reads:    All analytics engines, curve viewer, pricer              │
│  Table:    production_snapshots + snapshot_curves + snapshot_vols   │
├─────────────────────────────────────────────────────────────────────┤
│  STORE 3: WORKING / INTRADAY                                        │
│  Purpose:  Live quotes, what-if scenarios, pre-commit staging       │
│  Horizon:  Current session only                                     │
│  Writes:   Bloomberg live fetch, manual entry, paste parser         │
│            Freely mutable — not versioned, not audited              │
│  Reads:    Snap tab staging grid, curve preview                     │
│  Table:    working_quotes (truncated each morning)                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Data flow between stores:**

```
Bloomberg Terminal / FRED / CSV
         │
         ▼
  ┌─────────────┐   bulk import    ┌──────────────┐
  │   History   │◄─────────────────│ History tab  │
  │  (immutable │                  │  Import UI   │
  │  time series│                  └──────────────┘
  └──────┬──────┘
         │ auto-append
         │ (EOD commit triggers this)
         ▼
  ┌─────────────────────┐          ┌─────────────┐
  │  Production         │◄─────────│  Snap tab   │
  │  Snapshots          │  commit  │  Staging    │
  │  (immutable, versioned)        └─────────────┘
  └──────┬──────────────┘               ▲
         │ used by                      │ feeds
         ▼                              │
  ┌──────────────────────────┐   ┌─────────────────┐
  │  All Analytics Engines   │   │  Working Store  │
  │  VaR · SIMM · XVA · CCR  │   │  (Bloomberg     │
  │  Stress · LCH · PnL      │   │   live / paste) │
  └──────────────────────────┘   └─────────────────┘
```

---

## Data Quality Tier System

Every data point in every store carries a quality tier. This is stamped at
ingestion and never changes. Risk engines can filter by minimum tier.

```
Tier 1 — LIVE_VENDOR
         Source: Bloomberg Terminal (real-time BDP/BDH)
                 Refinitiv/LSEG direct feed
         Quality: Highest. Market-consensus mid prices.
         Colour:  ● Green in UI

Tier 2 — OFFICIAL_CENTRAL_BANK
         Source: FRED (SOFR, Fed Funds, Treasuries)
                 ECB Data Portal (€STR, EURIBOR)
                 Bank of England (SONIA)
                 RBA (AONIA), SNB (SARON), MAS (SORA)
                 Other central bank APIs
         Quality: Official fixing rates. Delayed (T+1 publication).
                  Covers ON indexes only — not full swap curves.
         Colour:  ● Teal in UI

Tier 3 — VENDOR_IMPORT
         Source: Bloomberg CSV export, Refinitiv export,
                 ICE Data, any licensed data vendor export
         Quality: Good. Vendor-stamped end-of-day. Full curves.
         Colour:  ● Blue in UI

Tier 4 — INTERNAL_IMPORT
         Source: Internal model output, internal pricing system export
                 Broker axes (voice-confirmed)
         Quality: Acceptable. Internally sourced.
         Colour:  ● Amber in UI

Tier 5 — SYNTHETIC_SEED
         Source: Rijeka-generated synthetic history
                 Statistically calibrated to real historical moments
                 Clearly labelled — never mistaken for real data
         Quality: For testing and demo only. Blocked from regulatory runs.
         Colour:  ● Purple in UI (with ⚠ warning icon)

Tier 6 — GAP_FILLED
         Source: Interpolated to fill missing business days
                 Method stamped: LINEAR_INTERP | CARRY_FORWARD | ZERO_CHANGE
         Quality: Derived. Flagged in all outputs. Analyst review required.
         Colour:  ● Grey in UI (with ⚠ warning icon)
```

### Tier rules enforced by risk engines

```
VaR (regulatory)         Minimum: Tier 3. Synthetic blocked.
VaR (indicative)         Minimum: Tier 5. All tiers allowed.
LCH IM replication       Minimum: Tier 3. Synthetic blocked.
Stressed VaR             Minimum: Tier 3. Gap-fill ≤ 5% of window.
SIMM (regulatory)        Minimum: Tier 2 for ON. Tier 3 for curves.
SIMM (indicative)        Minimum: Tier 5.
Backtesting              Minimum: Tier 3. Zero tolerance for gap-fill.
Stress scenarios         Minimum: Tier 3 for named historical scenarios.
```

---

## History Store — Detailed Design

### What history stores

```
Per business day, per risk factor:

  Rates curves     Curve pillars (raw quotes, % rates)
                   Bootstrap result (zero rates, discount factors)
                   13 OIS curves, full tenor grid

  Vol surfaces     Implied vol grids (normal or lognormal)
                   Swaption ATM, Cap/Floor, FX vol, Equity vol

  Fixings          ON index rates (13 indexes)
                   IBOR fixings where still relevant (EURIBOR)

  FX spots         Spot rates for all Category 1 pairs (12 pairs)

  Credit spreads   CDS spreads per entity per tenor (Sprint 8+)
```

### Storage requirements

```
Risk factors per day:
  OIS curve pillars (13 curves × 15 tenors avg)    = 195
  Swaption ATM vol (4 ccys × 7×7)                  = 196
  Cap/Floor vol (4 ccys × 6×6)                     = 144
  FX vol surfaces (12 pairs × 5×12)                = 720
  FX spots (12 pairs)                              =  12
  ON fixings (13 indexes)                          =  13
  ────────────────────────────────────────────────────
  Total per day (Rates + Vol + FX):                ~1,280 floats

Storage per day:
  Raw floats:         ~10 KB
  JSONB with keys:    ~40 KB
  With compression:   ~8 KB

Total storage:
  1250 days:    ~50 MB compressed,  ~500 MB uncompressed JSONB
  2520 days:    ~100 MB compressed, ~1 GB uncompressed JSONB
  This is trivially small on any hardware.

Query performance:
  Fetch 1250-day scenario matrix for one curve:   < 50ms (indexed)
  Fetch full risk factor vector for one day:      < 5ms
  Build full 1250 × 1280 scenario matrix:         < 200ms
```

### History database schema

```sql
-- ─────────────────────────────────────────────────────────────────
-- HISTORY STORE — immutable time series
-- New rows only. Updates and deletes are forbidden by trigger.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE market_history (
    id              BIGSERIAL PRIMARY KEY,
    business_date   DATE NOT NULL,
    risk_factor_id  VARCHAR(80) NOT NULL,
    -- Examples of risk_factor_id:
    --   "USD_SOFR.5Y"          OIS curve pillar
    --   "USD_SWAPTION_ATM.2Y5Y" swaption vol grid point
    --   "EURUSD.FXVOL.ATM.1Y"  FX vol surface point
    --   "SOFR.FIXING"          ON fixing
    --   "EURUSD.SPOT"          FX spot
    asset_class     VARCHAR(20) NOT NULL,  -- rates|credit|fx|equity|commodity
    risk_class      VARCHAR(20),           -- IR|CreditQ|FX|Equity|Commodity
    curve_id        VARCHAR(50),           -- "USD_SOFR", "EUR_ESTR" etc.
    tenor           VARCHAR(10),           -- "1Y", "5Y", "10Y"
    value           DECIMAL(20, 10) NOT NULL,
    quality_tier    SMALLINT NOT NULL,     -- 1–6 (DataQualityTier enum)
    source          VARCHAR(80) NOT NULL,  -- "bloomberg_bdh"|"fred"|"csv_import"
    import_batch_id UUID,                  -- FK to import_batches
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    created_by      VARCHAR(100),
    UNIQUE (business_date, risk_factor_id)
);

-- Composite indexes for risk engine access patterns
CREATE INDEX idx_hist_factor_date
    ON market_history (risk_factor_id, business_date DESC);

CREATE INDEX idx_hist_curve_date
    ON market_history (curve_id, business_date DESC)
    WHERE curve_id IS NOT NULL;

CREATE INDEX idx_hist_date_class
    ON market_history (business_date, asset_class);

-- Immutability trigger — no overwrites, no deletes
CREATE OR REPLACE FUNCTION enforce_history_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION
            'market_history is immutable. '
            'Date: %, Factor: %. '
            'Use a new import batch with DataQualityTier.GAP_FILLED '
            'if correction is needed.',
            OLD.business_date, OLD.risk_factor_id;
    END IF;
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'market_history rows cannot be deleted. '
            'Date: %, Factor: %.',
            OLD.business_date, OLD.risk_factor_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_history_immutable
    BEFORE UPDATE OR DELETE ON market_history
    FOR EACH ROW EXECUTE FUNCTION enforce_history_immutability();

-- ─────────────────────────────────────────────────────────────────
-- IMPORT BATCHES — full audit trail of every history load
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE import_batches (
    batch_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_type     VARCHAR(30) NOT NULL,
    -- bloomberg_bdh | fred_pull | ecb_pull | boe_pull |
    -- csv_import | synthetic_seed | eod_auto_append
    source_detail   TEXT,
    -- Bloomberg: "BDH USOSFR5Y= PX_LAST 20200101–20250115"
    -- FRED:      "series SOFR 2022-01-01 to 2025-01-15"
    -- CSV:       "USD_SOFR_history_2015_2025.csv (sha256: abc123)"
    date_from       DATE,
    date_to         DATE,
    rows_attempted  INTEGER,
    rows_inserted   INTEGER,
    rows_skipped    INTEGER,        -- already existed (no overwrite)
    rows_rejected   INTEGER,        -- failed validation
    quality_tier    SMALLINT,
    status          VARCHAR(20),    -- pending|running|complete|failed
    error_log       JSONB,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_by      VARCHAR(100)
);

-- ─────────────────────────────────────────────────────────────────
-- HISTORY COVERAGE — materialised view for the coverage calendar
-- Refreshed nightly and on every import batch completion
-- ─────────────────────────────────────────────────────────────────

CREATE MATERIALIZED VIEW history_coverage AS
SELECT
    business_date,
    risk_factor_id,
    asset_class,
    curve_id,
    quality_tier,
    MIN(quality_tier) OVER (
        PARTITION BY curve_id
        ORDER BY business_date
        ROWS BETWEEN 1249 PRECEDING AND CURRENT ROW
    ) AS min_tier_trailing_1250,
    COUNT(*) OVER (
        PARTITION BY curve_id
        ORDER BY business_date
        ROWS BETWEEN 1249 PRECEDING AND CURRENT ROW
    ) AS count_trailing_1250
FROM market_history;

CREATE UNIQUE INDEX idx_hcov ON history_coverage (business_date, risk_factor_id);

-- ─────────────────────────────────────────────────────────────────
-- PRODUCTION SNAPSHOTS — committed EOD / intraday market data
-- Separate from history. No shared tables.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE production_snapshots (
    snapshot_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date   DATE NOT NULL,
    mode            VARCHAR(20) NOT NULL,   -- EOD | INTRADAY | WHAT_IF
    version         SMALLINT NOT NULL DEFAULT 1,
    label           VARCHAR(200),
    status          VARCHAR(20) DEFAULT 'committed',
    -- committed | superseded | withdrawn
    committed_at    TIMESTAMPTZ DEFAULT NOW(),
    committed_by    VARCHAR(100),
    UNIQUE (snapshot_date, mode, version)
);

CREATE TABLE snapshot_curves (
    id              BIGSERIAL PRIMARY KEY,
    snapshot_id     UUID REFERENCES production_snapshots ON DELETE RESTRICT,
    curve_id        VARCHAR(50) NOT NULL,
    asset_class     VARCHAR(20),
    pillars         JSONB NOT NULL,
    bootstrap       JSONB,
    interp_method   VARCHAR(50),
    quality_tier    SMALLINT
);
CREATE INDEX idx_sc ON snapshot_curves (snapshot_id, curve_id);

CREATE TABLE snapshot_vols (
    id              BIGSERIAL PRIMARY KEY,
    snapshot_id     UUID REFERENCES production_snapshots ON DELETE RESTRICT,
    surface_id      VARCHAR(50) NOT NULL,
    asset_class     VARCHAR(20),
    data            JSONB NOT NULL,
    quality_tier    SMALLINT
);

CREATE TABLE snapshot_fixings (
    id              BIGSERIAL PRIMARY KEY,
    snapshot_id     UUID REFERENCES production_snapshots ON DELETE RESTRICT,
    index_id        VARCHAR(20) NOT NULL,
    value           DECIMAL(12, 8),
    source          VARCHAR(50),
    quality_tier    SMALLINT
);

-- ─────────────────────────────────────────────────────────────────
-- WORKING STORE — session-scoped, mutable, never versioned
-- Truncated each morning at 06:00 UTC
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE working_quotes (
    id              BIGSERIAL PRIMARY KEY,
    session_id      UUID NOT NULL,
    curve_id        VARCHAR(50),
    tenor           VARCHAR(10),
    value           DECIMAL(20, 10),
    source          VARCHAR(50),    -- bloomberg_live | paste | manual | csv
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- No foreign keys, no triggers. Fast writes. Disposable.
CREATE INDEX idx_wq ON working_quotes (session_id);
```

---

## Market Data Ingestion — All Sources

### Source registry

```python
# api/adapters/registry.py

class DataSource(Enum):
    BLOOMBERG_LIVE  = "bloomberg_live"   # real-time BDP → Working store
    BLOOMBERG_BDH   = "bloomberg_bdh"    # historical BDH → History store
    BLOOMBERG_PASTE = "bloomberg_paste"  # manual paste → Working store
    FRED            = "fred"             # FRED API → History store (ON rates)
    ECB             = "ecb"              # ECB API → History store (€STR)
    BOE             = "boe"              # BOE API → History store (SONIA)
    RBA             = "rba"              # RBA API → History store (AONIA)
    SNB             = "snb"              # SNB API → History store (SARON)
    MAS             = "mas"              # MAS API → History store (SORA)
    CSV_IMPORT      = "csv_import"       # bulk CSV → History store
    MANUAL_ENTRY    = "manual_entry"     # manual → Working store
    SYNTHETIC_SEED  = "synthetic_seed"   # generated → History store (Tier 5)
    EOD_AUTO        = "eod_auto_append"  # snapshot commit → History store
```

### Bloomberg Desktop API (DAPI) adapter

```python
# api/adapters/bloomberg.py

class BloombergAdapter:
    """
    Connects to Bloomberg Terminal via localhost:8194 (DAPI).
    Requires Bloomberg Professional running on the same machine.
    No B-PIPE license needed — Desktop API only.
    """

    def __init__(self, host="localhost", port=8194):
        self.host = host
        self.port = port
        self._session = None

    # ── Connection ────────────────────────────────────────────────

    def connect(self) -> bool:
        options = blpapi.SessionOptions()
        options.setServerHost(self.host)
        options.setServerPort(self.port)
        self._session = blpapi.Session(options)
        return self._session.start()

    @classmethod
    def status(cls) -> dict:
        """
        Called by GET /api/bloomberg/status
        Returns connection state without raising exceptions.
        """
        try:
            adapter = cls()
            connected = adapter.connect()
            return {
                "available": connected,
                "host": "localhost",
                "port": 8194,
                "terminal": "BLOOMBERG PROFESSIONAL" if connected else None,
            }
        except Exception as e:
            return {"available": False, "reason": str(e)}

    # ── Real-time fetch → Working store ───────────────────────────

    def bdp_curve(self, curve_id: str,
                  field: str = "PX_MID") -> list[WorkingQuote]:
        """
        Fetch live quotes for all enabled instruments on a curve.
        Returns list of WorkingQuote → written to working_quotes table.
        One BDP call for all tenors simultaneously.
        """
        from api.data.curve_definitions import get_ticker_map
        ticker_map = get_ticker_map(curve_id)  # { tenor: ticker }

        tickers = list(ticker_map.values())
        raw = self._bdp_bulk(tickers, [field, "PX_LAST", "PX_BID", "PX_ASK"])

        return [
            WorkingQuote(
                curve_id=curve_id,
                tenor=tenor,
                value=raw.get(ticker, {}).get(field)
                      or raw.get(ticker, {}).get("PX_LAST"),
                source=DataSource.BLOOMBERG_LIVE,
                ticker=ticker,
            )
            for tenor, ticker in ticker_map.items()
            if ticker in raw
        ]

    # ── Historical fetch → History store ──────────────────────────

    def bdh_curve(self, curve_id: str,
                  date_from: date, date_to: date,
                  field: str = "PX_LAST") -> ImportBatch:
        """
        Historical BDH call for a single curve across a date range.
        Writes directly to market_history (Tier 1).
        Returns ImportBatch with full audit record.
        """
        from api.data.curve_definitions import get_ticker_map
        ticker_map = get_ticker_map(curve_id)

        tickers = list(ticker_map.values())
        raw = self._bdh_bulk(
            tickers, [field],
            date_from.strftime("%Y%m%d"),
            date_to.strftime("%Y%m%d")
        )
        # raw: { ticker: { date_str: value } }

        batch = ImportBatch(
            import_type=DataSource.BLOOMBERG_BDH,
            source_detail=f"BDH {curve_id} {field} "
                          f"{date_from}–{date_to}",
            date_from=date_from,
            date_to=date_to,
            quality_tier=DataQualityTier.LIVE_VENDOR,
        )

        rows = []
        for tenor, ticker in ticker_map.items():
            if ticker not in raw:
                continue
            for date_str, value in raw[ticker].items():
                rows.append(HistoryRow(
                    business_date=parse_date(date_str),
                    risk_factor_id=f"{curve_id}.{tenor}",
                    curve_id=curve_id,
                    tenor=tenor,
                    value=value,
                    quality_tier=DataQualityTier.LIVE_VENDOR,
                    source=DataSource.BLOOMBERG_BDH,
                    import_batch_id=batch.batch_id,
                ))

        batch.rows_attempted = len(rows)
        history_store.bulk_insert(rows, batch)  # skip-on-conflict, no overwrite
        return batch

    def bdh_all_curves(self, date_from: date,
                       date_to: date) -> list[ImportBatch]:
        """
        Fetch full history for all 13 OIS curves in parallel.
        One BDH call per curve, up to 10 year range.
        Used for initial history population.
        """
        from concurrent.futures import ThreadPoolExecutor
        curve_ids = [c.id for c in OIS_CURVES]
        with ThreadPoolExecutor(max_workers=5) as ex:
            batches = list(ex.map(
                lambda cid: self.bdh_curve(cid, date_from, date_to),
                curve_ids
            ))
        return batches
```

### Free central bank API adapters

```python
# api/adapters/fred.py

class FREDAdapter:
    """
    Federal Reserve Economic Data — free, no auth for basic use.
    Covers: SOFR (2018-04-03 onwards), Fed Funds, US Treasuries.
    Limitation: ON fixing only — not OIS swap curves.
    """
    BASE = "https://api.stlouisfed.org/fred/series/observations"
    SERIES_MAP = {
        "SOFR":      "SOFR",
        "USD_FF":    "DFF",
        "USD_3M_TB": "DTB3",
    }

    def fetch(self, series_id: str, date_from: date,
              date_to: date) -> ImportBatch:
        params = {
            "series_id": self.SERIES_MAP[series_id],
            "observation_start": date_from.isoformat(),
            "observation_end": date_to.isoformat(),
            "file_type": "json",
            "api_key": settings.FRED_API_KEY or "anonymous",
        }
        resp = httpx.get(self.BASE, params=params, timeout=30)
        observations = resp.json()["observations"]

        rows = [
            HistoryRow(
                business_date=parse_date(obs["date"]),
                risk_factor_id=f"{series_id}.FIXING",
                index_id=series_id,
                tenor="ON",
                value=float(obs["value"]),
                quality_tier=DataQualityTier.OFFICIAL_CENTRAL_BANK,
                source=DataSource.FRED,
            )
            for obs in observations
            if obs["value"] != "."
        ]
        return history_store.bulk_insert_batch(rows, DataSource.FRED)


# api/adapters/ecb.py

class ECBAdapter:
    """
    ECB Data Portal — free REST API.
    Covers: €STR (2019-10-02 onwards).
    EONIA before Oct 2019 used as proxy (stored as Tier 4).
    """
    BASE = "https://data-api.ecb.europa.eu/service/data/EST/B.EU000A2X2A25"

    def fetch(self, date_from: date, date_to: date) -> ImportBatch:
        resp = httpx.get(self.BASE, params={
            "startPeriod": date_from.isoformat(),
            "endPeriod": date_to.isoformat(),
            "format": "jsondata",
        }, timeout=30)
        # Parse ECB SDMX-JSON format
        ...


# Pattern repeats for: BOEAdapter, RBAAdapter, SNBAdapter, MASAdapter
# All return ImportBatch with DataQualityTier.OFFICIAL_CENTRAL_BANK
# All write ON fixing only — not swap curves
```

### CSV bulk import

```python
# api/adapters/csv_import.py

EXPECTED_COLUMNS = {
    "curves": ["date", "curve_id", "tenor", "value"],
    "vols":   ["date", "surface_id", "expiry", "tenor", "value"],
    "fixings":["date", "index_id", "value"],
}

class CSVImporter:
    """
    Accepts CSV exports from Bloomberg, Refinitiv, or any vendor.
    Validates schema, deduplicates, writes to market_history.
    One file can cover any date range — no size limit.

    Designed to be the primary onboarding path for users who
    want to backfill 5–10 years of history from a vendor export.
    """

    def import_file(self, file_path: str,
                    data_type: str,          # curves|vols|fixings
                    quality_tier: int,
                    declared_source: str) -> ImportBatch:
        """
        Full import pipeline:
          1. Schema validation
          2. Value range validation (per risk factor type)
          3. Date validation (business days only, no weekends)
          4. Deduplication check (skip if already in history)
          5. Bulk insert with conflict skip (never overwrite)
          6. ImportBatch audit record
          7. Coverage view refresh
        """
        df = pd.read_csv(file_path, parse_dates=["date"])
        self._validate_schema(df, data_type)
        self._validate_values(df, data_type)
        rows = self._to_history_rows(df, quality_tier, declared_source)
        return history_store.bulk_insert_batch(rows, declared_source)

    def _validate_values(self, df, data_type):
        """
        Range checks per risk factor type:
          OIS rates:        -5% to 35%    (handles negative rates)
          Vol surfaces:     0.01% to 500% (handles extreme vol)
          FX spots:         positive only
          ON fixings:       -5% to 30%
        Rows outside range → rejected, logged in ImportBatch.error_log
        """
        ...

    def preview(self, file_path: str,
                data_type: str) -> ImportPreview:
        """
        Non-destructive preview before committing an import.
        Returns:
          - Row counts
          - Date range in file
          - Curves/factors detected
          - New vs already-exists breakdown
          - Validation errors
          - Estimated storage size
        Used by the UI "Preview Import" button.
        """
        ...
```

### EOD auto-append

```python
# api/routers/snap.py

@router.post("/api/snap/commit")
async def commit_snapshot(payload: CommitPayload, user=Depends(auth)):
    """
    Commits staging grid to production_snapshots.
    Also auto-appends to market_history (Tier 1 if Bloomberg source,
    Tier 3 if CSV, Tier 4 if manual).
    The two writes are atomic — both succeed or both roll back.
    """
    async with db.transaction():

        # Write 1: Production snapshot (for analytics engines)
        snapshot = await production_store.commit(
            payload, user=user.username
        )

        # Write 2: Auto-append to history (for VaR / LCH)
        tier = infer_quality_tier(payload.source)
        await history_store.append_from_snapshot(
            snapshot, quality_tier=tier
        )

    return {"snapshot_id": snapshot.snapshot_id, "status": "committed"}
```

---

## Gap Detection and VaR Readiness

Before any risk engine runs a historical simulation, it checks readiness:

```python
# api/engines/history/gap_detector.py

class VaRReadinessChecker:
    """
    Checks whether history store has sufficient contiguous, high-quality
    data to support a VaR or LCH FHS calculation.
    Called before every risk engine invocation.
    Blocks regulatory runs if not ready.
    Warns (but allows) indicative runs with lower-quality data.
    """

    def check(self,
              curve_ids: list[str],
              val_date: date,
              lookback_days: int = 1250,
              min_tier: int = DataQualityTier.VENDOR_IMPORT,
              mode: str = "regulatory"   # regulatory | indicative
              ) -> ReadinessReport:
        """
        Returns ReadinessReport with:
          status:          READY | WARNING | BLOCKED
          coverage_pct:    actual days / required days
          gap_dates:       list of missing business dates
          low_tier_dates:  dates with data below min_tier
          missing_factors: risk factors with insufficient history
          recommendation:  human-readable action to fix gaps
        """
        required_dates = business_day_calendar.range(
            val_date - timedelta(days=lookback_days * 1.4),
            val_date
        )[-lookback_days:]

        coverage = {}
        for curve_id in curve_ids:
            available = history_store.get_dates(
                curve_id, required_dates[0], val_date, min_tier
            )
            gaps = set(required_dates) - set(available)
            coverage[curve_id] = CoverageResult(
                required=len(required_dates),
                available=len(available),
                gaps=sorted(gaps),
                coverage_pct=len(available) / len(required_dates),
            )

        overall_status = self._derive_status(coverage, mode)
        return ReadinessReport(
            val_date=val_date,
            lookback_days=lookback_days,
            coverage=coverage,
            status=overall_status,
        )

    def _derive_status(self, coverage, mode):
        min_coverage = min(c.coverage_pct for c in coverage.values())
        if mode == "regulatory":
            if min_coverage < 1.0:    return "BLOCKED"
            return "READY"
        else:  # indicative
            if min_coverage < 0.95:   return "BLOCKED"
            if min_coverage < 0.99:   return "WARNING"
            return "READY"
```

---

## Market Data — Navigation Structure

```
Configurations → Market Data
│
├── Curves         Asset class tabs: Rates|Credit|FX|Equity|Commodity
│                  Each curve: Definition · Instruments · Bootstrap Config
│                  Instruments show live quality tier badge per quote
│
├── Surfaces       Asset class tabs: same 5
│                  Each surface: heat-map grid + quality tier per cell
│
├── Fixings        ON index sidebar + history table per index
│                  Source badge per fixing (Tier 1–6 colour)
│
├── Snap           TODAY'S PRODUCTION DATA ENTRY
│   │              Working store → staging → commit to production snapshot
│   ├── Bloomberg  Live fetch (BDP) | Paste parser
│   ├── FRED       One-click pull for ON fixings (free)
│   ├── CSV        Paste or upload — today's data only
│   └── Manual     Row-by-row entry
│                  ─────────────────────────────────────────────────
│                  On commit: writes to production_snapshots AND
│                             auto-appends to market_history
│
├── Snapshots      PRODUCTION SNAPSHOT BROWSER
│                  Browse committed EOD/intraday snaps
│                  Single view: full curve/vol/fixing table
│                  A/B diff: two dates, NEW/CHG/RMV with bp delta
│                  Version history: v1/v2 of same date if amended
│
└── History        HISTORICAL TIME SERIES MANAGEMENT
    │              ─────────────────────────────────────────────────
    │              Completely separate from Snapshots.
    │              No shared UI elements. No shared tables.
    │
    ├── Coverage   Visual calendar heatmap
    │              X-axis: date (last 10 years, scrollable)
    │              Y-axis: risk factor (per curve, per surface)
    │              Cell colour: quality tier of data for that day/factor
    │              Green=T1, Teal=T2, Blue=T3, Amber=T4, Purple=T5, Grey=T6
    │              Missing days: Red cell
    │              Click any cell: drill to exact source + import batch
    │
    ├── Import     Bulk ingestion into history store
    │   ├── Bloomberg BDH
    │   │          Select curve(s), date range
    │   │          "Fetch from Terminal" button
    │   │          Progress bar per curve (runs in parallel)
    │   │          Result: rows inserted / skipped / rejected
    │   │
    │   ├── FRED Pull
    │   │          Select indexes (SOFR, FF, Treasuries)
    │   │          Select date range (SOFR available from 2018-04-03)
    │   │          One-click → auto-fetches + writes to history
    │   │
    │   ├── Central Bank Pull
    │   │          ECB (€STR from 2019-10-02)
    │   │          BOE (SONIA from 1997)
    │   │          RBA (AONIA), SNB (SARON), MAS (SORA)
    │   │          Per-index one-click pulls with date range
    │   │
    │   ├── CSV Bulk Import
    │   │          Drop zone for vendor CSV exports
    │   │          Preview before commit:
    │   │            - Date range detected
    │   │            - Curves/factors detected
    │   │            - Validation summary (errors shown inline)
    │   │            - New vs existing breakdown
    │   │            - Estimated coverage improvement
    │   │          Quality tier selector (Tier 1–4)
    │   │          Source label (free text for audit)
    │   │          Confirm → bulk insert (skip-on-conflict)
    │   │
    │   └── Synthetic Seed
    │              Generate statistically calibrated synthetic history
    │              for testing and demo environments
    │              Clearly labelled Tier 5 — blocked from regulatory runs
    │              "Seed 1250 days" / "Seed 2520 days" buttons
    │              Calibrated to actual historical vol/corr structure
    │
    ├── Gaps       Missing date detector
    │              Dropdown: select analytics use case
    │                VaR 250d | VaR 1250d | Stressed VaR | FRTB ES 2520d
    │                LCH SwapClear | SIMM | Custom (n days)
    │              Run check: shows missing dates per risk factor
    │              Actions per gap:
    │                Fetch from Bloomberg BDH (if Terminal available)
    │                Carry forward (marks as Tier 6 GAP_FILLED)
    │                Mark as holiday (removes from required set)
    │              One-click "Fix All Gaps" → applies carry forward
    │
    └── Audit      Full import history
                   Every import batch: type, source, date range,
                   rows inserted/skipped/rejected, user, timestamp
                   Drill into any batch: row-level detail
                   Export audit log as CSV
```

---

## Scenario Extraction — History to Risk Engine

```python
# api/engines/history/scenario_builder.py

class ScenarioBuilder:
    """
    Extracts historical scenario matrices from market_history.
    This is the bridge between the history store and all risk engines.
    VaR, LCH FHS, Stressed VaR, PnL backtesting all use this class.
    """

    def build_ir_scenarios(
        self,
        curve_ids: list[str],
        val_date: date,
        n_scenarios: int = 1250,
        min_tier: int = DataQualityTier.VENDOR_IMPORT,
        return_type: str = "log"   # log | absolute | relative
    ) -> IRScenarioMatrix:
        """
        Returns:
          matrix:      np.ndarray shape (n_scenarios, n_risk_factors)
                       Risk factors ordered by SIMM IR tenor convention
          dates:       list of business dates for each scenario
          factor_ids:  list of risk_factor_id strings (column labels)
          coverage:    ReadinessReport
        """
        # 1. Readiness check — blocks if insufficient data
        checker = VaRReadinessChecker()
        report = checker.check(curve_ids, val_date, n_scenarios, min_tier)
        if report.status == "BLOCKED":
            raise InsufficientHistoryError(report)

        # 2. Fetch ordered time series
        query = """
            SELECT business_date, risk_factor_id, value
            FROM market_history
            WHERE curve_id = ANY(:curve_ids)
              AND business_date <= :val_date
              AND quality_tier <= :min_tier
            ORDER BY business_date DESC
            LIMIT :limit
        """
        rows = db.execute(query, curve_ids=curve_ids,
                          val_date=val_date,
                          min_tier=min_tier,
                          limit=n_scenarios + 1)

        # 3. Pivot to matrix and compute returns
        df = pivot_to_dataframe(rows)  # dates × risk_factors
        if return_type == "log":
            scenarios = np.log(df.values[:-1] / df.values[1:])
        elif return_type == "absolute":
            scenarios = df.values[:-1] - df.values[1:]

        return IRScenarioMatrix(
            matrix=scenarios[:n_scenarios],
            dates=df.index[:n_scenarios].tolist(),
            factor_ids=df.columns.tolist(),
            coverage=report,
        )

    def build_stress_window(
        self,
        scenario_name: str,
        curve_ids: list[str],
    ) -> StressScenario:
        """
        Extract a named historical stress window.
        Returns the actual market moves observed during the window.
        """
        STRESS_WINDOWS = {
            "GFC_2008":        (date(2008, 9, 1),  date(2009, 3, 31)),
            "EU_SOVEREIGN":    (date(2010, 4, 1),  date(2010, 9, 30)),
            "TAPER_TANTRUM":   (date(2013, 5, 1),  date(2013, 9, 30)),
            "COVID_2020":      (date(2020, 2, 1),  date(2020, 5, 31)),
            "RATES_SHOCK_2022":(date(2022, 1, 1),  date(2022, 12, 31)),
            "SILICON_VALLEY":  (date(2023, 3, 1),  date(2023, 4, 30)),
        }
        start, end = STRESS_WINDOWS[scenario_name]
        # Returns peak-to-trough moves across the window
        ...
```

---

## History Store — Key API Endpoints

```
GET  /api/history/coverage
     ?curve_ids=USD_SOFR,EUR_ESTR
     &date_from=2020-01-01
     &date_to=2025-01-15
     → coverage matrix for UI calendar heatmap

GET  /api/history/readiness
     ?use_case=VAR_1250
     &val_date=2025-01-15
     &curve_ids=USD_SOFR,EUR_ESTR,GBP_SONIA
     → ReadinessReport (READY | WARNING | BLOCKED)

POST /api/history/import/bloomberg-bdh
     { curve_ids: [...], date_from: "...", date_to: "...", field: "PX_LAST" }
     → ImportBatch (async — poll for progress)

POST /api/history/import/fred
     { series: ["SOFR"], date_from: "...", date_to: "..." }
     → ImportBatch

POST /api/history/import/csv
     multipart/form-data: file + metadata
     → ImportPreview (dry-run) or ImportBatch (commit)

GET  /api/history/gaps
     ?use_case=LCH_1250&val_date=2025-01-15
     → list of missing business dates per risk factor

POST /api/history/gaps/fill
     { method: "carry_forward" | "interpolate", gap_dates: [...] }
     → fills gaps as Tier 6, returns count

GET  /api/history/batches
     → paginated list of all ImportBatch records

GET  /api/history/batches/{batch_id}
     → full ImportBatch with row-level error log

GET  /api/history/scenarios/ir
     ?curve_ids=USD_SOFR&val_date=2025-01-15&n=1250
     → IRScenarioMatrix (for engine consumption, not UI)
```

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + Vite | Component reuse, hot reload |
| Prototype UI | Standalone HTML + vanilla JS | Zero-dependency sprint 0–2 |
| Backend | Python + FastAPI | NumPy, SciPy, QuantLib, BLPAPI |
| Pricing | NumPy + SciPy + QuantLib-Python | Vectorised, production grade |
| Own Python | Parallel own-python pricers | Transparency, ISDA test suite |
| SIMM | NumPy matrix operations | Σ = σσᵀ ⊙ ρ, pure linear algebra |
| Monte Carlo | NumPy + Numba JIT | Full revaluation at path scale |
| Database dev | SQLite | Zero setup |
| Database prod | PostgreSQL | ACID, JSONB, immutability triggers |
| History cache | Redis (optional) | Scenario matrix hot cache |
| Blockchain | Ethereum + Solidity | EVM standard |
| Chain tooling | Hardhat + ethers.js + web3.py | Dev + prod bridge |
| Auth | JWT + RBAC | Trader/Risk/XVA/Admin/ReadOnly |
| CI/CD | GitHub Actions | Free for public repos |
| Containers | Docker + docker-compose | Reproducible environments |

---

## QuantLib Strategy

Primary analytics engine: **QuantLib-Python (SWIG bindings)**.

An **own-Python implementation** is written alongside every QL pricer:
- Transparency and auditability — no black box
- ISDA test suite validation
- SIMM is entirely own-Python (QL has no SIMM module)
- CVA/DVA integrator is own-Python wrapping QL survival probabilities

---

## Dual-Mode Engine

```
Mode.FULL_REVAL     Full revaluation — exact, all nonlinearity
                    Used for: EOD official, regulatory, LCH IM

Mode.SENSITIVITIES  Taylor approximation — fast, SIMM-consistent
                    ΔP ≈ Σᵢ sᵢΔxᵢ + ½ ΣᵢΣⱼ Γᵢⱼ ΔxᵢΔxⱼ + VegaΔσ + ΘΔt
                    Used for: intraday, what-if, limits

Mode.HYBRID         Linear → SENSITIVITIES, Nonlinear → FULL_REVAL
                    Default production mode
```

---

## SIMM Covariance Layer

```
Σᵢⱼ = σᵢ × σⱼ × ρᵢⱼ   (SIMM risk weights × SIMM correlations)

Used by: Market Risk (VaR scenarios) · CCR (PFE sensitivity paths)
         XVA (intraday approximation) · SIMM (IM formula itself)
         MVA (projected SIMM path) · LCH (cross-check)

CorrelationMode: SIMM_BASE | SIMM_STRESSED | HISTORICAL | CUSTOM
```

---

## Full Navigation Structure

```
Top Nav:  Pricer | PnL | Market Risk | CCR | SIMM | Blockchain | Configurations

Configurations:
  Market Data:
    Curves     → Rates(✓S1) | Credit(S8) | FX(S6) | Equity(S12) | Commodity(S12)
    Surfaces   → Rates(S4)  | Credit(S8) | FX(S6) | Equity(S12) | Commodity(S12)
    Fixings    → ON indexes with history (S1 UI ✓, S4 FRED/ECB)
    Snap       → Bloomberg live/paste · FRED · CSV · Manual  (S1 UI ✓, S3 API)
    Snapshots  → Browser + A/B diff  (S1 ✓)
    History    → Coverage · Import · Gaps · Audit  (S3)

  Market Risk Config  → VaR method · limits · stress scenarios  (S10)
  CCR Config          → exposure model · simulation params  (S13)
  Onboarding          → counterparty master · CSA  (S2)
  Org Hierarchy       → firm→division→desk→sub-desk  (S2)
  Methodology         → per-model docs · QL vs own-Python  (S19)
```

---

## Sprint Plan — 20 Sprints

```
Sprint 0   Infrastructure
           FastAPI skeleton, React+Vite, SQLite schema (3-store design)
           Docker + docker-compose, GitHub Actions CI
           QuantLib-Python install + smoke test
           Base classes, enums, DataQualityTier, ImportBatch models
           history_store + production_store + working_store modules

Sprint 1   Market Data — UI workspace                    ← COMPLETE ✓
           Standalone HTML: Curves · Surfaces · Fixings · Snap · Snapshots
           13 OIS curves (Americas · Europe · Asia-Pacific)
           8 QuantLib interpolation methods per curve
           Snap: Bloomberg paste · CSV · manual · staging · commit
           Snapshots: browser + A/B diff (NEW/CHG/RMV, bp delta)
           Asset class taxonomy locked: Rates|Credit|FX|Equity|Commodity
           Deliverable: MarketData_v3.html

Sprint 2   Navigation + Org Hierarchy
           React+Vite wired — Sprint 1 HTML as design reference
           Full top nav + configurations sub-nav
           Org Hierarchy: flexible firm→division→desk→sub-desk tree
           Legal entity master (LEI, jurisdiction, regime)
           Counterparty master (ISDA agreement type, netting sets)
           User roles: JWT + RBAC skeleton

Sprint 3   History Store + Curve Bootstrap API           ← NEXT
           3-store database schema deployed (history/production/working)
           Immutability trigger on market_history
           Bloomberg DAPI adapter (BDP live + BDH historical)
           FRED adapter (SOFR, Fed Funds, Treasuries)
           CSV bulk importer (schema validation, preview, bulk insert)
           EOD auto-append (snapshot commit → history append, atomic)
           History tab UI:
             Coverage calendar heatmap (Tier colours, missing=red)
             Import panel (BBG BDH · FRED · CSV drop zone)
             Gaps panel (missing date detector + carry-forward fix)
             Audit panel (import batch list + drill-down)
           VaR readiness checker API
           POST /api/curves/rates/bootstrap (real QL bootstrap)
             All 13 OIS curves live in browser
           IRS multi-curve bootstrap (OIS discounting, IBOR projection)
           Sprint 3 LinkedIn: "Real-time QuantLib bootstrap + history store"

Sprint 4   Vol Surfaces + Remaining Free Data Sources
           SABR calibration (α, β, ρ, ν) per expiry slice
           SVI parametrisation
           Local vol surface (Dupire)
           Swaption vol, Cap/Floor vol, Bond option vol bootstrapped
           ECB adapter (€STR fixings from 2019)
           BOE adapter (SONIA from 1997 — longest RFR history)
           RBA adapter (AONIA), SNB adapter (SARON), MAS adapter (SORA)
           Synthetic seed generator (Tier 5 — for testing/demo)
           Sprint 4 LinkedIn: "Vol surface calibration: SABR + SVI"

Sprint 5   Trade Blotter + Instrument Taxonomy
           FpML import, CSV upload, manual entry
           Full ProductClass taxonomy
           Trade blotter: filter, sort, group by class/desk
           Cashflow schedule per trade

Sprint 6   FX Pricers + FX Market Data
           FX forward curves (CIP: domestic OIS ÷ foreign OIS + fwd pts)
           XCCY basis curves (vs USD SOFR, all G13 pairs)
           FX vol surfaces (delta-based: 10DP/25DP/ATM/25DC/10DC)
           FX pricers: forward, swap, option (BSM), NDF
           FX history: BDH for all G13 spot + vol surfaces
           Sprint 6 LinkedIn: "FX derivatives: pricing + risk + history"

Sprint 7   Rates Pricers
           IRS: ql.VanillaSwap + DiscountingSwapEngine + own Python
           OIS: ql.OvernightIndexedSwap + own Python
           Basis swap, XCCY swap, Swaption, Cap/Floor, Inflation
           Bond, Loan, Bill, Repo (ProductClass.CASH)
           Sprint 7 LinkedIn: "Full rates pricer: IRS to swaptions"

Sprint 8   Credit Pricers + Credit Market Data
           CDS survival probability curves (hazard rate bootstrap)
           CDS pricer: ql.IsdaCdsEngine + own Python ISDA model
           CDX/iTraxx index, TRS, CLN
           Credit vol surfaces: CDS swaption vol, base correlation
           Credit history: CDS spread time series via CSV/BDH
           Sprint 8 LinkedIn: "CDS pricing: QuantLib + ISDA model"

Sprint 9   Greeks Engine — SIMM Factor Space
           Bump-and-reprice in SIMM factor space — all risk classes
           IR/Credit/FX/Equity/Commodity delta, vega, curvature
           Portfolio Greeks aggregation
           CRIF output (CSV/JSON per SIMM spec)
           Sprint 9 LinkedIn: "Cross-asset Greeks in SIMM factor space"

Sprint 10  Market Risk Config + VaR Engine
           Market Risk Config UI
           VaR: Historical Simulation (1250 days from history store)
           VaR: Delta-Gamma (SIMM Σ covariance)
           VaR: Monte Carlo
           Backtesting: actual P&L vs VaR (Basel traffic light)
           VaR readiness check gates every run (checks coverage)
           Confidence level, lookback, holding period selectable
           Sprint 10 LinkedIn: "Multi-method VaR with readiness gating"

Sprint 11  Stress Testing + PnL Attribution
           Named stress windows from history store:
             GFC_2008 · EU_SOVEREIGN · TAPER_TANTRUM ·
             COVID_2020 · RATES_SHOCK_2022 · SILICON_VALLEY
           Custom stress: user-defined factor shocks
           PnL attribution: Δ/Γ/Vega/Theta/Carry/FX decomposition
           Delta ladder, vega surface UI
           Sprint 11 LinkedIn: "Stress testing: every crisis, one system"

Sprint 12  Equity + Commodity Pricers + Market Data
           Dividend curves, borrow curves, equity vol surfaces
           Equity forward, option, TRS pricers
           Commodity forward curves, vol surfaces
           Commodity forward, swap, option pricers
           History: equity vol + commodity forward curve time series
           Sprint 12 LinkedIn: "Equity + commodity: full coverage"

Sprint 13  CCR Config + Customer Onboarding
           Counterparty master, CSA workspace, netting sets
           Discount map: CSA → OIS discount curve
           Credit limit workspace

Sprint 14  CCR Exposure — PFE / EE / SA-CCR
           ℙ-measure MC, EE/ENE/PFE profiles
           SA-CCR per ProductClass
           EPE, EEPE for regulatory capital
           Sprint 14 LinkedIn: "CCR: EPE + PFE + SA-CCR"

Sprint 15  XVA — CVA / DVA / FVA / ColVA / MVA / KVA
           ℚ-measure American MC
           Full bilateral XVA dashboard
           Sprint 15 LinkedIn: "Full bilateral XVA: CVA to KVA"

Sprint 16  ISDA SIMM v2.6 — All 6 Risk Classes          ← LinkedIn milestone
           Own Python entirely — all 6 SIMM risk classes
           CRIF upload → IM in seconds
           Sprint 16 LinkedIn: "ISDA SIMM v2.6 from scratch — all 6 classes"

Sprint 17  Schedule IM + LCH IM Replication
           LCH SwapClear: FHS 1250 scenarios, GARCH filter, 99.7%
           (requires Sprint 10 history store — data already there)
           CDSClear, ForexClear, RepoClear
           Sprint 17 LinkedIn: "LCH IM replication: FHS + GARCH"

Sprint 18  Blockchain — Ethereum Smart Contracts
           TradeConfirm.sol, SettlementInstruction.sol, MarginCall.sol
           web3.py bridge, on-chain IM calls
           Sprint 18 LinkedIn: "On-chain derivatives: SIMM IM on Ethereum"

Sprint 19  Methodology Tab
           Per-model docs, QL vs own-Python comparison
           ISDA test suite results per pricer
           SIMM, LCH, XVA methodology pages

Sprint 20  Production Hardening
           PostgreSQL (Alembic), Docker prod, RBAC full
           Redis scenario matrix cache
           Numba JIT for MC hot paths
           Audit log, monitoring (Prometheus + Grafana)
           Sprint 20 LinkedIn: "Rijeka v1.0 — production-ready"
```

---

## Folder Structure

```
rijeka/
│
├── ARCHITECTURE.md              this file (v4.0)
├── README.md
├── docker-compose.yml
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
│
├── ui/
│   ├── MarketData_v3.html       Sprint 1 prototype (standalone)
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── constants/
│       │   ├── riskClasses.js
│       │   ├── riskTypes.js
│       │   ├── productClasses.js
│       │   ├── assetClasses.js
│       │   ├── dataQualityTiers.js    NEW — Tier 1–6 enum + colours
│       │   └── simmTenors.js
│       │
│       └── components/
│           ├── layout/
│           │   ├── AppBar.jsx
│           │   └── ConfigNav.jsx
│           │
│           ├── marketdata/
│           │   ├── MarketDataWorkspace.jsx
│           │   ├── curves/               (see v3 structure)
│           │   ├── surfaces/             (see v3 structure)
│           │   ├── fixings/
│           │   │   └── FixingsWorkspace.jsx         S1 ✓
│           │   ├── snap/
│           │   │   ├── SnapWorkspace.jsx            S1 ✓
│           │   │   ├── BloombergLivePanel.jsx       S3
│           │   │   ├── BloombergPasteParser.jsx     S1 ✓
│           │   │   ├── FREDConnector.jsx            S3
│           │   │   ├── CentralBankConnectors.jsx    S4
│           │   │   ├── CSVUploader.jsx              S1 ✓
│           │   │   └── StagingTable.jsx             S1 ✓
│           │   ├── snapshots/
│           │   │   ├── SnapshotBrowser.jsx          S1 ✓
│           │   │   └── SnapshotDiff.jsx             S1 ✓
│           │   │
│           │   └── history/                    ── NEW Sprint 3 ──
│           │       ├── HistoryWorkspace.jsx    tab container
│           │       ├── CoverageCalendar.jsx    heatmap calendar
│           │       │                           date × risk factor
│           │       │                           tier colour coding
│           │       │                           click to drill
│           │       ├── ImportPanel.jsx         import tab
│           │       │   ├── BloombergBDHPanel.jsx
│           │       │   ├── FREDPullPanel.jsx
│           │       │   ├── CentralBankPanel.jsx
│           │       │   ├── CSVBulkImport.jsx   drop zone + preview
│           │       │   └── SyntheticSeed.jsx
│           │       ├── GapsPanel.jsx           missing date view
│           │       │   ├── ReadinessReport.jsx VaR readiness status
│           │       │   ├── GapList.jsx         missing dates per factor
│           │       │   └── GapFixer.jsx        carry-forward / fetch
│           │       └── AuditPanel.jsx          import batch log
│           │           ├── BatchList.jsx
│           │           └── BatchDetail.jsx
│           │
│           ├── risk/          (see v3)
│           ├── ccr/           (see v3)
│           ├── xva/           (see v3)
│           ├── im/            (see v3)
│           ├── collateral/    (see v3)
│           ├── confirmation/  (see v3)
│           └── configurations/(see v3)
│
├── api/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   │
│   ├── routers/
│   │   ├── marketdata.py
│   │   ├── snap.py
│   │   ├── history.py                 NEW Sprint 3
│   │   │   # GET  /api/history/coverage
│   │   │   # GET  /api/history/readiness
│   │   │   # POST /api/history/import/bloomberg-bdh
│   │   │   # POST /api/history/import/fred
│   │   │   # POST /api/history/import/ecb
│   │   │   # POST /api/history/import/boe
│   │   │   # POST /api/history/import/csv
│   │   │   # POST /api/history/import/synthetic-seed
│   │   │   # GET  /api/history/gaps
│   │   │   # POST /api/history/gaps/fill
│   │   │   # GET  /api/history/batches
│   │   │   # GET  /api/history/batches/{id}
│   │   ├── bloomberg.py               NEW Sprint 3
│   │   │   # GET  /api/bloomberg/status
│   │   │   # POST /api/bloomberg/bdp  (live quotes → working)
│   │   │   # POST /api/bloomberg/bdh  (history → history store)
│   │   ├── risk.py
│   │   ├── ccr.py
│   │   ├── xva.py
│   │   ├── simm.py
│   │   ├── lch.py
│   │   ├── collateral.py
│   │   ├── confirm.py
│   │   └── admin.py
│   │
│   ├── models/
│   │   ├── enums.py                   + DataQualityTier enum
│   │   ├── history.py                 NEW — HistoryRow, ImportBatch,
│   │   │                              ImportPreview, ReadinessReport,
│   │   │                              CoverageResult, VaRUseCase
│   │   ├── scenarios.py               NEW — IRScenarioMatrix,
│   │   │                              StressScenario, ScenarioReturn
│   │   ├── sensitivity.py
│   │   ├── greeks.py
│   │   ├── trade.py
│   │   ├── instrument.py
│   │   ├── marketdata.py
│   │   ├── collateral.py
│   │   ├── results.py
│   │   └── chain.py
│   │
│   ├── engines/
│   │   ├── history/                   NEW Sprint 3
│   │   │   ├── history_store.py       bulk_insert, get_dates, append_from_snap
│   │   │   ├── gap_detector.py        VaRReadinessChecker
│   │   │   ├── scenario_builder.py    ScenarioBuilder
│   │   │   └── synthetic_seed.py      calibrated synthetic history generator
│   │   ├── bootstrap/                 Sprint 3
│   │   │   ├── ois.py
│   │   │   ├── irs.py
│   │   │   └── basis.py
│   │   ├── surfaces/                  Sprint 4
│   │   ├── instruments/               Sprint 6+
│   │   ├── greeks/                    Sprint 9
│   │   ├── market_risk/               Sprint 10
│   │   │   ├── engine.py
│   │   │   ├── historical_sim.py      uses ScenarioBuilder
│   │   │   ├── delta_gamma_var.py     uses SIMM Σ
│   │   │   ├── monte_carlo_var.py
│   │   │   └── pnl_explain.py
│   │   ├── covariance/
│   │   ├── ccr/                       Sprint 14
│   │   ├── xva/                       Sprint 15
│   │   └── im/                        Sprint 16–17
│   │
│   ├── adapters/
│   │   ├── bloomberg.py               BloombergAdapter (BDP + BDH)
│   │   ├── fred.py                    FREDAdapter
│   │   ├── ecb.py                     ECBAdapter
│   │   ├── boe.py                     BOEAdapter
│   │   ├── rba.py                     RBAAdapter
│   │   ├── snb.py                     SNBAdapter
│   │   ├── mas.py                     MASAdapter
│   │   ├── csv_import.py              CSVImporter (preview + bulk)
│   │   ├── fpml.py                    Sprint 5
│   │   └── ice.py                     Sprint 8
│   │
│   ├── data/
│   │   └── curve_definitions.py       ticker maps per curve
│   │                                  { curve_id: { tenor: bbg_ticker } }
│   │
│   ├── chain/
│   │   └── bridge.py
│   │
│   └── db/
│       ├── database.py                SQLAlchemy
│       ├── three_store_schema.sql     3-store schema (history above)
│       └── migrations/                Alembic
│
├── chain/
│   ├── contracts/
│   │   ├── TradeConfirm.sol
│   │   ├── SettlementInstruction.sol
│   │   └── MarginCall.sol
│   └── test/
│
└── docs/
    ├── ARCHITECTURE.md               this file (v4.0)
    ├── MARKET_DATA_HISTORY.md        3-store design, quality tiers
    ├── CURVE_FRAMEWORK.md            multi-curve, OIS discounting
    ├── SIMM_CONVENTIONS.md
    ├── XVA_METHODOLOGY.md
    ├── SIMM_METHODOLOGY.md
    ├── LCH_IM_METHODOLOGY.md
    ├── BLOCKCHAIN_DESIGN.md
    └── BUILD_SEQUENCE.md
```

---

## Greeks Dataclass — SIMM factor space

```python
@dataclass
class Greeks:
    ir_delta:          dict[tuple, float]   # (currency, sub_curve, tenor)
    ir_vega:           dict[tuple, float]   # (currency, vol_tenor)
    ir_curvature:      dict[tuple, float]
    ir_inflation:      dict[str, float]
    ir_xccy_basis:     dict[str, float]
    credit_q_delta:    dict[tuple, float]   # (issuer, bucket, tenor)
    credit_q_vega:     dict[tuple, float]
    base_corr:         dict[tuple, float]   # (index, detachment)
    credit_nonq_delta: dict[tuple, float]
    credit_nonq_vega:  dict[tuple, float]
    equity_delta:      dict[tuple, float]   # (name, bucket)
    equity_vega:       dict[tuple, float]
    equity_curvature:  dict[tuple, float]
    commodity_delta:   dict[tuple, float]   # (name, bucket, tenor)
    commodity_vega:    dict[tuple, float]
    fx_delta:          dict[str, float]     # per ccy pair
    fx_vega:           dict[tuple, float]   # (pair, vol_tenor)
    fx_curvature:      dict[tuple, float]
    theta:             float
    carry:             float
    cross_gamma:       dict[tuple, float]   # sparse
```

---

## XVA Formulas

```
CVA  = −LGD_cpty × Σₜ D(t) × EE_Q(t)  × ΔPD_Q_cpty(t)
DVA  = +LGD_own  × Σₜ D(t) × ENE_Q(t) × ΔPD_Q_own(t)
FVA  = −Σₜ D(t) × [EE_Q(t) − ENE_Q(t)] × spread_funding(t)
ColVA= −Σₜ D(t) × EE_Q(t) × spread_ctd(t)
MVA  = −Σₜ D(t) × SIMM_IM_Q(t) × spread_funding(t)
KVA  = −Σₜ D(t) × EAD_SACCR(t) × RW_regulatory × CoC
```

---

## Blockchain Trade Hash

```solidity
bytes32 tradeHash = keccak256(abi.encode(
    trade.notional,      trade.fixedRate,
    trade.maturity,      trade.currency,
    trade.productClass,  trade.riskClasses,
    trade.counterpartyId,trade.nettingSetId,
    block.chainid
));
```

---

## Key Decisions

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | System type | Risk system only | Sharper focus |
| 2 | Computation | Dual-mode: full reval + Taylor | Exact EOD, fast intraday |
| 3 | Scenarios | SIMM Σ covariance | Consistent across all modules |
| 4 | Naming | ISDA SIMM conventions | One vocabulary end to end |
| 5 | Risk classes | All 6 SIMM classes | Full cross-asset |
| 6 | Market data taxonomy | Rates/Credit/FX/Equity/Commodity | Mirrors SIMM |
| 7 | Data stores | 3 stores: History / Production / Working | Zero overlap, zero ambiguity |
| 8 | History immutability | DB trigger blocks UPDATE/DELETE | Audit integrity, no accidents |
| 9 | Data quality | 6-tier system, tier-gated analytics | Transparent provenance |
| 10 | VaR readiness | Checked before every run, blocks if insufficient | No silent bad runs |
| 11 | Bloomberg | DAPI (localhost:8194), no B-PIPE needed | Desktop Terminal is enough |
| 12 | Free sources | FRED + ECB + BOE + RBA + SNB + MAS | ON fixings free, no vendor lock |
| 13 | Gap fill | Tier 6 GAP_FILLED, clearly labelled | Analyst always knows |
| 14 | OIS curves | 13 developed markets only | Standard benchmark |
| 15 | QL strategy | QL-Python primary + own Python parallel | Auditability + ISDA |
| 16 | LCH scope | All 4 clearing services | Complete cleared book |
| 17 | XVA | CVA+DVA+FVA+ColVA+MVA+KVA | Full bilateral XVA |
| 18 | Blockchain | Ethereum — trade+settlement+IM | Novel differentiator |
| 19 | DB | SQLite dev → PostgreSQL prod | Zero setup → production |

---

## Sprint 2 Handoff — Starting Point

**Sprint 1 complete:**
- `MarketData_v3.html` — full standalone market data workspace
- 13 OIS curves with full Definition + Instruments + Bootstrap Config
- 8 QuantLib interpolation methods per curve
- Asset class taxonomy locked (Rates/Credit/FX/Equity/Commodity)
- Snap: Bloomberg paste · CSV · manual · staging · commit
- Snapshots: browser + A/B diff with bp delta

**Sprint 2 goals:**
1. React+Vite project initialised — Sprint 1 HTML is the design reference
2. Org Hierarchy tab: firm→division→desk→sub-desk tree editor
3. Legal entity master + counterparty master
4. JWT auth skeleton + role enum

**Sprint 3 goals (after Sprint 2):**
1. 3-store database schema deployed with immutability trigger
2. Bloomberg DAPI adapter (BDP live + BDH historical)
3. FRED, ECB, BOE free API adapters
4. CSV bulk importer with preview
5. History tab UI: Coverage calendar + Import + Gaps + Audit
6. Real QL bootstrap wired: POST /api/curves/rates/bootstrap
7. EOD auto-append (commit → production AND history, atomic)

---

*Rijeka — Croatian for "river". Risk flows through it.*
*One system. One vocabulary. Three stores. Every risk metric a derivatives book requires.*
