import apiClient from './apiClient';

const blob = (params) => ({ params, responseType: 'blob' });

const fileForm = (file) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

/** The list hooks send `search`; every Administration list endpoint calls it `q`. */
const asQuery = (params) => {
  if (!params) return params;
  const { search, ...rest } = params;
  return search ? { ...rest, q: search } : rest;
};

export const adminLookupService = {
  get: (include) => apiClient.get('/administration/lookups', { params: include ? { include } : {} }),
};

// ─── Administrative Requests — /admin-requests ────────────────────────────────
export const adminRequestService = {
  list:     (params) => apiClient.get('/admin-requests', { params: asQuery(params) }),
  stats:    ()       => apiClient.get('/admin-requests/stats'),
  exportCsv: (params) => apiClient.get('/admin-requests/export', blob(asQuery(params))),
  get:      (id)     => apiClient.get(`/admin-requests/${id}`),
  create:   (data)   => apiClient.post('/admin-requests', data),
  update:   (id, data) => apiClient.patch(`/admin-requests/${id}`, data),
  history:  (id, params) => apiClient.get(`/admin-requests/${id}/approval-history`, { params }),
  approve:  (id)     => apiClient.post(`/admin-requests/${id}/approve`),
  reject:   (id, reason) => apiClient.post(`/admin-requests/${id}/reject`, { reason }),
  complete: (id)     => apiClient.post(`/admin-requests/${id}/complete`),
  cancel:   (id, reason) => apiClient.post(`/admin-requests/${id}/cancel`, reason ? { reason } : {}),
  attachments: (id) => apiClient.get(`/admin-requests/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/admin-requests/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/admin-requests/${id}/attachments/${attachmentId}/download`),
};

// ─── Assets — /assets ─────────────────────────────────────────────────────────
export const assetService = {
  list:            (params) => apiClient.get('/assets', { params: asQuery(params) }),
  exportCsv:       (params) => apiClient.get('/assets/export', blob(asQuery(params))),
  create:          (data)   => apiClient.post('/assets', data),
  get:             (id)     => apiClient.get(`/assets/${id}`),
  update:          (id, data) => apiClient.patch(`/assets/${id}`, data),
  depreciation:    (id)     => apiClient.get(`/assets/${id}/depreciation`),
  custodyHistory:  (id)     => apiClient.get(`/assets/${id}/custody-history`),
  transfer:        (id, data) => apiClient.post(`/assets/${id}/transfer`, data),
  retire:          (id, reason) => apiClient.post(`/assets/${id}/retire`, { reason }),
  markActive:      (id)     => apiClient.post(`/assets/${id}/mark-active`),
};

// ─── Supply Items — /supply-items ─────────────────────────────────────────────
export const supplyItemService = {
  list:    (params) => apiClient.get('/supply-items', { params: asQuery(params) }),
  stats:   ()       => apiClient.get('/supply-items/stats'),
  exportCsv: (params) => apiClient.get('/supply-items/export', blob(asQuery(params))),
  create:  (data)   => apiClient.post('/supply-items', data),
  get:     (id)     => apiClient.get(`/supply-items/${id}`),
  update:  (id, data) => apiClient.patch(`/supply-items/${id}`, data),
  restock: (id, data) => apiClient.post(`/supply-items/${id}/restock`, data),
};

// ─── Travel Requests — /travel-requests ───────────────────────────────────────
export const travelRequestService = {
  list:    (params) => apiClient.get('/travel-requests', { params: asQuery(params) }),
  exportCsv: (params) => apiClient.get('/travel-requests/export', blob(asQuery(params))),
  create:  (data)   => apiClient.post('/travel-requests', data),
  get:     (id)     => apiClient.get(`/travel-requests/${id}`),
  update:  (id, data) => apiClient.patch(`/travel-requests/${id}`, data),
  history: (id, params) => apiClient.get(`/travel-requests/${id}/approval-history`, { params }),
  submit:  (id)     => apiClient.post(`/travel-requests/${id}/submit`),
  approve: (id)     => apiClient.post(`/travel-requests/${id}/approve`),
  reject:  (id, reason) => apiClient.post(`/travel-requests/${id}/reject`, { reason }),
  attachments: (id) => apiClient.get(`/travel-requests/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/travel-requests/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/travel-requests/${id}/attachments/${attachmentId}/download`),
};

// ─── Movements — /movements ───────────────────────────────────────────────────
export const movementService = {
  list:             (params) => apiClient.get('/movements', { params: asQuery(params) }),
  exportCsv:        (params) => apiClient.get('/movements/export', blob(asQuery(params))),
  create:           (data)   => apiClient.post('/movements', data),
  get:              (id)     => apiClient.get(`/movements/${id}`),
  update:           (id, data) => apiClient.patch(`/movements/${id}`, data),
  history:          (id, params) => apiClient.get(`/movements/${id}/approval-history`, { params }),
  approve:          (id)     => apiClient.post(`/movements/${id}/approve`),
  reject:           (id, reason) => apiClient.post(`/movements/${id}/reject`, { reason }),
  markInTransit:    (id)     => apiClient.post(`/movements/${id}/in-transit`),
  confirmDelivery:  (id)     => apiClient.post(`/movements/${id}/confirm-delivery`),
  markReturned:     (id)     => apiClient.post(`/movements/${id}/mark-returned`),
  attachments: (id) => apiClient.get(`/movements/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/movements/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/movements/${id}/attachments/${attachmentId}/download`),
};

// ─── Facility Maintenance — /facility-maintenance ─────────────────────────────
export const facilityMaintenanceService = {
  list:     (params) => apiClient.get('/facility-maintenance', { params: asQuery(params) }),
  exportCsv: (params) => apiClient.get('/facility-maintenance/export', blob(asQuery(params))),
  create:   (data)   => apiClient.post('/facility-maintenance', data),
  get:      (id)     => apiClient.get(`/facility-maintenance/${id}`),
  update:   (id, data) => apiClient.patch(`/facility-maintenance/${id}`, data),
  history:  (id, params) => apiClient.get(`/facility-maintenance/${id}/history`, { params }),
  start:    (id)     => apiClient.post(`/facility-maintenance/${id}/start`),
  complete: (id)     => apiClient.post(`/facility-maintenance/${id}/complete`),
  cancel:   (id, reason) => apiClient.post(`/facility-maintenance/${id}/cancel`, { reason }),
};

// ─── Memos — /memos ───────────────────────────────────────────────────────────
export const memoService = {
  list:         (params) => apiClient.get('/memos', { params: asQuery(params) }),
  counts:       ()       => apiClient.get('/memos/counts'),
  create:       (data)   => apiClient.post('/memos', data),
  get:          (id)     => apiClient.get(`/memos/${id}`),
  update:       (id, data) => apiClient.patch(`/memos/${id}`, data),
  send:         (id)     => apiClient.post(`/memos/${id}/send`),
  acknowledge:  (id)     => apiClient.post(`/memos/${id}/acknowledge`),
  forward:      (id, data) => apiClient.post(`/memos/${id}/forward`, data),
  pdf:          (id)     => apiClient.get(`/memos/${id}/pdf`, { responseType: 'blob' }),
  archive:      (id)     => apiClient.post(`/memos/${id}/archive`),
  unarchive:    (id)     => apiClient.post(`/memos/${id}/unarchive`),
  remove:       (id)     => apiClient.delete(`/memos/${id}`),
  attachments:  (id)     => apiClient.get(`/memos/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/memos/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/memos/${id}/attachments/${attachmentId}/download`),
};

// ─── Disposals — /disposals ───────────────────────────────────────────────────
export const disposalService = {
  list:            (params) => apiClient.get('/disposals', { params: asQuery(params) }),
  stats:           ()       => apiClient.get('/disposals/stats'),
  exportCsv:       (params) => apiClient.get('/disposals/export', blob(asQuery(params))),
  create:          (data)   => apiClient.post('/disposals', data),
  get:             (id)     => apiClient.get(`/disposals/${id}`),
  update:          (id, data) => apiClient.patch(`/disposals/${id}`, data),
  chainOfCustody:  (id, params) => apiClient.get(`/disposals/${id}/chain-of-custody`, { params }),
  complete:        (id)     => apiClient.post(`/disposals/${id}/complete`),
  attachments: (id) => apiClient.get(`/disposals/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/disposals/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/disposals/${id}/attachments/${attachmentId}/download`),
};

export const adminReportService = {
  get: () => apiClient.get('/administration/reports'),
  exportFile: (format) => apiClient.get('/administration/reports/export', { params: { format }, responseType: 'blob' }),
};
