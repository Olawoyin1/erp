import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/notifications.service';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await notificationService.unreadCount();
      return data.data.count;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch count');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await notificationService.list(params);
      return { notifications: data.data, meta: data.meta };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to load notifications');
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to mark read');
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllRead();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error?.message || 'Failed to mark all read');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    notifications: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    loading: false,
    error: null,
  },
  reducers: {
    // Allow uiSlice / other slices to push an unread count update
    setUnreadCount(state, action) {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchUnreadCount
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    // fetchNotifications
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.meta = action.payload.meta;
        // Sync unread count from the full list too (page 1 only)
        state.unreadCount = action.payload.notifications.filter((n) => !n.readAt).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // markNotificationRead — flip the local readAt
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const n = state.notifications.find((x) => x._id === action.payload);
      if (n && !n.readAt) {
        n.readAt = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // markAllRead — zero out all
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.notifications.forEach((n) => { if (!n.readAt) n.readAt = new Date().toISOString(); });
      state.unreadCount = 0;
    });
  },
});

export const { setUnreadCount } = notificationsSlice.actions;
export default notificationsSlice.reducer;
