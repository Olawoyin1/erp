import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { payrollService } from '../../services/hr.service';

// ─── Salary Structures ────────────────────────────────────────────────────────
export const fetchSalaryStructures = createAsyncThunk(
  'payroll/fetchStructures',
  async (params, { rejectWithValue }) => {
    try {
      const res = await payrollService.listStructures(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load salary structures' });
    }
  }
);

export const createSalaryStructure = createAsyncThunk(
  'payroll/createStructure',
  async (data, { rejectWithValue }) => {
    try {
      const res = await payrollService.createStructure(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to create salary structure' });
    }
  }
);

export const updateSalaryStructure = createAsyncThunk(
  'payroll/updateStructure',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await payrollService.updateStructure(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update salary structure' });
    }
  }
);

export const toggleStructureStatus = createAsyncThunk(
  'payroll/toggleStructureStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await payrollService.setStructureStatus(id, status);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update status' });
    }
  }
);

export const duplicateStructure = createAsyncThunk(
  'payroll/duplicateStructure',
  async (id, { rejectWithValue }) => {
    try {
      const res = await payrollService.duplicateStructure(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to duplicate structure' });
    }
  }
);

// ─── Tax Definitions ──────────────────────────────────────────────────────────
export const fetchTaxDefinitions = createAsyncThunk(
  'payroll/fetchTaxDefs',
  async (params, { rejectWithValue }) => {
    try {
      const res = await payrollService.listTaxDefs(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load tax definitions' });
    }
  }
);

export const createTaxDefinition = createAsyncThunk(
  'payroll/createTaxDef',
  async (data, { rejectWithValue }) => {
    try {
      const res = await payrollService.createTaxDef(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to create tax definition' });
    }
  }
);

export const updateTaxDefinition = createAsyncThunk(
  'payroll/updateTaxDef',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await payrollService.updateTaxDef(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update tax definition' });
    }
  }
);

// ─── Payslips ─────────────────────────────────────────────────────────────────
export const fetchPayslips = createAsyncThunk(
  'payroll/fetchPayslips',
  async (params, { rejectWithValue }) => {
    try {
      const res = await payrollService.listPayslips(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load payslips' });
    }
  }
);

// ─── Payroll Runs ─────────────────────────────────────────────────────────────
export const fetchPayrollRuns = createAsyncThunk(
  'payroll/fetchRuns',
  async (params, { rejectWithValue }) => {
    try {
      const res = await payrollService.listRuns(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load payroll runs' });
    }
  }
);

export const createPayrollRun = createAsyncThunk(
  'payroll/createRun',
  async (data, { rejectWithValue }) => {
    try {
      const res = await payrollService.createRun(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to generate payroll run' });
    }
  }
);

export const approvePayrollRun = createAsyncThunk(
  'payroll/approveRun',
  async (id, { rejectWithValue }) => {
    try {
      const res = await payrollService.approveRun(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to approve payroll run' });
    }
  }
);

export const rejectPayrollRun = createAsyncThunk(
  'payroll/rejectRun',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await payrollService.rejectRun(id, reason);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to reject payroll run' });
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    structures: [], structuresMeta: null, structuresLoading: false,
    taxDefs: [], taxDefsLoading: false,
    payslips: [], payslipsMeta: null, payslipsLoading: false,
    runs: [], runsMeta: null, runsLoading: false,
    error: null,
  },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      // Structures
      .addCase(fetchSalaryStructures.pending,   (s) => { s.structuresLoading = true; s.error = null; })
      .addCase(fetchSalaryStructures.fulfilled, (s, a) => { s.structuresLoading = false; s.structures = a.payload.data; s.structuresMeta = a.payload.meta; })
      .addCase(fetchSalaryStructures.rejected,  (s, a) => { s.structuresLoading = false; s.error = a.payload; })

      .addCase(createSalaryStructure.fulfilled, (s, a) => { s.structures.unshift(a.payload); })
      .addCase(updateSalaryStructure.fulfilled, (s, a) => {
        const idx = s.structures.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.structures[idx] = a.payload;
      })
      .addCase(toggleStructureStatus.fulfilled, (s, a) => {
        const idx = s.structures.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.structures[idx] = a.payload;
      })
      .addCase(duplicateStructure.fulfilled, (s, a) => { s.structures.unshift(a.payload); })

      // Tax Defs
      .addCase(fetchTaxDefinitions.pending,   (s) => { s.taxDefsLoading = true; })
      .addCase(fetchTaxDefinitions.fulfilled, (s, a) => { s.taxDefsLoading = false; s.taxDefs = a.payload; })
      .addCase(fetchTaxDefinitions.rejected,  (s) => { s.taxDefsLoading = false; })
      .addCase(createTaxDefinition.fulfilled, (s, a) => { s.taxDefs.unshift(a.payload); })
      .addCase(updateTaxDefinition.fulfilled, (s, a) => {
        const idx = s.taxDefs.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.taxDefs[idx] = a.payload;
      })

      // Payslips
      .addCase(fetchPayslips.pending,   (s) => { s.payslipsLoading = true; })
      .addCase(fetchPayslips.fulfilled, (s, a) => { s.payslipsLoading = false; s.payslips = a.payload.data; s.payslipsMeta = a.payload.meta; })
      .addCase(fetchPayslips.rejected,  (s) => { s.payslipsLoading = false; })

      // Runs
      .addCase(fetchPayrollRuns.pending,   (s) => { s.runsLoading = true; })
      .addCase(fetchPayrollRuns.fulfilled, (s, a) => { s.runsLoading = false; s.runs = a.payload.data; s.runsMeta = a.payload.meta; })
      .addCase(fetchPayrollRuns.rejected,  (s) => { s.runsLoading = false; })
      .addCase(createPayrollRun.fulfilled, (s, a) => { s.runs.unshift(a.payload); })
      .addCase(approvePayrollRun.fulfilled, (s, a) => {
        const idx = s.runs.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.runs[idx] = a.payload;
      })
      .addCase(rejectPayrollRun.fulfilled, (s, a) => {
        const idx = s.runs.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.runs[idx] = a.payload;
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
export const selectRuns              = (s) => s.payroll.runs;
export const selectRunsMeta          = (s) => s.payroll.runsMeta;
export const selectRunsLoading       = (s) => s.payroll.runsLoading;
export const selectPayrollError      = (s) => s.payroll.error;
export default payrollSlice.reducer;
