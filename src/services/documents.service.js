import apiClient from './apiClient';

// ─── Documents — /documents ───────────────────────────────────────────────────
// Platform-level document service (used by HR, HSE, Admin, etc.)
export const documentService = {
  list:      (params) => apiClient.get('/documents', { params }),
  stats:     (module) => apiClient.get('/documents/stats', { params: module ? { module } : {} }),
  get:       (id)     => apiClient.get(`/documents/${id}`),
  create:    (formData) => apiClient.post('/documents', formData), // multipart/form-data

  // Metadata edit (draft controlled docs only, or any simple doc)
  update:    (id, data) => apiClient.patch(`/documents/${id}`, data),

  // State-machine transitions
  submit:    (id)           => apiClient.post(`/documents/${id}/submit`),
  approve:   (id)           => apiClient.post(`/documents/${id}/approve`),
  reject:    (id, reason)   => apiClient.post(`/documents/${id}/reject`, { reason }),
  checkout:  (id)           => apiClient.post(`/documents/${id}/checkout`),
  checkin:   (id)           => apiClient.post(`/documents/${id}/checkin`),
  archive:   (id)           => apiClient.post(`/documents/${id}/archive`),
  restore:   (id)           => apiClient.post(`/documents/${id}/restore`),

  // File operations
  download:       (id)           => apiClient.get(`/documents/${id}/download`),
  uploadVersion:  (id, formData) => apiClient.post(`/documents/${id}/versions`, formData),
  replaceFile:    (id, formData) => apiClient.put(`/documents/${id}/file`, formData),
  delete:         (id)           => apiClient.delete(`/documents/${id}`),

  // Sub-resources
  revisions:  (id) => apiClient.get(`/documents/${id}/revisions`),
  accessLog:  (id, params) => apiClient.get(`/documents/${id}/access-log`, { params }),
};
