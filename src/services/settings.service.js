import apiClient from './apiClient';

export const settingsService = {
  // ── Own profile and preferences (any signed-in user) ──
  getProfile:    () => apiClient.get('/me/profile'),
  updateProfile: (data) => apiClient.patch('/me/profile', data),

  getMyNotificationPrefs:    () => apiClient.get('/me/notification-preferences'),
  updateMyNotificationPrefs: (data) => apiClient.patch('/me/notification-preferences', data),

  // ── Company settings (core.settings.view / .update); every GET returns the whole settings document ──
  getCompany:    () => apiClient.get('/settings/company'),
  updateCompany: (data) => apiClient.patch('/settings/company', data),

  getApprovals:    () => apiClient.get('/settings/approvals-compliance'),
  updateApprovals: (data) => apiClient.patch('/settings/approvals-compliance', data),

  getFinanceConfiguration:    () => apiClient.get('/settings/finance-configuration'),
  updateFinanceConfiguration: (data) => apiClient.patch('/settings/finance-configuration', data),

  getNotificationPrefs:    () => apiClient.get('/settings/notification-preferences'),
  updateNotificationPrefs: (data) => apiClient.patch('/settings/notification-preferences', data),

  updateMailReplyTo: (data) => apiClient.patch('/settings/mail-reply-to', data),
};

// ─── Legal entities (finance.legalentity.view; writes need core.settings.update) ─
export const legalEntityService = {
  list: (params) => apiClient.get('/legal-entities', { params }),
  create: (data) => apiClient.post('/legal-entities', data),
  update: (id, data) => apiClient.patch(`/legal-entities/${id}`, data),
  activate: (id) => apiClient.post(`/legal-entities/${id}/activate`),
  deactivate: (id) => apiClient.post(`/legal-entities/${id}/deactivate`),
};

// ─── Ledger settings, account mappings and the posting queue ──────────────────
export const financeSettingsService = {
  get: () => apiClient.get('/finance-settings'),
  update: (data) => apiClient.patch('/finance-settings', data),
  seedDefaults: () => apiClient.post('/finance-settings/seed-defaults'),
  postingTasks: (params) => apiClient.get('/finance-settings/posting-tasks', { params }),
  drainPostingTasks: () => apiClient.post('/finance-settings/posting-tasks/drain'),
  retryPostingTask: (id) => apiClient.post(`/finance-settings/posting-tasks/${id}/retry`),
  // Active ledger accounts for the mapping pickers
  accounts: (params) => apiClient.get('/accounts', { params }),
};

export const exchangeRateService = {
  list: (params) => apiClient.get('/exchange-rates', { params }),
  create: (data) => apiClient.post('/exchange-rates', data),
  remove: (id) => apiClient.delete(`/exchange-rates/${id}`),
};

// ─── Statutory payroll configuration (hr.payroll.view / hr.payroll.approve) ───
export const statutoryService = {
  getConfig: () => apiClient.get('/statutory/config'),
  saveVersion: (data) => apiClient.post('/statutory/config', data),
  confirmVersion: (id) => apiClient.post(`/statutory/config/${id}/confirm`),
};

export const holidayService = {
  list: (params) => apiClient.get('/public-holidays', { params }),
  create: (data) => apiClient.post('/public-holidays', data),
  update: (id, data) => apiClient.patch(`/public-holidays/${id}`, data),
  remove: (id) => apiClient.delete(`/public-holidays/${id}`),
};

// ─── Email outbox (core.settings.view / core.settings.update) ─────────────────
export const mailOutboxService = {
  list: (params) => apiClient.get('/mail/outbox', { params }),
  stats: () => apiClient.get('/mail/outbox/stats'),
  retry: (id) => apiClient.post(`/mail/outbox/${id}/retry`),
};
