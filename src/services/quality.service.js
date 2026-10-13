import apiClient from './apiClient';

export const qualityAuditService = {
  list:         (params) => apiClient.get('/quality-audits', { params }),
  stats:        ()       => apiClient.get('/quality-audits/stats'),
  create:       (data)   => apiClient.post('/quality-audits', data),
  get:          (id)     => apiClient.get(`/quality-audits/${id}`),
  update:       (id, data) => apiClient.patch(`/quality-audits/${id}`, data),
  start:        (id)     => apiClient.post(`/quality-audits/${id}/start`),
  complete:     (id)     => apiClient.post(`/quality-audits/${id}/complete`),
  uploadReport: (id, formData) => apiClient.post(`/quality-audits/${id}/upload-report`, formData),
  close:        (id)     => apiClient.post(`/quality-audits/${id}/close`),
  reschedule:   (id, data) => apiClient.post(`/quality-audits/${id}/reschedule`, data),
};

export const qualityCalibrationService = {
  list:    (params) => apiClient.get('/quality/calibration-records', { params }),
  stats:   ()       => apiClient.get('/quality/calibration-records/stats'),
  get:     (id)     => apiClient.get(`/quality/calibration-records/${id}`),
  history: (id)     => apiClient.get(`/quality/calibration-records/${id}/history`),
};

export const qualityInspectionService = {
  list:              (params) => apiClient.get('/quality/materials-inspection', { params }),
  stats:             ()       => apiClient.get('/quality/materials-inspection/stats'),
  get:               (id)     => apiClient.get(`/quality/materials-inspection/${id}`),
  inspectionStatus:  (id, formData) => apiClient.post(`/quality/materials-inspection/${id}/inspection-status`, formData),
};

export const qualityReportService = {
  get: () => apiClient.get('/quality/reports'),
};
