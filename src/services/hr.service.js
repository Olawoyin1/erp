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

  // Sub-resources (used in EmployeeProfile)
  getCertifications: (id) => apiClient.get(`/employees/${id}/certifications`),
  getLeaveHistory:   (id) => apiClient.get(`/employees/${id}/leave-history`),
  getProjects:       (id) => apiClient.get(`/employees/${id}/projects`),
  getDocuments:      (id) => apiClient.get(`/employees/${id}/documents`),
  getPayroll:        (id) => apiClient.get(`/employees/${id}/payroll`),
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
};

// Leave types are seeded server-side — no GET endpoint exists.
// Names must match exactly what the backend seeds.
export const SEEDED_LEAVE_TYPES = [
  'Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency',
  'Study', 'Unpaid', 'Compassionate',
];

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceService = {
  list:           (params)     => apiClient.get('/attendance', { params }),
  stats:          (date)       => apiClient.get('/attendance/stats', { params: date ? { date } : {} }),
  clockIn:        (locationId) => apiClient.post('/attendance/clock-in', locationId ? { locationId } : {}),
  clockOut:       ()           => apiClient.post('/attendance/clock-out'),
  log:            (data)       => apiClient.post('/attendance', data),
  approveOvertime:(id)         => apiClient.post(`/attendance/${id}/approve`),
};

// ─── Recruitment ──────────────────────────────────────────────────────────────
export const recruitmentService = {
  listJobPostings: (params) => apiClient.get('/job-postings', { params }),
  createJob:       (data)   => apiClient.post('/job-postings', data),
  updateJob:       (id, data) => apiClient.patch(`/job-postings/${id}`, data),
  pauseJob:        (id, reason) => apiClient.post(`/job-postings/${id}/pause`, { reason }),
  resumeJob:       (id)     => apiClient.post(`/job-postings/${id}/resume`),
  closeJob:        (id, reason) => apiClient.post(`/job-postings/${id}/close`, { reason }),

  listCandidates:  (params) => apiClient.get('/candidates', { params }),
  advanceCandidate:(id)     => apiClient.post(`/candidates/${id}/advance`),
  rejectCandidate: (id, reason) => apiClient.post(`/candidates/${id}/reject`, { reason }),
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingService = {
  list:      (params) => apiClient.get('/onboarding', { params }),
  stats:     ()       => apiClient.get('/onboarding/stats'),
  getByEmployee: (empId) => apiClient.get(`/onboarding/${empId}`),
  advance:   (empId)  => apiClient.post(`/onboarding/${empId}/status`),
  verifyDoc: (empId, docId) => apiClient.post(`/onboarding/${empId}/documents/${docId}/verify`),
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

  // Payslips
  listPayslips:    (params) => apiClient.get('/payslips', { params }),
  createPayslip:   (data)   => apiClient.post('/payslips', data),
  getPayslip:      (id)     => apiClient.get(`/payslips/${id}`),
  downloadPayslip: (id)     => apiClient.get(`/payslips/${id}/download`),
  emailPayslip:    (id)     => apiClient.post(`/payslips/${id}/email`),

  // Payroll Runs
  listRuns:    (params)          => apiClient.get('/payroll-runs', { params }),
  createRun:   (data)            => apiClient.post('/payroll-runs', data),
  getRun:      (id)              => apiClient.get(`/payroll-runs/${id}`),
  approveRun:  (id)              => apiClient.post(`/payroll-runs/${id}/approve`),
  rejectRun:   (id, reason)      => apiClient.post(`/payroll-runs/${id}/reject`, { reason }),
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
};
