import apiClient from './apiClient';

export const clientService = {
  list:         (params) => apiClient.get('/clients', { params }),
  stats:        ()       => apiClient.get('/clients/stats'),
  create:       (data)   => apiClient.post('/clients', data),
  get:          (id)     => apiClient.get(`/clients/${id}`),
  update:       (id, data) => apiClient.patch(`/clients/${id}`, data),
  archive:      (id, reason) => apiClient.post(`/clients/${id}/archive`, { reason }),
  tenders:      (id, params) => apiClient.get(`/clients/${id}/tenders`, { params }),
  interactions: (id, params) => apiClient.get(`/clients/${id}/interactions`, { params }),
  notes:        (id)     => apiClient.get(`/clients/${id}/notes`),
  addNote:      (id, note) => apiClient.post(`/clients/${id}/notes`, { note }),
};

export const interactionService = {
  list:     (params) => apiClient.get('/interactions', { params }),
  stats:    ()       => apiClient.get('/interactions/stats'),
  create:   (data)   => apiClient.post('/interactions', data),
  get:      (id)     => apiClient.get(`/interactions/${id}`),
  update:   (id, data) => apiClient.patch(`/interactions/${id}`, data),
  followUp: (id, data) => apiClient.post(`/interactions/${id}/follow-up`, data),
};

export const opportunityService = {
  list:            (params) => apiClient.get('/opportunities', { params }),
  stats:           ()       => apiClient.get('/opportunities/stats'),
  board:           ()       => apiClient.get('/opportunities/board'),
  create:          (data)   => apiClient.post('/opportunities', data),
  get:             (id)     => apiClient.get(`/opportunities/${id}`),
  update:          (id, data) => apiClient.patch(`/opportunities/${id}`, data),
  advance:         (id)     => apiClient.post(`/opportunities/${id}/advance`),
  markLost:        (id, reason) => apiClient.post(`/opportunities/${id}/lost`, { reason }),
  convertToTender: (id, data) => apiClient.post(`/opportunities/${id}/convert-to-tender`, data),
};

export const tenderService = {
  list:      (params) => apiClient.get('/tenders', { params }),
  stats:     ()       => apiClient.get('/tenders/stats'),
  create:    (data)   => apiClient.post('/tenders', data),
  get:       (id)     => apiClient.get(`/tenders/${id}`),
  update:    (id, data) => apiClient.patch(`/tenders/${id}`, data),
  documents: (id)     => apiClient.get(`/tenders/${id}/documents`),
  addDocument:(id, formData) => apiClient.post(`/tenders/${id}/documents`, formData),
  activityLog:(id, params) => apiClient.get(`/tenders/${id}/activity-log`, { params }),
  notes:     (id)     => apiClient.get(`/tenders/${id}/notes`),
  addNote:   (id, note) => apiClient.post(`/tenders/${id}/notes`, { note }),
  advance:   (id)     => apiClient.post(`/tenders/${id}/advance`),
  decide:    (id, data) => apiClient.post(`/tenders/${id}/decide`, data),
  archive:   (id, reason) => apiClient.post(`/tenders/${id}/archive`, { reason }),
};

export const rfqService = {
  list:       (params) => apiClient.get('/rfqs', { params }),
  stats:      ()       => apiClient.get('/rfqs/stats'),
  create:     (data)   => apiClient.post('/rfqs', data),
  get:        (id)     => apiClient.get(`/rfqs/${id}`),
  update:     (id, data) => apiClient.patch(`/rfqs/${id}`, data),
  documents:  (id)     => apiClient.get(`/rfqs/${id}/documents`),
  addDocument:(id, formData) => apiClient.post(`/rfqs/${id}/documents`, formData),
  activityLog:(id, params) => apiClient.get(`/rfqs/${id}/activity-log`, { params }),
  notes:      (id)     => apiClient.get(`/rfqs/${id}/notes`),
  addNote:    (id, note) => apiClient.post(`/rfqs/${id}/notes`, { note }),
  advance:    (id)     => apiClient.post(`/rfqs/${id}/advance`),
  awarded:    (id, data) => apiClient.post(`/rfqs/${id}/awarded`, data),
  lost:       (id, reason) => apiClient.post(`/rfqs/${id}/lost`, { reason }),
  archive:    (id, reason) => apiClient.post(`/rfqs/${id}/archive`, { reason }),
};

export const bizdevReportService = {
  get: () => apiClient.get('/business-dev/reports'),
};
