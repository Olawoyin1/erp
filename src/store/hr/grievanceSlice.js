import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { grievanceService } from '../../services/hr.service';

export const fetchCases = createAsyncThunk(
  'grievance/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await grievanceService.list(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load cases' });
    }
  }
);

export const fetchCaseStats = createAsyncThunk(
  'grievance/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await grievanceService.stats();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load stats' });
    }
  }
);

export const createCase = createAsyncThunk(
  'grievance/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await grievanceService.create(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to create case' });
    }
  }
);

export const updateCase = createAsyncThunk(
  'grievance/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await grievanceService.update(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update case' });
    }
  }
);

export const startReview = createAsyncThunk(
  'grievance/startReview',
  async (id, { rejectWithValue }) => {
    try {
      const res = await grievanceService.startReview(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to start review' });
    }
  }
);

export const resolveCase = createAsyncThunk(
  'grievance/resolve',
  async (id, { rejectWithValue }) => {
    try {
      const res = await grievanceService.resolve(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to resolve case' });
    }
  }
);

export const closeCase = createAsyncThunk(
  'grievance/close',
  async (id, { rejectWithValue }) => {
    try {
      const res = await grievanceService.close(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to close case' });
    }
  }
);

export const addNote = createAsyncThunk(
  'grievance/addNote',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const res = await grievanceService.addNote(id, note);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to add note' });
    }
  }
);

const grievanceSlice = createSlice({
  name: 'grievance',
  initialState: {
    items: [], meta: null, stats: [],
    loading: false, statsLoading: false,
    error: null,
  },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchCases.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchCases.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(fetchCaseStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchCaseStats.fulfilled, (s, a) => { s.statsLoading = false; s.stats = a.payload; })
      .addCase(fetchCaseStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(createCase.fulfilled, (s, a) => { s.items.unshift(a.payload); })

      // All status transitions + note return the full updated case
      .addCase(updateCase.fulfilled,  (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i !== -1) s.items[i] = a.payload; })
      .addCase(startReview.fulfilled, (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i !== -1) s.items[i] = a.payload; })
      .addCase(resolveCase.fulfilled, (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i !== -1) s.items[i] = a.payload; })
      .addCase(closeCase.fulfilled,   (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i !== -1) s.items[i] = a.payload; })
      .addCase(addNote.fulfilled,     (s, a) => { const i = s.items.findIndex(x => x._id === a.payload._id); if (i !== -1) s.items[i] = a.payload; });
  },
});

export const { clearError: clearGrievanceError } = grievanceSlice.actions;
export const selectCases         = (s) => s.grievance.items;
export const selectCasesMeta     = (s) => s.grievance.meta;
export const selectCaseStats     = (s) => s.grievance.stats;
export const selectCasesLoading  = (s) => s.grievance.loading;
export const selectCasesError    = (s) => s.grievance.error;
export default grievanceSlice.reducer;
