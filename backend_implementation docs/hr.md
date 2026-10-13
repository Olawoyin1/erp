# PGSL ERP — HR API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

---

## Changes since the production review (read this first)

- **Probation staff are paid.** Payroll includes employees whose status is `active`, `probation` or `on_leave`; only `deactivated` staff are excluded. Generating a run needs an **active PAYE tax definition** (`422` otherwise), so nobody is silently paid zero tax.
- **`POST /employees/:id/confirm`** (`hr.employee.confirm`): moves `probation` to `active` and stamps `confirmedAt`. Employees also carry `probationEndDate` and `contractEndDate`; the reminder engine counts down to them.
- **Employee data is scoped.** `GET /employees` and `GET /employees/:id` omit `baseSalary`, date of birth, nationality, state, address and next of kin unless the caller holds `hr.employee.view-sensitive` or `hr.payroll.view`. Changing `grade` or `baseSalary` needs `hr.payroll.update` as well as `hr.employee.update` (`403` otherwise), and every employee edit writes an audit record with before and after values.
- **Offboarding.** `POST /employees/:id/deactivate` is refused (`409`, naming what blocks it) while the person manages or leads a live project or heads an active department. Direct reports, clients they own as business-development officer, assets in their custody and open tasks do not block it; they produce a hand-over task for the person deactivating. A deactivated employee cannot sign in, and `PATCH /users/:id/status` cannot re-enable the login until **`POST /employees/:id/reactivate`** (`hr.employee.reactivate`) has brought the employee back.
- **Leave.** The duration is computed on the server from the dates (working days, excluding weekends and public holidays); a supplied `durationDays` is ignored. An employee can apply only for themselves; applying for someone else needs `hr.leave.create-on-behalf`. Lists and balances are limited to your own record and your direct reports unless you hold `hr.leave.view-all` (out of scope is `404`). Approval is an atomic claim, so two clicks cannot deduct the balance twice, and nobody approves their own leave. A nightly job (01:30 Lagos) repairs any approved request whose balance was not deducted.
- **Public holidays: `/public-holidays`** (`hr.holiday.view` / `hr.holiday.manage`): `GET /`, `POST /` (`{ name, date, recurring }`), `PATCH /:id`, `DELETE /:id`. Recurring holidays repeat on the same month and day each year. Seven fixed-date Nigerian holidays are seeded once when the table is empty; moveable holidays (Eid, Easter) must be entered each year.
- **Attendance.** A clock-out must be after clock-in and within 24 hours (`422`). Manual logging (`POST /attendance`) now needs **`hr.attendance.log`**, separate from the `hr.attendance.create` that every employee needs to clock themselves in. A manual entry cannot overwrite an existing record unless it carries a `correctionReason`; a correction is audited and resets overtime approval. Lists are limited to your own record and direct reports unless you hold `hr.attendance.view-all`.
- **Recruitment to employee.** `POST /job-postings` accepts `vacancies` (default 1). **`POST /candidates/:id/convert-to-employee`** (`hr.candidate.convert`) turns a candidate at the `hired` stage into an employee: name, email, phone, department and position carry over, the hiring supervisor becomes the reporting manager, and the body supplies `contractType`, `hireDate`, `baseSalary` (kobo) and optionally `grade`, `employmentType`, `reportingManagerId`, personal details. A candidate converts once (`409` on a repeat, safe against double clicks), and the posting closes when its vacancies are filled.
- **Payroll.**
  - **Statutory rules are configuration, not code.** `GET /statutory/config` (`hr.payroll.view`) returns `{ effective, versions }`; `POST /statutory/config` (`hr.payroll.approve`) saves a **new version** `{ effectiveFrom, rules[], paye{}, note }`; `POST /statutory/config/:id/confirm` signs it off. Rules are `PENSION_EMPLOYEE`, `PENSION_EMPLOYER`, `NHF`, `NSITF`, `ITF`, each with `kind` (`percent`/`fixed`), `basis` (`basic`, `basic_housing_transport`, `gross`), `ratePercent`, `fixedAmount`, `monthlyBaseCap`, `enabled`. `paye` has `basis` (`monthly`/`annualised`), `annualFixedRelief`, `reliefPercentOfGross`, `deductPensionAndNhf`. **Every rate shipped is only a starting value, all rules start disabled, and every version is flagged `needsConfirmation` until the accountant confirms it; the system never asserts that a rate is the legally correct one.** A payslip records the version it used (`statutoryConfigVersion`) and stores `nhfDeduction`, `employerPension`, `employerNsitf`, `employerItf`; a payslip whose deductions exceed gross pay is refused.
  - A payroll run stores `totals` (gross, paye, pension, nhf, other deductions, net, employer contributions) and `generatedBy`. **The person who generated a run cannot approve it (`403`).** Approving posts two ledger entries: the accrual (Dr salaries and employer contributions; Cr PAYE, pension, NHF, NSITF, ITF, other deductions and net salaries payable) and the payment (Dr net salaries payable, Cr bank). Both are idempotent and wait in the posting outbox if a mapping is missing.
  - Salary structures and tax definitions write audit records on every change.
- **Deployments** (`POST /deployments`): a deactivated employee, someone with approved leave overlapping the deployment, or (for work whose project or role mentions offshore) someone whose offshore travel documents expire before the deployment ends is refused (`422`).
- **Payslips.** `GET /payslips/:id/download` now returns a **PDF** (add `?format=json` for the old structured data). New self-service routes, available to any signed-in employee with no payroll permission: **`GET /payslips/mine`** (own payslips, newest first) and **`GET /payslips/mine/:id/download`** (own PDF; a colleague's payslip is `404`). The emailed payslip notice never contains pay details; it tells the employee to sign in.

---

## 1. Employees — `/employees`

All routes require authentication. `EMPLOYEE_STATUSES`: `active`, `probation`, `on_leave`, `deactivated`. `CONTRACT_TYPES`: `permanent`, `contract`, `temporary`.

### `GET /employees`
Permission: `hr.employee.view`. Paginated.

Query: `page`, `limit`, `q` (matches `fullName`, `employeeId`, `email`), `status`, `departmentId`.

### `POST /employees`
Permission: `hr.employee.create`.
```json
{
  "fullName": "Babatunde Adewale",
  "email": "babatunde.adewale@pgsl.com",
  "phone": "+2348031234567",
  "dateOfBirth": "1992-04-18",
  "nationality": "Nigerian",
  "state": "Oyo",
  "address": "12 Agodi Road, Ibadan",
  "nextOfKin": { "name": "Folake Adewale", "relation": "Spouse", "phone": "+2348098765432" },
  "position": "Site Engineer",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "grade": "L3",
  "contractType": "permanent",
  "employmentType": "Full-time",
  "reportingManagerId": "65f1a2b3c4d5e6f7a8b9c0d4",
  "hireDate": "2026-10-06",
  "baseSalary": 45000000
}
```
Only `fullName`, `email`, `phone`, `position`, `departmentId`, `hireDate` are required; `contractType` defaults `permanent`, `baseSalary` defaults `0`. `baseSalary` is in kobo.

Response `201`:
```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0d5",
  "employeeId": "PGSL-0001",
  "fullName": "Babatunde Adewale",
  "email": "babatunde.adewale@pgsl.com",
  "phone": "+2348031234567",
  "position": "Site Engineer",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "grade": "L3",
  "contractType": "permanent",
  "reportingManagerId": "65f1a2b3c4d5e6f7a8b9c0d4",
  "hireDate": "2026-10-06T00:00:00.000Z",
  "baseSalary": 45000000,
  "status": "probation",
  "userId": null,
  "deactivatedAt": null,
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
`employeeId` is generated as `PGSL-<NNNN>`, permanent, never resets. New employees always start `status: "probation"`. **Side effect:** also creates an `OnboardingCase` (`status: "pending"`) and seeds 4 default checklist tasks (general yard safety training, medical clearance verification, equipment allocation, PPE usage protocols) as `system`-sourced Tasks linked to that case — assigned to whichever user registered the employee. `userId` stays `null` until explicitly linked — see `POST /employees/:id/link-user` below.

### `GET /employees/:id`
Permission: `hr.employee.view`.

### `PATCH /employees/:id`
Permission: `hr.employee.update`. Same fields as create, all optional, **except `email` cannot be changed here**.

### `POST /employees/:id/manager`
Permission: `hr.employee.update`.
```json
{ "reportingManagerId": "65f1a2b3c4d5e6f7a8b9c0d4" }
```
Must reference a different, existing employee (`422 VALIDATION_ERROR` if self-referencing or not found).

### `POST /employees/:id/link-user`
Permission: `hr.employee.update`. Links this Employee to a login `User` account — sets both `Employee.userId` and `User.employeeId` together.
```json
{ "userId": "65f1a2b3c4d5e6f7a8b9c0e1" }
```
`409 CONFLICT` if this employee already has a linked user, or if the given user is already linked to a different employee (the link is strictly one-to-one on both sides). `422 VALIDATION_ERROR` if the user doesn't exist.

### `POST /employees/:id/deactivate`
Permission: `hr.employee.deactivate`.
```json
{ "reason": "Resigned — relocating to Abuja" }
```
Already-deactivated → `409 INVALID_STATE_TRANSITION`. **Side effect:** if the employee has a linked `userId`, that User's `status` is forced to `deactivated` and all of their refresh tokens are revoked (they immediately lose system access).

### `GET /employees/:id/projects`
Permission: `hr.employee.view`. **Not paginated** — returns the full array of this employee's `Deployment` records (newest first).

### `GET /employees/:id/leave-history`
Permission: `hr.employee.view`. **Not paginated** — full array of this employee's `LeaveRequest` records, newest first.

### `GET /employees/:id/payroll`
Permission: `hr.payroll.view` (note: a *different* permission module than the rest of this router). **Not paginated.**
```json
{ "data": { "salaryStructure": { "...": "..." }, "recentPayslips": [ { "...": "..." } ] } }
```
`salaryStructure` is the active `SalaryStructure` matching the employee's `grade` (`null` if the employee has no grade or no matching active structure). `recentPayslips` is the employee's last 12 payslips.

### `GET /employees/:id/certifications`
Permission: `hr.employee.view`. **Not paginated.** Each certification has a computed `status` (`valid`/`expired`/`pending`) merged in.

### `POST /employees/:id/certifications`
Permission: `hr.employee.update`. `multipart/form-data`, field `file` + body:
```json
{ "certificateName": "NEBOSH International General Certificate", "issuedDate": "2025-03-01", "expiryDate": "2028-03-01" }
```
Creates an `EmployeeCertification` with `source: "manual_upload"` (as opposed to ones auto-created from a passed training evaluation, which get `source: "training"`).

### `GET /employees/:id/documents`
Permission: `hr.employee.view`. **Not paginated** — this employee's `Attachment` records where `subjectType: "Employee"`.

### `POST /employees/:id/documents`
Permission: `hr.employee.update`. `multipart/form-data`, field `file`. Generic document upload (ID card scan, contract PDF, etc.) with no extra metadata fields.

---

## 2. Onboarding — `/onboarding`

All routes require authentication. `ONBOARDING_STATUSES`: `pending`, `in_progress`, `completed`, `ready_for_deployment` (strictly linear — each can only advance to the next one).

### `GET /onboarding`
Permission: `hr.onboarding.view`. Paginated. Query: `page`, `limit`, `status`.

### `GET /onboarding/stats`
Permission: `hr.onboarding.view`. **Not paginated.**
```json
{ "data": [ { "key": "pending_onboarding", "label": "Pending Onboarding", "value": 4 }, { "key": "in_progress", "label": "In Progress", "value": 2 }, { "key": "completed", "label": "Completed", "value": 1 }, { "key": "ready_for_deployment", "label": "Ready for Deployment", "value": 3 } ] }
```

### `GET /onboarding/:employeeId`
Permission: `hr.onboarding.view`. Note the path param is the **employee's** id, not the onboarding case's id (there's one case per employee). **Not paginated.**
```json
{
  "data": {
    "onboardingCase": { "_id": "...", "employeeId": "...", "status": "in_progress", "createdAt": "...", "updatedAt": "..." },
    "checklist": [ { "task": { "taskNo": "HR-TSK-002", "title": "Medical clearance verification — Babatunde Adewale", "status": "done", "...": "..." }, "isOverdue": false } ],
    "documents": [ { "_id": "...", "originalName": "medical-clearance.pdf", "verified": false, "...": "..." } ],
    "progressPercent": 50
  }
}
```
`progressPercent` is `done checklist tasks / total checklist tasks`, rounded.

### `POST /onboarding/:employeeId/status`
Permission: `hr.onboarding.update`. No body — advances to the single next status in sequence. Already at `ready_for_deployment` → `409 INVALID_STATE_TRANSITION` (final stage).

### `POST /onboarding/:employeeId/documents/:docId/verify`
Permission: `hr.onboarding.verify`. `:docId` is an `Attachment` id. No body — marks it `verified: true`, stamps `verifiedBy`/`verifiedAt`.

---

## 3. Deployments — `/deployments`

All routes require authentication. `DEPLOYMENT_STATUSES`: `pending`, `active`, `on_hold`, `completed`. `DEPLOYMENT_TYPES`: `full_time`, `rotation`, `temporary`. Allowed status transitions: `pending → active`; `active → on_hold | completed`; `on_hold → active`; `completed` is terminal.

### `GET /deployments`
Permission: `hr.deployment.view`. Paginated. Query: `page`, `limit`, `employeeId`, `status`.

### `GET /deployments/stats`
Permission: `hr.deployment.view`. **Not paginated.**
```json
{ "data": [ { "key": "pending", "label": "Pending", "value": 2 }, { "key": "active", "label": "Active", "value": 18 }, { "key": "on_hold", "label": "On Hold", "value": 1 }, { "key": "completed", "label": "Completed", "value": 40 } ] }
```

### `POST /deployments`
Permission: `hr.deployment.create`.
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "projectRef": "Lekki Phase 2 Expansion",
  "siteId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "role": "Site Engineer",
  "deploymentType": "full_time",
  "startDate": "2026-10-10",
  "expectedEndDate": "2027-04-10",
  "notes": "Replacing outgoing engineer on rotation",
  "supervisorRef": "Engr. Kola Williams"
}
```
`deploymentType` defaults `full_time`. `projectRef` is free text — there is no `Project` entity yet.

Response `201`:
```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0f5",
  "deploymentId": "DEP-2026-0001",
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "projectRef": "Lekki Phase 2 Expansion",
  "siteId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "role": "Site Engineer",
  "deploymentType": "full_time",
  "status": "pending",
  "startDate": "2026-10-10T00:00:00.000Z",
  "expectedEndDate": "2027-04-10T00:00:00.000Z",
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
`deploymentId` is `DEP-<YYYY>-<NNNN>`, resets every year. Notifies the employee's linked user if one exists.

### `GET /deployments/:id`
Permission: `hr.deployment.view`.

### `PATCH /deployments/:id`
Permission: `hr.deployment.update`. Same fields as create minus `employeeId`, all optional. A `completed` deployment cannot be edited (`409 INVALID_STATE_TRANSITION`).

### `POST /deployments/:id/status`
Permission: `hr.deployment.update`.
```json
{ "status": "active" }
```
Invalid transitions (see allowed list above) → `409 INVALID_STATE_TRANSITION`. Side effects: moving to `active` sets the Employee's `currentProjectRef` to this deployment's `projectRef`; moving to `completed` clears `currentProjectRef` (only if the employee has no other `active` deployment) and notifies the employee.

### `GET /deployments/:id/report`
Permission: `hr.deployment.view`. **Not paginated.** Only available once `status: "completed"` (`409 INVALID_STATE_TRANSITION` otherwise).
```json
{
  "data": {
    "deploymentId": "DEP-2026-0001",
    "employeeName": "Babatunde Adewale",
    "employeeIdCode": "PGSL-0001",
    "projectRef": "Lekki Phase 2 Expansion",
    "role": "Site Engineer",
    "startDate": "2026-10-10T00:00:00.000Z",
    "expectedEndDate": "2027-04-10T00:00:00.000Z",
    "completedAt": "2027-04-12T08:00:00.000Z"
  }
}
```

---

## 4. Recruitment — Job Postings — `/job-postings`

All routes require authentication. `JOB_POSTING_STATUSES`: `open`, `interviewing`, `paused`, `closed`. Note: nothing in this module ever moves a posting to `interviewing` automatically — only `open ⇄ paused` and `→ closed` have routes.

### `GET /job-postings`
Permission: `hr.jobposting.view`. Paginated. Query: `page`, `limit`, `status`, `departmentId`.

### `POST /job-postings`
Permission: `hr.jobposting.create`.
```json
{
  "position": "Structural Engineer",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "hiringSupervisorId": "65f1a2b3c4d5e6f7a8b9c0d4",
  "employmentType": "Full-time",
  "locationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "salaryRange": "₦350,000 – ₦500,000 / month",
  "closingDate": "2026-11-15",
  "jobDescription": "Design and review structural drawings for ongoing site projects.",
  "mandatoryRequirements": "Minimum 5 years post-NYSC experience, COREN registered."
}
```
`hiringSupervisorId` references an **Employee**, not a User. Response `201`, `status: "open"`, `applicationsReceived: 0`, `jobId: "JOB-0001"` (permanent, never resets).

### `GET /job-postings/:id`
Permission: `hr.jobposting.view`.

### `PATCH /job-postings/:id`
Permission: `hr.jobposting.update`. Only editable while `status: "open"` (`409 INVALID_STATE_TRANSITION` otherwise). All create fields optional.

### `POST /job-postings/:id/pause`
Permission: `hr.jobposting.update`. `open → paused`.
```json
{ "reason": "Budget review in progress" }
```

### `POST /job-postings/:id/resume`
Permission: `hr.jobposting.update`. `paused → open`. No body.

### `POST /job-postings/:id/close`
Permission: `hr.jobposting.update`. `open | interviewing | paused → closed`.
```json
{ "reason": "Position filled" }
```

---

## 5. Recruitment — Candidates — `/candidates`

All routes require authentication. `CANDIDATE_STAGES`: `applied`, `screening`, `assessment`, `interview`, `offer`, `hired`, `rejected`. Advancing moves one step through that exact sequence; rejection is allowed from any stage up to and including `offer` (not from `hired` or an already-`rejected` candidate).

### `GET /candidates`
Permission: `hr.candidate.view`. Paginated. Query: `page`, `limit`, `jobPostingId`, `stage`.

### `POST /candidates`
Permission: `hr.candidate.create`.
```json
{
  "fullName": "Amarachi Nwosu",
  "email": "amarachi.nwosu@gmail.com",
  "phone": "+2348123456789",
  "location": "Port Harcourt, Rivers State",
  "appliedPositionId": "65f1a2b3c4d5e6f7a8b9c0f3",
  "recruiterId": "65f1a2b3c4d5e6f7a8b9c0d6",
  "experience": "6 years structural design",
  "professionalSummary": "COREN-registered structural engineer with heavy-civil experience."
}
```
`appliedPositionId` must reference an existing job posting. `departmentId` is auto-copied from that posting (not accepted in the body). `recruiterId` references an Employee, optional.

Response `201`, `candidateId: "CAN-0001"` (permanent), `stage: "applied"`, `applicationDate` set to now. Side effect: increments the job posting's `applicationsReceived` counter.

### `GET /candidates/:id`
Permission: `hr.candidate.view`. Response merges in a `documents` array (this candidate's attachments) alongside the candidate's own fields — i.e. `data` is the candidate object spread plus `documents: [...]`.

### `POST /candidates/:id/advance`
Permission: `hr.candidate.update`. No body — moves to the next stage in sequence (`applied→screening→assessment→interview→offer→hired`). Already `hired` (or `rejected`) → `409 INVALID_STATE_TRANSITION`.

### `POST /candidates/:id/reject`
Permission: `hr.candidate.update`.
```json
{ "reason": "Did not meet minimum years of experience requirement" }
```
Also writes a dedicated `AuditLog` entry (in addition to the usual `ActivityEvent`) — rejections are treated as more sensitive than ordinary stage changes. (There's no HTTP endpoint to read the `AuditLog` collection, FYI — it's write-only from the frontend's perspective.)

### `POST /candidates/:id/documents`
Permission: `hr.candidate.update`. `multipart/form-data`, field `file` (CV, certificates, etc).

---

## 6. Training Programs — `/training-programs`

All routes require authentication. `TRAINING_STATUSES`: `scheduled`, `active`, `completed`, `evaluation`, `cancelled`. Transitions: `scheduled → active | cancelled`; `active → completed`; `completed → evaluation`; `evaluation` and `cancelled` are terminal. `PROVIDER_TYPES`: `internal`, `external`. `TRAINING_TYPES`: `in_person`, `virtual`. Participant `OUTCOME_STATUSES`: `value_created`, `value_not_yet_observed`, `under_evaluation`, `not_applicable`.

### `GET /training-programs`
Permission: `hr.training.view`. Paginated. Query: `page`, `limit`, `status`.

### `POST /training-programs`
Permission: `hr.training.create`.
```json
{
  "title": "Working at Heights Certification",
  "providerType": "external",
  "providerName": "NISP Safety Academy",
  "startDate": "2026-11-03",
  "endDate": "2026-11-05",
  "startTime": "09:00",
  "endTime": "16:00",
  "trainingType": "in_person",
  "locationOrPlatform": "PGSL Training Hall, Lekki Yard",
  "validityPeriod": "3 years",
  "description": "Covers fall-arrest systems, scaffold inspection and rescue planning.",
  "renewalRequirements": "Refresher assessment every 3 years"
}
```
`startDate` must be ≤ `endDate`.

Response `201`, `trainingId: "TRN-2026-0001"` (resets yearly), `status: "scheduled"`, `participantCount: 0`.

### `GET /training-programs/:id`
Permission: `hr.training.view`.

### `PATCH /training-programs/:id`
Permission: `hr.training.update`. Only while `status: "scheduled"` (`409 INVALID_STATE_TRANSITION` otherwise). All create fields optional.

### `POST /training-programs/:id/status`
Permission: `hr.training.update`.
```json
{ "status": "active" }
```
Must follow the transition map above.

### `POST /training-programs/:id/cancel`
Permission: `hr.training.update`. Only while `status: "scheduled"`.
```json
{ "reason": "Trainer unavailable — rescheduling" }
```
Notifies every enrolled participant with a linked user account.

### `GET /training-programs/:id/participants`
Permission: `hr.training.view`. **Not paginated** — full participant list for this program.

### `POST /training-programs/:id/participants`
Permission: `hr.training.update`. Enrolls one or more employees (idempotent — ids already enrolled are skipped, not duplicated or errored).
```json
{ "employeeIds": ["65f1a2b3c4d5e6f7a8b9c0d5", "65f1a2b3c4d5e6f7a8b9c0d7"] }
```
Response `201` — array of `TrainingParticipant` (both newly created and pre-existing ones for the given ids). Increments `participantCount` by the number actually created. Notifies each newly-added participant.

### `POST /training-programs/:id/participants/:employeeId/attendance`
Permission: `hr.training.update`.
```json
{ "attended": true }
```
Setting `attended: false` automatically forces `outcomeStatus` to `not_applicable`.

### `POST /training-programs/:id/participants/:employeeId/evaluate`
Permission: `hr.training.evaluate`.
```json
{ "outcomeStatus": "value_created", "completionDate": "2026-11-05", "expiryDate": "2029-11-05", "certificateAttachmentId": "65f1a2b3c4d5e6f7a8b9c0f7" }
```
`completionDate`/`expiryDate`/`certificateAttachmentId` optional. Setting `value_created` or `value_not_yet_observed` on a participant who hasn't been marked `attended: true` yet → `422 VALIDATION_ERROR`. **Side effect:** an outcome of `value_created` creates/updates (upsert) a matching `EmployeeCertification` with `source: "training"`, named after the program title. Stamps `evaluatedBy` (resolved to the acting user's linked Employee, if any) and `evaluatedAt`. Notifies the participant's linked user.

### `POST /training-programs/:id/participants/:employeeId/re-evaluate`
Permission: `hr.training.evaluate`. Same body as evaluate, plus a required `reason`:
```json
{ "outcomeStatus": "value_not_yet_observed", "reason": "Initial pass was recorded in error" }
```
Runs the same evaluation logic again (including re-syncing the certification) and additionally stores `reEvaluationReason` on the participant.

---

## 7. Leave Management — `/leave-requests`, `/leave-balances`

All routes require authentication. `LEAVE_REQUEST_STATUSES`: `pending`, `approved`, `declined`. Leave types are not exposed via any CRUD endpoint in this API — they're seeded once (`Annual` 21 days, `Sick` 10, `Maternity` 90, `Paternity` 10, `Emergency` 5, `Study` 10 unpaid, `Unpaid` 0, `Compassionate` 5) and referenced by id; there's no `/leave-types` route to list or edit them from the frontend today.

### `GET /leave-requests`
Permission: `hr.leave.view`. Paginated. Query: `page`, `limit`, `employeeId`, `status`.

### `GET /leave-requests/stats`
Permission: `hr.leave.view`. **Not paginated.**
```json
{ "data": [ { "key": "pending", "label": "Pending", "value": 5 }, { "key": "approved", "label": "Approved", "value": 40 }, { "key": "declined", "label": "Declined", "value": 3 } ] }
```

### `POST /leave-requests`
Permission: `hr.leave.create`.
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "leaveTypeId": "65f1a2b3c4d5e6f7a8b9c0a5",
  "startDate": "2026-12-20",
  "endDate": "2026-12-27",
  "durationDays": 6,
  "reason": "End-of-year family travel",
  "attachmentId": "65f1a2b3c4d5e6f7a8b9c0f8"
}
```
`startDate` must be ≤ `endDate`. `attachmentId` optional (required in practice for leave types with `requiresDocument: true`, though that is not enforced server-side today). Rejected with `409 CONFLICT` if the employee already has a `pending` or `approved` request whose dates overlap. For a **paid** leave type, rejected with `422 VALIDATION_ERROR` if `durationDays` exceeds the employee's current `remainingDays` balance for that leave type/year (the balance year is taken from `startDate`'s calendar year).

Response `201`, `leaveId: "LV-2026-0001"` (resets yearly), `status: "pending"`.

### `GET /leave-requests/:id`
Permission: `hr.leave.view`.

### `POST /leave-requests/:id/approve`
Permission: `hr.leave.decide`. No body. Only from `pending` (`409 INVALID_STATE_TRANSITION` otherwise). **Side effect:** for a paid leave type, atomically decrements the employee's `LeaveBalance` for that year (`usedDays += durationDays`, `remainingDays -= durationDays`); for an unpaid type, no balance is touched but the request is still flagged internally as settled. Notifies the employee.

### `POST /leave-requests/:id/decline`
Permission: `hr.leave.decide`. Only from `pending`.
```json
{ "reason": "Overlaps with a critical project milestone — please propose alternate dates" }
```
Notifies the employee with the reason.

### `POST /leave-requests/:id/request-changes`
Permission: `hr.leave.decide`. Only from `pending`. **Status is left unchanged (stays `pending`)** — this is purely a message to the requester, sent by email (not an in-app notification).
```json
{ "message": "Please attach a supporting medical document before we can approve this." }
```
Response message: "Request for changes sent to the employee".

### `GET /leave-balances/:employeeId`
Permission: `hr.leave.view`. **Not paginated.** Query: optional `year` (defaults to current year).
```json
{
  "data": [
    { "_id": "...", "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5", "leaveTypeId": "65f1a2b3c4d5e6f7a8b9c0a5", "year": 2026, "allocatedDays": 21, "usedDays": 6, "remainingDays": 15, "createdAt": "...", "updatedAt": "..." }
  ]
}
```
Only returns balances that have actually been created so far (a balance row is lazily created the first time a leave request against that type/year is approved or applied for) — it will not show every leave type with a zeroed row by default.

---

## 8. Attendance — `/attendance`

All routes require authentication. `ATTENDANCE_STATUSES`: `present`, `late`, `completed`, `absent`, `on_leave`. One record per employee per calendar day (enforced by a unique index on `employeeId` + `date`); "day" is bucketed to Africa/Lagos business-day boundaries (fixed UTC+1, no DST).

### `POST /attendance/clock-in`
Permission: `hr.attendance.create`. Clocks in the **calling user's own linked employee record** (resolved from the Bearer token, not a body field) — `403`/`422 VALIDATION_ERROR` if the account has no linked Employee.
```json
{ "locationId": "65f1a2b3c4d5e6f7a8b9c0b9" }
```
`409 CONFLICT` if already clocked in today. Response `201`, `status: "present"`.

### `POST /attendance/clock-out`
Permission: `hr.attendance.create`. No body — clocks out the calling user's own record for today. `409 INVALID_STATE_TRANSITION` if they haven't clocked in yet; `409 CONFLICT` if already clocked out. Computes `hoursWorked` (2 decimal places) and `overtimeHours` (anything over an 8-hour standard shift), sets `status: "completed"`.

### `GET /attendance`
Permission: `hr.attendance.view`. Paginated. Query: `page`, `limit`, `employeeId`, `locationId`, `status`, `date`.

### `GET /attendance/stats`
Permission: `hr.attendance.view`. **Not paginated.** Query: optional `date` (defaults to today).
```json
{
  "data": [
    { "key": "present", "label": "Present", "value": 142 },
    { "key": "late", "label": "Late", "value": 6 },
    { "key": "absent", "label": "Absent", "value": 4 },
    { "key": "completed", "label": "Completed", "value": 120 },
    { "key": "overtime_hours", "label": "Total approved overtime hours", "value": 37.5 }
  ]
}
```

### `POST /attendance`
Permission: `hr.attendance.create`. Manual/admin logging for any employee (upserts by `employeeId` + `date` — logging twice for the same day overwrites, it does not create a duplicate).
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "locationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "date": "2026-10-02",
  "clockIn": "2026-10-02T07:05:00.000Z",
  "clockOut": "2026-10-02T17:40:00.000Z",
  "status": "completed",
  "remarks": "Approved late start — generator maintenance delay"
}
```
`clockIn`/`clockOut` optional (e.g. for logging an `absent` or `on_leave` day with neither). If both given, `hoursWorked`/`overtimeHours` are computed the same way as clock-out.

### `GET /attendance/:id`
Permission: `hr.attendance.view`.

### `POST /attendance/:id/approve`
Permission: `hr.attendance.approve`. No body — sets `overtimeApproved: true`. `409 INVALID_STATE_TRANSITION` if the record has no overtime hours logged.

---

## 9. Payroll

Four sub-resources share the money-is-kobo convention. `hr.payroll.*` permissions are shared across all four routers.

### 9.1 Salary Structures — `/salary-structures`

`SALARY_STRUCTURE_STATUSES`: `active`, `inactive`. A structure is keyed by `level` (a free-text grade code, e.g. `"L3"`) — `GET /employees/:id/payroll` and payslip generation both look up "the active structure for this employee's `grade`".

#### `GET /salary-structures`
Permission: `hr.payroll.view`. Paginated. Query: `page`, `limit`, `status`.

#### `POST /salary-structures`
Permission: `hr.payroll.create`.
```json
{
  "jobTitle": "Site Engineer",
  "level": "L3",
  "basicSalary": 35000000,
  "housingAllowance": 7000000,
  "transportAllowance": 3000000,
  "utilityAllowance": 1500000,
  "communicationAllowance": 1000000,
  "otherAllowances": 0,
  "pensionDeduction": 2800000,
  "otherDeductions": 0
}
```
Only `jobTitle`, `level`, `basicSalary` are required; the rest default to `0`. All amounts in kobo.

Response `201`, `structureId: "PS-0001"` (permanent), `status: "active"`.

#### `GET /salary-structures/:id`
Permission: `hr.payroll.view`.

#### `PATCH /salary-structures/:id`
Permission: `hr.payroll.update`. All fields optional.

#### `POST /salary-structures/:id/status`
Permission: `hr.payroll.update`.
```json
{ "status": "inactive" }
```

#### `POST /salary-structures/:id/duplicate`
Permission: `hr.payroll.create`. No body — clones every money field and `level` onto a new structure titled `"<jobTitle> (Copy)"`, forced to `status: "inactive"` (so it can be tuned before going live without affecting payslip generation, which only looks at `active` structures). Response `201` with a new `structureId`.

### 9.2 Tax Definitions — `/tax-definitions`

`TAX_DEFINITION_STATUSES`: `active`, `inactive`. PAYE is modelled as **progressive brackets**, not a flat rate — `isProgressive: true` requires `brackets`; `isProgressive: false` requires `flatPercentage`.

#### `GET /tax-definitions`
Permission: `hr.payroll.view`. **Not paginated** — full list (optionally `?status=`).

#### `POST /tax-definitions`
Permission: `hr.payroll.create`.
```json
{
  "taxType": "PAYE",
  "isProgressive": true,
  "effectiveDate": "2026-01-01",
  "brackets": [
    { "upToAmount": 30000000, "ratePercent": 7 },
    { "upToAmount": 60000000, "ratePercent": 11 },
    { "upToAmount": 110000000, "ratePercent": 15 },
    { "upToAmount": 160000000, "ratePercent": 19 },
    { "upToAmount": 210000000, "ratePercent": 21 },
    { "upToAmount": null, "ratePercent": 24 }
  ]
}
```
`upToAmount` is the **cumulative** ceiling of that bracket in kobo; `null` on the last bracket means "and above". Omitting `brackets` while `isProgressive: true` → `422 VALIDATION_ERROR`. For a flat tax type instead:
```json
{ "taxType": "NHF", "isProgressive": false, "flatPercentage": 2.5, "effectiveDate": "2026-01-01" }
```
Response `201`, `status: "active"`.

#### `GET /tax-definitions/:id`
Permission: `hr.payroll.view`.

#### `PATCH /tax-definitions/:id`
Permission: `hr.payroll.update`. All fields optional (no business-rule revalidation of progressive-vs-flat consistency on update, unlike create).

### 9.3 Payslips — `/payslips`

A payslip is a generated, point-in-time snapshot — it denormalises salary structure fields so a later promotion doesn't rewrite history.

#### `GET /payslips`
Permission: `hr.payroll.view`. Paginated. Query: `page`, `limit`, `employeeId`, `payrollRunId`.

#### `POST /payslips`
Permission: `hr.payroll.create`. Generates a single ad-hoc payslip for one employee (outside of a payroll run — `payrollRunId` will be `null`).
```json
{ "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5", "periodMonth": 10, "periodYear": 2026 }
```
`422 VALIDATION_ERROR` if the employee has no active `SalaryStructure` for their `grade`. `409 CONFLICT` if a payslip already exists for this employee/month/year (unique index).

Response `201`:
```json
{
  "_id": "...",
  "payslipId": "PAY-2026-0001",
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "jobTitle": "Site Engineer",
  "level": "L3",
  "basicSalary": 35000000,
  "housingAllowance": 7000000,
  "transportAllowance": 3000000,
  "utilityAllowance": 1500000,
  "communicationAllowance": 1000000,
  "otherAllowances": 0,
  "grossSalary": 47500000,
  "paye": 6412500,
  "pensionDeduction": 2800000,
  "otherDeductions": 0,
  "totalDeductions": 9212500,
  "netSalary": 38287500,
  "payrollRunId": null,
  "periodMonth": 10,
  "periodYear": 2026,
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
`paye` uses the active `PAYE` tax definition (progressive brackets if configured, else a flat percentage of `grossSalary`, else `0` if no `PAYE` definition exists at all — this is not an error, it silently computes zero tax).

#### `GET /payslips/:id`
Permission: `hr.payroll.view`.

#### `GET /payslips/:id/download`
Permission: `hr.payroll.view`. **There is no PDF renderer wired up yet** — this currently returns the exact same structured JSON as `GET /payslips/:id`, not a binary/PDF. Build the UI's "download" as a client-side render of this data (or treat it as a placeholder) until a real PDF pipeline exists.

#### `POST /payslips/:id/email`
Permission: `hr.payroll.view`. No body — emails the employee a plain-text summary (just the net salary figure, no attachment/PDF). `data: null`.

### 9.4 Payroll Runs — `/payroll-runs`

`PAYROLL_RUN_STATUSES`: `pending_approval`, `paid`, `rejected`. A run batch-generates payslips for a filtered set of active employees; it's a **partial-success batch** — one employee failing (e.g. missing salary structure) doesn't fail the whole run, it's just recorded in `skippedEmployeeIds`.

#### `GET /payroll-runs`
Permission: `hr.payroll.view`. Paginated. Query: `page`, `limit`, `status`, `year`.

#### `POST /payroll-runs`
Permission: `hr.payroll.create`.
```json
{
  "name": "October 2026 Monthly Payroll",
  "year": 2026,
  "periodMonth": 10,
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "employeeGroup": "all"
}
```
`departmentId` optional (omit to run across the whole company); `employeeGroup` is free text, defaults `"all"`, currently has no effect on the actual employee filter (only `status: "active"` + optional `departmentId` are applied).

Response `201`:
```json
{
  "_id": "...",
  "runId": "PR-2026-0001",
  "name": "October 2026 Monthly Payroll",
  "year": 2026,
  "periodMonth": 10,
  "payrollType": "monthly",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "employeeGroup": "all",
  "employeeCount": 47,
  "totalAmount": 1799512500,
  "status": "pending_approval",
  "skippedEmployeeIds": ["65f1a2b3c4d5e6f7a8b9c0d9"],
  "approvedBy": null,
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
Generates one `Payslip` per successfully-processed employee, each tagged with this run's id.

#### `GET /payroll-runs/:id`
Permission: `hr.payroll.view`.

#### `POST /payroll-runs/:id/approve`
Permission: `hr.payroll.approve`. No body. Only from `pending_approval` → `paid`. Note: there's no UI screen this was built from in the original spec, so treat this route's shape (bare approve/reject, no line-item review step) as the best available behavior rather than a guaranteed-final design.

#### `POST /payroll-runs/:id/reject`
Permission: `hr.payroll.approve`. Only from `pending_approval` → `rejected`.
```json
{ "reason": "Department budget not yet confirmed for this period" }
```
`reason` optional.

---

## 10. Disciplinary Cases — `/disciplinary-cases`

All routes require authentication. `CASE_CATEGORIES`: `disciplinary`, `grievance`. `CASE_SEVERITIES`: `low`, `medium`, `high`. `CASE_STATUSES`: `open`, `under_review`, `resolved`, `closed`. Flow: `open → under_review → resolved → closed` (strictly linear, no skipping or reversing).

### `GET /disciplinary-cases`
Permission: `hr.disciplinarycase.view`. Paginated. Query: `page`, `limit`, `employeeId`, `category`, `status`.

### `GET /disciplinary-cases/stats`
Permission: `hr.disciplinarycase.view`. **Not paginated.**
```json
{ "data": [ { "key": "open", "label": "Open", "value": 3 }, { "key": "under_review", "label": "Under Review", "value": 1 }, { "key": "resolved", "label": "Resolved", "value": 9 }, { "key": "closed", "label": "Closed", "value": 9 } ] }
```

### `POST /disciplinary-cases`
Permission: `hr.disciplinarycase.create`.
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "category": "disciplinary",
  "caseType": "Attendance violation",
  "severity": "medium",
  "incidentDate": "2026-09-28",
  "caseTitle": "Repeated unexcused late arrivals",
  "description": "Employee was late 5 times in September without prior notice.",
  "assignedOfficerId": "65f1a2b3c4d5e6f7a8b9c0d2"
}
```
`incidentDate` cannot be in the future (`422 VALIDATION_ERROR`). `assignedOfficerId` references an Employee (the HR officer handling the case), not a User.

Response `201`, `caseId: "CASE-2026-0001"` (resets yearly), `status: "open"`, `internalNotes: []`. Notifies the assigned officer's linked user, if any.

### `GET /disciplinary-cases/:id`
Permission: `hr.disciplinarycase.view`.

### `PATCH /disciplinary-cases/:id`
Permission: `hr.disciplinarycase.update`. All create fields except `employeeId` are optional. A `closed` case cannot be edited (`409 INVALID_STATE_TRANSITION`).

### `POST /disciplinary-cases/:id/start-review`
Permission: `hr.disciplinarycase.update`. No body. `open → under_review`.

### `POST /disciplinary-cases/:id/resolve`
Permission: `hr.disciplinarycase.resolve`. No body. `under_review → resolved`. Notifies the employee's linked user.

### `POST /disciplinary-cases/:id/close`
Permission: `hr.disciplinarycase.resolve`. No body. `resolved → closed`.

### `POST /disciplinary-cases/:id/notes`
Permission: `hr.disciplinarycase.update`. Appends an internal note (visible to anyone who can view the case — there's no separate confidentiality tier).
```json
{ "note": "Spoke with employee's site supervisor; corroborates timesheet discrepancy." }
```
Response `201` — returns the **whole case document** (not just the note) with the new entry appended to `internalNotes`, each carrying `addedBy` + `addedAt`.

---

## 11. HR Reports — `/hr/reports`

### `GET /hr/reports`
Permission: `hr.reports.view`. **Not paginated** — a single dashboard payload.

```json
{
  "data": {
    "tiles": [
      { "key": "total_employees", "label": "Total Employees", "value": 212 },
      { "key": "recruitment_success", "label": "Recruitment Success", "value": 38, "unit": "%" },
      { "key": "annual_turnover", "label": "Annual Turnover", "value": 6, "unit": "%" },
      { "key": "active_departments", "label": "Active Departments", "value": 11 },
      { "key": "training_compliance", "label": "Training Compliance", "value": 74, "unit": "%" },
      { "key": "attendance_rate", "label": "Attendance Rate", "value": 92, "unit": "%" },
      { "key": "expiring_certs", "label": "Expiring Certs", "value": 5 }
    ],
    "charts": [
      {
        "key": "headcount_trend",
        "title": "Workforce Headcount (6 months)",
        "type": "line",
        "series": [
          { "label": "May", "value": 198 },
          { "label": "Jun", "value": 201 },
          { "label": "Jul", "value": 205 },
          { "label": "Aug", "value": 207 },
          { "label": "Sep", "value": 210 },
          { "label": "Oct", "value": 212 }
        ]
      }
    ]
  }
}
```
All tile values are computed from live data except that a couple of metrics referenced in the original design mockups (e.g. a "Regulatory Certification Compliance Index") had no clear real data source and were deliberately **omitted** rather than faked — don't expect every tile from the original design screen to appear here; build the dashboard around exactly the tiles/charts this endpoint actually returns.

---

## Appendix: reference-code formats (HR)

| Entity | Format | Resets yearly? |
|---|---|---|
| Employee.employeeId | `PGSL-NNNN` | No |
| Deployment.deploymentId | `DEP-YYYY-NNNN` | Yes |
| JobPosting.jobId | `JOB-NNNN` | No |
| Candidate.candidateId | `CAN-NNNN` | No |
| TrainingProgram.trainingId | `TRN-YYYY-NNNN` | Yes |
| LeaveRequest.leaveId | `LV-YYYY-NNNN` | Yes |
| SalaryStructure.structureId | `PS-NNNN` | No |
| Payslip.payslipId | `PAY-YYYY-NNNN` | Yes |
| PayrollRun.runId | `PR-YYYY-NNNN` | Yes |
| DisciplinaryCase.caseId | `CASE-YYYY-NNNN` | Yes |

All counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide.
