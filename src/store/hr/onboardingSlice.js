import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { onboardingService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [] };
};

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchOnboarding = createAsyncThunk(
  'onboarding/fetchList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.list(params);
      return { records: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load onboarding cases').message);
    }
  }
);

export const fetchOnboardingStats = createAsyncThunk(
  'onboarding/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.stats();
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load stats').message);
    }
  }
);

export const fetchOnboardingDetail = createAsyncThunk(
  'onboarding/fetchDetail',
  async (caseId, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.getDetail(caseId);
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load onboarding details').message);
    }
  }
);

export const advanceOnboardingStatus = createAsyncThunk(
  'onboarding/advance',
  async (caseId, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.advance(caseId);
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to advance onboarding status').message);
    }
  }
);

export const convertOnboardingCase = createAsyncThunk(
  'onboarding/convert',
  async ({ caseId, data: body }, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.convert(caseId, body);
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to convert the candidate'));
    }
  }
);

export const verifyOnboardingDocument = createAsyncThunk(
  'onboarding/verifyDoc',
  async ({ caseId, docId }, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.verifyDoc(caseId, docId);
      return { docId, result: data.data };
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to verify document').message);
    }
  }
);

/** The action label for each status; Convert to Employee is its own control, shown once a case is completed. */
export const NEXT_STATUS_LABEL = {
  pending:     'Start Onboarding',
  in_progress: 'Mark Complete',
  completed:   null,
  converted:   null,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    records: [],
    meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    stats: [],
    activeDetail: null,
    loading: false,
    statsLoading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    clearActiveDetail(state) { state.activeDetail = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOnboarding.pending,    (s) => { s.loading = true; s.error = null; })
      .addCase(fetchOnboarding.fulfilled,  (s, { payload }) => { s.loading = false; s.records = payload.records; s.meta = payload.meta; })
      .addCase(fetchOnboarding.rejected,   (s, { payload }) => { s.loading = false; s.error = payload; })

      .addCase(fetchOnboardingStats.pending,   (s) => { s.statsLoading = true; })
      .addCase(fetchOnboardingStats.fulfilled, (s, { payload }) => { s.statsLoading = false; s.stats = payload; })
      .addCase(fetchOnboardingStats.rejected,  (s) => { s.statsLoading = false; })

      .addCase(fetchOnboardingDetail.pending,   (s) => { s.detailLoading = true; })
      .addCase(fetchOnboardingDetail.fulfilled, (s, { payload }) => { s.detailLoading = false; s.activeDetail = payload; })
      .addCase(fetchOnboardingDetail.rejected,  (s) => { s.detailLoading = false; })

      .addCase(advanceOnboardingStatus.fulfilled, (s, { payload }) => {
        if (!payload) return;
        const idx = s.records.findIndex((r) => r._id === payload._id);
        if (idx !== -1) s.records[idx] = { ...s.records[idx], status: payload.status, canConvert: payload.canConvert };
        if (s.activeDetail?.onboardingCase?._id === payload._id) {
          s.activeDetail.onboardingCase.status = payload.status;
          s.activeDetail.canConvert = payload.canConvert;
        }
      })

      .addCase(verifyOnboardingDocument.fulfilled, (s, { payload }) => {
        if (!s.activeDetail?.documents) return;
        const idx = s.activeDetail.documents.findIndex((d) => d._id === payload.docId);
        if (idx !== -1) s.activeDetail.documents[idx] = { ...s.activeDetail.documents[idx], verified: true };
      });
  },
});

export const { clearActiveDetail } = onboardingSlice.actions;
export default onboardingSlice.reducer;
