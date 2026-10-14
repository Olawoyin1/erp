import apiClient from './apiClient';

export const employeeService = {
  // List — paginated, supports q / status / departmentId
  list: (params) => apiClient.get('/employees', { params }),

  // Single
  get: (id) => apiClient.get(`/employees/${id}`),

  // Create
  create: (data) => apiClient.post('/employees', data),

  // Update
  update: (id, data) => apiClient.patch(`/employees/${id}`, data),

  // Assign manager
  assignManager: (id, reportingManagerId) =>
    apiClient.post(`/employees/${id}/manager`, { reportingManagerId }),

  // Deactivate
  deactivate: (id, reason) =>
    apiClient.post(`/employees/${id}/deactivate`, { reason }),

  // Lifecycle
  confirm:    (id)         => apiClient.post(`/employees/${id}/confirm`),
  reactivate: (id)         => apiClient.post(`/employees/${id}/reactivate`),
  linkUser:   (id, userId) => apiClient.post(`/employees/${id}/link-user`, { userId }),

  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/employees/${id}/photo`, form);
  },
  removePhoto: (id) => apiClient.delete(`/employees/${id}/photo`),

  // Pickers and bulk
  lookups:       ()       => apiClient.get('/employees/lookups'),
  linkableUsers: (q)      => apiClient.get('/employees/linkable-users', { params: q ? { q } : {} }),
  exportList:    (params) => apiClient.get('/employees/export', { params, responseType: 'blob' }),

  // Sub-resources (used in EmployeeProfile)
  getCertifications: (id) => apiClient.get(`/employees/${id}/certifications`),
  getLeaveHistory:   (id) => apiClient.get(`/employees/${id}/leave-history`),
  getProjects:       (id) => apiClient.get(`/employees/${id}/projects`),
  getDocuments:      (id) => apiClient.get(`/employees/${id}/documents`),
  getPayroll:        (id) => apiClient.get(`/employees/${id}/payroll`),

  uploadCertification: (id, { certificateName, issuedDate, expiryDate, file }) => {
    const form = new FormData();
    form.append('certificateName', certificateName);
    form.append('issuedDate', issuedDate);
    if (expiryDate) form.append('expiryDate', expiryDate);
    form.append('file', file);
    return apiClient.post(`/employees/${id}/certifications`, form);
  },
  uploadDocument: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/employees/${id}/documents`, form);
  },
  documentUrl:    (id, docId) => apiClient.get(`/employees/${id}/documents/${docId}/download`),
  verifyDocument: (id, docId) => apiClient.post(`/onboarding/${id}/documents/${docId}/verify`),
};

// ─── Bulk import (csv or xlsx; the default is a dry run) ─────────────────────
export const importService = {
  template: (entity) => apiClient.get(`/imports/${entity}/template`, { responseType: 'blob' }),
  upload: (entity, file, dryRun = true) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/imports/${entity}`, form, { params: { dryRun: dryRun ? 'true' : 'false' } });
  },
};

// ─── Leave ────────────────────────────────────────────────────────────────────
export const leaveService = {
  list:           (params)          => apiClient.get('/leave-requests', { params }),
  stats:          ()                => apiClient.get('/leave-requests/stats'),
  get:            (id)              => apiClient.get(`/leave-requests/${id}`),
  approve:        (id)              => apiClient.post(`/leave-requests/${id}/approve`),
  decline:        (id, reason)      => apiClient.post(`/leave-requests/${id}/decline`, { reason }),
  requestChanges: (id, message)     => apiClient.post(`/leave-requests/${id}/request-changes`, { message }),
  create:         (data)            => apiClient.post('/leave-requests', data),
  balances:       (empId, year)     => apiClient.get(`/leave-balances/${empId}`, { params: { year } }),
  types:          ()                => apiClient.get('/leave-types'),
  duration:       (startDate, endDate) => apiClient.get('/leave-requests/duration', { params: { startDate, endDate } }),
  history:        (id)              => apiClient.get(`/leave-requests/${id}/history`),
  attachmentUrl:  (id)              => apiClient.get(`/leave-requests/${id}/attachment`),
  uploadAttachment: (file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/leave-requests/attachments', form);
  },
  exportList:     (params)          => apiClient.get('/leave-requests/export', { params, responseType: 'blob' }),
};

// ─── Public holidays (they decide which days count as leave days) ─────────────
export const holidayService = {
  list:   (year)       => apiClient.get('/public-holidays', { params: year ? { year } : {} }),
  create: (data)       => apiClient.post('/public-holidays', data),
  update: (id, data)   => apiClient.patch(`/public-holidays/${id}`, data),
  remove: (id)         => apiClient.delete(`/public-holidays/${id}`),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceService = {
  list:           (params)     => apiClient.get('/attendance', { params }),
  stats:          (date)       => apiClient.get('/attendance/stats', { params: date ? { date } : {} }),
  clockIn:        (locationId) => apiClient.post('/attendance/clock-in', locationId ? { locationId } : {}),
  clockOut:       ()           => apiClient.post('/attendance/clock-out'),
  log:            (data)       => apiClient.post('/attendance', data),
  approveOvertime:(id)         => apiClient.post(`/attendance/${id}/approve`),
  locations:      ()           => apiClient.get('/attendance/locations'),
  exportList:     (params)     => apiClient.get('/attendance/export', { params, responseType: 'blob' }),
};

// ─── Recruitment ──────────────────────────────────────────────────────────────
export const recruitmentService = {
  listJobPostings: (params) => apiClient.get('/job-postings', { params }),
  createJob:       (data)   => apiClient.post('/job-postings', data),
  updateJob:       (id, data) => apiClient.patch(`/job-postings/${id}`, data),
  pauseJob:        (id, reason) => apiClient.post(`/job-postings/${id}/pause`, { reason }),
  resumeJob:       (id)     => apiClient.post(`/job-postings/${id}/resume`),
  closeJob:        (id, reason) => apiClient.post(`/job-postings/${id}/close`, { reason }),

  jobLookups:      ()       => apiClient.get('/job-postings/lookups'),
  exportJobs:      (params) => apiClient.get('/job-postings/export', { params, responseType: 'blob' }),

  listCandidates:  (params) => apiClient.get('/candidates', { params }),
  getCandidate:    (id)     => apiClient.get(`/candidates/${id}`),
  createCandidate: (data)   => apiClient.post('/candidates', data),
  advanceCandidate:(id)     => apiClient.post(`/candidates/${id}/advance`),
  rejectCandidate: (id, reason) => apiClient.post(`/candidates/${id}/reject`, { reason }),
  convertCandidate:(id, data) => apiClient.post(`/candidates/${id}/convert-to-employee`, data),
  exportCandidates:(params) => apiClient.get('/candidates/export', { params, responseType: 'blob' }),
  uploadCandidateDocument: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/candidates/${id}/documents`, form);
  },
  candidateDocumentUrl: (id, attachmentId) => apiClient.get(`/candidates/${id}/documents/${attachmentId}/download`),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingService = {
  list:      (params) => apiClient.get('/onboarding', { params }),
  stats:     ()       => apiClient.get('/onboarding/stats'),
  getByEmployee: (empId) => apiClient.get(`/onboarding/${empId}`),
  advance:   (empId)  => apiClient.post(`/onboarding/${empId}/status`),
  verifyDoc: (empId, docId) => apiClient.post(`/onboarding/${empId}/documents/${docId}/verify`),
  exportList: (params) => apiClient.get('/onboarding/export', { params, responseType: 'blob' }),
};

// ─── Deployments ──────────────────────────────────────────────────────────────
export const deploymentService = {
  list:       (params)          => apiClient.get('/deployments', { params }),
  stats:      ()                => apiClient.get('/deployments/stats'),
  get:        (id)              => apiClient.get(`/deployments/${id}`),
  create:     (data)            => apiClient.post('/deployments', data),
  update:     (id, data)        => apiClient.patch(`/deployments/${id}`, data),
  setStatus:  (id, status)      => apiClient.post(`/deployments/${id}/status`, { status }),
  getReport:  (id)              => apiClient.get(`/deployments/${id}/report`),
  reportPdf:  (id)              => apiClient.get(`/deployments/${id}/report`, { params: { format: 'pdf' }, responseType: 'blob' }),
  lookups:    ()                => apiClient.get('/deployments/lookups'),
  exportList: (params)          => apiClient.get('/deployments/export', { params, responseType: 'blob' }),
};

// ─── Training Programs ────────────────────────────────────────────────────────
export const trainingService = {
  list:            (params)               => apiClient.get('/training-programs', { params }),
  create:          (data)                 => apiClient.post('/training-programs', data),
  get:             (id)                   => apiClient.get(`/training-programs/${id}`),
  update:          (id, data)             => apiClient.patch(`/training-programs/${id}`, data),
  setStatus:       (id, status)           => apiClient.post(`/training-programs/${id}/status`, { status }),
  cancel:          (id, reason)           => apiClient.post(`/training-programs/${id}/cancel`, { reason }),
  getParticipants: (id)                   => apiClient.get(`/training-programs/${id}/participants`),
  enroll:          (id, employeeIds)      => apiClient.post(`/training-programs/${id}/participants`, { employeeIds }),
  markAttendance:  (id, empId, attended)  => apiClient.post(`/training-programs/${id}/participants/${empId}/attendance`, { attended }),
  evaluate:        (id, empId, data)      => apiClient.post(`/training-programs/${id}/participants/${empId}/evaluate`, data),
  reEvaluate:      (id, empId, data)      => apiClient.post(`/training-programs/${id}/participants/${empId}/re-evaluate`, data),
  exportList:      (params)               => apiClient.get('/training-programs/export', { params, responseType: 'blob' }),
  uploadCertificate: (id, empId, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/training-programs/${id}/participants/${empId}/certificate`, form);
  },
  certificateUrl:  (id, empId)            => apiClient.get(`/training-programs/${id}/participants/${empId}/certificate/download`),
};

// ─── Payroll ──────────────────────────────────────────────────────────────────
export const payrollService = {
  // Salary Structures
  listStructures:     (params)       => apiClient.get('/salary-structures', { params }),
  createStructure:    (data)         => apiClient.post('/salary-structures', data),
  getStructure:       (id)           => apiClient.get(`/salary-structures/${id}`),
  updateStructure:    (id, data)     => apiClient.patch(`/salary-structures/${id}`, data),
  setStructureStatus: (id, status)   => apiClient.post(`/salary-structures/${id}/status`, { status }),
  duplicateStructure: (id)           => apiClient.post(`/salary-structures/${id}/duplicate`),

  // Tax Definitions
  listTaxDefs:   (params)      => apiClient.get('/tax-definitions', { params }),
  createTaxDef:  (data)        => apiClient.post('/tax-definitions', data),
  getTaxDef:     (id)          => apiClient.get(`/tax-definitions/${id}`),
  updateTaxDef:  (id, data)    => apiClient.patch(`/tax-definitions/${id}`, data),

  // Payslips (HR view). `config` carries the Idempotency-Key header on money-moving POSTs.
  listPayslips:    (params)         => apiClient.get('/payslips', { params }),
  createPayslip:   (data, config)   => apiClient.post('/payslips', data, config),
  getPayslip:      (id)             => apiClient.get(`/payslips/${id}`),
  downloadPayslip: (id)             => apiClient.get(`/payslips/${id}/download`, { responseType: 'blob' }),
  emailPayslip:    (id)             => apiClient.post(`/payslips/${id}/email`),

  // Payslips (self-service, any signed-in employee)
  myPayslips:         ()   => apiClient.get('/payslips/mine'),
  downloadMyPayslip:  (id) => apiClient.get(`/payslips/mine/${id}/download`, { responseType: 'blob' }),

  // Payroll Runs
  listRuns:    (params)             => apiClient.get('/payroll-runs', { params }),
  runStats:    ()                   => apiClient.get('/payroll-runs/stats'),
  createRun:   (data, config)       => apiClient.post('/payroll-runs', data, config),
  getRun:      (id)                 => apiClient.get(`/payroll-runs/${id}`),
  approveRun:  (id, config)         => apiClient.post(`/payroll-runs/${id}/approve`, undefined, config),
  rejectRun:   (id, reason)         => apiClient.post(`/payroll-runs/${id}/reject`, reason ? { reason } : {}),
};

// ─── Payroll statutory configuration (versions are append-only; each needs accountant confirmation) ───
export const statutoryService = {
  getConfig:     ()          => apiClient.get('/statutory/config'),
  createVersion: (data)      => apiClient.post('/statutory/config', data),
  confirm:       (id)        => apiClient.post(`/statutory/config/${id}/confirm`),
};

// ─── HR Reports ───────────────────────────────────────────────────────────────
export const reportService = {
  get: () => apiClient.get('/hr/reports'),
};

// ─── HR Requests (administrative requests chain) ──────────────────────────────
export const requestService = {
  list:     (params)         => apiClient.get('/admin-requests', { params }),
  stats:    ()               => apiClient.get('/admin-requests/stats'),
  get:      (id)             => apiClient.get(`/admin-requests/${id}`),
  create:   (data)           => apiClient.post('/admin-requests', data),
  approve:  (id)             => apiClient.post(`/admin-requests/${id}/approve`),
  reject:   (id, reason)     => apiClient.post(`/admin-requests/${id}/reject`, { reason }),
  complete: (id)             => apiClient.post(`/admin-requests/${id}/complete`),
  cancel:   (id, reason)     => apiClient.post(`/admin-requests/${id}/cancel`, reason ? { reason } : {}),
  attachments:    (id)       => apiClient.get(`/admin-requests/${id}/attachments`),
  attach: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/admin-requests/${id}/attachments`, form);
  },
  attachmentUrl:  (id, attachmentId) => apiClient.get(`/admin-requests/${id}/attachments/${attachmentId}/download`),
  exportList:     (params)   => apiClient.get('/admin-requests/export', { params, responseType: 'blob' }),
};

// ─── Grievances & Disciplinary ────────────────────────────────────────────────
export const grievanceService = {
  list:        (params)       => apiClient.get('/disciplinary-cases', { params }),
  stats:       ()             => apiClient.get('/disciplinary-cases/stats'),
  get:         (id)           => apiClient.get(`/disciplinary-cases/${id}`),
  create:      (data)         => apiClient.post('/disciplinary-cases', data),
  update:      (id, data)     => apiClient.patch(`/disciplinary-cases/${id}`, data),
  startReview: (id)           => apiClient.post(`/disciplinary-cases/${id}/start-review`),
  resolve:     (id)           => apiClient.post(`/disciplinary-cases/${id}/resolve`),
  close:       (id)           => apiClient.post(`/disciplinary-cases/${id}/close`),
  addNote:     (id, note)     => apiClient.post(`/disciplinary-cases/${id}/notes`, { note }),
  exportList:  (params)       => apiClient.get('/disciplinary-cases/export', { params, responseType: 'blob' }),
  documents:   (id)           => apiClient.get(`/disciplinary-cases/${id}/documents`),
  uploadDocument: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post(`/disciplinary-cases/${id}/documents`, form);
  },
  documentUrl: (id, attachmentId) => apiClient.get(`/disciplinary-cases/${id}/documents/${attachmentId}/download`),
};
