import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leaveService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const res = await call(arg);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

export const fetchLeaves = createAsyncThunk('leave/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await leaveService.list(params);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load leave requests'));
  }
});

export const fetchLeaveStats = writeThunk('leave/fetchStats', () => leaveService.stats(), 'Failed to load leave stats');
export const createLeave = writeThunk('leave/create', (data) => leaveService.create(data), 'Failed to submit leave request');
export const approveLeave = writeThunk('leave/approve', (id) => leaveService.approve(id), 'Failed to approve leave');
export const declineLeave = writeThunk('leave/decline', ({ id, reason }) => leaveService.decline(id, reason), 'Failed to decline leave');
export const requestLeaveChanges = writeThunk('leave/requestChanges', ({ id, message }) => leaveService.requestChanges(id, message), 'Failed to send the change request');

const replaceById = (list, item) => {
  const i = list.findIndex((x) => x._id === item._id);
  if (i !== -1) list[i] = item;
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState: { items: [], meta: null, stats: [], loading: true, statsLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeaves.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchLeaves.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Failed to load leave requests'; })
      .addCase(fetchLeaveStats.pending, (s) => { s.statsLoading = true; })
      .addCase(fetchLeaveStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchLeaveStats.rejected, (s) => { s.statsLoading = false; })
      .addCase(approveLeave.fulfilled, (s, a) => replaceById(s.items, a.payload))
      .addCase(declineLeave.fulfilled, (s, a) => replaceById(s.items, a.payload));
  },
});

export const selectLeaveRequests = (s) => s.leave.items;
export const selectLeaveMeta = (s) => s.leave.meta;
export const selectLeaveStats = (s) => s.leave.stats;
export const selectLeaveLoading = (s) => s.leave.loading;
export const selectLeaveError = (s) => s.leave.error;

export default leaveSlice.reducer;
