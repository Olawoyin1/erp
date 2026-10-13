import apiClient from './apiClient';

export const settingsService = {
  getProfile:    () => apiClient.get('/me/profile'),
  updateProfile: (data) => apiClient.patch('/me/profile', data),

  getMyNotificationPrefs:    () => apiClient.get('/me/notification-preferences'),
  updateMyNotificationPrefs: (data) => apiClient.patch('/me/notification-preferences', data),

  getCompany:    () => apiClient.get('/settings/company'),
  updateCompany: (data) => apiClient.patch('/settings/company', data),

  getNotificationPrefs:    () => apiClient.get('/settings/notification-preferences'),
  updateNotificationPrefs: (data) => apiClient.patch('/settings/notification-preferences', data),

  updateMailReplyTo: (data) => apiClient.patch('/settings/mail-reply-to', data),
};
