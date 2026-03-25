# Rijeka — Sprint 2 Day 2 Complete
> Start every new chat session by reading this document first.
> Every file delivered = complete replacement. Never patch. Never append.
> End of every sprint: git add . && git commit -m "Sprint X complete" && git push

---

## Project

Rijeka — open-source full revaluation derivatives risk system.
Pure risk analytics: market risk, CCR, XVA, ISDA SIMM, on-chain confirmation.
ISDA SIMM v2.6 naming conventions used throughout.

---

## Infrastructure (locked — do not change)

| Service   | Purpose                        | Account        | URL |
|-----------|-------------------------------|----------------|-----|
| Netlify   | Landing page (static)          | MikoDevedzic   | rijeka.app |
| Netlify   | React app (future)             | MikoDevedzic   | app.rijeka.app (not yet deployed) |
| Render    | Backend FastAPI                | MikoDevedzic   | (Day 3) |
| Supabase  | Postgres + Auth                | MikoDevedzic   | (Day 6) |
| GitHub    | Monorepo source control        | MikoDevedzic   | see below |
| Namecheap | Domain registrar               | mikod7         | rijeka.app |

**GitHub repo:**
`https://github.com/MikoDevedzic/open-source-cross-asset-pricing-and-risk-platform`

**Local path (Windows):**
`C:\Users\mikod\OneDrive\Desktop\Rijeka\`

**Monorepo structure:**
```
Rijeka\
├── frontend\                   ← React + Vite (Sprint 2 active)
│   └── src\
│       ├── App.jsx             ← full router tree ✅
│       ├── index.css           ← all design tokens + Sprint 2 styles ✅
│       ├── data\
│       │   └── ratesCurves.js  ← 54 curves + CCY_GROUPS + helpers ✅
│       ├── store\
│       │   └── useMarketDataStore.js ← Zustand store ✅
│       └── components\
│           ├── layout\         ← AppBar, CfgNav, MdNav, StubPage ✅
│           └── market-data\    ← full curves workspace ✅
├── backend\                    ← FastAPI (Day 3)
├── landing\                    ← Static marketing site
│   ├── index.html              ← rijeka.app landing page ✅ LIVE
│   └── command-center.html     ← matrix rain boot + command center ✅ LIVE
├── docs\                       ← methodology PDF/LaTeX
├── sprint 1 Market Data\       ← reference only
└── sprint 2\                   ← reference only
```

**Database:** Supabase Postgres from day one. No SQLite. No migration needed later.

---

## Design Invariants (never change)

```
--bg:        #060a0e
--bg-deep:   #03060a
--panel:     #0b1219
--panel-2:   #0f1820
--panel-3:   #141f28
--accent:    #0ec9a0
--amber:     #e8a020
--blue:      #3d8bc8
--purple:    #9060cc
--red:       #d95040
--mono:      JetBrains Mono
```

Dark terminal aesthetic. Every component uses CSS variables — no hardcoded hex values.
ISDA SIMM naming on every variable, endpoint, and column.
3-store separation: History / Production / Working — never overlap.
Immutability enforced at DB level.
`firm_spread(t)` is single source of truth for FVA/ColVA/MVA.

---

## Live URLs

| URL | What it is | Status |
|-----|-----------|--------|
| `rijeka.app` | Landing page | ✅ Live |
| `rijeka.app/command-center.html` | Matrix rain boot + command center | ✅ Live |
| `app.rijeka.app` | React trading platform | ⏳ Day 3+ |

**Netlify deploy method for landing:** Drag and drop `landing\` folder into the
`rijeka.app` Netlify project drop zone (project name: fantastic-khapse-cffe0d).
NOT the GitHub-connected `rijeka-landing` project — that one is broken/unused.

---

## Sprint 2 Progress

### Day 1 ✅ COMPLETE
- React + Vite project in `frontend/`
- Dependencies: react-router-dom, zustand, axios, tailwindcss, @dnd-kit
- CSS design tokens in `src/index.css`
- Full React Router tree in `src/App.jsx`
- AppBar, CfgNav, MdNav, StubPage layout components
- Pushed to GitHub

### Day 2 ✅ COMPLETE

**React curves workspace — all files built and in repo:**
- `src/data/ratesCurves.js` — 54 curves, CCY_GROUPS, INTERP_METHODS, FIXINGS, BBG_MAP, helpers
- `src/store/useMarketDataStore.js` — Zustand store, mutable curve copies, all actions
- `src/App.jsx` — full router with CurvesWorkspace wired, AC nav uses NavLink
- `src/index.css` — complete replacement with all Day 1 + Day 2 CSS
- `src/components/market-data/CurvesWorkspace.jsx` — sidebar + main split
- `src/components/market-data/CurvesSidebar.jsx` — search, filter, collapsible CCY groups
- `src/components/market-data/CurveDetail.jsx` — dispatcher by curve_class
- `src/components/market-data/_DetailShared.jsx` — InnerTabs, InnerBody, ParamGrid, etc.
- `src/components/market-data/OISDetail.jsx` — header, def, instruments, bootstrap, sparkline
- `src/components/market-data/BasisDetail.jsx` — header, def, instruments, bootstrap
- `src/components/market-data/XCCYDetail.jsx` — header, def, instruments (Sprint 6 stub)
- `src/components/market-data/FundingDetail.jsx` — header, def, spreads editor, preview

**Landing + Command Center built and live:**
- `landing/index.html` — rijeka.app public landing page
- `landing/command-center.html` — matrix math rain (Greek, formula atoms, SABR, financial numbers) + boot sequence + command center tiles
- Boot sound: synthesized chord (sub bass → harmonics → D maj resolution)
- Command center: 8 module tiles, clean minimal design, math rain running behind glass
- RIJEKA wordmark in topbar always returns to command center
- Boot welcome currently says "Welcome to the river." — **update to "Welcome, [TRADER_ID]." in Day 6 when Supabase Auth is wired**

---

### Day 3 — FastAPI Backend (NEXT)

```bash
# Location: C:\Users\mikod\OneDrive\Desktop\Rijeka\backend\
pip install fastapi uvicorn sqlalchemy alembic python-jose[cryptography] passlib psycopg2-binary
```

**Key endpoints:**
- `GET  /api/curves/rates` — returns 54 CurveDefinition objects
- `POST /api/curves/rates/bootstrap` — 501 stub (wired Sprint 3)
- `GET/PUT /api/curves/funding/spreads`
- `POST /auth/login` → JWT token
- `GET/POST/PUT /api/org/nodes`
- `GET/POST/PUT /api/legal-entities`
- `GET/POST/PUT /api/counterparties`

**DB connection:** Supabase Postgres (connection string from Supabase dashboard → Settings → Database)

---

### Day 4 — Org Hierarchy

```sql
CREATE TABLE org_nodes (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    parent_id   TEXT REFERENCES org_nodes(id),
    name        TEXT NOT NULL,
    node_type   TEXT NOT NULL,  -- 'firm'|'division'|'desk'|'sub_desk'|'custom'
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

UI: collapsible tree, add/rename/deactivate nodes, drag-drop reorder.
Node type border colours: Firm=accent, Division=blue, Desk=amber, Sub-desk=purple.

---

### Day 5 — Legal Entity + Counterparty Master

**CSA → Discount curve auto-mapping:**
```python
CSA_DISCOUNT_MAP = {
    'USD': 'USD_SOFR', 'EUR': 'EUR_ESTR', 'GBP': 'GBP_SONIA',
    'JPY': 'JPY_TONAR', 'CHF': 'CHF_SARON', 'AUD': 'AUD_AONIA', 'CAD': 'CAD_CORRA'
}
```

---

### Day 6 — Supabase Auth + JWT + RBAC + Trader ID

**This is the big day for the public experience.**

**Auth flow:**
1. User hits `rijeka.app` → clicks "Request Early Access"
2. Signup page (`rijeka.app/login`) → email + password → Supabase creates account
3. Trader ID generated from email: `miko.devedzic@gmail.com` → `MIKO.DEVEDZIC`
   - Strip domain, uppercase, keep dot separator
   - On collision append `_2`, `_3` etc.
4. Trader ID shown immediately on confirmation screen
5. Login → boot sequence plays → "Welcome, MIKO.DEVEDZIC." → command center
6. Early access users get `READ_ONLY` role — see everything, no write actions

**Supabase profiles table:**
```sql
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id),
    trader_id   TEXT UNIQUE NOT NULL,
    role        TEXT NOT NULL DEFAULT 'read_only',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Roles:**
```python
class Role(str, Enum):
    TRADER    = "trader"     # read-only, own trades only
    RISK      = "risk"       # read + run risk engines
    XVA       = "xva"        # read + run XVA
    ADMIN     = "admin"      # full access
    READ_ONLY = "read_only"  # all tabs, no actions (early access)
```

Token: 8h access, 30d refresh. Store in memory (not localStorage).

**Command center update in Day 6:**
- Replace hardcoded `const TRADER_ID = 'MIKO.DEVEDZIC'` with value from Supabase session
- Boot welcome: "Welcome, [TRADER_ID]." — personal, memorable, iPhone moment
- Port command-center from standalone HTML into React component

---

### Day 7 — FundingSpreadEditor wired to API

### Day 8 — Integration testing + Sprint 3 handoff

---

## Curve Bootstrap Order (never change)

```
Pass 1: OIS        → independent, bootstrapped first
Pass 2: Basis      → depends on OIS (base_curve_id FK)
Pass 3: XCCY       → depends on domestic OIS + USD_SOFR + FX spot
Pass 4: Funding    → depends on OIS, additive spread (no bootstrap)
```

---

## Dev Commands

```cmd
# Start frontend
cd C:\Users\mikod\OneDrive\Desktop\Rijeka\frontend
npm run dev
# → http://localhost:5173

# Push to GitHub
cd C:\Users\mikod\OneDrive\Desktop\Rijeka
git add .
git commit -m "message"
git push

# Deploy landing page — drag landing\ folder into Netlify drop zone
# Project: fantastic-khapse-cffe0d (rijeka.app)
# URL: app.netlify.com/projects/fantastic-khapse-cffe0d/overview
```

---

## Architecture Notes (updated Sprint 2 Day 2)

**Two Netlify sites:**
- `fantastic-khapse-cffe0d` → `rijeka.app` — static landing, drag-and-drop deploy
- Future: second Netlify site for React app → `app.rijeka.app`

**DNS:** Namecheap Advanced DNS for rijeka.app already correctly configured:
- A Record `@` → `75.2.60.5`
- CNAME `www` → `apex-loadbalancer.netlify.com`

**Trader ID system:**
- Email is the seed for trader ID — permanent identity across the platform
- Format: `firstname.lastname` (uppercase) derived from email local-part
- Used as: display name, future trade booking identifier, audit trail actor
- Generated at signup, stored in `profiles.trader_id`, immutable after creation

---

## Sprint 3 Preview

- Three-store DB schema with immutability trigger
- Bloomberg DAPI adapter
- FRED / ECB / BOE free API adapters
- Real QuantLib OIS + Basis bootstrap
- History tab UI: coverage heatmap + import + gaps + audit

---

## File Delivery Rules (for Claude — read every session)

1. Always deliver **complete replacement files** — never patches, never appends
2. Always produce a new complete `index.css` when CSS changes are needed
3. Always produce a new complete `App.jsx` when routing changes are needed
4. End of every sprint: `git add . && git commit -m "Sprint X complete" && git push`
5. New session starts by reading this handoff document first, before any code

---

*Sprint 1 complete: 2025-01-15*
*Sprint 2 Day 1 complete: 2026-03-25*
*Sprint 2 Day 2 complete: 2026-03-25*
*Rijeka — Croatian for "river". Risk flows through it.*
