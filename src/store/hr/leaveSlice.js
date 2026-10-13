import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leaveService } from '../../services/hr.service';

export const fetchLeaveRequests = createAsyncThunk(
  'leave/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await leaveService.list(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load leave requests' });
    }
  }
);

export const fetchLeaveStats = createAsyncThunk(
  'leave/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await leaveService.stats();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load leave stats' });
    }
  }
);

export const createLeaveRequest = createAsyncThunk(
  'leave/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await leaveService.create(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to submit leave request' });
    }
  }
);

export const approveLeave = createAsyncThunk(
  'leave/approve',
  async (id, { rejectWithValue }) => {
    try {
      const res = await leaveService.approve(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to approve leave' });
    }
  }
);

export const declineLeave = createAsyncThunk(
  'leave/decline',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await leaveService.decline(id, reason);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to decline leave' });
    }
  }
);

export const requestLeaveChanges = createAsyncThunk(
  'leave/requestChanges',
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const res = await leaveService.requestChanges(id, message);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to request changes' });
    }
  }
);

export const fetchLeaveBalances = createAsyncThunk(
  'leave/fetchBalances',
  async ({ empId, year }, { rejectWithValue }) => {
    try {
      const res = await leaveService.balances(empId, year);
      return { empId, data: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load leave balances' });
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState: {
    items: [], meta: null, stats: [],
    balances: {}, balancesLoading: false,
    loading: false, statsLoading: false,
    error: null,
  },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveRequests.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLeaveRequests.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchLeaveRequests.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchLeaveStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchLeaveStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchLeaveStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(createLeaveRequest.fulfilled, (s, a) => { s.items.unshift(a.payload); })

      // Both approve and decline return the updated record
      .addCase(approveLeave.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(declineLeave.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(requestLeaveChanges.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(fetchLeaveBalances.pending,   (s) => { s.balancesLoading = true; })
      .addCase(fetchLeaveBalances.fulfilled, (s, a) => {
        s.balancesLoading = false;
        s.balances[a.payload.empId] = a.payload.data;
      })
      .addCase(fetchLeaveBalances.rejected,  (s) => { s.balancesLoading = false; });
  },
});

export const { clearError: clearLeaveError } = leaveSlice.actions;
export const selectLeaveRequests    = (s) => s.leave.items;
export const selectLeaveMeta        = (s) => s.leave.meta;
export const selectLeaveStats       = (s) => s.leave.stats;
export const selectLeaveLoading     = (s) => s.leave.loading;
export const selectLeaveError       = (s) => s.leave.error;
export const selectLeaveBalances    = (empId) => (s) => s.leave.balances[empId] || [];
export const selectBalancesLoading  = (s) => s.leave.balancesLoading;
export default leaveSlice.reducer;

// ─── Alias exports (used by LeaveManagement.jsx) ──────────────────────────────
export const fetchLeaves = fetchLeaveRequests;
export const createLeave = createLeaveRequest;
