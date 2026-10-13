import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService } from '../../services/dashboard.service';
import { apiError } from '../../services/apiHelpers';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getOverview();
      return res.data.data;
    } catch (err) {
      return rejectWithValue({ message: apiError(err, 'Failed to load the dashboard'), status: err.response?.status });
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchActivity',
  async ({ page = 1, limit = 4 } = {}, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getActivity(page, limit);
      return { data: res.data.data, meta: res.data.meta };
    } catch (err) {
      return rejectWithValue({ message: apiError(err, 'Failed to load recent activity'), status: err.response?.status });
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    overview: null,        // { tiles, activeContracts, activeProjectsCostVsBudget }
    activity: [],
    activityMeta: null,
    overviewLoading: false,
    activityLoading: false,
    overviewError: null,
    activityError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.payload;
      });

    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.activityLoading = true;
        state.activityError = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.activityLoading = false;
        state.activity = action.payload.data;
        state.activityMeta = action.payload.meta;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.activityLoading = false;
        state.activityError = action.payload;
      });
  },
});

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectDashboardOverview = (state) => state.dashboard.overview;
export const selectDashboardActivity = (state) => state.dashboard.activity;
export const selectOverviewLoading = (state) => state.dashboard.overviewLoading;
export const selectActivityLoading = (state) => state.dashboard.activityLoading;
export const selectOverviewError = (state) => state.dashboard.overviewError;
export const selectActivityError = (state) => state.dashboard.activityError;

export default dashboardSlice.reducer;
