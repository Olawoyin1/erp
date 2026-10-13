# PGSL ERP — Dashboard API Reference

Shared conventions (response envelope, auth, pagination, error codes, money) are documented once in `platform-core.md` — read that first if you haven't.

Dashboard is a single read-only aggregation endpoint sitting on top of other modules' own collections — Technical (`Project`), Accounts & Finance (`Invoice`, `Budget`), Procurement (`PurchaseOrder`), and HSE/Quality (`OffshoreTravelDocument`, `InsurancePolicy`). It writes nothing and owns no collection of its own. The static permission catalogue returned by `GET /permissions` gains one new block: `dashboard: { overview: ['view'] }`.

All currency values below are integers in minor units (kobo), per §1.8 of `platform-core.md`.

---

## 1. Overview — `/dashboard`

### `GET /dashboard/overview`
Permission: `dashboard.overview.view`. Requires authentication only beyond that — no query params and no request body are read; the controller's handler signature is `(_req, res)` and genuinely ignores the request object. **Not paginated** — one fixed-shape payload, same posture as Finance Reports' own dashboard endpoint.

```json
{
  "success": true,
  "message": null,
  "data": {
    "tiles": [
      { "key": "active_projects", "label": "Active Projects", "value": 14 },
      { "key": "total_revenue", "label": "Total Revenue", "value": 850000000000 },
      { "key": "hse_compliance", "label": "HSE Compliance", "value": 87 },
      { "key": "open_pos", "label": "Open POs", "value": 23 }
    ],
    "activeContracts": {
      "totalRevenue": 420000000000,
      "totalTarget": 480000000000,
      "revenueShare": 47,
      "targetShare": 53,
      "series": [
        { "label": "Nov 2025", "revenue": 30000000000, "target": 40000000000 },
        { "label": "Dec 2025", "revenue": 35000000000, "target": 40000000000 }
      ]
    },
    "activeProjectsCostVsBudget": [
      {
        "project": "Lekki Yard Expansion",
        "projectId": "PGSL-PRJ-001",
        "client": "Nexus Energy Ltd.",
        "approvedBudget": 450000000000,
        "actualSpend": 390000000000,
        "percentSpent": 87,
        "marginLeft": 60000000000,
        "redAlert": true
      }
    ]
  }
}
```

### `tiles`

Always exactly 4 entries, in this order:

| `key` | `label` | What it actually counts |
|---|---|---|
| `active_projects` | Active Projects | Count of every `Project` document whose `status` is **not** `completed` — i.e. `in_progress`, `on_hold`, `at_risk`, or `delayed` all count as "active." A project that's `at_risk` or `delayed` still contributes to this number. |
| `total_revenue` | Total Revenue | Sum of `Invoice.workValuation` across every invoice whose `status` is **not** `cancelled` — `issued`, `partially_paid`, `paid`, and `overdue` invoices all count at their full face value, regardless of how much has actually been paid. This is invoiced value, not cash collected. |
| `hse_compliance` | HSE Compliance | A single percentage: `(compliant offshore travel docs + compliant insurance policies) / (all offshore travel docs + all insurance policies) × 100`, rounded. "Compliant" means `status` is `valid` or `expiring_soon` for an `OffshoreTravelDocument`, or `active` or `expiring_soon` for an `InsurancePolicy` with `policyType: "Insurance"` — `"Bond"` policies (Performance/Bid/Maintenance Bond, a commercial instrument, not an HSE concern) are excluded from this tile entirely. Both queries are otherwise unfiltered (every matching document, system-wide, not scoped to a project or date range). If both pools are empty, this is `0`. |
| `open_pos` | Open POs | Count of every `PurchaseOrder` whose `status` is `awarded`, `issued`, or `acknowledged` — i.e. every status except `cancelled`. |

### `activeContracts`

A 12-month revenue-vs-target chart, keyed as `activeContracts` (not `chart` or `revenueChart`):

| Field | Meaning |
|---|---|
| `series` | Always exactly 12 entries, oldest to newest, ending at the current month. `label` is e.g. `"Oct 2026"`. `revenue` is the sum of `Invoice.payments[].amount` for payments whose `paymentDate` falls in that calendar month — actual cash recorded that month, from **every** invoice regardless of its current `status` (no status filter is applied here, unlike the `total_revenue` tile above). `target` is the same flat number repeated in all 12 months (see below). |
| `target` (per month) | A flat line, not a real monthly target: it's `(sum of approvedBudget across every Budget with status: "active") / 12`, i.e. the full active budget pool spread evenly across the 12-month window. There is no month-by-month budgeting anywhere in the system this could instead be derived from. |
| `totalRevenue` | Sum of `revenue` across all 12 series points. |
| `totalTarget` | Sum of `target` across all 12 series points (= the active-budget total used above, since the flat monthly target × 12 reconstructs it). |
| `revenueShare` / `targetShare` | `revenueShare = round(totalRevenue / (totalRevenue + totalTarget) × 100)`; `targetShare = 100 - revenueShare`. These two always sum to exactly 100 and are meant for a donut/percentage display, not a data series. If both totals are `0`, `revenueShare` is `0` (and `targetShare` is `100`). |

### `activeProjectsCostVsBudget`

Up to 20 rows, one per `Budget` with `status: "active"`, sorted by `actualSpend` descending (highest spenders first). Each row:

| Field | Meaning |
|---|---|
| `project` | The linked Project's `projectName` (empty string `""` if the Budget's `project` ref somehow fails to populate). |
| `projectId` | The linked Project's own `projectId` reference code (e.g. `"PGSL-PRJ-001"`) — **not** the Mongo `_id`. |
| `client` | The linked Project's client's `clientName`, resolved through a second populate hop (`Budget.project.clientId.clientName`). |
| `approvedBudget` | Straight copy of `Budget.approvedBudget`. |
| `actualSpend` | Straight copy of `Budget.actualSpend`. |
| `percentSpent` | `round(actualSpend / approvedBudget × 100)`, or `0` if `approvedBudget` is `0`. |
| `marginLeft` | `max(0, approvedBudget - actualSpend)` — **floored at zero**, so an over-budget project shows `marginLeft: 0`, not a negative number. Don't infer "exactly on budget" from a `0` here; check `redAlert`/`percentSpent` too. |
| `redAlert` | `true` when `approvedBudget > 0 AND actualSpend / approvedBudget >= 0.8` (80% threshold, hardcoded) — i.e. a project that has spent 80% or more of its approved budget. `false` for a zero-budget row. |

This is the same active-Budget query Finance Reports' own `projectCostVsBudget` uses (`accounts-finance.md` §15), just with `client` and `redAlert` added and a different field set — the two endpoints' rows are not identical in shape.

---

## 2. What this endpoint deliberately does NOT return

- **No historical trend/delta fields.** None of the 4 tiles carries a `"+8.2% vs last year"`-style comparison, and there's no `previousValue`/`change`/`trend` field anywhere in the payload. Nothing in this module stores a historical snapshot of these aggregates to compute a delta from — if the frontend design calls for that kind of change indicator under a tile, it cannot be built from this response as-is.
- **No export.** There is no `GET /dashboard/overview/export` route and no `dashboard.overview.export` permission key.
- **No date-range or project filtering.** The whole payload is always computed over all data as of "now" — there's no way to ask for last quarter's numbers or scope the tiles to one project/client.

---

## 3. Populating the "Recent Activity" panel

This module does not provide its own activity feed route. Use the existing, separate Platform Core endpoint instead:

### `GET /activity`
Permission: `core.auditlog.view`. Paginated via `page`/`limit` (default `page=1`, `limit=20`, capped at `100`), sorted by `occurredAt` descending (newest first). No other filters are accepted on this route (no `module`/`subjectType` query param — that filtering only exists on the per-subject timeline route, `GET /activity/:subjectType/:subjectId`, which also now requires `core.auditlog.view`).

- **"Latest 4" panel:** `GET /activity?page=1&limit=4`.
- **"View all" page:** `GET /activity?page=1&limit=20` (or whatever page size you want, up to 100), paging forward with `page=2`, `page=3`, etc., using the returned `meta.totalPages`.

Response envelope is the standard paginated shape (`{ success, message, data: ActivityEvent[], meta }`), not the `{ success, message, data }` shape the rest of this doc describes. Each `ActivityEvent` row has `subjectType`, `subjectRef`, `action`, `label`, `actorId`, optional `fromStatus`/`toStatus`/`reason`, and `occurredAt` — `label` is the pre-built human-readable string (e.g. `"Invoice PGSL-INV-2026-0001 marked paid"`) meant for direct display; you don't need to reconstruct a sentence from `action`/`fromStatus`/`toStatus` yourself.

---

## Post-review fixes

A background pass read this module's real source to write this doc and surfaced 3 findings. Two were fixed; one is confirmed intentional and documented accurately above instead.

**Fixed:**

1. **`hse_compliance` no longer counts `InsurancePolicy` Bonds.** It previously built this percentage from every `OffshoreTravelDocument` **and** every `InsurancePolicy` with no filter — including `policyType: "Bond"` (Performance/Bid/Maintenance Bond), a commercial instrument with no connection to health, safety, or environmental compliance. The `InsurancePolicy` half of the query now filters to `policyType: "Insurance"` only.
2. **`GET /activity` and `GET /activity/:subjectType/:subjectId` now require `core.auditlog.view`.** Both routes previously had `authenticate` but no `requirePermission` at all — unlike every other list route in this system — so any authenticated user could read the full cross-module activity feed (including HR disciplinary actions, finance approvals, etc.) regardless of their actual RBAC permissions. `core.auditlog.view` already existed in the permission catalogue (`src/lib/permissions.ts`) but was never wired to a route; Super Admin already holds every catalogue key, so this closes the gap without affecting existing Super Admin access.

**Confirmed intentional (no change):**

3. **The `total_revenue` tile and `activeContracts.totalRevenue` are two differently-computed "revenue" numbers that don't reconcile by design.** The tile sums `Invoice.workValuation` (invoiced face value, lifetime, non-`cancelled` only); the chart sums `Invoice.payments[].amount` (cash actually recorded, trailing 12 months, no status filter). This mirrors the same "invoiced value vs. cash collected" distinction Finance Reports' own `total_revenue`/`cash_flow` tiles already draw in the prior phase — not a bug, but worth knowing before assuming the two numbers should match. See the `tiles`/`activeContracts` tables above for the exact formulas.
