import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const failure = (err, fallback) => {
  const server = err?.response?.data?.error;
  return {
    message: server?.message || err?.message || fallback,
    code: server?.code,
    details: server?.details || [],
    status: err?.response?.status,
  };
};

/**
 * One paginated Technical list with its stat tiles and a generic "call a service method" thunk.
 *
 *   const slice = createTechSlice('techWbs', wbsListService);
 *   dispatch(slice.fetchList({ projectId, page: 1, limit: 10, q: 'abc' }));
 *   const result = await dispatch(slice.runAction({ method: 'approve', args: [id] }));
 *
 * `service.list(params)` and `service.stats(params)` both receive the list params, so a project-scoped list sends
 * `projectId` and its tiles are scoped the same way. When `projectId` changes the old rows are cleared at once, so
 * a tab never shows another project's records while the new ones load. Only the newest list request is applied.
 */
export function createTechSlice(name, service) {
  const fetchList = createAsyncThunk(`${name}/list`, async (params, { rejectWithValue }) => {
    try {
      const res = await service.list(params);
      return { data: res.data?.data || [], meta: res.data?.meta || null };
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load records'));
    }
  });

  const fetchStats = createAsyncThunk(`${name}/stats`, async (params, { rejectWithValue }) => {
    try {
      if (!service.stats) return { stats: [], scope: params?.projectId || '' };
      const res = await service.stats(params || {});
      return { stats: res.data?.data || [], scope: params?.projectId || '' };
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load summary'));
    }
  });

  const runAction = createAsyncThunk(`${name}/action`, async ({ method, args = [] }, { rejectWithValue }) => {
    try {
      const res = await service[method](...args);
      return res.data?.data ?? null;
    } catch (err) {
      return rejectWithValue(failure(err, 'The action failed'));
    }
  });

  const slice = createSlice({
    name,
    initialState: {
      items: [],
      meta: null,
      stats: [],
      loading: true,
      error: '',
      statsLoading: false,
      statsError: '',
      requestId: null,
      scope: '',
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchList.pending, (state, action) => {
          const scope = action.meta.arg?.projectId || '';
          if (scope !== state.scope) {
            state.scope = scope;
            state.items = [];
            state.meta = null;
            state.stats = [];
          }
          state.loading = true;
          state.error = '';
          state.requestId = action.meta.requestId;
        })
        .addCase(fetchList.fulfilled, (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.loading = false;
          state.items = action.payload.data;
          state.meta = action.payload.meta;
        })
        .addCase(fetchList.rejected, (state, action) => {
          if (state.requestId !== action.meta.requestId) return;
          state.loading = false;
          state.error = action.payload?.message || 'Failed to load records';
        })
        .addCase(fetchStats.pending, (state) => {
          state.statsLoading = true;
          state.statsError = '';
        })
        .addCase(fetchStats.fulfilled, (state, action) => {
          state.statsLoading = false;
          if (action.payload.scope === state.scope) state.stats = action.payload.stats;
        })
        .addCase(fetchStats.rejected, (state, action) => {
          state.statsLoading = false;
          state.statsError = action.payload?.message || 'Failed to load summary';
        });
    },
  });

  return { reducer: slice.reducer, fetchList, fetchStats, runAction, key: name };
}
