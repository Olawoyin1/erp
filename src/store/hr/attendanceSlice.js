import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceService } from '../../services/hr.service';

export const fetchAttendance = createAsyncThunk(
  'attendance/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await attendanceService.list(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load attendance' });
    }
  }
);

export const fetchAttendanceStats = createAsyncThunk(
  'attendance/fetchStats',
  async (date, { rejectWithValue }) => {
    try {
      const res = await attendanceService.stats(date);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load stats' });
    }
  }
);

export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (locationId, { rejectWithValue }) => {
    try {
      const res = await attendanceService.clockIn(locationId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Clock-in failed' });
    }
  }
);

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async (_, { rejectWithValue }) => {
    try {
      const res = await attendanceService.clockOut();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Clock-out failed' });
    }
  }
);

export const logAttendance = createAsyncThunk(
  'attendance/log',
  async (data, { rejectWithValue }) => {
    try {
      const res = await attendanceService.log(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to log attendance' });
    }
  }
);

export const approveOvertime = createAsyncThunk(
  'attendance/approveOvertime',
  async (id, { rejectWithValue }) => {
    try {
      const res = await attendanceService.approveOvertime(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to approve overtime' });
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    items: [], meta: null, stats: [],
    loading: false, statsLoading: false,
    clockLoading: false, clockError: null,
    error: null,
  },
  reducers: { clearClockError(state) { state.clockError = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAttendance.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchAttendance.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchAttendanceStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchAttendanceStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchAttendanceStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(clockIn.pending,    (s) => { s.clockLoading = true; s.clockError = null; })
      .addCase(clockIn.fulfilled,  (s) => { s.clockLoading = false; })
      .addCase(clockIn.rejected,   (s, a) => { s.clockLoading = false; s.clockError = a.payload; })

      .addCase(clockOut.pending,   (s) => { s.clockLoading = true; s.clockError = null; })
      .addCase(clockOut.fulfilled, (s) => { s.clockLoading = false; })
      .addCase(clockOut.rejected,  (s, a) => { s.clockLoading = false; s.clockError = a.payload; })

      .addCase(logAttendance.fulfilled, (s, a) => { s.items.unshift(a.payload); })

      .addCase(approveOvertime.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      });
  },
});

export const { clearClockError } = attendanceSlice.actions;
export const selectAttendance       = (s) => s.attendance.items;
export const selectAttendanceMeta   = (s) => s.attendance.meta;
export const selectAttendanceStats  = (s) => s.attendance.stats;
export const selectAttendanceLoading = (s) => s.attendance.loading;
export const selectClockLoading     = (s) => s.attendance.clockLoading;
export const selectClockError       = (s) => s.attendance.clockError;
export default attendanceSlice.reducer;
