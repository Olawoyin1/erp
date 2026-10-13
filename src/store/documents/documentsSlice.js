import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentService } from '../../services/documents.service';
import { apiError } from '../../services/apiHelpers';

const emptyEntry = () => ({ items: [], meta: null, stats: [], loading: true, error: '', requestId: null });

/** `key` identifies the page (a module such as "hr", or "register" for the cross-module EDMS list). */
export const fetchDocuments = createAsyncThunk('moduleDocuments/fetch', async ({ key, params }, { rejectWithValue }) => {
  try {
    const res = await documentService.list(params);
    return { key, items: res.data.data, meta: res.data.meta };
  } catch (err) {
    return rejectWithValue({ key, message: apiError(err, 'Failed to load documents') });
  }
});

export const fetchDocumentStats = createAsyncThunk('moduleDocuments/stats', async ({ key, module }, { rejectWithValue }) => {
  try {
    const res = await documentService.stats(module);
    return { key, stats: res.data.data };
  } catch {
    return rejectWithValue({ key });
  }
});

const entryOf = (state, key) => {
  if (!state[key]) state[key] = emptyEntry();
  return state[key];
};

const documentsSlice = createSlice({
  name: 'moduleDocuments',
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state, action) => {
        const entry = entryOf(state, action.meta.arg.key);
        entry.loading = true;
        entry.error = '';
        entry.requestId = action.meta.requestId;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        const entry = entryOf(state, action.payload.key);
        if (entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.items = action.payload.items;
        entry.meta = action.payload.meta;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        const entry = entryOf(state, action.meta.arg.key);
        if (entry.requestId !== action.meta.requestId) return;
        entry.loading = false;
        entry.error = action.payload?.message || 'Failed to load documents';
      })
      .addCase(fetchDocumentStats.fulfilled, (state, action) => {
        entryOf(state, action.payload.key).stats = action.payload.stats;
      })
      .addCase(fetchDocumentStats.rejected, (state, action) => {
        if (action.payload?.key) entryOf(state, action.payload.key).stats = [];
      });
  },
});

export const selectModuleDocuments = (key) => (state) => state.moduleDocuments[key];
export default documentsSlice.reducer;
