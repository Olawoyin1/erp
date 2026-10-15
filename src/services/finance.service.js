import apiClient from './apiClient';
import { idempotencyHeaders } from './apiHelpers';

const attachmentForm = (file) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

/** Read-only pick-lists for the finance forms (clients, projects, vendors, departments, orders, receipts). */
export const financeLookupService = {
  clients:        (params) => apiClient.get('/finance-lookups/clients', { params }),
  projects:       (params) => apiClient.get('/finance-lookups/projects', { params }),
  vendors:        (params) => apiClient.get('/finance-lookups/vendors', { params }),
  departments:    ()       => apiClient.get('/finance-lookups/departments'),
  purchaseOrders: (params) => apiClient.get('/finance-lookups/purchase-orders', { params }),
  goodsReceipts:  (params) => apiClient.get('/finance-lookups/goods-receipts', { params }),
};

export const legalEntityService = {
  list: (params) => apiClient.get('/legal-entities', { params }),
  get:  (id) => apiClient.get(`/legal-entities/${id}`),
};

export const accountService = {
  list:       (params) => apiClient.get('/accounts', { params }),
  stats:      ()       => apiClient.get('/accounts/stats'),
  history:    (id)     => apiClient.get(`/accounts/${id}/history`),
  create:     (data)   => apiClient.post('/accounts', data),
  get:        (id)     => apiClient.get(`/accounts/${id}`),
  update:     (id, data) => apiClient.patch(`/accounts/${id}`, data),
  deactivate: (id)     => apiClient.post(`/accounts/${id}/deactivate`),
  activate:   (id)     => apiClient.post(`/accounts/${id}/activate`),
};

export const journalEntryService = {
  attachments:        (id) => apiClient.get(`/journal-entries/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/journal-entries/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/journal-entries/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/journal-entries/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/journal-entries/${id}/history`),
  list:    (params) => apiClient.get('/journal-entries', { params }),
  stats:   ()       => apiClient.get('/journal-entries/stats'),
  pdf:     (id)     => apiClient.get(`/journal-entries/${id}/pdf`, { responseType: 'blob' }),
  create:  (data)   => apiClient.post('/journal-entries', data, idempotencyHeaders()),
  get:     (id)     => apiClient.get(`/journal-entries/${id}`),
  update:  (id, data) => apiClient.patch(`/journal-entries/${id}`, data),
  submit:  (id)     => apiClient.post(`/journal-entries/${id}/submit`),
  approve: (id)     => apiClient.post(`/journal-entries/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/journal-entries/${id}/reject`, { reason }),
  post:    (id)     => apiClient.post(`/journal-entries/${id}/post`, {}, idempotencyHeaders()),
  reverse: (id, data) => apiClient.post(`/journal-entries/${id}/reverse`, data, idempotencyHeaders()),
};

export const budgetService = {
  attachments:        (id) => apiClient.get(`/budgets/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/budgets/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/budgets/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/budgets/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/budgets/${id}/history`),
  list:    (params) => apiClient.get('/budgets', { params }),
  stats:   ()       => apiClient.get('/budgets/stats'),
  pdf:     (id)     => apiClient.get(`/budgets/${id}/pdf`, { responseType: 'blob' }),
  remove:  (id, reason) => apiClient.delete(`/budgets/${id}`, { data: reason ? { reason } : {} }),
  create:  (data)   => apiClient.post('/budgets', data),
  get:     (id)     => apiClient.get(`/budgets/${id}`),
  update:  (id, data) => apiClient.patch(`/budgets/${id}`, data),
  submit:  (id)     => apiClient.post(`/budgets/${id}/submit`),
  approve: (id)     => apiClient.post(`/budgets/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/budgets/${id}/reject`, { reason }),
  close:   (id, reason) => apiClient.post(`/budgets/${id}/close`, reason ? { reason } : {}),
};

export const invoiceService = {
  attachments:        (id) => apiClient.get(`/invoices/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/invoices/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/invoices/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/invoices/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/invoices/${id}/history`),
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
  attachments:        (id) => apiClient.get(`/payables/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/payables/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/payables/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/payables/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/payables/${id}/history`),
  list:          (params) => apiClient.get('/payables', { params }),
  stats:         ()       => apiClient.get('/payables/stats'),
  pdf:           (id)     => apiClient.get(`/payables/${id}/pdf`, { responseType: 'blob' }),
  create:        (data)   => apiClient.post('/payables', data, idempotencyHeaders()),
  get:           (id)     => apiClient.get(`/payables/${id}`),
  update:        (id, data) => apiClient.patch(`/payables/${id}`, data),
  approve:       (id)     => apiClient.post(`/payables/${id}/approve`),
  releaseHold:   (id, reason) => apiClient.post(`/payables/${id}/release-hold`, { reason }),
  recordPayment: (id, data) => apiClient.post(`/payables/${id}/record-payment`, data, idempotencyHeaders()),
  void:          (id, reason) => apiClient.post(`/payables/${id}/void`, { reason }),
};

export const contractService = {
  attachments:        (id) => apiClient.get(`/contracts/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/contracts/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/contracts/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/contracts/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/contracts/${id}/history`),
  list:         (params) => apiClient.get('/contracts', { params }),
  stats:        ()       => apiClient.get('/contracts/stats'),
  pdf:          (id)     => apiClient.get(`/contracts/${id}/pdf`, { responseType: 'blob' }),
  create:       (data)   => apiClient.post('/contracts', data),
  get:          (id)     => apiClient.get(`/contracts/${id}`),
  update:       (id, data) => apiClient.patch(`/contracts/${id}`, data),
  submitReview: (id)     => apiClient.post(`/contracts/${id}/submit-review`),
  markSigned:   (id)     => apiClient.post(`/contracts/${id}/mark-signed`),
  markActive:   (id)     => apiClient.post(`/contracts/${id}/mark-active`),
  close:        (id, reason) => apiClient.post(`/contracts/${id}/close`, { reason }),
  remove:       (id, reason) => apiClient.delete(`/contracts/${id}`, { data: { reason } }),
};

export const contractVariationService = {
  attachments:        (id) => apiClient.get(`/contract-variations/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/contract-variations/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/contract-variations/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/contract-variations/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/contract-variations/${id}/history`),
  list:        (params) => apiClient.get('/contract-variations', { params }),
  pdf:         (id)     => apiClient.get(`/contract-variations/${id}/pdf`, { responseType: 'blob' }),
  remove:      (id, reason) => apiClient.delete(`/contract-variations/${id}`, { data: reason ? { reason } : {} }),
  create:      (data)   => apiClient.post('/contract-variations', data),
  get:         (id)     => apiClient.get(`/contract-variations/${id}`),
  update:      (id, data) => apiClient.patch(`/contract-variations/${id}`, data),
  submit:      (id)     => apiClient.post(`/contract-variations/${id}/submit`),
  approve:     (id)     => apiClient.post(`/contract-variations/${id}/approve`),
  reject:      (id, reason) => apiClient.post(`/contract-variations/${id}/reject`, { reason }),
  incorporate: (id)     => apiClient.post(`/contract-variations/${id}/incorporate`),
};

export const contractClaimService = {
  attachments:        (id) => apiClient.get(`/contract-claims/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/contract-claims/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/contract-claims/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/contract-claims/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/contract-claims/${id}/history`),
  list:    (params) => apiClient.get('/contract-claims', { params }),
  pdf:     (id)     => apiClient.get(`/contract-claims/${id}/pdf`, { responseType: 'blob' }),
  create:  (data)   => apiClient.post('/contract-claims', data),
  get:     (id)     => apiClient.get(`/contract-claims/${id}`),
  update:  (id, data) => apiClient.patch(`/contract-claims/${id}`, data),
  submit:  (id)     => apiClient.post(`/contract-claims/${id}/submit`),
  approve: (id)     => apiClient.post(`/contract-claims/${id}/approve`),
  reject:  (id, reason) => apiClient.post(`/contract-claims/${id}/reject`, { reason }),
  settle:  (id)     => apiClient.post(`/contract-claims/${id}/settle`),
  remove:  (id, reason) => apiClient.delete(`/contract-claims/${id}`, { data: { reason } }),
};

export const commercialRiskService = {
  attachments:        (id) => apiClient.get(`/commercial-risks/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/commercial-risks/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/commercial-risks/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/commercial-risks/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/commercial-risks/${id}/history`),
  list:        (params) => apiClient.get('/commercial-risks', { params }),
  stats:       ()       => apiClient.get('/commercial-risks/stats'),
  create:      (data)   => apiClient.post('/commercial-risks', data),
  get:         (id)     => apiClient.get(`/commercial-risks/${id}`),
  update:      (id, data) => apiClient.patch(`/commercial-risks/${id}`, data),
  underReview: (id)     => apiClient.post(`/commercial-risks/${id}/under-review`),
  mitigate:    (id)     => apiClient.post(`/commercial-risks/${id}/mitigate`),
  close:       (id, reason) => apiClient.post(`/commercial-risks/${id}/close`, { reason }),
  remove:      (id, reason) => apiClient.delete(`/commercial-risks/${id}`, { data: { reason } }),
};

export const insurancePolicyService = {
  attachments:        (id) => apiClient.get(`/insurance-policies/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/insurance-policies/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/insurance-policies/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/insurance-policies/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/insurance-policies/${id}/history`),
  list:    (params) => apiClient.get('/insurance-policies', { params }),
  stats:   ()       => apiClient.get('/insurance-policies/stats'),
  create:  (data)   => apiClient.post('/insurance-policies', data),
  get:     (id)     => apiClient.get(`/insurance-policies/${id}`),
  update:  (id, data) => apiClient.patch(`/insurance-policies/${id}`, data),
  renew:   (id, data) => apiClient.post(`/insurance-policies/${id}/renew`, data),
};

export const bankReconciliationService = {
  attachments:        (id) => apiClient.get(`/bank-reconciliations/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/bank-reconciliations/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/bank-reconciliations/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/bank-reconciliations/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/bank-reconciliations/${id}/history`),
  list:          (params) => apiClient.get('/bank-reconciliations', { params }),
  stats:         ()       => apiClient.get('/bank-reconciliations/stats'),
  create:        (data)   => apiClient.post('/bank-reconciliations', data),
  get:           (id)     => apiClient.get(`/bank-reconciliations/${id}`),
  update:        (id, data) => apiClient.patch(`/bank-reconciliations/${id}`, data),
  ledgerLines:   (id)     => apiClient.get(`/bank-reconciliations/${id}/ledger-lines`),
  match:         (id, lineIds, matched = true) => apiClient.post(`/bank-reconciliations/${id}/match`, { lineIds, matched }),
  autoMatch:     (id)     => apiClient.post(`/bank-reconciliations/${id}/auto-match`),
  markReconciled: (id)    => apiClient.post(`/bank-reconciliations/${id}/mark-reconciled`),
  submitReview:  (id)     => apiClient.post(`/bank-reconciliations/${id}/submit-review`),
};

export const taxRecordService = {
  attachments:        (id) => apiClient.get(`/tax-records/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/tax-records/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/tax-records/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/tax-records/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/tax-records/${id}/history`),
  list:          (params) => apiClient.get('/tax-records', { params }),
  stats:         ()       => apiClient.get('/tax-records/stats'),
  create:        (data)   => apiClient.post('/tax-records', data),
  get:           (id)     => apiClient.get(`/tax-records/${id}`),
  update:        (id, data) => apiClient.patch(`/tax-records/${id}`, data),
  remove:        (id, reason) => apiClient.delete(`/tax-records/${id}`, { data: { reason } }),
  submitFiling:  (id)     => apiClient.post(`/tax-records/${id}/submit-filing`),
  markFiled:     (id)     => apiClient.post(`/tax-records/${id}/mark-filed`),
  recordPayment: (id, data) => apiClient.post(`/tax-records/${id}/record-payment`, data || {}, idempotencyHeaders()),
};

export const financeFormService = {
  attachments:        (id) => apiClient.get(`/finance-forms/${id}/attachments`),
  uploadAttachment:   (id, file) => apiClient.post(`/finance-forms/${id}/attachments`, attachmentForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/finance-forms/${id}/attachments/${attachmentId}/download`),
  removeAttachment:   (id, attachmentId) => apiClient.delete(`/finance-forms/${id}/attachments/${attachmentId}`),
  history:            (id) => apiClient.get(`/finance-forms/${id}/history`),
  list:    (params) => apiClient.get('/finance-forms', { params }),
  stats:   ()       => apiClient.get('/finance-forms/stats'),
  create:  (data)   => apiClient.post('/finance-forms', data, idempotencyHeaders()),
  get:     (id)     => apiClient.get(`/finance-forms/${id}`),
  update:  (id, data) => apiClient.patch(`/finance-forms/${id}`, data),
  remove:  (id, reason) => apiClient.delete(`/finance-forms/${id}`, { data: { reason } }),
  submit:  (id)     => apiClient.post(`/finance-forms/${id}/submit`),
  approve: (id)     => apiClient.post(`/finance-forms/${id}/approve`, {}, idempotencyHeaders()),
  reject:  (id, reason) => apiClient.post(`/finance-forms/${id}/reject`, { reason }),
};

export const ledgerService = {
  periods: (year) => apiClient.get('/ledger/periods', { params: year ? { year } : {} }),
  close:   (key)  => apiClient.post(`/ledger/periods/${key}/close`),
  reopen:  (key, reason) => apiClient.post(`/ledger/periods/${key}/reopen`, { reason }),
  lines:   (params) => apiClient.get('/ledger/lines', { params }),
  recover: ()     => apiClient.post('/ledger/recover'),
};

export const financeSettingsService = {
  get:          () => apiClient.get('/finance-settings'),
  update:       (data) => apiClient.patch('/finance-settings', data),
  seedDefaults: () => apiClient.post('/finance-settings/seed-defaults'),
  postingTasks: (params) => apiClient.get('/finance-settings/posting-tasks', { params }),
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
  /** `format` 'xlsx' (every block as a sheet) or 'csv' (one `section`: summary, cash_flow, departments, projects). */
  download: (params, format = 'xlsx', section) => apiClient.get('/accounts-finance/reports', {
    params: { ...params, format, ...(section ? { section } : {}) },
    responseType: 'blob',
  }),
};

/** Each statement takes `(params, format)`: `format` 'csv', 'xlsx' or 'pdf' downloads a file (blob), otherwise JSON. */
const statementConfig = (params, format) => ({ params: format ? { ...params, format } : params, ...(format ? { responseType: 'blob' } : {}) });

export const financialStatementService = {
  trialBalance:    (params, format) => apiClient.get('/financial-statements/trial-balance', statementConfig(params, format)),
  incomeStatement: (params, format) => apiClient.get('/financial-statements/income-statement', statementConfig(params, format)),
  balanceSheet:    (params, format) => apiClient.get('/financial-statements/balance-sheet', statementConfig(params, format)),
  cashFlow:        (params, format) => apiClient.get('/financial-statements/cash-flow', statementConfig(params, format)),
  agedReceivables: (params, format) => apiClient.get('/financial-statements/aged-receivables', statementConfig(params, format)),
  agedPayables:    (params, format) => apiClient.get('/financial-statements/aged-payables', statementConfig(params, format)),
};
