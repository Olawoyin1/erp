import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { trainingService } from '../../services/hr.service';

const failure = (err, fallback) => {
  const e = err.response?.data?.error;
  return { message: e?.message || fallback, code: e?.code, details: e?.details || [], status: err.response?.status };
};

const writeThunk = (type, call, fallback) =>
  createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      const res = await call(arg);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(failure(err, fallback));
    }
  });

export const fetchTrainingPrograms = createAsyncThunk('training/fetchList', async (params, { rejectWithValue }) => {
  try {
    const res = await trainingService.list(params);
    return { data: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue(failure(err, 'Failed to load training programs'));
  }
});

export const createTrainingProgram = writeThunk('training/create', (data) => trainingService.create(data), 'Failed to schedule training');
export const updateTrainingProgram = writeThunk('training/update', ({ id, data }) => trainingService.update(id, data), 'Failed to update training');
export const setTrainingStatus = writeThunk('training/setStatus', ({ id, status }) => trainingService.setStatus(id, status), 'Failed to update status');
export const cancelTraining = writeThunk('training/cancel', ({ id, reason }) => trainingService.cancel(id, reason), 'Failed to cancel training');

const replaceById = (list, item) => {
  const i = list.findIndex((x) => x._id === item._id);
  if (i !== -1) list[i] = item;
};

const trainingSlice = createSlice({
  name: 'training',
  initialState: { items: [], meta: null, loading: true, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrainingPrograms.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchTrainingPrograms.fulfilled, (s, a) => { s.loading = false; s.items = a.payload.data; s.meta = a.payload.meta; })
      .addCase(fetchTrainingPrograms.rejected, (s, a) => { s.loading = false; s.error = a.payload?.message || 'Failed to load training programs'; })
      .addCase(updateTrainingProgram.fulfilled, (s, a) => replaceById(s.items, a.payload))
      .addCase(setTrainingStatus.fulfilled, (s, a) => replaceById(s.items, a.payload))
      .addCase(cancelTraining.fulfilled, (s, a) => replaceById(s.items, a.payload));
  },
});

export const selectTrainingPrograms = (s) => s.training.items;
export const selectTrainingMeta = (s) => s.training.meta;
export const selectTrainingLoading = (s) => s.training.loading;
export const selectTrainingError = (s) => s.training.error;

export default trainingSlice.reducer;
