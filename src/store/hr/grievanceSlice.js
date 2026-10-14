import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { grievanceService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const replaceInList = (list, item) => {
  const i = list.findIndex((x) => x._id === item._id);
  if (i !== -1) list[i] = item;
};

export const fetchCases = createAsyncThunk('grievance/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await grievanceService.list(params);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load cases'));
  }
});

export const fetchCaseStats = createAsyncThunk('grievance/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await grievanceService.stats();
    return res.data.data;
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load stats'));
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

export const createCase = writeThunk('grievance/create', (data) => grievanceService.create(data), 'Failed to create case');
export const updateCase = writeThunk('grievance/update', ({ id, data }) => grievanceService.update(id, data), 'Failed to update case');
export const startReview = writeThunk('grievance/startReview', (id) => grievanceService.startReview(id), 'Failed to start review');
export const resolveCase = writeThunk('grievance/resolve', (id) => grievanceService.resolve(id), 'Failed to resolve case');
export const closeCase = writeThunk('grievance/close', (id) => grievanceService.close(id), 'Failed to close case');
export const addNote = writeThunk('grievance/addNote', ({ id, note }) => grievanceService.addNote(id, note), 'Failed to add note');

const grievanceSlice = createSlice({
  name: 'grievance',
  initialState: { items: [], meta: null, stats: [], loading: true, statsLoading: false, error: null },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCases.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchCases.rejected,  (s, a) => { s.loading = false; s.error = a.payload || { message: 'Failed to load cases' }; })

      .addCase(fetchCaseStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchCaseStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchCaseStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(updateCase.fulfilled,  (s, a) => replaceInList(s.items, a.payload))
      .addCase(startReview.fulfilled, (s, a) => replaceInList(s.items, a.payload))
      .addCase(resolveCase.fulfilled, (s, a) => replaceInList(s.items, a.payload))
      .addCase(closeCase.fulfilled,   (s, a) => replaceInList(s.items, a.payload))
      .addCase(addNote.fulfilled,     (s, a) => replaceInList(s.items, a.payload));
  },
});

export const { clearError: clearGrievanceError } = grievanceSlice.actions;
export const selectCases         = (s) => s.grievance.items;
export const selectCasesMeta     = (s) => s.grievance.meta;
export const selectCaseStats     = (s) => s.grievance.stats;
export const selectCasesStatsLoading = (s) => s.grievance.statsLoading;
export const selectCasesLoading  = (s) => s.grievance.loading;
export const selectCasesError    = (s) => s.grievance.error;
export default grievanceSlice.reducer;
