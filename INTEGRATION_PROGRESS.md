# PGSL ERP — Backend Integration Progress

This document tracks the status of replacing all mock data with real backend API calls.
Update it as each module is completed.

---

## Tech Stack Added

| Package | Version | Purpose |
|---|---|---|
| `@reduxjs/toolkit` | latest | State management |
| `react-redux` | latest | React bindings for Redux |
| `axios` | latest | HTTP client with interceptors |

---

## Architecture

```
src/
  services/          ← axios API calls, one file per module
    apiClient.js     ← axios instance, token management, refresh interceptor
    auth.service.js
    dashboard.service.js
    ... (one per module)
  store/             ← Redux slices, one folder per module
    index.js         ← configureStore, register all reducers
    authSlice.js     ← user, permissions, roles, mfaToken, bootstrapping
    uiSlice.js       ← global UI (notification badge count)
    dashboard/
      dashboardSlice.js
    hr/
      employeesSlice.js  (pending)
      ...
  hooks/
    usePermission.js ← usePermission('hr.employee.view'), useAnyPermission(...)
    useKobo.js       ← koboToNaira(), nairaToKobo()
  components/
    auth/
      RequireAuth.jsx    ← route guard (redirects to /auth/login if not authenticated)
      PermissionGate.jsx ← conditionally renders children based on permission key
```

### Key conventions
- **Money**: all API amounts are whole kobo integers. Use `koboToNaira()` for display, `nairaToKobo()` for form submission.
- **Auth**: access token stored in `sessionStorage`, refresh token in `localStorage`. Auto-refresh on 401 via axios interceptor.
- **2FA**: after login, check `data.mfaRequired`. If true, hold `mfaToken` in Redux and route to OTP screen. Do not set `isAuthenticated` until OTP is verified.
- **Permissions**: `GET /auth/me` returns `{ user, roles, permissions[] }`. Use `usePermission('key')` hook or `<PermissionGate permission="key">` component to gate UI elements. Super-admin bypasses all checks.
- **Idempotency**: money-moving POSTs (invoices, payables, payroll, journal entries) must include an `Idempotency-Key` header (UUID per form submission).
- **Paginated vs non-paginated**: paginated responses include a `meta` block `{ page, limit, total, totalPages }`. Non-paginated return bare arrays or objects — check each endpoint in the backend docs.

---

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL` to the backend base URL.

```
VITE_API_URL=http://localhost:4000/api/v1
```

---

## Progress

Legend: ✅ Done · 🔄 In Progress · ⬜ Not Started

---

### Phase 1 — Foundation

| Task | Status | Notes |
|---|---|---|
| Install dependencies (`@reduxjs/toolkit`, `react-redux`, `axios`) | ✅ | |
| `src/services/apiClient.js` — axios instance, token helpers, 401 auto-refresh | ✅ | |
| `src/store/index.js` — configure Redux store | ✅ | |
| `src/store/authSlice.js` — login, verifyOtp, fetchCurrentUser, logout | ✅ | |
| `src/store/uiSlice.js` — notification badge count | ✅ | |
| `src/hooks/usePermission.js` — `usePermission`, `useAnyPermission` | ✅ | |
| `src/hooks/useKobo.js` — `koboToNaira`, `nairaToKobo` | ✅ | |
| `src/components/auth/RequireAuth.jsx` — route guard | ✅ | |
| `src/components/auth/PermissionGate.jsx` — conditional render by permission | ✅ | |
| `src/main.jsx` — wrap app in Redux `<Provider>` | ✅ | |
| `src/App.jsx` — bootstrap `fetchCurrentUser` on load, wrap layout in `RequireAuth` | ✅ | |

---

### Phase 2a — Auth Pages

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `Login.jsx` | `POST /auth/login` | ✅ | Branches on `mfaRequired` → redirects to `/auth/verify` |
| `VerifyIdentity.jsx` | `POST /auth/verify-otp`, `POST /auth/resend-otp` | ✅ | Reads `mfaToken` from Redux; redirects to login if token absent; real resend with cooldown |
| `ForgotPassword.jsx` | `POST /auth/forgot-password` | ✅ | Always navigates to check-email (API never reveals if email exists) |
| `CreateNewPassword.jsx` | `POST /auth/reset-password` | ✅ | Reads `?token=` from URL query string |
| `SetupPassword.jsx` | `POST /auth/reset-password` | ✅ | Same endpoint; reads `?token=&email=` from invite link |
| `AccountSetupComplete.jsx` | — (display only) | ✅ | No changes needed |

---

### Phase 2b — Platform Core

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `UserManagement.jsx` | `GET /users`, `POST /users`, `PATCH /users/:id`, `POST /users/:id/status`, `POST /users/:id/roles` | ✅ | `platform.service.js` + `store/platform/usersSlice.js` |
| `RolesPermissions.jsx` | `GET /roles`, `POST /roles`, `PATCH /roles/:id`, `DELETE /roles/:id`, `GET /permissions` | ✅ | Rewritten with Redux; modulePresets ↔ UI checkbox conversion; system-role guard |
| Settings — Profile tab | `GET /auth/me`, `PATCH /me/profile` | ⬜ | |
| Settings — Notifications | `GET /me/notification-preferences`, `PATCH /me/notification-preferences` | ⬜ | |
| Settings — Company / System Config | `GET /settings/company`, `PATCH /settings/company`, `GET /settings/notification-preferences`, etc. | ⬜ | |

---

### Phase 2c — Dashboard

| Component | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `DashboardOverview.jsx` — tiles | `GET /dashboard/overview` (tiles) | ✅ | 4 tiles rendered with kobo→naira formatting |
| `DashboardOverview.jsx` — chart | `GET /dashboard/overview` (activeContracts) | ✅ | 12-month SVG chart with hover tooltips; no delta/trend (not in API by design) |
| `DashboardOverview.jsx` — projects table | `GET /dashboard/overview` (activeProjectsCostVsBudget) | ✅ | redAlert badge, kobo amounts, compact formatting |
| Recent Activity panel | `GET /activity?page=1&limit=4` | ✅ | Uses `label` + `occurredAt` from API; icon derived from `action` string |
| Skeleton loaders | — | ✅ | All 4 sections show shimmer while loading |

---

### Phase 2d — HR Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `EmployeeList.jsx` | `GET /employees`, `POST /employees`, `PATCH /employees/:id`, `POST /employees/:id/deactivate`, `POST /employees/:id/manager` | ✅ | Server-side pagination, debounced search, filter drawer, skeleton loaders |
| `EmployeeProfile.jsx` | `GET /employees/:id` + all sub-resources | ✅ | Lazy loads each tab on first open; kobo→naira for payroll; deployment history for Projects tab |
| `AddEmployeeModal.jsx` | `POST /employees` | ✅ | Correct API field names; naira→kobo conversion on submit |
| `EditEmployeeModal.jsx` | `PATCH /employees/:id` | ✅ | Email read-only (API doesn't allow change); kobo↔naira conversion |
| `AssignManagerDrawer.jsx` | `POST /employees/:id/manager` | ✅ | Loads real employee list as picker; filters out self |
| `DeactivateModal.jsx` | `POST /employees/:id/deactivate` | ✅ | Passes reason string; no changes to UI needed |
| `Recruitment.jsx` | `GET /job-postings`, `POST /job-postings`, `PATCH /job-postings/:id`, `POST /job-postings/:id/pause`, `POST /job-postings/:id/resume`, `POST /job-postings/:id/close`, `GET /candidates`, `POST /candidates/:id/advance`, `POST /candidates/:id/reject` | ✅ | Redux recruitmentSlice; server-side pagination + debounced search; pause/close reason modals; advance/reject candidate with reason; populated field mapping |
| `Onboarding.jsx` | `GET /onboarding`, `GET /onboarding/stats`, `GET /onboarding/:employeeId`, `POST /onboarding/:employeeId/status`, `POST /onboarding/:employeeId/documents/:docId/verify` | ✅ | Redux onboardingSlice; live stat cards; drawer loads real checklist+docs per employee; progress ring; advance status; document verification |
| `Deployment.jsx` | `GET /deployments`, `GET /deployments/stats`, `POST /deployments`, `PATCH /deployments/:id`, `POST /deployments/:id/status`, `GET /deployments/:id/report` | ✅ | Redux deploymentSlice; live stat cards; create/edit drawers; status transitions enforced (pending→active, active→on_hold|completed, on_hold→active); report download for completed |
| `TrainingCertifications.jsx` | `GET /training-programs` | ✅ | Redux trainingSlice; server-side pagination; participants sub-page with enroll drawer |
| `LeaveManagement.jsx` | `GET /leave-requests`, `GET /leave-requests/stats`, `POST /leave-requests/:id/approve`, `POST /leave-requests/:id/decline`, `POST /leave-requests/:id/request-changes`, `POST /leave-requests`, `GET /leave-balances/:id` | ✅ | Redux leaveSlice; stat cards; leave balances for type picker; approve/decline/request-changes all wired |
| `AttendanceTimesheets.jsx` | `GET /attendance`, `GET /attendance/stats`, `POST /attendance/clock-in`, `POST /attendance/clock-out`, `POST /attendance`, `POST /attendance/:id/approve` | ✅ | Redux attendanceSlice; live stat tiles; adaptive clock-in/out button; log drawer; overtime approval modal |
| `PayrollInputs.jsx` | `GET /payroll-runs`, `GET /salary-structures`, `GET /tax-definitions`, `GET /payslips` + write endpoints | ✅ | Redux payrollSlice; 4-tab layout; kobo↔naira; skeleton loaders; generate/approve/reject payroll runs |
| `GrievancesDiscipline.jsx` | `GET /disciplinary-cases`, `GET /disciplinary-cases/stats`, `POST /disciplinary-cases`, `PATCH /disciplinary-cases/:id`, status transitions, notes | ✅ | Redux grievanceSlice; live stat cards; create/edit drawer; start-review/resolve/close; add-note modal |
| `Requests.jsx` | `GET /admin-requests`, `POST /admin-requests`, `POST /admin-requests/:id/approve`, `POST /admin-requests/:id/reject` | ✅ | adminRequestService (admin.service.js); server-side paginated list; 4-step chain in history tab; real employee picker |
| `HRDocuments.jsx` | `GET /documents?module=hr`, `GET /documents/stats`, `POST /documents`, state-machine endpoints | ✅ | documentService (documents.service.js); live stat tiles; upload, submit, approve, reject, checkout, checkin, archive, restore, download |
| `Reports.jsx` | `GET /hr/reports` | ✅ | hrReportService; skeleton loaders; dynamic tile rendering; real SVG line chart from headcount_trend series |

---

### Phase 2e — Administration Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `AdministrativeRequests.jsx` | `GET /admin-requests`, `POST /admin-requests`, approve/reject | ⬜ | 4-step chain |
| `AssetSupplies.jsx` | `GET /assets`, `GET /supply-items` | ⬜ | |
| `FacilityMaintenance.jsx` | `GET /facility-maintenance` | ⬜ | |
| `TravelsLogistics.jsx` | `GET /travel-requests`, `GET /movements` | ⬜ | |
| `Memos.jsx` | `GET /memos` (inbox scoped) | ⬜ | |
| `Documents.jsx` / `EDMS.jsx` | `GET /documents` | ⬜ | |
| `WasteDisposal.jsx` | `GET /disposals` | ⬜ | |

---

### Phase 2f — Business Development Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `ClientPipeline.jsx` | `GET /clients`, `GET /clients/stats` | ⬜ | |
| `CRMContacts.jsx` | `GET /interactions`, `GET /interactions/stats` | ⬜ | |
| `RFQsTenders.jsx` | `GET /tenders`, `GET /tenders/stats`, `GET /opportunities` | ⬜ | |
| `Proposals.jsx` | `GET /opportunities/board` | ⬜ | Kanban layout |

---

### Phase 2g — Technical Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `TechnicalProjects.jsx` | `GET /projects`, `GET /projects/stats` | ⬜ | |
| `ProjectDetail.jsx` | `GET /projects/:id`, WBS, logs, resource requests | ⬜ | |
| `EngineeringDocuments.jsx` | `GET /engineering-documents` | ⬜ | |
| `CalibrationRecords.jsx` | `GET /calibration-records` | ⬜ | |
| `ResourceAllocation.jsx` | `GET /technical/resource-requests` | ⬜ | |
| `TechnicalTasks.jsx` | Tasks endpoint | ⬜ | |
| `TechnicalReports.jsx` | `GET /technical/reports` | ⬜ | |

---

### Phase 2h — Procurement Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `PurchaseRequests.jsx` | `GET /purchase-requisitions` | ⬜ | |
| `RFQManagement.jsx` | `GET /procurement-rfqs` | ⬜ | |
| `PurchaseOrders.jsx` | `GET /purchase-orders` | ⬜ | |
| `ExpeditingDelivery.jsx` | `GET /deliveries` | ⬜ | |
| `VendorManagement.jsx` | `GET /vendors` | ⬜ | |
| `InventoryStore.jsx` | `GET /inventory-items`, `GET /stock-movements` | ⬜ | |
| `ProcurementDocuments.jsx` | Documents endpoint | ⬜ | |
| `ProcurementReports.jsx` | `GET /procurement/reports` | ⬜ | |

---

### Phase 2i — HSE + Quality Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `OffshoreTravelDocuments.jsx` | `GET /offshore-travel-documents`, stats | ⬜ | |
| `EmergencyPreparedness.jsx` | `GET /emergency-plans`, `GET /emergency-contacts` | ⬜ | |
| `HSEDocuments.jsx` | Documents endpoint (HSE-scoped) | ⬜ | |
| `HSEReports.jsx` | `GET /hse/reports` | ⬜ | |
| `AuditManagement.jsx` | `GET /quality-audits`, stats | ⬜ | |
| `CalibrationRecords.jsx` (Quality) | `GET /quality/calibration-records` | ⬜ | Read-only, different permission |
| `MaterialsInspection.jsx` | `GET /quality/goods-receipts` | ⬜ | |
| `QualityReports.jsx` | `GET /quality/reports` | ⬜ | |

---

### Phase 2j — Finance & Accounts Module

| Page | Endpoint(s) | Status | Notes |
|---|---|---|---|
| `GeneralLedger.jsx` | `GET /accounts`, `GET /journal-entries` | ⬜ | |
| `BudgetingForecasting.jsx` | `GET /budgets`, stats | ⬜ | |
| `AccountsPayableReceivable.jsx` | `GET /payables`, `GET /invoices?receivableOnly=true` | ⬜ | |
| `Invoicing.jsx` | `GET /invoices`, stats | ⬜ | idempotency key on create |
| `ContractsClaimsManagement.jsx` | `GET /contracts`, `GET /contract-variations`, `GET /contract-claims` | ⬜ | |
| `CommercialRisksInsurance.jsx` | `GET /commercial-risks`, `GET /insurance-policies` | ⬜ | |
| `BankReconciliation.jsx` | `GET /bank-reconciliations` | ⬜ | |
| `TaxManagement.jsx` | `GET /tax-records` | ⬜ | |
| `FinanceForms.jsx` | `GET /finance-forms` | ⬜ | requireAnyPermission on approve |
| `FinanceReports.jsx` | `GET /accounts-finance/reports` | ⬜ | Note: unusual mount path |

---

### Phase 2k — Notifications

| Feature | Endpoint(s) | Status | Notes |
|---|---|---|---|
| Bell icon unread count | `GET /notifications/unread-count` | ✅ | 60s polling in Header; notificationsSlice.js |
| Notification list | `GET /notifications` | ✅ | Loaded when bell dropdown opens |
| Mark read | `POST /notifications/:id/read`, `POST /notifications/read-all` | ✅ | Optimistic local state update |

---

## Remaining Mock Data Files to Replace

All files in `src/data/` will be deleted as their respective pages are migrated.

| File | Module | Status |
|---|---|---|
| `mockEmployees.js` | HR | ✅ |
| `mockLeaves.js` | HR | ⬜ |
| `mockAttendance.js` | HR | ⬜ |
| `mockPayroll.js` | HR | ⬜ |
| `mockRecruitment.js` | HR | ⬜ |
| `mockOnboarding.js` | HR | ⬜ |
| `mockDeployment.js` | HR | ⬜ |
| `mockTrainings.js` | HR | ⬜ |
| `mockCertifications.js` | HR | ⬜ |
| `mockGrievance.js` | HR | ⬜ |
| `mockDocuments.js` | HR / Admin | ⬜ |
| `mockRequests.js` | HR / Admin | ⬜ |
| `mockTasks.js` | Platform Core | ⬜ |
| `mockAdmin.js` | Administration | ⬜ |
| `mockBizDev.js` | Business Dev | ⬜ |
| `mockTechnical.js` | Technical | ⬜ |
| `mockProcurement.js` | Procurement | ⬜ |
| `mockFinance.js` | Finance | ⬜ |
| `mockHSE.js` | HSE | ⬜ |
| `mockQuality.js` | Quality | ⬜ |

---

## Notes & Gotchas

- **Finance Reports mount path is unusual**: `GET /accounts-finance/reports` — NOT `/finance/reports`
- **`activeProjects` on Client is hardcoded `0`** in business-dev phase — will be real once Technical module is integrated
- **`dormant` is not a real status** on Client — it's a computed `isDormant` boolean overlay on `active` clients
- **`CalibrationRecord`** is owned by Technical but Quality also has read-only routes at `/quality/calibration-records` with permission `quality.calibrationrecord.view`
- **`GoodsReceiptNote`** is owned by Procurement but Quality has routes at `/quality/goods-receipts`
- **Offer letter / Payslip PDFs**: `GET /invoices/:id/pdf`, `GET /payslips/:id/download`, `GET /memos/:id/pdf` — these return `application/pdf`, handle as blob download
- **File uploads**: use `multipart/form-data`, do NOT set `Content-Type` header manually — let axios/browser set the boundary
- **Idempotency-Key header**: required on these POSTs to prevent double-submission: invoice create/record-payment, payable create/record-payment, journal entry create/approve/post/reverse, payroll generate/approve/payslip, stock movement create/complete, finance form create/approve, tax-record payment, budget approval
