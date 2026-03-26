# Rijeka — Sprint 2 Day 4 Complete
> Start every new chat session by reading this document first.
> Every file delivered = complete replacement. Never patch. Never append.
> Every file is delivered as a Node.js script. Copy to Rijeka root, run with full path.
> Never run commands from C:\Users\mikod — always cd to Rijeka first or use full path.
> End of every sprint: git add . && git commit -m "Sprint X complete" && git push

---

## Project

Rijeka — open-source full revaluation derivatives risk system.
Pure risk analytics: market risk, CCR, XVA, ISDA SIMM, on-chain confirmation.
ISDA SIMM v2.6 naming conventions used throughout.
Croatian/Serbian/Bosnian word for "river" — named after Miko's village in Bosnia.

---

## Infrastructure (locked — do not change)

| Service   | Purpose                        | Account        | URL |
|-----------|-------------------------------|----------------|-----|
| Netlify   | Landing page (static)          | MikoDevedzic   | rijeka.app |
| Netlify   | React app (future)             | MikoDevedzic   | app.rijeka.app (Day 7) |
| Render    | Backend FastAPI                | MikoDevedzic   | Day 6 |
| Supabase  | Postgres + Auth                | MikoDevedzic   | https://upuewetohnocfshkhafg.supabase.co |
| GitHub    | Monorepo source control        | MikoDevedzic   | see below |
| Namecheap | Domain registrar               | mikod7         | rijeka.app |

**GitHub repo:**
`https://github.com/MikoDevedzic/open-source-cross-asset-pricing-and-risk-platform`

**Local path (Windows):**
`C:\Users\mikod\OneDrive\Desktop\Rijeka\`

**Monorepo structure:**
```
Rijeka\
├── frontend\
│   ├── .env                          ← Supabase keys (never commit)
│   └── src\
│       ├── App.jsx                   ← full router + auth guard + OrgHierarchy wired ✅
│       ├── index.css                 ← all design tokens + Sprint 2 styles ✅
│       ├── lib\
│       │   └── supabase.js           ← Supabase client (sessionStorage) ✅
│       ├── data\
│       │   └── ratesCurves.js        ← 54 curves + CCY_GROUPS + helpers ✅
│       ├── store\
│       │   ├── useMarketDataStore.js ← Zustand store ✅
│       │   └── useAuthStore.js       ← auth + profile + trader ID ✅
│       └── components\
│           ├── layout\               ← AppBar, CfgNav, MdNav, StubPage ✅
│           ├── auth\                 ← LoginPage, SignupPage, ConfirmPage, AuthGuard ✅
│           ├── CommandCenter.jsx     ← matrix rain + boot sequence + tiles ✅
│           ├── market-data\          ← full curves workspace ✅
│           └── org\
│               └── OrgHierarchy.jsx  ← collapsible tree, Supabase wired ✅
├── backend\                          ← FastAPI (Day 6)
├── landing\                          ← Static marketing site
│   └── index.html                    ← rijeka.app ✅ LIVE (new About version ready to deploy)
└── docs\                             ← methodology PDF/LaTeX
```

---

## Supabase (live, configured)

**Project URL:** `https://upuewetohnocfshkhafg.supabase.co`
**Publishable key:** `sb_publishable_jfdfyrFFT5BF2js3cFXJ8A_PH2o3jEa`

**Tables live:**
- `profiles` — id (UUID FK auth.users), trader_id (TEXT UNIQUE), role (TEXT), created_at
- `org_nodes` — id, parent_id, name, node_type, is_active, sort_order, created_at, created_by

**Triggers live:**
- `on_auth_user_created` → `handle_new_user()` — auto-generates trader ID from email

**RLS:**
- `profiles` — RLS disabled (trigger is SECURITY DEFINER)
- `org_nodes` — RLS enabled, authenticated users can read/insert/update

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

## File Delivery Rules (critical)

1. **Complete replacement files only** — never patches, never manual edits
2. **Node.js scripts for all file delivery** — not PowerShell (quote escaping issues)
3. **Always deliver script as download, then:**
   ```cmd
   copy C:\Users\mikod\Downloads\script_name.js C:\Users\mikod\OneDrive\Desktop\Rijeka\script_name.js
   node C:\Users\mikod\OneDrive\Desktop\Rijeka\script_name.js
   ```
4. **Never tell user to run `node script.js` without full path** — they may be in wrong directory
5. **Never ask user to scroll, find text, or edit manually**
6. New session: read handoff first, then ARCHITECTURE_v7.md

---

## Dev Commands

```cmd
# Start frontend (run in its own terminal tab — keep running)
cd C:\Users\mikod\OneDrive\Desktop\Rijeka\frontend
npm run dev
# → http://localhost:5173

# Run a delivery script (always use full path)
node C:\Users\mikod\OneDrive\Desktop\Rijeka\script_name.js

# Push to GitHub
cd C:\Users\mikod\OneDrive\Desktop\Rijeka
git add .
git commit -m "message"
git push
```

---

## Live URLs

| URL | Status |
|-----|--------|
| `rijeka.app` | ✅ Live (old landing) |
| `localhost:5173` | ✅ Running locally |
| `app.rijeka.app` | ⏳ Day 7 |

---

## Auth Flow (fully working locally)

```
rijeka.app → "Request Early Access"
    ↓
localhost:5173/signup → email + password → typewriter handle preview
    ↓
Email confirmation → localhost:5173/confirm → handle reveal → "Welcome to the river."
    ↓
localhost:5173/command-center → matrix rain → RIJEKA boot → "Welcome, MIKO.DEVEDZIC."
    ↓
Module tiles → MARKET DATA → /configurations/market-data/curves
              → ORG HIERARCHY → /configurations/org-hierarchy
```

---

## Sprint 2 Progress

### Day 1 ✅ COMPLETE
- React + Vite, dependencies, CSS tokens, router, layout components

### Day 2 ✅ COMPLETE
- 54 curves, Zustand store, full curves workspace

### Day 3 ✅ COMPLETE
- Supabase auth, profiles table, trader ID trigger
- LoginPage, SignupPage, ConfirmPage, AuthGuard, CommandCenter

### Day 4 ✅ COMPLETE
- `org_nodes` table in Supabase (id, parent_id, name, node_type, is_active, sort_order, created_at, created_by)
- `OrgHierarchy.jsx` — full collapsible tree wired to Supabase
- Test firm structure built: RIJEKA TEST FIRM → GLOBAL MARKETS → XVA DESK → RISK MANAGEMENT
- `App.jsx` updated — OrgHierarchy wired to `/configurations/org-hierarchy` route

**OrgHierarchy features:**
- Collapsible tree: FIRM → DIV → DESK → SUB → CUST
- Node type border colors: accent / blue / amber / purple
- Double-click inline rename (persists to Supabase)
- `+ DIV` / `+ DESK` etc. inline add row with dashed border
- Deactivate (soft delete) — cascades to all descendants
- Inactive nodes hidden by default — `SHOW INACTIVE (n)` toggle in control bar
- Hard DELETE button on inactive nodes with no children
- Drag-drop reorder within sibling groups (persists sort_order to Supabase)

**DELETE guard (current vs future):**
- Currently: DELETE allowed on any inactive node with no org children
- Sprint 4: add guard — check `trades.desk_id` FK before allowing DELETE
  - If trades reference the desk → block DELETE, keep as inactive (audit trail)
  - If no trades → allow hard delete as now

---

### Day 5 — NEXT: Legal Entity + Counterparty Master

**Route:** `/configurations/onboarding` (or split into two sub-routes)

**Legal Entity fields:**
```
lei               TEXT UNIQUE NOT NULL       ← LEI code
name              TEXT NOT NULL
short_name        TEXT
home_currency     TEXT NOT NULL
jurisdiction      TEXT NOT NULL
regulatory_regime TEXT[]
simm_version      TEXT DEFAULT 'v2.6'
im_threshold_m    NUMERIC(12,2)
ois_curve_id      TEXT → curve_definitions
is_own_entity     BOOLEAN DEFAULT FALSE
is_active         BOOLEAN DEFAULT TRUE
```

**Counterparty fields:**
```
legal_entity_id   TEXT → legal_entities
name              TEXT NOT NULL
isda_agreement    TEXT
csa_type          TEXT  -- 'VM_ONLY'|'VM_IM'|'NO_CSA'
csa_currency      TEXT
csa_threshold_m   NUMERIC(12,2)
csa_mta_k         NUMERIC(12,2)
discount_curve_id TEXT → curve_definitions   ← auto-mapped from CSA_DISCOUNT_MAP
im_model          TEXT DEFAULT 'SIMM'
is_active         BOOLEAN DEFAULT TRUE
```

**CSA → Discount curve auto-mapping:**
```python
CSA_DISCOUNT_MAP = {
    'USD': 'USD_SOFR', 'EUR': 'EUR_ESTR', 'GBP': 'GBP_SONIA',
    'JPY': 'JPY_TONAR', 'CHF': 'CHF_SARON', 'AUD': 'AUD_AONIA', 'CAD': 'CAD_CORRA'
}
```

**UI pattern:** same terminal aesthetic as OrgHierarchy — table list + inline add form.

---

### Day 6 — FastAPI Backend

**Location:** `C:\Users\mikod\OneDrive\Desktop\Rijeka\backend\`

**Key endpoints:**
- `GET  /api/curves/rates`
- `POST /api/curves/rates/bootstrap` — 501 stub (Sprint 3)
- `GET/PUT /api/curves/funding/spreads`
- `POST /auth/login` → JWT
- `GET/POST/PUT /api/org/nodes`
- `GET/POST/PUT /api/legal-entities`
- `GET/POST/PUT /api/counterparties`

**Deploy:** Render, auto-deploy from `backend/` on GitHub push.

---

### Day 7 — Deploy to app.rijeka.app

- Create Netlify site from `frontend/`
- Set custom domain: `app.rijeka.app`
- Update Supabase redirect URLs
- Deploy new `landing/index.html`

---

## Test Firm Structure (in Supabase org_nodes)

```
RIJEKA TEST FIRM                    (firm)
├── GLOBAL MARKETS                  (division)
│   ├── FX TRADING                  (desk)
│   │   ├── G10 FX                  (sub-desk)
│   │   └── EM FX                   (sub-desk)
│   ├── RATES TRADING               (desk)
│   │   ├── G10 RATES               (sub-desk)
│   │   └── EM RATES                (sub-desk)
│   ├── CREDIT TRADING              (desk)
│   │   ├── INVESTMENT GRADE        (sub-desk)
│   │   └── HIGH YIELD              (sub-desk)
│   ├── COMMODITIES TRADING         (desk)
│   │   ├── ENERGY                  (sub-desk)
│   │   └── METALS                  (sub-desk)
│   └── EQUITY DERIVATIVES          (desk)
│       ├── SINGLE STOCK            (sub-desk)
│       └── INDEX & VOLATILITY      (sub-desk)
├── XVA DESK                        (division)
│   ├── CVA/DVA                     (desk)
│   ├── FVA & COLVA                 (desk)
│   ├── MVA                         (desk)
│   └── KVA                         (desk)
└── RISK MANAGEMENT                 (division)
    ├── MARKET RISK                 (desk)
    ├── CCR                         (desk)
    └── MODEL RISK                  (desk)
```

---

## Curve Bootstrap Order (never change)

```
Pass 1: OIS        → independent, bootstrapped first
Pass 2: Basis      → depends on OIS (base_curve_id FK)
Pass 3: XCCY       → depends on domestic OIS + USD_SOFR + FX spot
Pass 4: Funding    → depends on OIS, additive spread (no bootstrap)
```

---

## Architecture Notes

**Auth:** Supabase JS client in frontend — no backend needed for auth.
Tokens in sessionStorage (not localStorage — XSS prevention). 8h access / 30d refresh.
Trader ID immutable after creation. READ_ONLY role for all early access users.

**Org nodes:** `sort_order` column added (not in original architecture schema — additive, safe).
Hard delete blocked on nodes with children. Sprint 4: also block if `trades.desk_id` references node.

**Two Netlify sites:**
- `fantastic-khapse-cffe0d` → `rijeka.app` — static landing
- New site (Day 7) → `app.rijeka.app` — React app

---

## About / Landing Page Copy (approved)

*Rijeka* means "river" in the languages of the former Yugoslavia.
Named after Miko's village in Bosnia. Open-source, full-revaluation derivatives risk.
Built for the curious, the self-taught, anyone who wants to understand how these systems work.

— Miko Devedzic · linkedin.com/in/mikodevedzic · hello@rijeka.app

---

*Sprint 1 complete: 2025-01-15*
*Sprint 2 Day 1 complete: 2026-03-25*
*Sprint 2 Day 2 complete: 2026-03-25*
*Sprint 2 Day 3 complete: 2026-03-26*
*Sprint 2 Day 4 complete: 2026-03-26*
*Rijeka — Croatian/Serbian/Bosnian for "river". Risk flows through it.*
