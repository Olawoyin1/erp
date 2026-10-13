import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recruitmentService } from '../../services/hr.service';

// ─── Job Postings Thunks ──────────────────────────────────────────────────────
export const fetchJobPostings = createAsyncThunk(
  'recruitment/fetchJobPostings',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.listJobPostings(params);
      return { jobs: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load job postings');
    }
  }
);

export const createJobPosting = createAsyncThunk(
  'recruitment/createJob',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.createJob(payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to create job posting');
    }
  }
);

export const updateJobPosting = createAsyncThunk(
  'recruitment/updateJob',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.updateJob(id, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to update job posting');
    }
  }
);

export const pauseJobPosting = createAsyncThunk(
  'recruitment/pauseJob',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.pauseJob(id, reason);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to pause job posting');
    }
  }
);

export const resumeJobPosting = createAsyncThunk(
  'recruitment/resumeJob',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.resumeJob(id);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to resume job posting');
    }
  }
);

export const closeJobPosting = createAsyncThunk(
  'recruitment/closeJob',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.closeJob(id, reason);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to close job posting');
    }
  }
);

// ─── Candidates Thunks ────────────────────────────────────────────────────────
export const fetchCandidates = createAsyncThunk(
  'recruitment/fetchCandidates',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.listCandidates(params);
      return { candidates: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load candidates');
    }
  }
);

export const advanceCandidateStage = createAsyncThunk(
  'recruitment/advanceCandidate',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.advanceCandidate(id);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to advance candidate');
    }
  }
);

export const rejectCandidateAction = createAsyncThunk(
  'recruitment/rejectCandidate',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await recruitmentService.rejectCandidate(id, reason);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to reject candidate');
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

// ─── Slice ────────────────────────────────────────────────────────────────────
const recruitmentSlice = createSlice({
  name: 'recruitment',
  initialState: {
    jobs: [],
    jobsMeta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    jobsLoading: false,
    jobsError: null,
    candidates: [],
    candidatesMeta: { page: 1, limit: 10, total: 0, totalPages: 1 },
    candidatesLoading: false,
    candidatesError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobPostings.pending,    (s) => { s.jobsLoading = true; s.jobsError = null; })
      .addCase(fetchJobPostings.fulfilled,  (s, { payload }) => {
        s.jobsLoading = false; s.jobs = payload.jobs; s.jobsMeta = payload.meta;
      })
      .addCase(fetchJobPostings.rejected,   (s, { payload }) => { s.jobsLoading = false; s.jobsError = payload; })

      .addCase(createJobPosting.fulfilled, (s, { payload }) => {
        if (payload) { s.jobs.unshift(payload); s.jobsMeta.total += 1; }
      })
      .addCase(updateJobPosting.fulfilled, (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(pauseJobPosting.fulfilled,  (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(resumeJobPosting.fulfilled, (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(closeJobPosting.fulfilled,  (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })

      .addCase(fetchCandidates.pending,    (s) => { s.candidatesLoading = true; s.candidatesError = null; })
      .addCase(fetchCandidates.fulfilled,  (s, { payload }) => {
        s.candidatesLoading = false; s.candidates = payload.candidates; s.candidatesMeta = payload.meta;
      })
      .addCase(fetchCandidates.rejected,   (s, { payload }) => { s.candidatesLoading = false; s.candidatesError = payload; })

      .addCase(advanceCandidateStage.fulfilled, (s, { payload }) => { s.candidates = patchInList(s.candidates, payload); })
      .addCase(rejectCandidateAction.fulfilled,  (s, { payload }) => { s.candidates = patchInList(s.candidates, payload); });
  },
});

export default recruitmentSlice.reducer;
