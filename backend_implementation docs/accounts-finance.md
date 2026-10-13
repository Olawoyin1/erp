# PGSL ERP — Accounts, Finance & Commercial API Reference

Shared conventions (response envelope, auth, pagination, error codes, uploads, money) are documented once in `platform-core.md` — read that first if you haven't.

Accounts, Finance & Commercial is the ninth and final phase, sitting downstream of Business Dev (`Client`), Technical (`Project`), Procurement (`Vendor`, `PurchaseOrder`, `GoodsReceiptNote`), and HR/Platform Core (`Employee`, `Department`). The static permission catalogue returned by `GET /permissions` gains one new block, `finance`, with 15 resources: `legalentity`, `account`, `journalentry`, `budget`, `invoice`, `payable`, `contract`, `contractvariation`, `contractclaim`, `commercialrisk`, `insurancepolicy`, `bankreconciliation`, `taxrecord`, `financeform`, `reports`.

> **Read this first: this module changed materially after the production review (EN-002, 020, 021, 023, 024, 041, 042, 044, 046, 047).** The books are now a real ledger inside this system. Every section below is current, and §17 to §22 are new. In short:
>
> - **Money is always whole kobo.** A fractional amount is rejected with `422`. See `platform-core.md` "Money and idempotency".
> - **Journal entries are multi-line, maker-checker and idempotent** (§3). Posting writes immutable ledger lines (§17); `Account.currentBalance` is a cache recomputed from them.
> - **Invoices and payables post to the ledger automatically** (§5, §6, §18) and their payments are single atomic updates, so two simultaneous payments can never overpay.
> - **A client receipt is cash, never project cost.** Budget `actualSpend` is derived from the ledger (§4).
> - **Vendor invoices need a second person's approval before payment** (§6).
> - **Financial statements** (§20) and the **exchange-rate table** (§19) are new; so is the posting outbox (§18).

**Mount-path quirk:** every other router in this module mounts at a path that matches its folder name (`/accounts`, `/invoices`, `/payables`, …) except the Reports router — `finance-reports/financeReports.routes.ts` is mounted at **`/accounts-finance/reports`**, not `/finance/reports` or `/finance-reports`, unlike every prior phase's own `<module>/reports` convention (`/procurement/reports`, `/hse/reports`, `/quality/reports`). Don't guess this path from the folder name or from the sibling phases' own pattern.

**Three fields are deliberately free text, not `ref Employee`:** `Contract.contractManager`, `ContractClaim.raisedBy`, and `CommercialRisk.riskOwner` all accept any string up to 200 chars — none of them validate against the Employee collection, and none populate on read. Build these as plain text inputs, not employee pickers. This is explicitly the same "named individual may be external/client-side, not confirmed as an internal Employee" posture already used elsewhere in the system for similar fields.

**Two fields are deliberately free text, not `ref Vendor`/structured refs:** `InsurancePolicy.provider` (the insurer/surety's name) and `BankReconciliation.bankAccount` (e.g. `"GTBank - NGN"`, combining bank name and currency in one string — there is no Bank Account management entity anywhere in this module).

---

## 1. Legal Entities — `/legal-entities`

All routes require authentication. `LEGAL_ENTITY_STATUSES`: `active`, `inactive`. `LEGAL_ENTITY_TYPES`: `Parent`, `Subsidiary`, `Joint Venture`. This is PGSL's own internal multi-subsidiary register, consumed by `JournalEntry.entity` and `TaxRecord.taxEntity`. Six rows are seeded at boot (`DEFAULT_LEGAL_ENTITIES`): PGSL Parent Company (Parent), PGSL Offshore Services, PGSL Marine Logistics, PGSL Construction Ltd., PGSL Engineering Ltd., PGSL Marine Ltd. (all Subsidiary).

**As of the Settings phase, this entity has full CRUD** — the System Configuration → Entities panel that design folder turned up. Reads stay on `finance.legalentity.view`; every write route is gated by `core.settings.update` instead (not a `finance.legalentity.*` write key — the catalogue only declares `view` for this resource, by the Settings spec's own explicit recommendation). Full details, including `entityType` and the create/update/activate/deactivate routes, are documented in `settings.md` §3 — this section only covers the two original read routes to avoid duplicating that doc.

### `GET /legal-entities`
Permission: `finance.legalentity.view`. **Not paginated.** Returns every `status: 'active'` entity, sorted by `name` ascending. Pass `?all=true` to include inactive entities too (added in the Settings phase for the System Configuration panel, which needs to show both).

### `GET /legal-entities/:id`
Permission: `finance.legalentity.view`. Returns any entity regardless of status (unlike the unqualified list route above).

---

## 2. Accounts (Chart of Accounts) — `/accounts`

All routes require authentication. `ACCOUNT_CATEGORIES`: `Asset`, `Liability`, `Equity`, `Revenue`, `Expense`. `ACCOUNT_STATUSES`: `active`, `inactive`.

**`accountCode` is the one reference-code-shaped field in this entire project that is client-supplied, not server-sequenced** — a plain integer, following the standard chart-of-accounts convention (1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue, 5000s Expense), unique across the whole collection (not scoped per category). `createAccount` does its own pre-check (`409 CONFLICT`, `"Account code <n> is already in use"`) in addition to the schema's own unique index.

**`currentBalance` is never directly settable via any route on this entity.** It is a cache of the ledger: debits minus credits in the base currency (positive means net debit, for every account type), recomputed from `LedgerLine` rows after each posting. There is no opening-balance field; opening balances are entered as a posted journal entry. Deactivating an account is refused (`409`) while its ledger balance is not zero or it has active child accounts.

### `GET /accounts`
Permission: `finance.account.view`. Paginated, sorted by `accountCode` ascending. Query: `page`, `limit`, `category`, `status`, `parentAccount`.

### `POST /accounts`
Permission: `finance.account.create`.
```json
{
  "accountCode": 1100,
  "category": "Asset",
  "accountName": "Cash and Cash Equivalents",
  "parentAccount": "65f1a2b3c4d5e6f7a8b9c0a1",
  "description": "Operating cash accounts across all subsidiaries"
}
```
`accountCode` (coerced to a positive integer), `category`, `accountName` required; `parentAccount` (ref `Account`, self-referential) and `description` optional. Response `201`, `currentBalance: 0`, `status: "active"` always.

**As of the Settings phase, `accountCode` is also validated against `CompanySettings.chartOfAccountsRanges`** (see `settings.md` §1.7) for the submitted `category` — e.g. `{ category: "Asset", accountCode: 9999 }` is rejected (`422 VALIDATION_ERROR`) against the default `1000–1999` Asset range. Only checked if a range exists for that category; a category with no configured range is unchecked.

### `GET /accounts/:id`
Permission: `finance.account.view`.

### `PATCH /accounts/:id`
Permission: `finance.account.update`. Same fields as create minus `accountCode` (immutable after creation), all optional. **No status precondition at all** — editable regardless of `active`/`inactive`.

### `POST /accounts/:id/deactivate`
Permission: `finance.account.update`. No body. No precondition — callable from any status, including already-`inactive` (re-saves the same status, no guard error).

### `POST /accounts/:id/activate`
Permission: `finance.account.update`. No body. Same no-precondition behavior as `/deactivate`.

**There is no `DELETE /accounts/:id`** — deactivate instead. No stats endpoint either.

---

## 3. Journal Entries — `/journal-entries`

All routes require authentication. `JOURNAL_ENTRY_STATUSES`: `draft`, `pending_approval`, `approved`, `posting`, `posted`, `rejected`, `reversing`, `reversed`.

**Two shapes, exactly one per entry.** Either the simple form (`debitAccount`, `creditAccount`, `amount`) or a balanced multi-line journal `lines[]` (2 to 200 lines, each `{ account, debit | credit, memo?, project? }`). Total debits must equal total credits (`422`). Both accounts of the simple form must differ and every account must exist and be active (`422`). `currency` (3 letters) and `exchangeRate` are optional. A foreign-currency entry stores the document amounts plus base-currency (NGN) amounts at the rate given; for a manual journal the rate defaults to 1, so **supply `exchangeRate` explicitly on a foreign journal** (invoices and payables look the rate up in §19 automatically).

**Maker-checker.** The person who created an entry can never approve or reject it (`403`); posting is the checker's follow-on step and is not restricted further. A Super Admin keeps the break-glass bypass.

**Posting is atomic and idempotent without transactions.** `post` claims the entry with a conditional update (`approved` to `posting`), writes its ledger lines under a unique `(entry, lineNo)` index, recomputes the account balances, and marks it `posted` last. Two simultaneous posts cannot both proceed; a crash in the middle leaves the entry in `posting`, and the `ledger-posting-recovery` job (every 5 minutes, also `POST /ledger/recover`) finishes it. Posting into a **closed accounting period** is refused (`409`, see §17).

**Reversal never edits the original.** `reverse` (only from `posted`) claims the original (`posted` to `reversing`), creates a new system entry with every line swapped, posts it, then marks the original `reversed` (`reversalReason`, `reversedByEntryId`). Recovery completes a half-done reversal in the same way.

**Status machine:** `draft` to `pending_approval` (submit) to `approved` (approve) to `posting` to `posted` (post) to `reversing` to `reversed` (reverse). `pending_approval` to `rejected` is the only negative branch and `rejected` is terminal.

| Action | Route | Permission | From to To |
|---|---|---|---|
| Submit | `POST /:id/submit` | `.update` | `draft` to `pending_approval` |
| Approve | `POST /:id/approve` | `.decide` | `pending_approval` to `approved` |
| Reject | `POST /:id/reject` | `.decide` | `pending_approval` to `rejected` |
| Post | `POST /:id/post` | `.decide` | `approved` to `posted` |
| Reverse | `POST /:id/reverse` | `.decide` | `posted` to `reversed` |

`create`, `approve`, `post` and `reverse` accept an `Idempotency-Key` header (see `platform-core.md`).

### `GET /journal-entries`
Permission: `finance.journalentry.view`. Paginated, newest `journalDate` first. Query: `page`, `limit`, `status`, `entity`, `project`.

### `GET /journal-entries/stats`
Permission: `finance.journalentry.view`. Tiles: `pending_approval`, `approved`, `posted`, `reversed`.

### `POST /journal-entries`
Permission: `finance.journalentry.create`.
```json
{
  "journalDate": "2026-10-04",
  "entity": "65f1a2b3c4d5e6f7a8b9c0e1",
  "memo": "Reclass of advance payment to project cost",
  "lines": [
    { "account": "65f1a2b3c4d5e6f7a8b9c0a1", "debit": 5000000, "project": "65f1a2b3c4d5e6f7a8b9c0p1" },
    { "account": "65f1a2b3c4d5e6f7a8b9c0a2", "credit": 5000000 }
  ]
}
```
`journalDate` and `entity` are required. Amounts are integer kobo. Response `201`, `journalId: "JE-2026-0001"`, `status: "draft"`.

### `GET /journal-entries/:id`, `PATCH /journal-entries/:id`
`GET` needs `.view`; `PATCH` needs `.update`, same fields as create, all optional, only while `draft` (`409` otherwise).

### `POST /journal-entries/:id/submit`, `/approve`, `/reject`, `/post`, `/reverse`
Gates as in the table. `/reject` and `/reverse` take `{ "reason": "..." }` (required, 1 to 2000 characters).

**There is no `DELETE` for this entity.**

---

## 4. Budgets — `/budgets`

All routes require authentication. `BUDGET_TYPES`: `CapEx`, `Opex`. `BUDGET_STATUSES`: `draft`, `pending_approval`, `active`, `rejected`, `closed`.

**`actualSpend` is derived, never typed.** It is recomputed from the ledger: the net of every `Expense`-category ledger line tagged to the budget's project and dated inside the budget's own `startDate`/`endDate`. So a vendor invoice recorded against a project counts once, when it is booked (payment later does not add again); a reversal or voided invoice subtracts itself; two budgets for different periods each count only their own dates; and a **client receipt is never counted** (the old behaviour of adding invoice payments to project cost was a bug, EN-002). The cached value refreshes whenever a posting touches the project.

`Project.totalDisbursed` is the cash actually paid to vendors against the project, incremented atomically on each vendor payment. Budget control (`budgetControl` in finance settings, `off` / `warn` / `block`) is reserved for purchase-order and payable checks.

**Status machine:** `draft` →(`submit`)→ `pending_approval` →(`approve`)→ `active` →(`close`)→ `closed`. `pending_approval` →(`reject`)→ `rejected` (terminal). `startDate` must be ≤ `endDate` on create and `PATCH` alike (`422 VALIDATION_ERROR`, field `startDate`, otherwise).

| Action | Route | Permission | From → To |
|---|---|---|---|
| Submit | `POST /:id/submit` | `.update` | `draft → pending_approval` |
| Approve | `POST /:id/approve` | `.decide` | `pending_approval → active` |
| Reject | `POST /:id/reject` | `.decide` | `pending_approval → rejected` |
| Close | `POST /:id/close` | `.decide` | `active → closed` |

### `GET /budgets`
Permission: `finance.budget.view`. Paginated, sorted by `createdAt` descending. Query: `page`, `limit`, `status`, `budgetType`, `project`.

### `GET /budgets/stats`
Permission: `finance.budget.view`. Tiles: `pending_approval`, `active`, `rejected`, `closed`. (`draft` not counted.)

### `POST /budgets`
Permission: `finance.budget.create`.
```json
{
  "budgetType": "CapEx",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "budgetPeriod": "FY2027",
  "approvedBudget": 450000000000,
  "forecastAmount": 470000000000,
  "startDate": "2027-01-01",
  "endDate": "2027-12-31",
  "description": "Annual capital budget for the Lekki fabrication yard expansion"
}
```
`budgetType`, `project`, `budgetPeriod`, `approvedBudget`, `startDate`, `endDate` required; `currency` (default `NGN`), `forecastAmount`, `description` optional. Response `201`, `budgetId: "PGSL-BUD-001"` (**permanent**, never resets), `actualSpend: 0`, `status: "draft"` always.

### `GET /budgets/:id`
Permission: `finance.budget.view`.

### `PATCH /budgets/:id`
Permission: `finance.budget.update`. Same fields as create, all optional. Only while `status: "draft"` (409, "Only a draft budget can be edited", otherwise).

**There is no `DELETE` for this entity.**

---

## 5. Invoices (also "Accounts Receivable") — `/invoices`

All routes require authentication. `INVOICE_STATUSES`: `issued`, `partially_paid`, `paid`, `overdue`, `cancelled`.

**Invoice is the canonical record for both "Invoicing" and "Accounts Receivable" sidebar views.** `GET /invoices?receivableOnly=true` is a filter over the same collection (`issued`, `partially_paid`, `overdue`); an explicit `status` narrows within it.

**Amounts (all integer kobo).** `workValuation` (net of VAT), `vat`, `wht` (tax the client withholds and remits for us), `retention` (held back by the client). `outstanding = workValuation + vat - wht - retention`, server-computed; deductions larger than value plus VAT are refused (`422`). `currency` defaults to `NGN`; for a foreign currency the `exchangeRate` (NGN per unit) comes from the request or the rate table (§19), and **a foreign currency with no rate is refused** instead of being booked as naira.

**The ledger.** Issuing an invoice posts Dr Receivable (value + VAT - WHT - retention), Dr WHT receivable, Dr Retention receivable, Cr Revenue (tagged to the project), Cr VAT output. Cancelling reverses it. Posting is automatic and never blocks the invoice: if an account mapping is missing or the period is closed, the posting waits in the outbox (§18) and the invoice is still issued.

**Payments are one atomic update.** `record-payment` appends the payment, reduces `outstanding` and sets the status in a single conditional database write that only matches while enough balance remains, so two simultaneous payments for the full balance can never both succeed and `outstanding` can never go negative. Each payment gets a `paymentId`, and posts Dr Bank (or the `bankAccount` given) / Cr Receivable; if the payment `exchangeRate` differs from the invoice's, the difference is booked to realised FX gain or loss. **A receipt is cash, not cost: it never changes a budget.** With `Idempotency-Key`, a retried request replays the stored response.

**Editing.** While nothing has been paid, any field can change and the ledger entry is reversed and re-posted (`postingVersion` increments). Once a payment exists, amounts are locked (`409`); only `client` and `dueDate` may change. Edits are conditional on the version read, so two concurrent edits cannot overwrite each other (`409` to reload). A paid or cancelled invoice cannot be edited.

**Cancelling** needs no payments on the invoice (`409` otherwise: refund or credit-note instead).

**References are checked.** The client must be active, and a `project` must be open and belong to that client.

### `GET /invoices`
Permission: `finance.invoice.view`. Paginated, `dueDate` ascending. Query: `page`, `limit`, `status`, `client`, `project`, `receivableOnly`.

### `GET /invoices/stats`
Permission: `finance.invoice.view`. Tiles: `issued`, `partially_paid`, `overdue`, `paid`.

### `POST /invoices`
Permission: `finance.invoice.create`. Accepts `Idempotency-Key`.
```json
{
  "client": "65f1a2b3c4d5e6f7a8b9c0c1",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "workValuation": 8500000000,
  "vat": 637500000,
  "wht": 425000000,
  "retention": 850000000,
  "currency": "NGN",
  "issueDate": "2026-10-01",
  "dueDate": "2026-11-15"
}
```
`client`, `workValuation`, `dueDate` required. Response `201`, `invoiceId: "PGSL-INV-2026-0001"`, `status: "issued"`.

### `GET /invoices/:id`, `PATCH /invoices/:id`
`.view` / `.update`. See "Editing" above.

### `GET /invoices/:id/pdf`
Permission: `finance.invoice.view`. Returns the invoice as a PDF (`Content-Type: application/pdf`, attachment): who it is billed to, dates, the amounts table, payments received and the balance due. Money prints as `NGN 1,234.56` because the standard PDF fonts cannot draw the naira sign.

### `POST /invoices/:id/record-payment`
Permission: `finance.invoice.decide`. Accepts `Idempotency-Key`.
```json
{ "amount": 4000000000, "paymentDate": "2026-10-20", "note": "First milestone", "bankAccount": "65f1a2b3c4d5e6f7a8b9c0a9", "exchangeRate": 1 }
```
`amount` (positive integer kobo) required. `409` if the invoice is paid or cancelled; `422` if the amount exceeds the balance. Response `201`.

### `POST /invoices/:id/send-reminder`
Permission: `finance.invoice.decide`. Writes an `invoice.reminder_sent` event; the notification engine emails the client's contact (when the company allows external email). Automatic reminders run daily (see `notifications-email.md`).

### `POST /invoices/:id/cancel`
Permission: `finance.invoice.decide`. Body `{ "reason": "..." }`. Reverses the ledger entry.

**Daily sweep:** invoices past their due date (compared as a calendar date in Lagos, so an invoice goes overdue the day after) flip to `overdue`.

**There is no `DELETE` for this entity.**

---

## 6. Payables (Accounts Payable) — `/payables`

All routes require authentication. `PAYABLE_STATUSES`: `unpaid`, `partially_paid`, `paid`, `overdue`, `void`. A separate `approvalStatus` (`pending` / `approved`) and an optional `holdReason` control whether the invoice may be paid.

**The matching rules (`assertThreeWayMatch`, on create and on update):**
- `vendor` must match the linked purchase order's vendor (`422`).
- **Goods orders** (`Materials`, `Equipment`) need a **passed goods receipt**: link a `grnId` whose inspection status is `passed`. Without one the invoice is refused (`422`), unless the caller holds `finance.payable.override` and supplies `receiptOverrideReason`. **Services** orders need no receipt.
- **Cumulative cap:** the invoices booked against one order can never add up to more than its value plus `threeWayMatchingTolerancePercent`, even if each is fine alone. Partial invoicing against an order is allowed (the old rule that compared each invoice to the whole order value was replaced).
- A `grnId` with a `poId` must belong to that order.
- A direct invoice with **no purchase order** above `directPurchaseReasonAbove` (finance settings, default N500,000) needs a written `directPurchaseReason`.
- The vendor must be active; the same vendor invoice number cannot be booked twice (a void payable releases its number).

**Approval before payment (SEC-23).** A new payable is `approvalStatus: pending` (setting `payableApproval`: `always` by default, `above_threshold`, or `off`). A **second person** must `approve` it: the person who recorded it cannot (`403`). Payment is refused until it is approved. Changing the money on an approved payable sends it back to `pending`. The accountant can change the mode under finance settings (§18).

**Payment hold.** If goods on the linked order fail inspection, every open payable on that order gets a `holdReason` and cannot be paid until someone with `finance.payable.approve` releases it (`release-hold`, with a reason). The vendor's `failedInspectionCount` goes up and a follow-up task goes to whoever raised the order.

**The ledger.** Recording a payable posts Dr Expense (the account on the payable, else the default expense account; tagged to the project), Dr VAT input, Cr WHT payable, Cr Accounts payable. A payment posts Dr Payable / Cr Bank, with realised FX difference if the rates differ, and adds to `Project.totalDisbursed`. **Project cost is recognised once, when the invoice is booked, not again on payment.** Voiding reverses the booking. Payment is one atomic conditional update (no overpayment races) and accepts `Idempotency-Key`.

### `GET /payables`
Permission: `finance.payable.view`. Paginated, `dueDate` ascending. Query: `page`, `limit`, `status`, `vendor`, `project`, `poId`.

### `GET /payables/stats`
Permission: `finance.payable.view`. Tiles: `unpaid`, `partially_paid`, `overdue`, `paid`.

### `POST /payables`
Permission: `finance.payable.create`. Accepts `Idempotency-Key`.
```json
{
  "vendor": "65f1a2b3c4d5e6f7a8b9c0v1",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "poId": "65f1a2b3c4d5e6f7a8b9c0o1",
  "grnId": "65f1a2b3c4d5e6f7a8b9c0g1",
  "invoiceNo": "VEND-INV-00891",
  "invoiceDate": "2026-09-28",
  "dueDate": "2026-10-28",
  "grossAmount": 4200000000,
  "vat": 315000000,
  "wht": 210000000,
  "currency": "NGN",
  "expenseAccount": "65f1a2b3c4d5e6f7a8b9c0a5"
}
```
`vendor`, `invoiceNo`, `invoiceDate`, `dueDate`, `grossAmount` required. `netAmount = grossAmount + vat - wht` is server-computed. Response `201`, `payableId: "PGSL-APY-2026-0001"`, `status: "unpaid"`, `approvalStatus` per the setting.

### `GET /payables/:id`, `PATCH /payables/:id`
`.view` / `.update`. While nothing has been paid, amounts can change (ledger reversed and re-posted, approval reset); after a payment, amounts are locked (`409`). Blocked once paid or void.

### `POST /payables/:id/approve`
Permission: `finance.payable.approve`. Second-person approval. `403` if you recorded it, `409` if already approved or closed.

### `POST /payables/:id/release-hold`
Permission: `finance.payable.approve`. Body `{ "reason": "..." }` (3 to 1000 characters). `409` if not on hold.

### `POST /payables/:id/record-payment`
Permission: `finance.payable.decide`. Body as invoices (`amount`, `paymentDate`, `note`, `bankAccount`, `exchangeRate`). `409` if not approved, on hold, paid or void; `422` if over the balance. Response `201`.

### `POST /payables/:id/void`
Permission: `finance.payable.decide`. Body `{ "reason": "..." }`. Refused once any payment has been made (`409`).

**Daily sweep:** same as invoices.

**There is no `DELETE` for this entity.**

---

## 7. Contracts — `/contracts`

All routes require authentication. `CONTRACT_STATUSES`: `draft`, `under_review`, `signed`, `active`, `closed`. `CONTRACT_TYPES`: `EPC`, `EPCIC`, `Construction`, `Maintenance`.

`contractManager` is free text (see the intro note). `startDate` must be ≤ `endDate` (422, field `startDate`), checked on create and `PATCH`.

**Status machine:** `draft` →(`submit-review`)→ `under_review` →(`mark-signed`)→ `signed` →(`mark-active`)→ `active` →(`close`)→ `closed`. There is no reject/rejected status for a Contract at all — `under_review` only ever moves forward to `signed`. **Editable while `draft` or `under_review`**; locked from `signed` onward. **Delete is `draft`-only.**

**`close` is explicitly described by its own confirm-dialog copy as reversible ("can be reopened later if required"), but no `reopen`/`POST /:id/reopen` route exists anywhere in this module** — a `closed` Contract has no way back via this API. Documented here as a known, confirmed gap (not an oversight to "fix" without product input), since the UI copy itself sets an expectation the backend doesn't fulfil.

| Action | Route | Permission | From → To |
|---|---|---|---|
| Submit for review | `POST /:id/submit-review` | `.update` | `draft → under_review` |
| Mark signed | `POST /:id/mark-signed` | `.decide` | `under_review → signed` |
| Mark active | `POST /:id/mark-active` | `.decide` | `signed → active` |
| Close | `POST /:id/close` | `.decide` | `active → closed` |
| Delete | `DELETE /:id` | `.delete` | `draft` only |

### `GET /contracts`
Permission: `finance.contract.view`. Paginated, sorted by `createdAt` descending. Query: `page`, `limit`, `status`, `contractType`, `client`, `project`.

### `GET /contracts/stats`
Permission: `finance.contract.view`. Tiles: `active_contracts`, `under_review`, `signed`, `total_contract_value` (sum of `contractValue` across `signed`+`active` contracts only), `closed`.

### `POST /contracts`
Permission: `finance.contract.create`.
```json
{
  "client": "65f1a2b3c4d5e6f7a8b9c0c1",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "contractType": "EPC",
  "contractValue": 12500000000,
  "startDate": "2026-11-01",
  "endDate": "2028-11-01",
  "paymentTerms": "Milestone-based, per Schedule C",
  "contractManager": "Tunde Afolabi"
}
```
`client`, `project`, `contractType`, `contractValue`, `startDate`, `endDate` required; `currency` (default `NGN`), `paymentTerms`, `contractManager` (free text), `description` optional. Response `201`, `contractId: "PGSL-CTR-001"` (**permanent**), `status: "draft"` always.

### `GET /contracts/:id`
Permission: `finance.contract.view`.

### `PATCH /contracts/:id`
Permission: `finance.contract.update`. Only while `draft` or `under_review` (409, "Only a draft or under-review contract can be edited").

### `DELETE /contracts/:id`
Permission: `finance.contract.delete`. Body: `{ "reason": "..." }` required. Only while `draft`.

---

## 8. Contract Variations — `/contract-variations`

All routes require authentication. `VARIATION_STATUSES`: `draft`, `submitted`, `approved`, `rejected`, `incorporated`. `variationType` is **free text**, not an enum (unlike almost every other categorical field in this module).

`client`/`project` are denormalised onto the Variation from its parent `Contract` at creation — never submitted directly, always copied server-side from `getContractById(input.contract)`.

**Status machine:** `draft` →(`submit`)→ `submitted` →(`approve`)→ `approved` →(`incorporate`)→ `incorporated`. `submitted` →(`reject`)→ `rejected`.

**The cross-entity guard: a Variation cannot be rejected while it has an active Claim against it.** `rejectVariation` runs `ContractClaim.findOne({ variation: variation._id, status: { $ne: 'rejected' } })` before allowing the transition — if any non-rejected Claim references this Variation, the reject call fails with `409 CONFLICT`, `"Cannot reject a variation with an active (non-rejected) claim against it"`. A Claim that itself got rejected does **not** block the parent Variation's own rejection. See §9 for the mirror-image guard on the Claim side.

| Action | Route | Permission | From → To |
|---|---|---|---|
| Submit | `POST /:id/submit` | `.update` | `draft → submitted` |
| Approve | `POST /:id/approve` | `.decide` | `submitted → approved` |
| Reject | `POST /:id/reject` | `.decide` | `submitted → rejected` (blocked by active Claim — see above) |
| Incorporate | `POST /:id/incorporate` | `.decide` | `approved → incorporated` |

### `GET /contract-variations`
Permission: `finance.contractvariation.view`. Paginated, sorted by `lodgeDate` descending. Query: `page`, `limit`, `status`, `contract`. **No stats endpoint exists for this entity.**

### `POST /contract-variations`
Permission: `finance.contractvariation.create`.
```json
{
  "contract": "65f1a2b3c4d5e6f7a8b9c0t1",
  "variationTitle": "Additional piling works — revised geotechnical report",
  "variationType": "Scope Addition",
  "valueImpact": 85000000,
  "lodgeDate": "2026-10-04",
  "variationReason": "Geotechnical survey revealed unsuitable bearing strata at original depth"
}
```
`contract`, `variationTitle`, `valueImpact` (can be negative — a reduction), `lodgeDate` required; `variationType` (free text), `currency` (default `NGN`), `variationReason`, `description` optional. Response `201`, `variationId: "PGSL-VAR-2026-0001"` (yearly), `status: "draft"` always.

### `GET /contract-variations/:id`
Permission: `finance.contractvariation.view`.

### `PATCH /contract-variations/:id`
Permission: `finance.contractvariation.update`. Same fields minus `contract` (immutable), all optional. Only while `draft`.

**There is no `DELETE` for this entity**, despite `finance.contractvariation` having no `delete` action in the permission catalogue either (consistent) — a mis-lodged draft variation can only be left as-is, never removed.

---

## 9. Contract Claims — `/contract-claims`

All routes require authentication. `CLAIM_STATUSES`: `draft`, `submitted`, `under_review`, `approved`, `rejected`, `settled`. `CLAIM_TYPES`: `EOT`, `Cost Claim`, `Scope Change`, `Delay Claim`, `Force Majeure`.

**Lodged against a Variation, not directly against a Contract** — `contract`/`project` are both denormalised from the parent `ContractVariation` at creation (`variation.contract`, `variation.project`), never submitted directly. `raisedBy` is free text (see intro note).

**The mirror-image cross-entity guard: a Claim cannot be raised against a rejected Variation.** `raiseClaim` checks `variation.status === 'rejected'` and throws `422 VALIDATION_ERROR` (field `variation`, "Cannot raise a claim against a rejected variation") if so — this is the inverse direction of §8's guard (rejecting a Variation is blocked by an active Claim; raising a new Claim is blocked by an already-rejected Variation). Together the two guards prevent a Claim and its parent Variation's rejection from ever being in a contradictory state, in either order of operations.

**`under_review` is a declared status with no code path that ever sets it — a dead status value.** `CLAIM_STATUSES` includes `under_review`, and `assertDecidable` (the guard behind both `approve` and `reject`) explicitly accepts a claim already in `under_review` as a valid starting state — but **no route or service function anywhere in `contractClaim.service.ts`/`contractClaim.routes.ts` ever transitions a claim into `under_review`**. The only way out of `draft` is `submit`, which goes straight to `submitted`. A frontend building a status-stepper or filter for "Under Review" claims will never see one populate through normal use of this API.

**Status machine (as actually reachable):** `draft` →(`submit`)→ `submitted` →(`approve`)→ `approved` →(`settle`)→ `settled`. `submitted` →(`reject`)→ `rejected` (terminal). `under_review` is unreachable (see above).

| Action | Route | Permission | From → To |
|---|---|---|---|
| Submit | `POST /:id/submit` | `.update` | `draft → submitted` |
| Approve | `POST /:id/approve` | `.decide` | `submitted` (or `under_review`, unreachable) `→ approved` |
| Reject | `POST /:id/reject` | `.decide` | `submitted` (or `under_review`, unreachable) `→ rejected` |
| Settle | `POST /:id/settle` | `.decide` | `approved → settled` |
| Delete | `DELETE /:id` | `.delete` | `draft` only |

### `GET /contract-claims`
Permission: `finance.contractclaim.view`. Paginated, sorted by `lodgeDate` descending. Query: `page`, `limit`, `status`, `contract`, `variation`. **No stats endpoint exists for this entity either.**

### `POST /contract-claims`
Permission: `finance.contractclaim.create`.
```json
{
  "variation": "65f1a2b3c4d5e6f7a8b9c0v9",
  "claimType": "Cost Claim",
  "claimAmount": 85000000,
  "lodgeDate": "2026-10-10",
  "claimReason": "Additional piling cost per approved variation PGSL-VAR-2026-0001",
  "raisedBy": "Chidi Okonkwo, Project QS"
}
```
`variation`, `claimType`, `claimAmount`, `lodgeDate` required; `currency` (default `NGN`), `claimReason`, `raisedBy` (free text) optional. Response `201`, `claimId: "PGSL-CLM-2026-0001"` (yearly), `status: "draft"` always.

### `GET /contract-claims/:id`
Permission: `finance.contractclaim.view`.

### `PATCH /contract-claims/:id`
Permission: `finance.contractclaim.update`. Minus `variation` (immutable), all optional. Only while `draft`.

### `DELETE /contract-claims/:id`
Permission: `finance.contractclaim.delete`. Body: `{ "reason": "..." }` required. Only while `draft`.

---

## 10. Commercial Risks — `/commercial-risks`

All routes require authentication. `RISK_STATUSES`: `open`, `under_review`, `mitigated`, `closed`. `RISK_SEVERITIES`: `Low`, `Medium`, `High`. `riskOwner` is free text (see intro note); `riskCategory` is free text, not an enum.

**Status machine:** `open` →(`under-review`)→ `under_review` →(`mitigate`)→ `mitigated` →(`close`)→ `closed`. `close` is also reachable directly from `under_review` (skipping `mitigated`) — `closeRisk`'s guard accepts either `under_review` or `mitigated` as the precondition. Editable only while `open`. Delete blocked only once `closed`.

| Action | Route | Permission | From → To |
|---|---|---|---|
| Mark under review | `POST /:id/under-review` | `.decide` | `open → under_review` |
| Mark mitigated | `POST /:id/mitigate` | `.decide` | `under_review → mitigated` |
| Close | `POST /:id/close` | `.decide` | `under_review` **or** `mitigated` `→ closed` |
| Delete | `DELETE /:id` | `.delete` | anything except `closed` |

### `GET /commercial-risks`
Permission: `finance.commercialrisk.view`. Paginated, sorted by `dateIdentified` descending. Query: `page`, `limit`, `status`, `severity`, `riskCategory`, `project`.

### `GET /commercial-risks/stats`
Permission: `finance.commercialrisk.view`. Tiles: `open`, `under_review`, `mitigated`, `high_severity` (count of `severity: "High"` risks that are **not** `closed`, regardless of their actual status among `open`/`under_review`/`mitigated`).

### `POST /commercial-risks`
Permission: `finance.commercialrisk.create`.
```json
{
  "client": "65f1a2b3c4d5e6f7a8b9c0c1",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "riskCategory": "Currency / FX Exposure",
  "riskDescription": "Contract priced in USD but 70% of costs are NGN-denominated",
  "potentialExposure": 150000000,
  "severity": "High",
  "riskOwner": "Finance Director",
  "dateIdentified": "2026-10-01",
  "mitigationPlan": "Forward FX contract for 60% of exposure, reviewed monthly"
}
```
All fields required except `currency` (default `NGN`). Response `201`, `riskId: "PGSL-RSK-001"` (**permanent**), `status: "open"` always.

### `GET /commercial-risks/:id`
Permission: `finance.commercialrisk.view`.

### `PATCH /commercial-risks/:id`
Permission: `finance.commercialrisk.update`. Only while `open`.

### `DELETE /commercial-risks/:id`
Permission: `finance.commercialrisk.delete`. Body: `{ "reason": "..." }` required. Blocked only if `closed`.

---

## 11. Insurance Policies & Bonds — `/insurance-policies`

All routes require authentication. `POLICY_STATUSES`: `active`, `expiring_soon`, `expired` — **all three are date-derived, never directly settable.** `POLICY_TYPES`: `Insurance`, `Bond`. `COVERAGE_TYPES` (enum, shared across both types): `Professional Indemnity`, `Contractors All Risk`, `Public Liability`, `Performance Bond`, `Bid Bond`, `Maintenance Bond`. `provider` is free text (see intro note).

**Status is always recomputed from `expiryDate` via `deriveStatusFromExpiry`** — `expired` if `expiryDate < now`; `expiring_soon` if within a 30-day lookahead window (an **ASSUMED** threshold, not evidenced by any specific design artifact); else `active`. This recomputation runs on **create**, **every `PATCH`**, **`renew`**, and the **daily sweep** (`sweepInsurancePolicyExpiry`) — there is no manual status-setting action anywhere on this entity.

**`PATCH` has no status precondition at all** — unlike nearly every other entity in this module, an `expired` policy remains fully editable via plain `PATCH` (status just gets recomputed from whatever `expiryDate` ends up in the merged document). Only `renew` itself is status-gated.

**`renew` extends the same record's dates in place — it does not create a new policy document.** Blocked only from `expired` (409 INVALID_STATE_TRANSITION, "An expired policy cannot be renewed directly — register a new one") — callable from `active` or `expiring_soon`. This is the opposite precondition from `OffshoreTravelDocument.renew` elsewhere in this system (which is blocked from the *not-yet-decided* state and open to its terminal/negative states) — don't assume the two "renew" actions share a precondition shape.

### `GET /insurance-policies`
Permission: `finance.insurancepolicy.view`. Paginated, sorted by `expiryDate` ascending. Query: `page`, `limit`, `status`, `policyType`, `coverageType`, `project`.

### `GET /insurance-policies/stats`
Permission: `finance.insurancepolicy.view`. Tiles: `active`, `expiring_soon`, `expired`.

### `POST /insurance-policies`
Permission: `finance.insurancepolicy.create`.
```json
{
  "policyType": "Bond",
  "coverageType": "Performance Bond",
  "provider": "AIICO Insurance Plc",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "coverageValue": 1250000000,
  "premiumAmount": 18750000,
  "startDate": "2026-10-01",
  "expiryDate": "2027-10-01",
  "renewalReminder": "60 days prior"
}
```
`policyType`, `coverageType`, `provider`, `project`, `coverageValue`, `premiumAmount`, `startDate`, `expiryDate` required; `currency` (default `NGN`), `renewalReminder`, `remarks` optional. `startDate` must be ≤ `expiryDate` (422, field `startDate`). Response `201`, `policyNo: "PGSL-INS-001"` (**permanent**), `status` derived from `expiryDate` at creation (not unconditionally `active` — a policy can be registered already `expiring_soon` or even `expired` if back-dated).

### `GET /insurance-policies/:id`
Permission: `finance.insurancepolicy.view`.

### `PATCH /insurance-policies/:id`
Permission: `finance.insurancepolicy.update`. No status precondition (see note above).

### `POST /insurance-policies/:id/renew`
Permission: `finance.insurancepolicy.decide`.
```json
{ "startDate": "2027-10-01", "expiryDate": "2028-10-01" }
```
Both required. Blocked only from `expired`.

**There is no `DELETE` for this entity**, consistent with the permission catalogue (`finance.insurancepolicy`: `view`/`create`/`update`/`decide`, no `delete`).

---

## 12. Bank Reconciliations — `/bank-reconciliations`

All routes require authentication. `RECONCILIATION_STATUSES`: `in_progress`, `reconciled`, `reviewed`. `bankAccount` is free text (see intro note).

**Status machine:** `in_progress` →(`mark-reconciled`)→ `reconciled` →(`submit-review`)→ `reviewed`. There is no reject/decline branch at all for this entity — once `reviewed`, the record has no further transitions anywhere in this API.

`variance` is server-computed as `closingBalance - openingBalance` on both create and `PATCH` — never trusted as a standalone client-submitted field.

| Action | Route | Permission | From → To |
|---|---|---|---|
| Mark reconciled | `POST /:id/mark-reconciled` | `.decide` | `in_progress → reconciled` |
| Submit for review | `POST /:id/submit-review` | `.decide` | `reconciled → reviewed` |

### `GET /bank-reconciliations`
Permission: `finance.bankreconciliation.view`. Paginated, sorted by `createdAt` descending. Query: `page`, `limit`, `status`, `bankAccount`. **No stats endpoint exists for this entity.**

### `POST /bank-reconciliations`
Permission: `finance.bankreconciliation.create`.
```json
{
  "bankAccount": "GTBank - NGN",
  "statementPeriod": "September 2026",
  "openingBalance": 1250000000,
  "closingBalance": 1340000000,
  "matchedCount": 112,
  "totalCount": 118,
  "remarks": "6 unmatched items pending vendor confirmation"
}
```
`bankAccount`, `statementPeriod`, `openingBalance`, `closingBalance` required; `currency` (default `NGN`), `matchedCount` (default `0`), `totalCount` (default `0`), `remarks` optional. Response `201`, `reconciliationId: "PGSL-REC-2026-0001"` (yearly), `variance` computed, `status: "in_progress"` always.

### `GET /bank-reconciliations/:id`
Permission: `finance.bankreconciliation.view`.

### `PATCH /bank-reconciliations/:id`
Permission: `finance.bankreconciliation.update`. Body validated by `updateReconciliationSchema` (`createReconciliationSchema.partial()` — same shape as `POST`, all fields optional). Only while `in_progress` (409, "Only an in-progress reconciliation can be edited", otherwise); recomputes `variance`.

**There is no `DELETE` for this entity.**

---

## 13. Tax Records — `/tax-records`

All routes require authentication. `TAX_RECORD_STATUSES`: `draft`, `pending_filing`, `filed`, `paid`. `TAX_TYPES`: `VAT`, `WHT`, `CIT`, `NCD Levy`. `taxEntity` is a real ref into `LegalEntity` (not free text). `taxReference` is free text — an external, FIRS-issued reference number, never server-generated.

**Filing and payment are two separate, sequential decide actions — not one combined "mark paid" step.** `draft` →(`submit-filing`)→ `pending_filing` →(`mark-filed`)→ `filed` →(`record-payment`)→ `paid`, setting `paidAt` to server time only on that last transition. There is no reject/decline branch anywhere in this status machine.

| Action | Route | Permission | From → To |
|---|---|---|---|
| Submit filing | `POST /:id/submit-filing` | `.update` | `draft → pending_filing` |
| Mark filed | `POST /:id/mark-filed` | `.decide` | `pending_filing → filed` |
| Record payment | `POST /:id/record-payment` | `.decide` | `filed → paid` |
| Delete | `DELETE /:id` | `.delete` | `draft` only |

### `GET /tax-records`
Permission: `finance.taxrecord.view`. Paginated, sorted by `dueDate` ascending. Query: `page`, `limit`, `status`, `taxType`, `taxEntity`.

### `GET /tax-records/stats`
Permission: `finance.taxrecord.view`. Tiles: `draft`, `pending_filing`, `filed`, `paid`, and `due_soon` ("Upcoming Due" — `draft`+`pending_filing` records whose `dueDate` falls within the next 14 days; an **ASSUMED** window, not evidenced).

### `POST /tax-records`
Permission: `finance.taxrecord.create`.
```json
{
  "taxType": "VAT",
  "taxEntity": "65f1a2b3c4d5e6f7a8b9c0e1",
  "filingPeriod": "September 2026",
  "taxAmount": 18500000,
  "dueDate": "2026-10-21",
  "taxReference": "FIRS-VAT-2026-009981"
}
```
`taxType`, `taxEntity`, `filingPeriod`, `taxAmount`, `dueDate` required; `taxReference`, `remarks` optional. Response `201`, `taxId: "PGSL-TAX-2026-001"` (yearly, 3-digit padding — one digit narrower than most other yearly codes in this module), `status: "draft"` always.

### `GET /tax-records/:id`
Permission: `finance.taxrecord.view`.

### `PATCH /tax-records/:id`
Permission: `finance.taxrecord.update`. Only while `draft` or `pending_filing` (409, "Only a draft or pending-filing tax record can be edited").

### `DELETE /tax-records/:id`
Permission: `finance.taxrecord.delete`. Body: `{ "reason": "..." }` required. Only while `draft`.

---

## 14. Finance Forms — `/finance-forms`

All routes require authentication. `FINANCE_FORM_STATUSES`: `draft`, `pending_approval`, `approved`, `rejected`. `FINANCE_FORM_TYPES`: `CapEx Requisition`, `Payment Request`, `Budget Adjustment Request`, `Vendor Advance Request`, `Cash Advance` — one generic form shape covers all five request types (no type-specific extra fields).

**`requestedBy` resolution is actor-first, body-fallback — deliberately, per this entity's own spec.** The controller does:
```ts
const { requestedBy: bodyRequestedBy, ...input } = req.body;
const requestedBy = (await resolveActorEmployeeId(actorId))?.toString() ?? bodyRequestedBy;
if (!requestedBy) throw AppError.validation('No employee record is linked to this account');
```
This resolves the **calling user's own linked Employee first**, and only falls back to whatever `requestedBy` was submitted in the body if the caller has **no** linked Employee record at all — the same precedence `ResourceRequest.requestedBy` already uses elsewhere in the system. This is the *opposite* precedence from Procurement's `PurchaseRequisition.requestedBy` (`requestedBy ?? resolveActorEmployeeId(actorId)` — body value wins there), which deliberately supports "I'm filing this on behalf of a colleague." The two entities differ on purpose: this module's own spec states `requestedBy` "should resolve server-side from the authenticated actor... never trusted from client-submitted free text for internal submissions," so a `requestedBy` sent in the body is intentionally only a fallback for the (expected to be rare) case of a caller with no Employee link — not a general "on behalf of" mechanism. Build the frontend form accordingly: don't expose a "request on behalf of" picker for this entity, unlike `PurchaseRequisition`'s.

**Status machine:** `draft` →(`submit`)→ `pending_approval` →(`approve`)→ `approved`. `pending_approval` →(`reject`)→ `rejected` (terminal). Editable/deletable only while `draft`.

**As of the Settings phase, "Fund Request" = `FinanceForm` (user-confirmed), and its approval gate is a 3-tier model**, not a single "Finance Manager" gate. At create time (and on any `PATCH` that changes `amount` while `draft`), `requiredApprovalTier` (`1 | 2 | 3`) is computed from `CompanySettings.fundRequestThreshold1/2/3` (`settings.md` §1.5) — the lowest tier whose threshold still covers `amount`: `amount <= threshold1` → tier 1 (Line Manager), `<= threshold2` → tier 2 (HOD), otherwise tier 3 (Manager/CFO). This is a single-approver-by-ceiling model, not a mandatory 3-step sequential chain — no screen evidences a multi-step approval UI. `requiredApprovalTier` is returned on every `FinanceForm` response.

### `GET /finance-forms`
Permission: `finance.financeform.view`. Paginated, sorted by `requestDate` descending. Query: `page`, `limit`, `status`, `formType`, `department`.

### `GET /finance-forms/stats`
Permission: `finance.financeform.view`. Tiles: `draft`, `pending_approval`, `approved`, `rejected`.

### `POST /finance-forms`
Permission: `finance.financeform.create`.
```json
{
  "formType": "Payment Request",
  "requestTitle": "Advance payment to crane sub-contractor",
  "department": "65f1a2b3c4d5e6f7a8b9c0d1",
  "vendor": "65f1a2b3c4d5e6f7a8b9c0v1",
  "project": "65f1a2b3c4d5e6f7a8b9c0p1",
  "amount": 22000000,
  "requestDate": "2026-10-04",
  "justification": "Mobilisation advance per subcontract clause 4.2"
}
```
`formType`, `requestTitle`, `department`, `project`, `amount`, `requestDate`, `justification` required; `vendor` (ref `Vendor`), `currency` (default `NGN`) optional; `requestedBy` accepted by the Zod schema but see the resolution caveat above. Response `201`, `formId: "PGSL-FIN-2026-0001"` (yearly), `status: "draft"` always.

### `GET /finance-forms/:id`
Permission: `finance.financeform.view`.

### `PATCH /finance-forms/:id`
Permission: `finance.financeform.update`. Same fields minus `requestedBy` (immutable after creation regardless of who it actually resolved to), all optional. Only while `draft`.

### `DELETE /finance-forms/:id`
Permission: `finance.financeform.delete`. Body: `{ "reason": "..." }` required. Only while `draft`.

### `POST /finance-forms/:id/submit`
Permission: `finance.financeform.update`. `draft → pending_approval`.

### `POST /finance-forms/:id/approve`, `/reject`
Permission: **any one of** `finance.financeform.decide` / `.decide-tier2` / `.decide-tier3` (via `requireAnyPermission` — see `platform-core.md` §1.4). Holding *any* tier permission is enough to reach the route; the service layer then checks the specific record's own `requiredApprovalTier` against the caller's held tier(s) and returns `403 FORBIDDEN` ("This request requires finance.financeform.decide-tierN authority") if the caller's highest tier is below what this record needs. A higher tier implies authority over every lower one (a `decide-tier3` holder can approve a tier-1 request). `/reject` requires `{ "reason": "..." }`.

---

## 15. Finance Reports — `/accounts-finance/reports`

**Note the mount path** — see the quirk flagged in the intro; it is not `/finance/reports`.

### `GET /accounts-finance/reports`
Permission: `finance.reports.view`. **Not paginated** — a single dashboard payload.
```json
{
  "data": {
    "tiles": [
      { "key": "total_revenue", "label": "Total Revenue", "value": 0 },
      { "key": "total_expenses", "label": "Total Expenses", "value": 185000000 },
      { "key": "net_profit", "label": "Net Profit", "value": -185000000 },
      { "key": "outstanding_ar", "label": "Outstanding AR", "value": 45000000 }
    ],
    "charts": [
      { "key": "cash_flow", "title": "Cash Flow", "type": "line", "series": [{ "label": "May 2026", "value": 12000000 }] },
      { "key": "top_spending_departments", "title": "Top Spending Departments", "type": "pie", "series": [{ "label": "Engineering", "value": 42000000 }] }
    ],
    "projectCostVsBudget": [
      { "project": "Lekki Yard Expansion", "budgetId": "PGSL-BUD-001", "approvedBudget": 450000000000, "actualSpend": 61000000 }
    ]
  }
}
```
This is confirmed to be this implementation's own original dashboard design (not a copy-pasted screen from another module, unlike several other phases' Reports screens).

`total_revenue` sums `Invoice.workValuation` across every non-`cancelled` invoice; `total_expenses` sums `Payable.grossAmount` across every non-`void` payable; `net_profit` is `total_revenue - total_expenses`; `outstanding_ar` sums `Invoice.outstanding` across `issued`/`partially_paid`/`overdue` invoices only.

`cash_flow` sums `payments[].amount` across both `Invoice` and `Payable` for the trailing 6 months (inflow minus outflow per month). `top_spending_departments` sums `FinanceForm.amount` for `status: "approved"` forms only, grouped by `department`, top 10. `projectCostVsBudget` lists the 20 `active` Budgets with the highest `actualSpend`, each row showing `approvedBudget` vs `actualSpend` (not percentage — compute that client-side).

There is no `GET /accounts-finance/reports/export` route and no `finance.reports.export` permission key — the same gap left unbuilt in every prior phase's own Reports screen.

---

## 16. Cross-module effects of this phase

- **Procurement's `PurchaseOrder`/`GoodsReceiptNote`/`Vendor`** gained no new field. `Payable.poId`/`grnId` are one-directional, optional refs **into** those collections (§6); `assertVendorActive` is reused as-is from `vendors/vendor.service.ts`.
- **Technical's `Project`** gained no new field. `Budget.project`, `Contract.project`, `ContractVariation.project`, `ContractClaim.project`, `CommercialRisk.project`, `InsurancePolicy.project`, `Invoice.project` (optional), `Payable.project` (optional), `FinanceForm.project` are all one-directional refs **into** Project — there is no reverse "financials" tab rollup written back onto the Project document itself; `GET /accounts-finance/reports`'s `projectCostVsBudget` (§15) is the closest thing to that view, and it's computed on read, not stored.
- **Business Dev's `Client`** gained no new field. `Invoice.client`, `Contract.client`, `ContractVariation.client`, `CommercialRisk.client` are all one-directional refs into Client.
- **HR's `Employee`** gained no new field. `JournalEntry` has no actor-role field at all (just the shared `ActivityEvent.actorId`); `Invoice.payments[].recordedBy`, `Payable.payments[].recordedBy`, and `FinanceForm.requestedBy` are the only three `ref Employee` fields this phase adds, all resolved server-side via `resolveActorEmployeeId` — `FinanceForm.requestedBy` resolves the caller's own linked Employee first, falling back to a client-submitted value only if the caller has no Employee link at all (the same precedence `ResourceRequest` already uses elsewhere in the system, and the one required by this entity's own spec: an internal submission's `requestedBy` must never be trusted from client input).
- **`GET /permissions`** now additionally returns a `finance` block (§0 above) — the same incremental-catalogue-growth pattern every phase has followed.
- **Three more daily `node-cron` sweeps**, all pure status-recomputation with `actorId: null` ActivityEvents (no notification fan-out, same posture as the HSE/Quality sweeps): `sweepOverdueInvoices`, `sweepOverduePayables`, and `sweepInsurancePolicyExpiry`.

---

## Appendix: reference-code formats (Accounts, Finance & Commercial)

| Entity | Format | Resets yearly? | Padding | Notes |
|---|---|---|---|---|
| Account.accountCode | client-supplied integer | N/A | N/A | Not `ReferenceSequence`-backed at all — the one other client-supplied "code" field in the system besides Procurement's `InventoryItem.itemCode`. |
| JournalEntry.journalId | `JE-YYYY-NNNN` | Yes | 4 | Confirmed-intentional exception to this module's own `PGSL-` prefix convention — matches the spec's own Database Design table exactly. |
| Budget.budgetId | `PGSL-BUD-NNN` | No | 3 | Permanent register. |
| Invoice.invoiceId | `PGSL-INV-YYYY-NNNN` | Yes | 4 | |
| Payable.payableId | `PGSL-APY-YYYY-NNNN` | Yes | 4 | |
| Contract.contractId | `PGSL-CTR-NNN` | No | 3 | Permanent register. |
| ContractVariation.variationId | `PGSL-VAR-YYYY-NNNN` | Yes | 4 | |
| ContractClaim.claimId | `PGSL-CLM-YYYY-NNNN` | Yes | 4 | |
| CommercialRisk.riskId | `PGSL-RSK-NNN` | No | 3 | Permanent register. |
| InsurancePolicy.policyNo | `PGSL-INS-NNN` | No | 3 | Permanent register. |
| BankReconciliation.reconciliationId | `PGSL-REC-YYYY-NNNN` | Yes | 4 | |
| TaxRecord.taxId | `PGSL-TAX-YYYY-NNN` | Yes | 3 | One digit narrower than the other yearly codes in this module (3 vs 4). |
| FinanceForm.formId | `PGSL-FIN-YYYY-NNNN` | Yes | 4 | |
| LegalEntity | (no code) | N/A | N/A | Internal `_id` only — a seeded, largely-static reference register, no form-driven creation. |

All generated counters are atomic (`findOneAndUpdate` + `$inc`, upserting), the same pattern used everywhere else in this system.

---

## 17. Ledger and accounting periods — `/ledger`

The ledger is the source of truth for balances. Every posted journal entry writes immutable `LedgerLine` rows (account, debit, credit, base-currency amounts, project, posting date, period key). Nothing edits or deletes them; corrections are reversing entries.

### `GET /ledger/periods?year=2026`
Permission: `finance.period.view`. The twelve months of the year with their status (`open` unless closed).

### `POST /ledger/periods/:key/close`
Permission: `finance.period.close`. `key` is `YYYY-MM`. Closing refuses (`409`) while entries dated in that month are still posting or reversing. Once closed, posting, reversing or system-posting into that month is refused; the posting waits in the outbox until the period is reopened or the date is corrected.

### `POST /ledger/periods/:key/reopen`
Permission: `finance.period.close`. Body `{ "reason": "..." }`. Recorded in the activity trail.

### `GET /ledger/lines`
Permission: `finance.ledger.view`. Paginated drill-down for any statement figure. Query: `page`, `limit`, `account`, `project`, `entry`, `periodKey`, `from`, `to`.

### `POST /ledger/recover`
Permission: `finance.ledger.admin`. Finishes entries stuck in `posting` or `reversing`. Also runs every 5 minutes.

## 18. Finance settings and the posting outbox — `/finance-settings`

Invoices, payables, payments, payroll, tax payments and assets post to the ledger automatically through an outbox: the business action succeeds first, then a `PostingTask` posts it, and a failed task is retried by the `posting-outbox-drain` job (every 5 minutes) with backoff. A task whose account mapping is missing waits as `failed_config` until the accountant maps the account. A task can never post twice (unique key per source document and event).

### `GET /finance-settings`, `PATCH /finance-settings`
Permission: `finance.ledger.view` / `finance.ledger.admin`. Fields: `autoPosting` (turn automatic posting off), `defaultLegalEntity`, `accountMappings` (a map from role, such as `bank`, `receivable`, `revenue`, `vatOutput`, `vatInput`, `whtReceivable`, `whtPayable`, `payable`, `defaultExpense`, `retentionReceivable`, `fixedAssets`, `accumulatedDepreciation`, `depreciationExpense`, `assetDisposalGainLoss`, `fxGainLoss`, `payrollExpense`, `employerPensionExpense`, `nsitfExpense`, `itfExpense`, `netSalariesPayable`, `payePayable`, `pensionPayable`, `nhfPayable`, `nsitfPayable`, `itfPayable`, `otherDeductionsPayable`, `vatPayable`, `companyIncomeTaxPayable`, and others, to an account id), `budgetControl`, `payableApproval`, `directPurchaseReasonAbove` (kobo), `fiscalYearStartMonth`.

### `POST /finance-settings/seed-defaults`
Permission: `finance.ledger.admin`. Creates a standard Nigerian chart of accounts inside the configured number ranges and maps it. Idempotent and non-destructive: existing accounts and mappings are never overwritten.

### `GET /finance-settings/posting-tasks`
Permission: `finance.ledger.view`. Paginated. Filter `status`: `pending`, `posted`, `failed_config`, `dead`, `skipped`. Shows the last error for a task that has not posted.

### `POST /finance-settings/posting-tasks/drain`, `POST /finance-settings/posting-tasks/:id/retry`
Permission: `finance.ledger.admin`. Process the queue now, or retry one task.

**Events that post:** `invoice.issued`, `invoice.payment`, `payable.recorded`, `payable.payment`, `payroll.run`, `payroll.payment`, `asset.acquired`, `asset.depreciation`, `asset.disposed`, `tax.paid`. Goods-received-not-invoiced accruals are deliberately not posted; that needs inventory valuation and a decision on when stock becomes project cost.

## 19. Exchange rates — `/exchange-rates`

Units of NGN per one unit of a foreign currency, effective from a date. The rate in force on a document's date is the most recent one on or before it. A foreign amount with no rate is refused, never silently treated as naira.

### `GET /exchange-rates?currency=USD`
Permission: `finance.exchangerate.view`.

### `POST /exchange-rates`
Permission: `finance.exchangerate.manage`. `{ "currency": "USD", "rate": 1500, "effectiveDate": "2026-10-01", "source": "CBN" }`. NGN cannot be given a rate; one rate per currency per date.

### `DELETE /exchange-rates/:id`
Permission: `finance.exchangerate.manage`.

## 20. Financial statements — `/financial-statements`

Permission for all: `finance.statement.view`. Derived from the ledger, so they always agree with it. Common query: `from`, `to`, `asOf`, `entity`, `project`, `format` (`json` default, `csv`, `xlsx`). A date-only value means the whole of that day. Money in `csv` and `xlsx` is in naira with two decimals (the JSON stays in kobo); XLSX money cells are real numbers, and text that starts with `=`, `+`, `-` or `@` is neutralised against spreadsheet formula injection.

| Route | What it returns |
|---|---|
| `GET /trial-balance` | Every account with its debit or credit position, totals, and `balanced`. |
| `GET /income-statement` | Revenue and expense accounts for the period, total revenue, total expenses, `netProfit`. |
| `GET /balance-sheet` | Assets, liabilities, equity as at `asOf`, plus `currentEarnings` (profit not yet closed to retained earnings) so it always balances. |
| `GET /cash-flow` | Direct method on the bank account: opening cash, receipts and payments grouped by the account on the other side, closing cash. It does not split operating, investing and financing; that needs the accountant's classification. |
| `GET /aged-receivables`, `GET /aged-payables` | Outstanding documents by party in buckets: current, 1 to 30, 31 to 60, 61 to 90, over 90 days past due (amounts in each document's own currency). `format` json, csv or xlsx. |

## 21. Assets and the ledger (see also `administration.md`)

Registering an asset capitalises it (Dr Fixed assets, Cr Bank, or Cr the expense account when `acquisitionPayable` links a vendor invoice that was already booked); set `capitalise: false` for assets already on the books. Depreciation posts yearly (Dr Depreciation expense / Cr Accumulated depreciation, dated 31 December) by the `asset-depreciation` job on 2 January, or on demand with `POST /assets/depreciation/post { "year": 2026 }`; each asset-year posts once. Retiring an asset removes cost and the depreciation posted so far and books the gain or loss against proceeds (`proceeds`, `bankAccount` on the retire request; no proceeds is a write-off).

## 22. Tax records and the ledger

`POST /tax-records/:id/record-payment` now also posts Dr the matching liability account / Cr Bank (`VAT` to VAT payable, `WHT` to WHT payable, `CIT` to company income tax payable, `NCD Levy` to other deductions payable), once. The record must be `filed`, and the legal entity must be active when the record is created. Statutory payroll contributions and PAYE configuration are in `hr.md`.

---

## Post-review fixes

A background pass read this module's real source to write this doc and surfaced 9 findings, each triaged below. Six were genuine bugs, fixed with tests (`tests/accountsFinance.test.ts`); three were confirmed intentional and are documented accurately above rather than in this section.

**Fixed:**

1. **`total_revenue` tile was always `0`.** `financeReports.service.ts`'s `revenueAgg` pipeline summed `'$grossAmount'` on `Invoice`, a field that doesn't exist on that model (only `Payable` has `grossAmount`; `Invoice`'s own money field is `workValuation`). Changed to `'$workValuation'`. `net_profit` was consequently wrong too and is now correct as a side effect.
2. **`finance.bankreconciliation` gained an `update` permission key**, and the `PATCH /bank-reconciliations/:id` route now requires `.update` instead of `.create` — matching every sibling resource in the `finance` block.
3. **`PATCH /bank-reconciliations/:id` now validates its body** against a new `updateReconciliationSchema` (`createReconciliationSchema.partial()`), closing the one `PATCH` route in this module that had no Zod enforcement at all.
4. **`GET /invoices?status=X&receivableOnly=true` now combines both filters** instead of `receivableOnly`'s `$in` silently overwriting an explicit `status`. An out-of-range combination (e.g. `status=paid&receivableOnly=true`) now correctly returns an empty list instead of silently ignoring `status`.
5. **`Payable`'s three-way match now re-validates on any `PATCH` that touches `vendor`, `poId`, or `grnId`** — not only when the request body itself includes `poId`/`grnId`. Previously, changing only `vendor` on a Payable with an existing `poId` skipped re-validation, letting the vendor drift out of sync with the linked PO.
6. **`LegalEntity` now has its own `finance.legalentity.view` permission**, instead of reusing `finance.journalentry.view`, so legal-entity read access can be granted independently.

**Confirmed intentional (no change, documented accurately above):**

7. **`FinanceForm.requestedBy`'s actor-first, body-fallback precedence** is deliberate, matching `ResourceRequest`'s own established pattern and this entity's own spec requirement that `requestedBy` "should resolve server-side from the authenticated actor... never trusted from client-submitted free text for internal submissions." It is the opposite precedence from `PurchaseRequisition.requestedBy` (body wins there) by design — the two entities have different trust requirements, not a copy-paste inconsistency. See §14 above.
8. **`ContractClaim`'s `under_review` status is unreachable by design**, matching the spec's own workflow diagram, which groups `submitted`/`under_review` into one decision-eligible cell with no separate manual entry action into `under_review` evidenced anywhere. `assertDecidable` treats both as equally decidable for exactly this reason. See §9 above.
9. **`JournalEntry.journalId`'s bare `JE-YYYY-NNNN` format** (no `PGSL-` prefix) matches the spec's own Database Design table exactly — confirmed as this entity's own deliberate format, not a naming slip relative to the rest of the module's `PGSL-` convention.
