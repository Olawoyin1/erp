# PGSL ERP — Notifications and Email API Reference

Shared conventions (response envelope, auth, pagination, error codes, money) are documented once in `platform-core.md`; read that first. This file covers the notification and email engine: the in-app bell, the emails behind it, the preference switches, the admin outbox and the deep-link rules the frontend must follow.

Source of truth for the design: `docs/audit/02-notifications-email.md` (decisions D-1 to D-15, all accepted, with Brevo as the provider) and the 135 templates in `docs/email-templates/` (133 approved plus two added since, FIN-26 and PRO-24, which await approval), shipped as `src/modules/mail/templates/`.

---

## 1. How it works (one page)

Every notification passes through one door, `dispatch()` (`src/modules/mail/dispatcher.ts`). For each recipient it does two independent things:

1. **In-app notification.** A row in `Notification`, shown by the bell. It is always written for people with a login, whatever the email switches say (a company toggle switches off the *email* only, decision D-3). Re-fired events and re-run sweeps never create a second row (unique `dedupeKey`).
2. **Email.** Queued in the `EmailOutbox` collection when the company toggle **and** the user's preference allow it. A worker drains the outbox every 2 minutes and sends through Brevo's HTTP API. Failures retry with backoff (1 min, 5 min, 15 min, 1 h, 4 h, 12 h), then the message is dead-lettered and Super Admins get an in-app alert.

Who triggers it:

- **Workflow events.** Every workflow transition already writes an `ActivityEvent`. After it is saved, `recordActivity` hands it to a central subscriber that looks up the `action` in the registry, builds the recipients and variables, and dispatches. No module service calls the mail layer, and a mail problem can never fail the business action (it is logged).
- **Reminders.** A daily job at **07:30 Africa/Lagos** counts down from date fields (certificate and document expiry, insurance, calibration, tax filing, invoices and payables due or overdue, contract end, probation end, leave start, training, audits, tender and RFQ deadlines, and so on). Cadence is `30 / 14 / 7 / 1 / 0` days before expiry (the first step is `documentExpiryAlertWindowDays`, default 30, which is also the outer bound), then weekly after expiry for four weeks; due-date style reminders use `7 / 3 / 1 / 0` then `+1 / +3 / +7` and weekly. Each (event, record, step, recipient) is sent once: running the sweep twice a day, or missing a day, never duplicates and never sends several catch-up messages (only the latest step reached is sent).
- **Direct mail.** Login OTP, invitation, forgot-password, admin password reset, password changed, account suspended or reactivated, security-setting changes, failed scheduled jobs. These are class SEC: they ignore every toggle and every preference.

Pools: "approvers" are resolved from permissions (every active user holding the permission, plus Super Admins; an empty pool falls back to Super Admins so an approval request never evaporates). Multi-step workflows notify the people who can act on that step: administrative and travel requests use one permission per step (`decide`, `decide-procurement`, `decide-finance`, `decide-final`, see `administration.md`), so the finance step goes to the finance approvers and not to everyone holding the first-step key. Resource requests and engineering documents use their own step keys.

### Priorities and digests

| Priority | Meaning | Email behaviour |
|---|---|---|
| P0 | Money, regulatory, safety, security | Sent immediately. **A user cannot mute it** (decision D-4). A company toggle can still switch the email off, except for security mail. |
| P1 | Approvals, decisions, deadlines | Sent immediately; the user can mute it. |
| P2 | Informational | Held for the **daily digest**: one email per person at 07:30 Lagos summarising the bell entries (template `platform/daily-digest`). People without a login and external recipients get P2 mail immediately. |

A recipient who would receive more than 3 reminders of the same kind in one run gets one digest email for that run instead of one per record (decision D-12); their bell entries stay one per record.

---

## 2. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `MAIL_TRANSPORT` | `log` | `brevo` sends for real (required in production), `log` only logs (development), `memory` captures messages in an array (tests). |
| `BREVO_API_KEY` | empty | Brevo API key (`api-key` header, `POST https://api.brevo.com/v3/smtp/email`). Required when `MAIL_TRANSPORT=brevo`. |
| `MAIL_FROM_EMAIL`, `MAIL_FROM_NAME` | `notifications@pgsl.local`, `PGSL ERP` | The single From address (decision D-14). `MAIL_FROM_NAME` is also the `app_name` shown in templates. |
| `MAIL_REPLY_TO` | empty | Fallback Reply-To when no mailbox is configured in settings. |
| `MAIL_MAX_ATTEMPTS` | `6` | Delivery attempts before dead-lettering. |
| `MAIL_BATCH_SIZE` | `50` | Emails sent per worker run (every 2 minutes). |
| `MAIL_RETENTION_DAYS` | `180` | Outbox rows are deleted by a TTL index after this many days. Notifications are kept 180 days (TTL on `createdAt`). |
| `MAIL_DEV_REDIRECT` | empty | Non-production only: rewrite every recipient to this address and prefix the subject with `[TEST]`. Never set in production. |
| `MAIL_LOGO_URL` | empty | Absolute https URL of a logo for the email header; the company name is printed as text when empty. |
| `APP_BASE_URL` | `http://localhost:3000` | Public URL of the frontend. Every link in every email is `APP_BASE_URL` + a path. |
| `BUSINESS_TIMEZONE` | `Africa/Lagos` | Timezone of the scheduled jobs (07:30 reminders and digests). |
| `RUN_JOBS` | `true` | Set `false` on instances that must not run the outbox worker or the reminder job. The jobs run under a Mongo lease, so several instances are safe. |

Production needs the sender domain verified in Brevo (SPF, DKIM, DMARC DNS records published by the company's IT contact).

---

## 3. In-app notifications

All routes need only authentication; a user sees only their own notifications.

### 3.1 `GET /notifications`
Query: `page` (default 1), `limit` (default 20, max 100), `unread=true` to list only unread. Newest first. Paginated envelope.

```json
{
  "success": true,
  "data": [
    {
      "_id": "67a1...",
      "userId": "66f0...",
      "type": "leave.requested",
      "eventKey": "leave.requested",
      "priority": "P1",
      "title": "Leave request LV-2026-0007 awaits your decision",
      "body": "Ada Obi requested Annual leave (12 Oct 2026 to 16 Oct 2026).",
      "subjectType": "LeaveRequest",
      "subjectId": "67a0...",
      "link": "/hr/leave/67a0...",
      "readAt": null,
      "createdAt": "2026-10-04T08:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

New fields (all optional; rows written by the older `notify()` calls do not have them): `eventKey`, `priority` (`P0`, `P1`, `P2`), `link`. `emailDigest` and `digestedAt` are internal.

### 3.2 `GET /notifications/unread-count`
`{ "data": { "count": 3 } }`.

### 3.3 `POST /notifications/:id/read` and `POST /notifications/read-all`
Mark one or all of the caller's notifications read. `200` with `data: null`.

### 3.4 Deep links
- `link` is a **relative path** (`/hr/leave/67a0...`). The frontend prefixes its own origin and routes to it; do not parse it.
- Emails use the same path prefixed with `APP_BASE_URL`, so the route table below is the contract between backend and frontend. The paths are the ones in the approved templates; the frontend team owns the final routes, and any change is a one-line edit in the template's `.json` (`ctaPath`) or the definition's `link`.
- Pattern: `/<module>/<entity-plural>/<id>`. Examples: `/hr/leave/:id`, `/hr/employees/:id`, `/hr/payroll/runs/:id`, `/administration/requests/:id`, `/administration/travel/:id`, `/business-dev/tenders/:id`, `/technical/projects/:id`, `/technical/resource-requests/:id`, `/procurement/requisitions/:id`, `/procurement/purchase-orders/:id`, `/hse/offshore-documents/:id`, `/quality/audits/:id`, `/finance/invoices/:id`, `/finance/forms/:id`, `/documents/:id`, `/tasks/:id`, `/notifications`.
- Auth links: `/accept-invite?token=...`, `/reset-password?token=...`, `/forgot-password`, `/login`. The frontend must implement `/accept-invite` (set password for an invited user) and `/reset-password` (both call `POST /auth/reset-password` with `{ token, newPassword }`).
- External recipients (vendors, clients, candidates) have no login: their emails carry no portal link, only contact details.

---

## 4. Switches and preferences

### 4.1 Company-wide switches: `GET` / `PATCH /settings/notification-preferences`
Permissions `core.settings.view` / `core.settings.update`. The response is the full settings document; the switches live under `notifications`. All booleans, all optional in the PATCH:

| Field | Default | Gate class | Switches off the **email** of |
|---|---|---|---|
| `approvalRequest` | `true` | APR | approval requests to approvers (submitted, step advanced, reminders) |
| `requestProjectStatusChange` | `true` | DEC | decisions back to requesters (approved, rejected), project status changes |
| `taskAssignment` | `false` | TASK | task and activity assignment mail |
| `certificateDocumentExpiry` | `true` | EXP | certificate, policy, calibration, contract and tax expiry reminders |
| `permitSuspension` | `true` | PERMIT | offshore document verification, rejection and mobilisation blocks |
| `candidateRejectionEmail` | `true` | CAND | the courteous rejection email to a candidate |
| `externalEmails` | **`false`** | EXT | **every** email to vendors, clients and candidates (kill switch, decision D-5). Off until the owner approves external mail. |
| `dueDateReminders` | `true` | all reminders | every date-driven reminder email |

Switching a toggle off never removes the in-app notification. Security mail (class SEC) ignores all of them.

### 4.2 Reply-To mailboxes: `PATCH /settings/mail-reply-to`
Permission `core.settings.update`. Body keys (each a valid email or `""` to clear): `default`, `core`, `hr`, `administration`, `businessdev`, `technical`, `procurement`, `hse`, `quality`, `finance`. All mail leaves from the one From address; a module's mail carries that module's Reply-To, else `default`, else `MAIL_REPLY_TO`. Returns the full settings document (`mailReplyTo` object). Read it through `GET /settings/company`.

### 4.3 Per-user preferences: `GET` / `PATCH /me/notification-preferences`
Body keys, all optional booleans:

| Field | Default | Mutes (P1 and P2 only) |
|---|---|---|
| `approvalRequest` | `true` | approval requests and decisions |
| `taskAssignment` | `false` | task and activity assignment |
| `systemAlert` | `true` | informational and operational mail (SYS and expiry/permit classes) |
| `reminders` | `true` | **new.** Due-date and expiry reminder emails. Reminders about approvals and tasks follow `approvalRequest` / `taskAssignment` instead. |

Evaluation order for the email of each recipient (first match wins): security class always sends; then the company toggle for the event's class (and `dueDateReminders` for reminders); then the user's preference, **except P0, which is never muted**; external recipients and staff without a login have no preferences. A user may also receive nothing by email while still seeing the bell.

---

## 5. Outbox administration

For support staff and Super Admins. Message bodies are never returned by these routes.

### 5.1 `GET /mail/outbox`
Permission `core.settings.view`. Query: `status` (`pending`, `sending`, `sent`, `failed`, `dead`, `skipped`), `email` (exact recipient), `eventKey`, `page`, `limit`. Newest first, paginated.

```json
{
  "data": [
    {
      "_id": "67b2...",
      "eventKey": "financeform.submitted",
      "template": "finance/finance-form-submitted",
      "module": "finance",
      "to": { "email": "cfo@pgsl.com", "name": "Chika Eze", "kind": "user" },
      "subject": "Payment request FF-0042 needs your approval (₦125,000.00)",
      "priority": 0,
      "status": "dead",
      "attempts": 6,
      "maxAttempts": 6,
      "nextAttemptAt": "2026-10-04T08:32:00.000Z",
      "lastError": "Brevo responded 503: ...",
      "attemptLog": [{ "at": "2026-10-04T08:30:00.000Z", "code": "503", "message": "Brevo responded 503: ..." }],
      "createdAt": "2026-10-04T08:30:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

Status meanings: `pending` waiting (or waiting to retry), `sending` claimed by a worker, `sent`, `failed` the provider rejected it permanently (bad address, malformed), `dead` retries exhausted, `skipped` expired before it could be sent or its body was purged.

### 5.2 `GET /mail/outbox/stats`
Permission `core.settings.view`. `{ pending, sending, sent, failed, dead, skipped, oldestPendingAt }`.

### 5.3 `POST /mail/outbox/:id/retry`
Permission `core.settings.update`. Resets a `failed` or `dead` message to `pending` with zero attempts; the worker sends it on its next run. `409 INVALID_STATE_TRANSITION` for any other status, and for one-time-secret mail (OTP, reset and invite links) whose body was purged after the attempt (ask the user to request a new one).

Dead-lettered mail raises an in-app alert to every Super Admin once an hour (`system.email_delivery_failing`); a failed scheduled job raises `system.job_failed` (in-app and email, at most once per job per day).

---

## 6. Content rules

- Sensitive mail is **notice plus link only** (decision D-7): payslips, disciplinary cases, candidate rejections never carry amounts, allegations or reasons.
- Rejection reasons and similar free text are HTML-escaped. Templates are rendered in Handlebars strict mode: a missing variable fails (and is logged) instead of sending a blank.
- Auth emails carry links built from `APP_BASE_URL`, never bare tokens. Reset and invite tokens are single use; the OTP mail keeps the code on its own line.
- Mail with a secret (OTP, reset, invite) is marked sensitive: its stored body is purged once sent.
- Staff reminders count calendar days; "working days" in the approved copy are approximated.

---

## 7. Which events produce email

Legend: **Priority** and **Gate** as in sections 1 and 4. "in-app only" events create a bell entry and no email. Reminder rows run in the 07:30 sweep. "Fires on" lists the `ActivityEvent.action` values (the audit trail) that trigger the event. Catalogue ids refer to `docs/audit/02-notifications-email.md` section 2. Several templates serve more than one event and some events have two audiences (staff and vendor), so one event key can send more than one template.

#### Platform Core, Auth and System

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `auth.otp` | NT-001 | P0 | SEC | `auth/otp` | direct |
| `auth.password_changed` | NT-005 | P0 | SEC | `auth/password-changed` | direct |
| `auth.password_reset_requested` | NT-002 | P0 | SEC | `auth/password-reset-requested` | direct |
| `document.approved` | NT-010 | P1 | DEC | `platform/document-decision` | `document.approved` |
| `document.checked_out` | NT-012 | P2 | SYS | in-app only | `document.checked_out` |
| `document.rejected` | NT-011 | P1 | DEC | `platform/document-decision` | `document.rejected` |
| `document.submitted` | NT-009 | P1 | APR | `platform/document-submitted` | `document.submitted` |
| `memo.acknowledged` | NT-018 | P2 | SYS | in-app only | `memo.acknowledged` |
| `memo.received` | NT-017 | P1 | SYS | `platform/memo-urgent` | `memo.sent` |
| `settings.security_changed` | NT-008 | P1 | SEC | `auth/security-settings-changed` | direct |
| `system.email_delivery_failing` | NT-260 | P1 | SEC | in-app only | direct |
| `system.generic_notification` | - | P2 | SYS | `platform/generic-notification` | direct |
| `system.job_failed` | NT-261 | P1 | SEC | `platform/system-job-failed` | direct |
| `task.assigned` | NT-013 | P2 | TASK | `platform/task-assigned` | `task.created` |
| `task.due_soon` | NT-015 | P1 | TASK | `platform/task-due` | daily sweep 07:30 |
| `task.overdue` | NT-016 | P1 | TASK | `platform/task-due` | daily sweep 07:30 |
| `task.status_changed` | NT-014 | P2 | TASK | in-app only | `task.status_changed` |
| `user.invite_pending` | NT-007 | P2 | SYS | `auth/invites-pending-digest` | direct |
| `user.invited` | NT-003 | P0 | SEC | `auth/user-invited` | direct |
| `user.password_reset_by_admin` | NT-004 | P0 | SEC | `auth/password-reset-by-admin` | direct |
| `user.status_changed` | NT-006 | P0 | SEC | `auth/account-suspended` | direct |

#### HR

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `attendance.overtime_approved` | NT-044 | P2 | SYS | in-app only | `attendance.overtime_approved` |
| `candidate.applied` | NT-025 | P2 | EXT | `hr/candidate-application-received` | `candidate.applied` |
| `candidate.rejected` | NT-027 | P1 | CAND | `hr/candidate-rejection` | `candidate.rejected` |
| `candidate.stage_changed` | NT-026 | P2 | EXT | `hr/candidate-stage-update` | `candidate.stage_changed` |
| `certification.expired` | NT-038 | P1 | EXP | `hr/certification-expiring` | daily sweep 07:30 |
| `certification.expiring` | NT-038 | P1 | EXP | `hr/certification-expiring` | daily sweep 07:30 |
| `disciplinarycase.logged` | NT-039 | P1 | SYS | `hr/disciplinary-case-assigned` | `disciplinarycase.logged` |
| `disciplinarycase.resolved` | NT-040 | P1 | SYS | `hr/disciplinary-case-resolved` | `disciplinarycase.resolved` |
| `employee.contract_ending` | NT-046 | P1 | EXP | `hr/contract-ending` | daily sweep 07:30 |
| `employee.deactivated` | NT-021 | P1 | SYS | `hr/employee-deactivated` | `employee.deactivated` |
| `employee.deployed` | NT-023 | P1 | SYS | `hr/deployment-notice` | `deployment.created` |
| `employee.deployment_completed` | NT-024 | P2 | SYS | in-app only | `deployment.status_changed` |
| `employee.probation_ending` | NT-045 | P1 | SYS | `hr/probation-ending` | daily sweep 07:30 |
| `employee.registered` | NT-020 | P2 | SYS | in-app only | `employee.registered` |
| `leave.approved` | NT-030 | P1 | DEC | `hr/leave-decision` | `leave.approved` |
| `leave.changes_requested` | NT-032 | P1 | DEC | `hr/leave-changes-requested` | `leave.changes_requested` |
| `leave.declined` | NT-031 | P1 | DEC | `hr/leave-decision` | `leave.declined` |
| `leave.pending_reminder` | NT-029 | P1 | APR | `hr/leave-pending-reminder` | daily sweep 07:30 |
| `leave.requested` | NT-028 | P1 | APR | `hr/leave-requested` | `leave.requested` |
| `leave.starting` | NT-033 | P2 | SYS | in-app only | daily sweep 07:30 |
| `onboarding.ready_for_deployment` | NT-022 | P2 | SYS | in-app only | `onboarding.status_changed` |
| `payrollrun.approved` | NT-042 | P0 | DEC | `hr/payroll-run-decision` | `payrollrun.approved` |
| `payrollrun.generated` | NT-041 | P0 | APR | `hr/payroll-run-approval` | `payrollrun.generated` |
| `payrollrun.pending_reminder` | NT-041 | P0 | APR | `hr/payroll-run-approval` | daily sweep 07:30 |
| `payrollrun.rejected` | NT-042 | P0 | DEC | `hr/payroll-run-decision` | `payrollrun.rejected` |
| `payslip.available` | NT-043 | P0 | SYS | `hr/payslip-available` | `payrollrun.approved` |
| `training.cancelled` | NT-036 | P1 | SYS | `hr/training-cancelled` | `training.cancelled` |
| `training.evaluated` | NT-037 | P2 | SYS | `hr/training-outcome` | `training.evaluated` |
| `training.reminder` | NT-035 | P1 | SYS | `hr/training-reminder` | daily sweep 07:30 |
| `training.scheduled` | NT-034 | P1 | SYS | `hr/training-assigned` | daily sweep 07:30 |

#### Administration

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `adminrequest.approved` | NT-062 | P1 | DEC | `administration/admin-request-decision` | `adminrequest.step_advanced` |
| `adminrequest.completed` | NT-064 | P2 | DEC | in-app only | `adminrequest.completed` |
| `adminrequest.pending_reminder` | NT-065 | P1 | APR | `administration/admin-request-pending-reminder` | daily sweep 07:30 |
| `adminrequest.rejected` | NT-063 | P1 | DEC | `administration/admin-request-decision` | `adminrequest.rejected` |
| `adminrequest.step_advanced` | NT-061 | P1 | APR | `administration/admin-request-approval` | `adminrequest.step_advanced` |
| `adminrequest.submitted` | NT-060 | P1 | APR | `administration/admin-request-approval` | `adminrequest.submitted` |
| `asset.retired` | NT-076 | P2 | SYS | in-app only | `asset.retired` |
| `asset.status_changed` | NT-085 | P2 | SYS | in-app only | `asset.registered`, `asset.status_changed` |
| `asset.transferred` | NT-075 | P2 | SYS | `administration/asset-transferred` | `asset.transferred` |
| `asset.warranty_expiring` | NT-077 | P2 | EXP | in-app only | daily sweep 07:30 |
| `disposal.completed` | NT-084 | P2 | SYS | in-app only | `disposal.completed` |
| `disposal.logged` | NT-083 | P2 | SYS | in-app only | `disposal.logged` |
| `facilitymaintenance.cancelled` | NT-082 | P2 | SYS | in-app only | `facilitymaintenance.cancelled` |
| `facilitymaintenance.completed` | NT-082 | P2 | SYS | in-app only | `facilitymaintenance.completed` |
| `facilitymaintenance.due_soon` | NT-080 | P1 | SYS | `administration/maintenance-due` | daily sweep 07:30 |
| `facilitymaintenance.overdue` | NT-081 | P1 | SYS | `administration/maintenance-due` | daily sweep 07:30 |
| `facilitymaintenance.scheduled` | NT-079 | P2 | SYS | in-app only | `facilitymaintenance.scheduled` |
| `movement.approval_requested` | NT-071 | P1 | APR | `administration/movement-approval-requested` | `movement.created` |
| `movement.approved` | NT-072 | P1 | DEC | `administration/movement-decision` | `movement.approved` |
| `movement.delivered` | NT-073 | P2 | SYS | in-app only | `movement.status_changed` |
| `movement.in_transit` | NT-073 | P2 | SYS | in-app only | `movement.status_changed` |
| `movement.rejected` | NT-072 | P1 | DEC | `administration/movement-decision` | `movement.rejected` |
| `movement.return_overdue` | NT-074 | P1 | SYS | `administration/movement-return-overdue` | daily sweep 07:30 |
| `supplyitem.low_stock` | NT-078 | P1 | SYS | `administration/supply-low-stock-digest` | daily sweep 07:30 |
| `travel.departure_reminder` | NT-070 | P2 | SYS | `administration/travel-departure-reminder` | daily sweep 07:30 |
| `travelrequest.approved` | NT-068 | P1 | DEC | `administration/travel-request-decision` | `travelrequest.step_advanced` |
| `travelrequest.rejected` | NT-069 | P1 | DEC | `administration/travel-request-decision` | `travelrequest.rejected` |
| `travelrequest.step_advanced` | NT-067 | P1 | APR | `administration/travel-request-approval` | `travelrequest.step_advanced` |
| `travelrequest.submitted` | NT-066 | P1 | APR | `administration/travel-request-approval` | `travelrequest.submitted` |

#### Business Development

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `client.archived` | NT-101 | P2 | SYS | in-app only | `client.archived` |
| `client.registered` | NT-100 | P2 | SYS | in-app only | `client.registered` |
| `interaction.follow_up_due` | NT-102 | P1 | SYS | `business-dev/follow-up-due` | daily sweep 07:30 |
| `opportunity.converted_to_tender` | NT-105 | P2 | SYS | in-app only | `opportunity.converted_to_tender` |
| `opportunity.lost` | NT-104 | P2 | SYS | in-app only | `opportunity.lost` |
| `opportunity.stage_advanced` | NT-103 | P2 | SYS | in-app only | `opportunity.stage_advanced` |
| `rfq.awarded` | NT-110 | P1 | DEC | `business-dev/rfq-awarded` | `rfq.awarded` |
| `rfq.deadline_approaching` | NT-112 | P1 | SYS | `business-dev/rfq-deadline` | daily sweep 07:30 |
| `rfq.lost` | NT-111 | P2 | SYS | in-app only | `rfq.lost` |
| `rfq.stage_advanced` | NT-109 | P2 | SYS | in-app only | `rfq.stage_advanced` |
| `tender.deadline_approaching` | NT-108 | P1 | SYS | `business-dev/tender-deadline` | daily sweep 07:30 |
| `tender.decided` | NT-107 | P1 | DEC | `business-dev/tender-decided` | `tender.decided` |
| `tender.stage_advanced` | NT-106 | P2 | SYS | in-app only | `tender.stage_advanced` |

#### Technical

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `calibrationrecord.due_soon` | NT-163 | P1 | EXP | `technical/calibration-due` | daily sweep 07:30 |
| `calibrationrecord.out_of_service` | NT-165 | P1 | SYS | `technical/calibration-out-of-service` | `calibrationrecord.out_of_service` |
| `calibrationrecord.overdue` | NT-164 | P0 | EXP | `technical/calibration-due` | daily sweep 07:30 |
| `calibrationrecord.restored` | NT-166 | P2 | SYS | in-app only | `calibrationrecord.restored` |
| `engineeringdocument.approved` | NT-161 | P1 | DEC | `technical/engineering-document-outcome` | `engineeringdocument.approved` |
| `engineeringdocument.check_approved` | NT-159 | P1 | APR | `technical/engineering-document-review-request` | `engineeringdocument.check_approved` |
| `engineeringdocument.rejected` | NT-160 | P1 | DEC | `technical/engineering-document-outcome` | `engineeringdocument.rejected` |
| `engineeringdocument.returned` | NT-160 | P1 | DEC | `technical/engineering-document-outcome` | `engineeringdocument.review_returned`, `engineeringdocument.check_returned` |
| `engineeringdocument.review_approved` | NT-158 | P1 | APR | `technical/engineering-document-review-request` | `engineeringdocument.review_approved` |
| `engineeringdocument.sent_to_client` | NT-162 | P2 | SYS | in-app only | `engineeringdocument.sent_to_client` |
| `engineeringdocument.submitted` | NT-157 | P1 | APR | `technical/engineering-document-review-request` | `engineeringdocument.uploaded`, `engineeringdocument.replaced` |
| `project.completion_due` | NT-143 | P1 | SYS | `technical/project-completion-due` | daily sweep 07:30 |
| `project.registered` | NT-140 | P2 | SYS | `technical/project-registered` | `project.registered` |
| `project.status_changed` | NT-141 | P1 | DEC | `technical/project-status-changed` | `project.status_changed` |
| `project.timeline_updated` | NT-142 | P2 | SYS | in-app only | `project.timeline_updated` |
| `projectlog.change_request_submitted` | NT-147 | P1 | APR | `technical/change-request-submitted` | `projectlog.raised` |
| `projectlog.raised` | NT-146 | P1 | TASK | `technical/project-log-assigned` | `projectlog.raised` |
| `projectlog.status_changed` | NT-148 | P1 | DEC | `technical/project-log-status-changed` | `projectlog.status_changed` |
| `resourcerequest.cancelled` | NT-152 | P2 | SYS | in-app only | `resourcerequest.cancelled` |
| `resourcerequest.issued` | NT-151 | P1 | DEC | `technical/resource-request-decision` | `resourcerequest.issued` |
| `resourcerequest.rejected` | NT-151 | P1 | DEC | `technical/resource-request-decision` | `resourcerequest.rejected` |
| `resourcerequest.returned` | NT-152 | P2 | SYS | in-app only | `resourcerequest.returned` |
| `resourcerequest.submitted` | NT-149 | P1 | APR | `technical/resource-request-submitted` | `resourcerequest.submitted` |
| `resourcerequest.technical_approved` | NT-150 | P1 | APR | `technical/resource-request-store-review` | `resourcerequest.technical_approved` |
| `resourcerequest.unavailable` | NT-151 | P1 | DEC | `technical/resource-request-decision` | `resourcerequest.unavailable` |
| `sitediary.returned_for_revision` | NT-154 | P1 | DEC | `technical/site-diary-decision` | `sitediary.returned_for_revision` |
| `sitediary.signed_off` | NT-154 | P1 | DEC | `technical/site-diary-decision` | `sitediary.signed_off` |
| `sitediary.submitted` | NT-153 | P1 | APR | `technical/site-diary-submitted` | `sitediary.submitted` |
| `timesheet.approved` | NT-156 | P1 | DEC | `technical/timesheet-decision` | `timesheet.approved` |
| `timesheet.rejected` | NT-156 | P1 | DEC | `technical/timesheet-decision` | `timesheet.rejected` |
| `timesheet.submitted` | NT-155 | P1 | APR | `technical/timesheet-submitted` | `timesheet.logged` |
| `wbsactivity.assigned` | NT-144 | P2 | TASK | `technical/wbs-activity-assigned` | `wbsactivity.created` |
| `wbsactivity.completed` | NT-145 | P2 | SYS | in-app only | `wbsactivity.completed` |

#### Procurement

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `delivery.overdue` | NT-194 | P1 | SYS (vendor part EXT) | `procurement/delivery-overdue` for staff; `procurement/delivery-chase-vendor` to the vendor | daily sweep 07:30 |
| `delivery.status_changed` | NT-193 | P1 | SYS | `procurement/delivery-exception` | `delivery.status_changed` |
| `goodsreceipt.failed` | NT-196 | P0 | SYS | `procurement/goods-receipt-failed-internal` | `goodsreceipt.inspection_decided` |
| `goodsreceipt.logged` | NT-195 | P2 | SYS | in-app only | `goodsreceipt.logged` |
| `inventoryitem.low_stock` | NT-197 | P1 | SYS | `procurement/inventory-low-stock-digest` | daily sweep 07:30 |
| `procurementrfq.awarded` | NT-188 | P0 | EXT | `procurement/rfq-award-vendor` | `procurementrfq.awarded` |
| `procurementrfq.bidding_closed` | NT-187 | P1 | APR | `procurement/rfq-bidding-closed` | `procurementrfq.bidding_closed` |
| `procurementrfq.cancelled` | NT-189 | P1 | EXT | `procurement/rfq-cancelled-vendor` | `procurementrfq.cancelled` |
| `procurementrfq.closing_soon` | NT-186 | P1 | SYS | in-app only | daily sweep 07:30 |
| `procurementrfq.issued` | NT-184 | P1 | EXT | `procurement/rfq-invitation-vendor` | `procurementrfq.issued` |
| `procurementrfq.vendor_response_logged` | NT-185 | P2 | SYS | in-app only | `procurementrfq.vendor_response_logged` |
| `purchaseorder.acknowledged` | NT-191 | P2 | SYS | in-app only | `purchaseorder.acknowledged` |
| `purchaseorder.cancelled` | NT-192 | P0 | EXT | `procurement/purchase-order-cancelled-vendor` | `purchaseorder.cancelled` |
| `purchaseorder.issued` | NT-190 | P0 | EXT | `procurement/purchase-order-vendor` | `purchaseorder.created` |
| `requisition.approved` | NT-181 | P1 | DEC | `procurement/requisition-decision` | `requisition.approved` |
| `requisition.converted_to_rfq` | NT-182 | P2 | DEC | in-app only | `requisition.converted_to_rfq` |
| `requisition.pending_reminder` | NT-183 | P1 | APR | `procurement/requisition-pending-reminder` | daily sweep 07:30 |
| `requisition.rejected` | NT-181 | P1 | DEC | `procurement/requisition-decision` | `requisition.rejected` |
| `requisition.submitted` | NT-180 | P1 | APR | `procurement/requisition-submitted` | `requisition.submitted` |
| `stockmovement.cancelled` | NT-172 | P2 | SYS | in-app only | `stockmovement.cancelled` |
| `stockmovement.completed` | NT-172 | P2 | SYS | in-app only | `stockmovement.completed` |
| `vendor.inactive` | NT-170 | P0 | SYS | `procurement/vendor-suspended-internal` | `vendor.status_changed` |
| `vendor.reactivated` | NT-171 | P2 | EXT | `procurement/vendor-reactivated-notice` | `vendor.reactivated` |
| `vendor.suspended` | NT-170 | P0 | SYS | `procurement/vendor-suspended-internal` | `vendor.status_changed` |
| `vendorprequalification.approved` | NT-199 | P1 | DEC | `procurement/prequalification-decision` | `vendorprequalification.approved` |
| `vendorprequalification.rejected` | NT-199 | P1 | DEC | `procurement/prequalification-decision` | `vendorprequalification.rejected` |
| `vendorprequalification.submitted` | NT-198 | P1 | APR | `procurement/prequalification-submitted` | `vendorprequalification.submitted` |

#### HSE

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `emergencyplan.archived` | NT-207 | P2 | SYS | in-app only | `emergencyplan.archived` |
| `emergencyplan.replaced` | NT-206 | P1 | SYS | `hse/emergency-plan-replaced` | `emergencyplan.replaced` |
| `emergencyplan.status_changed` | NT-208 | P2 | SYS | in-app only | `emergencyplan.marked_active`, `emergencyplan.marked_under_review` |
| `offshoretraveldocument.compliance_digest` | NT-203, NT-204 | P0 | EXP | `hse/offshore-compliance-digest` | daily sweep 07:30 |
| `offshoretraveldocument.expired` | NT-204 | P0 | PERMIT | `hse/offshore-document-expiry-employee` | daily sweep 07:30 |
| `offshoretraveldocument.expiring_soon` | NT-203 | P0 | EXP | `hse/offshore-document-expiry-employee` | daily sweep 07:30 |
| `offshoretraveldocument.rejected` | NT-202 | P0 | PERMIT | `hse/offshore-document-rejected` | `offshoretraveldocument.rejected` |
| `offshoretraveldocument.renewed` | NT-205 | P1 | APR | `hse/offshore-document-renewed` | `offshoretraveldocument.renewed` |
| `offshoretraveldocument.submitted` | NT-200 | P1 | APR | `hse/offshore-document-submitted` | `offshoretraveldocument.submitted` |
| `offshoretraveldocument.verified` | NT-201 | P2 | PERMIT | `hse/offshore-document-verified` | `offshoretraveldocument.verified` |

#### Quality

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `qualityaudit.closed` | NT-216 | P2 | SYS | in-app only | `qualityaudit.closed` |
| `qualityaudit.completed` | NT-214 | P2 | SYS | `quality/audit-completed` | `qualityaudit.completed` |
| `qualityaudit.overdue` | NT-212 | P1 | SYS | `quality/audit-overdue` | daily sweep 07:30 |
| `qualityaudit.report_uploaded` | NT-215 | P2 | SYS | in-app only | `qualityaudit.report_uploaded` |
| `qualityaudit.rescheduled` | NT-210 | P1 | SYS | `quality/audit-scheduled` | `qualityaudit.rescheduled` |
| `qualityaudit.scheduled` | NT-209 | P1 | SYS | `quality/audit-scheduled` | `qualityaudit.scheduled` |
| `qualityaudit.started` | NT-213 | P2 | SYS | in-app only | `qualityaudit.started` |
| `qualityaudit.starting_soon` | NT-211 | P1 | SYS | `quality/audit-starting-soon` | daily sweep 07:30 |

#### Accounts and Finance

| Event key | Catalogue | Priority | Gate | Email template | Fires on |
|---|---|---|---|---|---|
| `bankreconciliation.reconciled` | NT-254 | P2 | DEC | in-app only | `bankreconciliation.reconciled` |
| `bankreconciliation.submitted_review` | NT-253 | P1 | APR | `finance/bank-reconciliation-submitted` | `bankreconciliation.reviewed` |
| `budget.approved` | NT-226 | P1 | DEC | `finance/budget-decision` | `budget.approved` |
| `budget.closed` | NT-227 | P2 | DEC | in-app only | `budget.closed` |
| `budget.rejected` | NT-226 | P1 | DEC | `finance/budget-decision` | `budget.rejected` |
| `budget.submitted` | NT-225 | P1 | APR | `finance/budget-submitted` | `budget.submitted` |
| `budget.threshold_reached` | NT-228 | P0 | SYS | `finance/budget-threshold` | `payable.payment_recorded` |
| `commercialrisk.logged` | NT-248 | P1 | SYS | `finance/risk-logged` | `commercialrisk.logged` |
| `commercialrisk.status_changed` | NT-249 | P2 | SYS | in-app only | `commercialrisk.under_review`, `commercialrisk.mitigated`, `commercialrisk.closed` |
| `contract.active` | NT-242 | P2 | DEC | in-app only | `contract.active` |
| `contract.closed` | NT-242 | P2 | DEC | in-app only | `contract.closed` |
| `contract.ending` | NT-243 | P0 | EXP | `finance/contract-ending` | daily sweep 07:30 |
| `contract.signed` | NT-242 | P1 | DEC | `finance/contract-status` | `contract.signed` |
| `contract.submitted_review` | NT-241 | P1 | APR | `finance/contract-review-requested` | `contract.submitted_review` |
| `contractclaim.approved` | NT-247 | P0 | DEC | `finance/claim-decision` | `contractclaim.approved` |
| `contractclaim.rejected` | NT-247 | P0 | DEC | `finance/claim-decision` | `contractclaim.rejected` |
| `contractclaim.settled` | NT-247 | P0 | DEC | `finance/claim-decision` | `contractclaim.settled` |
| `contractclaim.submitted` | NT-246 | P0 | APR | `finance/claim-submitted` | `contractclaim.submitted` |
| `contractvariation.approved` | NT-245 | P1 | DEC | `finance/variation-decision` | `contractvariation.approved` |
| `contractvariation.incorporated` | NT-245 | P1 | DEC | `finance/variation-decision` | `contractvariation.incorporated` |
| `contractvariation.rejected` | NT-245 | P1 | DEC | `finance/variation-decision` | `contractvariation.rejected` |
| `contractvariation.submitted` | NT-244 | P1 | APR | `finance/variation-submitted` | `contractvariation.submitted` |
| `financeform.approved` | NT-230 | P0 | DEC | `finance/finance-form-decision` | `financeform.approved` |
| `financeform.pending_reminder` | NT-231 | P1 | APR | `finance/finance-form-pending-reminder` | daily sweep 07:30 |
| `financeform.rejected` | NT-230 | P0 | DEC | `finance/finance-form-decision` | `financeform.rejected` |
| `financeform.submitted` | NT-229 | P0 | APR | `finance/finance-form-submitted` | `financeform.submitted` |
| `insurancepolicy.expired` | NT-251 | P0 | EXP | `finance/insurance-expiring` | daily sweep 07:30 |
| `insurancepolicy.expiring_soon` | NT-250 | P0 | EXP | `finance/insurance-expiring` | daily sweep 07:30 |
| `insurancepolicy.renewed` | NT-252 | P2 | SYS | in-app only | `insurancepolicy.renewed` |
| `invoice.cancelled` | NT-236 | P1 | SYS | in-app only | `invoice.cancelled` |
| `invoice.due_soon` | NT-235 | P0 | SYS | `finance/receivables-due-digest` | daily sweep 07:30 |
| `invoice.issued` | NT-232 | P0 | EXT | `finance/invoice-issued-client` | `invoice.issued` |
| `invoice.overdue` | NT-235 | P0 | SYS | `finance/receivables-due-digest` | daily sweep 07:30 |
| `invoice.client_reminder` | NT-235 | P1 | EXT | `finance/payment-reminder-client` to the client's contact | daily sweep 07:30, steps 3 days before, on the due date, then 3, 7, 14 and 30 days overdue |
| `invoice.payment_recorded` | NT-233 | P1 | SYS (client part EXT) | `finance/payment-receipt-client` to the client; in-app only for staff | `invoice.payment_recorded` |
| `invoice.reminder_sent` | NT-234 | P0 | EXT | `finance/payment-reminder-client` | `invoice.reminder_sent` |
| `journalentry.approved` | NT-221 | P1 | DEC | `finance/journal-entry-decision` | `journalentry.approved` |
| `journalentry.posted` | NT-223 | P2 | DEC | in-app only | `journalentry.posted` |
| `journalentry.rejected` | NT-222 | P1 | DEC | `finance/journal-entry-decision` | `journalentry.rejected` |
| `journalentry.reversed` | NT-224 | P1 | DEC | `finance/journal-entry-reversed` | `journalentry.reversed` |
| `journalentry.submitted` | NT-220 | P1 | APR | `finance/journal-entry-submitted` | `journalentry.submitted` |
| `payable.due_soon` | NT-238 | P0 | SYS | `finance/payables-due-digest` | daily sweep 07:30 |
| `payable.overdue` | NT-238 | P0 | SYS | `finance/payables-due-digest` | daily sweep 07:30 |
| `payable.payment_recorded` | NT-239 | P1 | SYS | `finance/remittance-advice-vendor` | `payable.payment_recorded` |
| `payable.recorded` | NT-237 | P2 | SYS | in-app only | `payable.recorded` |
| `payable.voided` | NT-240 | P2 | SYS | in-app only | `payable.voided` |
| `taxrecord.due_soon` | NT-255 | P0 | SYS | `finance/tax-due` | daily sweep 07:30 |
| `taxrecord.filed` | NT-257 | P2 | SYS | in-app only | `taxrecord.filed` |
| `taxrecord.overdue` | NT-256 | P0 | SYS | `finance/tax-due` | daily sweep 07:30 |
| `taxrecord.paid` | NT-257 | P1 | SYS | in-app only | `taxrecord.paid` |
| `taxrecord.submitted` | NT-257 | P2 | SYS | in-app only | `taxrecord.submitted` |

---

## 8. Known gaps and notes for module owners

Triggers that depend on module services (the mail layer can only react to what services record in `ActivityEvent`):

| Where | Gap | Effect today |
|---|---|---|
| `payroll/payslip.service.ts` `emailPayslip` | sends a short notice that a payslip is available; pay details are never in the mail (fixed after the production review) | none |
| `tasks/task.service.ts` `updateTask`, `wbs` reassignment | no ActivityEvent on reassignment | no assignment email when a task or WBS activity changes assignee |
| `training/trainingParticipant.service.ts` `addParticipants` | no ActivityEvent | enrolment mail is produced by a daily sweep over participants added in the last 14 days (arrives the next 07:30 run) |
| `projects/project.service.ts` `updateProjectTimeline` | sets status `delayed` without `project.status_changed` | no status email for a delay set that way |
| `resource-requests`, `project-timesheets` reject paths | no `reason` on the ActivityEvent | rejection mail says "No reason was recorded." |
| `assets/asset.service.ts` `transferAsset` | activity is written before the asset is saved | the mail reads custodians and location from the event metadata |
| RFQs, purchase orders, goods receipts, stock movements | no `createdBy` | the "owner" is taken from the earliest creating ActivityEvent |
| Free-text people (`assignedTo`, `contractManager`, `riskOwner`, claim `raisedBy`) | not Employee references | matched to an employee only when exactly one name matches, otherwise the module pool is notified |

Not built, by design or because inputs do not exist:
- Invoice-cancelled mail to clients, and PDF **attachments** on emails (invoices and purchase orders). The PDF generator now exists (`GET /invoices/:id/pdf`), so attaching it is possible, but the mail transport does not send attachments yet.
- NT-073 destination department head (Location has no head), NT-214 audited vendor's internal owner, NT-077 warranty email (in-app only).
- `previous_expiry_date` (HSE-07) and `previous_start_date` (HSE-09) are omitted: the services do not keep the old dates.
- Bank payment instructions in the client invoice mail are generic text (NEEDS-CONFIRM: no bank fields in settings). The tax authority name in the tax reminder is omitted.

Template copy notes: `hr/employee-deactivated` says "suspend or deactivate" the linked login although deactivation already cascades; `hse/offshore-document-expired-mobilisation-block` prints `deployment_ref` in the preheader; `hse/offshore-document-expiry-employee` subject says "Your" even for the manager copy; `procurement/delivery-overdue` never shows `delivery_ref`.

---

## 9. Testing

`MAIL_TRANSPORT=memory` (set by `tests/env.setup.ts`) captures every message in `memoryMailbox` (`src/modules/mail/transports`). Tests call `drainOutbox()` after dispatching and assert on `memoryMailbox` / `mailsTo(email)`. `failNextSend`, `failAllSends` and `clearMailbox` simulate provider failures. `processActivityEvent` runs the subscriber for one ActivityEvent; `runReminders({ now })` runs the reminder sweep for a chosen day. Under test, `recordActivity` awaits the subscriber so results are deterministic; in production it does not wait.
