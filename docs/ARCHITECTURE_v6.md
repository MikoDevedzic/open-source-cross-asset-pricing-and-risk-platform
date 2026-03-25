# Rijeka — ARCHITECTURE_v6.md
> Updated: Sprint 2 Day 1 complete (2026-03-25)
> Read this before writing any code.

---

## What Rijeka Is

Open-source full revaluation derivatives risk system.
Pure risk analytics — no front office, no order management.
Covers: market risk, CCR, XVA, ISDA SIMM, trade lifecycle, PnL attribution, on-chain confirmation.
ISDA SIMM v2.6 naming conventions used as universal vocabulary throughout.

---

## Infrastructure

| Service | Purpose | Notes |
|---------|---------|-------|
| Netlify | Frontend (React + Vite) | Auto-deploy from GitHub `frontend/` |
| Render | Backend (FastAPI) | Auto-deploy from GitHub `backend/` |
| Supabase | Database (Postgres) | No SQLite — Supabase from day one |
| GitHub | Monorepo | MikoDevedzic/open-source-cross-asset-pricing-and-risk-platform |

**Local dev path:** `C:\Users\mikod\OneDrive\Desktop\Rijeka\`

---

## Monorepo Structure

```
Rijeka/
├── frontend/                   React + Vite (Netlify)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         AppBar, CfgNav, MdNav, StubPage ✅ Sprint 2 Day 1
│   │   │   ├── market-data/    CurvesWorkspace etc — Sprint 2 Day 2
│   │   │   ├── org/            OrgHierarchy, LegalEntity, Counterparty — Sprint 2 Day 4-5
│   │   │   ├── auth/           LoginPage, LandingPage — Sprint 2 Day 6
│   │   │   ├── pricer/         Sprint 5
│   │   │   ├── market-risk/    Sprint 10
│   │   │   ├── pnl/            Sprint 11
│   │   │   └── ccr/            Sprint 14
│   │   ├── store/              Zustand stores
│   │   ├── data/               Static seed data (54 curves)
│   │   └── api/                Axios client + endpoint functions
├── backend/                    FastAPI (Render)
│   ├── api/routes/
│   ├── models/
│   ├── db/
│   └── engines/
├── docs/                       Methodology PDF + LaTeX source
└── sprint 1 Market Data/       Reference only — not deployed
```

---

## Design Invariants — Never Change

```
1. CSS variables:  --bg #060a0e  --accent #0ec9a0  --mono JetBrains Mono
   Dark terminal aesthetic. No hardcoded hex values anywhere.

2. ISDA SIMM naming: every variable, endpoint, column follows ISDA SIMM v2.6.
   Never introduce a parallel vocabulary.

3. 3-store separation: History / Production / Working — never overlap.
   No direct write from Working to History. EOD commit is the only bridge.

4. Immutability: once a snapshot, history row, or trade is committed,
   it is never modified. Corrections and lifecycle events are new rows.
   Enforced at DB level via triggers.

5. Trade immutability: trades are never updated in place.
   All lifecycle changes (amend, novation, termination, addon) are
   recorded as trade_events rows. The trade row itself never changes.

6. Audit trail: every write operation records user_id + timestamp.
   No anonymous mutations anywhere in the system.

7. Funding curves: firm_spread(t) is the single source of truth
   for FVA/ColVA/MVA. Never hardcode a funding assumption elsewhere.

8. PnL attribution: trade-level PnL is the atomic unit.
   All higher-level views (desk, trader, counterparty, hierarchy)
   are aggregations of trade-level PnL. One table, infinite slicing.
```

---

## Stack

```
Frontend:   React 18 + Vite 8 + React Router v6 + Zustand + Axios
Styling:    Tailwind v4 (plugin) + CSS variables (design tokens)
Backend:    Python 3.11+ + FastAPI + SQLAlchemy + Alembic
Database:   Supabase Postgres (prod + dev — no SQLite)
Auth:       JWT (python-jose) + RBAC
Analytics:  QuantLib-Python (SWIG) + own Python parallel implementations
Drag-drop:  @dnd-kit/core + @dnd-kit/sortable (org tree)
```

---

## URL Structure

```
rijeka.app/                     → Landing page (public, unauthenticated)
rijeka.app/login                → Login screen
rijeka.app/configurations/*     → Configurations (authenticated)
rijeka.app/pricer               → Pricer (Sprint 5)
rijeka.app/market-risk          → Market Risk (Sprint 10)
rijeka.app/pnl                  → PnL Attribution (Sprint 11)
rijeka.app/ccr                  → CCR (Sprint 14)
rijeka.app/simm                 → SIMM (Sprint 16)
rijeka.app/blockchain           → Blockchain (Sprint 18)
```

---

## React Router Structure

```
/                               → redirect to /configurations/market-data (if authed)
                                  or / landing page (if not authed)
/login                          → LoginPage
/configurations/*               → ConfigurationsLayout (CfgNav)
  /configurations/market-data/* → MarketDataLayout (MdNav)
    /curves
    /surfaces
    /fixings
    /snap
    /snapshots
  /configurations/org-hierarchy → OrgHierarchy (Sprint 2 Day 4)
  /configurations/onboarding    → stub (Sprint 7)
  /configurations/market-risk   → stub (Sprint 10)
  /configurations/ccr           → stub (Sprint 14)
  /configurations/methodology   → stub (Sprint 19)
/pricer                         → stub (Sprint 5)
/pnl                            → stub (Sprint 11)
/market-risk                    → stub (Sprint 10)
/ccr                            → stub (Sprint 14)
/simm                           → stub (Sprint 16)
/blockchain                     → stub (Sprint 18)
```

---

## RBAC — Role Definitions

```python
class Role(str, Enum):
    TRADER    = "trader"     # read-only, own trades only
    RISK      = "risk"       # read + run risk engines, all trades
    XVA       = "xva"        # read + run XVA, all trades
    ADMIN     = "admin"      # full access including user management
    READ_ONLY = "read_only"  # all tabs visible, no actions
```

### Permissions Matrix

```
Action                      TRADER  RISK  XVA   ADMIN  READ_ONLY
────────────────────────────────────────────────────────────────
View market data              ✓      ✓     ✓     ✓      ✓
Edit curve quotes             ✗      ✓     ✗     ✓      ✗
Commit snapshot               ✗      ✓     ✗     ✓      ✗
Update funding spreads        ✗      ✓     ✓     ✓      ✗
Run VaR / stress              ✗      ✓     ✗     ✓      ✗
Run XVA                       ✗      ✗     ✓     ✓      ✗
Run SIMM                      ✗      ✓     ✓     ✓      ✗
Manage org / entities         ✗      ✗     ✗     ✓      ✗
Enter trades                  ✓      ✓     ✓     ✓      ✗
Amend own trades              ✓      ✓     ✓     ✓      ✗
Amend any trade               ✗      ✗     ✗     ✓      ✗
Novate / terminate trade      ✗      ✓     ✗     ✓      ✗
View own trades               ✓      ✓     ✓     ✓      ✓
View all trades               ✗      ✓     ✓     ✓      ✓
View PnL (own trades)         ✓      ✓     ✓     ✓      ✓
View PnL (all trades)         ✗      ✓     ✓     ✓      ✓
```

---

## Core Database Schema

### Curve Tables

```sql
CREATE TABLE curve_definitions (
    id                TEXT PRIMARY KEY,
    ccy               TEXT NOT NULL,
    curve_class       TEXT NOT NULL,  -- 'OIS'|'BASIS'|'XCCY_BASIS'|'FUNDING'
    full_name         TEXT NOT NULL,
    ql_index_class    TEXT,
    day_count         TEXT,
    calendar          TEXT,
    settlement_days   INT,
    payment_lag       INT,
    telescopic        BOOLEAN,
    default_interp    TEXT DEFAULT 'LogLinearDiscount',
    base_curve_id     TEXT REFERENCES curve_definitions(id),
    parent_curve_ids  TEXT[],
    spread_mode       TEXT DEFAULT 'term',
    is_active         BOOLEAN DEFAULT TRUE,
    sprint_available  INT DEFAULT 1
);

CREATE TABLE working_funding_spreads (
    curve_id          TEXT PRIMARY KEY REFERENCES curve_definitions(id),
    spread_mode       TEXT NOT NULL DEFAULT 'term',
    spreads_json      JSONB NOT NULL,
    flat_spread_bp    NUMERIC(8,2),
    source            TEXT DEFAULT 'manual',
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_by        TEXT  -- user_id
);
```

### Organisation Tables

```sql
CREATE TABLE org_nodes (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id   TEXT REFERENCES org_nodes(id),
    name        TEXT NOT NULL,
    node_type   TEXT NOT NULL,  -- 'firm'|'division'|'desk'|'sub_desk'|'custom'
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    created_by  TEXT  -- user_id
);

CREATE TABLE legal_entities (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    lei               TEXT UNIQUE NOT NULL,  -- 20-char ISO 17442
    name              TEXT NOT NULL,
    short_name        TEXT,
    home_currency     TEXT NOT NULL,
    jurisdiction      TEXT NOT NULL,
    regulatory_regime TEXT[],               -- ['BCBS_IOSCO','CFTC','EMIR']
    simm_version      TEXT DEFAULT 'v2.6',
    im_threshold_m    NUMERIC(12,2),
    ois_curve_id      TEXT REFERENCES curve_definitions(id),
    is_own_entity     BOOLEAN DEFAULT FALSE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE counterparties (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    legal_entity_id   TEXT NOT NULL REFERENCES legal_entities(id),
    name              TEXT NOT NULL,
    isda_agreement    TEXT,
    csa_type          TEXT,               -- 'VM_ONLY'|'VM_IM'|'NO_CSA'
    csa_currency      TEXT,
    csa_threshold_m   NUMERIC(12,2),
    csa_mta_k         NUMERIC(12,2),
    discount_curve_id TEXT REFERENCES curve_definitions(id),
    im_model          TEXT DEFAULT 'SIMM',
    is_active         BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Trade Tables

```sql
-- Master trade record — IMMUTABLE after insert
-- All changes go through trade_events
CREATE TABLE trades (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    trade_ref           TEXT UNIQUE NOT NULL,     -- human-readable ref
    instrument_type     TEXT NOT NULL,            -- 'IRS'|'CDS'|'FXF'|etc.
    counterparty_id     TEXT REFERENCES counterparties(id),
    desk_id             TEXT REFERENCES org_nodes(id),
    trader_id           TEXT NOT NULL,            -- user_id of entering trader
    notional            NUMERIC(20,2),
    notional_currency   TEXT,
    trade_date          DATE NOT NULL,
    effective_date      DATE,
    maturity_date       DATE,
    status              TEXT DEFAULT 'active',    -- 'active'|'terminated'|'novated'
    trade_json          JSONB NOT NULL,           -- full trade economics
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    created_by          TEXT NOT NULL             -- user_id
);

-- Trade lifecycle events — append-only audit trail
CREATE TABLE trade_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    trade_id        TEXT NOT NULL REFERENCES trades(id),
    event_type      TEXT NOT NULL,  -- 'AMEND'|'NOVATION'|'TERMINATION'|'ADDON'
    event_date      DATE NOT NULL,
    effective_date  DATE,
    user_id         TEXT NOT NULL,
    desk_id         TEXT REFERENCES org_nodes(id),
    -- for AMEND: what changed
    previous_json   JSONB,
    new_json        JSONB,
    -- for NOVATION: new counterparty
    new_counterparty_id TEXT REFERENCES counterparties(id),
    -- for TERMINATION/ADDON
    notional_change NUMERIC(20,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PnL attribution — trade-level atomic unit
-- All desk/trader/counterparty views aggregate from here
CREATE TABLE trade_pnl (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    trade_id        TEXT NOT NULL REFERENCES trades(id),
    pnl_date        DATE NOT NULL,
    desk_id         TEXT REFERENCES org_nodes(id),
    trader_id       TEXT NOT NULL,
    counterparty_id TEXT REFERENCES counterparties(id),
    -- PnL components
    total_pnl       NUMERIC(20,4),
    delta_pnl       NUMERIC(20,4),
    gamma_pnl       NUMERIC(20,4),
    vega_pnl        NUMERIC(20,4),
    theta_pnl       NUMERIC(20,4),
    rho_pnl         NUMERIC(20,4),
    fx_pnl          NUMERIC(20,4),
    residual_pnl    NUMERIC(20,4),
    -- Attribution flags
    is_new_trade    BOOLEAN DEFAULT FALSE,
    is_eod          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (trade_id, pnl_date)
);
```

### Auth Tables

```sql
CREATE TABLE users (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username        TEXT UNIQUE NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role            TEXT NOT NULL,      -- Role enum
    legal_entity_id TEXT REFERENCES legal_entities(id),
    desk_id         TEXT REFERENCES org_nodes(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Curve Class Architecture

```
CurveClass.OIS        → independent, bootstrapped first
CurveClass.BASIS      → depends on OIS (base_curve_id FK)
CurveClass.XCCY_BASIS → depends on domestic OIS + USD_SOFR + FX spot
CurveClass.FUNDING    → depends on OIS, NOT bootstrapped (additive spread)
```

Bootstrap order via topological sort (CurveBootstrapScheduler):
```
Pass 1: OIS    (13 curves)
Pass 2: Basis  (22 curves)
Pass 3: XCCY   (12 curves)
Pass 4: Funding (7 curves — spread application only)
```

---

## CSA → Discount Curve Mapping

```python
CSA_DISCOUNT_MAP = {
    'USD': 'USD_SOFR',
    'EUR': 'EUR_ESTR',
    'GBP': 'GBP_SONIA',
    'JPY': 'JPY_TONAR',
    'CHF': 'CHF_SARON',
    'AUD': 'AUD_AONIA',
    'CAD': 'CAD_CORRA',
}
# Cross-currency CSA: handled Sprint 13
```

---

## Sprint Roadmap

```
Sprint 1  ✅  Market data workspace HTML prototype (54 curves)
Sprint 2  🔄  React+Vite · FastAPI · Org · Legal Entity · Counterparty · JWT · Landing page
Sprint 3      QuantLib bootstrap · Bloomberg adapter · Free API adapters · History tab
Sprint 4      Trade entry (pricer stub) · Portfolio save · Trade blotter
Sprint 5      Pricer — IRS, CDS, FX Forward full valuation
Sprint 6      XCCY bootstrap · FX surface
Sprint 7      Onboarding workflow
Sprint 8      VaR (historical simulation)
Sprint 9      Stress testing
Sprint 10     Market risk dashboard
Sprint 11     PnL attribution — trade/desk/trader/counterparty views
Sprint 12     XVA engines (CVA, DVA, FVA, ColVA, MVA)
Sprint 13     Multi-currency CSA · KVA
Sprint 14     CCR — netting, exposure simulation
Sprint 15     ISDA SIMM sensitivity calculation
Sprint 16     ISDA SIMM IM calculation + margin call workflow
Sprint 17     Reporting — PDF/Excel export
Sprint 18     On-chain trade confirmation
Sprint 19     Methodology viewer + model validation dashboard
```

---

## API Endpoint Naming Convention

All endpoints follow ISDA SIMM naming. Pattern:
```
/api/{domain}/{resource}
/api/curves/rates
/api/curves/funding/spreads
/api/org/nodes
/api/trades
/api/trades/{id}/events
/api/pnl/trade/{trade_id}
/api/pnl/desk/{desk_id}
/api/pnl/trader/{user_id}
/api/pnl/counterparty/{counterparty_id}
/auth/login
/auth/refresh
```

---

## JWT Token Structure

```python
class JWTPayload(BaseModel):
    sub: str          # user_id
    role: Role
    entity_id: str    # legal entity this user belongs to
    desk_id: str      # desk this user belongs to
    iat: int
    exp: int

ACCESS_TOKEN_EXPIRE_MINUTES = 480   # 8 hours (trading day)
REFRESH_TOKEN_EXPIRE_DAYS   = 30
# Store in memory — never localStorage (XSS prevention)
```

---

## Methodology Document

`docs/Rijeka_Methodology_v1.1.pdf` — quantitative methodology.
Every feature has a corresponding methodology section.
Code without documentation = not production-ready.
Next update: v1.2 at Sprint 2 completion.

---

*Rijeka — Croatian for "river". Risk flows through it.*
*Architecture v6 — updated Sprint 2 Day 1 (2026-03-25)*
