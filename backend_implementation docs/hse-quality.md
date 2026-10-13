# PGSL ERP — HSE + Quality System API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

HSE + Quality System is the eighth phase, sitting downstream of HR (Employee, Department), Technical (CalibrationRecord), Procurement (GoodsReceiptNote, Vendor), and Business Dev (Client). The static permission catalogue returned by `GET /permissions` (see Platform Core's Roles & Permissions section) gains two new blocks: `hse` (`offshoretraveldocument`, `emergencyplan`, `emergencycontact`, `reports`) and `quality` (`audit`, `calibrationrecord`, `goodsreceipt`, `reports`). **As with Procurement's own catalogue, none of these eight new permission keys are dead** — every action declared for every resource in both blocks is checked by at least one route, and every route's permission string exists in the catalogue (verified route-by-route below). Note the `quality` block names its own audit resource `audit`, not `qualityaudit` — the same shortening convention Procurement already applied to `goodsreceipt` (not `goodsreceiptnote`) and Administration to `adminrequest` (not `administrativerequest`): the module prefix already disambiguates it, so the resource name doesn't repeat it.

**Nav-label drift — don't navigate by sidebar text alone.** `OffshoreTravelDocument`'s sidebar label drifts between **"Off-Shore Travel Documents"** and **"Training & Certificates"** across otherwise-identical captures of the same screen. Both labels point at the same entity and the same route (`/offshore-travel-documents` below) — this implementation deliberately models only the narrower offshore-certification concept the screens actually show (certificate number, issuing body, issue/expiry dates), **not** a general training record (course name, trainer, score, pass/fail) that the "Training & Certificates" label would imply but that no screen ever designed. If the frontend is building against a nav item labelled "Training & Certificates," it's this same API — don't expect a broader training-log shape to show up later.

**"Safety Drills" has no backing entity anywhere in this API — don't build toward it.** Three independent traces exist in the originating designs (a nav-label that alternates with "Safety Drills," a Contact Register search placeholder reading "Search Drill Id, Type…", and one Emergency Plan record showing a stray `DRL-25-01` code), but no screen anywhere shows an actual drill log, list, or create form. This was read as leftover Figma drift during a design pass that got cut, not a hidden entity to reconstruct from traces alone. There is no drill-related field on any model in this module and no route anywhere answers to it.

**Two other expected HSE/QMS concepts are also absent, confirmed as genuine gaps rather than oversights:** an **Incident/Accident Report** entity (the single most expected HSE concept under any working hypothesis — no screen, nav item, or field exists for it anywhere) and a structured **Non-Conformance Report (NCR) / Corrective Action Request (CAR)** workflow (both appear only as document *titles* in the QMS Documents sample list, never as entities with their own status or corrective-action chain). A **PPE register** is also absent — `PPE` only ever appears as one closed `category` value on Procurement's own `PurchaseRequisition` (`procurement.md` §1); there is no HSE-owned PPE issuance/inspection screen. Don't build UI around any of the three expecting backend support.

**`CalibrationRecord` and `GoodsReceiptNote` are not new entities introduced by this phase.** They belong to Technical Unit (`technical.md` §8) and Procurement (`procurement.md` §5) respectively, and this phase did not fork, copy, or re-implement either collection. What this phase adds is a **second, Quality-scoped set of routes** onto the exact same two collections — confirmed, before implementation, as the resolution for Quality System's own sidebar entries ("Calibration Records" and "Materials Inspection") that the design evidence showed pointing at identical sample data to Technical's/Procurement's own screens. See §7/§8 below for the Quality-side routes; see `technical.md` §8 and `procurement.md` §5 for the entities themselves — this file does not restate either one's fields, statuses, or business rules.

---

## Changes since the production review (read this first)

- **A failed goods inspection** (Quality System's view of the goods-receipt collection) now flags the vendor, holds payment of open vendor invoices on that order and raises a follow-up task for the buyer; see `procurement.md`.
- **Document and audit behaviour:** controlled documents cannot be approved by the person who uploaded them. Quality audit overdue sweeps compare calendar dates in Lagos (an audit goes overdue the day after its end date). The audit model has no pass or fail outcome, so a failed quality audit does not yet change a vendor's status.

---

## 1. Offshore Travel Documents — `/offshore-travel-documents`

All routes require authentication. `OFFSHORE_DOCUMENT_STATUSES`: `pending_verification`, `valid`, `expiring_soon`, `expired`, `rejected`. `OFFSHORE_DOCUMENT_TYPES`: `BOSIET`, `Offshore Safety Permit (OSP)`, `Offshore Safety Training Certificate`.

**`expiring_soon`/`expired` are date-driven, recomputed states, not directly settable** — `deriveStatusFromExpiry` compares `expiryDate` against now (and a 30-day lookahead for `expiring_soon`) for any document currently `valid`, `expiring_soon`, or `expired`; it never touches a document that's `pending_verification` or `rejected`. The 30-day `expiring_soon` window is an **ASSUMED** threshold — the evidenced compliance banner only shows an "N certificates expired" count, not a specific lead time for the warning state (the same category of gap as Technical Unit's own 14-day `due_soon` window for `CalibrationRecord`, `technical.md` §8).

**`rejected` is deliberately not terminal.** Unlike almost every other negative-terminal status in this system, a rejected document can come back via `POST /:id/renew`, which always resets it to `pending_verification` — per the verbatim confirm-dialog copy evidencing that a rejected employee "will be required to upload a valid replacement." `reject` → `renew` → (`verify` or `reject` again) is a real loop, not a one-shot dead end.

**`verify` is an INFERRED route** — no "Verify"/"Approve Document" confirm dialog was ever captured in the design evidence, only "Reject." It is nonetheless the only way to leave `pending_verification` other than rejection, so it had to be built; treat it as real, implemented behavior.

**`POST /:id/renew` is blocked from `pending_verification`** (`409 INVALID_STATE_TRANSITION`, "A document awaiting its first verification cannot be renewed") — a document still awaiting its first decision has nothing to renew yet. It's callable from every other status (`valid`, `expiring_soon`, `expired`, `rejected`), always overwriting `certificateNo`/`issueDate`/`expiryDate` and resetting to `pending_verification`.

**`renew` is gated by `.update`, not `.decide`** — `verify`/`reject` both require `hse.offshoretraveldocument.decide`; `renew` only requires `hse.offshoretraveldocument.update`, the same permission as the plain metadata `PATCH`. This is deliberate, mirroring Procurement Requisition's reasoning that "submitting your own draft is not itself a decision" (`procurement.md` §1) — resubmitting a renewed certificate isn't categorized as a decision either, only the verify/reject outcome is.

### `GET /offshore-travel-documents`
Permission: `hse.offshoretraveldocument.view`. Paginated, sorted by `expiryDate` ascending. Query: `page`, `limit`, `status`, `employeeId`, `departmentId`, `documentType` — all four filters are actually wired into the list query, not just declared.

### `GET /offshore-travel-documents/stats`
Permission: `hse.offshoretraveldocument.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "pending_verification", "label": "Pending Verification", "value": 4 },
    { "key": "expiring_soon", "label": "Expiring Soon", "value": 6 },
    { "key": "expired", "label": "Expired", "value": 3 },
    { "key": "valid", "label": "Valid", "value": 112 },
    { "key": "rejected", "label": "Rejected", "value": 2 }
  ]
}
```

### `POST /offshore-travel-documents`
Permission: `hse.offshoretraveldocument.create`.
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "documentType": "BOSIET",
  "certificateNo": "BOSIET-2026-004471",
  "issuingBody": "OPITO",
  "issueDate": "2026-01-10",
  "expiryDate": "2027-01-10"
}
```
All six fields required. **`issueDate` must be ≤ `expiryDate`** (`422 VALIDATION_ERROR`, field `issueDate`, otherwise) — the same ordering rule Technical's Project/WBS enforce (`technical.md` §1/§2), checked server-side on create, `PATCH`, and `renew` alike.

Response `201`, `status: "pending_verification"` always. **No PGSL-generated reference code** — only the Mongo `_id`; `certificateNo` is an external, vendor/body-issued value PGSL never generates (see Appendix).

### `GET /offshore-travel-documents/:id`
Permission: `hse.offshoretraveldocument.view`.

### `PATCH /offshore-travel-documents/:id`
Permission: `hse.offshoretraveldocument.update`. Same six fields as create, all optional — nothing on this entity is immutable via `PATCH` (including `employeeId`/`departmentId`). Only while `status: "pending_verification"` (`409 INVALID_STATE_TRANSITION`, "Only a document pending verification can be edited", otherwise).

### `POST /offshore-travel-documents/:id/verify`
Permission: `hse.offshoretraveldocument.decide`. No body. Only from `pending_verification` (`409 INVALID_STATE_TRANSITION`, "Only a document pending verification can be verified", otherwise). Sets status via the same expiry-derivation rule used by the sweep — a document whose `expiryDate` already falls inside the 30-day window is verified straight into `expiring_soon` (or even `expired`), not unconditionally into `valid`.

### `POST /offshore-travel-documents/:id/reject`
Permission: `hse.offshoretraveldocument.decide`.
```json
{ "reason": "Certificate does not match the employee's BOSIET training record on file" }
```
`reason` required, 1–2000 chars. Only from `pending_verification`.

### `POST /offshore-travel-documents/:id/renew`
Permission: `hse.offshoretraveldocument.update` (see note above — **not** `.decide`).
```json
{
  "certificateNo": "BOSIET-2026-009981",
  "issueDate": "2026-11-01",
  "expiryDate": "2029-11-01"
}
```
All three fields required, `issueDate ≤ expiryDate` enforced. Blocked from `pending_verification` (see note above). Always resets `status: "pending_verification"` and clears `rejectionReason`.

**There is no `DELETE` for this entity.**

---

## 2. Emergency Plans — `/emergency-plans`

All routes require authentication. `EMERGENCY_PLAN_STATUSES`: `active`, `under_review`, `archived`.

**`under_review` now has a real entry path.** No screen ever evidenced one (the spec's own gap note), so `POST /:id/mark-under-review` was added to complete the status this schema already declared — `active → under_review` (`409 INVALID_STATE_TRANSITION`, "Only an active plan can be marked under review", otherwise). `markEmergencyPlanActive` remains gated to only fire **from** `under_review`, and is now actually reachable: `mark-under-review` then `mark-active`.

**`replace` is a versioned revision, not an edit-in-place.** It requires a `reason` and a new `file`, increments `version` by 1, and is only callable while `status: "active"` (`409 INVALID_STATE_TRANSITION`, "Only an active plan can be replaced", otherwise) — the same revision-pattern reasoning Platform Core's own `Document` uses for its versioned uploads (`platform-core.md` §7), kept as a separate action from the plain metadata `PATCH`.

**`reviewDate` drives no automatic sweep, but is now surfaced on the stats tile** (`due_for_review`, below) — no cron job recomputes a derived status from it (no "review due soon" state exists on the entity), but the stats endpoint counts active plans whose `reviewDate` has already passed, so a dashboard can at least flag them without the frontend filtering the raw list client-side.

### `GET /emergency-plans`
Permission: `hse.emergencyplan.view`. Paginated, sorted by `planName` ascending. Query: `page`, `limit`, `status`, `planCategory`, `location`.

### `GET /emergency-plans/stats`
Permission: `hse.emergencyplan.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "active", "label": "Active", "value": 14 },
    { "key": "under_review", "label": "Under Review", "value": 1 },
    { "key": "archived", "label": "Archived", "value": 2 },
    { "key": "due_for_review", "label": "Due for Review", "value": 3 }
  ]
}
```
`due_for_review` counts `active` plans whose `reviewDate` has already passed — a derived tile, not a stored status (see the `reviewDate` note above).

### `POST /emergency-plans`
Permission: `hse.emergencyplan.create`. `multipart/form-data`, field `file` + body fields:
```json
{
  "planCategory": "Fire Emergency",
  "planName": "Site-Wide Fire Evacuation Plan — Lekki Yard",
  "planOwnerId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "reviewDate": "2027-03-01",
  "location": "65f1a2b3c4d5e6f7a8b9c0b9",
  "description": "Primary evacuation and muster-point plan for the Lekki fabrication yard"
}
```
`planCategory`, `planName`, `planOwnerId` (ref Employee), `reviewDate`, `location` (ref Location) required; `description` optional. `planOwnerId` is always taken directly from the body — there is no actor-fallback resolution (it names a distinct accountable role, not the uploader, the same category of field as Procurement's `VendorPrequalification.evaluatorId`).

Response `201`: `planId: "ERP-0001"` (permanent, never resets — see Appendix), `version: 1`, `status: "active"` always. Also writes the first `Attachment` (`subjectType: "EmergencyPlan"`).

### `GET /emergency-plans/:id`
Permission: `hse.emergencyplan.view`.

### `PATCH /emergency-plans/:id`
Permission: `hse.emergencyplan.update`. Same fields as create, all optional. **No status precondition at all** — callable regardless of current status, including `archived`.

### `POST /emergency-plans/:id/replace`
Permission: `hse.emergencyplan.update`. `multipart/form-data`, field `file` + body:
```json
{ "reason": "Updated muster point locations following the Q3 site layout change" }
```
`reason` required, 1–2000 chars. Only while `status: "active"` (see note above). Bumps `version` (e.g. `1 → 2`), writes a new `Attachment`, status unchanged.

### `POST /emergency-plans/:id/archive`
Permission: `hse.emergencyplan.update`.
```json
{ "reason": "Superseded by the revised Site-Wide Fire Evacuation Plan v3" }
```
`reason` required, 1–2000 chars. Only from `active` (`409 INVALID_STATE_TRANSITION`, "Only an active plan can be archived", otherwise).

### `POST /emergency-plans/:id/mark-under-review`
Permission: `hse.emergencyplan.update`. No body. Only from `active` (`409 INVALID_STATE_TRANSITION`, "Only an active plan can be marked under review", otherwise) — the added entry path, see note above.

### `POST /emergency-plans/:id/mark-active`
Permission: `hse.emergencyplan.update`. No body. Only from `under_review` (`409 INVALID_STATE_TRANSITION`, "Only a plan under review can be marked active", otherwise) — now reachable via `mark-under-review` first.

**There is no `DELETE` for this entity.**

---

## 3. Emergency Contacts — `/emergency-contacts`

All routes require authentication. **Pure CRUD reference register — no status field, no workflow.** The only new entity in this module with a real `DELETE` route.

### `GET /emergency-contacts`
Permission: `hse.emergencycontact.view`. Paginated, sorted by `contactName` ascending. Query: `page`, `limit`, `contactType`, `location`.

### `POST /emergency-contacts`
Permission: `hse.emergencycontact.create`.
```json
{
  "contactName": "Lagos State Fire Service — Lekki Division",
  "organisation": "Lagos State Fire Service",
  "contactType": "Fire Service",
  "role": "Emergency Response",
  "phone": "+2347000000000",
  "email": "lekki@lasfs.gov.ng",
  "location": "65f1a2b3c4d5e6f7a8b9c0b9"
}
```
`contactName`, `organisation`, `contactType`, `role`, `phone`, `location` (ref Location) required; `email` optional. `contactType` is free text, not an enum — no fixed list of contact types is validated server-side.

Response `201`. **No stats endpoint and no PGSL-generated reference code** for this entity — identified only by Mongo `_id`, the same "plain reference register" posture Technical Unit applies to nothing comparable (this is the first pure-CRUD-no-code register in the system's HSE/Quality surface).

### `GET /emergency-contacts/:id`
Permission: `hse.emergencycontact.view`.

### `PATCH /emergency-contacts/:id`
Permission: `hse.emergencycontact.update`. Same fields as create, all optional. No status to guard against — always editable.

### `DELETE /emergency-contacts/:id`
Permission: `hse.emergencycontact.delete`. Hard delete, no precondition.

---

## 4. Quality Audits — `/quality-audits`

All routes require authentication. `QUALITY_AUDIT_STATUSES`: `scheduled`, `in_progress`, `completed`, `closed`, `overdue`. `QUALITY_AUDIT_TYPES`: `Internal Quality Audit`, `External Client Audit`, `Supplier/Vendor Audit`, `ISO Audit`.

**`relatedVendorId`/`relatedClientId` were added beyond the evidenced form fields specifically so a `Supplier/Vendor Audit` or `External Client Audit` could be linked to which external party it concerns** — the same reasoning already used for `Project.relatedTenderId`/`relatedOpportunityId` (`technical.md` §1). Both are real list filters on `GET /quality-audits` (see below), along with `leadAuditorId`.

**`relatedVendorId` must reference an `active` Vendor** — `scheduleQualityAudit`/`updateQualityAudit` both call the same `assertVendorActive` guard Procurement's RFQ/PO creation uses (`procurement.md` §2/§3): `404 NOT_FOUND` if the vendor doesn't exist, `422 VALIDATION_ERROR` if it exists but isn't `active`. `relatedClientId` is only checked for existence (`404 NOT_FOUND` otherwise) — a Client's `archived` status doesn't block it, since an audit is a historical compliance record and an archived client's past audits remain legitimately referenceable. Neither field is cross-checked against `auditType` — you can set `relatedVendorId` on an `Internal Quality Audit` and it will be accepted.

**`startDate` must be ≤ `endDate`** (`422 VALIDATION_ERROR`, field `startDate`, otherwise) — checked on create, `PATCH`, and `reschedule` alike, the same ordering rule Technical's Project/WBS enforce.

**Status machine is `scheduled → in_progress → completed → closed`, with `overdue` as a date-driven side-state, not a manual one** — a daily sweep (see §9/scheduler below) flips any `scheduled` audit whose `startDate` has passed into `overdue`. From `overdue`, the only two ways forward are `start` (treats `overdue` as equivalent to `scheduled` for this purpose — same target `in_progress`) or `reschedule` (back to `scheduled` with new dates). **`reschedule` only works from `overdue`** — you cannot reschedule a still-`scheduled` audit that simply needs its dates pushed before it ever lapses; the only way to change dates on a not-yet-overdue audit is the plain `PATCH` (also allowed from `scheduled`/`overdue`, per `assertEditable`).

**`upload-report` is a distinct, status-gated action from `complete`**, not a side effect of it — only callable once `status: "completed"` (`409 INVALID_STATE_TRANSITION`, "A report can only be uploaded once the audit is completed", otherwise), per two contrasting View Audit captures of the same record showing completing the audit and attaching its findings as two separate steps. **It returns `201 Created`** (the controller calls `created()`) even though it's mutating an existing audit document, not creating a new resource — the same "upsert-but-201" quirk `procurement.md` §2 already notes for `POST /procurement-rfqs/:id/vendor-responses`.

**`closeQualityAudit` requires `reportAttached === true` — this is this implementation's own resolution of a genuinely unresolved transition, not a captured design rule.** No screen anywhere shows how a `completed` audit becomes `closed`; gating the close action on "a report has actually been uploaded" was judged the most internally consistent reading available, but it is an **ASSUMED** business rule, not evidence of an actual Close Audit dialog or confirmation copy. Treat it as the real, implemented behavior (`409 INVALID_STATE_TRANSITION`, "An audit report must be uploaded before the audit can be closed", if `reportAttached` is still `false`) — just don't mistake it for a transcribed Figma rule if you go looking for the screen that shows it.

### `GET /quality-audits`
Permission: `quality.audit.view`. Paginated, sorted by `startDate` descending. Query: `page`, `limit`, `status`, `auditType`, `departmentId`, `location`, `leadAuditorId`, `relatedVendorId`, `relatedClientId`.

### `GET /quality-audits/stats`
Permission: `quality.audit.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "scheduled", "label": "Scheduled", "value": 9 },
    { "key": "in_progress", "label": "In Progress", "value": 3 },
    { "key": "overdue", "label": "Overdue", "value": 1 },
    { "key": "completed", "label": "Completed", "value": 22 },
    { "key": "closed", "label": "Closed", "value": 15 }
  ]
}
```

### `POST /quality-audits`
Permission: `quality.audit.create`.
```json
{
  "auditTitle": "Q4 ISO 9001 Surveillance Audit — Fabrication Yard",
  "auditType": "ISO Audit",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "location": "65f1a2b3c4d5e6f7a8b9c0b9",
  "leadAuditorId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "startDate": "2026-12-01",
  "endDate": "2026-12-03",
  "auditObjective": "Verify continued conformance to ISO 9001:2015 clause 8 requirements",
  "relatedVendorId": null,
  "relatedClientId": null
}
```
`auditTitle`, `auditType`, `departmentId`, `location`, `leadAuditorId` (ref Employee), `startDate`, `endDate`, `auditObjective` required; `relatedVendorId`/`relatedClientId` optional (nullable refs — populate one when `auditType` is `Supplier/Vendor Audit` or `External Client Audit`; nothing server-side enforces that pairing — you can set `relatedVendorId` on an `Internal Quality Audit` and it will be accepted).

Response `201`: `auditId: "AUD-2026-0001"` (yearly), `reportAttached: false`, `status: "scheduled"` always.

### `GET /quality-audits/:id`
Permission: `quality.audit.view`.

### `PATCH /quality-audits/:id`
Permission: `quality.audit.update`. Same fields as create, all optional. Only while `status: "scheduled"` or `"overdue"` (`409 INVALID_STATE_TRANSITION`, "Only a scheduled or overdue audit can be edited", otherwise).

### `POST /quality-audits/:id/start`
Permission: `quality.audit.decide`. No body. From `scheduled` **or** `overdue` → `in_progress` (`409 INVALID_STATE_TRANSITION`, "Only a scheduled or overdue audit can be marked in progress", otherwise).

### `POST /quality-audits/:id/complete`
Permission: `quality.audit.decide`. No body. `in_progress → completed` only (`409 INVALID_STATE_TRANSITION`, "Only an in-progress audit can be marked completed", otherwise).

### `POST /quality-audits/:id/upload-report`
Permission: `quality.audit.decide`. `multipart/form-data`, field `file`. Only while `status: "completed"` (see note above). Sets `reportAttached: true`; does **not** itself change `status`. Response `201` (see the upsert-but-201 note above).

### `POST /quality-audits/:id/close`
Permission: `quality.audit.decide`. No body. `completed → closed` only, **and** requires `reportAttached: true` (see note above).

### `POST /quality-audits/:id/reschedule`
Permission: `quality.audit.decide`.
```json
{ "startDate": "2026-12-10", "endDate": "2026-12-12" }
```
Both required. **Only from `overdue`** (`409 INVALID_STATE_TRANSITION`, "Only an overdue audit can be rescheduled", otherwise). Preserves the same record (updates `startDate`/`endDate` in place, writes an `ActivityEvent`) rather than forking a new one — resets `status` back to `scheduled`.

**There is no `DELETE` for this entity.**

---

## 5. HSE Reports — `/hse/reports`

### `GET /hse/reports`
Permission: `hse.reports.view`. **Not paginated** — a single dashboard payload.
```json
{
  "data": {
    "tiles": [
      { "key": "certificate_compliance_rate", "label": "Certificate Compliance Rate", "value": 93 },
      { "key": "expired_certificates", "label": "Expired Certificates", "value": 3 },
      { "key": "active_emergency_plans", "label": "Active Emergency Plans", "value": 14 },
      { "key": "emergency_contacts", "label": "Emergency Contacts", "value": 21 }
    ],
    "charts": [
      {
        "key": "offshore_documents_by_type",
        "title": "Offshore Travel Documents by Type",
        "type": "bar",
        "series": [{ "label": "BOSIET", "value": 48 }, { "label": "Offshore Safety Permit (OSP)", "value": 35 }]
      },
      {
        "key": "emergency_plans_by_category",
        "title": "Emergency Plans by Category",
        "type": "bar",
        "series": [{ "label": "Fire Emergency", "value": 6 }, { "label": "Medical Emergency", "value": 4 }]
      }
    ]
  }
}
```
**The underlying Figma "Reports — HSE" screen was found to be a verbatim copy of Business Development's own Reports screen** — the same tile labels, chart titles, and even sample values recur project-wide (the third confirmed instance of this exact bug, after Business Dev's and Procurement's own Reports screens, see `procurement.md` §10). These four tiles and two charts are this implementation's own reasonable choice built from fields this module already has, not a reconstruction of anything evidenced.

`certificate_compliance_rate` = `valid / (valid + expiring_soon + expired)` as a percentage, rounded, `0` if none logged — **`pending_verification` and `rejected` documents are excluded from both the numerator and the denominator**, so a department with a lot of paperwork still awaiting verification won't see its compliance rate dragged down by that backlog (nor inflated by it). `expired_certificates` is the raw `OffshoreTravelDocument` count at `status: "expired"`. `active_emergency_plans` is `EmergencyPlan` count at `status: "active"`. `emergency_contacts` is the **total** `EmergencyContact` count, unfiltered.

There is no `GET /hse/reports/export` route and no `hse.reports.export` permission key — the same gap every prior phase's own Reports screen already left unbuilt.

---

## 6. Quality Reports — `/quality/reports`

### `GET /quality/reports`
Permission: `quality.reports.view`. **Not paginated.**
```json
{
  "data": {
    "tiles": [
      { "key": "scheduled_audits", "label": "Scheduled Audits", "value": 9 },
      { "key": "overdue_audits", "label": "Overdue Audits", "value": 1 },
      { "key": "closed_audits", "label": "Closed Audits", "value": 15 },
      { "key": "calibration_compliance_rate", "label": "Calibration Compliance Rate", "value": 87 }
    ],
    "charts": [
      {
        "key": "audits_by_type",
        "title": "Audits by Type",
        "type": "bar",
        "series": [{ "label": "ISO Audit", "value": 10 }, { "label": "Internal Quality Audit", "value": 18 }]
      },
      {
        "key": "audit_status_breakdown",
        "title": "Audit Status Breakdown",
        "type": "bar",
        "series": [
          { "label": "Scheduled", "value": 9 },
          { "label": "Overdue", "value": 1 },
          { "label": "Completed", "value": 22 },
          { "label": "Closed", "value": 15 }
        ]
      }
    ]
  }
}
```
Same "verbatim copy of Business Dev's Reports screen" finding as HSE's own Reports screen above applies here too — the fourth confirmed instance project-wide.

**`calibration_compliance_rate` reads directly from Technical Unit's `CalibrationRecord` collection** (`valid` count / total count, as a percentage) — this is the one place in this phase's Reports surface that queries a model owned entirely by a different module directly, rather than through either of the thin `/quality/calibration-records` routes in §7 below. `scheduled_audits`/`overdue_audits`/`closed_audits` are raw `QualityAudit` counts by status (no combining — contrast HSE's own report, which does combine `valid+expiring_soon+expired` into its compliance-rate denominator).

There is no `GET /quality/reports/export` route, same gap as everywhere else.

---

## 7. Quality's access to Calibration Records — `/quality/calibration-records`

**This is not a new entity.** `CalibrationRecord` is Technical Unit's own model (`technical.md` §8) — instruments, custodians, calibration logs, the due-date-driven `valid`/`due_soon`/`overdue`/`out_of_service` status machine, the type-prefixed reference codes. None of that is restated here. This phase adds a **second, read-only router mounted at a second path**, confirmed as Quality System's own sidebar entry pointing at the exact same sample data Technical's screen shows.

`qualityCalibrationRecordRouter` (exported alongside Technical's own `calibrationRecordRouter` from the same `calibrationRecord.routes.ts` file) calls the **identical controller handlers** Technical's router calls — `listCalibrationRecordsHandler`, `getCalibrationStatsHandler`, `getCalibrationRecordHandler`, `getCalibrationHistoryHandler` — just gated by `quality.calibrationrecord.view` instead of `technical.calibrationrecord.view`. There is no separate service layer, no separate data, no drift possible between what the two sidebars show.

**Read-only — no create/update/log/out-of-service/restore routes exist under `/quality/...` for this entity**, unlike the Goods Receipt case in §8 below. The permission catalogue reflects this exactly: `quality.calibrationrecord` only declares `view`, nothing else. A user holding only `quality.calibrationrecord.view` can read this collection but gets `403 FORBIDDEN` on Technical's own `/calibration-records` route (different permission string, same data) — the actual new risk surface this phase introduces for this entity is the permission-wiring boundary itself, not any new logic.

### `GET /quality/calibration-records`
Permission: `quality.calibrationrecord.view`. Same query params, pagination, and sort order as `GET /calibration-records` — see `technical.md` §8.

### `GET /quality/calibration-records/stats`
Permission: `quality.calibrationrecord.view`. Identical payload shape to `GET /calibration-records/stats` — see `technical.md` §8.

### `GET /quality/calibration-records/:id`
Permission: `quality.calibrationrecord.view`.

### `GET /quality/calibration-records/:id/history`
Permission: `quality.calibrationrecord.view`. Same append-only `CalibrationLog` array as `GET /calibration-records/:id/history` — see `technical.md` §8.

---

## 8. Quality's access to Materials Inspection (Goods Receipts) — `/quality/materials-inspection`

**Also not a new entity.** `GoodsReceiptNote` is Procurement's own model (`procurement.md` §5) — this phase doesn't touch its fields, its `pending`/`passed`/`failed` inspection statuses, or the stock-posting mechanics behind a `passed` decision. See `procurement.md` §5 for the full entity, including the corrected inspection-status mechanism itself (the separate, later "Update Inspection Status" modal, not a field set at creation time — a fix that shipped as its own change ahead of this module's new entities, since it corrected already-shipped Procurement code rather than resolving one of this phase's own open questions).

**Unlike Calibration Records above, this second access point is not read-only.** `qualityGoodsReceiptRouter` (exported alongside Procurement's own `goodsReceiptRouter` from `goodsReceiptNote.routes.ts`) exposes `GET /` (list), `GET /stats`, `GET /:id`, **and** `POST /:id/inspection-status` — the actual inspection decision — all calling Procurement's own canonical controller/service functions, just gated by `quality.goodsreceipt.view`/`quality.goodsreceipt.update` instead of `procurement.goodsreceipt.view`/`procurement.goodsreceipt.update`. This asymmetry with Calibration Records' thin, read-only wrapper is deliberate: the design evidence shows the "Update Inspection Status" modal itself being reached from *this* Quality sidebar location, not just a read-only summary view, so the decide action had to be exposed here too.

The permission catalogue reflects this: `quality.goodsreceipt` declares `view` **and** `update` (not just `view`, unlike `quality.calibrationrecord`). A user holding `quality.goodsreceipt.update` can decide a goods receipt's inspection status via this route without ever holding any `procurement.*` permission at all — functionally equivalent to holding `procurement.goodsreceipt.update`, just reached through a different permission string and a different sidebar.

### `GET /quality/materials-inspection`
Permission: `quality.goodsreceipt.view`. Same query params, pagination, and sort order as `GET /goods-receipts` — see `procurement.md` §5.

### `GET /quality/materials-inspection/stats`
Permission: `quality.goodsreceipt.view`. Identical payload shape to `GET /goods-receipts/stats` — see `procurement.md` §5.

### `GET /quality/materials-inspection/:id`
Permission: `quality.goodsreceipt.view`.

### `POST /quality/materials-inspection/:id/inspection-status`
Permission: `quality.goodsreceipt.update`. **Identical shape and mechanics to `POST /goods-receipts/:id/inspection-status`** — `multipart/form-data`, `status`/`inspectionNotes`/`file` required, `receivedItems` optional (JSON-encoded string, parsed server-side before validation), only reachable from `status: "pending"`, posts stock via `postInventoryTransaction` on a transition into `passed`. See `procurement.md` §5 for the complete field-by-field breakdown, the `receivedItems`-parsing quirk, and the stock-posting behavior — none of it differs by one line between this route and Procurement's own.

---

## 9. Cross-module effects of this phase

HSE + Quality System is a pure consumer of other modules' entities for its Reports screens, plus two deliberate second-access-point routes onto collections it doesn't own — it did **not** add any field to a model documented elsewhere, and did not modify any entity's own business logic except for the one pre-existing-code correction noted below.

- **Technical's `CalibrationRecord`** (`technical.md` §8) gained no new field. Quality Reports (§6) reads it directly for `calibration_compliance_rate`, and `/quality/calibration-records` (§7) reads it via the identical controller/service Technical's own route uses. No write path exists from this module into that collection at all.
- **Procurement's `GoodsReceiptNote`** (`procurement.md` §5) gained no new field from *this* phase, but its `inspectionStatus` mechanism was corrected as groundwork immediately ahead of this phase's own new entities being built — the first instance in this project of one phase's analysis directly overturning an already-shipped prior phase's implementation (not just resolving that prior phase's own open spec question). `/quality/materials-inspection` (§8) both reads and writes this collection through Procurement's own service functions.
- **`QualityAudit.relatedVendorId`/`relatedClientId`** are one-directional, optional refs **into** Procurement's `Vendor` and Business Dev's `Client` — there is no reverse rollup (no "audits concerning this vendor" field written back onto `Vendor`, no Quality Audit tab implied on the Vendor or Client detail screen by this API).
- **`GET /permissions`** now additionally returns `hse` (`offshoretraveldocument`, `emergencyplan`, `emergencycontact`, `reports`) and `quality` (`audit`, `calibrationrecord`, `goodsreceipt`, `reports`) blocks in its catalogue — the same incremental-catalogue-growth pattern every phase has followed.
- **Two more daily `node-cron` sweeps**, bringing the system-wide total to six: `runOffshoreTravelDocumentExpirySweep` at **05:00** and `runQualityAuditOverdueSweep` at **06:00**, both running one hour apart from each other and from Procurement's own Inventory Item low-stock sweep (04:00). Both new sweeps are pure status-recomputation jobs (no notification fan-out) — unlike the Supply Item and Inventory Item low-stock sweeps, neither one calls `notify()` for anyone; they only flip statuses and write `ActivityEvent` rows with `actorId: null`. A frontend relying on a push notification for "a certificate just expired" or "an audit just went overdue" will not get one — these two states are only discoverable by polling the respective list/stats endpoints.

---

## Appendix: reference-code formats (HSE + Quality System)

| Entity | Format | Resets yearly? | Notes |
|---|---|---|---|
| EmergencyPlan.planId | `ERP-NNNN` | No | Permanent register, same convention as Employee/Project/Client/Vendor. |
| QualityAudit.auditId | `AUD-YYYY-NNNN` | Yes | |
| OffshoreTravelDocument | (no code) | N/A | Internal `_id` only. `certificateNo` is external/vendor-issued, never PGSL-generated. |
| EmergencyContact | (no code) | N/A | Internal `_id` only — plain reference register, no workflow to attach a code to. |

All generated counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide within one `{ key, year }` pair. `ERP` and `AUD` don't collide with any prefix already in use elsewhere in the system (`PREQ`, `PRFQ`, `PO`, `DEL`, `GRN`, `SA`, `SM`, `VEN`, `PRJ`, `LOG`, `RRQ`, `SD`, `ED`, the eight instrument-type prefixes, `HR-TSK`, `REQ`, etc. — see `procurement.md`'s and `technical.md`'s own appendices for the full prior list).
