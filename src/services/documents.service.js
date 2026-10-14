import apiClient from './apiClient';

/** Platform documents (`/documents`), shared by every module's documents page through `module`. */
export const documentService = {
  list: (params) => apiClient.get('/documents', { params }),
  stats: (module) => apiClient.get('/documents/stats', { params: module ? { module } : {} }),
  get: (id) => apiClient.get(`/documents/${id}`),

  /** multipart/form-data; the Content-Type header is left to the browser (it adds the boundary). */
  create: (formData) => apiClient.post('/documents', formData),

  /** Metadata edit: a controlled document only while in draft, a simple-library document any time. */
  update: (id, data) => apiClient.patch(`/documents/${id}`, data),

  submit: (id) => apiClient.post(`/documents/${id}/submit`),
  approve: (id) => apiClient.post(`/documents/${id}/approve`),
  reject: (id, reason) => apiClient.post(`/documents/${id}/reject`, { reason }),
  checkout: (id) => apiClient.post(`/documents/${id}/checkout`),
  checkin: (id) => apiClient.post(`/documents/${id}/checkin`),
  archive: (id) => apiClient.post(`/documents/${id}/archive`),
  restore: (id) => apiClient.post(`/documents/${id}/restore`),

  /** Resolves to `{ url, filename }`: a short-lived presigned link, never the file itself. */
  download: (id) => apiClient.get(`/documents/${id}/download`),

  /** New version of a controlled document (approved or checked out by you). */
  uploadVersion: (id, formData) => apiClient.post(`/documents/${id}/versions`, formData),

  /** Direct replacement of a simple-library document's file. */
  replaceFile: (id, formData) => apiClient.put(`/documents/${id}/file`, formData),

  /** Simple-library documents only. */
  delete: (id) => apiClient.delete(`/documents/${id}`),

  revisions: (id) => apiClient.get(`/documents/${id}/revisions`),
  accessLog: (id, params) => apiClient.get(`/documents/${id}/access-log`, { params }),

  /** Needs `core.document.export`. */
  exportCsv: (params) => apiClient.get('/documents', { params: { ...params, format: 'csv' }, responseType: 'blob' }),
};
