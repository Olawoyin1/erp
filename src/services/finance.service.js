import apiClient from './apiClient';
import { idempotencyHeaders } from './apiHelpers';

export const legalEntityService = {
  list: () => apiClient.get('/legal-entities'),
  get:  (id) => apiClient.get(`/legal-entities/${id}`),
};

export const accountService = {
  list:       (params) => apiClient.get('/accounts', { params }),
  create:     (data)   => apiClient.post('/accounts', data),
  get:        (id)     => apiClient.get(`/accounts/${id}`),
  update:     (id, data) => apiClient.patch(`/accounts/${id}`, data),
  deactivate: (id)     => apiClient.post(`/accounts/${id}/deactivate`),
  activate:   (id)     => apiClient.post(`/accounts/${id}/activate`),
};

export const journalEntryService = {
  list:    (params) => apiClient.get('/journal-entries', { params }),
  stats:   ()       => apiClient.get('/journal-entries/stats'),
  create:  (data)   => apiClient.post('/journal-entries', data, idempotencyHeaders()),
  get:     (id)     => apiClient.get(`/journal-entries/${id}`),
  update:  (id, data) => apiClient.patch(`/journal-entries/${id}`, data),
  submit:  (id)     => apiClient.post(`/journal-entries/${id}/submit`),
  approve: (id)     => apiClient.post(`/journal-entries/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/journal-entries/${id}/reject`, { reason }),
  post:    (id)     => apiClient.post(`/journal-entries/${id}/post`, {}, idempotencyHeaders()),
  reverse: (id, reason) => apiClient.post(`/journal-entries/${id}/reverse`, { reason }, idempotencyHeaders()),
};

export const budgetService = {
  list:    (params) => apiClient.get('/budgets', { params }),
  stats:   ()       => apiClient.get('/budgets/stats'),
  create:  (data)   => apiClient.post('/budgets', data),
  get:     (id)     => apiClient.get(`/budgets/${id}`),
  update:  (id, data) => apiClient.patch(`/budgets/${id}`, data),
  submit:  (id)     => apiClient.post(`/budgets/${id}/submit`),
  approve: (id)     => apiClient.post(`/budgets/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/budgets/${id}/reject`, { reason }),
  close:   (id)     => apiClient.post(`/budgets/${id}/close`),
};

export const invoiceService = {
  list:           (params) => apiClient.get('/invoices', { params }),
  stats:          ()       => apiClient.get('/invoices/stats'),
  create:         (data)   => apiClient.post('/invoices', data, idempotencyHeaders()),
  get:            (id)     => apiClient.get(`/invoices/${id}`),
  update:         (id, data) => apiClient.patch(`/invoices/${id}`, data),
  pdf:            (id)     => apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  recordPayment:  (id, data) => apiClient.post(`/invoices/${id}/record-payment`, data, idempotencyHeaders()),
  sendReminder:   (id)     => apiClient.post(`/invoices/${id}/send-reminder`),
  cancel:         (id, reason) => apiClient.post(`/invoices/${id}/cancel`, { reason }),
};

export const payableService = {
  list:          (params) => apiClient.get('/payables', { params }),
  stats:         ()       => apiClient.get('/payables/stats'),
  create:        (data)   => apiClient.post('/payables', data, idempotencyHeaders()),
  get:           (id)     => apiClient.get(`/payables/${id}`),
  update:        (id, data) => apiClient.patch(`/payables/${id}`, data),
  approve:       (id)     => apiClient.post(`/payables/${id}/approve`),
  releaseHold:   (id)     => apiClient.post(`/payables/${id}/release-hold`),
  recordPayment: (id, data) => apiClient.post(`/payables/${id}/record-payment`, data, idempotencyHeaders()),
  void:          (id, reason) => apiClient.post(`/payables/${id}/void`, { reason }),
};

export const contractService = {
  list:    (params) => apiClient.get('/contracts', { params }),
  stats:   ()       => apiClient.get('/contracts/stats'),
  create:  (data)   => apiClient.post('/contracts', data),
  get:     (id)     => apiClient.get(`/contracts/${id}`),
  update:  (id, data) => apiClient.patch(`/contracts/${id}`, data),
  delete:  (id)     => apiClient.delete(`/contracts/${id}`),
};

export const contractVariationService = {
  list:    (params) => apiClient.get('/contract-variations', { params }),
  create:  (data)   => apiClient.post('/contract-variations', data),
  get:     (id)     => apiClient.get(`/contract-variations/${id}`),
  update:  (id, data) => apiClient.patch(`/contract-variations/${id}`, data),
};

export const contractClaimService = {
  list:    (params) => apiClient.get('/contract-claims', { params }),
  create:  (data)   => apiClient.post('/contract-claims', data),
  get:     (id)     => apiClient.get(`/contract-claims/${id}`),
  update:  (id, data) => apiClient.patch(`/contract-claims/${id}`, data),
  delete:  (id)     => apiClient.delete(`/contract-claims/${id}`),
};

export const commercialRiskService = {
  list:    (params) => apiClient.get('/commercial-risks', { params }),
  stats:   ()       => apiClient.get('/commercial-risks/stats'),
  create:  (data)   => apiClient.post('/commercial-risks', data),
  get:     (id)     => apiClient.get(`/commercial-risks/${id}`),
  update:  (id, data) => apiClient.patch(`/commercial-risks/${id}`, data),
  delete:  (id)     => apiClient.delete(`/commercial-risks/${id}`),
};

export const insurancePolicyService = {
  list:    (params) => apiClient.get('/insurance-policies', { params }),
  stats:   ()       => apiClient.get('/insurance-policies/stats'),
  create:  (data)   => apiClient.post('/insurance-policies', data),
  get:     (id)     => apiClient.get(`/insurance-policies/${id}`),
  update:  (id, data) => apiClient.patch(`/insurance-policies/${id}`, data),
  renew:   (id, data) => apiClient.post(`/insurance-policies/${id}/renew`, data),
};

export const bankReconciliationService = {
  list:    (params) => apiClient.get('/bank-reconciliations', { params }),
  create:  (data)   => apiClient.post('/bank-reconciliations', data),
  get:     (id)     => apiClient.get(`/bank-reconciliations/${id}`),
  update:  (id, data) => apiClient.patch(`/bank-reconciliations/${id}`, data),
};

export const taxRecordService = {
  list:    (params) => apiClient.get('/tax-records', { params }),
  stats:   ()       => apiClient.get('/tax-records/stats'),
  create:  (data)   => apiClient.post('/tax-records', data),
  get:     (id)     => apiClient.get(`/tax-records/${id}`),
  update:  (id, data) => apiClient.patch(`/tax-records/${id}`, data),
  delete:  (id)     => apiClient.delete(`/tax-records/${id}`),
  pay:     (id, data) => apiClient.post(`/tax-records/${id}/pay`, data, idempotencyHeaders()),
};

export const financeFormService = {
  list:    (params) => apiClient.get('/finance-forms', { params }),
  stats:   ()       => apiClient.get('/finance-forms/stats'),
  create:  (data)   => apiClient.post('/finance-forms', data, idempotencyHeaders()),
  get:     (id)     => apiClient.get(`/finance-forms/${id}`),
  update:  (id, data) => apiClient.patch(`/finance-forms/${id}`, data),
  delete:  (id)     => apiClient.delete(`/finance-forms/${id}`),
  submit:  (id)     => apiClient.post(`/finance-forms/${id}/submit`),
  approve: (id)     => apiClient.post(`/finance-forms/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/finance-forms/${id}/reject`, { reason }),
};

export const ledgerService = {
  periods: (year) => apiClient.get('/ledger/periods', { params: year ? { year } : {} }),
  close:   (key)  => apiClient.post(`/ledger/periods/${key}/close`),
  reopen:  (key)  => apiClient.post(`/ledger/periods/${key}/reopen`),
  lines:   (params) => apiClient.get('/ledger/lines', { params }),
  recover: ()     => apiClient.post('/ledger/recover'),
};

export const financeSettingsService = {
  get:          () => apiClient.get('/finance-settings'),
  update:       (data) => apiClient.patch('/finance-settings', data),
  seedDefaults: () => apiClient.post('/finance-settings/seed-defaults'),
  postingTasks: () => apiClient.get('/finance-settings/posting-tasks'),
  drainTasks:   () => apiClient.post('/finance-settings/posting-tasks/drain'),
  retryTask:    (id) => apiClient.post(`/finance-settings/posting-tasks/${id}/retry`),
};

export const exchangeRateService = {
  list:   (currency) => apiClient.get('/exchange-rates', { params: currency ? { currency } : {} }),
  create: (data) => apiClient.post('/exchange-rates', data),
  delete: (id) => apiClient.delete(`/exchange-rates/${id}`),
};

export const financeReportService = {
  get: (params) => apiClient.get('/accounts-finance/reports', { params }),
};
