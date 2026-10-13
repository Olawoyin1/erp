# PGSL ERP — Administration API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

The eight sections below cover the Administration phase: Assets & Supplies, Administrative Requests, Travel & Logistics (Travel Requests and Equipment Movement), Facility Maintenance, Memos & Circulars, and Waste & Disposal. The static permission catalogue returned by `GET /permissions` (see Platform Core's Roles & Permissions section) includes an `administration` block (`asset`, `supplyitem`, `adminrequest`, `travelrequest`, `movement`, `facilitymaintenance`, `memo`, `disposal` resources). As with Platform Core's and HR's catalogues, several `administration.*.export` keys (`administration.asset.export`, `administration.supplyitem.export`, `administration.adminrequest.export`, `administration.travelrequest.export`, `administration.movement.export`, `administration.facilitymaintenance.export`, `administration.disposal.export`) are **not wired to any route** — no export endpoint exists for any Administration resource. There is also no `administration.memo.export` key at all (the `memo` resource only defines `view` and `send`).

---

## Changes since the production review (read this first)

- **Approval chains need a permission per step, and one person cannot approve two steps.** Administrative requests: `admin_review` needs `administration.adminrequest.decide`, `procurement_review` needs `decide-procurement`, `finance_approval` needs `decide-finance`, `final_approval` needs `decide-final`. Travel requests: `admin_approval` needs `decide`, `finance_approval` `decide-finance`, `final_approval` `decide-final`. `POST /:id/approve` is open to anyone holding any of those keys but the server checks the key for the **current** step (`403` naming the missing permission) and refuses an actor who approved an earlier step of the same request. Each approval is recorded in `approvals[]` (`step`, `by`, `at`). The requester cannot approve their own request. A Super Admin keeps the bypass. Notifications for a step go to the people who hold that step's key.
- **Assets and the ledger.** `POST /assets` capitalises the purchase to the ledger (set `capitalise: false` for assets already on the books) and accepts `acquisitionPayable` (a vendor invoice already booked, which is then reclassified from expense to fixed assets) and `bankAccount`. Depreciation posts yearly: automatically on 2 January for the previous year, or `POST /assets/depreciation/post { "year": 2026 }` (`administration.asset.transition`). `POST /assets/:id/retire` accepts `proceeds` (kobo) and `bankAccount` and books the disposal gain or loss; retiring is an atomic claim and cannot happen twice.
- **Memos are private to their people.** A memo is visible only to its sender and its recipients; anyone else gets `404` (detail, PDF, attachments). Only the sender can send a draft or add attachments. Forwarding needs you to be a recipient or the sender. `GET /memos/:id/pdf` now returns a **PDF** (reference, from, to, cc, date, priority, body).

---

## 1. Assets — `/assets`

All routes require authentication. `ASSET_STATUSES`: `active`, `in_maintenance`, `on_loan`,
`retired`. `ASSET_CONDITIONS`: `good`, `fair`, `poor`. Every asset returned (list or detail)
has a computed `allowedActions` array merged in — **not** a stored field — reflecting the
status-dependent action set the frontend should render:

| Status | `allowedActions` |
|---|---|
| `active` | `["edit", "transfer", "retire"]` |
| `in_maintenance` | `["edit", "mark_active"]` |
| `on_loan` | `[]` |
| `retired` | `[]` |

`on_loan` returns an empty array deliberately — no design screen ever showed that status's row
menu, so the backend doesn't guess at one. `retired` is terminal (view-only, kept forever for
audit — assets are never hard-deleted).

### `GET /assets`
Permission: `administration.asset.view`. Paginated.

Query: `page`, `limit`, `status`, `category` (exact match), `locationId`, `custodian` (both ObjectIds).

### `POST /assets`
Permission: `administration.asset.create`.
```json
{
  "assetName": "Caterpillar 320 Excavator",
  "custodian": "65f1a2b3c4d5e6f7a8b9c0d5",
  "category": "Heavy Equipment",
  "manufacturer": "Caterpillar",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "model": "320GC",
  "serialNo": "CAT320-88213",
  "currentLocationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "vendor": "Mantrac Nigeria",
  "purchaseCost": 4500000000,
  "condition": "good",
  "purchaseDate": "2024-02-01",
  "warrantyExpiry": "2027-02-01",
  "description": "Primary excavator for Lekki Phase 2 earthworks",
  "depreciationRate": 15
}
```
Only `assetName`, `category`, `departmentId`, `currentLocationId`, `purchaseCost`, `purchaseDate`
are required; `custodian` is optional (nullable — not every asset has a custodian yet);
`condition` defaults `good`; `depreciationRate` defaults `15` (%) if omitted. `purchaseDate`
cannot be in the future. `assetTag` is never accepted from the client — it's always
server-generated.

Response `201`:
```json
{
  "success": true,
  "message": "Asset registered successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0g1",
    "assetTag": "AST-0001",
    "assetName": "Caterpillar 320 Excavator",
    "custodian": "65f1a2b3c4d5e6f7a8b9c0d5",
    "category": "Heavy Equipment",
    "manufacturer": "Caterpillar",
    "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
    "model": "320GC",
    "serialNo": "CAT320-88213",
    "currentLocationId": "65f1a2b3c4d5e6f7a8b9c0b9",
    "vendor": "Mantrac Nigeria",
    "purchaseCost": 4500000000,
    "condition": "good",
    "purchaseDate": "2024-02-01T00:00:00.000Z",
    "currentBookValue": 1992403125,
    "status": "active",
    "warrantyExpiry": "2027-02-01T00:00:00.000Z",
    "description": "Primary excavator for Lekki Phase 2 earthworks",
    "retiredAt": null,
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`assetTag` is generated as `AST-<NNNN>`, permanent, never resets. **Side effect:** also generates
a 5-year straight-line depreciation schedule (purchase year through purchase year + 4) at the
given/default rate — see `GET /assets/:id/depreciation` below. Note that `currentBookValue` is
set to the **closing book value of the schedule's final generated row** (purchase year + 4), not
to a row matching today's date — on a freshly-registered asset this looks like several years of
depreciation have already been applied. Read the depreciation schedule itself to find the value
for the current year; don't rely on `currentBookValue` tracking calendar time.

### `GET /assets/:id`
Permission: `administration.asset.view`. Includes the computed `allowedActions` field.

### `PATCH /assets/:id`
Permission: `administration.asset.update`. All register fields optional. Blocked
(`409 INVALID_STATE_TRANSITION`) once `status: "retired"`. **Side effect:** if `purchaseCost` or
`depreciationRate` is part of the update, the depreciation schedule is regenerated — rows for
years before the current year are left untouched (never rewritten), rows from the current year
through purchase year + 4 are replaced wholesale, and `currentBookValue` is reset to the new
final row's closing value (same "purchase year + 4" caveat as above).

### `GET /assets/:id/depreciation`
Permission: `administration.asset.view`. **Not paginated** — full schedule, oldest year first.
```json
{
  "data": [
    { "_id": "...", "assetId": "65f1a2b3c4d5e6f7a8b9c0g1", "year": 2024, "openingBookValue": 4500000000, "depreciationRate": 15, "depreciationAmount": 675000000, "closingBookValue": 3825000000, "createdAt": "...", "updatedAt": "..." },
    { "_id": "...", "assetId": "65f1a2b3c4d5e6f7a8b9c0g1", "year": 2025, "openingBookValue": 3825000000, "depreciationRate": 15, "depreciationAmount": 675000000, "closingBookValue": 3150000000, "createdAt": "...", "updatedAt": "..." }
  ]
}
```
Straight-line: `depreciationAmount = round(purchaseCost * rate / 100)` for every row (not
recomputed off a shrinking balance), `closingBookValue = max(0, openingBookValue - depreciationAmount)`.
Regenerating after a cost/rate edit replaces only years ≥ the edit year — a year that has already
passed keeps its original row forever (audit integrity).

### `GET /assets/:id/custody-history`
Permission: `administration.asset.view`. Paginated — a thin wrapper over
`GET /activity/Asset/:id` (see platform-core.md's Activity section). Each `asset.transferred` event carries
`metadata: { fromLocationId, toLocationId, fromCustodian, toCustodian }` plus a `reason` field.

### `POST /assets/:id/transfer`
Permission: `administration.asset.transition`. Instant — no approval step.
```json
{
  "toLocationId": "65f1a2b3c4d5e6f7a8b9c0ba",
  "toCustodian": "65f1a2b3c4d5e6f7a8b9c0d7",
  "reason": "Reassigned to Warri Yard for borehole rig support"
}
```
`toCustodian` optional (custody can stay with the same person while only the location changes).
`reason` required, ≤2000 chars. Blocked only for `status: "retired"` — note the endpoint itself
does **not** reject a transfer on an `in_maintenance` or `on_loan` asset, even though
`allowedActions` only ever surfaces the "transfer" button for `active` assets. Writes the
`asset.transferred` ActivityEvent first, then updates `currentLocationId`/`custodian` on the
Asset (ordered writes, no multi-document transaction — MongoDB is standalone). `status` is
unchanged by a transfer.

### `POST /assets/:id/retire`
Permission: `administration.asset.transition`. Terminal.
```json
{ "reason": "Beyond economic repair after hydraulic failure" }
```
`reason` required. Sets `status: "retired"`, stamps `retiredAt`, stores `retirementReason`.
Already-retired → `409 INVALID_STATE_TRANSITION`. Retiring blocks any future transfer or
reassignment, but the asset record is kept forever — no hard delete.

### `POST /assets/:id/mark-active`
Permission: `administration.asset.transition`. No body. `in_maintenance → active` only — any
other current status → `409 INVALID_STATE_TRANSITION`. There is currently no route that moves an
asset **into** `in_maintenance`, and no route handles `on_loan` entry/exit at all — both are
known gaps (the designs never showed that menu), not oversights in this doc.

---

## 2. Supply Items — `/supply-items`

All routes require authentication. This is the Office Supplies register — consumable stock, not
depreciable, with no custodian and no approval workflow at all (simpler than every other
Administration entity). `status` (`in_stock | low_stock | out_of_stock`) is **computed on every
response, never stored**: `quantityInStock <= 0` → `out_of_stock`; else
`quantityInStock <= reorderLevel` → `low_stock`; else `in_stock`.

### `GET /supply-items`
Permission: `administration.supplyitem.view`. Paginated. Query: `page`, `limit`, `category`,
`locationId`.

### `POST /supply-items`
Permission: `administration.supplyitem.create`.
```json
{
  "itemName": "Welding Gloves (Pair)",
  "category": "PPE",
  "unit": "Units",
  "reorderLevel": 20,
  "locationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "supplier": "SafetyFirst Nigeria Ltd",
  "description": "Heat-resistant leather welding gloves"
}
```
Only `itemName`, `category`, `unit`, `locationId` are required; `reorderLevel` defaults `0`.
`quantityInStock` cannot be set on create — it always starts at `0`, so a brand-new item is
immediately `out_of_stock` by the computed-status rule above until its first restock.

Response `201`:
```json
{
  "success": true,
  "message": "Item added successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7a8b9c0h1",
    "itemCode": "SUP-0001",
    "itemName": "Welding Gloves (Pair)",
    "category": "PPE",
    "unit": "Units",
    "quantityInStock": 0,
    "reorderLevel": 20,
    "locationId": "65f1a2b3c4d5e6f7a8b9c0b9",
    "lastRestockedAt": null,
    "supplier": "SafetyFirst Nigeria Ltd",
    "description": "Heat-resistant leather welding gloves",
    "status": "out_of_stock",
    "createdAt": "2026-10-03T09:00:00.000Z",
    "updatedAt": "2026-10-03T09:00:00.000Z"
  }
}
```
`itemCode` is generated as `SUP-<NNNN>`, permanent, never resets.

### `GET /supply-items/:id`
Permission: `administration.supplyitem.view`.

### `PATCH /supply-items/:id`
Permission: `administration.supplyitem.update`. Same fields as create, all optional.
`quantityInStock` still cannot be set directly here — only `POST /:id/restock` changes it.

### `POST /supply-items/:id/restock`
Permission: `administration.supplyitem.restock`.
```json
{ "quantity": 50 }
```
`quantity` required, positive. **Additive** (`$inc`, never read-then-write — safe under
concurrent restocks), not a replace. Sets `lastRestockedAt` to now. Response message
"Item restocked successfully".

A daily `node-cron` sweep (1 run, not tied to any HTTP route) compares every item's
`quantityInStock` to its `reorderLevel` and sends one summary notification per eligible user
(anyone holding `administration.supplyitem.restock`, plus Super Admin) when any items are at or
below their reorder level — one notification per sweep run, not one per low-stock item.

---

## 3. Administrative Requests — `/admin-requests`

All routes require authentication. `ADMIN_REQUEST_STATUSES`: `pending`, `approved`, `rejected`,
`completed`. `ADMIN_REQUEST_URGENCIES`: `routine`, `urgent`, `critical` (default `routine`).

**Approval chain — `ADMIN_REQUEST_CHAIN` (4 steps, exported verbatim from the model):**
```
admin_review → procurement_review → finance_approval → final_approval
```
A new request is created directly at `status: "pending"`, `currentStep: "admin_review"` — the
initial submission itself is only recorded as an `adminrequest.submitted` ActivityEvent, it is
**not** a chain step (there's no stored "Staff Request" step; that's purely how the designs
labelled the submission in the Approval History timeline).

**How `currentStep` advances on each `POST /:id/approve` call**, for a request created with
`currentStep: "admin_review"`:

| Call | Before | After |
|---|---|---|
| 1st approve | `status: "pending"`, `currentStep: "admin_review"` | `currentStep: "procurement_review"` (status still `pending`) |
| 2nd approve | `currentStep: "procurement_review"` | `currentStep: "finance_approval"` |
| 3rd approve | `currentStep: "finance_approval"` | `currentStep: "final_approval"` |
| 4th approve | `currentStep: "final_approval"` | `status: "approved"`, `currentStep: null` |

The 4th call is the final step: there is no next entry in `ADMIN_REQUEST_CHAIN`, so the service
flips `status` to `approved` and clears `currentStep` to `null` instead of advancing it. A reject
at **any** step (while `status: "pending"`) immediately sets `status: "rejected"`,
`currentStep: null` — there is no partial-chain state to preserve once rejected, and no
resubmission path.

**Important:** this permission model gates the *whole* approve/reject action behind one
permission string (`administration.adminrequest.decide`) for every step — there is no per-step
distinct-role check (e.g. nothing stops the same `Admin Review` approver from also clicking
through `Procurement Review` and `Finance Approval`). This was a deliberate simplification (no
design showed a role/department picker for who can approve each named step).

### `GET /admin-requests`
Permission: `administration.adminrequest.view`. Paginated. Query: `page`, `limit`, `status`,
`urgency`, `departmentId`, `requestType`.

### `POST /admin-requests`
Permission: `administration.adminrequest.create`.
```json
{
  "requestType": "Office Equipment",
  "requestedBy": "65f1a2b3c4d5e6f7a8b9c0d5",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "urgency": "urgent",
  "requestTitle": "Replacement laptop for site engineer",
  "description": "Current laptop no longer boots reliably; needed before next site visit."
}
```
`requestType` and `requestedBy` (ref **Employee**, not User — the on-behalf-of subject) and
`departmentId` are required; `urgency` defaults `routine`. `requestTitle` is optional on create —
if omitted, it falls back to the first 80 characters of `description`, or to `requestType` itself
if there's no description either (the create form never captured this field in the original
designs; this is the backend's own fallback for that gap, not a frontend requirement).

Response `201`, `requestId: "REQ-2026-0001"` (resets yearly), `status: "pending"`,
`currentStep: "admin_review"`, `submittedAt` set to now.

### `GET /admin-requests/:id`
Permission: `administration.adminrequest.view`.

### `PATCH /admin-requests/:id`
Permission: `administration.adminrequest.update`. Body (all optional): `requestTitle`,
`description`, `urgency` only — **`requestType`, `requestedBy`, `departmentId` cannot be changed
after creation.** Only allowed while `status: "pending"` (`409 INVALID_STATE_TRANSITION`
otherwise).

### `GET /admin-requests/:id/approval-history`
Permission: `administration.adminrequest.view`. Paginated — wrapper over
`GET /activity/AdministrativeRequest/:id`.

### `POST /admin-requests/:id/approve`
Permission: `administration.adminrequest.decide`. No body. Only from `status: "pending"` with a
non-null `currentStep`. Advances to the next chain step, or finalizes to `approved` on the last
step (see table above).

### `POST /admin-requests/:id/reject`
Permission: `administration.adminrequest.decide`.
```json
{ "reason": "Budget not available this quarter — resubmit in Q1" }
```
`reason` required, ≤2000 chars. Only from `status: "pending"` (any step). Sets `status: "rejected"`,
`currentStep: null`, stores `rejectionReason`.

### `POST /admin-requests/:id/complete`
Permission: `administration.adminrequest.decide`. No body. `approved → completed` only.

---

## 4. Travel Requests — `/travel-requests`

All routes require authentication. `TRAVEL_REQUEST_STATUSES`: `draft`, `pending`, `approved`,
`rejected`.

**Approval chain — `TRAVEL_REQUEST_CHAIN` (3 steps, one fewer than AdministrativeRequest — no
Procurement Review):**
```
admin_approval → finance_approval → final_approval
```
Unlike AdministrativeRequest, a new travel request starts at `status: "draft"`,
`currentStep: null` — the chain only begins once the request is explicitly submitted.

**How `currentStep` advances:**

| Call | Before | After |
|---|---|---|
| `POST /:id/submit` | `status: "draft"`, `currentStep: null` | `status: "pending"`, `currentStep: "admin_approval"` |
| 1st approve | `currentStep: "admin_approval"` | `currentStep: "finance_approval"` |
| 2nd approve | `currentStep: "finance_approval"` | `currentStep: "final_approval"` |
| 3rd approve | `currentStep: "final_approval"` | `status: "approved"`, `currentStep: null` |

As with AdministrativeRequest, the final approve call has no next step to advance to, so the
service finalizes `status: "approved"` and clears `currentStep`. Rejecting (only valid from
`status: "pending"`, any step) sets `status: "rejected"`, `currentStep: null`,
`rejectionReason`. One permission string (`administration.travelrequest.decide`) gates
approve/reject at every step — same no-per-step-role simplification as AdministrativeRequest.

### `GET /travel-requests`
Permission: `administration.travelrequest.view`. Paginated. Query: `page`, `limit`, `status`,
`traveler`, `departmentId`.

### `POST /travel-requests`
Permission: `administration.travelrequest.create`.
```json
{
  "traveler": "65f1a2b3c4d5e6f7a8b9c0d5",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "fromLocation": "Lagos Head Office",
  "toLocation": "Warri Yard",
  "departureDate": "2026-11-10",
  "returnDate": "2026-11-14",
  "travelType": "within_state",
  "mode": "Company Vehicle",
  "accommodationRequired": true,
  "hotelName": "Warri Guest Lodge",
  "numberOfNights": 4,
  "travelAllowanceRequired": true,
  "estimatedAmount": 15000000,
  "purposeOfTravel": "Site inspection and handover meeting with the Warri yard team"
}
```
`traveler` (ref **Employee**), `departmentId`, `fromLocation`/`toLocation` (free text — not
validated against Platform Core's Location collection), `departureDate`, `returnDate`,
`travelType`, `mode` are required. `departureDate` must be ≤ `returnDate`. `hotelName` is
required when `accommodationRequired: true`; `estimatedAmount` is required when
`travelAllowanceRequired: true` (both enforced only on **create**, not on `PATCH` — see below).

Response `201`, `requestId: "TRV-2026-0001"` (resets yearly), `status: "draft"`,
`currentStep: null`.

### `GET /travel-requests/:id`
Permission: `administration.travelrequest.view`.

### `PATCH /travel-requests/:id`
Permission: `administration.travelrequest.update`. All create fields optional. Allowed while
`status: "draft"` or `"pending"` only. **Note:** unlike create, the update schema does not
re-enforce the `departureDate ≤ returnDate` or conditional-required (`hotelName`/
`estimatedAmount`) cross-field rules — those checks only run on `POST`.

### `GET /travel-requests/:id/approval-history`
Permission: `administration.travelrequest.view`. Paginated — wrapper over
`GET /activity/TravelRequest/:id`.

### `POST /travel-requests/:id/submit`
Permission: `administration.travelrequest.update`. No body. `draft → pending` only, and sets
`currentStep` to the chain's first step (`admin_approval`).

### `POST /travel-requests/:id/approve`
Permission: `administration.travelrequest.decide`. No body. Only from `status: "pending"` with a
non-null `currentStep`. Advances the chain, or finalizes to `approved` on the last step.

### `POST /travel-requests/:id/reject`
Permission: `administration.travelrequest.decide`.
```json
{ "reason": "Travel dates overlap with the Lekki Phase 2 handover — please reschedule" }
```
`reason` required, ≤2000 chars. Only from `status: "pending"`.

---

## 5. Movements — `/movements`

All routes require authentication (Travel & Logistics → Equipment Movement tab).
`MOVEMENT_STATUSES`: `pending_approval`, `approved`, `rejected`, `in_transit`, `delivered`,
`returned`. `conditionBefore` reuses Asset's own `ASSET_CONDITIONS` enum (`good | fair | poor`)
directly — one shared vocabulary, not redefined here.

**Movement has no `currentStep`/chain concept at all** — unlike AdministrativeRequest and
TravelRequest, there is exactly one approval decision (`Admin Approval`), modelled as a direct
status flip: `pending_approval → approved` (or `→ rejected`). Don't force Movement into the same
`currentStep` shape as the other two request types; the field doesn't exist on this model.

**After approval, the operational sequence is strict and sequential, each transition its own
endpoint — no skipping:**
```
approved → in_transit → delivered → returned
```
`POST /:id/confirm-delivery` only succeeds from `in_transit`; `POST /:id/mark-returned` only
succeeds from `delivered`. Calling either out of order (e.g. confirming delivery on a movement
still `approved`, or marking returned on one still `in_transit`) → `409 INVALID_STATE_TRANSITION`.

### `GET /movements`
Permission: `administration.movement.view`. Paginated. Query: `page`, `limit`, `status`,
`movedBy`.

### `POST /movements`
Permission: `administration.movement.create`.
```json
{
  "assetOrEquipment": "Lincoln Electric Welding Machine (x2)",
  "movedBy": "65f1a2b3c4d5e6f7a8b9c0d5",
  "fromLocationId": "65f1a2b3c4d5e6f7a8b9c0b9",
  "toLocationId": "65f1a2b3c4d5e6f7a8b9c0ba",
  "movedOn": "2026-10-12",
  "expectedReturn": "2026-11-12",
  "conditionBefore": "good",
  "purposeOfMovement": "Temporary relocation to support welding work at the Warri yard"
}
```
`assetOrEquipment` is **free text**, not a reference to the Asset collection — Movement can track
equipment that was never registered as a formal Asset at all (rented gear, hand tools).
`fromLocationId`/`toLocationId` **are** real references to Platform Core Location (unlike
TravelRequest's free-text locations). `conditionBefore` defaults `good`.

Response `201`, `movementId: "MOV-2026-0001"` (resets yearly), `status: "pending_approval"`.

### `GET /movements/:id`
Permission: `administration.movement.view`.

### `PATCH /movements/:id`
Permission: `administration.movement.update`. All create fields optional. Only while
`status: "pending_approval"`.

### `GET /movements/:id/approval-history`
Permission: `administration.movement.view`. Paginated — wrapper over
`GET /activity/Movement/:id`. The timeline mixes one real decision ("Admin Approval granted")
with later operational, non-approval entries ("Equipment marked In Transit", "Equipment
delivered") — same history endpoint, different kinds of events.

### `POST /movements/:id/approve`
Permission: `administration.movement.decide`. No body. `pending_approval → approved` only.

### `POST /movements/:id/reject`
Permission: `administration.movement.decide`.
```json
{ "reason": "Equipment still required on the Lekki site — movement deferred" }
```
`reason` required, ≤2000 chars. `pending_approval → rejected` only.

### `POST /movements/:id/in-transit`
Permission: `administration.movement.update` — **note this is `update`, not `decide`** (the
operational transitions use a different permission than the approval step).
`approved → in_transit` only, no body.

### `POST /movements/:id/confirm-delivery`
Permission: `administration.movement.update`. `in_transit → delivered` only, no body.

### `POST /movements/:id/mark-returned`
Permission: `administration.movement.update`. `delivered → returned` only, no body.

---

## 6. Facility Maintenance — `/facility-maintenance`

All routes require authentication. `MAINTENANCE_STATUSES`: `scheduled`, `in_progress`,
`completed`, `overdue`, `cancelled`. `MAINTENANCE_TYPES`: `preventive`, `corrective`.
`MAINTENANCE_FREQUENCIES`: `one_time`, `monthly`, `quarterly`, `bi_annually` (default `one_time`;
descriptive only — completing a `monthly`/`quarterly`/`bi_annually` job does **not** auto-create
its next occurrence). This is the simplest workflow entity in the module: no approval chain, no
Approval History endpoint at all.

**`overdue` is a stored status, flipped by a daily cron sweep — it is not derived the way
`Task.isOverdue` is.** A `node-cron` job runs once a day (01:00) and flips every job that is still
`status: "scheduled"` with a `dueDate` in the past to `status: "overdue"`, writing one
`facilitymaintenance.overdue` ActivityEvent per job (`actorId: null` — system-triggered, not
attributable to any user). The frontend should treat `overdue` as just another value in `status`,
not compute it client-side from `dueDate`.

### `GET /facility-maintenance`
Permission: `administration.facilitymaintenance.view`. Paginated. Query: `page`, `limit`,
`status`, `type`, `frequency`, `assignedTo` (case-insensitive substring match, not exact — e.g.
`?assignedTo=facilit` matches "PGSL Facility Team").

### `POST /facility-maintenance`
Permission: `administration.facilitymaintenance.create`.
```json
{
  "facilityOrAsset": "Warri Yard — Borehole Pump",
  "maintenanceType": "preventive",
  "assignedTo": "External Vendor (AquaTech Services)",
  "dueDate": "2026-11-01",
  "frequency": "quarterly",
  "estimatedCost": 8500000,
  "description": "Quarterly pump servicing and filter replacement"
}
```
`facilityOrAsset` and `assignedTo` are both **free text** — `facilityOrAsset` combines a location
and an equipment descriptor in one string rather than separate refs; `assignedTo` mixes internal
team names and named external vendors, so it isn't a reference to Employee either.
`maintenanceType`, `assignedTo`, `dueDate` are required; `frequency` defaults `one_time`. Past
due dates are allowed on creation (backdated entries).

Response `201`, `maintenanceId: "FAC-2026-0001"` (resets yearly), `status: "scheduled"`.

### `GET /facility-maintenance/:id`
Permission: `administration.facilitymaintenance.view`.

### `PATCH /facility-maintenance/:id`
Permission: `administration.facilitymaintenance.update`. All create fields optional. Only while
`status: "scheduled"` or `"overdue"` (`409 INVALID_STATE_TRANSITION` otherwise).

### `POST /facility-maintenance/:id/start`
Permission: `administration.facilitymaintenance.update`. No body. `scheduled → in_progress`
only. **No screen in the original designs captured this transition** — it was added because the
documented pipeline (`scheduled → in_progress → completed`) is otherwise unreachable through the
API; the same gap-filling pattern used for HR's `DisciplinaryCase.start-review`.

### `POST /facility-maintenance/:id/complete`
Permission: `administration.facilitymaintenance.update`. No body. Valid from **either**
`in_progress` **or** `overdue` — an overdue job can be marked complete directly, skipping
`in_progress` entirely; this is intentional, not an oversight.

### `POST /facility-maintenance/:id/cancel`
Permission: `administration.facilitymaintenance.update`.
```json
{ "reason": "Vendor contract terminated — rescheduling with a new provider" }
```
`reason` required, ≤2000 chars. Only from `scheduled` or `overdue` (**not** `in_progress` — a job
already underway cannot be cancelled through this endpoint).

---

## 7. Memos & Circulars — `/memos`

All routes require authentication. **Memo is structurally different from every other entity in
this API.** Every other resource is a list with a detail view; Memo is a per-user **inbox** —
`GET /memos` always scopes to the calling user's own folder, and read/acknowledge/archive/delete
state is tracked **per recipient** in a separate `MemoRecipient` document, never as a field on
the `Memo` itself.

`MEMO_STATUSES`: `draft`, `sent` — this is the Memo's own lifecycle, not the recipient's. A
`MemoRecipient` row separately tracks `readAt`, `acknowledgedAt`, `archivedAt`, `deletedAt` for
one `(memoId, userId)` pair. `MEMO_PRIORITIES`: `normal`, `high`, `confidential` — a three-way
radio in the UI, **not currently enforced as an access-control tier**: a `confidential` memo can
be forwarded outside its original recipient list with no check. `MEMO_TARGET_TYPES`:
`all_staff`, `department`, `role`, `user`.

`to` and `cc` are each arrays of target objects, **not** plain strings or ids:
```json
{ "type": "all_staff" | "department" | "role" | "user", "refId": "<ObjectId, omitted for all_staff>", "label": "Human-readable label shown in the UI" }
```
A realistic `to` mixing a broadcast target with a scoped one:
```json
"to": [
  { "type": "all_staff", "label": "All Staff" },
  { "type": "department", "refId": "65f1a2b3c4d5e6f7a8b9c0b1", "label": "Health & Safety" }
]
```
These targets are resolved to a concrete set of active **Users** (not Employees) only at
send/forward time — the resolution is a snapshot, not a live query, so a department's membership
changing after the memo is sent does not retroactively add or remove recipients.

### `GET /memos`
Permission: `administration.memo.view`. Paginated.

Query: `page`, `limit`, `folder` (`inbox | drafts | sent | archived`, default `inbox`).
- `drafts`: this caller's own `Memo` documents where `status: "draft"`.
- `sent`: this caller's own `Memo` documents where `status: "sent"`, sorted by `sentAt`.
- `inbox`/`archived`: this caller's `MemoRecipient` rows (filtered by `archivedAt`), each merged
  with its parent `Memo`'s fields plus `readAt`/`acknowledgedAt` from the recipient row.

A memo the caller has deleted (`MemoRecipient.deletedAt` set) never appears in **any** folder —
there is no trash/undo.

### `POST /memos`
Permission: `administration.memo.send`.
```json
{
  "to": [
    { "type": "department", "refId": "65f1a2b3c4d5e6f7a8b9c0b1", "label": "Health & Safety" }
  ],
  "cc": [
    { "type": "role", "refId": "65f1a2b3c4d5e6f7a8b9c0a3", "label": "Site Supervisors" }
  ],
  "subject": "Updated PPE Compliance Procedure",
  "priority": "high",
  "body": "**Effective immediately**, all site personnel must...",
  "departmentId": "65f1a2b3c4d5e6f7a8b9c0b1",
  "tags": ["Health & Safety"]
}
```
`to` requires at least one target; `cc` defaults `[]`. `subject` 3–200 chars. `priority` defaults
`normal`. `body` is required free-form rich text (rendered as markdown/HTML client-side — stored
as-is, not sanitized or transformed server-side). **This endpoint always creates the memo as
`status: "draft"`** — there is no "send immediately" option on create; every memo must go through
`POST /:id/send` to actually be delivered, regardless of intent.

Response `201`, `memoReference: "MEMO-2026-0001"` (resets yearly), `status: "draft"`, message
"Memo saved as draft".

### `GET /memos/:id`
Permission: `administration.memo.view`. Returns the memo plus `recipientState` — the caller's
own `MemoRecipient` row (`null` if the caller isn't a recipient, e.g. the sender viewing their
own sent memo). **Side effect: if the caller is a recipient and hasn't read it yet, this call
stamps `MemoRecipient.readAt` for them right now** — viewing a memo marks it read.

### `POST /memos/:id/send`
Permission: `administration.memo.send`. No body. `draft → sent` only
(`409 INVALID_STATE_TRANSITION` otherwise). Resolves every `to`/`cc` target to concrete active
Users and upserts one `MemoRecipient` row per resolved user (idempotent — safe to retry), then
notifies each. `status`/`sentAt` are written **before** the fan-out runs, not inside a
transaction (MongoDB is standalone) — a crash mid-fan-out leaves a sent memo with partial
recipients, recoverable by re-running the fan-out (the upsert is on `{ memoId, userId }`, so
re-running never duplicates rows).

### `POST /memos/:id/acknowledge`
Permission: `administration.memo.view` (note: **not** `memo.send` — any recipient can
acknowledge). No body. `404 NOT_FOUND` ("You are not a recipient of this memo") if the caller has
no `MemoRecipient` row for this memo — not `403`. Sets `MemoRecipient.acknowledgedAt` for the
caller only. `data: null`.

### `POST /memos/:id/forward`
Permission: `administration.memo.send`.
```json
{
  "to": [
    { "type": "user", "refId": "65f1a2b3c4d5e6f7a8b9c0d8", "label": "Chidinma Eze" }
  ],
  "cc": [],
  "additionalNote": "Please action the attached by Friday."
}
```
Creates a **brand-new** `Memo` (its own `memoReference`, `forwardedFromMemoId` pointing at the
original), subject prefixed `"Fwd: "`, body is `additionalNote` + the original body (or just the
original body if no note), inheriting `priority`/`departmentId`/`tags` from the original. **This
new memo is created directly at `status: "sent"`** (unlike compose, there is no draft stage for a
forward) and is immediately fanned out to the new `to`/`cc` targets. Attachments are **not**
carried over automatically — the forward body has no attachments field at all; re-attach manually
via `POST /:id/attachments` on the new memo if needed.

### `GET /memos/:id/pdf`
Permission: `administration.memo.view`. **Returns the same structured JSON as `GET /memos/:id`'s
memo object — not a binary PDF.** No PDF renderer is wired up yet (same stub pattern as HR's
payslip download). This call also marks the caller's `readAt`, same as `GET /memos/:id`, since it
goes through the same detail lookup. Build the UI's "Download PDF"/"Print" actions as a
client-side render of this JSON until a real PDF pipeline exists.

### `POST /memos/:id/archive`
Permission: `administration.memo.view`. No body. Sets `MemoRecipient.archivedAt` for the caller
only — **the underlying `Memo` document is never touched.** `404 NOT_FOUND` if the caller has no
recipient row for this memo.

### `DELETE /memos/:id`
Permission: `administration.memo.view`. Sets `MemoRecipient.deletedAt` for the caller only (a
soft, per-recipient hide) — **does not delete the `Memo` document or any other recipient's row.**
`404 NOT_FOUND` if the caller has no recipient row for this memo.

### `GET /memos/:id/attachments`
Permission: `administration.memo.view`. **Not paginated** — full array of this memo's
polymorphic `Attachment` records (same `Attachment` collection used by Documents/Tasks/Employees
elsewhere in this API).

### `POST /memos/:id/attachments`
Permission: `administration.memo.send`. `multipart/form-data`, field `file`. Returns the created
`Attachment` (`201`), linked via `subjectType: "Memo"`.

---

## 8. Disposals — `/disposals`

All routes require authentication (Waste & Disposal). `DISPOSAL_STATUSES`: `pending`,
`completed`. **This register explicitly covers office, IT, and general waste only — hazardous and
site waste belong to a separate (not-yet-built) HSE module.**

### `GET /disposals`
Permission: `administration.disposal.view`. Paginated. Query: `page`, `limit`, `status`, `type`,
`method`.

### `GET /disposals/stats`
Permission: `administration.disposal.view`. **Not paginated.**
```json
{
  "data": [
    { "key": "total_waste_generated", "label": "Total Waste Generated", "value": 245 },
    { "key": "waste_disposed", "label": "Waste Disposed", "value": 198 },
    { "key": "awaiting_manifest_certs", "label": "Awaiting Manifest Certs", "value": 8 },
    { "key": "compliance_rate", "label": "Compliance Rate", "value": 81, "unit": "%" }
  ]
}
```
`total_waste_generated`/`waste_disposed` are raw sums of every disposal's `quantity` field,
**not** a real tons conversion (no `unit`-to-tons mapping was ever specified, despite the KPI's
historical "Tons" framing) — treat these as whatever unit each record happened to use, summed
together. `awaiting_manifest_certs` is a **proxy**: a count of `status: "pending"` records, not a
check for whether a manifest/certificate attachment has actually been uploaded (no such
validation exists on the `complete` transition). `compliance_rate` = `round(waste_disposed /
total_waste_generated * 100)`, `0` if nothing has been logged yet.

### `POST /disposals`
Permission: `administration.disposal.create`.
```json
{
  "wasteDescription": "Old laptops — end of life (x4)",
  "assetId": "65f1a2b3c4d5e6f7a8b9c0g4",
  "type": "IT Equipment",
  "quantity": 4,
  "unit": "Units",
  "disposalMethod": "Vendor Collection",
  "date": "2026-10-05",
  "vendorOrContractor": "GreenCycle Waste Management",
  "disposedBy": "65f1a2b3c4d5e6f7a8b9c0d5",
  "notes": "Retired per AST-0124's retirement; data wiped and certified prior to collection"
}
```
`wasteDescription`, `type`, `quantity` (> 0), `unit`, `disposalMethod`, `date`, `disposedBy` (ref
**Employee**) are required. **`assetId` is optional and nullable** — a reference to the specific
Asset being disposed of, for audit-trail purposes. This field is **not** in the original designs;
it was added so a retirement-to-disposal trail (`AST-0124` retired → `DSP-2026-0001` completed)
is actually queryable instead of only inferable from matching free-text descriptions. Disposal of
waste that was never a registered Asset simply omits it.

Response `201`, `disposalId: "DSP-2026-0001"` (resets yearly), `status: "pending"`.

### `GET /disposals/:id`
Permission: `administration.disposal.view`.

### `PATCH /disposals/:id`
Permission: `administration.disposal.update`. All create fields optional. Only while
`status: "pending"` (`409 INVALID_STATE_TRANSITION` otherwise).

### `GET /disposals/:id/chain-of-custody`
Permission: `administration.disposal.view`. Paginated — wrapper over
`GET /activity/Disposal/:id`. This is an **operational custody log, not an approval chain** (no
named decision steps, no approve/reject) — the same distinction Asset's custody history makes
from its own transfer events.

### `POST /disposals/:id/complete`
Permission: `administration.disposal.update`. No body. `pending → completed` only.

---

## Appendix: reference-code formats (Administration)

| Entity | Format | Resets yearly? |
|---|---|---|
| Asset.assetTag | `AST-NNNN` | No |
| SupplyItem.itemCode | `SUP-NNNN` | No |
| AdministrativeRequest.requestId | `REQ-YYYY-NNNN` | Yes |
| TravelRequest.requestId | `TRV-YYYY-NNNN` | Yes |
| Movement.movementId | `MOV-YYYY-NNNN` | Yes |
| FacilityMaintenance.maintenanceId | `FAC-YYYY-NNNN` | Yes |
| Disposal.disposalId | `DSP-YYYY-NNNN` | Yes |
| Memo.memoReference | `MEMO-YYYY-NNNN` | Yes |

All counters are atomic (`findOneAndUpdate` + `$inc`, upserting), so they're safe under concurrent requests and never collide.
