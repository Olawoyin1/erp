# PGSL ERP — Business Development API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

The six sections below cover the Business Development phase: Clients, Client Interactions,
Opportunities, Tenders, RFQs, and BD Reports — in the implementation's own dependency order (each
later entity references the ones before it: Opportunity references Client; Tender references
Client and, optionally, Opportunity; RFQ references Client and, optionally, Opportunity and
Tender). The static permission catalogue returned by
`GET /permissions` (see Platform Core's Roles & Permissions section) includes a `businessdev` block (`client`, `interaction`,
`opportunity`, `tender`, `rfq`, `reports` resources). As with every prior phase's catalogue,
several `businessdev.*.export` keys
(`businessdev.client.export`, `businessdev.opportunity.export`, `businessdev.tender.export`,
`businessdev.rfq.export`) are **not wired to any route** — no export endpoint exists for any
Business Development resource. The `reports` resource only defines `view` in the catalogue — there
is no `businessdev.reports.export` key at all, and no `/business-dev/reports/export` route either,
despite both appearing in this module's own internal specification document.

**Unlike Administration's Administrative Requests, Travel Requests, and Movements sections, none of this phase's workflow-shaped entities use a
multi-step approval chain.** AdministrativeRequest, TravelRequest, and Movement each carry a named
`currentStep` that only a `.decide`-permissioned call can advance, one chain step per call, with a
distinct chain length per entity. Opportunity, Tender, and RFQ below have no `currentStep` field at
all — each is a single flat `stage` string, and a single `POST .../advance` endpoint moves it
exactly one step along a fixed, linear sequence. There is no per-step role or department gating:
whoever holds the one blanket permission for that resource can call `/advance` repeatedly end to
end. Don't describe these three as "approval chains" — structurally they're closer to Platform Core's
Documents review (one decision point per transition) than to Administration's multi-step chains.
This is a deliberate, confirmed contrast, not an oversight: the implementation audit for this phase
records it as a negative data point for whether every workflow-shaped entity needs a chain.

---

## Changes since the production review (read this first)

- **A won tender becomes a project, once.** `POST /projects/from-tender/:tenderId` (`technical.project.create`) converts a tender whose stage is `won`: the client, name, estimated value (as the project's approved budget), currency and the tender and opportunity links are carried over, and the body supplies `projectType`, `contractType`, `startDate`, `plannedCompletion` and optionally `projectName`, `location`, `description`, `teamMembers`. A tender can become only one project (`409` on a repeat; a unique index backs it). Registering a project by hand with `relatedTenderId` now requires that tender to be won, belong to the same client and not already be a project; `relatedOpportunityId` must exist and belong to the same client.
- **References are checked.** Creating a tender or an opportunity needs an active client and an active business-development officer.
- **Archiving a client is refused (`409`, with counts)** while the client has an active tender, a project that is not completed, a contract that is not closed, or an invoice with a balance outstanding.

---

## 1. Clients — `/clients`

All routes require authentication. `CLIENT_STATUSES`: `active`, `archived` — **that's it, only
two stored values.** `CLIENT_RELATIONSHIPS` (a chip on every row): `Hot`, `Warm`, `Strategic`,
`Cold` (default `Warm`). Client is the first genuinely **external-party** entity in the system —
Employee and User are both internal; a Client is the organisation PGSL sells to.

**No business reference code existed in the original designs for this entity at all** — `clientId`
(format `CLI-<NNNN>`, permanent register, never resets) was added by the backend to fill a real
gap, the same way every other register-type entity in the system has one. Treat it as this
project's own normalization, not something pulled from a screen.

**`activeTenders` and `activeProjects` are computed at read time on every response, never
stored, and do not appear anywhere in the create/edit Zod schema** — there is no way to `PATCH`
either of them, even though an earlier design iteration showed them as directly-editable number
spinners on the client form. `activeTenders` is a live count of this client's **non-terminal**
Tender documents (`stage` in `received, review, in_preparation, submitted, evaluation,
clarification` — i.e. everything except `won`/`lost`). `activeProjects` is **hard-coded to always
return `0`** — no `Project` entity exists in any phase built so far, so this field is a placeholder
for a future phase, not a real count of anything today. Every Client response (list row or detail)
also carries a derived `isDormant` boolean (`true` when `status: "active"` and either there has
never been an interaction, or the last one was more than 90 days ago) — also not a stored field.

**`status: "dormant"` is not a real value** — only `active`/`archived` are ever stored; "dormant"
is purely the `isDormant` overlay on top of an `active` client. Don't build a status filter/badge
that expects to find `"dormant"` coming back in the `status` field itself.

### `GET /clients`
Permission: `businessdev.client.view`. Paginated. Query: `page`, `limit`, `relationship`
(`Hot|Warm|Strategic|Cold`), `status` (`active|archived`), `bdOfficer` (ObjectId), `sector`
(exact match). Every row in `data` carries the computed `activeTenders`, `activeProjects`,
`isDormant` fields merged in, same as the detail view below.

### `GET /clients/stats`
Permission: `businessdev.client.view`. **Not paginated** (`ok()`).
```json
{
  "data": [
    { "key": "active_clients", "label": "Active Clients", "value": 41 },
    { "key": "dormant_clients", "label": "Dormant Clients", "value": 6 },
    { "key": "archived_clients", "label": "Archived Clients", "value": 3 },
    { "key": "total_clients", "label": "Total Clients", "value": 50 }
  ]
}
```
`active_clients` is non-dormant actives only (`total active - dormant`); `dormant_clients` is the
subset of active clients whose `isDormant` overlay is currently `true`; `total_clients` is active
plus archived combined (every client the company has ever registered).

### `POST /clients`
Permission: `businessdev.client.create`.
```json
{
  "clientName": "Dangote Refinery",
  "sector": "Oil & Gas",
  "primaryContact": "Adaeze Nwafor",
  "email": "adaeze.nwafor@dangote-refinery.com",
  "phone": "+2348021234567",
  "companyAddress": "Lekki Free Trade Zone, Lagos",
  "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "relationship": "Hot",
  "relationshipHistory": "Introduced via NNPC Group's facilities team, Q3 2026"
}
```
`clientName`, `primaryContact`, `email`, `phone`, `bdOfficerId` (ref **Employee**) are required;
`sector`, `companyAddress`, `relationshipHistory` optional; `relationship` defaults `Warm`.
`primaryContact` is **free text** — a person's name, not a reference to any contact entity (there
is no `ClientContact` sub-entity in this implementation).

Response `201`:
```json
{
  "success": true,
  "message": "Client registered successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0m1",
    "clientId": "CLI-0001",
    "clientName": "Dangote Refinery",
    "sector": "Oil & Gas",
    "primaryContact": "Adaeze Nwafor",
    "email": "adaeze.nwafor@dangote-refinery.com",
    "phone": "+2348021234567",
    "companyAddress": "Lekki Free Trade Zone, Lagos",
    "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
    "relationship": "Hot",
    "relationshipHistory": "Introduced via NNPC Group's facilities team, Q3 2026",
    "lastInteractionAt": null,
    "status": "active",
    "archivedAt": null,
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`clientId` is generated as `CLI-<NNNN>`, permanent, never resets.

### `GET /clients/:id`
Permission: `businessdev.client.view`. **Not paginated** — a single resource, with the computed
`activeTenders`/`activeProjects`/`isDormant` fields merged onto the client document.

### `PATCH /clients/:id`
Permission: `businessdev.client.update`. All create fields optional. Blocked
(`409 INVALID_STATE_TRANSITION`, "An archived client cannot be edited") once `status: "archived"`.
Message "Client updated successfully".

### `POST /clients/:id/archive`
Permission: `businessdev.client.archive` — note this is its **own** dedicated permission key, not
`decide`. (Opportunity, Tender, and RFQ below all gate their equivalent terminal actions behind a
shared `decide` permission instead — Client is the one BD resource with a standalone `archive`
key, matching the catalogue exactly.)
```json
{ "reason": "Client relationship wound down — refinery project completed, no active pipeline" }
```
`reason` required. Already-archived → `409 INVALID_STATE_TRANSITION` ("This client is already
archived"). No cascade: existing Tenders/Opportunities/RFQs tied to an archived client are left
untouched. Message "Client archived successfully".

### `GET /clients/:id/tenders`
Permission: `businessdev.client.view`. **Paginated** — the Profile view's Tenders tab, a thin
wrapper over `GET /tenders?clientId=:id` (same `tenders` array/`meta` shape as the Tenders section
below).

### `GET /clients/:id/interactions`
Permission: `businessdev.client.view`. **Paginated** — the Interactions tab, a thin wrapper over
`GET /interactions?clientId=:id` (the Client Interactions section below).

### `GET /clients/:id/notes`
Permission: `businessdev.client.view`. **Not paginated** — full array, newest first. Backed by the
same generic polymorphic `Note` model (`subjectType`/`subjectId`) that Tender's Notes tab uses
(see the Tenders section below) — one shared collection for both entities' "Notes" tab, not two separate systems.
```json
{
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7a8b9c0n1",
      "subjectType": "Client",
      "subjectId": "65f1a2b3c4d5e6f7a8b9c0m1",
      "note": "Procurement lead confirmed budget approval expected end of Q4.",
      "authorId": "65f1a2b3c4d5e6f7a8b9c0d1",
      "createdAt": "2026-10-03T09:00:00.000Z",
      "updatedAt": "2026-10-03T09:00:00.000Z"
    }
  ]
}
```

### `POST /clients/:id/notes`
Permission: `businessdev.client.update` — note this reuses the **update** permission, not a
separate notes permission. Append-only.
```json
{ "note": "Follow-up call scheduled for next Tuesday to discuss the tender timeline." }
```
Response `201`, message "Note added successfully". There is no edit/delete route for a note once
added.

---

## 2. Client Interactions — `/interactions`

All routes require authentication. Mounted at `/interactions`, **not** `/client-interactions`.
`INTERACTION_TYPES` (an open chip vocabulary, not restricted further): `Meeting`, `Call`, `Email`,
`Site Visit`, `Presentation`. **No business reference code** — same reasoning as Platform Core's
ActivityEvent and HR's AttendanceRecord: a high-volume log, internal id only.

### `GET /interactions`
Permission: `businessdev.interaction.view`. Paginated. Query: `page`, `limit`, `clientId`, `type`,
`followUpRequired` (boolean).

### `GET /interactions/stats`
Permission: `businessdev.interaction.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_interactions", "label": "Total Interactions", "value": 312 },
    { "key": "this_month", "label": "This Month", "value": 48 },
    { "key": "pending_follow_ups", "label": "Pending Follow-ups", "value": 21 },
    { "key": "meetings_completed", "label": "Meetings Completed", "value": 37 }
  ]
}
```
`pending_follow_ups` counts interactions where `followUpRequired: true` and that do not yet have a
follow-up interaction logged against them (i.e. no other `ClientInteraction` exists with this one
as its `parentInteractionId`) — it is a backlog count of follow-ups still owed, regardless of
whether `followUpDate` has passed, not a count of upcoming-and-not-yet-due follow-ups.
`meetings_completed` is simply every interaction with `type: "Meeting"` (not filtered by whether
anything was actually completed).

### `POST /interactions`
Permission: `businessdev.interaction.create`.
```json
{
  "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
  "date": "2026-10-02T10:00:00.000Z",
  "primaryContact": "Adaeze Nwafor",
  "email": "adaeze.nwafor@dangote-refinery.com",
  "type": "Meeting",
  "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "followUpRequired": true,
  "followUpDate": "2026-10-09T10:00:00.000Z",
  "summary": "Walked through the draft tender timeline; client wants a revised BOQ by Friday."
}
```
`clientId`, `date`, `primaryContact`, `type`, `bdOfficerId`, `summary` required; `email` optional;
`followUpRequired` defaults `false`. `followUpDate` is required **only on this create endpoint**
when `followUpRequired: true` (`422 VALIDATION_ERROR` otherwise) — `primaryContact` is free text,
denormalised from the client rather than looked up, since different people attend different
meetings for the same client.

Response `201`, message "Interaction logged successfully". **Side effect:** sets
`Client.lastInteractionAt` to this interaction's own `date` field (not the server's current time)
— logging a backdated interaction will move `lastInteractionAt` backwards if the given `date` is
earlier than whatever was already stored.

### `GET /interactions/:id`
Permission: `businessdev.interaction.view`.

### `PATCH /interactions/:id`
Permission: `businessdev.interaction.update`. Same fields as create minus `clientId` (which can
never be changed), all optional. **Unlike create, the `followUpRequired`/`followUpDate`
cross-field requirement is not re-enforced on update** — the same create-only-validation asymmetry
documented elsewhere in this API (e.g. `administration.md`'s Travel Requests section).

### `POST /interactions/:id/follow-up`
Permission: `businessdev.interaction.create` — the **same** permission as logging a fresh
interaction, not `update`. This is a **separate endpoint that creates a brand-new
ClientInteraction document**, not a flag or field set on the original. `:id` in the path is the
**parent** interaction being followed up on.
```json
{
  "date": "2026-10-09T10:00:00.000Z",
  "primaryContact": "Adaeze Nwafor",
  "type": "Meeting",
  "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "followUpRequired": false,
  "summary": "Revised BOQ delivered and reviewed; client confirmed alignment, moving to tender issue."
}
```
There is no `clientId` field in this body — it's silently inherited from the parent interaction.
Note this endpoint's own schema does **not** carry the `followUpRequired`/`followUpDate`
cross-field check either (that refinement only exists on the plain log schema), so a follow-up
logged with `followUpRequired: true` and no `followUpDate` will pass validation here.

Response `201`:
```json
{
  "success": true,
  "message": "Follow-up interaction logged successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0n9",
    "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
    "parentInteractionId": "65f1a2b3c4d5e6f7a8b9c0n5",
    "date": "2026-10-09T10:00:00.000Z",
    "primaryContact": "Adaeze Nwafor",
    "type": "Meeting",
    "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
    "followUpRequired": false,
    "summary": "Revised BOQ delivered and reviewed; client confirmed alignment, moving to tender issue.",
    "createdAt": "2026-10-09T10:00:00.000Z",
    "updatedAt": "2026-10-09T10:00:00.000Z"
  }
}
```
`parentInteractionId` points back at the original (self-referential on `ClientInteraction`). Also
sets `Client.lastInteractionAt` to this follow-up's `date`, same side effect as a plain log. The
endpoint does not itself fetch or echo the parent's summary for you — if the frontend wants to show
"previous meeting said: …" context in the follow-up modal, it already has the parent record from
having opened it (or can re-fetch via `GET /interactions/:id`).

---

## 3. Opportunities — `/opportunities`

All routes require authentication. `OPPORTUNITY_TYPES` (7-value dropdown): `Tender`, `Maintenance`,
`Engineering Services`, `Consultancy`, `Equipment Supply`, `Material Supply`, `Construction`.
`OPPORTUNITY_PRIORITIES`: `Low`, `Medium`, `High`, `Hot` (default `Medium`) — a `Critical` value
seen once in the original designs was treated as a one-off Figma artefact, not a real fifth level,
and is **not** part of this enum.

**`OPPORTUNITY_STAGES` (7 values, exported verbatim from the model):**
```
lead, contacted, meeting_held, proposal_discussed, qualified, converted_to_tender, lost
```
**`OPPORTUNITY_CHAIN` (the advanceable subset, 5 of those 7 values) — moved through one step at a
time via `POST /:id/advance`:**
```
lead → contacted → meeting_held → proposal_discussed → qualified
```
`converted_to_tender` and `lost` are reached only via the two dedicated endpoints below
(`/convert-to-tender`, `/lost`), never via `/advance` — once in either of those two states, the
opportunity is terminal and `/advance` always rejects it.

**This is a single-actor linear pipeline, not an approval chain** — see the note at the top of this
file. Every transition here is one call by one person; there is no multi-step
review/approval concept for Opportunity at all.

### `GET /opportunities`
Permission: `businessdev.opportunity.view`. Paginated. Query: `page`, `limit`, `stage` (any of the
7 `OPPORTUNITY_STAGES` values), `clientId`, `bdOfficer` (ObjectId), `opportunityType`.

### `GET /opportunities/stats`
Permission: `businessdev.opportunity.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_opportunities", "label": "Total Opportunities", "value": 64 },
    { "key": "qualified", "label": "Qualified", "value": 9 },
    { "key": "converted_to_tender", "label": "Converted to Tender", "value": 22 },
    { "key": "lost", "label": "Lost", "value": 11 }
  ]
}
```

### `GET /opportunities/board`
Permission: `businessdev.opportunity.view`. **Not paginated** — every opportunity grouped by
`stage` for a kanban view, including empty arrays for stages with no rows, sorted by
`expectedCloseDate` ascending within each group:
```json
{
  "data": {
    "lead": [ { "...opportunity": "..." } ],
    "contacted": [],
    "meeting_held": [],
    "proposal_discussed": [],
    "qualified": [ { "...opportunity": "..." } ],
    "converted_to_tender": [],
    "lost": []
  }
}
```

### `POST /opportunities`
Permission: `businessdev.opportunity.create`.
```json
{
  "title": "FPSO Topside Maintenance Contract",
  "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
  "opportunityType": "Maintenance",
  "estimatedValue": 850000000000,
  "probability": 60,
  "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "expectedCloseDate": "2026-12-15",
  "description": "Multi-year topside maintenance contract for the FPSO, following an informal introduction at the Q3 client review.",
  "priority": "Hot"
}
```
`title`, `clientId`, `opportunityType`, `estimatedValue`, `probability` (0–100), `bdOfficerId`,
`expectedCloseDate` required; `description` optional; `priority` defaults `Medium`.
`estimatedValue` is in kobo, same money convention as everywhere else in this API.

Response `201`:
```json
{
  "success": true,
  "message": "Opportunity created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0o1",
    "opportunityId": "OPP-2026-0001",
    "title": "FPSO Topside Maintenance Contract",
    "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
    "opportunityType": "Maintenance",
    "estimatedValue": 850000000000,
    "probability": 60,
    "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
    "expectedCloseDate": "2026-12-15T00:00:00.000Z",
    "description": "Multi-year topside maintenance contract for the FPSO, following an informal introduction at the Q3 client review.",
    "stage": "lead",
    "relatedTenderId": null,
    "priority": "Hot",
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`opportunityId` is generated as `OPP-<YYYY>-<NNNN>`, resets yearly — same gap-filling rationale as
Client's `clientId`: no code was evidenced in the original designs for this entity either.
`weightedValue` (`estimatedValue × probability / 100`) is **never stored or returned** by any
endpoint — compute it client-side if the UI needs it.

### `GET /opportunities/:id`
Permission: `businessdev.opportunity.view`.

### `PATCH /opportunities/:id`
Permission: `businessdev.opportunity.update`. Same fields as create, all optional. Blocked
(`409 INVALID_STATE_TRANSITION`, "A lost or converted opportunity cannot be edited") once `stage`
is `lost` or `converted_to_tender`. There is no `stage` field in this schema — `stage` can only be
changed via `/advance`, `/lost`, or `/convert-to-tender` below, never by a direct `PATCH`.

### `POST /opportunities/:id/advance`
Permission: `businessdev.opportunity.update` — note this is `update`, not `decide`. No body.
Moves the opportunity exactly one step along `OPPORTUNITY_CHAIN`. A fresh opportunity starts at
`lead`; four successive calls walk it to `qualified`:

| Call | `stage` before | `stage` after |
|---|---|---|
| 1st advance | `lead` | `contacted` |
| 2nd advance | `contacted` | `meeting_held` |
| 3rd advance | `meeting_held` | `proposal_discussed` |
| 4th advance | `proposal_discussed` | `qualified` |
| 5th advance | `qualified` | **`409 INVALID_STATE_TRANSITION`** |

The 5th call fails with: *"This opportunity has reached the end of the pipeline — convert it to a
Tender or mark it lost"* — `qualified` is the last entry in `OPPORTUNITY_CHAIN`, so there is no
next step to advance to; the frontend must call `/convert-to-tender` or `/lost` instead. Calling
`/advance` on an opportunity already at `lost` or `converted_to_tender` (neither of which is in
`OPPORTUNITY_CHAIN` at all) fails the same way, with message *"Cannot advance an opportunity from
'lost'"* (or `'converted_to_tender'`).

### `POST /opportunities/:id/lost`
Permission: `businessdev.opportunity.decide`.
```json
{ "reason": "Client awarded the maintenance contract to an incumbent vendor already on site" }
```
`reason` required. Available from **any** non-terminal stage (not just the end of the chain) —
blocked (`409 INVALID_STATE_TRANSITION`) only if already `lost` or `converted_to_tender`. Message
"Opportunity marked as lost".

### `POST /opportunities/:id/convert-to-tender`
Permission: `businessdev.opportunity.decide`. No body. **The one multi-document operation in this
entire module.** Only valid from `stage: "qualified"` — any other stage →
`409 INVALID_STATE_TRANSITION` ("Only a qualified opportunity can be converted to a Tender").

Creates a brand-new Tender (own `TEN-<YYYY>-<NNNN>` code, `stage: "received"`, `tenderName` copied
from the Opportunity's `title`, plus `clientId`/`estimatedValue`/`bdOfficerId`/`priority`/
`description` all copied over, `relatedOpportunityId` set to this Opportunity), then does a
**conditional update** on the Opportunity itself (filtered on `_id` **and** `stage: "qualified"`
still being true at the moment of the write) to set `stage: "converted_to_tender"` and
`relatedTenderId`. If that conditional update finds no match — i.e. the opportunity was advanced,
lost, or converted again by someone else in the gap between the initial read and this write — it
returns **`409 CONFLICT`** ("This opportunity was modified concurrently and could not be
converted"), **not** a validation error. Note this is a real race-detection conflict, distinct from
the ordinary "wrong stage" `409 INVALID_STATE_TRANSITION` above. Because this module avoids
multi-document transactions (MongoDB standalone, no replica set), the new Tender record is **not
rolled back** if the conflict happens — it has already been created and committed before the
Opportunity's conditional update runs. A crashed/conflicted conversion can leave an orphan Tender
whose `relatedOpportunityId` points at an Opportunity that never got updated to match; this is a
documented, accepted risk in the implementation, not a bug.

Response `201`:
```json
{
  "success": true,
  "message": "Tender created from opportunity successfully",
  "data": {
    "opportunity": {
      "_id": "65f1a2b3c4d5e6f7a8b9c0o1",
      "opportunityId": "OPP-2026-0001",
      "stage": "converted_to_tender",
      "relatedTenderId": "65f1a2b3c4d5e6f7a8b9c0t1",
      "...": "..."
    },
    "tenderId": "65f1a2b3c4d5e6f7a8b9c0t1"
  }
}
```
**Read the response shape carefully: this endpoint returns `{ opportunity, tenderId }`, not just
the updated Opportunity.** And `tenderId` here is the new Tender's **Mongo `_id`** (the same value
as `opportunity.relatedTenderId`) — **not** its human-readable business code (`TEN-2026-0001`).
This is the same string as `data.opportunity.relatedTenderId`, just surfaced at the top level for
convenience so the frontend can immediately route to `GET /tenders/:tenderId` without re-reading
the opportunity. If the UI needs the `TEN-` code to display, it must follow up with that `GET` call
— this endpoint does not return it directly.

---

## 4. Tenders — `/tenders`

All routes require authentication. Tenders can be created **standalone** (this section's own
`POST /tenders`) or **via Opportunity conversion** (the Opportunities section above's
`/convert-to-tender`) — both paths produce an identical Tender document; conversion just also sets
`relatedOpportunityId`.

**`TENDER_STAGES` (8 values, exported verbatim from the model — the single richest piece of stage
evidence in the whole module):**
```
received, review, in_preparation, submitted, evaluation, clarification, won, lost
```
**`TENDER_CHAIN` (the advanceable subset, 6 of those 8 values):**
```
received → review → in_preparation → submitted → evaluation → clarification
```
`won` and `lost` are reached only via `POST /:id/decide` below, never via `/advance`.

**This is a single-actor linear pipeline, like Opportunity above — not an approval chain.** One
`/advance` call per step, no per-step role gating, no `currentStep`.

### `GET /tenders`
Permission: `businessdev.tender.view`. Paginated. Query: `page`, `limit`, `stage` (any of the 8
`TENDER_STAGES` values), `clientId`, `priority` (`Low|Medium|High|Hot`).

### `GET /tenders/stats`
Permission: `businessdev.tender.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_tenders", "label": "Total Tenders", "value": 37 },
    { "key": "in_progress", "label": "In Progress", "value": 14 },
    { "key": "won", "label": "Won", "value": 18 },
    { "key": "lost", "label": "Lost", "value": 5 }
  ]
}
```
`in_progress` counts every tender whose `stage` is one of the 6 `TENDER_CHAIN` values (i.e. not yet
`won` or `lost`).

### `POST /tenders`
Permission: `businessdev.tender.create`.
```json
{
  "tenderName": "FPSO Topside Maintenance — ITT 2026/014",
  "clientTenderRef": "TOTAL/FPSO/2026/014",
  "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
  "estimatedValue": 850000000000,
  "currency": "NGN",
  "receivedDate": "2026-10-01",
  "submissionDeadline": "2026-11-15",
  "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "priority": "Hot",
  "description": "Formal ITT received following the qualified maintenance opportunity discussion."
}
```
`tenderName`, `clientId`, `estimatedValue`, `bdOfficerId` required; `clientTenderRef` (the
**client's own** reference number — distinct from PGSL's internal `tenderId`), `relatedOpportunityId`,
`receivedDate`, `submissionDeadline`, `description` all optional; `currency` defaults `NGN` (a real
field, not a hard-coded display string); `priority` defaults `Medium`. `receivedDate` must be ≤
`submissionDeadline` when both are present — unlike Administration's TravelRequest, **this
cross-field check is re-validated on `PATCH` as well as on create**, not create-only.

Response `201`:
```json
{
  "success": true,
  "message": "Tender created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0t1",
    "tenderId": "TEN-2026-0001",
    "tenderName": "FPSO Topside Maintenance — ITT 2026/014",
    "clientTenderRef": "TOTAL/FPSO/2026/014",
    "relatedOpportunityId": null,
    "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
    "estimatedValue": 850000000000,
    "currency": "NGN",
    "stage": "received",
    "decision": null,
    "receivedDate": "2026-10-01T00:00:00.000Z",
    "submissionDeadline": "2026-11-15T00:00:00.000Z",
    "bdOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
    "priority": "Hot",
    "description": "Formal ITT received following the qualified maintenance opportunity discussion.",
    "archivedAt": null,
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`tenderId` is generated as `TEN-<YYYY>-<NNNN>`, resets yearly.

### `GET /tenders/:id`
Permission: `businessdev.tender.view`.

### `PATCH /tenders/:id`
Permission: `businessdev.tender.update`. Same fields as create, all optional. Blocked
(`409 INVALID_STATE_TRANSITION`, "A decided or archived tender cannot be edited") once `stage` is
`won`/`lost` **or** `archivedAt` is set.

### `GET /tenders/:id/documents`
Permission: `businessdev.tender.view`. **Not paginated** — the Document tab, full array of this
tender's polymorphic `Attachment` records (`subjectType: "Tender"`).

### `POST /tenders/:id/documents`
Permission: `businessdev.tender.update`. `multipart/form-data`, field `file`. Returns the created
`Attachment` (`201`), linked to this tender via `subjectType: "Tender"`, message "Document uploaded
successfully".

### `GET /tenders/:id/activity-log`
Permission: `businessdev.tender.view`. **Paginated** (`page`/`limit`, max 100) — a wrapper over
`GET /activity/Tender/:id` (see platform-core.md's Activity section), reusing Platform Core's
`ActivityEvent` collection. Every Tender transition (`tender.created`, `tender.stage_advanced`,
`tender.decided`, plus `tender.created_from_opportunity` when the tender originated from a
conversion) appears here.

### `GET /tenders/:id/notes`
Permission: `businessdev.tender.view`. **Not paginated** — same shared `Note` model
(`subjectType: "Tender"`) as Client's Notes tab (see the Clients section above), not a second,
separate notes system.

### `POST /tenders/:id/notes`
Permission: `businessdev.tender.update`.
```json
{ "note": "Client's procurement lead requested a one-week extension on the submission deadline." }
```
Response `201`, message "Note added successfully".

### `POST /tenders/:id/advance`
Permission: `businessdev.tender.update`. No body. Moves one step along the 6-value
`TENDER_CHAIN`. A fresh standalone tender starts at `received`; five successive calls reach
`clarification`:

| Call | `stage` before | `stage` after |
|---|---|---|
| 1st advance | `received` | `review` |
| 2nd advance | `review` | `in_preparation` |
| 3rd advance | `in_preparation` | `submitted` |
| 4th advance | `submitted` | `evaluation` |
| 5th advance | `evaluation` | `clarification` |
| 6th advance | `clarification` | **`409 INVALID_STATE_TRANSITION`** |

The 6th call fails with *"This tender is at its final pre-decision stage — decide it as awarded or
not awarded"*. Calling `/advance` on a tender already `won` or `lost` fails with *"Cannot advance a
tender from 'won'"* (or `'lost'`).

### `POST /tenders/:id/decide`
Permission: `businessdev.tender.decide`.
```json
{ "decision": "awarded" }
```
`decision` ∈ `awarded | not_awarded`. **Only valid from `stage: "clarification"`**
(`409 INVALID_STATE_TRANSITION`, "A tender can only be decided from the Clarification stage",
otherwise) — this single stage check also covers re-decision attempts, since `stage` always leaves
`clarification` the instant a decision is recorded, so there's no separate "already decided" error
to watch for. **The `decision` value and the resulting `stage` value are deliberately not the same
strings:**

| `decision` sent | `stage` set to |
|---|---|
| `"awarded"` | `"won"` |
| `"not_awarded"` | `"lost"` |

Response: the full Tender document with both `decision` and `stage` updated, message "Tender
decision recorded".

### `POST /tenders/:id/archive`
Permission: `businessdev.tender.decide` — note archive is gated by the `decide` permission here,
not a separate `archive` key (contrast Client, see the Clients section above, which has its own
dedicated `archive` permission). No body. Blocked (`409 INVALID_STATE_TRANSITION`, "This tender is
already archived") only if already archived — **there is no stage precondition**: a tender can be
archived from any stage, including `received` or mid-chain, not only after being `won`/`lost`. This
is a genuine asymmetry against RFQ's own `/archive` below, which does require a decided stage first
— both behaviors are implemented exactly as shown, not harmonized.

---

## 5. RFQs — `/rfqs`

All routes require authentication. RFQ (Request for Quotation) is a separate top-level entity from
Tender, with its own nav item, own reference-code prefix, and its own stage vocabulary — structurally
similar in shape to Tender's pipeline, but **not** the same entity and **not** interchangeable with
it. `RFQ_TYPES` (6-value dropdown): `Goods`, `Materials`, `Equipment`, `Services`, `Works`, `Other`.

**`RFQ_STAGES` (5 values, exported verbatim from the model):**
```
received, in_progress, submitted, awarded, lost
```
**`RFQ_CHAIN` (the advanceable subset, 3 of those 5 values):**
```
received → in_progress → submitted
```
`awarded` and `lost` are reached only via the dedicated `/awarded`/`/lost` endpoints below, never
via `/advance`.

**An RFQ can optionally link to both an Opportunity and a Tender at the same time** —
`linkedOpportunityId` and `linkedTenderId` are two independent, nullable fields, not an either/or
choice. An RFQ can exist with neither, either, or both set.

**Single-actor linear pipeline, same contrast as Opportunity and Tender above** — no approval
chain, no `currentStep`.

### `GET /rfqs`
Permission: `businessdev.rfq.view`. Paginated. Query: `page`, `limit`, `stage` (any of the 5
`RFQ_STAGES` values), `clientId`, `rfqType` (any of the 6 `RFQ_TYPES` values).

### `GET /rfqs/stats`
Permission: `businessdev.rfq.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_rfqs", "label": "Total RFQs", "value": 29 },
    { "key": "in_progress", "label": "In Progress", "value": 12 },
    { "key": "awarded_rfqs", "label": "Awarded RFQs", "value": 10 },
    { "key": "lost_rfqs", "label": "Lost RFQs", "value": 7 }
  ]
}
```

### `POST /rfqs`
Permission: `businessdev.rfq.create`.
```json
{
  "rfqTitle": "Pricing Request — Fire Suppression System Parts",
  "clientId": "65f1a2b3c4d5e6f7a8b9c0m1",
  "clientRfqRef": "NNPC/RFQ/2026/0148",
  "clientRequestingOfficer": "Chinedu Okafor",
  "linkedOpportunityId": "65f1a2b3c4d5e6f7a8b9c0o1",
  "linkedTenderId": "65f1a2b3c4d5e6f7a8b9c0t1",
  "estimatedValue": 42000000,
  "currency": "NGN",
  "rfqType": "Equipment",
  "assignedOfficerId": "65f1a2b3c4d5e6f7a8b9c0d9",
  "issueDate": "2026-10-02",
  "deadline": "2026-10-16",
  "priority": "Medium",
  "rfqDescription": "Client requesting pricing for replacement fire suppression parts ahead of the main tender award."
}
```
`rfqTitle`, `clientId`, `estimatedValue`, `rfqType`, `assignedOfficerId` required;
`clientRfqRef` (the client's own reference number), `clientRequestingOfficer` (free text — an
external contact name, same unmodelled-contact gap as Client's `primaryContact`),
`linkedOpportunityId`, `linkedTenderId`, `issueDate`, `deadline`, `rfqDescription` all optional and
fully independent of each other, as shown above with both links set at once; `currency` defaults
`NGN`; `priority` defaults `Medium`. `issueDate` must be ≤ `deadline` when both are present — same
as Tender, this is re-validated on `PATCH` too, not create-only.

Response `201`, `rfqId: "RFQ-2026-0001"` (resets yearly), `stage: "received"`. Message "RFQ logged
successfully".

### `GET /rfqs/:id`
Permission: `businessdev.rfq.view`.

### `PATCH /rfqs/:id`
Permission: `businessdev.rfq.update`. Same fields as create, all optional. Blocked
(`409 INVALID_STATE_TRANSITION`, "A decided or archived RFQ cannot be edited") once `stage` is
`awarded`/`lost` **or** `archivedAt` is set.

### `GET /rfqs/:id/documents`
Permission: `businessdev.rfq.view`. **Not paginated** — the Document tab, full array of this RFQ's
polymorphic `Attachment` records (`subjectType: "Rfq"`), the same shared `Attachment` model used by
Tender's Document tab above.

### `POST /rfqs/:id/documents`
Permission: `businessdev.rfq.update`. `multipart/form-data`, field `file`. Returns the created
`Attachment` (`201`), linked to this RFQ via `subjectType: "Rfq"`, message "Document uploaded
successfully".

### `GET /rfqs/:id/activity-log`
Permission: `businessdev.rfq.view`. **Paginated** (`page`/`limit`, max 100) — a wrapper over the
same timeline platform-core.md's Activity section's `GET /activity/Rfq/:id` would return, reusing
Platform Core's `ActivityEvent` collection, the same wrapper pattern as Tender's activity log above.
Every RFQ transition (`rfq.logged`, `rfq.stage_advanced`, `rfq.awarded`/`rfq.lost`, `rfq.archived`)
appears here.

### `GET /rfqs/:id/notes`
Permission: `businessdev.rfq.view`. **Not paginated** — same shared `Note` model
(`subjectType: "Rfq"`) as Client's and Tender's Notes tabs, not a separate notes system.

### `POST /rfqs/:id/notes`
Permission: `businessdev.rfq.update`.
```json
{ "note": "Client's procurement lead requested a one-week extension on the submission deadline." }
```
Response `201`, message "Note added successfully".

### `POST /rfqs/:id/advance`
Permission: `businessdev.rfq.update`. No body. Moves one step along the 3-value `RFQ_CHAIN`:

| Call | `stage` before | `stage` after |
|---|---|---|
| 1st advance | `received` | `in_progress` |
| 2nd advance | `in_progress` | `submitted` |
| 3rd advance | `submitted` | **`409 INVALID_STATE_TRANSITION`** |

The 3rd call fails with *"This RFQ is at its final pre-decision stage — mark it awarded or lost"*.
Calling `/advance` on an RFQ already `awarded` or `lost` fails with *"Cannot advance an RFQ from
'awarded'"* (or `'lost'`).

### `POST /rfqs/:id/awarded`
Permission: `businessdev.rfq.decide`. No body. Only valid from `stage: "submitted"`
(`409 INVALID_STATE_TRANSITION`, "An RFQ can only be decided from the Submitted stage", otherwise).
Sets `stage: "awarded"`. Message "RFQ marked as awarded".

### `POST /rfqs/:id/lost`
Permission: `businessdev.rfq.decide`. No body. Same `submitted`-only precondition as `/awarded`.
Sets `stage: "lost"`. Message "RFQ marked as lost".

### `POST /rfqs/:id/archive`
Permission: `businessdev.rfq.decide`. No body. **Unlike Tender's `/archive`, this one does check
stage**: only valid once `stage` is `awarded` or `lost` (`409 INVALID_STATE_TRANSITION`, "Only a
decided RFQ can be archived", otherwise); also blocked if already archived ("This RFQ is already
archived"). Message "RFQ archived".

---

## 6. Business Dev Reports — `/business-dev/reports`

### `GET /business-dev/reports`
Permission: `businessdev.reports.view`. **Not paginated** — a single dashboard payload, the richest
report shape in the system so far (tiles **and** charts **and** a funnel).
```json
{
  "success": true,
  "message": null,
  "data": {
    "tiles": [
      { "key": "total_pipeline_value", "label": "Total Pipeline Value", "value": 4120000000000 },
      { "key": "monthly_revenue_won", "label": "Monthly Revenue Won", "value": 850000000000 },
      { "key": "total_clients", "label": "Total Clients", "value": 41 },
      { "key": "open_rfqs", "label": "Open RFQs", "value": 12 }
    ],
    "charts": [
      {
        "key": "rfq_performance",
        "title": "RFQ Performance",
        "type": "bar",
        "series": [
          { "label": "Awarded", "value": 10 },
          { "label": "Lost", "value": 7 },
          { "label": "In Progress", "value": 12 }
        ]
      },
      {
        "key": "tender_outcome_analysis",
        "title": "Tender Outcome Analysis",
        "type": "bar",
        "series": [
          { "label": "Won", "value": 18 },
          { "label": "Lost", "value": 5 },
          { "label": "In Progress", "value": 14 }
        ]
      }
    ],
    "funnel": [
      { "stage": "lead", "count": 20, "percentOfTotal": 100 },
      { "stage": "contacted", "count": 14, "percentOfTotal": 70 },
      { "stage": "meeting_held", "count": 11, "percentOfTotal": 55 },
      { "stage": "proposal_discussed", "count": 8, "percentOfTotal": 40 },
      { "stage": "qualified", "count": 9, "percentOfTotal": 45 },
      { "stage": "converted_to_tender", "count": 22, "percentOfTotal": 110 }
    ]
  }
}
```
`total_pipeline_value` sums `estimatedValue` across every **non-terminal** Opportunity (stage in
`OPPORTUNITY_CHAIN`) plus every **non-terminal** Tender (stage in `TENDER_CHAIN`) — it excludes
`lost`/`converted_to_tender` opportunities and `won`/`lost` tenders. `monthly_revenue_won` sums
`estimatedValue` across Tenders with `stage: "won"` **and** `updatedAt` within the current calendar
month — it uses `updatedAt` as a proxy for "the moment it was won" (there is no separate
`decidedAt`/`wonAt` timestamp field on Tender), so any unrelated edit to an already-won tender
within the month would also count toward this tile; this is a real simplification to be aware of,
not a bug. `total_clients` counts only `status: "active"` clients (archived ones excluded).
`open_rfqs` counts RFQs in the 3 `RFQ_CHAIN` stages.

Both charts are **counts of records**, not revenue amounts, despite sitting next to money tiles.

**The funnel is a current-stage snapshot, not a true historical cohort funnel** — each entry is
simply "how many Opportunities are sitting at this stage right now," not "how many ever reached at
least this stage." This is why the numbers are not monotonically decreasing (`qualified`'s count of
9 is higher than `proposal_discussed`'s 8 in the sample above, and `converted_to_tender` can exceed
100% of the `lead`-stage count used as the denominator) — a real cohort funnel would require
reconstructing each Opportunity's full stage history from `ActivityEvent`, which this endpoint does
not do. Don't present this funnel's percentages as true pipeline conversion rates without this
caveat.

There is no `GET /business-dev/reports/export` route, even though BD's own internal specification
describes one — same "export key exists in the permission catalogue/spec but no route was built"
pattern as every other phase, except here there isn't even a `businessdev.reports.export`
permission key to begin with.

---

## Appendix: reference-code formats (Business Development)

| Entity | Format | Resets yearly? |
|---|---|---|
| Client.clientId | `CLI-NNNN` | No |
| Opportunity.opportunityId | `OPP-YYYY-NNNN` | Yes |
| Tender.tenderId | `TEN-YYYY-NNNN` | Yes |
| RFQ.rfqId | `RFQ-YYYY-NNNN` | Yes |

All counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide.

**Client and Opportunity are the only two entities in the entire system with no reference code evidenced in the original designs at all** — not even a code field that was shown empty or inconsistently formatted, the way almost every other register/transactional entity in Platform Core, HR, and Administration has. `CLI-<NNNN>` and `OPP-<YYYY>-<NNNN>` were both added by this implementation purely to fill that gap and keep Business Development consistent with every other phase's convention, not because either format was pulled from a screen. `ClientInteraction` has no code at all, by design — it's a high-volume log, the same reasoning already applied to `ActivityEvent` and `AttendanceRecord`.
