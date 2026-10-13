import apiClient from './apiClient';

export const offshoreTravelService = {
  list:    (params) => apiClient.get('/offshore-travel-documents', { params }),
  stats:   ()       => apiClient.get('/offshore-travel-documents/stats'),
  create:  (data)   => apiClient.post('/offshore-travel-documents', data),
  get:     (id)     => apiClient.get(`/offshore-travel-documents/${id}`),
  update:  (id, data) => apiClient.patch(`/offshore-travel-documents/${id}`, data),
  verify:  (id)     => apiClient.post(`/offshore-travel-documents/${id}/verify`),
  reject:  (id, reason) => apiClient.post(`/offshore-travel-documents/${id}/reject`, { reason }),
  renew:   (id, data) => apiClient.post(`/offshore-travel-documents/${id}/renew`, data),
};

export const emergencyPlanService = {
  list:           (params) => apiClient.get('/emergency-plans', { params }),
  stats:          ()       => apiClient.get('/emergency-plans/stats'),
  create:         (formData) => apiClient.post('/emergency-plans', formData),
  get:            (id)     => apiClient.get(`/emergency-plans/${id}`),
  update:         (id, data) => apiClient.patch(`/emergency-plans/${id}`, data),
  replace:        (id, formData) => apiClient.post(`/emergency-plans/${id}/replace`, formData),
  archive:        (id, reason) => apiClient.post(`/emergency-plans/${id}/archive`, { reason }),
  markUnderReview:(id)     => apiClient.post(`/emergency-plans/${id}/mark-under-review`),
  markActive:     (id)     => apiClient.post(`/emergency-plans/${id}/mark-active`),
};

export const emergencyContactService = {
  list:    (params) => apiClient.get('/emergency-contacts', { params }),
  create:  (data)   => apiClient.post('/emergency-contacts', data),
  get:     (id)     => apiClient.get(`/emergency-contacts/${id}`),
  update:  (id, data) => apiClient.patch(`/emergency-contacts/${id}`, data),
  delete:  (id)     => apiClient.delete(`/emergency-contacts/${id}`),
};

export const hseReportService = {
  get: () => apiClient.get('/hse/reports'),
};
