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
 * One paginated finance list with its stat tiles and a generic "call a service method" thunk.
 *
 *   const { reducer, fetchList, fetchStats, runAction } = createFinanceSlice('finInvoices', invoiceService);
 *   dispatch(fetchList({ page: 1, limit: 10, q: 'abc', status: 'issued' }));
 *   const result = await dispatch(runAction({ method: 'cancel', args: [id, reason] }));
 *
 * `runAction` resolves with the response body's `data`; on failure `result.payload` is
 * `{ message, code, details: [{ field, message }], status }`. Only the newest list request is applied,
 * so a slow search response can never overwrite a newer one.
 */
export function createFinanceSlice(name, service) {
  const fetchList = createAsyncThunk(`${name}/list`, async (params, { rejectWithValue }) => {
    try {
      const res = await service.list(params);
      return { data: res.data?.data || [], meta: res.data?.meta || null };
    } catch (err) {
      return rejectWithValue(failure(err, 'Failed to load records'));
    }
  });

  const fetchStats = createAsyncThunk(`${name}/stats`, async (_, { rejectWithValue }) => {
    try {
      if (!service.stats) return [];
      const res = await service.stats();
      return res.data?.data || [];
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
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchList.pending, (state, action) => {
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
          state.stats = action.payload;
        })
        .addCase(fetchStats.rejected, (state, action) => {
          state.statsLoading = false;
          state.statsError = action.payload?.message || 'Failed to load summary';
        });
    },
  });

  return { reducer: slice.reducer, fetchList, fetchStats, runAction, key: name };
}
