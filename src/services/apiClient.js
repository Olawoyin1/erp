import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const apiClient = axios.create({ baseURL: BASE_URL, headers: JSON_HEADERS });

// Used only for POST /auth/refresh so the refresh call never goes through the 401 interceptor below.
const refreshClient = axios.create({ baseURL: BASE_URL, headers: JSON_HEADERS });

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken = () => sessionStorage.getItem('accessToken');
export const setAccessToken = (token) => sessionStorage.setItem('accessToken', token);
export const clearAccessToken = () => sessionStorage.removeItem('accessToken');

export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);
export const clearRefreshToken = () => localStorage.removeItem('refreshToken');

export const clearTokens = () => {
  clearAccessToken();
  clearRefreshToken();
};

// ─── Session end ──────────────────────────────────────────────────────────────
const NOTICE_KEY = 'pgsl.authNotice';
const MFA_KEY = 'pgsl.mfa';

/** Message to show on the login screen after a forced sign-out. */
export const peekAuthNotice = () => {
  try {
    return sessionStorage.getItem(NOTICE_KEY);
  } catch {
    return null;
  }
};

export const clearAuthNotice = () => {
  try {
    sessionStorage.removeItem(NOTICE_KEY);
  } catch {
    // nothing stored
  }
};

/**
 * Ends the session from any path (logout button, expired or revoked session, password change):
 * clears both tokens and any pending 2FA step, leaves a one-time notice for the login screen and
 * reloads onto the login page so no data of the previous user stays in memory.
 */
export const endSession = (message) => {
  clearTokens();
  try {
    sessionStorage.removeItem(MFA_KEY);
    if (message) sessionStorage.setItem(NOTICE_KEY, message);
  } catch {
    // storage unavailable: the redirect below still ends the session
  }
  if (window.location.pathname !== '/auth/login') {
    window.location.replace('/auth/login');
  } else {
    window.location.reload();
  }
};

// ─── Refresh (one at a time, refresh tokens rotate and work once) ─────────────
let refreshPromise = null;

const storeTokens = (data) => {
  setAccessToken(data.data.accessToken);
  setRefreshToken(data.data.refreshToken);
  return data.data.accessToken;
};

const NO_REFRESH_TOKEN = 'NO_REFRESH_TOKEN';

async function requestNewTokens() {
  const sent = getRefreshToken();
  if (!sent) {
    const err = new Error('No refresh token');
    err.code = NO_REFRESH_TOKEN;
    throw err;
  }
  try {
    const { data } = await refreshClient.post('/auth/refresh', { refreshToken: sent });
    return storeTokens(data);
  } catch (err) {
    // Another tab may have rotated the token a moment ago: its new token is in localStorage.
    const current = getRefreshToken();
    if (err.response && current && current !== sent) {
      const { data } = await refreshClient.post('/auth/refresh', { refreshToken: current });
      return storeTokens(data);
    }
    throw err;
  }
}

/** Single-flight: concurrent callers share one refresh call, so a rotated token is never reused. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ─── Request interceptor: attach the access token ─────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Public auth routes answer 401 for reasons that are not an expired session.
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/verify-otp',
  '/auth/resend-otp',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// The server says the session itself is over (role change, password change, suspension): refreshing cannot help.
const TERMINAL_401 = /session has ended|account is not active/i;

const SESSION_EXPIRED = 'Your session has expired. Please sign in again.';

// ─── Response interceptor: 401 handling ──────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) return Promise.reject(error);

    const url = original.url || '';
    if (PUBLIC_AUTH_PATHS.some((path) => url.includes(path))) return Promise.reject(error);

    const serverMessage = error.response?.data?.error?.message || '';
    if (TERMINAL_401.test(serverMessage)) {
      endSession(serverMessage);
      return Promise.reject(error);
    }

    if (original._retried) {
      endSession(SESSION_EXPIRED);
      return Promise.reject(error);
    }
    original._retried = true;

    const sentWith = original.headers?.Authorization;
    const current = getAccessToken();
    // A refresh finished after this request left: just retry with the new token.
    const alreadyRefreshed = !!(current && sentWith && sentWith !== `Bearer ${current}`);
    if (!alreadyRefreshed) {
      try {
        await refreshAccessToken();
      } catch (refreshError) {
        // A network failure leaves the session alone (the user may just be offline).
        if (refreshError?.response || refreshError?.code === NO_REFRESH_TOKEN) {
          const status = refreshError.response?.status;
          const message =
            status === 403 ? refreshError.response.data?.error?.message || SESSION_EXPIRED : SESSION_EXPIRED;
          endSession(message);
        }
        return Promise.reject(error);
      }
    }
    return apiClient(original);
  },
);

export default apiClient;
