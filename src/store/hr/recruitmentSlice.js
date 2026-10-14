import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recruitmentService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const listThunk = (type, call, fallback, shape) =>
  createAsyncThunk(type, async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await call(params);
      return shape(data);
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const { data } = await call(arg);
      return data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

// ─── Job postings ─────────────────────────────────────────────────────────────
export const fetchJobPostings = listThunk('recruitment/fetchJobPostings', (p) => recruitmentService.listJobPostings(p), 'Failed to load job postings', (d) => ({ jobs: d.data, meta: d.meta }));
export const createJobPosting = writeThunk('recruitment/createJob', (payload) => recruitmentService.createJob(payload), 'Failed to create job posting');
export const updateJobPosting = writeThunk('recruitment/updateJob', ({ id, data }) => recruitmentService.updateJob(id, data), 'Failed to update job posting');
export const pauseJobPosting = writeThunk('recruitment/pauseJob', ({ id, reason }) => recruitmentService.pauseJob(id, reason), 'Failed to pause job posting');
export const resumeJobPosting = writeThunk('recruitment/resumeJob', (id) => recruitmentService.resumeJob(id), 'Failed to resume job posting');
export const closeJobPosting = writeThunk('recruitment/closeJob', ({ id, reason }) => recruitmentService.closeJob(id, reason), 'Failed to close job posting');

// ─── Candidates ───────────────────────────────────────────────────────────────
export const fetchCandidates = listThunk('recruitment/fetchCandidates', (p) => recruitmentService.listCandidates(p), 'Failed to load candidates', (d) => ({ candidates: d.data, meta: d.meta }));
export const createCandidateAction = writeThunk('recruitment/createCandidate', (payload) => recruitmentService.createCandidate(payload), 'Failed to add candidate');
export const advanceCandidateStage = writeThunk('recruitment/advanceCandidate', (id) => recruitmentService.advanceCandidate(id), 'Failed to advance candidate');
export const rejectCandidateAction = writeThunk('recruitment/rejectCandidate', ({ id, reason }) => recruitmentService.rejectCandidate(id, reason), 'Failed to reject candidate');
export const convertCandidateAction = writeThunk('recruitment/convertCandidate', ({ id, data }) => recruitmentService.convertCandidate(id, data), 'Failed to convert the candidate');

function patchInList(list, updated) {
  if (!updated) return list;
  const idx = list.findIndex((x) => x._id === updated._id);
  if (idx === -1) return list;
  const next = [...list];
  next[idx] = updated;
  return next;
}

const emptyMeta = { page: 1, limit: 10, total: 0, totalPages: 1 };

const recruitmentSlice = createSlice({
  name: 'recruitment',
  initialState: {
    jobs: [],
    jobsMeta: emptyMeta,
    jobsLoading: true,
    jobsError: null,
    candidates: [],
    candidatesMeta: emptyMeta,
    candidatesLoading: true,
    candidatesError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobPostings.pending,    (s) => { s.jobsLoading = true; s.jobsError = null; })
      .addCase(fetchJobPostings.fulfilled,  (s, { payload }) => { s.jobsLoading = false; s.jobs = payload.jobs; s.jobsMeta = payload.meta || emptyMeta; })
      .addCase(fetchJobPostings.rejected,   (s, { payload }) => { s.jobsLoading = false; s.jobsError = payload?.message || 'Failed to load job postings'; })

      .addCase(updateJobPosting.fulfilled, (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(pauseJobPosting.fulfilled,  (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(resumeJobPosting.fulfilled, (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })
      .addCase(closeJobPosting.fulfilled,  (s, { payload }) => { s.jobs = patchInList(s.jobs, payload); })

      .addCase(fetchCandidates.pending,    (s) => { s.candidatesLoading = true; s.candidatesError = null; })
      .addCase(fetchCandidates.fulfilled,  (s, { payload }) => { s.candidatesLoading = false; s.candidates = payload.candidates; s.candidatesMeta = payload.meta || emptyMeta; })
      .addCase(fetchCandidates.rejected,   (s, { payload }) => { s.candidatesLoading = false; s.candidatesError = payload?.message || 'Failed to load candidates'; })

      .addCase(advanceCandidateStage.fulfilled, (s, { payload }) => { s.candidates = patchInList(s.candidates, payload); })
      .addCase(rejectCandidateAction.fulfilled,  (s, { payload }) => { s.candidates = patchInList(s.candidates, payload); });
  },
});

export default recruitmentSlice.reducer;
