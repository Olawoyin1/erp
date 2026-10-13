# PGSL ERP — Platform Core API Reference

This document describes every HTTP endpoint implemented by the Platform Core module (auth, users, roles & permissions, departments, locations, documents, tasks, activity feed, notifications). Every other module's API doc (`hr.md`, `administration.md`, `business-dev.md`) points back here for the shared conventions below — read this file first.

---

## 0. Changes since the production review (read this first)

These apply across every module. Module-specific changes are at the top of each module's own document.

### Money is whole kobo, and the server enforces it
Every monetary amount in the API is an **integer in minor units** (kobo for NGN, cents for USD). `50000000` means N500,000.00. A fractional or non-numeric amount is rejected with `422 VALIDATION_ERROR` ("Amount must be a whole number of kobo"); the stored field validators refuse them too. Percentages and exchange rates are ordinary numbers; every percentage of an amount is rounded half away from zero to a whole kobo, in one shared helper. CSV and XLSX exports show naira with two decimals for readability; **imports take naira** (see "Bulk import" below) and convert.

### `Idempotency-Key`: safe retries on money-moving requests
Send a unique `Idempotency-Key` header (up to 200 characters) with any of these `POST` requests and a retry after a dropped connection replays the first response instead of doing the work twice: invoices (create, record-payment), payables (create, record-payment), journal entries (create, approve, post, reverse), payroll (generate run, approve run, create payslip), stock movements (create, complete), finance forms (create, approve), tax-record payment, budget approval. Rules: same key and same body replays the stored response with `Idempotency-Replayed: true`; same key with a different body is `422`; same key while the first request is still running is `409`; keys are per user and per route and expire after 24 hours; a `5xx` response is not stored, so the client can retry. Without the header the route behaves as before (the service layer's atomic updates still prevent double effects).

### Nobody approves their own request
A person cannot approve or decide a request they raised, compared by both login account and linked employee record (`403`). It covers leave, fund requests (`FinanceForm`), purchase requisitions, administrative requests, timesheets, overtime, documents, engineering documents, journal entries (approve and reject), payroll runs and payables. A Super Admin keeps the break-glass bypass on chains that name a permission.

### Out-of-scope records look like they do not exist
Where a record belongs to a person (leave, attendance, memos, timesheets, payslips) a caller outside their scope gets `404`, never `403`, so identifiers cannot be probed. Scope is the caller's own record plus their direct reports, widened by a "view all" permission.

### New and changed permission keys (`GET /permissions`)
`core.*` unchanged. `hr.employee`: `confirm`, `view-sensitive`, `reactivate`. `hr.leave`: `view-all`, `create-on-behalf`. `hr.attendance`: `view-all`, `log`. `hr.holiday`: `view`, `manage`. `hr.candidate`: `convert`. `administration.adminrequest`: `decide-procurement`, `decide-finance`, `decide-final`. `administration.travelrequest`: `decide-finance`, `decide-final`. `technical.resourcerequest`: `decide-store`. `technical.engineeringdocument`: `decide-check`, `decide-approve`. `finance`: `period` (`view`, `close`), `ledger` (`view`, `admin`), `exchangerate` (`view`, `manage`), `statement` (`view`), `payable` gains `approve` and `override`. The complete route-by-permission table is generated in `docs/RBAC-MATRIX.md` (`npm run rbac-matrix`), and `tests/rbacMatrix.test.ts` proves that every protected route answers `401` without a token and `403` without its permission.

### Role and user changes are guarded and audited
An actor can grant only roles whose permissions they hold themselves; only a Super Admin can grant or remove Super Admin; the last active Super Admin cannot be suspended or stripped. Assigning roles, suspending, changing a password and editing a user revoke the person's sessions (a `tokenVersion` is checked on every request, cached for a few seconds) and write an `AuditLog` row.

### Audit trail
Before-and-after audit records are written for the actions below and read with **`GET /audit-logs`** (`core.auditlog.view`; paginated, newest first; filters `actorId`, `action`, `targetType`, `targetId`, `from`, `to`; each row has `actorId`, `action`, `targetType`, `targetId`, `before`, `after`, `at`). Recorded: role assignment, user profile edits, attachment deletion, employee edits (grade, salary, department, manager, contract type, position, status, email), salary-structure and tax-definition changes, attendance corrections, company, approvals and finance settings. Each stores the actor and only the fields that changed.

### Bulk import: `/imports`
Permissions are the matching create permission: accounts need `finance.account.create`, clients `businessdev.client.create`, employees `hr.employee.create`, inventory items `procurement.inventoryitem.create`.
- `GET /imports` lists the import types you may run with their columns.
- `GET /imports/:entity/template` returns a CSV header and example row.
- `POST /imports/:entity?dryRun=true|false` (multipart, field `file`, `.csv` or `.xlsx`, up to 5 MB and 5,000 rows). **The default is a dry run**: every row is validated (including duplicates inside the file and against existing records) and nothing is written. With `dryRun=false` the valid rows are created one by one; a row that fails is reported and the rest still go in. Response: `{ entity, dryRun, totalRows, validRows, created, errors: [{ row, field?, message }] }` (row numbers count the header as row 1).
- Amounts in an import file are in naira (for example `450000.50`) and are converted to kobo. Employees take `department` as a code or name, and accounts must fall inside the configured chart-of-accounts ranges.

### Downloads
PDF: invoices, payslips, memos (see their modules). Statements and reports: `format=csv|xlsx` (see `accounts-finance.md` §20). The CSV and XLSX writers neutralise cell values that start with `=`, `+`, `-` or `@`.

### Errors you will see more often
`403` for approving your own work or acting without the step permission; `404` for out-of-scope records; `409` for "still referenced" guards (archiving a client with open projects, deactivating a department with staff, and so on; the message names what is blocking); `422` for fractional money, missing exchange rates and unmet matching rules.

---

## 1. Conventions

### 1.1 Base URL

All routes are mounted under a configurable prefix, read from `API_PREFIX` (default `/api/v1`):

```
{API_PREFIX}/...   e.g.  http://localhost:4000/api/v1/auth/login
```

There is also an unauthenticated, unprefixed health check: `GET /health` → `{ success: true, message: 'ok', data: { uptime } }`.

### 1.2 Response envelopes

Every JSON response follows one of three shapes.

**Success (single resource / action result)**

```json
{
  "success": true,
  "message": "Employee registered successfully",
  "data": { "...": "..." }
}
```

`message` is often `null` for simple GETs (the controller passes no message to `ok()`).

**Success (paginated list)**

```json
{
  "success": true,
  "message": null,
  "data": [ { "...": "..." } ],
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

Only endpoints whose controller calls `paginated()` return a `meta` block. A number of "list-shaped" endpoints (stats tiles, a single resource's sub-collections like an employee's leave history or documents, a task board) call `ok()` instead and return a bare array or object with **no `meta`**. This is called out explicitly under every such endpoint below — do not assume every array response is paginated.

**Error**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid email address" }]
  }
}
```

`details` is only present for validation-style errors.

### 1.3 Error codes

| Code | HTTP status | When |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Zod schema failure, malformed ObjectId, Mongoose `CastError`, unsupported/mismatched file upload, file too large |
| `UNAUTHENTICATED` | 401 | Missing/invalid/expired Bearer token, bad credentials, revoked/invalid refresh token |
| `FORBIDDEN` | 403 | Authenticated but missing the required permission string, or a blocked business rule (e.g. editing a system role) |
| `NOT_FOUND` | 404 | Resource doesn't exist, or the route itself doesn't exist (`notFoundHandler`) |
| `CONFLICT` | 409 | Unique-constraint violation, duplicate email/code, overlapping leave dates, last-Super-Admin protection |
| `INVALID_STATE_TRANSITION` | 409 | An action was attempted from a status that doesn't allow it (e.g. approving a non-`under_review` document) |
| `RESOURCE_LOCKED` | 423 | A document is already checked out by someone else |
| `RATE_LIMITED` | 429 | Too many requests against a rate-limited route |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

### 1.4 Authentication

Every route except the handful below requires:

```
Authorization: Bearer <accessToken>
```

**Public (no token required):** `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/resend-otp`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`. The OTP routes take a short-lived `mfaToken` instead of a Bearer token — see §2 for the full 2FA/OTP flow.

**Authenticated only, no extra permission check:** `GET /auth/me`, `PATCH /auth/change-password`, every route under `/me` (`GET`/`PATCH /me/profile`, `GET`/`PATCH /me/notification-preferences` — Settings' Profile/Notification-preferences tabs, documented fully in `settings.md` §2), attendance's `POST /attendance/clock-in` and `POST /attendance/clock-out` do still require a permission (`hr.attendance.create`) — see HR's Attendance section.

**Everything else** additionally requires a specific permission string, shown per-route below exactly as passed to `requirePermission(...)`. A user whose resolved permission set (returned by `GET /auth/me`) doesn't include that string gets `403 FORBIDDEN`. The frontend should hide or disable any action whose permission the current user lacks, using the `permissions` array from `/auth/me`.

One role bypasses all permission checks entirely: a user holding the `super-admin` role slug. Treat it as "can do everything" in the UI.

**`requireAnyPermission(...)`** (`src/middleware/rbac.ts`) is a variant added this phase: instead of requiring every listed permission (like `requirePermission`), it passes if the caller holds **any one** of the listed keys. It exists for routes gated by a tiered set of permissions where the exact tier required is a per-record decision the service layer checks itself, not something a static route guard alone can express. The first (and currently only) real consumer is Finance Forms' approval routes (`POST /finance-forms/:id/approve` / `/reject`, documented in `accounts-finance.md`): the route only checks "holds at least one of `finance.financeform.decide`, `.decide-tier2`, `.decide-tier3`", while `financeForm.service.ts` separately checks the record's own `requiredApprovalTier` against the caller's actual permissions before allowing the decision through. Same Super Admin bypass as `requirePermission`.

Access tokens are short-lived (`JWT_ACCESS_TTL`, default `15m`) and carry `{ sub, roles, permissions }`. Refresh tokens (`JWT_REFRESH_TTL`, default `7d`) are **rotated on every use**: `POST /auth/refresh` immediately revokes the refresh token it was given (`revokedAt` is set) and returns a brand-new access/refresh pair. Reusing an already-rotated (or logged-out, or password-changed) refresh token returns `401 UNAUTHENTICATED`. Changing password, resetting password, or suspending/deactivating a user revokes **all** of that user's outstanding refresh tokens.

### 1.5 Rate limits

- All `/api/v1/*` traffic: 600 requests / 15 minutes per IP (`RATE_LIMITED` on breach).
- `POST /auth/login`, `POST /auth/verify-otp`, `POST /auth/resend-otp`, `POST /auth/forgot-password`, `POST /auth/reset-password`: 20 requests / 15 minutes per IP (`authRateLimit`, `src/middleware/rateLimit.ts`).

### 1.6 Pagination, filtering, sorting

List endpoints that paginate accept:

| Param | Default | Notes |
|---|---|---|
| `page` | `1` | 1-based |
| `limit` | `20` | max `100` |

Most list endpoints additionally accept resource-specific filters (documented per-endpoint) such as `status`, `departmentId`, a free-text `q`, or date ranges. A few endpoints (Tasks) also accept `sort` / `order` against an allow-listed set of fields; an unrecognized `sort` value silently falls back to the endpoint's default rather than erroring.

### 1.7 File uploads

Any endpoint that accepts a file uses `multipart/form-data` with the file under field name **`file`**. Other body fields in the same request are ordinary form fields (they still go through the same Zod validation schema as a JSON body would).

- **Allowed types:** PDF, PNG, DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), DWG (accepted under several possible MIME types, including the generic `application/octet-stream`, since browsers don't agree on a DWG MIME type).
- **Size limit:** 50 MB. Over the limit → `422 VALIDATION_ERROR` ("File exceeds the 50MB limit").
- **Content sniffing:** the backend checks the file's actual magic bytes against its declared MIME type, independent of file extension. A mismatch (e.g. a `.pdf` that isn't really a PDF) is rejected with `422 VALIDATION_ERROR` — "File content does not match its declared type".
- Uploaded files are stored in Cloudflare R2 (S3-compatible); downloads are served via a short-lived (5 minute) presigned URL, never proxied through the API.

### 1.8 Money fields

Every currency amount in this API (salaries, allowances, deductions, tax brackets, payroll totals) is an **integer in minor units (kobo)**, never a float and never major units (naira). `25000000` means ₦250,000.00. Convert for display on the frontend; always send integers back.

---

## 2. Auth — `/auth`

### `POST /auth/login`
Public. Authenticates with email + password. **The response shape now depends on `CompanySettings.twoFactorAuthEnabled`** (`settings.md` §1.1/1.3) — this is a breaking change in shape from the single-shape response this route used to return.

Request body:
```json
{ "email": "ngozi.okafor@pgsl.com", "password": "StrongPass1!" }
```

Password is checked **before** branching on 2FA — a wrong password always returns `401 UNAUTHENTICATED` ("Invalid email or password") regardless of whether 2FA is on; the OTP challenge is only ever issued once the password itself is confirmed correct. A `suspended` or `deactivated` account gets `403 FORBIDDEN` with a descriptive message, not `401`, also checked before any OTP issuance.

**2FA off (`twoFactorAuthEnabled: false`) — response `200`, unchanged from before this phase:**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0d1",
      "firstName": "Ngozi",
      "lastName": "Okafor",
      "email": "ngozi.okafor@pgsl.com",
      "roles": ["65f1a2b3c4d5e6f7a8b9c0a1"],
      "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
      "locationId": null,
      "employeeId": "65f1a2b3c4d5e6f7a8b9c0c1",
      "status": "active",
      "lastLoginAt": "2026-10-03T08:12:00.000Z",
      "passwordChangedAt": "2026-01-15T09:00:00.000Z",
      "createdAt": "2025-11-01T10:00:00.000Z",
      "updatedAt": "2026-10-03T08:12:00.000Z"
    }
  }
}
```
Side effects: writes an `auth.login` audit log entry; updates `lastLoginAt`.

**2FA on (`twoFactorAuthEnabled: true`) — response `200`, no tokens yet:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "data": { "mfaRequired": true, "mfaToken": "9f8c7b6a5d4e3f2a1b0c..." }
}
```
No `auth.login` audit entry is written yet, and `lastLoginAt` is **not** updated at this point — both only happen once the OTP is actually verified (see below). **The frontend must branch on `data.mfaRequired`** after every login call: if `true`, route to an OTP-entry screen and hold onto `mfaToken`; if absent/`false`, proceed exactly as before with `accessToken`/`refreshToken`/`user`.

#### The OTP / 2FA flow end to end

1. `POST /auth/login` with correct credentials, 2FA on: server generates a random 6-digit code (`crypto.randomInt`, zero-padded) and a random 32-byte `mfaToken`, stores only their **hashes** (SHA-256) in a new `OtpToken` document (`src/modules/auth/otpToken.model.ts`), emails the raw code to the user, and returns the raw `mfaToken` to the caller. The code itself is never returned over HTTP.
2. The code **expires in 10 minutes** (`expiresAt`, also backed by a Mongo TTL index so expired documents are physically removed, not just logically ignored).
3. The user submits the code via `POST /auth/verify-otp` with `{ mfaToken, code }`. On success this behaves exactly like a normal login: issues a real access/refresh token pair, sets `lastLoginAt`, writes the `auth.login` audit entry, and marks the `OtpToken` as used (`usedAt`) so it can't be replayed.
4. **5 incorrect code attempts** are allowed per `OtpToken` (`OTP_MAX_ATTEMPTS = 5`); each wrong guess increments `attempts` and returns `401 UNAUTHENTICATED` ("Incorrect verification code"). On the 6th attempt (`attempts >= 5`, checked before comparing the submitted code), the response changes to "Too many incorrect attempts — request a new code" — the user must call `/resend-otp` to get a fresh code and a reset attempt counter; there's no way to "use up" the 5 and still succeed on a correct 6th guess.
5. `POST /auth/resend-otp` with `{ mfaToken }` reuses the **same** pending login session (same `mfaToken`/`OtpToken` document) — it does not start a new one. It rotates the code and `expiresAt` (fresh 10-minute window) and **resets `attempts` back to 0**, but only if at least **45 seconds** have passed since the last send (`lastSentAt`); calling it sooner returns `422 VALIDATION_ERROR` with a message naming exactly how many seconds remain. An already-used or expired `mfaToken` returns `401 UNAUTHENTICATED` ("Verification session is invalid or has expired") rather than silently issuing a new one.
6. Both `/verify-otp` and `/resend-otp` key everything off the `mfaToken` the client is holding, not any identity claim the client provides directly — there is no `email`/`userId` in either request body.

### `POST /auth/verify-otp`
Public (keyed by `mfaToken`, not a Bearer token). Rate-limited the same as `/login`.

Request body:
```json
{ "mfaToken": "9f8c7b6a5d4e3f2a1b0c...", "code": "483920" }
```
`code` must match `^\d{6}$` or `422 VALIDATION_ERROR` before even reaching the service. Response `200` on success — identical shape to the 2FA-off login response above (`accessToken`, `refreshToken`, `user`, message `"Logged in successfully"`).

### `POST /auth/resend-otp`
Public. Rate-limited the same as `/login`.

Request body: `{ "mfaToken": "9f8c7b6a5d4e3f2a1b0c..." }` → `data: null`, message `"Verification code resent"`. See step 5 above for the cooldown/reset behavior.

### `POST /auth/refresh`
Public. Rotates a refresh token.

Request body:
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiIs..." }
```
Response `data`: `{ accessToken, refreshToken }` — a brand-new pair. The token passed in is revoked immediately, whether or not the caller actually uses the new pair.

### `POST /auth/logout`
Public (no Bearer token needed — logout only needs the refresh token itself). Revokes the given refresh token. Idempotent: an already-invalid token still returns success.

Request body: `{ "refreshToken": "..." }` → `data: null`, message "Logged out successfully".

### `GET /auth/me`
Authenticated only. Returns the current user (with `roles`, `departmentId`, `locationId` populated as full objects), plus the resolved role slugs and flattened permission list the frontend should gate the UI on.

```json
{
  "success": true,
  "message": null,
  "data": {
    "user": { "_id": "65f1a2b3c4d5e6f7a8b9c0d1", "firstName": "Ngozi", "...": "..." },
    "roles": ["hr-manager"],
    "permissions": ["hr.employee.view", "hr.employee.create", "hr.leave.decide", "..."]
  }
}
```

### `PATCH /auth/change-password`
Authenticated only.

Request body:
```json
{ "currentPassword": "OldPass1!", "newPassword": "NewPass123!" }
```
`newPassword` must satisfy strength rules (min 8 chars, upper + lower case + a number). On success, `data: null`, and **every** refresh token for this user is revoked (forces re-login everywhere else).

### `POST /auth/forgot-password`
Public, rate-limited. Always returns the same generic success response regardless of whether the email exists (`data: null`, message "If that email exists, a reset link has been sent"). If the user exists, emails a raw reset token (1 hour TTL) — there is no endpoint that returns this token to the frontend; it's delivered purely by email.

Request body: `{ "email": "ngozi.okafor@pgsl.com" }`

### `POST /auth/reset-password`
Public, rate-limited.

Request body:
```json
{ "token": "9f8c7b6a5d4e3f2a1b0c...", "newPassword": "BrandNewPass1!" }
```
An invalid/expired/already-used token → `422 VALIDATION_ERROR`. On success, flips an `invited` user to `active`, and revokes all of that user's refresh tokens.

---

## 3. Users — `/users`

All routes require authentication. All list/detail actions require `core.user.view`; mutations require the specific `core.user.*` key noted per route — the catalogue's `core.user` block grew this phase from `['view','create','update','suspend','export']` to also include `'reset-password'`, `'resend-invite'`, `'cancel-invite'` (`src/lib/permissions.ts`).

**New fields on `User` this phase** (`user.model.ts`): `userCode` (server-generated, see Appendix), `jobTitle` (free text, up to 150 chars — no `ref` match, just a label), `phoneNumber` (free text, no format validation), `notificationPreferences` (`{ taskAssignment, approvalRequest, systemAlert }`, all booleans — this is the *personal* inbox-preference object; don't confuse it with `CompanySettings.notifications`, a different model with a different, larger field set — see `settings.md` §1.8/§2.2 for the distinction).

### `GET /users`
Permission: `core.user.view`. Paginated — returns `meta`.

Query params: `page`, `limit`, `q` (matches first name / last name / email, case-insensitive), `status` (`invited|active|suspended|deactivated`), `departmentId`, `roleId`.

### `POST /users`
Permission: `core.user.create`. Invites a new user (no password is accepted from the client — one is generated and never surfaced; the user activates via the invite's reset-password email flow).

Request body:
```json
{
  "firstName": "Chidinma",
  "lastName": "Eze",
  "email": "chidinma.eze@pgsl.com",
  "roleIds": ["65f1a2b3c4d5e6f7a8b9c0a1"],
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "locationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "phoneNumber": "+234 802 555 1234"
}
```
`roleIds` defaults to `[]`; `departmentId`/`locationId`/`phoneNumber` all optional. (`jobTitle` is **not** accepted here — only on `PATCH /users/:id` after the fact, see below.)

Response `201`, `status: "invited"`, includes the new `userCode` (`USR-NNN`). Side effects: creates a 7-day password-reset token and emails an activation link; writes a `user.invited` audit log entry.

### `GET /users/:id`
Permission: `core.user.view`.

### `PATCH /users/:id`
Permission: `core.user.update`. Body (all optional): `firstName`, `lastName`, `avatarUrl` (must be a URL), `departmentId` (nullable), `locationId` (nullable), **`jobTitle`** (new, max 150 chars), **`phoneNumber`** (new). Does **not** allow changing `email`, `status`, or `roles` here — use the dedicated routes below for those.

### `POST /users/:id/status`
Permission: `core.user.suspend`. Sets status to `active`, `suspended`, or `deactivated`.

Request body:
```json
{ "status": "suspended", "reason": "Extended leave of absence" }
```
**`reason` is now conditionally required**: optional (and typically omitted) when `status: "active"`, but **required** (`422 VALIDATION_ERROR`, path `reason`, "Reason is required") when setting `suspended` or `deactivated` — enforced by a `superRefine` on `setUserStatusSchema` (`user.validation.ts`), not a plain `.optional()` on the field itself. Max 2000 chars either way. Setting to anything other than `active` revokes all of that user's refresh tokens. Guard rail: the last remaining active Super Admin cannot suspend/deactivate themselves (`409 CONFLICT`). Writes a `user.status.<status>` audit log entry with `{ status, reason }` in `after` — note `reason` is **only** ever persisted in this audit log entry, not as a field on the `User` document itself (there is no `statusReason` field on the model); to show "why was this user suspended" in the UI, read it from `GET /users/:id/audit-log` (below), not from the user object.

### `POST /users/:id/roles`
Permission: `core.user.update`. Replaces the user's full role list.

Request body: `{ "roleIds": ["65f1a2b3c4d5e6f7a8b9c0a1", "65f1a2b3c4d5e6f7a8b9c0a2"] }` (can be an empty array). All ids must reference existing roles or `422 VALIDATION_ERROR`.

### `POST /users/:id/send-password-reset`
Permission: `core.user.reset-password`. No body. Admin-triggered password reset for another user — issues a fresh reset token (60-minute TTL, shorter than the 7-day invite token and the 1-hour self-service `forgot-password` token) and emails it to the target user; does **not** email or return anything to the admin who triggered it. `data: null`, message `"Password reset link sent"`. Writes an `ActivityEvent` (`user.password_reset_sent`), **not** an `AuditLog` entry — see the audit-log route below and "Potential issues found."

### `POST /users/:id/resend-invite`
Permission: `core.user.resend-invite`. No body. Only valid while the target is still `status: "invited"` (`409 INVALID_STATE_TRANSITION`, "Only an invited user can have their invite resent", otherwise). Issues a fresh 7-day invite token and re-sends the activation email; any previous unused invite token for this user is left to go stale rather than being explicitly revoked (lookup is always by the token's own hash). Writes an `ActivityEvent` (`user.invite_resent`), **not** an `AuditLog` entry.

### `POST /users/:id/cancel-invite`
Permission: `core.user.cancel-invite`. Body: `{ "reason": "..." }`, required, 1–2000 chars. Only valid while `status: "invited"` (same `409 INVALID_STATE_TRANSITION` guard as resend-invite). **This hard-deletes the `User` document** — a deliberate, narrow exception to this project's general "never hard-delete" posture, justified because a never-activated invitee has logged in zero times and holds no downstream references (no task assignment, no approval history, nothing else in the system points at their `_id` yet), so there's nothing left dangling. Also deletes any pending `PasswordResetToken`s for that user. Writes an `ActivityEvent` (`user.invite_cancelled`), **not** an `AuditLog` entry, **before** the delete, carrying the reason in its label.

### `GET /users/:id/audit-log`
Permission: `core.auditlog.view` (not `core.user.view`). Paginated (`page`/`limit`, max 100), newest first. Backed by the shared `getAuditLogForTarget('User', id, page, limit)` helper (`src/modules/audit-logs/auditLog.service.ts`) — returns every `AuditLog` row whose `targetType: 'User'` and `targetId` match. In practice today that means only `user.invited` (written by `inviteUserHandler`) and `user.status.<status>` (written by `setUserStatusHandler`) — **`send-password-reset`, `resend-invite`, and `cancel-invite` all write to the separate `ActivityEvent` collection instead (see each route above), so none of them show up here.** See "Potential issues found." Each entry: `{ _id, actorId, action, targetType, targetId, ip, userAgent, before, after, at }`. The equivalent activity trail (which *does* include the three routes above) is `GET /activity/User/:id` (§9) — it has no permission gate beyond authentication, unlike this route.

---

## 4. Roles & Permissions — `/roles`, `/permissions`

All routes require authentication plus permission as noted.

**New fields on `Role` this phase** (`role.model.ts`): `roleCode` (server-generated, see Appendix), `department` (free text — see below), `modulePresets` (UI round-tripping only — see §4.1).

**`Role.department` is free text, not `ref Department`.** It may hold a real department name (as a plain string, not an id — there's no referential integrity to the `Department` collection at all) **or** one of two fixed pseudo-values, `ROLE_DEPARTMENT_SCOPES = ['System-wide', 'Cross-department']` (`role.model.ts`). These two pseudo-values exist because some roles (e.g. a cross-cutting "Auditor" role, or `super-admin` itself) aren't scoped to any single department, and there was nowhere else for that concept to live. The frontend should offer a dropdown of real department names plus these two literal strings — don't try to resolve this field as an id or populate it.

### `GET /roles`
Permission: `core.role.view`. Not paginated — returns the full list (`ok()`), sorted by name.

### `POST /roles`
Permission: `core.role.create`.

Request body — either fully custom, fully preset-driven, or a preset base layered with fine-grained additions (see §4.1 for how `modulePresets` expands):
```json
{
  "name": "Site Supervisor",
  "description": "Can manage attendance and deployments for their site",
  "department": "Human Resources",
  "permissions": ["hr.attendance.view", "hr.attendance.create", "hr.deployment.view"],
  "modulePresets": { "Human Resources": ["view", "create"] }
}
```
`name` (1–100 chars), `description` (1–500 chars), and **`department` are all now required** (1–100 chars; accepts either a real department name or `System-wide`/`Cross-department`). `permissions` and `modulePresets` are both optional, independent, and additive — the role's final `permissions` array is the deduplicated union of whatever `modulePresets` expands to (§4.1) plus whatever raw keys you list explicitly. Every raw key in `permissions` must exist in the permission catalogue (`422 VALIDATION_ERROR` naming the bad key, e.g. `permissions.2`); every module label used as a key inside `modulePresets` must be one of the 8 recognized UI module labels (`422 VALIDATION_ERROR` naming the bad label) and every action inside its array must be one of `view|create|approve|configure`. `slug` is auto-derived from `name` (slugified) and must be unique, else `409 CONFLICT`.

Response `201`:
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0a9",
    "roleCode": "ROL-014",
    "name": "Site Supervisor",
    "slug": "site-supervisor",
    "description": "Can manage attendance and deployments for their site",
    "department": "Human Resources",
    "permissions": ["hr.employee.view", "hr.employee.create", "hr.onboarding.view", "...", "hr.attendance.view", "hr.attendance.create", "hr.deployment.view"],
    "modulePresets": { "Human Resources": ["view", "create"] },
    "isSystem": false,
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
Note how `permissions` here is longer than just the three explicit keys sent — every `hr.*` key that classifies as `view` or `create` was added by the `modulePresets` expansion (§4.1).

### `GET /roles/:id`
Permission: `core.role.view`.

### `PATCH /roles/:id`
Permission: `core.role.update`. Body: `name`, `description`, `department`, `permissions`, `modulePresets` all optional. **System roles** (`isSystem: true`, e.g. `super-admin`) reject any attempt to change `name`, `permissions`, or `modulePresets` with `403 FORBIDDEN` (`description` and `department` can still be edited even on a system role).

Two different update behaviors depending on what you send (`role.service.ts`'s `updateRole`):
- **Send `modulePresets`:** `permissions` is **recomputed from scratch** from the new preset selection, with any `permissions` sent in the *same* request layered on top as additions. A preset change always wins over whatever `permissions` previously held.
- **Send `permissions` without `modulePresets`:** a straight replace of the array, the same contract this endpoint always had. `role.modulePresets` is left untouched and may now be stale relative to the real `permissions` array — that's treated as a UI-redraw concern only (so the Edit Role modal can still try to redraw checkbox state), not an enforcement one; `permissions` alone is what every `requirePermission()` check actually reads.

### `DELETE /roles/:id`
Permission: `core.role.delete`. Blocked (`403 FORBIDDEN`) for system roles, and blocked (`409 CONFLICT`) if any user still holds the role.

### `GET /roles/:id/audit-log`
Permission: `core.auditlog.view`. Paginated (`page`/`limit`, max 100), newest first. Same shared `getAuditLogForTarget('Role', id, page, limit)` helper the Users audit-log route uses (§3). Captures `role.created`, `role.updated` (with the full request body in `after` — including `modulePresets` if sent), and `role.deleted`.

### `GET /permissions`
Permission: `core.role.view`. Returns the static permission catalogue for building a permissions-picker UI. **Two new top-level fields this phase: `uiModules` and `uiActions`** — the module labels and the 4 action buckets the Roles & Permissions screen's checkbox grid uses (see §4.1):

```json
{
  "success": true,
  "message": null,
  "data": {
    "catalogue": {
      "core": {
        "user": ["view", "create", "update", "suspend", "export", "reset-password", "resend-invite", "cancel-invite"],
        "role": ["view", "create", "update", "delete"],
        "department": ["view", "create", "update", "deactivate", "activate"],
        "location": ["view", "create", "update"],
        "settings": ["view", "update"],
        "document": ["view", "create", "update", "delete", "approve", "reject", "checkout", "checkin", "archive", "restore", "export"],
        "task": ["view", "create", "update", "delete", "assign"],
        "notification": ["view"],
        "auditlog": ["view"]
      },
      "hr": { "...": "unchanged — see previous phase" }
    },
    "keys": ["core.user.view", "core.user.create", "...", "hr.reports.view"],
    "uiModules": ["Administration", "Human Resources", "Accounts & Finance", "Business Development", "Procurement", "Quality System", "HSE", "Technical"],
    "uiActions": ["view", "create", "approve", "configure"]
  }
}
```
Note: several permission actions listed in the catalogue (`core.user.export`, `core.document.export`, `hr.employee.export`) are **not currently wired to any route** — no export endpoint exists yet. Don't build UI that depends on them.

The catalogue also includes an `administration` block, a `businessdev` block, a `technical` block, a `procurement` block, an `hse` block, a `quality` block, a `finance` block, and a `dashboard` block (`{ overview: ['view'] }`) on the live endpoint — not shown in full above for brevity (unchanged from prior phases except `finance`, which is new — see `accounts-finance.md`). As with Platform Core's and HR's resources, several `*.export` keys across every module are not wired to any route either.

### 4.1 Permission presets — how a checkbox becomes real permission keys

The Roles & Permissions screen shows an **8-module × 4-action** checkbox grid (View / Create / Approve / Configure) — structurally nothing like the real, ~100-key, fine-grained `<module>.<resource>.<action>` catalogue above, which has no single "resource" dimension on screen and whose real per-resource verbs (`decide`, `transition`, `restock`, `verify`, `resolve`, `evaluate`, `send`, `archive`, `delete`, `update`, …) vary a lot by resource. `src/lib/permissionPresets.ts` is the translation layer that lets the UI stay a simple checkbox grid while the real permission system underneath stays exactly as fine-grained as it already was — the catalogue and every existing `requirePermission()` guard are completely untouched by this; `modulePresets` is purely a convenience that expands into the same `permissions` array a role would have anyway.

**The 8 module rows** (`UI_MODULE_TO_NAMESPACE`) map 1:1 onto 8 of the catalogue's top-level namespaces: `Administration → administration`, `Human Resources → hr`, `Accounts & Finance → finance`, `Business Development → businessdev`, `Procurement → procurement`, `Quality System → quality`, `HSE → hse`, `Technical → technical`. **`core` and `dashboard` are deliberately absent from this grid** — platform-level permissions (users, roles, settings, audit log) are never assignable through this per-business-module UI; there's no "Platform"/"System" row on screen at all. If a role needs `core.*` permissions, they must be granted via the raw `permissions` array, never via `modulePresets`.

**Expansion mechanism (`expandModulePreset`):** for a checked module + checked actions (e.g. `{ "Human Resources": ["view", "create"] }`), the function walks every resource in that module's namespace (`employee`, `onboarding`, `deployment`, …) and every real action each resource declares, and includes `<namespace>.<resource>.<action>` in the output if that action's **classification** matches one of the checked UI buckets. There's no per-resource table — classification is a single flat lookup by action *name*, applied identically across every module:

| Real action name(s) | UI bucket |
|---|---|
| `view` | View |
| `create` | Create |
| `decide`, `approve`, `reject`, `resolve`, `verify`, `evaluate`, `transition`, `restock`, `send`, `checkout`, `checkin`, `assign` | Approve |
| **everything else** (`update`, `delete`, `export`, `archive`, `suspend`, `deactivate`, `activate`, `decide-tier2`, `decide-tier3`, `reset-password`, `resend-invite`, `cancel-invite`, …) | **Configure** (the fallback bucket — `classifyAction` returns `'configure'` for any action name it doesn't explicitly recognize) |

So, concretely: checking **"Human Resources: Approve"** grants every `hr.*.decide`/`.verify`/`.evaluate`/`.resolve` key (leave decisions, onboarding verification, training evaluation, disciplinary case resolution) — but checking **"Human Resources: Configure"** is what actually grants `hr.employee.update`, `hr.employee.deactivate`, and every `hr.*.export` key, since `update`/`deactivate`/`export` aren't in the Approve bucket. See "Potential issues found" below for a sharper version of this mechanic that's easy to get wrong when wiring the Finance module specifically.

`expandModulePresets` (plural) just runs this per module label across the whole `{ "<Module>": [...actions] }` object the frontend posts and unions the results — this is what `POST /roles` and `PATCH /roles/:id` actually call.

---

## 5. Departments — `/departments`

All routes require authentication.

### `GET /departments`
Permission: `core.department.view`. Not paginated — full list, sorted by name.

### `POST /departments`
Permission: `core.department.create`.
```json
{
  "name": "Mechanical Engineering",
  "code": "MECH",
  "parentId": null,
  "headUserId": "65f1a2b3c4d5e6f7a8b9c0d1"
}
```
`code` is stored uppercased; must be unique (`409 CONFLICT` otherwise).

Response `201`:
```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0b1",
  "name": "Mechanical Engineering",
  "code": "MECH",
  "parentId": null,
  "headUserId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "isActive": true,
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```

### `GET /departments/:id`
Permission: `core.department.view`.

### `PATCH /departments/:id`
Permission: `core.department.update`. Body: all of the create fields optional, plus `isActive` (boolean) — see the overlap note in `settings.md`'s "Potential issues found" regarding this field and the two routes below.

**New this phase — `POST /departments/:id/activate` and `/:id/deactivate`**, each with their own dedicated permission (`core.department.activate`/`core.department.deactivate`). Documented in `settings.md` §4 alongside the rest of this phase's additions.

---

## 6. Locations — `/locations`

All routes require authentication.

### `GET /locations`
Permission: `core.location.view`. Not paginated — full list, sorted by name.

### `POST /locations`
Permission: `core.location.create`.
```json
{
  "name": "Lekki Site 4",
  "code": "LK4",
  "type": "site",
  "address": "Lekki Free Trade Zone, Lagos"
}
```
`type` is one of `LOCATION_TYPES`: `head_office`, `yard`, `site`, `warehouse`. `code` uppercased, unique (`409 CONFLICT` otherwise).

### `GET /locations/:id`
Permission: `core.location.view`.

### `PATCH /locations/:id`
Permission: `core.location.update`. Body: create fields optional, plus `isActive`.

---

## 7. Documents — `/documents`

All routes require authentication. This is a **two-tier** resource: `controlled: true` (the default) documents go through a full review/approval/checkout state machine; `controlled: false` ("simple library") documents skip review entirely, start life already `approved`, and can be replaced/deleted directly.

`DOCUMENT_STATUSES`: `draft`, `under_review`, `approved`, `checked_out`, `archived`.
`ACCESS_LEVELS`: `all_staff`, `department`.

### `GET /documents`
Permission: `core.document.view`. Paginated.

Query: `page`, `limit`, `q` (full-text search against `title`), `module`, `departmentId`, `category`, `status`, `controlled` (boolean).

### `GET /documents/stats`
Permission: `core.document.view`. **Not paginated** (`ok()`). Optional `?module=` filter.
```json
{
  "data": [
    { "key": "total_documents", "label": "Total Documents", "value": 212 },
    { "key": "under_review", "label": "Under Review", "value": 14 },
    { "key": "approved", "label": "Approved", "value": 180 },
    { "key": "archived", "label": "Archived", "value": 18 }
  ]
}
```

### `POST /documents`
Permission: `core.document.create`. `multipart/form-data`, field `file` + body fields:
```json
{
  "title": "Site Safety Policy",
  "module": "hr",
  "category": "Policy",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "controlled": true,
  "accessLevel": "all_staff",
  "description": "Mandatory PPE and safety induction policy"
}
```
`module` is lower-cased; `controlled` defaults `true`; `accessLevel` defaults `all_staff`.

Response `201`:
```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0e1",
  "docNo": "HR-001",
  "title": "Site Safety Policy",
  "module": "hr",
  "category": "Policy",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "controlled": true,
  "version": "V1.0",
  "status": "draft",
  "accessLevel": "all_staff",
  "uploadedBy": "65f1a2b3c4d5e6f7a8b9c0d1",
  "checkedOutBy": null,
  "currentFileId": "65f1a2b3c4d5e6f7a8b9c0f1",
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
`docNo` is generated as `<MODULE>-<NNN>` (e.g. `HR-001`), permanent (never resets). A `controlled: false` upload starts directly at `status: "approved"`. Also writes the first `DocumentRevision` (revisionNo 1, "Initial issue") and a `document.uploaded` activity event.

### `GET /documents/:id`
Permission: `core.document.view`. Logs a `VIEWED` access-log entry (deduped — repeated views within 1 second by the same user don't create duplicate rows).

### `PATCH /documents/:id`
Permission: `core.document.update`. Body (all optional): `title`, `category`, `departmentId`, `accessLevel`, `description`. For a **controlled** document this is only allowed while `status: "draft"` (`409 INVALID_STATE_TRANSITION` otherwise). A **simple**-tier document can have its metadata edited at any time.

### `GET /documents/:id/revisions`
Permission: `core.document.view`. **Not paginated** — full revision history, newest first.
```json
{ "data": [{ "_id": "...", "documentId": "...", "revisionNo": 2, "versionLabel": "V2.0", "note": "Updated after site audit", "changedBy": "...", "fileId": "...", "createdAt": "..." }] }
```

### `GET /documents/:id/access-log`
Permission: `core.document.view`. Paginated (`page`/`limit`, max 100). Entries are `{ documentId, userId, action, at }` where `action` is one of `VIEWED`, `DOWNLOADED`, `CHECKED-OUT`, `CHECKED-IN`.

### `POST /documents/:id/versions`
Permission: `core.document.update`. `multipart/form-data`, field `file` + optional `note` (string, max 1000 chars). For a controlled document, only allowed while `approved` or `checked_out`; if `checked_out`, only the user who checked it out may upload (`403 FORBIDDEN` otherwise). Bumps `version` to the next `V{n}.0`, writes a new `DocumentRevision`, and (for controlled docs) resets status back to `approved` and clears `checkedOutBy`.

### `GET /documents/:id/download`
Permission: `core.document.view`. Returns a presigned download URL — **does not stream the file itself**.
```json
{ "data": { "url": "https://<bucket>.r2.cloudflarestorage.com/document/....pdf?X-Amz-...", "filename": "site-safety-policy.pdf" } }
```
Logs a `DOWNLOADED` access-log entry.

### `POST /documents/:id/submit`
Permission: `core.document.update`. `draft → under_review`. No body.

### `POST /documents/:id/approve`
Permission: `core.document.approve`. `under_review → approved`. No body. Notifies the uploader.

### `POST /documents/:id/reject`
Permission: `core.document.reject`. `under_review → draft`.
```json
{ "reason": "Missing sign-off from the Safety Officer" }
```
Notifies the uploader with the reason.

### `POST /documents/:id/checkout`
Permission: `core.document.checkout`. `approved → checked_out`, locked to the calling user. If already checked out by anyone, `423 RESOURCE_LOCKED`.

### `POST /documents/:id/checkin`
Permission: `core.document.checkin`. `checked_out → approved`. Only the user who checked it out may check it back in (`403 FORBIDDEN` otherwise).

### `POST /documents/:id/archive`
Permission: `core.document.archive`. `approved → archived`.

### `POST /documents/:id/restore`
Permission: `core.document.restore`. `archived → approved`.

### `PUT /documents/:id/file`
Permission: `core.document.update`. `multipart/form-data`, field `file`. **Simple-tier only** — calling this on a `controlled: true` document returns `409 INVALID_STATE_TRANSITION`. Internally behaves like uploading a new version ("Replaced" note).

### `DELETE /documents/:id`
Permission: `core.document.delete`. **Simple-tier only** — `409 INVALID_STATE_TRANSITION` for controlled documents. Hard-deletes the document and all of its revisions.

---

## 8. Tasks — `/tasks`

All routes require authentication. `TASK_STATUSES`: `todo`, `in_progress`, `done`. `TASK_PRIORITIES`: `low`, `medium`, `high`, `hot`. `TASK_SOURCES`: `manual` (created via this HTTP API), `system` (created internally by other modules, e.g. onboarding checklists — there is no HTTP route to create a `system` task directly).

### `GET /tasks`
Permission: `core.task.view`. Paginated. Each item in `data` has a computed `isOverdue` boolean merged in (true when `status !== 'done'` and `dueDate` is in the past) — this is **not** a stored field.

Query: `page`, `limit`, `module`, `status`, `priority`, `assignee` (ObjectId), `relatedTo` (free text), `overdue` (boolean — forces `status != done` AND `dueDate < now`), `dueThisWeek` (boolean — forces `status != done` AND `dueDate` within the current business week), `sort` (`dueDate|priority|createdAt`, default `dueDate`), `order` (`asc|desc`, default `desc`).

### `GET /tasks/stats`
Permission: `core.task.view`. **Not paginated.** Optional `?module=`.
```json
{
  "data": [
    { "key": "total_tasks", "label": "Total Tasks", "value": 58, "qualifier": "All assigned activities" },
    { "key": "in_progress", "label": "In Progress", "value": 12, "qualifier": "" },
    { "key": "due_this_week", "label": "Due This Week", "value": 7, "qualifier": "" },
    { "key": "overdue_tasks", "label": "Overdue Tasks", "value": 3, "qualifier": "Past due date" }
  ]
}
```

### `GET /tasks/board`
Permission: `core.task.view`. **Not paginated.** Optional `?module=`. Returns all tasks grouped by status for a kanban view:
```json
{ "data": { "todo": [ { "...task": "...", "isOverdue": false } ], "in_progress": [], "done": [] } }
```

### `POST /tasks`
Permission: `core.task.create`. This is the only HTTP-reachable way to create a task — it always creates `source: "manual"`.
```json
{
  "title": "Inspect crane rigging before Monday handover",
  "module": "hr",
  "relatedTo": "Employee Onboarding",
  "assigneeId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "priority": "high",
  "startDate": "2026-10-04",
  "dueDate": "2026-10-06",
  "description": "Confirm rigging certificate is current before site release"
}
```
`priority` defaults `medium`. `assigneeId` must reference an existing, `active` user (`422 VALIDATION_ERROR` otherwise). `startDate` must be ≤ `dueDate` if both given.

Response `201`:
```json
{
  "_id": "65f1a2b3c4d5e6f7a8b9c0f9",
  "taskNo": "HR-TSK-001",
  "title": "Inspect crane rigging before Monday handover",
  "module": "hr",
  "relatedTo": "Employee Onboarding",
  "assigneeId": "65f1a2b3c4d5e6f7a8b9c0d1",
  "priority": "high",
  "startDate": "2026-10-04T00:00:00.000Z",
  "dueDate": "2026-10-06T00:00:00.000Z",
  "status": "todo",
  "createdBy": "65f1a2b3c4d5e6f7a8b9c0d2",
  "source": "manual",
  "createdAt": "2026-10-03T09:00:00.000Z",
  "updatedAt": "2026-10-03T09:00:00.000Z"
}
```
`taskNo` is generated as `<MODULE>-TSK-<NNN>` and never resets. If the assignee isn't the creator, they're notified.

### `GET /tasks/:id`
Permission: `core.task.view`. Includes the computed `isOverdue` field.

### `PATCH /tasks/:id`
Permission: `core.task.update`. Body (all optional): `title`, `relatedTo`, `assigneeId`, `priority`, `startDate`, `dueDate`, `description`. (`module` cannot be changed.)

### `POST /tasks/:id/status`
Permission: `core.task.update`.
```json
{ "status": "in_progress" }
```
No restricted transition map — any of the three statuses can follow any other. No-op if the status is unchanged (still returns `200`). Notifies the task's creator if someone else changed it.

### `POST /tasks/:id/attachments`
Permission: `core.task.update`. `multipart/form-data`, field `file`. Returns the created `Attachment` (`201`), linked to this task via `subjectType: "Task"`.

### `DELETE /tasks/:id/attachments/:attachmentId`
Permission: `core.task.update`. Deletes the attachment (both the DB record and the stored object).

---

## 9. Activity — `/activity`

Read-only append log of every workflow transition system-wide. All routes require authentication only — **no extra permission string is required** (this is intentional in the source; there's no `core.auditlog.view`-style gate here, since `ActivityEvent` is considered lower-sensitivity than the formal `AuditLog`). **Update:** the formal `AuditLog` collection now does have two HTTP endpoints as of this phase — `GET /users/:id/audit-log` and `GET /roles/:id/audit-log` (§3, §4), both gated by `core.auditlog.view`, both backed by the shared `getAuditLogForTarget()` helper (`src/modules/audit-logs/auditLog.service.ts`). There is still no general `GET /audit-logs` across every target — only these two per-resource routes exist, and (per the issues noted in §3) not every user/role action is actually written to `AuditLog` rather than `ActivityEvent`, so the two logs are not interchangeable views of the same events.

### `GET /activity`
Paginated (`page`, `limit`, max 100). Returns the most recent events across every module.
```json
{
  "data": [
    {
      "_id": "...",
      "subjectType": "LeaveRequest",
      "subjectId": "...",
      "subjectRef": "LV-2026-0012",
      "action": "leave.approved",
      "label": "Leave request approved",
      "actorId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "fromStatus": "pending",
      "toStatus": "approved",
      "occurredAt": "2026-10-03T09:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 940, "totalPages": 47 }
}
```

### `GET /activity/:subjectType/:subjectId`
Paginated. Timeline for one specific record, e.g. `GET /activity/Document/65f1a2b3c4d5e6f7a8b9c0e1` or `GET /activity/Employee/65f1a2b3c4d5e6f7a8b9c0d5`. `subjectType` is a free string matched exactly against what each module recorded (`Document`, `Task`, `Employee`, `Deployment`, `JobPosting`, `Candidate`, `TrainingProgram`, `TrainingParticipant`, `LeaveRequest`, `AttendanceRecord`, `PayrollRun`, `DisciplinaryCase`, `OnboardingCase`, `Asset`, `AdministrativeRequest`, `TravelRequest`, `Movement`, `Disposal`, `Tender`, `Rfq`, etc.) — there's no enum validating it, an unknown value just returns an empty page.

---

## 10. Notifications — `/notifications`

Per-user notification inbox. All routes require authentication only (notifications are always scoped to `req.user.sub` — there's no permission gate because you can only ever see your own).

### `GET /notifications`
Paginated. Query: `page`, `limit` (max 100), `unread` (`"true"` to filter to unread only).
```json
{
  "data": [
    {
      "_id": "...",
      "userId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "type": "leave.approved",
      "title": "Leave approved",
      "body": "Your leave request LV-2026-0012 has been approved",
      "subjectType": "LeaveRequest",
      "subjectId": "...",
      "readAt": null,
      "createdAt": "2026-10-03T09:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 6, "totalPages": 1 }
}
```

### `GET /notifications/unread-count`
**Not paginated.** `{ "data": { "count": 3 } }`

### `POST /notifications/:id/read`
Marks one notification as read for the current user. `data: null`.

### `POST /notifications/read-all`
Marks every unread notification for the current user as read. `data: null`.

---

## Appendix: reference-code formats (Platform Core)

| Entity | Format | Resets yearly? |
|---|---|---|
| Document.docNo | `<MODULE>-NNN` | No |
| Task.taskNo | `<MODULE>-TSK-NNN` | No |
| User.userCode | `USR-NNN` | No |
| Role.roleCode | `ROL-NNN` | No |

All counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide. See `hr.md`, `administration.md`, `business-dev.md`, and `settings.md` for each other module's own reference-code rows (Legal Entity has no code at all — see `settings.md` §3).

---

## Potential issues found

This section covers Auth/Users/Roles/the shared RBAC middleware — the areas read for this phase. See `settings.md`'s own "Potential issues found" for Settings/Legal Entities/Departments.

1. **Checking "Approve" on the Accounts & Finance module row does not grant the tier-2/tier-3 FinanceForm decision permissions — only tier 1.** `ACTION_BUCKETS` in `src/lib/permissionPresets.ts` (lines 43–58) maps the literal action name `decide` to the Approve bucket, but has no entries for `decide-tier2` or `decide-tier3`. Since `classifyAction` does an exact-string lookup with a `?? 'configure'` fallback (line 61), both tiered keys silently fall into the **Configure** bucket instead. Concretely: an admin who checks only "Accounts & Finance: Approve" in the Roles & Permissions UI grants `finance.financeform.decide` (and every other module resource's `decide`-named action) but **not** `finance.financeform.decide-tier2`/`.decide-tier3` — those only get granted if "Accounts & Finance: Configure" is also checked, which *also* pulls in every `update`/`delete`/`export` key for every finance resource (accounts, budgets, journal entries, contracts, etc.), a much broader grant than the admin likely intended just to give someone tier-2/3 sign-off authority. There is no way, through the preset UI alone, to grant exactly "all three FinanceForm decide tiers and nothing else wider" — that requires falling back to the raw `permissions` array.

2. **The same gap applies to every other action name not in `ACTION_BUCKETS`'s literal list** — `update`, `delete`, `export`, `archive`, and (outside the 8 UI modules) `suspend`/`deactivate`/`activate`/`reset-password`/`resend-invite`/`cancel-invite` all fall into Configure by the same fallback, not because they were deliberately classified there but because the lookup table simply doesn't mention them. This is very likely intentional (the code comment says unrecognized actions default to the broadest bucket rather than silently granting nothing), but it means "Configure" is a much larger catch-all than its name suggests on first read — it's worth confirming with whoever owns the Roles & Permissions screen that bucketing `delete` under the same checkbox as "update company settings" is the intended mental model before building the UI copy/tooltips around it.

3. **`GET /users/:id/audit-log` and `GET /roles/:id/audit-log` only surface actions that were written via `writeAuditLog()` — not the three new user-lifecycle actions added this phase.** `POST /users/:id/send-password-reset`, `/resend-invite`, and `/cancel-invite` (§3) all call `recordActivity()` (writing to the separate `ActivityEvent` collection, surfaced at `GET /activity/User/:id`) instead of `writeAuditLog()`. A frontend "Audit Log" tab built only against `/users/:id/audit-log` will never show these three actions — they only appear in the Activity feed, which (per §9) has no permission gate at all, unlike the audit-log route. Confirm whether this split is intentional (Activity = lower-sensitivity, as the existing doc text claims) or whether these three admin actions were meant to land in the stricter `AuditLog` collection instead, given they're gated by dedicated new permissions (`core.user.reset-password`/`resend-invite`/`cancel-invite`) that imply a higher sensitivity than ordinary Activity events.

4. **`requireAnyPermission` has exactly one consumer (`finance-forms`) and no equivalent "any of N" expression exists anywhere else in this phase's own new routes**, even though Roles & Permissions' own preset system (§4.1) introduces a similar "tiered, tagged by name" pattern (`decide`/`decide-tier2`/`decide-tier3`). Not a bug — just worth knowing there is currently no generic way to query "does this role's permission set satisfy tier N" other than the bespoke `assertCanDecideTier` logic inside `financeForm.service.ts`; nothing in Platform Core itself exposes that check for other modules to reuse if a second tiered-approval resource is built later.

5. **`otpToken.model.ts`'s `mfaTokenHash` has a `unique: true` index**, which is correct for normal operation (one pending OTP session per issued token), but means that in the astronomically unlikely event of a SHA-256 collision between two different raw `mfaToken`s issued around the same time, the second `OtpToken.create()` call in `issueOtp` would throw an unhandled Mongo duplicate-key error rather than a clean `AppError` — this is a theoretical note, not a practical risk, included only because it's the one place in the OTP flow without an explicit try/catch around the insert.
