import apiClient from './apiClient';

const blob = (params) => ({ params, responseType: 'blob' });

const formOf = (fields, file) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  if (file) form.append('file', file);
  return form;
};

export const qualityLookupService = {
  get: (include) => apiClient.get('/quality/lookups', { params: include ? { include } : {} }),
};

// ─── Audits — /quality-audits ─────────────────────────────────────────────────
export const qualityAuditService = {
  list:         (params) => apiClient.get('/quality-audits', { params }),
  stats:        ()       => apiClient.get('/quality-audits/stats'),
  exportCsv:    (params) => apiClient.get('/quality-audits/export', blob(params)),
  create:       (fields, file) => apiClient.post('/quality-audits', formOf(fields, file)),
  get:          (id)     => apiClient.get(`/quality-audits/${id}`),
  update:       (id, fields, file) => apiClient.patch(`/quality-audits/${id}`, formOf(fields, file)),
  history:      (id, params) => apiClient.get(`/quality-audits/${id}/history`, { params }),
  start:        (id)     => apiClient.post(`/quality-audits/${id}/start`),
  complete:     (id)     => apiClient.post(`/quality-audits/${id}/complete`),
  uploadReport: (id, file) => apiClient.post(`/quality-audits/${id}/upload-report`, formOf({}, file)),
  close:        (id)     => apiClient.post(`/quality-audits/${id}/close`),
  reschedule:   (id, data) => apiClient.post(`/quality-audits/${id}/reschedule`, data),
  files:        (id)     => apiClient.get(`/quality-audits/${id}/files`),
  downloadFile: (id, fileId) => apiClient.get(`/quality-audits/${id}/files/${fileId}/download`),
};

// ─── Calibration records — /quality/calibration-records ───────────────────────
export const qualityCalibrationService = {
  list:      (params) => apiClient.get('/quality/calibration-records', { params }),
  stats:     ()       => apiClient.get('/quality/calibration-records/stats'),
  exportCsv: (params) => apiClient.get('/quality/calibration-records/export', blob(params)),
  get:       (id)     => apiClient.get(`/quality/calibration-records/${id}`),
  history:   (id)     => apiClient.get(`/quality/calibration-records/${id}/history`),
  certificate: (id, logId) => apiClient.get(`/quality/calibration-records/${id}/history/${logId}/certificate`),
  log:       (id, fields, file) => apiClient.post(`/quality/calibration-records/${id}/log`, formOf(fields, file)),
};

// ─── Materials inspection — /quality/materials-inspection ─────────────────────
export const qualityInspectionService = {
  list:             (params) => apiClient.get('/quality/materials-inspection', { params }),
  stats:            ()       => apiClient.get('/quality/materials-inspection/stats'),
  exportCsv:        (params) => apiClient.get('/quality/materials-inspection/export', blob(params)),
  get:              (id)     => apiClient.get(`/quality/materials-inspection/${id}`),
  history:          (id, params) => apiClient.get(`/quality/materials-inspection/${id}/history`, { params }),
  inspectionStatus: (id, fields, file) => apiClient.post(`/quality/materials-inspection/${id}/inspection-status`, formOf(fields, file)),
  attachments:      (id)     => apiClient.get(`/quality/materials-inspection/${id}/attachments`),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/quality/materials-inspection/${id}/attachments/${attachmentId}/download`),
};

// ─── Reports — /quality/reports ───────────────────────────────────────────────
export const qualityReportService = {
  get:        () => apiClient.get('/quality/reports'),
  exportFile: (format) => apiClient.get('/quality/reports/export', { params: { format }, responseType: 'blob' }),
};
