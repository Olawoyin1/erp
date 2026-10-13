import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/auth.service';
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getRefreshToken,
  endSession,
} from '../services/apiClient';

const MFA_KEY = 'pgsl.mfa';

const readMfa = () => {
  try {
    return JSON.parse(sessionStorage.getItem(MFA_KEY)) || null;
  } catch {
    return null;
  }
};
const saveMfa = (value) => {
  try {
    sessionStorage.setItem(MFA_KEY, JSON.stringify(value));
  } catch {
    // the OTP screen then only survives until the page is refreshed
  }
};
const dropMfa = () => {
  try {
    sessionStorage.removeItem(MFA_KEY);
  } catch {
    // nothing stored
  }
};

/** Normalises any failure (axios error, thrown payload) to `{ message, code?, status?, details? }`. */
const toPayload = (err, fallback) => {
  if (err?.response) {
    const apiErr = err.response.data?.error || {};
    return {
      message: apiErr.message || fallback,
      code: apiErr.code,
      details: apiErr.details,
      status: err.response.status,
    };
  }
  if (err?.message && (err.status || err.code)) return err;
  if (err?.request || err?.code === 'ERR_NETWORK') {
    return { message: 'Cannot reach the server. Check your connection and try again.', network: true };
  }
  return { message: err?.message || fallback };
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.me();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(toPayload(err, 'Failed to load your account'));
    }
  },
);

/** Stores the tokens, then loads the real user, roles and permissions before anything is shown. */
async function completeSignIn(data, dispatch) {
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  try {
    await dispatch(fetchCurrentUser()).unwrap();
  } catch (err) {
    clearTokens();
    throw err;
  }
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const res = await authService.login(email, password);
      const data = res.data.data;
      if (data.mfaRequired) {
        const pending = { mfaToken: data.mfaToken, email };
        saveMfa(pending);
        return { mfaRequired: true, ...pending };
      }
      await completeSignIn(data, dispatch);
      return { mfaRequired: false };
    } catch (err) {
      return rejectWithValue(toPayload(err, 'Login failed'));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ mfaToken, code }, { dispatch, rejectWithValue }) => {
    try {
      const res = await authService.verifyOtp(mfaToken, code);
      await completeSignIn(res.data.data, dispatch);
      dropMfa();
      return true;
    } catch (err) {
      return rejectWithValue(toPayload(err, 'Verification failed'));
    }
  },
);

/**
 * Revokes the refresh token on the server, then clears everything and reloads onto the login page.
 * An optional message (for example the idle timeout) is shown on the login page.
 */
export const logoutUser = createAsyncThunk('auth/logout', async (message) => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await authService.logout(refreshToken);
  } catch {
    // the session is cleared locally even when the server cannot be reached
  }
  endSession(typeof message === 'string' ? message : undefined);
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const pendingMfa = readMfa();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    roles: [],
    permissions: [],
    sessionTimeoutMinutes: null,
    mfaToken: pendingMfa?.mfaToken || null,
    mfaEmail: pendingMfa?.email || null,
    isAuthenticated: false,
    loading: false,
    bootstrapping: true,
    bootstrapError: null,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearMfa(state) {
      state.mfaToken = null;
      state.mfaEmail = null;
      dropMfa();
    },
    setBootstrapping(state, action) {
      state.bootstrapping = action.payload;
    },
    retryBootstrap(state) {
      state.bootstrapping = true;
      state.bootstrapError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.mfaRequired) {
          state.mfaToken = action.payload.mfaToken;
          state.mfaEmail = action.payload.email;
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Login failed' };
      });

    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.mfaToken = null;
        state.mfaEmail = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Verification failed' };
      });

    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.bootstrapping = false;
        state.bootstrapError = null;
        state.user = action.payload.user;
        state.roles = action.payload.roles || [];
        state.permissions = action.payload.permissions || [];
        state.sessionTimeoutMinutes = action.payload.sessionTimeoutMinutes || null;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.bootstrapping = false;
        state.isAuthenticated = false;
        state.user = null;
        state.roles = [];
        state.permissions = [];
        const payload = action.payload || {};
        // A rejected token ends the session (the api client already redirected); a network or server
        // failure keeps the tokens so the user can retry instead of being signed out.
        if (payload.status === 401 || payload.status === 403) {
          clearTokens();
        } else {
          state.bootstrapError = payload.message || 'Could not load your account';
        }
      });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.roles = [];
      state.permissions = [];
      state.isAuthenticated = false;
      state.mfaToken = null;
      state.mfaEmail = null;
      state.bootstrapping = false;
    });
  },
});

export const { clearError, clearMfa, setBootstrapping, retryBootstrap } = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCurrentUser = (state) => state.auth.user;
export const selectPermissions = (state) => state.auth.permissions;
export const selectRoles = (state) => state.auth.roles;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectMfaToken = (state) => state.auth.mfaToken;
export const selectMfaEmail = (state) => state.auth.mfaEmail;
export const selectBootstrapping = (state) => state.auth.bootstrapping;
export const selectBootstrapError = (state) => state.auth.bootstrapError;
export const selectSessionTimeout = (state) => state.auth.sessionTimeoutMinutes;

export default authSlice.reducer;
