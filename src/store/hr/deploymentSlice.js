import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deploymentService } from '../../services/hr.service';

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchDeployments = createAsyncThunk(
  'deployments/fetchList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.list(params);
      return { records: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load deployments');
    }
  }
);

export const fetchDeploymentStats = createAsyncThunk(
  'deployments/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.stats();
      return data.data; // [{ key, label, value }]
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load deployment stats');
    }
  }
);

export const createDeployment = createAsyncThunk(
  'deployments/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.create(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create deployment');
    }
  }
);

export const updateDeployment = createAsyncThunk(
  'deployments/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.update(id, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update deployment');
    }
  }
);

export const setDeploymentStatus = createAsyncThunk(
  'deployments/setStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.setStatus(id, status);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update deployment status');
    }
  }
);

export const fetchDeploymentReport = createAsyncThunk(
  'deployments/getReport',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await deploymentService.getReport(id);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Report not available');
    }
  }
);

// ─── Helper ───────────────────────────────────────────────────────────────────
function patchInList(list, updated) {
  if (!updated) return list;
  const idx = list.findIndex((x) => x._id === updated._id);
  if (idx === -1) return list;
  const next = [...list];
  next[idx] = updated;
  return next;
}

// ─── Status transitions (pending → active; active → on_hold | completed; on_hold → active) ─
export const ALLOWED_TRANSITIONS = {
  pending:    ['active'],
  active:     ['on_hold', 'completed'],
  on_hold:    ['active'],
  completed:  [],
};

export const STATUS_STYLES = {
  pending:   { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'Pending' },
  active:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Active' },
  on_hold:   { bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A', label: 'On Hold' },
  completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Completed' },
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const deploymentSlice = createSlice({
  name: 'deployments',
  initialState: {
    records: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    stats: [],
    loading: false,
    statsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeployments.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDeployments.fulfilled,  (s, { payload }) => { s.loading = false; s.records = payload.records; s.meta = payload.meta; })
      .addCase(fetchDeployments.rejected,   (s, { payload }) => { s.loading = false; s.error = payload; })

      .addCase(fetchDeploymentStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchDeploymentStats.fulfilled, (s, { payload }) => { s.statsLoading = false; s.stats = payload; })
      .addCase(fetchDeploymentStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(createDeployment.fulfilled, (s, { payload }) => {
        if (payload) { s.records.unshift(payload); s.meta.total += 1; }
      })

      .addCase(updateDeployment.fulfilled,      (s, { payload }) => { s.records = patchInList(s.records, payload); })
      .addCase(setDeploymentStatus.fulfilled,   (s, { payload }) => { s.records = patchInList(s.records, payload); });
  },
});

export default deploymentSlice.reducer;
