import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tasksService } from '../../services/tasks.service';
import { apiError } from '../../services/apiHelpers';

const emptyEntry = () => ({
  items: [],
  meta: null,
  board: { todo: [], in_progress: [], done: [] },
  stats: [],
  loading: true,
  error: '',
  requestId: null,
});

export const fetchModuleTasks = createAsyncThunk(
  'moduleTasks/fetch',
  async ({ module, view, params }, { rejectWithValue }) => {
    try {
      if (view === 'board') {
        const res = await tasksService.board({ module, ...params });
        return { module, view, board: res.data.data };
      }
      const res = await tasksService.list({ module, ...params });
      return { module, view, items: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue({ module, message: apiError(err, 'Failed to load tasks') });
    }
  },
);

export const fetchModuleTaskStats = createAsyncThunk('moduleTasks/stats', async ({ module, scope }, { rejectWithValue }) => {
  try {
    const res = await tasksService.stats(module, scope);
    return { module, stats: res.data.data };
  } catch {
    return rejectWithValue({ module });
  }
});

const entryOf = (state, module) => {
  if (!state[module]) state[module] = emptyEntry();
  return state[module];
};

const tasksSlice = createSlice({
  name: 'moduleTasks',
  initialState: {},
  reducers: {
    setBoard(state, action) {
      entryOf(state, action.payload.module).board = action.payload.board;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchModuleTasks.pending, (state, action) => {
        const entry = entryOf(state, action.meta.arg.module);
        entry.loading = true;
        entry.error = '';
        entry.requestId = action.meta.requestId;
      })
      .addCase(fetchModuleTasks.fulfilled, (state, action) => {
        const entry = entryOf(state, action.payload.module);
        if (entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        if (action.payload.view === 'board') {
          entry.board = { todo: [], in_progress: [], done: [], ...action.payload.board };
        } else {
          entry.items = action.payload.items;
          entry.meta = action.payload.meta;
        }
      })
      .addCase(fetchModuleTasks.rejected, (state, action) => {
        const entry = entryOf(state, action.meta.arg.module);
        if (entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.error = action.payload?.message || 'Failed to load tasks';
      })
      .addCase(fetchModuleTaskStats.fulfilled, (state, action) => {
        entryOf(state, action.payload.module).stats = action.payload.stats;
      })
      .addCase(fetchModuleTaskStats.rejected, (state, action) => {
        if (action.payload?.module) entryOf(state, action.payload.module).stats = [];
      });
  },
});

export const { setBoard } = tasksSlice.actions;
export const selectModuleTasks = (module) => (state) => state.moduleTasks[module];
export default tasksSlice.reducer;
