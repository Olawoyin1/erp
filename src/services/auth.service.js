import apiClient from './apiClient';

export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  verifyOtp: (mfaToken, code) =>
    apiClient.post('/auth/verify-otp', { mfaToken, code }),

  resendOtp: (mfaToken) =>
    apiClient.post('/auth/resend-otp', { mfaToken }),

  refresh: (refreshToken) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  logout: (refreshToken) =>
    apiClient.post('/auth/logout', { refreshToken }),

  me: () =>
    apiClient.get('/auth/me'),

  changePassword: (currentPassword, newPassword) =>
    apiClient.patch('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};
