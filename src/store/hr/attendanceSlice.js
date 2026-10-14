import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

export const fetchAttendance = createAsyncThunk('attendance/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await attendanceService.list(params);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load attendance records'));
  }
});

export const fetchAttendanceStats = createAsyncThunk('attendance/fetchStats', async (date, { rejectWithValue }) => {
  try {
    const res = await attendanceService.stats(date);
    return res.data.data;
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load attendance stats'));
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

export const clockIn = writeThunk('attendance/clockIn', (locationId) => attendanceService.clockIn(locationId), 'Clock-in failed');
export const clockOut = writeThunk('attendance/clockOut', () => attendanceService.clockOut(), 'Clock-out failed');
export const logAttendance = writeThunk('attendance/log', (data) => attendanceService.log(data), 'The attendance could not be logged');
export const approveOvertime = writeThunk('attendance/approveOvertime', (id) => attendanceService.approveOvertime(id), 'Approval failed');

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: { records: [], meta: null, stats: [], loading: true, statsLoading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAttendance.fulfilled, (s, a) => { s.loading = false; s.records = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchAttendance.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Failed to load attendance records'; })
      .addCase(fetchAttendanceStats.pending, (s) => { s.statsLoading = true; })
      .addCase(fetchAttendanceStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchAttendanceStats.rejected, (s) => { s.statsLoading = false; });
  },
});

export default attendanceSlice.reducer;
