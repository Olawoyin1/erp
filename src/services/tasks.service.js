import apiClient from './apiClient';

export const tasksService = {
  list: (params) => apiClient.get('/tasks', { params }),
  board: (params) => apiClient.get('/tasks/board', { params }),
  stats: (module, scope) => apiClient.get('/tasks/stats', { params: { ...(module ? { module } : {}), ...(scope ? { scope } : {}) } }),
  assignees: (params) => apiClient.get('/tasks/assignees', { params }),
  get: (id) => apiClient.get(`/tasks/${id}`),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.patch(`/tasks/${id}`, data),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
  setStatus: (id, status) => apiClient.post(`/tasks/${id}/status`, { status }),

  attachments: (id) => apiClient.get(`/tasks/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/tasks/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/tasks/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`),

  exportCsv: (params) => apiClient.get('/tasks', { params: { ...params, format: 'csv' }, responseType: 'blob' }),

  projects: (params) => apiClient.get('/projects', { params: { limit: 100, ...params } }),
  projectActivities: (projectId) => apiClient.get(`/projects/${projectId}/wbs`),
};
