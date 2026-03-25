import { create } from 'zustand';
import { RATES_CURVES, CCY_GROUPS, getCurve } from '../data/ratesCurves';

// Deep-clone instruments so quote edits don't mutate the module-level array
const cloneInstruments = (curves) =>
  curves.map((c) => ({
    ...c,
    instruments: c.instruments ? c.instruments.map((i) => ({ ...i })) : undefined,
    spreads: c.spreads ? { ...c.spreads } : undefined,
  }));

const initialCurves = cloneInstruments(RATES_CURVES);

// Build initial openGroups — all groups open
const initialOpenGroups = {};
CCY_GROUPS.forEach((g) => { initialOpenGroups[g.ccy] = true; });

const useMarketDataStore = create((set, get) => ({
  // ── Curve data (mutable copies) ─────────────────────────
  curves: initialCurves,

  // ── Curves workspace state ───────────────────────────────
  selectedCurveId: null,
  innerTab: 'def',
  typeFilter: 'all',
  openGroups: initialOpenGroups,
  curveInterp: {},       // { [curveId]: interpId }
  fundingMode: {},       // { [curveId]: 'flat' | 'term' }

  // ── Actions ──────────────────────────────────────────────
  selectCurve: (id) => set({ selectedCurveId: id, innerTab: 'def' }),

  setInnerTab: (tab) => set({ innerTab: tab }),

  setTypeFilter: (f) => set({ typeFilter: f }),

  toggleGroup: (ccy) =>
    set((s) => ({
      openGroups: { ...s.openGroups, [ccy]: !s.openGroups[ccy] },
    })),

  setInterp: (curveId, interpId) =>
    set((s) => ({ curveInterp: { ...s.curveInterp, [curveId]: interpId } })),

  setFundingMode: (curveId, mode) =>
    set((s) => ({ fundingMode: { ...s.fundingMode, [curveId]: mode } })),

  // Toggle instrument enabled state
  toggleInstrument: (curveId, idx, enabled) =>
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id !== curveId
          ? c
          : {
              ...c,
              instruments: c.instruments.map((inst, i) =>
                i === idx ? { ...inst, en: enabled } : inst
              ),
            }
      ),
    })),

  // Update a single instrument quote
  updateQuote: (curveId, idx, value) => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id !== curveId
          ? c
          : {
              ...c,
              instruments: c.instruments.map((inst, i) =>
                i === idx ? { ...inst, quote: v } : inst
              ),
            }
      ),
    }));
  },

  // Update a funding spread at a specific tenor key
  updateSpread: (curveId, key, value) => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id !== curveId ? c : { ...c, spreads: { ...c.spreads, [key]: v } }
      ),
    }));
  },

  // Apply flat spread to all tenors for a funding curve
  applyFlatSpread: (curveId, value) => {
    const v = parseFloat(value);
    if (isNaN(v)) return;
    set((s) => ({
      curves: s.curves.map((c) => {
        if (c.id !== curveId) return c;
        const newSpreads = {};
        Object.keys(c.spreads).forEach((k) => { newSpreads[k] = v; });
        return { ...c, spreads: newSpreads };
      }),
    }));
  },

  // Reset a funding curve spreads to original defaults
  resetSpreads: (curveId) => {
    const original = getCurve(curveId);
    if (!original?.spreads) return;
    set((s) => ({
      curves: s.curves.map((c) =>
        c.id !== curveId ? c : { ...c, spreads: { ...original.spreads } }
      ),
    }));
  },

  // Computed helper — get a curve from the mutable copy
  getCurveById: (id) => get().curves.find((c) => c.id === id),
}));

export default useMarketDataStore;
