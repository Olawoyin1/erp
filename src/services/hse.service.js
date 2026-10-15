import apiClient from './apiClient';

const blob = (params) => ({ params, responseType: 'blob' });

/** The list hooks send `search`, which is also what every HSE list endpoint calls it. */
const formOf = (fields, file) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  if (file) form.append('file', file);
  return form;
};

export const hseLookupService = {
  get: (include) => apiClient.get('/hse/lookups', { params: include ? { include } : {} }),
};

// ─── Offshore travel documents — /offshore-travel-documents ───────────────────
export const offshoreTravelService = {
  list:      (params) => apiClient.get('/offshore-travel-documents', { params }),
  stats:     ()       => apiClient.get('/offshore-travel-documents/stats'),
  exportCsv: (params) => apiClient.get('/offshore-travel-documents/export', blob(params)),
  create:    (fields, file) => apiClient.post('/offshore-travel-documents', formOf(fields, file)),
  get:       (id)     => apiClient.get(`/offshore-travel-documents/${id}`),
  update:    (id, fields, file) => apiClient.patch(`/offshore-travel-documents/${id}`, formOf(fields, file)),
  history:   (id, params) => apiClient.get(`/offshore-travel-documents/${id}/history`, { params }),
  verify:    (id)     => apiClient.post(`/offshore-travel-documents/${id}/verify`),
  reject:    (id, reason) => apiClient.post(`/offshore-travel-documents/${id}/reject`, { reason }),
  renew:     (id, fields, file) => apiClient.post(`/offshore-travel-documents/${id}/renew`, formOf(fields, file)),
  files:     (id)     => apiClient.get(`/offshore-travel-documents/${id}/files`),
  downloadFile: (id, fileId) => apiClient.get(`/offshore-travel-documents/${id}/files/${fileId}/download`),
};

// ─── Emergency plans — /emergency-plans ───────────────────────────────────────
export const emergencyPlanService = {
  list:            (params) => apiClient.get('/emergency-plans', { params }),
  stats:           ()       => apiClient.get('/emergency-plans/stats'),
  exportCsv:       (params) => apiClient.get('/emergency-plans/export', blob(params)),
  create:          (fields, file) => apiClient.post('/emergency-plans', formOf(fields, file)),
  get:             (id)     => apiClient.get(`/emergency-plans/${id}`),
  update:          (id, data) => apiClient.patch(`/emergency-plans/${id}`, data),
  history:         (id, params) => apiClient.get(`/emergency-plans/${id}/history`, { params }),
  replace:         (id, reason, file) => apiClient.post(`/emergency-plans/${id}/replace`, formOf({ reason }, file)),
  archive:         (id, reason) => apiClient.post(`/emergency-plans/${id}/archive`, { reason }),
  markUnderReview: (id)     => apiClient.post(`/emergency-plans/${id}/mark-under-review`),
  markActive:      (id)     => apiClient.post(`/emergency-plans/${id}/mark-active`),
  files:           (id)     => apiClient.get(`/emergency-plans/${id}/files`),
  downloadFile:    (id, fileId) => apiClient.get(`/emergency-plans/${id}/files/${fileId}/download`),
};

// ─── Emergency contacts — /emergency-contacts ─────────────────────────────────
export const emergencyContactService = {
  list:      (params) => apiClient.get('/emergency-contacts', { params }),
  exportCsv: (params) => apiClient.get('/emergency-contacts/export', blob(params)),
  create:    (data)   => apiClient.post('/emergency-contacts', data),
  get:       (id)     => apiClient.get(`/emergency-contacts/${id}`),
  update:    (id, data) => apiClient.patch(`/emergency-contacts/${id}`, data),
  remove:    (id)     => apiClient.delete(`/emergency-contacts/${id}`),
};

// ─── Reports — /hse/reports ───────────────────────────────────────────────────
export const hseReportService = {
  get:        () => apiClient.get('/hse/reports'),
  exportFile: (format) => apiClient.get('/hse/reports/export', { params: { format }, responseType: 'blob' }),
};
