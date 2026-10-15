import apiClient from './apiClient';

const blob = { responseType: 'blob' };

export const projectService = {
  list: (params) => apiClient.get('/projects', { params }),
  stats: () => apiClient.get('/projects/stats'),
  exportList: (params) => apiClient.get('/projects/export', { params, ...blob }),
  create: (data) => apiClient.post('/projects', data),
  fromTender: (tenderId, data) => apiClient.post(`/projects/from-tender/${tenderId}`, data),
  get: (id) => apiClient.get(`/projects/${id}`),
  update: (id, data) => apiClient.patch(`/projects/${id}`, data),
  hold: (id, reason) => apiClient.post(`/projects/${id}/hold`, reason ? { reason } : {}),
  resume: (id, notes) => apiClient.post(`/projects/${id}/resume`, notes ? { notes } : {}),
  markAtRisk: (id) => apiClient.post(`/projects/${id}/mark-at-risk`),
  markInProgress: (id) => apiClient.post(`/projects/${id}/mark-in-progress`),
  complete: (id) => apiClient.post(`/projects/${id}/complete`),
  updateTimeline: (id, data) => apiClient.post(`/projects/${id}/update-timeline`, data),
  milestones: (id) => apiClient.get(`/projects/${id}/milestones`),
  progress: (id, params) => apiClient.get(`/projects/${id}/progress`, { params }),
  images: (id, params) => apiClient.get(`/projects/${id}/images`, { params }),
  uploadImage: (id, formData) => apiClient.post(`/projects/${id}/images`, formData),
  exportReport: (id) => apiClient.get(`/projects/${id}/report`, blob),
  shareProgress: (id, data) => apiClient.post(`/projects/${id}/share-progress`, data),

  attachments: (id) => apiClient.get(`/projects/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/projects/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/projects/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/projects/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/projects/${id}/history`),
};

export const wbsService = {
  list: (projectId, params) => apiClient.get(`/projects/${projectId}/wbs`, { params }),
  exportList: (projectId, params) => apiClient.get(`/projects/${projectId}/wbs/export`, { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/wbs`, data),
  addSubActivity: (projectId, activityId, data) => apiClient.post(`/projects/${projectId}/wbs/${activityId}/sub-activities`, data),
  get: (id) => apiClient.get(`/wbs-activities/${id}`),
  update: (id, data) => apiClient.patch(`/wbs-activities/${id}`, data),
  remove: (id) => apiClient.delete(`/wbs-activities/${id}`),
};

export const projectLogService = {
  list: (projectId, params) => apiClient.get(`/projects/${projectId}/logs`, { params }),
  stats: (projectId) => apiClient.get(`/projects/${projectId}/logs/stats`),
  exportList: (projectId, params) => apiClient.get(`/projects/${projectId}/logs/export`, { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/logs`, data),
  get: (id) => apiClient.get(`/logs/${id}`),
  update: (id, data) => apiClient.patch(`/logs/${id}`, data),
  start: (id) => apiClient.post(`/logs/${id}/start`),
  resolve: (id, resolutionNotes) => apiClient.post(`/logs/${id}/resolve`, { resolutionNotes }),
  markOccurred: (id, resolutionNotes) => apiClient.post(`/logs/${id}/mark-occurred`, { resolutionNotes }),
  mitigate: (id, resolutionNotes) => apiClient.post(`/logs/${id}/mitigate`, { resolutionNotes }),
  approve: (id) => apiClient.post(`/logs/${id}/approve`),
  reject: (id, resolutionNotes) => apiClient.post(`/logs/${id}/reject`, { resolutionNotes }),

  attachments: (id) => apiClient.get(`/logs/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/logs/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/logs/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/logs/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/logs/${id}/history`),
};

export const resourceRequestService = {
  list: (params) => apiClient.get('/technical/resource-requests', { params }),
  stats: (params) => (params?.projectId
    ? apiClient.get(`/projects/${params.projectId}/resource-requests/stats`)
    : apiClient.get('/technical/resource-requests/stats')),
  exportList: (params) => apiClient.get('/technical/resource-requests/export', { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/resource-requests`, data),
  get: (id) => apiClient.get(`/resource-requests/${id}`),
  update: (id, data) => apiClient.patch(`/resource-requests/${id}`, data),
  technicalApprove: (id) => apiClient.post(`/resource-requests/${id}/technical-approve`),
  technicalReject: (id, reason) => apiClient.post(`/resource-requests/${id}/technical-reject`, reason ? { reason } : {}),
  storeApprove: (id) => apiClient.post(`/resource-requests/${id}/store-approve`),
  storeReject: (id, reason) => apiClient.post(`/resource-requests/${id}/store-reject`, reason ? { reason } : {}),
  returnResource: (id) => apiClient.post(`/resource-requests/${id}/return`),
  cancel: (id, reason) => apiClient.post(`/resource-requests/${id}/cancel`, reason ? { reason } : {}),

  attachments: (id) => apiClient.get(`/resource-requests/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/resource-requests/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/resource-requests/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/resource-requests/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/resource-requests/${id}/history`),
};

export const siteDiaryService = {
  list: (projectId, params) => apiClient.get(`/projects/${projectId}/site-diary`, { params }),
  exportList: (projectId, params) => apiClient.get(`/projects/${projectId}/site-diary/export`, { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/site-diary`, data),
  get: (id) => apiClient.get(`/site-diary/${id}`),
  update: (id, data) => apiClient.patch(`/site-diary/${id}`, data),
  remove: (id) => apiClient.delete(`/site-diary/${id}`),
  submit: (id) => apiClient.post(`/site-diary/${id}/submit`),
  signOff: (id) => apiClient.post(`/site-diary/${id}/sign-off`),
  returnForRevision: (id, notes) => apiClient.post(`/site-diary/${id}/return-for-revision`, notes ? { notes } : {}),

  attachments: (id) => apiClient.get(`/site-diary/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/site-diary/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/site-diary/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/site-diary/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/site-diary/${id}/history`),
};

export const timesheetService = {
  list: (projectId, params) => apiClient.get(`/projects/${projectId}/timesheets`, { params }),
  stats: (projectId) => apiClient.get(`/projects/${projectId}/timesheets/stats`),
  exportList: (projectId, params) => apiClient.get(`/projects/${projectId}/timesheets/export`, { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/timesheets`, data),
  get: (id) => apiClient.get(`/timesheets/${id}`),
  update: (id, data) => apiClient.patch(`/timesheets/${id}`, data),
  remove: (id) => apiClient.delete(`/timesheets/${id}`),
  approve: (id) => apiClient.post(`/timesheets/${id}/approve`),
  reject: (id, reason) => apiClient.post(`/timesheets/${id}/reject`, reason ? { reason } : {}),

  attachments: (id) => apiClient.get(`/timesheets/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/timesheets/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/timesheets/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/timesheets/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/timesheets/${id}/history`),
};

export const siteInspectionService = {
  list: (projectId, params) => apiClient.get(`/projects/${projectId}/site-inspections`, { params }),
  exportList: (projectId, params) => apiClient.get(`/projects/${projectId}/site-inspections/export`, { params, ...blob }),
  create: (projectId, data) => apiClient.post(`/projects/${projectId}/site-inspections`, data),
  get: (id) => apiClient.get(`/site-inspections/${id}`),
  update: (id, data) => apiClient.patch(`/site-inspections/${id}`, data),

  attachments: (id) => apiClient.get(`/site-inspections/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/site-inspections/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/site-inspections/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/site-inspections/${id}/attachments/${attachmentId}`),
  history: (id) => apiClient.get(`/site-inspections/${id}/history`),
};

export const engineeringDocumentService = {
  list: (params) => apiClient.get('/engineering-documents', { params }),
  stats: (params) => apiClient.get('/engineering-documents/stats', { params: params?.projectId ? { projectId: params.projectId } : {} }),
  exportList: (params) => apiClient.get('/engineering-documents/export', { params, ...blob }),
  categories: () => apiClient.get('/document-categories'),
  template: (category) => apiClient.get(`/document-categories/${encodeURIComponent(category)}/template`, blob),
  create: (formData) => apiClient.post('/engineering-documents', formData),
  get: (id) => apiClient.get(`/engineering-documents/${id}`),
  update: (id, data) => apiClient.patch(`/engineering-documents/${id}`, data),
  replace: (id, formData) => apiClient.put(`/engineering-documents/${id}/replace`, formData),
  reviewApprove: (id) => apiClient.post(`/engineering-documents/${id}/review-approve`),
  reviewReturn: (id, reason) => apiClient.post(`/engineering-documents/${id}/review-return`, { reason }),
  checkApprove: (id) => apiClient.post(`/engineering-documents/${id}/check-approve`),
  checkReturn: (id, reason) => apiClient.post(`/engineering-documents/${id}/check-return`, { reason }),
  approve: (id) => apiClient.post(`/engineering-documents/${id}/approve`),
  reject: (id, reason) => apiClient.post(`/engineering-documents/${id}/reject`, { reason }),
  markSentToClient: (id) => apiClient.post(`/engineering-documents/${id}/mark-sent-to-client`),

  attachments: (id) => apiClient.get(`/engineering-documents/${id}/attachments`),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/engineering-documents/${id}/attachments/${attachmentId}/download`),
  history: (id) => apiClient.get(`/engineering-documents/${id}/history`),
};

export const calibrationRecordService = {
  list: (params) => apiClient.get('/calibration-records', { params }),
  stats: () => apiClient.get('/calibration-records/stats'),
  exportList: (params) => apiClient.get('/calibration-records/export', { params, ...blob }),
  create: (data) => apiClient.post('/calibration-records', data),
  get: (id) => apiClient.get(`/calibration-records/${id}`),
  update: (id, data) => apiClient.patch(`/calibration-records/${id}`, data),
  calibrationHistory: (id) => apiClient.get(`/calibration-records/${id}/history`),
  certificate: (id, logId) => apiClient.get(`/calibration-records/${id}/history/${logId}/certificate`),
  log: (id, formData) => apiClient.post(`/calibration-records/${id}/log`, formData),
  outOfService: (id, reason) => apiClient.post(`/calibration-records/${id}/out-of-service`, { reason }),
  restore: (id) => apiClient.post(`/calibration-records/${id}/restore`),

  attachments: (id) => apiClient.get(`/calibration-records/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/calibration-records/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/calibration-records/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/calibration-records/${id}/attachments/${attachmentId}`),
};

export const technicalReportService = {
  get: (params) => apiClient.get('/technical/reports', { params }),
  exportList: (params) => apiClient.get('/technical/reports/export', { params, ...blob }),
};

export const technicalLookupService = {
  get: (include) => apiClient.get('/technical/lookups', { params: include ? { include } : {} }),
};

/** The project Tasks tab: the shared task endpoints, scoped to one project. */
export const projectTaskService = {
  list: (params) => apiClient.get('/tasks', { params: { module: 'technical', ...params } }),
  stats: (params) => apiClient.get('/tasks/stats', { params: { module: 'technical', projectId: params?.projectId } }),
  exportList: (params) => apiClient.get('/tasks', { params: { module: 'technical', ...params, format: 'csv' }, ...blob }),
  board: (params) => apiClient.get('/tasks/board', { params: { module: 'technical', ...params } }),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`),
  assignees: (params) => apiClient.get('/tasks/assignees', { params }),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.patch(`/tasks/${id}`, data),
  setStatus: (id, status) => apiClient.post(`/tasks/${id}/status`, { status }),
  remove: (id) => apiClient.delete(`/tasks/${id}`),
  attachments: (id) => apiClient.get(`/tasks/${id}/attachments`),
  uploadAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(`/tasks/${id}/attachments`, formData);
  },
  downloadAttachment: (id, attachmentId) => apiClient.get(`/tasks/${id}/attachments/${attachmentId}/download`),
};
