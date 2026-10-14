import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payrollService, statutoryService } from '../../services/hr.service';
import { idempotencyHeaders } from '../../services/apiHelpers';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return {
    message: e?.message || fallback,
    code: e?.code,
    details: e?.details || [],
    status: err.response?.status,
  };
};

const listThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (params, { rejectWithValue }) => {
    try {
      const res = await call(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const res = await call(arg);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

// ─── Salary Structures ────────────────────────────────────────────────────────
export const fetchSalaryStructures = listThunk('payroll/fetchStructures', (p) => payrollService.listStructures(p), 'Failed to load salary structures');
export const createSalaryStructure = writeThunk('payroll/createStructure', (d) => payrollService.createStructure(d), 'Failed to create salary structure');
export const updateSalaryStructure = writeThunk('payroll/updateStructure', ({ id, data }) => payrollService.updateStructure(id, data), 'Failed to update salary structure');
export const toggleStructureStatus = writeThunk('payroll/toggleStructureStatus', ({ id, status }) => payrollService.setStructureStatus(id, status), 'Failed to update status');
export const duplicateStructure = writeThunk('payroll/duplicateStructure', (id) => payrollService.duplicateStructure(id), 'Failed to duplicate structure');

// ─── Tax Definitions ──────────────────────────────────────────────────────────
export const fetchTaxDefinitions = createAsyncThunk('payroll/fetchTaxDefs', async (params, { rejectWithValue }) => {
  try {
    const res = await payrollService.listTaxDefs(params);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load tax definitions'));
  }
});
export const createTaxDefinition = writeThunk('payroll/createTaxDef', (d) => payrollService.createTaxDef(d), 'Failed to create tax definition');
export const updateTaxDefinition = writeThunk('payroll/updateTaxDef', ({ id, data }) => payrollService.updateTaxDef(id, data), 'Failed to update tax definition');

// ─── Payslips ─────────────────────────────────────────────────────────────────
export const fetchPayslips = listThunk('payroll/fetchPayslips', (p) => payrollService.listPayslips(p), 'Failed to load payslips');
export const createPayslip = writeThunk('payroll/createPayslip', (d) => payrollService.createPayslip(d, idempotencyHeaders()), 'Failed to create payslip');

export const fetchMyPayslips = createAsyncThunk('payroll/fetchMyPayslips', async (_, { rejectWithValue }) => {
  try {
    const res = await payrollService.myPayslips();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load your payslips'));
  }
});

// ─── Payroll Runs ─────────────────────────────────────────────────────────────
export const fetchPayrollRuns = listThunk('payroll/fetchRuns', (p) => payrollService.listRuns(p), 'Failed to load payroll runs');
export const fetchPayrollStats = writeThunk('payroll/fetchStats', () => payrollService.runStats(), 'Failed to load payroll figures');
export const createPayrollRun = writeThunk('payroll/createRun', (d) => payrollService.createRun(d, idempotencyHeaders()), 'Failed to generate payroll run');
export const approvePayrollRun = writeThunk('payroll/approveRun', (id) => payrollService.approveRun(id, idempotencyHeaders()), 'Failed to approve payroll run');
export const rejectPayrollRun = writeThunk('payroll/rejectRun', ({ id, reason }) => payrollService.rejectRun(id, reason), 'Failed to reject payroll run');

// ─── Statutory configuration ──────────────────────────────────────────────────
export const fetchStatutoryConfig = writeThunk('payroll/fetchStatutory', () => statutoryService.getConfig(), 'Failed to load statutory configuration');
export const createStatutoryVersion = writeThunk('payroll/createStatutory', (d) => statutoryService.createVersion(d), 'Failed to save statutory configuration');
export const confirmStatutoryVersion = writeThunk('payroll/confirmStatutory', (id) => statutoryService.confirm(id), 'Failed to confirm statutory configuration');

const replaceById = (list, item) => {
  const idx = list.findIndex((i) => i._id === item._id);
  if (idx !== -1) list[idx] = { ...list[idx], ...item };
};

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    structures: [], structuresMeta: null, structuresLoading: false,
    taxDefs: [], taxDefsLoading: false,
    payslips: [], payslipsMeta: null, payslipsLoading: false,
    myPayslips: [], myPayslipsLoading: false, myPayslipsError: null,
    runs: [], runsMeta: null, runsLoading: false,
    stats: null,
    statutory: null, statutoryLoading: false,
    error: null,
  },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    const loading = (thunk, flag) =>
      builder
        .addCase(thunk.pending, (s) => { s[flag] = true; s.error = null; })
        .addCase(thunk.rejected, (s, a) => { s[flag] = false; s.error = a.payload || { message: 'Request failed' }; });

    loading(fetchSalaryStructures, 'structuresLoading');
    loading(fetchTaxDefinitions, 'taxDefsLoading');
    loading(fetchPayslips, 'payslipsLoading');
    loading(fetchPayrollRuns, 'runsLoading');
    loading(fetchStatutoryConfig, 'statutoryLoading');

    builder
      .addCase(fetchSalaryStructures.fulfilled, (s, a) => { s.structuresLoading = false; s.structures = a.payload.data; s.structuresMeta = a.payload.meta; })
      .addCase(toggleStructureStatus.fulfilled, (s, a) => replaceById(s.structures, a.payload))
      .addCase(updateSalaryStructure.fulfilled, (s, a) => replaceById(s.structures, a.payload))

      .addCase(fetchTaxDefinitions.fulfilled, (s, a) => { s.taxDefsLoading = false; s.taxDefs = a.payload; })
      .addCase(updateTaxDefinition.fulfilled, (s, a) => replaceById(s.taxDefs, a.payload))

      .addCase(fetchPayslips.fulfilled, (s, a) => { s.payslipsLoading = false; s.payslips = a.payload.data; s.payslipsMeta = a.payload.meta; })

      .addCase(fetchMyPayslips.pending, (s) => { s.myPayslipsLoading = true; s.myPayslipsError = null; })
      .addCase(fetchMyPayslips.fulfilled, (s, a) => { s.myPayslipsLoading = false; s.myPayslips = a.payload || []; })
      .addCase(fetchMyPayslips.rejected, (s, a) => { s.myPayslipsLoading = false; s.myPayslips = []; s.myPayslipsError = a.payload || { message: 'Failed to load your payslips' }; })

      .addCase(fetchPayrollRuns.fulfilled, (s, a) => { s.runsLoading = false; s.runs = a.payload.data; s.runsMeta = a.payload.meta; })
      .addCase(fetchPayrollStats.fulfilled, (s, a) => { s.stats = a.payload; })
      .addCase(approvePayrollRun.fulfilled, (s, a) => replaceById(s.runs, a.payload))
      .addCase(rejectPayrollRun.fulfilled, (s, a) => replaceById(s.runs, a.payload))

      .addCase(fetchStatutoryConfig.fulfilled, (s, a) => { s.statutoryLoading = false; s.statutory = a.payload; })
      .addCase(createStatutoryVersion.fulfilled, (s, a) => {
        if (s.statutory) s.statutory.versions = [a.payload, ...s.statutory.versions];
      })
      .addCase(confirmStatutoryVersion.fulfilled, (s, a) => {
        if (!s.statutory) return;
        replaceById(s.statutory.versions, a.payload);
        if (s.statutory.effective?._id === a.payload._id) s.statutory.effective = a.payload;
      });
  },
});

export const { clearError: clearPayrollError } = payrollSlice.actions;
export const selectStructures        = (s) => s.payroll.structures;
export const selectStructuresMeta    = (s) => s.payroll.structuresMeta;
export const selectStructuresLoading = (s) => s.payroll.structuresLoading;
export const selectTaxDefs           = (s) => s.payroll.taxDefs;
export const selectTaxDefsLoading    = (s) => s.payroll.taxDefsLoading;
export const selectPayslips          = (s) => s.payroll.payslips;
export const selectPayslipsMeta      = (s) => s.payroll.payslipsMeta;
export const selectPayslipsLoading   = (s) => s.payroll.payslipsLoading;
export const selectMyPayslips        = (s) => s.payroll.myPayslips;
export const selectMyPayslipsLoading = (s) => s.payroll.myPayslipsLoading;
export const selectMyPayslipsError   = (s) => s.payroll.myPayslipsError;
export const selectRuns              = (s) => s.payroll.runs;
export const selectRunsMeta          = (s) => s.payroll.runsMeta;
export const selectRunsLoading       = (s) => s.payroll.runsLoading;
export const selectPayrollStats      = (s) => s.payroll.stats;
export const selectStatutory         = (s) => s.payroll.statutory;
export const selectStatutoryLoading  = (s) => s.payroll.statutoryLoading;
export const selectPayrollError      = (s) => s.payroll.error;
export default payrollSlice.reducer;
