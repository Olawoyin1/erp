import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { onboardingService } from '../../services/hr.service';

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const fetchOnboarding = createAsyncThunk(
  'onboarding/fetchList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.list(params);
      return { records: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load onboarding cases');
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
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load stats');
    }
  }
);

export const fetchOnboardingByEmployee = createAsyncThunk(
  'onboarding/fetchByEmployee',
  async (employeeId, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.getByEmployee(employeeId);
      return data.data; // { onboardingCase, checklist, documents, progressPercent }
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load onboarding details');
    }
  }
);

export const advanceOnboardingStatus = createAsyncThunk(
  'onboarding/advance',
  async (employeeId, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.advance(employeeId);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to advance onboarding status');
    }
  }
);

export const verifyOnboardingDocument = createAsyncThunk(
  'onboarding/verifyDoc',
  async ({ employeeId, docId }, { rejectWithValue }) => {
    try {
      const { data } = await onboardingService.verifyDoc(employeeId, docId);
      return { docId, result: data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to verify document');
    }
  }
);

export const NEXT_STATUS_LABEL = {
  pending:               'Start Onboarding',
  in_progress:           'Mark Complete',
  completed:             'Ready for Deployment',
  ready_for_deployment:  null,
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

      .addCase(fetchOnboardingByEmployee.pending,   (s) => { s.detailLoading = true; })
      .addCase(fetchOnboardingByEmployee.fulfilled, (s, { payload }) => { s.detailLoading = false; s.activeDetail = payload; })
      .addCase(fetchOnboardingByEmployee.rejected,  (s) => { s.detailLoading = false; })

      .addCase(advanceOnboardingStatus.fulfilled, (s, { payload }) => {
        if (!payload) return;
        const empId = typeof payload.employeeId === 'object' ? payload.employeeId?._id : payload.employeeId;
        const idx = s.records.findIndex((r) => {
          const rEmpId = typeof r.employeeId === 'object' ? r.employeeId?._id : r.employeeId;
          return r._id === payload._id || rEmpId === empId;
        });
        if (idx !== -1) s.records[idx] = { ...s.records[idx], status: payload.status };
        if (s.activeDetail?.onboardingCase) s.activeDetail.onboardingCase.status = payload.status;
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
