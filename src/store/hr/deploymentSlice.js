import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deploymentService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const { data } = await call(arg);
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

export const fetchDeployments = createAsyncThunk('deployments/fetchList', async (params = {}, { rejectWithValue }) => {
  try {
    const { data } = await deploymentService.list(params);
    return { records: data.data, meta: data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load deployments'));
  }
});

export const fetchDeploymentStats = writeThunk('deployments/fetchStats', () => deploymentService.stats(), 'Failed to load deployment stats');
export const createDeployment = writeThunk('deployments/create', (payload) => deploymentService.create(payload), 'Failed to create deployment');
export const updateDeployment = writeThunk('deployments/update', ({ id, data }) => deploymentService.update(id, data), 'Failed to update deployment');
export const setDeploymentStatus = writeThunk('deployments/setStatus', ({ id, status }) => deploymentService.setStatus(id, status), 'Failed to update deployment status');

function patchInList(list, updated) {
  if (!updated) return list;
  const idx = list.findIndex((x) => x._id === updated._id);
  if (idx === -1) return list;
  const next = [...list];
  next[idx] = updated;
  return next;
}

export const ALLOWED_TRANSITIONS = {
  pending:    ['active'],
  active:     ['on_hold', 'completed'],
  on_hold:    ['active'],
  completed:  [],
};

export const STATUS_STYLES = {
  pending:   { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'Pending' },
  active:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Active' },
  on_hold:   { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: 'On Hold' },
  completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Completed' },
};

const deploymentSlice = createSlice({
  name: 'deployments',
  initialState: {
    records: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    stats: [],
    loading: true,
    statsLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeployments.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDeployments.fulfilled,  (s, { payload }) => { s.loading = false; s.records = payload.records; s.meta = payload.meta; })
      .addCase(fetchDeployments.rejected,   (s, { payload }) => { s.loading = false; s.error = payload?.message || 'Failed to load deployments'; })

      .addCase(fetchDeploymentStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchDeploymentStats.fulfilled, (s, { payload }) => { s.statsLoading = false; s.stats = payload; })
      .addCase(fetchDeploymentStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(updateDeployment.fulfilled,      (s, { payload }) => { s.records = patchInList(s.records, payload); })
      .addCase(setDeploymentStatus.fulfilled,   (s, { payload }) => { s.records = patchInList(s.records, payload); });
  },
});

export default deploymentSlice.reducer;
