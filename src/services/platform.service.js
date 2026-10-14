import apiClient from './apiClient';

// ─── Users ────────────────────────────────────────────────────────────────────
export const userService = {
  // GET /users: paginated, supports q / status / departmentId / roleId
  list: (params) => apiClient.get('/users', { params }),

  // GET /users/export: CSV of every user matching the same filters (core.user.export)
  exportCsv: (params) => apiClient.get('/users/export', { params, responseType: 'blob' }),

  // GET /users/:id
  get: (id) => apiClient.get(`/users/${id}`),

  // POST /users: invite a new user
  invite: (data) => apiClient.post('/users', data),

  // PATCH /users/:id: profile fields (firstName, lastName, jobTitle, phoneNumber, departmentId, locationId)
  update: (id, data) => apiClient.patch(`/users/${id}`, data),

  // POST /users/:id/status: active | suspended | deactivated (reason required unless active)
  setStatus: (id, status, reason) =>
    apiClient.post(`/users/${id}/status`, { status, ...(reason ? { reason } : {}) }),

  // POST /users/:id/roles: replaces the role list
  setRoles: (id, roleIds) => apiClient.post(`/users/${id}/roles`, { roleIds }),

  // POST /users/:id/send-password-reset
  sendPasswordReset: (id) => apiClient.post(`/users/${id}/send-password-reset`),

  // POST /users/:id/resend-invite
  resendInvite: (id) => apiClient.post(`/users/${id}/resend-invite`),

  // POST /users/:id/cancel-invite: deletes a never-activated user
  cancelInvite: (id, reason) => apiClient.post(`/users/${id}/cancel-invite`, { reason }),

  // GET /users/:id/audit-log (core.auditlog.view)
  getAuditLog: (id, params) => apiClient.get(`/users/${id}/audit-log`, { params }),
};

// ─── Roles & Permissions ──────────────────────────────────────────────────────
export const roleService = {
  // GET /roles: full list with userCount (not paginated)
  list: () => apiClient.get('/roles'),

  // GET /roles/:id
  get: (id) => apiClient.get(`/roles/${id}`),

  // POST /roles
  create: (data) => apiClient.post('/roles', data),

  // PATCH /roles/:id
  update: (id, data) => apiClient.patch(`/roles/${id}`, data),

  // DELETE /roles/:id
  delete: (id) => apiClient.delete(`/roles/${id}`),

  // GET /roles/:id/audit-log (core.auditlog.view)
  getAuditLog: (id, params) => apiClient.get(`/roles/${id}/audit-log`, { params }),

  // GET /permissions: catalogue + keys + uiModules + uiActions
  getPermissions: () => apiClient.get('/permissions'),
};

// ─── Departments / locations (user forms, role form, Settings panels) ─────────
export const departmentService = {
  list: () => apiClient.get('/departments'),
  get: (id) => apiClient.get(`/departments/${id}`),
  create: (data) => apiClient.post('/departments', data),
  update: (id, data) => apiClient.patch(`/departments/${id}`, data),
  activate: (id) => apiClient.post(`/departments/${id}/activate`),
  deactivate: (id) => apiClient.post(`/departments/${id}/deactivate`),
};

export const locationService = {
  list: () => apiClient.get('/locations'),
  get: (id) => apiClient.get(`/locations/${id}`),
  create: (data) => apiClient.post('/locations', data),
  update: (id, data) => apiClient.patch(`/locations/${id}`, data),
};

// ─── Audit trail and activity feed ────────────────────────────────────────────
export const auditService = {
  // GET /audit-logs: system-wide before/after trail (core.auditlog.view)
  list: (params) => apiClient.get('/audit-logs', { params }),

  // GET /activity: workflow events across modules (core.auditlog.view)
  activity: (params) => apiClient.get('/activity', { params }),
};

export const taskService = {
  list:        (params) => apiClient.get('/tasks', { params }),
  stats:       (module) => apiClient.get('/tasks/stats', { params: module ? { module } : {} }),
  board:       (module) => apiClient.get('/tasks/board', { params: module ? { module } : {} }),
  create:      (data)   => apiClient.post('/tasks', data),
  get:         (id)     => apiClient.get(`/tasks/${id}`),
  update:      (id, data) => apiClient.patch(`/tasks/${id}`, data),
  setStatus:   (id, status) => apiClient.post(`/tasks/${id}/status`, { status }),
  addAttachment:(id, formData) => apiClient.post(`/tasks/${id}/attachments`, formData),
  deleteAttachment:(id, attachmentId) => apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`),
};
