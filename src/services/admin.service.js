import apiClient from './apiClient';

// ─── Administrative Requests — /admin-requests ────────────────────────────────
export const adminRequestService = {
  list:    (params) => apiClient.get('/admin-requests', { params }),
  stats:   ()       => apiClient.get('/admin-requests/stats'),
  get:     (id)     => apiClient.get(`/admin-requests/${id}`),
  create:  (data)   => apiClient.post('/admin-requests', data),
  update:  (id, data) => apiClient.patch(`/admin-requests/${id}`, data),
  history: (id, params) => apiClient.get(`/admin-requests/${id}/approval-history`, { params }),
  approve: (id, note) => apiClient.post(`/admin-requests/${id}/approve`, note ? { note } : {}),
  reject:  (id, reason) => apiClient.post(`/admin-requests/${id}/reject`, { reason }),
  complete:(id)     => apiClient.post(`/admin-requests/${id}/complete`),
  cancel:  (id, reason) => apiClient.post(`/admin-requests/${id}/cancel`, { reason }),
};

export const hrReportService = {
  get: () => apiClient.get('/hr/reports'),
};

// ─── Assets — /assets ─────────────────────────────────────────────────────────
export const assetService = {
  list:            (params) => apiClient.get('/assets', { params }),
  create:          (data)   => apiClient.post('/assets', data),
  get:             (id)     => apiClient.get(`/assets/${id}`),
  update:          (id, data) => apiClient.patch(`/assets/${id}`, data),
  depreciation:    (id)     => apiClient.get(`/assets/${id}/depreciation`),
  custodyHistory:  (id, params) => apiClient.get(`/assets/${id}/custody-history`, { params }),
  transfer:        (id, data) => apiClient.post(`/assets/${id}/transfer`, data),
  retire:          (id, reason) => apiClient.post(`/assets/${id}/retire`, { reason }),
  markActive:      (id)     => apiClient.post(`/assets/${id}/mark-active`),
  postDepreciation:(year)   => apiClient.post('/assets/depreciation/post', { year }),
};

// ─── Supply Items — /supply-items ─────────────────────────────────────────────
export const supplyItemService = {
  list:    (params) => apiClient.get('/supply-items', { params }),
  create:  (data)   => apiClient.post('/supply-items', data),
  get:     (id)     => apiClient.get(`/supply-items/${id}`),
  update:  (id, data) => apiClient.patch(`/supply-items/${id}`, data),
  restock: (id, data) => apiClient.post(`/supply-items/${id}/restock`, data),
};

// ─── Travel Requests — /travel-requests ───────────────────────────────────────
export const travelRequestService = {
  list:    (params) => apiClient.get('/travel-requests', { params }),
  create:  (data)   => apiClient.post('/travel-requests', data),
  get:     (id)     => apiClient.get(`/travel-requests/${id}`),
  update:  (id, data) => apiClient.patch(`/travel-requests/${id}`, data),
  history: (id, params) => apiClient.get(`/travel-requests/${id}/approval-history`, { params }),
  submit:  (id)     => apiClient.post(`/travel-requests/${id}/submit`),
  approve: (id)     => apiClient.post(`/travel-requests/${id}/approve`),
  reject:  (id, reason) => apiClient.post(`/travel-requests/${id}/reject`, { reason }),
};

// ─── Movements — /movements ───────────────────────────────────────────────────
export const movementService = {
  list:             (params) => apiClient.get('/movements', { params }),
  create:           (data)   => apiClient.post('/movements', data),
  get:              (id)     => apiClient.get(`/movements/${id}`),
  update:           (id, data) => apiClient.patch(`/movements/${id}`, data),
  history:          (id, params) => apiClient.get(`/movements/${id}/approval-history`, { params }),
  approve:          (id)     => apiClient.post(`/movements/${id}/approve`),
  reject:           (id, reason) => apiClient.post(`/movements/${id}/reject`, { reason }),
  markInTransit:    (id)     => apiClient.post(`/movements/${id}/in-transit`),
  confirmDelivery:  (id)     => apiClient.post(`/movements/${id}/confirm-delivery`),
  markReturned:     (id)     => apiClient.post(`/movements/${id}/mark-returned`),
};

// ─── Facility Maintenance — /facility-maintenance ─────────────────────────────
export const facilityMaintenanceService = {
  list:     (params) => apiClient.get('/facility-maintenance', { params }),
  create:   (data)   => apiClient.post('/facility-maintenance', data),
  get:      (id)     => apiClient.get(`/facility-maintenance/${id}`),
  update:   (id, data) => apiClient.patch(`/facility-maintenance/${id}`, data),
  start:    (id)     => apiClient.post(`/facility-maintenance/${id}/start`),
  complete: (id)     => apiClient.post(`/facility-maintenance/${id}/complete`),
  cancel:   (id, reason) => apiClient.post(`/facility-maintenance/${id}/cancel`, { reason }),
};

// ─── Memos — /memos ───────────────────────────────────────────────────────────
export const memoService = {
  list:         (params) => apiClient.get('/memos', { params }),
  create:       (data)   => apiClient.post('/memos', data),
  get:          (id)     => apiClient.get(`/memos/${id}`),
  send:         (id)     => apiClient.post(`/memos/${id}/send`),
  acknowledge:  (id)     => apiClient.post(`/memos/${id}/acknowledge`),
  forward:      (id, data) => apiClient.post(`/memos/${id}/forward`, data),
  pdf:          (id)     => apiClient.get(`/memos/${id}/pdf`),
  archive:      (id)     => apiClient.post(`/memos/${id}/archive`),
  delete:       (id)     => apiClient.delete(`/memos/${id}`),
  attachments:  (id)     => apiClient.get(`/memos/${id}/attachments`),
  addAttachment:(id, formData) => apiClient.post(`/memos/${id}/attachments`, formData),
};

// ─── Disposals — /disposals ───────────────────────────────────────────────────
export const disposalService = {
  list:            (params) => apiClient.get('/disposals', { params }),
  stats:           ()       => apiClient.get('/disposals/stats'),
  create:          (data)   => apiClient.post('/disposals', data),
  get:             (id)     => apiClient.get(`/disposals/${id}`),
  update:          (id, data) => apiClient.patch(`/disposals/${id}`, data),
  chainOfCustody:  (id, params) => apiClient.get(`/disposals/${id}/chain-of-custody`, { params }),
  complete:        (id)     => apiClient.post(`/disposals/${id}/complete`),
};

export const adminReportService = {
  get: () => apiClient.get('/administration/reports'),
};
