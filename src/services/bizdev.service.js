import apiClient from './apiClient';

const blob = (params) => ({ params, responseType: 'blob' });

const fileForm = (file) => {
  const form = new FormData();
  form.append('file', file);
  return form;
};

export const bizLookupService = {
  get: (include) => apiClient.get('/clients/lookups', { params: include ? { include } : {} }),
};

export const clientService = {
  list:         (params) => apiClient.get('/clients', { params }),
  stats:        ()       => apiClient.get('/clients/stats'),
  exportCsv:    (params) => apiClient.get('/clients/export', blob(params)),
  create:       (data)   => apiClient.post('/clients', data),
  get:          (id)     => apiClient.get(`/clients/${id}`),
  update:       (id, data) => apiClient.patch(`/clients/${id}`, data),
  archive:      (id, reason) => apiClient.post(`/clients/${id}/archive`, { reason }),
  restore:      (id)     => apiClient.post(`/clients/${id}/restore`),
  tenders:      (id, params) => apiClient.get(`/clients/${id}/tenders`, { params }),
  interactions: (id, params) => apiClient.get(`/clients/${id}/interactions`, { params }),
  notes:        (id)     => apiClient.get(`/clients/${id}/notes`),
  addNote:      (id, note) => apiClient.post(`/clients/${id}/notes`, { note }),
  attachments:  (id) => apiClient.get(`/clients/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/clients/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/clients/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/clients/${id}/attachments/${attachmentId}`),
  history:      (id) => apiClient.get(`/clients/${id}/history`),
};

export const interactionService = {
  list:     (params) => apiClient.get('/interactions', { params }),
  stats:    ()       => apiClient.get('/interactions/stats'),
  exportCsv: (params) => apiClient.get('/interactions/export', blob(params)),
  create:   (data)   => apiClient.post('/interactions', data),
  get:      (id)     => apiClient.get(`/interactions/${id}`),
  update:   (id, data) => apiClient.patch(`/interactions/${id}`, data),
  followUp: (id, data) => apiClient.post(`/interactions/${id}/follow-up`, data),
  attachments: (id) => apiClient.get(`/interactions/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/interactions/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/interactions/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/interactions/${id}/attachments/${attachmentId}`),
  history:  (id) => apiClient.get(`/interactions/${id}/history`),
};

export const opportunityService = {
  list:            (params) => apiClient.get('/opportunities', { params }),
  stats:           ()       => apiClient.get('/opportunities/stats'),
  board:           (params) => apiClient.get('/opportunities/board', { params }),
  exportCsv:       (params) => apiClient.get('/opportunities/export', blob(params)),
  create:          (data)   => apiClient.post('/opportunities', data),
  get:             (id)     => apiClient.get(`/opportunities/${id}`),
  update:          (id, data) => apiClient.patch(`/opportunities/${id}`, data),
  advance:         (id)     => apiClient.post(`/opportunities/${id}/advance`),
  markLost:        (id, reason) => apiClient.post(`/opportunities/${id}/lost`, { reason }),
  convertToTender: (id, data) => apiClient.post(`/opportunities/${id}/convert-to-tender`, data),
  attachments: (id) => apiClient.get(`/opportunities/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/opportunities/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/opportunities/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/opportunities/${id}/attachments/${attachmentId}`),
  history:         (id) => apiClient.get(`/opportunities/${id}/history`),
};

export const tenderService = {
  list:      (params) => apiClient.get('/tenders', { params }),
  stats:     ()       => apiClient.get('/tenders/stats'),
  exportCsv: (params) => apiClient.get('/tenders/export', blob(params)),
  create:    (data)   => apiClient.post('/tenders', data),
  get:       (id)     => apiClient.get(`/tenders/${id}`),
  update:    (id, data) => apiClient.patch(`/tenders/${id}`, data),
  notes:     (id)     => apiClient.get(`/tenders/${id}/notes`),
  addNote:   (id, note) => apiClient.post(`/tenders/${id}/notes`, { note }),
  advance:   (id)     => apiClient.post(`/tenders/${id}/advance`),
  decide:    (id, decision) => apiClient.post(`/tenders/${id}/decide`, { decision }),
  archive:   (id)     => apiClient.post(`/tenders/${id}/archive`),
  attachments: (id) => apiClient.get(`/tenders/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/tenders/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/tenders/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/tenders/${id}/attachments/${attachmentId}`),
  history:   (id) => apiClient.get(`/tenders/${id}/history`),
};

export const rfqService = {
  list:       (params) => apiClient.get('/rfqs', { params }),
  stats:      ()       => apiClient.get('/rfqs/stats'),
  exportCsv:  (params) => apiClient.get('/rfqs/export', blob(params)),
  create:     (data)   => apiClient.post('/rfqs', data),
  get:        (id)     => apiClient.get(`/rfqs/${id}`),
  update:     (id, data) => apiClient.patch(`/rfqs/${id}`, data),
  notes:      (id)     => apiClient.get(`/rfqs/${id}/notes`),
  addNote:    (id, note) => apiClient.post(`/rfqs/${id}/notes`, { note }),
  advance:    (id)     => apiClient.post(`/rfqs/${id}/advance`),
  awarded:    (id)     => apiClient.post(`/rfqs/${id}/awarded`),
  lost:       (id)     => apiClient.post(`/rfqs/${id}/lost`),
  archive:    (id)     => apiClient.post(`/rfqs/${id}/archive`),
  attachments: (id) => apiClient.get(`/rfqs/${id}/attachments`),
  uploadAttachment: (id, file) => apiClient.post(`/rfqs/${id}/attachments`, fileForm(file)),
  downloadAttachment: (id, attachmentId) => apiClient.get(`/rfqs/${id}/attachments/${attachmentId}/download`),
  removeAttachment: (id, attachmentId) => apiClient.delete(`/rfqs/${id}/attachments/${attachmentId}`),
  history:    (id) => apiClient.get(`/rfqs/${id}/history`),
};

export const bizdevReportService = {
  get:        () => apiClient.get('/business-dev/reports'),
  exportFile: (format) => apiClient.get('/business-dev/reports/export', { params: { format }, responseType: 'blob' }),
};

export const projectConversionService = {
  fromTender: (tenderId, data) => apiClient.post(`/projects/from-tender/${tenderId}`, data),
};
