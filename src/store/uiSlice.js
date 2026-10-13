import { createSlice } from '@reduxjs/toolkit';

// Global UI state — toasts, notification badge count
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    unreadNotificationCount: 0,
  },
  reducers: {
    setUnreadCount(state, action) {
      state.unreadNotificationCount = action.payload;
    },
    decrementUnreadCount(state) {
      if (state.unreadNotificationCount > 0) state.unreadNotificationCount -= 1;
    },
    clearUnreadCount(state) {
      state.unreadNotificationCount = 0;
    },
  },
});

export const { setUnreadCount, decrementUnreadCount, clearUnreadCount } = uiSlice.actions;
export const selectUnreadCount = (state) => state.ui.unreadNotificationCount;
export default uiSlice.reducer;
