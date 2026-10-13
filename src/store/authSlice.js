import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/auth.service';
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
} from '../services/apiClient';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await authService.login(email, password);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Login failed' });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ mfaToken, code }, { rejectWithValue }) => {
    try {
      const res = await authService.verifyOtp(mfaToken, code);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'OTP verification failed' });
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.me();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || { message: 'Failed to fetch user' });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) await authService.logout(refreshToken);
    } catch {
      // Always clear locally even if the server call fails
    } finally {
      clearTokens();
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    roles: [],
    permissions: [],
    // Pending 2FA state (held only while on the OTP screen)
    mfaToken: null,
    isAuthenticated: false,
    loading: false,
    bootstrapping: true, // true while checking session on app load
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearMfa(state) {
      state.mfaToken = null;
    },
    setBootstrapping(state, action) {
      state.bootstrapping = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;

        if (data.mfaRequired) {
          // 2FA branch — store mfaToken temporarily, do NOT set authenticated yet
          state.mfaToken = data.mfaToken;
        } else {
          // Direct login — store tokens and user
          setAccessToken(data.accessToken);
          setRefreshToken(data.refreshToken);
          state.user = data.user;
          state.isAuthenticated = true;
          state.mfaToken = null;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Verify OTP ─────────────────────────────────────────────────────────
    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        state.user = data.user;
        state.isAuthenticated = true;
        state.mfaToken = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Fetch current user (bootstrap) ─────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.bootstrapping = false;
        state.user = action.payload.user;
        state.roles = action.payload.roles;
        state.permissions = action.payload.permissions;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.bootstrapping = false;
        state.isAuthenticated = false;
        state.user = null;
        clearTokens();
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.mfaToken = null;
      state.bootstrapping = false;
    });
  },
});

export const { clearError, clearMfa, setBootstrapping } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.user;
export const selectPermissions = (state) => state.auth.permissions;
export const selectRoles = (state) => state.auth.roles;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectMfaToken = (state) => state.auth.mfaToken;
export const selectBootstrapping = (state) => state.auth.bootstrapping;

export default authSlice.reducer;
