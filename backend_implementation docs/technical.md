# PGSL ERP — Technical Unit API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

Technical Unit is the Projects phase — the central entity three prior phases (HR, Business Dev) left as a forward dependency. The static permission catalogue returned by `GET /permissions` (see Platform Core's Roles & Permissions section) includes a `technical` block (`project`, `wbsactivity`, `projectlog`, `resourcerequest`, `sitediary`, `timesheet`, `engineeringdocument`, `calibrationrecord`, `reports` resources). As with every prior phase's catalogue, `technical.project.export` is **not wired to any route** — no export endpoint exists for any Technical Unit resource, including the portfolio-wide Technical Reports screen (`GET /technical/reports/export` doesn't exist either, same gap every prior phase's own Reports screen already left unbuilt).

**Two things this module deliberately does *not* model, after five phases of direct inspection confirm no screen/nav item/field exists for either:** a **Contract** entity (`Project.contractType` is descriptive only, not a record with its own lifecycle) and a **Work Order** entity (zero backing beyond one KPI tile label). Don't build UI around either expecting backend support.

**Feature-surface comparison across the eight sub-resources** — not every entity gets the same set of list/stats/cross-project routes, and the asymmetry is real, not an oversight:

| Entity | Project-scoped list | Cross-project list | Stats | Activity timeline |
|---|---|---|---|---|
| WBS Activity | Yes (`/projects/:id/wbs`) | No | No | Generic `GET /activity/WbsActivity/:id` only |
| Project Log | Yes (`/projects/:id/logs`) | No | Yes (project-scoped only) | Generic `GET /activity/ProjectLog/:id` only |
| Resource Request | Yes (`/projects/:id/resource-requests`) | **Yes** (`/technical/resource-requests`) | Yes (both scopes) | **Dedicated** `GET /resource-requests/:id/approval-log` |
| Site Diary Entry | Yes (`/projects/:id/site-diary`) | No | No stats endpoint at all | Generic `GET /activity/SiteDiaryEntry/:id` only |
| Project Timesheet | Yes (`/projects/:id/timesheets`) | No | Yes (project-scoped only) | Generic `GET /activity/ProjectTimesheet/:id` only |
| Engineering Document | Yes (`/projects/:id/documents`, list-only) | **Yes** (`/engineering-documents`, with optional `projectId` filter) | Yes (global, optional `projectId` filter) | Generic `GET /activity/EngineeringDocument/:id` only |
| Calibration Record | N/A (not project-scoped — instruments belong to a custodian/location, not a project) | **Yes** (`/calibration-records`) | Yes (global only) | Its own **domain** log, not a generic Activity wrapper — see Calibration Records below |

Resource Request is the only sub-resource with a dedicated, named `/approval-log` endpoint; every other sub-resource's timeline must be read via Platform Core's generic `GET /activity/<SubjectType>/:id` using the exact `subjectType` strings this module writes: `Project`, `WbsActivity`, `ProjectLog`, `ResourceRequest`, `SiteDiaryEntry`, `ProjectTimesheet`, `EngineeringDocument`, `CalibrationRecord`.

---

## Changes since the production review (read this first)

- **Tender conversion:** `POST /projects/from-tender/:tenderId` creates the project from a won tender (see `business-dev.md`).
- **Completing a project is refused (`409`, with counts)** while it has work activities that are not completed, client invoices with a balance outstanding, or vendor invoices not yet paid. Adding work activities, budgets and purchase orders needs an open project.
- **Budget actual spend is derived from the ledger** (`accounts-finance.md` §4), and `Project.totalDisbursed` is now written: cash actually paid to vendors against the project.
- **Timesheets.** `hoursWorked` and `overtimeHours` are capped at 24. A timesheet can be edited or deleted only by the person it belongs to, or by someone holding `technical.timesheet.decide` (anyone else gets `404`); the employee it belongs to cannot be changed afterwards; nobody approves their own timesheet.
- **Engineering documents:** the check step needs `technical.engineeringdocument.decide-check` and final approval `decide-approve` (review stays `decide`); the preparer cannot approve their own document. **Resource requests:** store approval and rejection need `technical.resourcerequest.decide-store`.

---

## 1. Projects — `/projects`

All routes require authentication. `PROJECT_STATUSES`: `in_progress`, `on_hold`, `at_risk`, `delayed`, `completed`. `PROJECT_TYPES`: `EPCIC`, `Maintenance`. `CONTRACT_TYPES` (descriptive only — see intro): `Lump Sum`, `EPCIC`, `Unit Rate`, `Cost Plus`.

**`relatedTenderId`/`relatedOpportunityId`** are optional refs to Business Dev's Tender/Opportunity — added beyond the evidenced field set so a Project can be traced back to the deal that won it (the same reasoning as Administration's `Disposal.assetId`). **`Client.activeProjects`** (see `business-dev.md`) now counts real, non-`completed` Project documents against this collection — it is no longer the hard-coded `0` placeholder `business-dev.md` itself documents; that file predates this phase.

**`projectManagerId`/`technicalLeadId` are derived, not submitted directly.** They're computed from `teamMembers[]` every time it's set (on create, and on any `PATCH` that includes a `teamMembers` key): the first team member whose free-text `role` string contains `"project manager"` (case-insensitive substring match) becomes `projectManagerId`; the first containing `"technical lead"` becomes `technicalLeadId`. No match for either → that field stays `null`. **A `PATCH` that omits `teamMembers` entirely leaves the previously-derived `projectManagerId`/`technicalLeadId` untouched** — you cannot clear or change them except by resubmitting the full `teamMembers` array.

**Status transitions are a hub-and-spoke, not one linear chain** — note in particular that `on_hold` is a dead end for `/complete`:

| Action | Allowed `from` | `to` |
|---|---|---|
| `POST /:id/hold` | `in_progress`, `at_risk` | `on_hold` |
| `POST /:id/resume` | `on_hold` | `in_progress` (only — never back to `at_risk`) |
| `POST /:id/mark-at-risk` | `in_progress` | `at_risk` |
| `POST /:id/mark-in-progress` | `at_risk` | `in_progress` |
| `POST /:id/complete` | `in_progress`, `at_risk`, `delayed` | `completed` |

A project `on_hold` **cannot** be completed directly — it must be `/resume`d first (`409 INVALID_STATE_TRANSITION` otherwise). `delayed` is only ever reached as a side effect of `/update-timeline` (see below), never by a dedicated status-change endpoint of its own.

**Reason is intentionally optional on `/hold` and `/resume`** — the evidenced Put on Hold / Resume forms show it as optional, a deliberate deviation from this system's otherwise-universal "destructive transition requires a reason" rule (kept matching the evidence per a confirmed decision, not silently normalized). Treat this as a real inconsistency with the rest of the API, not a doc error.

A brand-new project always starts `status: "in_progress"` regardless of anything in the request body.

### `GET /projects`
Permission: `technical.project.view`. Paginated. Query: `page`, `limit`, `status`, `clientId`, `projectManagerId`. There is no `q` free-text search param exposed, despite a text index existing on `projectName` server-side — it isn't wired to any query filter.

### `GET /projects/stats`
Permission: `technical.project.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_projects", "label": "Total Projects", "value": 24 },
    { "key": "in_progress", "label": "In Progress", "value": 16 },
    { "key": "at_risk", "label": "At Risk", "value": 5 },
    { "key": "completed", "label": "Completed", "value": 3 }
  ]
}
```
`at_risk` here is `at_risk` **and** `delayed` combined into one tile.

### `POST /projects`
Permission: `technical.project.create`.
```json
{
  "projectName": "Lekki Phase 2 Pipeline Expansion",
  "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
  "relatedTenderId": "65f1a2b3c4d5e6f7a8b9c0t1",
  "clientEmail": "projects@dangote-refinery.com",
  "projectType": "EPCIC",
  "contractType": "Lump Sum",
  "location": "Lekki Free Trade Zone, Lagos",
  "startDate": "2026-11-01",
  "plannedCompletion": "2027-08-31",
  "approvedBudget": 450000000000,
  "currency": "NGN",
  "description": "EPCIC scope for the Phase 2 pipeline tie-in and pump station upgrade.",
  "teamMembers": [
    { "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5", "role": "Project Manager", "department": "Technical" },
    { "employeeId": "65f1a2b3c4d5e6f7a8b9c0d7", "role": "Technical Lead", "department": "Engineering" }
  ]
}
```
`projectName`, `clientId`, `projectType`, `contractType`, `startDate`, `plannedCompletion`, `approvedBudget` required; `relatedTenderId`/`relatedOpportunityId`/`clientEmail`/`location`/`description` optional; `currency` defaults `NGN`; `teamMembers` defaults `[]`. `startDate` must be ≤ `plannedCompletion`. `approvedBudget`/`totalDisbursed` follow the same kobo convention as the rest of the system.

Response `201`:
```json
{
  "success": true,
  "message": "Project registered successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0p1",
    "projectId": "PRJ-0001",
    "projectName": "Lekki Phase 2 Pipeline Expansion",
    "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
    "relatedTenderId": "65f1a2b3c4d5e6f7a8b9c0t1",
    "relatedOpportunityId": null,
    "projectType": "EPCIC",
    "contractType": "Lump Sum",
    "startDate": "2026-11-01T00:00:00.000Z",
    "plannedCompletion": "2027-08-31T00:00:00.000Z",
    "approvedBudget": 450000000000,
    "currency": "NGN",
    "teamMembers": [ "...": "..." ],
    "projectManagerId": "65f1a2b3c4d5e6f7a8b9c0d5",
    "technicalLeadId": "65f1a2b3c4d5e6f7a8b9c0d7",
    "totalDisbursed": 0,
    "status": "in_progress",
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`projectId` is generated as `PRJ-<NNNN>`, permanent, never resets.

### `GET /projects/:id`
Permission: `technical.project.view`.

### `PATCH /projects/:id`
Permission: `technical.project.update`. All create fields optional. Blocked (`409 INVALID_STATE_TRANSITION`, "A completed project cannot be edited") once `status: "completed"`.

### `POST /projects/:id/hold`
Permission: `technical.project.transition`.
```json
{ "reason": "Client-requested pause pending revised scope approval" }
```
`reason` optional (see note above). See transition table above for allowed `from` states.

### `POST /projects/:id/resume`
Permission: `technical.project.transition`.
```json
{ "notes": "Scope approved, remobilising site crew" }
```
`notes` optional. Only from `on_hold`.

### `POST /projects/:id/mark-at-risk`
Permission: `technical.project.transition`. No body. Only from `in_progress`.

### `POST /projects/:id/mark-in-progress`
Permission: `technical.project.transition`. No body. Only from `at_risk`.

### `POST /projects/:id/complete`
Permission: `technical.project.transition`. No body. From `in_progress`, `at_risk`, or `delayed` (not `on_hold` — see note above).

### `POST /projects/:id/update-timeline`
Permission: `technical.project.transition`.
```json
{
  "newCompletion": "2027-10-15",
  "reasonForChange": "Vendor/Material Delay",
  "logAsChallenge": true
}
```
`reasonForChange` must be one of `TIMELINE_CHANGE_REASONS`: `Client-Requested Delay`, `Vendor/Material Delay`, `Weather/Site Conditions`, `Scope Change`, `Resource Constraint`, `Other`. `logAsChallenge` defaults `false`. Blocked (`409 INVALID_STATE_TRANSITION`) once `status: "completed"`.

**Side effects, both independent of `logAsChallenge`:**
- If `newCompletion` is later than the previous `plannedCompletion` **and** the project isn't already `delayed`, `status` is auto-flipped to `delayed` — this happens on *any* push-out, whether or not you also log a challenge.
- If `logAsChallenge: true`, an `Issue`-type `ProjectLog` entry is auto-created (title `"Timeline updated: <reasonForChange>"`, `status: "open"`), attributed to the project's `projectManagerId` as both `raisedBy` and `assignedTo` (resolved from the calling user's linked Employee if `projectManagerId` isn't set). This is a **safe ordered write, not a transaction** — the Project's timeline is saved first; if the ProjectLog creation then fails (e.g. no resolvable Employee), the timeline update still stands and only the auto-logged Issue is silently missing (logged as a warning server-side, not surfaced to the caller). There is no reconciliation sweep for this gap.

### `GET /projects/:id/milestones`
Permission: `technical.project.view`. **Not paginated** — a thin filter over WBS Activities: `WbsActivity.find({ projectId, isMilestone: true })`, sorted by `startDate` ascending. **Does not include the computed `durationDays` field** that the full WBS listing endpoint merges in (see WBS Activities below) — compute it client-side from `startDate`/`endDate` if needed (`max(1, round((end - start) / 1 day))`).

### `GET /projects/:id/progress`
Permission: `technical.project.view`. **Not paginated** — the Progress Tracking tab's rollup, backing both this per-project view and the portfolio-wide Technical Reports screen (same `computeProjectProgress()` function, same tile/chart shape).
```json
{
  "data": {
    "tiles": [
      { "key": "physical_progress", "label": "Physical Progress", "value": 42, "unit": "%" },
      { "key": "planned_progress", "label": "Planned Progress", "value": 55, "unit": "%" },
      { "key": "budget_utilization", "label": "Budget Utilization", "value": 38, "unit": "%" },
      { "key": "open_risks_issues", "label": "Open Risks/Issues/Change Requests", "value": 7 }
    ],
    "charts": [
      {
        "key": "physical_vs_planned_progress",
        "title": "Physical Progress vs Planned Progress",
        "type": "bar",
        "series": [{ "label": "Physical Progress", "value": 42 }, { "label": "Planned Progress", "value": 55 }]
      },
      {
        "key": "budget_vs_actual_cost",
        "title": "Budget vs Actual Cost",
        "type": "bar",
        "series": [{ "label": "Approved Budget", "value": 450000000000 }, { "label": "Actual Cost (Disbursed)", "value": 171000000000 }]
      }
    ]
  }
}
```
`physicalProgress` is the WBS completion ratio (`completed WbsActivity count / total WbsActivity count` for this project, `0` if none exist yet) — a real, data-backed number. `plannedProgress` and the `divergenceFlag` thresholds behind it are **ASSUMED**, not evidenced:
- `plannedProgress` = elapsed time / planned total duration (straight-line schedule curve, `(now - startDate) / (plannedCompletion - startDate)`, clamped 0–100; `100` if the planned window has already lapsed or is zero-length).
- `divergenceFlag` (not itself returned by this endpoint, but feeds the Technical Reports table below): gap > 25 points → `High`; gap > 10 points → `Medium`; else `None`.

`budgetUtilization` = `totalDisbursed / approvedBudget` (as a percentage, capped at 100; `0` if `approvedBudget` is `0`). `open_risks_issues` counts `ProjectLog` documents for this project whose status is still "open" by type — `monitoring`/`in_progress`/`open`/`occurred`/`pending_approval` (i.e. everything except `mitigated`/`resolved`/`approved`/`rejected`).

### `GET /projects/:id/images`
Permission: `technical.project.view`. **Not paginated** — this project's `Attachment` records (`subjectType: "Project"`), each carrying the two Technical-specific extra fields `photoTitle`/`detailedDescription` alongside the standard Attachment fields.

### `POST /projects/:id/images`
Permission: `technical.project.update` (not a separate images permission). `multipart/form-data`, field `file` + optional `photoTitle`, `detailedDescription`.

**PNG/JPG only — narrower than every other upload surface in this API.** This route uses a dedicated `uploadImage` multer instance (`image/png`, `image/jpeg` only) distinct from the project-wide PDF/DOCX/DWG/PNG rule documented in `platform-core.md` §1.7, which every other file-accepting route in this module (Engineering Documents, Calibration logs) still uses. A `.pdf`/`.docx`/`.dwg` upload here → `422 VALIDATION_ERROR` ("UNSUPPORTED_FILE_TYPE"), even though those same types are accepted everywhere else.

---

## 2. WBS Activities — `/projects/:id/wbs`, `/wbs-activities`

All routes require authentication. `WBS_PHASES`: `Planning`, `Engineering`, `Procurement`, `Construction`, `Commissioning`, `Close-out`. `WBS_STATUSES`: `pending`, `in_progress`, `on_hold`, `delayed`, `completed` — no transition map is enforced on any of these; `PATCH` can set `status` directly to any value. `priority` reuses Business Dev's `OPPORTUNITY_PRIORITIES` enum (`Low|Medium|High|Hot`, default `Medium`) verbatim, the same cross-module enum reuse pattern Administration's Movement applies to Asset's `ASSET_CONDITIONS`.

WBS is **hierarchical** via a self-referential `parentActivityId` — there is no depth limit enforced (arbitrary nesting). `wbsCode` (e.g. `"2.1.1"`) is a free-text hierarchical label, scoped **per project**, not a global reference code — the uniqueness constraint is on `(projectId, wbsCode)` together.

### `GET /projects/:id/wbs`
Permission: `technical.wbsactivity.view`. **Not paginated** — full array for the project, sorted by `wbsCode`. Query: `status`, `phase`, and an accepted-but-inert `view` param (`table|gantt`) — **`view` has no effect server-side**; the same flat array is returned regardless of its value. Gantt is a pure alternate client-side rendering of this same collection, not a distinct read path. Each item has a computed `durationDays` field merged in (`max(1, round((endDate - startDate) / 1 day))`) — not stored.

### `POST /projects/:id/wbs`
Permission: `technical.wbsactivity.create`.
```json
{
  "wbsCode": "2.1",
  "activityName": "Mechanical Piping Installation",
  "phase": "Construction",
  "assignedTo": "65f1a2b3c4d5e6f7a8b9c0d5",
  "priority": "High",
  "startDate": "2026-12-01",
  "endDate": "2027-02-15",
  "description": "Install and pressure-test all mechanical piping runs for Unit 2",
  "isCriticalPath": true,
  "isMilestone": false
}
```
`wbsCode`, `activityName`, `phase`, `assignedTo` (ref Employee), `startDate`, `endDate` required; `priority` defaults `Medium`; `isCriticalPath`/`isMilestone` default `false`. `startDate` must be ≤ `endDate`. Created as a top-level activity (`parentActivityId: null`), `status: "pending"`.

### `POST /projects/:id/wbs/:activityId/sub-activities`
Permission: `technical.wbsactivity.create`. Same body shape as above. The sub-activity's `projectId` is taken from the **parent activity's own** `projectId`, not re-derived from the body. The `:id` (project) segment in the URL **is cross-checked** against the parent activity's real `projectId` — a mismatched `:id`/`:activityId` pair (the activity belongs to a different project than the one named in the URL) returns `404 NOT_FOUND`, the same as if the activity didn't exist at all (deliberately not a more specific error, so the response doesn't confirm the activity exists under a different project).

### `GET /wbs-activities/:id`
Permission: `technical.wbsactivity.view`.

### `PATCH /wbs-activities/:id`
Permission: `technical.wbsactivity.update`. All create fields optional, plus `status`. No restricted transition map — any status can follow any other.

### `DELETE /wbs-activities/:id`
Permission: `technical.wbsactivity.delete`. Blocked (`409 CONFLICT`, "Cannot delete an activity that has sub-activities") if any other WBS Activity still has this one as its `parentActivityId`. Delete the children first.

---

## 3. Project Logs (Risk / Issue / Change Request) — `/projects/:id/logs`, `/logs`

All routes require authentication. `ProjectLog` is a **single unified entity** for three conceptually different record types, each with its **own, non-overlapping status vocabulary** — don't assume one status enum covers all three:

```
STATUSES_BY_TYPE = {
  Risk:            ['monitoring', 'mitigated', 'occurred'],
  Issue:           ['open', 'in_progress', 'resolved'],
  'Change Request': ['pending_approval', 'approved', 'rejected'],
}
```
`DEFAULT_STATUS_BY_TYPE` on creation: `Risk → monitoring`, `Issue → open`, `Change Request → pending_approval`.

**Six decision endpoints exist, each hard-gated to one specific `type`** — calling one against the wrong type returns `409 INVALID_STATE_TRANSITION` ("This action only applies to a '<type>' log entry"):

| Endpoint | Only valid for `type` | Requires current status | Sets status to |
|---|---|---|---|
| `POST /logs/:id/start` | `Issue` | `open` | `in_progress` |
| `POST /logs/:id/resolve` | `Issue` | (any) | `resolved` |
| `POST /logs/:id/mark-occurred` | `Risk` | `monitoring` | `occurred` |
| `POST /logs/:id/mitigate` | `Risk` | (any) | `mitigated` |
| `POST /logs/:id/approve` | `Change Request` | (any) | `approved` |
| `POST /logs/:id/reject` | `Change Request` | (any) | `rejected` |

`/start` takes no body. `/mark-occurred` takes `{ "resolutionNotes": "..." }` (required, 1–2000 chars, same shape as `/resolve`/`/mitigate`/`/reject`) — worth recording what happened when a monitored risk materializes. `PATCH /logs/:id` still cannot set `status` directly (`updateProjectLogSchema` has no `status` field) — only these dedicated endpoints drive the state machine.

`priority` reuses `OPPORTUNITY_PRIORITIES` (same as WBS Activity, above). `linkedWbsActivityId` is **nullable** — required by convention on a manually-created entry, but left `null` on the auto-logged Issue created by Project's `update-timeline` (that entry has no natural WBS activity to attach to).

**`raisedBy` is never auto-resolved from the calling user** (unlike Resource Requests and Site Diary below) — it must be supplied explicitly in the request body on every manual `POST`, and can reference any Employee, not necessarily the caller's own.

### `GET /projects/:id/logs`
Permission: `technical.projectlog.view`. Paginated. Query: `page`, `limit`, `type` (`Risk|Issue|Change Request`), `status` (**free text, not enum-validated** — the valid set differs by `type`, so this is matched literally against whatever string is stored).

### `GET /projects/:id/logs/stats`
Permission: `technical.projectlog.view`. **Not paginated.** Project-scoped only — there is no cross-project `/technical/logs/stats` equivalent to Resource Request's.
```json
{
  "data": [
    { "key": "open_risks", "label": "Open Risks", "value": 4 },
    { "key": "open_issues", "label": "Open Issues", "value": 6 },
    { "key": "pending_change_requests", "label": "Pending Change Requests", "value": 2 },
    { "key": "open_project_logs", "label": "Open Project Logs", "value": 19 }
  ]
}
```
`open_risks` = `Risk` logs still `monitoring`. `open_issues` = `Issue` logs **not** `resolved` (includes both `open` and `in_progress`). `pending_change_requests` = `Change Request` logs still `pending_approval`. `open_project_logs` is the **total** log count for the project (all types, all statuses — not just open ones, despite the label).

### `POST /projects/:id/logs`
Permission: `technical.projectlog.create`.
```json
{
  "type": "Risk",
  "title": "Potential rebar shortage ahead of Q1 pour",
  "linkedWbsActivityId": "65f1a2b3c4d5e6f7a8b9c0w3",
  "raisedBy": "65f1a2b3c4d5e6f7a8b9c0d5",
  "targetResolutionDate": "2026-12-01",
  "assignedTo": "65f1a2b3c4d5e6f7a8b9c0d7",
  "priority": "High",
  "budgetImpact": 15000000,
  "scheduleImpact": "Potential 2-week slip to the concrete pour milestone",
  "description": "Vendor has flagged a possible rebar supply gap for the Q1 pour.",
  "potentialImpact": "Delay to Construction phase critical path",
  "recommendedAction": "Source a secondary rebar supplier as contingency"
}
```
`type`, `title`, `raisedBy`, `assignedTo` required; everything else optional; `priority` defaults `Medium`. `status` is always set server-side from `DEFAULT_STATUS_BY_TYPE[type]` — it cannot be passed in.

Response `201`, `logId: "LOG-2026-0001"` (resets yearly, permanent-looking format but yearly).

### `GET /logs/:id`
Permission: `technical.projectlog.view`.

### `PATCH /logs/:id`
Permission: `technical.projectlog.update`. Same fields as create (all optional) plus `resolutionNotes` — **no `status` field** (see gap noted above).

### `POST /logs/:id/resolve`
Permission: `technical.projectlog.decide`.
```json
{ "resolutionNotes": "Root cause was a mis-sequenced delivery; corrected and verified on site." }
```
`resolutionNotes` required, 1–2000 chars. `Issue` only.

### `POST /logs/:id/start`
Permission: `technical.projectlog.decide`. No body. `Issue` only, from `open`.

### `POST /logs/:id/mark-occurred`
Permission: `technical.projectlog.decide`.
```json
{ "resolutionNotes": "Vendor confirmed the shortage — 2-week slip to the concrete pour." }
```
`resolutionNotes` required, 1–2000 chars. `Risk` only, from `monitoring`.

### `POST /logs/:id/mitigate`
Permission: `technical.projectlog.decide`. Same body shape as `/resolve`. `Risk` only.

### `POST /logs/:id/approve`
Permission: `technical.projectlog.decide`. No body. `Change Request` only.

### `POST /logs/:id/reject`
Permission: `technical.projectlog.decide`.
```json
{ "resolutionNotes": "Scope change not approved — exceeds the contingency budget line." }
```
`Change Request` only.

---

## 4. Resource Requests — `/projects/:id/resource-requests`, `/technical/resource-requests`, `/resource-requests`

All routes require authentication. This is the module's **strongest-evidenced chain** — a named two-step approval sequence (Technical, then Store) with several off-ramps:

```
technical_reviewing → store_reviewing → issued
```
`technicalApprove()` moves `technical_reviewing` directly to `store_reviewing` — there is no separate resting `technical_approved` status. (An earlier pass of this model declared one; it was dead/unreachable and has been removed from `RESOURCE_REQUEST_STATUSES` — the `resourcerequest.technical_approved` `ActivityEvent` action still records the approval event itself, it's just not also a status value.)

Off-ramps: `rejected_by_technical` (from `technical_reviewing`), `unavailable` (from `store_reviewing`), `cancelled` (from `technical_reviewing` or `store_reviewing`, requester-initiated), `returned` (from `issued`, once the resource is given back).

`RESOURCE_CATEGORIES`: `Equipment`, `Material`, `PPE`, `Vehicle`.

`ResourceRequest.requestId` is generated with `nextYearlyCode('RRQ', 4)` — deliberately **not** `'REQ'`, which is Administration's `AdministrativeRequest` prefix (see `administration.md` §3). An earlier pass used the literal string `"REQ"` for both, which made the two entirely unrelated entities share one incrementing `ReferenceSequence` counter (`{ key: prefix, year }`, no module-scoping) — a `REQ-2026-0014` code could have belonged to either. Renamed to `RRQ` to keep every reference code in the system unambiguous; this deviates from the design's own observed `REQ-001` sample for ResourceRequest specifically, but resolves the cross-entity collision.

**`requestedBy` auto-resolution prioritizes the caller over the request body** — on `POST /projects/:id/resource-requests`, the backend resolves the calling user's own linked Employee first and uses it as `requestedBy` **if one exists**, only falling back to a `requestedBy` passed in the body when the caller has no linked Employee record at all. A technical staffer cannot submit a resource request "on behalf of" a colleague by passing a different `requestedBy` in the body while authenticated as themselves — their own linked Employee always wins if present. Project Timesheets (below) now resolve the same way.

### `GET /projects/:id/resource-requests`
Permission: `technical.resourcerequest.view`. Paginated (manual `page`/`limit` parsing, not schema-validated, same pattern as Site Diary/Timesheets below).

### `GET /projects/:id/resource-requests/stats`
Permission: `technical.resourcerequest.view`. **Not paginated.** Project-scoped.

### `POST /projects/:id/resource-requests`
Permission: `technical.resourcerequest.create`.
```json
{
  "request": "20mm Rebar — 5 tonnes",
  "requestCategory": "Material",
  "quantity": 5,
  "unit": "Tonnes",
  "linkedWbsActivityId": "65f1a2b3c4d5e6f7a8b9c0w3",
  "requiredDate": "2026-12-10",
  "purpose": "Contingency stock ahead of the Q1 concrete pour"
}
```
`request`, `requestCategory`, `quantity` (positive integer), `unit`, `linkedWbsActivityId`, `requiredDate` required; `purpose` optional.

Response `201`, `requestId: "RRQ-2026-0001"` (yearly), `status: "technical_reviewing"`.

### `GET /technical/resource-requests`
Permission: `technical.resourcerequest.view`. Paginated. Query: `page`, `limit`, `projectId`, `status`. The cross-project view — identical shape to the project-scoped list.

### `GET /technical/resource-requests/stats`
Permission: `technical.resourcerequest.view`. **Not paginated**, no project filter (always portfolio-wide — this route is mounted without a project id, so despite reusing the same handler as the project-scoped stats endpoint, it cannot be scoped to one project).
```json
{
  "data": [
    { "key": "pending_technical_approval", "label": "Pending Technical Approval", "value": 5 },
    { "key": "pending_store_approval", "label": "Pending Store Approval", "value": 4 },
    { "key": "issued", "label": "Issued", "value": 22 },
    { "key": "rejected_or_unavailable", "label": "Rejected/Unavailable", "value": 4 }
  ]
}
```

### `GET /resource-requests/:id`
Permission: `technical.resourcerequest.view`.

### `PATCH /resource-requests/:id`
Permission: `technical.resourcerequest.update`. Only while `status: "technical_reviewing"` (`409 INVALID_STATE_TRANSITION`, "Only a request still awaiting technical review can be edited", otherwise). Same fields as create, all optional.

### `GET /resource-requests/:id/approval-log`
Permission: `technical.resourcerequest.view`. Paginated — wrapper over `GET /activity/ResourceRequest/:id`. The one sub-resource in this module with its own named history route (see intro table).

### `POST /resource-requests/:id/technical-approve`
Permission: `technical.resourcerequest.decide`. No body. `technical_reviewing → store_reviewing` only.

### `POST /resource-requests/:id/technical-reject`
Permission: `technical.resourcerequest.decide`. No body. `technical_reviewing → rejected_by_technical` only. Notifies the requester's linked user, if any.

### `POST /resource-requests/:id/store-approve`
Permission: `technical.resourcerequest.decide`. No body. `store_reviewing → issued` only (approving at the Store step *is* issuing — there's no separate "approved, not yet issued" state). Notifies the requester.

### `POST /resource-requests/:id/store-reject`
Permission: `technical.resourcerequest.decide`. No body. `store_reviewing → unavailable` only. Notifies the requester.

### `POST /resource-requests/:id/return`
Permission: `technical.resourcerequest.update` — note **not** `decide` (returning is treated as an operational update, not an approval-chain decision, the same category distinction Administration's Movement draws between `.update` and `.decide`). No body. `issued → returned` only.

### `POST /resource-requests/:id/cancel`
Permission: `technical.resourcerequest.update`. No body. Only from `technical_reviewing` or `store_reviewing` (requester backing out before a decision is made).

---

## 5. Site Diary — `/projects/:id/site-diary`, `/site-diary`

All routes require authentication. `SITE_DIARY_STATUSES`: `draft`, `submitted`, `signed_off`.

**`draft` and `POST /:id/submit` are an added resolution, not directly evidenced** — the original design evidence was internally contradictory (the compliance rule states entries lock "once submitted," but separate row-menu evidence shows the logger editing/deleting "while unsubmitted," with only `submitted`/`signed_off` ever actually captured and no pre-submission state for either fact to be true). `draft` was added to make both pieces of evidence true simultaneously: a new entry starts `draft` (freely editable/deletable by its logger), `POST /:id/submit` locks it to `submitted` (no longer editable/deletable), and `POST /:id/sign-off` finalizes it to `signed_off`. `POST /:id/return-for-revision` sends a `submitted` entry back to `draft` for corrections. Treat this entire lifecycle as the real, implemented API — not a deviation to second-guess against any spec you may also have access to.

**`loggedBy` resolves the same way as Resource Requests' `requestedBy`** — the calling user's own linked Employee wins if present, falling back to a `loggedBy` in the body only if the caller has no linked Employee.

**There is no stats endpoint for Site Diary** — unlike every other sub-resource with a project scope, `/projects/:id/site-diary` has no `/stats` route at all.

### `GET /projects/:id/site-diary`
Permission: `technical.sitediary.view`. Paginated (manual parsing), sorted by `reportDate` descending.

### `POST /projects/:id/site-diary`
Permission: `technical.sitediary.create`.
```json
{
  "reportDate": "2026-11-05",
  "siteLocation": "65f1a2b3c4d5e6f7a8b9c0b9",
  "weatherCondition": "Clear, 31°C",
  "workforce": 42,
  "incident": false,
  "workSummary": "Continued mechanical piping installation on Unit 2, completed pressure test on Line 14A.",
  "machineryEquipmentUtilised": "2x mobile cranes, 1x welding rig",
  "siteIssuesObservation": "Minor delay waiting on gasket delivery, resolved by midday",
  "additionalRemarks": "Safety toolbox talk conducted at shift start"
}
```
`reportDate`, `siteLocation` (ref Location), `workforce`, `workSummary` required; `weatherCondition`/`machineryEquipmentUtilised`/`siteIssuesObservation`/`additionalRemarks` optional; `incident` defaults `false`.

Response `201`, `entryId: "SD-2026-0001"` (resets yearly), `status: "draft"`.

### `GET /site-diary/:id`
Permission: `technical.sitediary.view`.

### `PATCH /site-diary/:id`
Permission: `technical.sitediary.update`. Same fields as create, all optional. Only while `status: "draft"` (`409 INVALID_STATE_TRANSITION`, "A submitted or signed-off site diary entry cannot be edited", otherwise).

### `DELETE /site-diary/:id`
Permission: `technical.sitediary.update`. Same `draft`-only guard as `PATCH`.

### `POST /site-diary/:id/submit`
Permission: `technical.sitediary.update`. No body. `draft → submitted` only.

### `POST /site-diary/:id/sign-off`
Permission: `technical.sitediary.decide`. No body. `submitted → signed_off` only.

### `POST /site-diary/:id/return-for-revision`
Permission: `technical.sitediary.decide`.
```json
{ "notes": "Please clarify the workforce headcount split by trade before sign-off" }
```
`notes` optional. `submitted → draft` only.

---

## 6. Project Timesheets — `/projects/:id/timesheets`, `/timesheets`

All routes require authentication. `TIMESHEET_STATUSES`: `submitted`, `approved`, `rejected`. One record per employee per project per calendar day (unique index on `(projectId, employeeId, date)`).

**`role` is snapshotted from `Employee.position` at log time, not live-joined** — the same reasoning HR applies to `Payslip` (see `hr.md` §9.3): a later promotion or role change doesn't rewrite a historical timesheet's displayed role.

**`employeeId` resolution now matches Resource Requests/Site Diary** — on `POST /projects/:id/timesheets`, the calling user's own linked Employee wins if one exists; a body-supplied `employeeId` is only used as a fallback for an actor with no linked Employee (e.g. a Super Admin logging on an employee's behalf). An earlier pass let the body override the caller's own identity whenever both were present, which would have let anyone holding `technical.timesheet.create` log hours under any employeeId — fixed to the same self-service-first precedence the rest of this module uses.

### `GET /projects/:id/timesheets`
Permission: `technical.timesheet.view`. Paginated (manual parsing), sorted by `date` descending.

### `GET /projects/:id/timesheets/stats`
Permission: `technical.timesheet.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "project_workforce", "label": "Project Workforce", "value": 38 },
    { "key": "hours_logged", "label": "Hours Logged", "value": 1520.5, "unit": "hrs" },
    { "key": "overtime", "label": "Overtime", "value": 64, "unit": "hrs" },
    { "key": "project_attendance", "label": "Project Attendance", "value": 91, "unit": "%" }
  ]
}
```
`project_workforce` is a distinct-employee count across every timesheet ever logged for the project (not filtered to any date range). `project_attendance` = `approved timesheets / total timesheets logged` as a percentage (**not** a true attendance/headcount ratio despite the label — it's an approval rate) — `0` if none logged yet.

### `POST /projects/:id/timesheets`
Permission: `technical.timesheet.create`.
```json
{
  "employeeId": "65f1a2b3c4d5e6f7a8b9c0d5",
  "date": "2026-11-05",
  "shift": "Day",
  "activityTask": "65f1a2b3c4d5e6f7a8b9c0w3",
  "hoursWorked": 9.5,
  "overtimeHours": 1.5,
  "workSummary": "Pressure-tested Line 14A, began bracket installation on Line 15",
  "additionalRemarksComments": "Waited 40 minutes on gasket delivery"
}
```
`date`, `activityTask` (ref WbsActivity), `hoursWorked` (positive) required; `employeeId` optional (see resolution note above); `shift`/`workSummary`/`additionalRemarksComments` optional; `overtimeHours` defaults `0`. `409 CONFLICT` on a duplicate `(projectId, employeeId, date)` — logging twice for the same employee/day/project fails rather than overwriting (contrast HR's Attendance, which upserts).

Response `201`, `status: "submitted"`, `role` snapshotted from the resolved employee's current `position`.

### `GET /timesheets/:id`
Permission: `technical.timesheet.view`.

### `PATCH /timesheets/:id`
Permission: `technical.timesheet.update`. Only while `status: "submitted"` (`409 INVALID_STATE_TRANSITION` otherwise). Same fields as create, all optional.

### `DELETE /timesheets/:id`
Permission: `technical.timesheet.update`. Same `submitted`-only guard.

### `POST /timesheets/:id/approve`
Permission: `technical.timesheet.decide`. No body. `submitted → approved` only.

### `POST /timesheets/:id/reject`
Permission: `technical.timesheet.decide`. No body. `submitted → rejected` only.

---

## 7. Engineering Documents — `/projects/:id/documents`, `/document-categories`, `/engineering-documents`

All routes require authentication. `DOCUMENT_CATEGORIES`: `Method Statement`, `Site Visit Report`, `Progress Report`, `Drawing`, `Technical Specification`.

**`ENGINEERING_DOCUMENT_STATUSES` is a reconstructed sequence, not a literally-evidenced one** — the originating designs reuse the label "Pending" across at least three different real pipeline positions, so it should not be read as one literal status name. The sequence this implementation settled on and the API actually runs:

```
pending → under_review → checked → approved → sent_to_client
```
with `returned` and `rejected` as off-ramps. This is a **Reviewer → Checker → Approver** chain, one person (or role) per step, though the permission model does **not** distinguish the three roles — every decision endpoint below is gated by the same single `technical.engineeringdocument.decide` permission, not three separate ones.

| Endpoint | Requires status | Sets status |
|---|---|---|
| `POST /:id/review-approve` | `pending` | `under_review` |
| `POST /:id/review-return` | `pending` | `returned` |
| `POST /:id/check-approve` | `under_review` | `checked` |
| `POST /:id/check-return` | `under_review` | `returned` |
| `POST /:id/approve` | `checked` | `approved` |
| `POST /:id/reject` | `checked` | `rejected` |
| `POST /:id/mark-sent-to-client` | `approved` **and** `clientFacing: true` | `sent_to_client` |

A non-`clientFacing` document can never reach `sent_to_client` — `mark-sent-to-client` rejects it (`409 INVALID_STATE_TRANSITION`, "Only a client-facing document can be sent to the client") even once `approved`.

**`PUT /:id/replace` is gated by permission, not by per-record ownership** — any caller holding `technical.engineeringdocument.update` can replace the file on any document that isn't currently `under_review` or `checked`; it is not restricted to the employee who originally uploaded it. The spec's own language calls this "uploader (Replace, while not mid-review)," but this implementation follows the same permission-only gating every other module-scoped edit action in this system uses (e.g. Site Diary/Resource Request edits check status, never who logged/requested it) rather than adding a one-off ownership check found nowhere else. Only the "not mid-review" rule is enforced in code:
- Blocked (`409 INVALID_STATE_TRANSITION`, "A document cannot be replaced while mid-review") only while `status` is `under_review` or `checked`.
- Replacing bumps `version` (`V1.0 → V1.1`, parsed from the existing version string — falls back to `V1.0` if it can't be parsed), resets `status` to `pending`, and clears any `rejectionReason`.

**`GET /document-categories` is a static lookup, not a DB collection** — no admin screen exists for managing the category→template association (the same gap-handling approach HR applies to its missing LeaveType admin screen):
```json
{
  "data": [
    { "category": "Method Statement", "templateFileName": "Method_Statement_Template_v1.0.docx" },
    { "category": "Site Visit Report", "templateFileName": "Site_Visit_Report_Template_v1.0.docx" },
    { "category": "Progress Report", "templateFileName": "Progress_Report_Template_v1.0.docx" },
    { "category": "Drawing", "templateFileName": "Drawing_Template_v1.0.docx" },
    { "category": "Technical Specification", "templateFileName": "Technical_Specification_Template_v1.0.docx" }
  ]
}
```
This endpoint returns the template **filenames** only (for showing "download the template for this category" in the upload modal) — it does not serve the template files themselves; there's no backing file storage wired to these entries.

### `GET /projects/:id/documents`
Permission: `technical.engineeringdocument.view`. Paginated — a thin, project-filtered wrapper over the same collection as the global list below. **List-only** — no stats route at this project-scoped path.

### `GET /engineering-documents`
Permission: `technical.engineeringdocument.view`. Paginated. Query: `page`, `limit`, `projectId`, `category`, `status`, `clientFacing` (boolean).

### `GET /engineering-documents/stats`
Permission: `technical.engineeringdocument.view`. **Not paginated.** Optional `?projectId=` to scope to one project.
```json
{
  "data": [
    { "key": "total_documents", "label": "Total Documents", "value": 54 },
    { "key": "pending_review", "label": "Pending Review", "value": 11 },
    { "key": "approved", "label": "Approved", "value": 32 },
    { "key": "sent_to_client", "label": "Sent to Client", "value": 18 }
  ]
}
```
`pending_review` combines `pending`, `under_review`, and `checked` into one tile.

### `POST /engineering-documents`
Permission: `technical.engineeringdocument.create`. `multipart/form-data`, field `file` + body fields:
```json
{
  "projectId": "65f1a2b3c4d5e6f7a8b9c0p1",
  "documentTitle": "Method Statement — Mechanical Piping Installation",
  "documentCategory": "Method Statement",
  "clientFacing": true,
  "description": "Covers lifting, fit-up, and welding sequence for Unit 2 piping"
}
```
`projectId`, `documentTitle`, `documentCategory` required; `clientFacing` defaults `false`; `preparedBy` optional (defaults to the calling user's own linked Employee; `422 VALIDATION_ERROR` if neither is resolvable).

Response `201`, `documentId: "ED-<NNNN>"` (permanent, never resets), `version: "V1.0"`, `status: "pending"`. Also writes the first `Attachment` for the file.

### `GET /engineering-documents/:id`
Permission: `technical.engineeringdocument.view`.

### `PATCH /engineering-documents/:id`
Permission: `technical.engineeringdocument.update`. Metadata only (`documentTitle`, `documentCategory`, `clientFacing`, `description`) — **no status precondition at all**, unlike almost every other `PATCH` in this module; it can be called regardless of current `status`.

### `PUT /engineering-documents/:id/replace`
Permission: `technical.engineeringdocument.update`. `multipart/form-data`, field `file`. See the uploader-check caveat above.

### `POST /engineering-documents/:id/review-approve`
Permission: `technical.engineeringdocument.decide`. No body. `pending → under_review`.

### `POST /engineering-documents/:id/review-return`
Permission: `technical.engineeringdocument.decide`.
```json
{ "reason": "Missing lifting plan calculations — please attach before resubmitting" }
```
`pending → returned`.

### `POST /engineering-documents/:id/check-approve`
Permission: `technical.engineeringdocument.decide`. No body. `under_review → checked`.

### `POST /engineering-documents/:id/check-return`
Permission: `technical.engineeringdocument.decide`. Same body as `review-return`. `under_review → returned`.

### `POST /engineering-documents/:id/approve`
Permission: `technical.engineeringdocument.decide`. No body. `checked → approved`.

### `POST /engineering-documents/:id/reject`
Permission: `technical.engineeringdocument.decide`.
```json
{ "reason": "Does not meet the client's specified weld inspection standard" }
```
`checked → rejected`.

### `POST /engineering-documents/:id/mark-sent-to-client`
Permission: `technical.engineeringdocument.decide`. No body. `approved → sent_to_client`, only if `clientFacing: true`.

---

## 8. Calibration Records — `/calibration-records`

All routes require authentication. **Not project-scoped** — instruments belong to a `custodian` (Employee) and `storageLocation` (Location), not a Project. `CALIBRATION_STATUSES`: `valid`, `due_soon`, `overdue`, `out_of_service`.

**Instrument reference codes are type-encoded, not one uniform sequence** — a genuinely different numbering philosophy from every other entity in the system, kept as evidenced rather than normalized:

| `type` | Prefix | Example |
|---|---|---|
| `Pressure Gauge` | `PG` | `PG-001` |
| `Temperature Gauge` | `TG` | `TG-001` |
| `Ultrasonic Thickness Gauge` | `UTG` | `UTG-001` |
| `Torque Wrench` | `TW` | `TW-001` |
| `Multimeter` | `MM` | `MM-001` |
| `Coating Thickness Gauge` | `CTG` | `CTG-001` |
| `Gas Detector` | `GD` | `GD-001` |
| `Hardness Tester` | `HT` | `HT-001` |

Each prefix runs its **own independent counter** (no collision risk between these eight). **Note the padding is 3 digits, not the system-wide 4** (`PG-001`, not `PG-0001`) — don't assume a fixed-width-4 regex when parsing/validating `instrumentId` client-side.

**`status` is largely system-computed from `nextDue`, except for `out_of_service` which is manual-only:**
- `deriveStatusFromNextDue`: no `nextDue` set yet → `valid`. `nextDue` in the past → `overdue`. `nextDue` within 14 days → `due_soon` (**this 14-day window is an ASSUMED threshold**, not evidenced from any specific design — only the overdue banner concept itself is evidenced). Otherwise → `valid`.
- A daily `node-cron` sweep (03:00) recomputes `valid`/`due_soon`/`overdue` for every record **except** those currently `out_of_service` — it never touches that status. Each change writes a `calibrationrecord.<newstatus>` ActivityEvent with `actorId: null` (system-triggered), the same pattern as Administration's Facility Maintenance overdue sweep and Supply Item low-stock sweep.
- A **`Fail`** calibration result does **not** automatically transition the instrument to `out_of_service`** — that remains an explicit, reason-required manual action via `POST /:id/out-of-service`, per a confirmed rule. Logging a failed calibration only recomputes the due-date-driven status as normal.

**`calibratedBy` is free text, not a reference to Employee or User** — the first "who did this" field in the system naming an external party directly (e.g. `"SGS Nigeria Calibration Lab"`), rather than an internal staff reference.

`CalibrationLog` entries are **append-only** — there is no edit/delete route for a logged calibration event, and `GET /:id/history` is this record's own domain log, not a wrapper over Platform Core's generic `ActivityEvent` collection the way every other sub-resource's timeline is.

### `GET /calibration-records`
Permission: `technical.calibrationrecord.view`. Paginated, sorted by `nextDue` ascending. Query: `page`, `limit`, `status`, `type` (any `INSTRUMENT_TYPES` value), `custodian` (ObjectId).

### `GET /calibration-records/stats`
Permission: `technical.calibrationrecord.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "valid", "label": "Valid", "value": 61 },
    { "key": "due_soon", "label": "Due Soon", "value": 8 },
    { "key": "overdue", "label": "Out of Calibration", "value": 3 },
    { "key": "out_of_service", "label": "Out of Service", "value": 2 }
  ]
}
```

### `POST /calibration-records`
Permission: `technical.calibrationrecord.create`.
```json
{
  "serialNumber": "PG-884213-NG",
  "instrumentName": "Ashcroft 1009 Pressure Gauge",
  "type": "Pressure Gauge",
  "manufacturerModel": "Ashcroft 1009, 0-600 PSI",
  "custodian": "65f1a2b3c4d5e6f7a8b9c0d5",
  "storageLocation": "65f1a2b3c4d5e6f7a8b9c0b9",
  "frequency": "Quarterly",
  "description": "Primary gauge for hydrotest rig B"
}
```
`serialNumber`, `instrumentName`, `type`, `custodian`, `storageLocation`, `frequency` required; `manufacturerModel`/`description` optional. `frequency` is free text (e.g. `"Quarterly"`, `"Annually"`) — not an enum, purely descriptive; it does not drive the automatic `due_soon`/`overdue` computation, which only looks at `nextDue`.

Response `201`, `instrumentId` per the type-prefix table above, `lastCalibrated: null`, `nextDue: null`, `status: "valid"` (a never-yet-calibrated instrument starts `valid` by the derivation rule, since `nextDue` is `null`).

### `GET /calibration-records/:id`
Permission: `technical.calibrationrecord.view`.

### `GET /calibration-records/:id/history`
Permission: `technical.calibrationrecord.view`. **Not paginated** — the full, append-only `CalibrationLog` array for this instrument, newest first:
```json
{
  "data": [
    {
      "_id": "...",
      "instrumentId": "65f1a2b3c4d5e6f7a8b9c0i1",
      "calibrationDate": "2026-09-01T00:00:00.000Z",
      "calibratedBy": "SGS Nigeria Calibration Lab",
      "nextDue": "2026-12-01T00:00:00.000Z",
      "certificateNumber": "SGS-CAL-2026-004471",
      "calibrationResult": "Pass",
      "createdAt": "2026-09-01T10:00:00.000Z",
      "updatedAt": "2026-09-01T10:00:00.000Z"
    }
  ]
}
```

### `PATCH /calibration-records/:id`
Permission: `technical.calibrationrecord.update`. Same fields as create, all optional. No status precondition.

### `POST /calibration-records/:id/log`
Permission: `technical.calibrationrecord.update`. `multipart/form-data`, field `file` (the calibration certificate, optional) + body:
```json
{
  "calibrationDate": "2026-12-01",
  "calibratedBy": "SGS Nigeria Calibration Lab",
  "nextDue": "2027-03-01",
  "certificateNumber": "SGS-CAL-2027-000112",
  "calibrationResult": "Pass"
}
```
`calibrationResult` ∈ `Pass | Fail`. Appends a new `CalibrationLog` row (never edits a previous one), then denormalises `lastCalibrated`/`nextDue`/`status` onto the `CalibrationRecord` from this new entry. If `file` is given, it's stored as an `Attachment` against the new log row (`subjectType: "CalibrationLog"`), not the instrument itself.

### `POST /calibration-records/:id/out-of-service`
Permission: `technical.calibrationrecord.update`. Every mutating action on Calibration Records, including this one and `/restore` below, is gated by `.update` — there is no separate `.decide` permission for this resource (an earlier pass of the catalogue declared one that no route ever checked; removed as dead config).
```json
{ "reason": "Gauge failed hydrotest verification — pressure reading drift exceeds tolerance" }
```
`reason` required. Blocked (`409 INVALID_STATE_TRANSITION`, "Instrument is already out of service") if already `out_of_service`.

### `POST /calibration-records/:id/restore`
Permission: `technical.calibrationrecord.update`. No body. Only from `out_of_service`. **Does not reset to `valid` unconditionally** — it recomputes `status` from the instrument's current `nextDue` via the same derivation rule as the sweep, so a restored instrument can come back as `due_soon` or even `overdue` if its calibration had already lapsed while it was out of service.

---

## 9. Technical Reports — `/technical/reports`

### `GET /technical/reports`
Permission: `technical.reports.view`. **Not paginated** — a single portfolio-wide dashboard payload, sharing its tile/chart shape with the per-project Progress Tracking tab (`GET /projects/:id/progress`, above) by design.
```json
{
  "data": {
    "tiles": [
      { "key": "total_projects", "label": "Total Projects", "value": 24 },
      { "key": "at_risk_or_delayed", "label": "At Risk / Delayed", "value": 5 },
      { "key": "total_portfolio_budget", "label": "Total Portfolio Budget", "value": 6800000000000 },
      { "key": "total_disbursed", "label": "Total Disbursed", "value": 2450000000000 }
    ],
    "charts": [
      {
        "key": "physical_vs_planned_progress",
        "title": "Physical Progress vs Planned Progress",
        "type": "bar",
        "series": [{ "label": "Physical Progress", "value": 47 }, { "label": "Planned Progress", "value": 52 }]
      },
      {
        "key": "budget_vs_actual_cost",
        "title": "Budget vs Actual Cost",
        "type": "bar",
        "series": [{ "label": "Approved Budget", "value": 6800000000000 }, { "label": "Actual Cost (Disbursed)", "value": 2450000000000 }]
      }
    ],
    "table": [
      {
        "projectId": "PRJ-0001",
        "projectName": "Lekki Phase 2 Pipeline Expansion",
        "client": "Dangote Refinery",
        "percentPhysical": 42,
        "percentFinancial": 38,
        "divergenceFlag": "Medium",
        "status": "in_progress"
      }
    ]
  }
}
```
**These four tile labels are not named anywhere in the originating designs** (unlike Business Dev Reports' explicitly-named tiles, see `business-dev.md` §6) — this implementation's choice (Total Projects, At Risk/Delayed, Total Portfolio Budget, Total Disbursed) is an **ASSUMED**, reasonable portfolio-level set built from fields this module already has, not a direct reconstruction.

Both chart series average `physicalProgress`/`plannedProgress` across every **non-`completed`** project (`in_progress`, `on_hold`, `at_risk`, `delayed`) — a `completed` project drops out of both the charts and the `table[]` rows entirely, even though it's still counted in `total_projects`. `table[]` is one row per active (non-`completed`) project, each carrying the same `divergenceFlag` derivation used by the per-project Progress tab (`computeProjectProgress()`, see §1).

There is no `GET /technical/reports/export` route — same gap every prior phase's own Reports screen already left unbuilt.

---

## 10. Cross-module effects of this phase

Technical Unit's arrival changed behavior in modules documented elsewhere:

- **`business-dev.md`'s `Client.activeProjects`** (§1) is no longer the hard-coded `0` placeholder that file describes — it now counts real `Project` documents (`clientId` match, `status !== 'completed'`). That file predates this phase and has not been revised to reflect it.
- **`hr.md`'s Deployment** (§3) gains an optional `projectId` (ref Project) alongside its pre-existing free-text `projectRef` — the two can diverge (`projectRef` is never auto-populated from `projectId` or vice versa). **`hr.md`'s Employee** gains a matching `currentProjectId` (nullable ref Project), kept in sync alongside the existing `currentProjectRef` string whenever a Deployment moves to `active` (both set together) or `completed` (both cleared together, only if the employee has no other `active` deployment) — see `hr.md` §3's `POST /deployments/:id/status`.
- **`platform-core.md`'s Task** (§8) gains two additional, optional typed fields beyond the documented ones: `projectId` (ref Project) and `linkedActivityId` (ref WbsActivity), settable on `POST /tasks` and `PATCH /tasks/:id`, and returned on every Task response. `GET /tasks?projectId=` now actually filters by it — `listTasksQuerySchema` includes `projectId`, and `buildTaskFilter` applies it — giving the frontend a real per-project task view via Platform Core's existing endpoint, per the spec's own note that this reuses "the same underlying collection" rather than needing a dedicated `/projects/:id/tasks` route. **`linkedActivityId` is not filterable** on `GET /tasks` — it's settable on create/update and returned on every response, but there is no query-string filter for it; filtering a WBS activity's tasks client-side (or adding the filter) is left to the frontend for now.

---

## Appendix: reference-code formats (Technical Unit)

| Entity | Format | Resets yearly? | Notes |
|---|---|---|---|
| Project.projectId | `PRJ-NNNN` | No | |
| ProjectLog.logId | `LOG-YYYY-NNNN` | Yes | |
| ResourceRequest.requestId | `RRQ-YYYY-NNNN` | Yes | Deliberately not `REQ-` — that prefix is Administration's `AdministrativeRequest.requestId`. See §4. |
| SiteDiaryEntry.entryId | `SD-YYYY-NNNN` | Yes | |
| EngineeringDocument.documentId | `ED-NNNN` | No | |
| CalibrationRecord.instrumentId | `<type-prefix>-NNN` | No | 3-digit padding, not the system-wide 4. Eight independent per-type counters (`PG`, `TG`, `UTG`, `TW`, `MM`, `CTG`, `GD`, `HT`) — see §8. |
| WbsActivity.wbsCode | free text, e.g. `2.1.1` | N/A | Project-scoped uniqueness, not a global sequence — not generated by `ReferenceSequence` at all. |
| ProjectTimesheet | (no code) | N/A | High-volume log, same reasoning as `ActivityEvent`/`AttendanceRecord` elsewhere in the system. |

All generated counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide within one `{ key, year }` pair. Resource Request's prefix was renamed from `REQ` to `RRQ` specifically to avoid the cross-entity collision that would otherwise exist with Administration's `AdministrativeRequest` (see §4) — every prefix in this module is now unique system-wide.
