# Accounts & Finance Module — Demo Script & Form Input Examples

**Module path:** Sidebar → **Accounts & Finance**  
**Audience:** Finance Manager / CFO / Auditor role  
**Duration:** ~45–60 minutes for a full walkthrough; each section is self-contained.

---

## Module Overview

The Accounts & Finance module contains eleven functional areas:

| # | Section | Path |
|---|---------|------|
| 1 | General Ledger | `/finance/ledger` |
| 2 | Budgeting & Forecasting | `/finance/budget` |
| 3 | Payables & Receivables | `/finance/ap-ar` |
| 4 | Invoicing & Billing | `/finance/invoicing` |
| 5 | Contracts & Claims | `/finance/contracts-claims` |
| 6 | Commercial Risks & Insurance | `/finance/risks-insurance` |
| 7 | Bank Reconciliation | `/finance/bank-reconciliation` |
| 8 | Tax Management | `/finance/tax` |
| 9 | Finance Requests & Forms | `/finance/forms` |
| 10 | Requests (shared) | `/finance/requests` |
| 11 | Financial Reports | `/finance/reports` |

---

## 1. General Ledger

### What to show
- Chart of Accounts — create, edit, activate/deactivate accounts  
- Journal Entries — draft → submit for approval → approve/reject → post → reverse  
- Ledger view — account balance drill-down  
- Financial Statements (Balance Sheet, P&L, Trial Balance)

### Demo flow

**Step 1 — Create a Chart of Account**  
> Click **Chart of Accounts** tab → **+ Add Account**

| Field | Example value |
|-------|---------------|
| Account Code | `5400` |
| Category | `Expense` |
| Account Name | `Equipment Rental` |
| Parent Account | *(leave blank or choose "5000 – Operating Expenses")* |
| Description | `All costs for rented plant and equipment on project sites` |

Click **Save**. The account appears in the list with status **Active**.

---

**Step 2 — Create a Journal Entry**  
> Click **Journal Entries** tab → **+ New Journal Entry**

| Field | Example value |
|-------|---------------|
| Reference / Description | `Accrual – Q2 Office Rent` |
| Entry Date | `2025-06-30` |
| Debit Account | `5200 – Rent Expense` |
| Debit Amount | `1,500,000.00` |
| Credit Account | `2100 – Accrued Liabilities` |
| Credit Amount | `1,500,000.00` |
| Narration | `Accrual for June 2025 head-office rent per lease INV-2025-0611` |

Click **Save as Draft**, then **Submit for Approval**.

---

**Step 3 — Approve & Post the Journal**  
- Switch to an approver role (or use the demo approver account).  
- Open the pending journal → click **Approve** → click **Post to Ledger**.  
- The entry now appears in the ledger balance for each account.

---

**Step 4 — Reverse a Posted Journal**  
- Open the posted entry → click **Reverse**.  
- Confirm the reversal date (`2025-07-01`).  
- The system creates a mirror entry with opposite debits/credits.

---

## 2. Budgeting & Forecasting

### What to show
- Create a CapEx budget → submit → approve  
- Track actual spend versus budget  
- Close a budget

### Demo flow

**Step 1 — Create a Budget**  
> Navigate to **Budgeting & Forecasting** → **+ New Budget**

| Field | Example value |
|-------|---------------|
| Budget Type | `CapEx` |
| Project | `Bonny Terminal Upgrade` |
| Budget Period | `FY 2025` |
| Currency | `NGN` |
| Approved Budget | `85,000,000.00` |
| Forecast Amount | `78,500,000.00` |
| Start Date | `2025-01-01` |
| End Date | `2025-12-31` |
| Description | `Capital expenditure budget for Bonny Terminal phase-2 construction` |

Click **Save as Draft** → **Submit for Approval**.

---

**Step 2 — Approve the Budget**  
- Approver opens the pending budget → clicks **Approve**.  
- Status changes to **Active**; the budget now appears in spend-tracking tiles.

---

**Step 3 — Show forecast vs. actuals**  
- Open the approved budget record.  
- Point out the **Approved Budget**, **Forecast**, **Actual Spend**, and **Variance** fields.  
- Explain that actuals are updated automatically when linked payables are paid.

---

## 3. Payables & Receivables

This page has two tabs: **Payables (AP)** and **Receivables (AR)**.

### Demo flow — Accounts Payable

**Create a Payable**  
> Click **Payables** tab → **+ New Payable**

| Field | Example value |
|-------|---------------|
| Vendor | `Oceanic Drilling Supplies Ltd` |
| Project | `Bonny Terminal Upgrade` |
| Purchase Order | *(select linked PO, e.g. PO-2025-0042)* |
| GRN / Goods Receipt | *(select matching GRN)* |
| Vendor Invoice No. | `ODS/INV/2025/0318` |
| Invoice Date | `2025-06-10` |
| Due Date | `2025-07-10` |
| Currency | `NGN` |
| Gross Amount | `12,500,000.00` |
| VAT (7.5%) | `937,500.00` |
| WHT (5%) | `625,000.00` |
| Payment Terms | `Net 30 Days` |
| Expense Account | `5400 – Equipment Rental` |
| Description | `Supply of 2× BOP test units per PO-2025-0042` |

Click **Save**. Net payable = ₦12,812,500.00.

---

**Record a Payment against the Payable**  
> Open the payable record → click **Record Payment**

| Field | Example value |
|-------|---------------|
| Payment Date | `2025-07-05` |
| Amount Paid | `12,812,500.00` |
| Payment Method | `Bank Transfer` |
| Bank Reference | `NXB/2025/070512` |
| Remarks | `Full settlement — FCMB account` |

Status changes to **Paid**.

---

### Demo flow — Accounts Receivable

> Click **Receivables** tab → show invoices marked **Overdue** in the stat tiles.  
> Open an overdue invoice → click **Record Payment** to demonstrate partial payment:

| Field | Example value |
|-------|---------------|
| Payment Date | `2025-07-08` |
| Amount Paid | `5,000,000.00` |
| Payment Method | `Bank Transfer` |
| Reference | `GTCO/RCV/2025/0708` |

Status changes to **Partially Paid**.

---

## 4. Invoicing & Billing

### What to show
- Create a progress invoice  
- Submit, then record payment

### Demo flow

**Create an Invoice**  
> Navigate to **Invoicing & Billing** → **+ New Invoice**

| Field | Example value |
|-------|---------------|
| Client | `TotalEnergies EP Nigeria` |
| Project | `Bonny Terminal Upgrade` |
| Issue Date | `2025-07-01` |
| Due Date | `2025-07-31` |
| Currency | `NGN` |
| Work Valuation | `25,000,000.00` |
| VAT (7.5%) | `1,875,000.00` |
| WHT (5%) | `1,250,000.00` |
| Retention (5%) | `1,250,000.00` |
| Payment Terms | `Net 30 Days` |
| Description | `Progress claim #3 — Civil works 60% completion, Bonny Terminal phase-2` |

**Net Invoice = ₦24,375,000.00**  
Click **Save** → **Issue Invoice**.

---

**Record payment when client pays**  
> Open the issued invoice → **Record Payment**

| Field | Example value |
|-------|---------------|
| Payment Date | `2025-07-29` |
| Amount Paid | `24,375,000.00` |
| Payment Method | `Bank Transfer` |
| Reference | `TOTAL/PAY/2025/0729` |

Status → **Paid**.

---

## 5. Contracts & Claims

Three sub-tabs: **Contracts**, **Variations**, **Claims**.

### Demo flow — Contracts

**Create a Contract**  
> Click **Contracts** tab → **+ New Contract**

| Field | Example value |
|-------|---------------|
| Contract Type | `EPC` |
| Client | `Nigerian Agip Oil Company` |
| Project | `Agip Flow Station Upgrade` |
| Contract Reference | `NAOC/EPC/2025/001` |
| Contract Title | `Engineering, Procurement & Construction — OML 60 Flow Station` |
| Currency | `USD` |
| Exchange Rate | `1,580` |
| Contract Value | `4,200,000.00` |
| Start Date | `2025-02-01` |
| End Date | `2026-01-31` |
| Payment Terms | `Monthly Progress Payment` |
| Description | `Turnkey EPC contract for flow-station upgrade including tie-in works` |

Click **Save as Draft** → **Submit for Review** → **Mark as Signed**.

---

**Create a Variation Order**  
> Click **Variations** tab → **+ New Variation**

| Field | Example value |
|-------|---------------|
| Contract | `NAOC/EPC/2025/001` |
| Variation Type | `Scope Addition` |
| Reason | `Client Change Request` |
| Description | `Addition of 3-phase separator skid not in original scope` |
| Value | `180,000.00` *(USD)* |
| Submission Date | `2025-04-15` |

Click **Save** → **Submit** → (Approver) **Approve** → **Incorporate**.

---

**Raise a Claim**  
> Click **Claims** tab → **+ New Claim**

| Field | Example value |
|-------|---------------|
| Contract | `NAOC/EPC/2025/001` |
| Claim Type | `EOT` |
| Description | `Extension of time — 45-day delay caused by third-party obstruction at OML 60 access road` |
| Claim Amount | `95,000.00` *(USD)* |
| Submission Date | `2025-05-20` |

Click **Save** → **Submit**.

---

## 6. Commercial Risks & Insurance

Two sub-tabs: **Commercial Risks** and **Insurance / Bonds**.

### Demo flow — Commercial Risk

**Log a Risk**  
> Click **Risks** tab → **+ New Risk**

| Field | Example value |
|-------|---------------|
| Client | `TotalEnergies EP Nigeria` |
| Project | `Bonny Terminal Upgrade` |
| Risk Category | `Penalty Clause` |
| Currency | `NGN` |
| Potential Exposure | `15,000,000.00` |
| Severity | `High` |
| Risk Owner | `Chidi Okonkwo` |
| Date Identified | `2025-06-01` |
| Risk Description | `Contract contains 0.5%/week liquidated damages clause; current schedule shows 3-week overrun risk` |
| Mitigation Plan | `Accelerate civil works; deploy additional crew; negotiate LD waiver with client PM` |

Click **Save**.

---

**Add an Insurance Policy**  
> Click **Insurance / Bonds** tab → **+ New Policy**

| Field | Example value |
|-------|---------------|
| Policy Type | `Insurance` |
| Coverage Type | `Contractors All Risk` |
| Insurer / Provider | `AXA Mansard Insurance PLC` |
| Policy Number | `AXM/CAR/2025/00412` |
| Project | `Bonny Terminal Upgrade` |
| Currency | `NGN` |
| Sum Insured | `500,000,000.00` |
| Premium | `2,500,000.00` |
| Start Date | `2025-01-15` |
| Expiry Date | `2026-01-14` |
| Renewal Reminder | `60 Days Before Expiry` |

Click **Save**.

---

## 7. Bank Reconciliation

### What to show
- Create a reconciliation period  
- Add statement items  
- Mark reconciled

### Demo flow

**Step 1 — Create a Reconciliation**  
> Navigate to **Bank Reconciliation** → **+ New Reconciliation**

| Field | Example value |
|-------|---------------|
| Bank Account | `1100 – GTBank Current Account` |
| Period | `June 2025` |
| Currency | `NGN` |
| Statement Opening Balance | `45,320,000.00` |
| Statement Closing Balance | `58,760,000.00` |

Click **Save** → **Start Reconciliation**.

---

**Step 2 — Add statement items**  
> Inside the reconciliation record, add unreconciled items:

| Date | Description | Debit | Credit |
|------|-------------|-------|--------|
| 2025-06-05 | Receipt from TotalEnergies | — | 24,375,000.00 |
| 2025-06-15 | Payment to Oceanic Drilling | 12,812,500.00 | — |
| 2025-06-28 | Bank charges | 15,000.00 | — |

---

**Step 3 — Mark as Reconciled**  
- Confirm variance = ₦0.00 → click **Mark Reconciled**.  
- Status changes to **Reconciled**; a reviewer can then **Mark Reviewed**.

---

## 8. Tax Management

### What to show
- Create a VAT/WHT record  
- File and record payment

### Demo flow

**Create a Tax Record**  
> Navigate to **Tax Management** → **+ New Tax Record**

| Field | Example value |
|-------|---------------|
| Tax Type | `VAT` |
| Legal Entity | `Denovate Engineering Ltd` |
| Filing Period | `Q2 2025` |
| Tax Amount | `3,250,000.00` |
| Due Date | `2025-07-21` |
| Tax Reference | `FIRS/VAT/2025/Q2/08871` |
| Remarks | `Computed from invoices INV-0045 through INV-0062` |

Click **Save as Draft** → **Submit for Filing**.

---

**Record Tax Payment**  
> Open filed record → **Record Payment**

| Field | Example value |
|-------|---------------|
| Payment Date | `2025-07-18` |
| Amount Paid | `3,250,000.00` |
| Payment Method | `Remita RRR` |
| Reference | `RRR/2025/071812345` |

Status → **Paid**.

---

**WHT Record (second example)**

| Field | Example value |
|-------|---------------|
| Tax Type | `WHT` |
| Legal Entity | `Denovate Engineering Ltd` |
| Filing Period | `June 2025` |
| Tax Amount | `625,000.00` |
| Due Date | `2025-07-21` |
| Tax Reference | `FIRS/WHT/2025/JUN/00234` |
| Remarks | `WHT deducted at source from vendor payment ODS/INV/2025/0318` |

---

## 9. Finance Requests & Forms

### What to show
- Raise a Payment Request  
- Approval workflow (tiers 1–3)

### Demo flow

**Create a Payment Request**  
> Navigate to **Finance Requests & Forms** → **+ New Form**

| Field | Example value |
|-------|---------------|
| Form Type | `Payment Request` |
| Request Title | `Mobilisation advance — subcontractor Subsea Works Ltd` |
| Department | `Finance & Accounts` |
| Project | `Agip Flow Station Upgrade` |
| Vendor | `Subsea Works Ltd` |
| Currency | `NGN` |
| Amount | `8,000,000.00` |
| Request Date | `2025-07-10` |
| Justification | `30% mobilisation advance required by subcontract agreement clause 12.3 to procure underwater cutting equipment` |

Click **Save as Draft** → **Submit for Approval**.

---

**Approval chain**  
| Tier | Role | Action |
|------|------|--------|
| 1 | Line Manager | Approve |
| 2 | Head of Department | Approve |
| 3 | Finance Manager / CFO | Approve |

After tier-3 approval, status → **Approved**; the form is ready for payment processing.

---

**CapEx Requisition example (second form type)**

| Field | Example value |
|-------|---------------|
| Form Type | `CapEx Requisition` |
| Request Title | `Purchase of Portable Gas Detector — 10 units` |
| Department | `HSE` |
| Project | `Bonny Terminal Upgrade` |
| Currency | `NGN` |
| Amount | `4,750,000.00` |
| Request Date | `2025-07-15` |
| Justification | `Existing detectors out of calibration; HSE regulation requires operational sensors at all times. Quote attached from Pro-Safety Ltd.` |

---

**Cash Advance example**

| Field | Example value |
|-------|---------------|
| Form Type | `Cash Advance` |
| Request Title | `Site petty cash — Agip project site July 2025` |
| Department | `Technical` |
| Project | `Agip Flow Station Upgrade` |
| Currency | `NGN` |
| Amount | `350,000.00` |
| Request Date | `2025-07-07` |
| Justification | `Weekly petty cash for consumables, generator fuel, and site transport at OML 60 location` |

---

## 10. Financial Reports

### What to show
> Navigate to **Financial Reports**

| Report | Key talking points |
|--------|--------------------|
| **Income Statement (P&L)** | Revenue vs. cost breakdown by project; net profit margin |
| **Balance Sheet** | Assets, liabilities, equity snapshot at a date |
| **Trial Balance** | Debit/credit balances for all accounts; confirms balanced ledger |
| **Cash Flow Statement** | Operating, investing, financing cash flows |
| **Accounts Payable Aging** | Outstanding payables by age bucket (0–30, 31–60, 61–90, 90+) |
| **Accounts Receivable Aging** | Overdue receivables; collection risk flagging |
| **Budget vs. Actual** | Variance per project; CapEx and Opex split |
| **Tax Summary** | VAT, WHT, CIT positions by period |

Point out the **Export CSV** / **Download PDF** button on each report for board pack preparation.

---

## Demo Tips

1. **Show the approval chain** on at least one record (journal entry, budget, or payment request) — this demonstrates governance and audit trail.
2. **Open the record drawer** (click the eye icon on any record) to show the history log, document attachments, and status timeline.
3. **Export a table** to CSV on the Invoicing or Payables list to demonstrate reporting readiness.
4. **Filter the list** using the filter drawer (funnel icon) — filter invoices by status = *Overdue* to demonstrate risk visibility.
5. **Show the stat tiles** at the top of Invoicing (Total Issued, Total Paid, Overdue, etc.) — these update live.

---

## Suggested Demo Narrative (5-minute version)

> *"The Finance module covers the full accounting cycle. We start in the **General Ledger** where accounts are defined and journal entries are created, approved, and posted. Those postings feed into the **Budget** tracking — the system automatically compares actual spend to the approved CapEx or Opex budget.*
>
> *On the payables side, vendor invoices come in, are matched to POs and goods receipts, and go through a payment recording process that updates the ledger automatically. On the receivables side, we raise progress invoices against contracts, and when the client pays, the system marks them off.*
>
> *The **Contracts & Claims** section manages the full contract lifecycle — from signature through variations to formal claims. **Commercial Risks** lets the team log and track penalty-clause exposure and insurance coverage.*
>
> *Bank Reconciliation closes the loop by matching our ledger to the bank statement each month. Tax Management keeps WHT and VAT filings on track. And the **Finance Forms** module provides a structured workflow for payment requests and CapEx requisitions, with a three-tier approval chain.*
>
> *All of this feeds into the **Financial Reports** — P&L, Balance Sheet, AR/AP aging, and Budget vs. Actual — which can be exported for board presentations."*
