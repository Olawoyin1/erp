import apiClient from './apiClient';

export const projectService = {
  list:            (params) => apiClient.get('/projects', { params }),
  stats:           ()       => apiClient.get('/projects/stats'),
  create:          (data)   => apiClient.post('/projects', data),
  fromTender:      (tenderId, data) => apiClient.post(`/projects/from-tender/${tenderId}`, data),
  get:             (id)     => apiClient.get(`/projects/${id}`),
  update:          (id, data) => apiClient.patch(`/projects/${id}`, data),
  hold:            (id, reason) => apiClient.post(`/projects/${id}/hold`, reason ? { reason } : {}),
  resume:          (id, notes) => apiClient.post(`/projects/${id}/resume`, notes ? { notes } : {}),
  markAtRisk:      (id)     => apiClient.post(`/projects/${id}/mark-at-risk`),
  markInProgress:  (id)     => apiClient.post(`/projects/${id}/mark-in-progress`),
  complete:        (id)     => apiClient.post(`/projects/${id}/complete`),
  updateTimeline:  (id, data) => apiClient.post(`/projects/${id}/update-timeline`, data),
  milestones:      (id)     => apiClient.get(`/projects/${id}/milestones`),
  progress:        (id)     => apiClient.get(`/projects/${id}/progress`),
  images:          (id)     => apiClient.get(`/projects/${id}/images`),
  addImage:        (id, formData) => apiClient.post(`/projects/${id}/images`, formData),
  wbs:             (id)     => apiClient.get(`/projects/${id}/wbs`),
  addWbs:          (id, data) => apiClient.post(`/projects/${id}/wbs`, data),
  addSubActivity:  (id, activityId, data) => apiClient.post(`/projects/${id}/wbs/${activityId}/sub-activities`, data),
  logs:            (id, params) => apiClient.get(`/projects/${id}/logs`, { params }),
  logStats:        (id)     => apiClient.get(`/projects/${id}/logs/stats`),
  addLog:          (id, data) => apiClient.post(`/projects/${id}/logs`, data),
  resourceRequests:(id, params) => apiClient.get(`/projects/${id}/resource-requests`, { params }),
  resourceRequestStats:(id) => apiClient.get(`/projects/${id}/resource-requests/stats`),
  createResourceRequest:(id, data) => apiClient.post(`/projects/${id}/resource-requests`, data),
  siteDiary:       (id, params) => apiClient.get(`/projects/${id}/site-diary`, { params }),
  addSiteDiary:    (id, data) => apiClient.post(`/projects/${id}/site-diary`, data),
  timesheets:      (id, params) => apiClient.get(`/projects/${id}/timesheets`, { params }),
  timesheetStats:  (id)     => apiClient.get(`/projects/${id}/timesheets/stats`),
  addTimesheet:    (id, data) => apiClient.post(`/projects/${id}/timesheets`, data),
  documents:       (id, params) => apiClient.get(`/projects/${id}/documents`, { params }),
};

export const wbsService = {
  get:    (id) => apiClient.get(`/wbs-activities/${id}`),
  update: (id, data) => apiClient.patch(`/wbs-activities/${id}`, data),
  delete: (id) => apiClient.delete(`/wbs-activities/${id}`),
};

export const projectLogService = {
  get:          (id) => apiClient.get(`/logs/${id}`),
  update:       (id, data) => apiClient.patch(`/logs/${id}`, data),
  resolve:      (id) => apiClient.post(`/logs/${id}/resolve`),
  start:        (id) => apiClient.post(`/logs/${id}/start`),
  markOccurred: (id) => apiClient.post(`/logs/${id}/mark-occurred`),
  mitigate:     (id) => apiClient.post(`/logs/${id}/mitigate`),
  approve:      (id) => apiClient.post(`/logs/${id}/approve`),
  reject:       (id, reason) => apiClient.post(`/logs/${id}/reject`, { reason }),
};

export const resourceRequestService = {
  list:              (params) => apiClient.get('/technical/resource-requests', { params }),
  stats:             ()       => apiClient.get('/technical/resource-requests/stats'),
  get:               (id)     => apiClient.get(`/resource-requests/${id}`),
  update:            (id, data) => apiClient.patch(`/resource-requests/${id}`, data),
  approvalLog:       (id)     => apiClient.get(`/resource-requests/${id}/approval-log`),
  technicalApprove:  (id)     => apiClient.post(`/resource-requests/${id}/technical-approve`),
  technicalReject:   (id, reason) => apiClient.post(`/resource-requests/${id}/technical-reject`, { reason }),
  storeApprove:      (id)     => apiClient.post(`/resource-requests/${id}/store-approve`),
  storeReject:       (id, reason) => apiClient.post(`/resource-requests/${id}/store-reject`, { reason }),
  return:            (id)     => apiClient.post(`/resource-requests/${id}/return`),
  cancel:            (id, reason) => apiClient.post(`/resource-requests/${id}/cancel`, { reason }),
};

export const siteDiaryService = {
  get:               (id) => apiClient.get(`/site-diary/${id}`),
  update:            (id, data) => apiClient.patch(`/site-diary/${id}`, data),
  delete:            (id) => apiClient.delete(`/site-diary/${id}`),
  submit:            (id) => apiClient.post(`/site-diary/${id}/submit`),
  signOff:           (id) => apiClient.post(`/site-diary/${id}/sign-off`),
  returnForRevision: (id, reason) => apiClient.post(`/site-diary/${id}/return-for-revision`, { reason }),
};

export const timesheetService = {
  get:     (id) => apiClient.get(`/timesheets/${id}`),
  update:  (id, data) => apiClient.patch(`/timesheets/${id}`, data),
  delete:  (id) => apiClient.delete(`/timesheets/${id}`),
  approve: (id) => apiClient.post(`/timesheets/${id}/approve`),
  reject:  (id, reason) => apiClient.post(`/timesheets/${id}/reject`, { reason }),
};

export const engineeringDocumentService = {
  list:              (params) => apiClient.get('/engineering-documents', { params }),
  stats:             ()       => apiClient.get('/engineering-documents/stats'),
  create:            (formData) => apiClient.post('/engineering-documents', formData),
  get:               (id)     => apiClient.get(`/engineering-documents/${id}`),
  update:            (id, data) => apiClient.patch(`/engineering-documents/${id}`, data),
  replace:           (id, formData) => apiClient.put(`/engineering-documents/${id}/replace`, formData),
  reviewApprove:     (id)     => apiClient.post(`/engineering-documents/${id}/review-approve`),
  reviewReturn:      (id, reason) => apiClient.post(`/engineering-documents/${id}/review-return`, { reason }),
  checkApprove:      (id)     => apiClient.post(`/engineering-documents/${id}/check-approve`),
  checkReturn:       (id, reason) => apiClient.post(`/engineering-documents/${id}/check-return`, { reason }),
  approve:           (id)     => apiClient.post(`/engineering-documents/${id}/approve`),
  reject:            (id, reason) => apiClient.post(`/engineering-documents/${id}/reject`, { reason }),
  markSentToClient:  (id)     => apiClient.post(`/engineering-documents/${id}/mark-sent-to-client`),
};

export const calibrationRecordService = {
  list:          (params) => apiClient.get('/calibration-records', { params }),
  stats:         ()       => apiClient.get('/calibration-records/stats'),
  create:        (data)   => apiClient.post('/calibration-records', data),
  get:           (id)     => apiClient.get(`/calibration-records/${id}`),
  history:       (id)     => apiClient.get(`/calibration-records/${id}/history`),
  update:        (id, data) => apiClient.patch(`/calibration-records/${id}`, data),
  log:           (id, data) => apiClient.post(`/calibration-records/${id}/log`, data),
  outOfService:  (id, reason) => apiClient.post(`/calibration-records/${id}/out-of-service`, { reason }),
  restore:       (id)     => apiClient.post(`/calibration-records/${id}/restore`),
};

export const technicalReportService = {
  get: () => apiClient.get('/technical/reports'),
};
