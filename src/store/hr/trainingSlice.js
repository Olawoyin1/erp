import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { trainingService } from '../../services/hr.service';

export const fetchTrainingPrograms = createAsyncThunk(
  'training/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await trainingService.list(params);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load training programs' });
    }
  }
);

export const createTrainingProgram = createAsyncThunk(
  'training/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await trainingService.create(data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to schedule training' });
    }
  }
);

export const updateTrainingProgram = createAsyncThunk(
  'training/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await trainingService.update(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update training' });
    }
  }
);

export const setTrainingStatus = createAsyncThunk(
  'training/setStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await trainingService.setStatus(id, status);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to update status' });
    }
  }
);

export const cancelTraining = createAsyncThunk(
  'training/cancel',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await trainingService.cancel(id, reason);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to cancel training' });
    }
  }
);

export const fetchParticipants = createAsyncThunk(
  'training/fetchParticipants',
  async (id, { rejectWithValue }) => {
    try {
      const res = await trainingService.getParticipants(id);
      return { id, participants: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to load participants' });
    }
  }
);

export const enrollParticipants = createAsyncThunk(
  'training/enroll',
  async ({ id, employeeIds }, { rejectWithValue }) => {
    try {
      const res = await trainingService.enroll(id, employeeIds);
      return { id, participants: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to enroll participants' });
    }
  }
);

const trainingSlice = createSlice({
  name: 'training',
  initialState: {
    items: [],
    meta: null,
    participants: {}, // keyed by training id
    loading: false,
    participantsLoading: false,
    error: null,
  },
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrainingPrograms.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTrainingPrograms.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchTrainingPrograms.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })

      .addCase(createTrainingProgram.fulfilled, (s, a) => { s.items.unshift(a.payload); })

      .addCase(updateTrainingProgram.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(setTrainingStatus.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })
      .addCase(cancelTraining.fulfilled, (s, a) => {
        const idx = s.items.findIndex(i => i._id === a.payload._id);
        if (idx !== -1) s.items[idx] = a.payload;
      })

      .addCase(fetchParticipants.pending, (s) => { s.participantsLoading = true; })
      .addCase(fetchParticipants.fulfilled, (s, a) => {
        s.participantsLoading = false;
        s.participants[a.payload.id] = a.payload.participants;
      })
      .addCase(fetchParticipants.rejected, (s) => { s.participantsLoading = false; })

      .addCase(enrollParticipants.fulfilled, (s, a) => {
        s.participants[a.payload.id] = a.payload.participants;
      });
  },
});

export const { clearError: clearTrainingError } = trainingSlice.actions;
export const selectTrainingPrograms    = (s) => s.training.items;
export const selectTrainingMeta        = (s) => s.training.meta;
export const selectTrainingLoading     = (s) => s.training.loading;
export const selectTrainingError       = (s) => s.training.error;
export const selectParticipants        = (id) => (s) => s.training.participants[id] || [];
export const selectParticipantsLoading = (s) => s.training.participantsLoading;
export default trainingSlice.reducer;
