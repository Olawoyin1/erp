# HR Module — Employee & HR Manager Experience

## Overview

There are two distinct experiences — what an **HR manager/admin** sees vs what a **regular employee** sees. Access is controlled entirely by permissions assigned to roles, not by separate portals. Same platform, same login, different views.

---

## What Every Employee Can Do Themselves

These work regardless of HR role — any staff member with a linked employee record gets these.

### Clock In / Clock Out

On the Attendance page, the employee sees a personal status card at the top. It shows their current status for the day (Not clocked in / Present / Completed). One button: `Clock In` — they pick their location and submit. After clocking in, the same button becomes `Clock Out`. After clocking out, it grays out and says "Completed for today."

- Can't clock out twice or clock in twice
- If they worked more than 8 hours, overtime is flagged automatically and sits as "pending approval"
- They can see their overtime status but someone else must approve it

### Apply for Leave

On the Leave page, every employee sees an "Apply for Leave" button. It opens a drawer where they:

- See their own name/ID pre-filled (read-only — can't apply for someone else unless they have `hr.leave.create-on-behalf`)
- Pick leave type from the seeded list (Annual, Sick, Maternity, Paternity, Emergency, Study, Unpaid, Compassionate)
- Pick start and end dates — the system auto-calculates working days live, subtracting weekends and public holidays
- See their remaining balance for that type right in the form
- If they're over their balance, the form blocks submission
- Attach a document (required for certain leave types)
- Submit — goes to HR/manager as `pending`

They can also view their own leave history from their employee profile.

### View Their Own Payslips

On the Payroll page, every employee always sees a "My Payslips" tab — even with zero payroll admin permissions. It shows:

- A table of all their payslips with period, gross salary, deductions, net salary
- Eye icon → opens a full payslip detail view in a drawer
- Download icon → downloads it as a PDF

The Payroll Structures, Tax Definitions, Payroll Runs, and Statutory Configuration tabs only appear if they have `hr.payroll.view`.

---

## What the HR Team Manages

These are visible and actionable only to people with the relevant HR permissions.

### Employee Directory & Profiles

HR can view the full employee list with search and filters by status/department. From the list they can:

- Create a new employee (modal) — auto-assigns `PGSL-0001` style ID, starts on `probation`, auto-creates an onboarding case
- Edit employee details (salary changes need a separate `hr.payroll.update` permission)
- Assign or change reporting manager
- Confirm probation → moves to `active`
- Deactivate (blocks if they're still running a project or heading a department — tells you exactly what's blocking)
- Reactivate if needed

> Sensitive fields (salary, DOB, address, next of kin) are hidden from people without `hr.employee.view-sensitive`.

### Onboarding

When HR creates an employee, an onboarding case is automatically created with 4 default checklist tasks. HR then:

- Tracks the case through `Pending → In Progress → Completed → Ready for Deployment`
- Sees a progress ring showing % of checklist done
- Verifies uploaded documents (medical clearance, contracts, etc.)
- Advances the status manually per stage

### Recruitment

Two-tab view:

**Job Postings** — HR creates postings with position, salary range, hiring supervisor, vacancies. They can pause/resume/close postings. Each posting tracks how many applications it's received.

**Candidates** — Pipeline view showing all candidates per posting and their stage:
`Applied → Screening → Assessment → Interview → Offer → Hired`

- HR advances or rejects candidates
- Rejection writes a separate audit entry
- When a candidate reaches `Hired`, one action converts them directly into a full employee record — name, email, department, position all carry over automatically
- The job posting auto-closes when all vacancies are filled

### Attendance (HR View)

Below the employee's personal clock-in card, HR sees the full attendance table for all staff. They can:

- Filter by date, status, location
- View any record's detail (who, when, hours, overtime)
- Log attendance manually for any employee (needs `hr.attendance.log`) with a correction reason
- Approve overtime from the record detail modal
- Export the list to CSV
- See live stat tiles: Present today, Late arrivals, Absent, Total overtime hours

### Leave Management (HR View)

HR sees all leave requests across the company. From the list:

- View details of any request
- Approve (deducts balance atomically)
- Decline with a reason (employee gets notified)
- Request changes — sends an email to the employee without changing the status
- Apply on behalf of an employee (with `hr.leave.create-on-behalf`)

Stat cards show total Pending / Approved / Declined counts.

### Deployments

HR assigns employees to project sites with employee, project name, site, role, type (full-time / rotation / temporary), and dates.

System blocks creation if:
- Employee is on approved leave during that period
- Employee's offshore travel documents expire before the deployment ends

Status flow: `Pending → Active → On Hold → Completed`

- Going `Active` updates the employee's current project reference automatically
- Completed deployments generate a downloadable report

### Training & Certifications

HR creates training programs, enrolls multiple employees at once, tracks attendance per participant, and evaluates outcomes.

- Outcome `Value Created` → automatically creates/updates a certification on the employee's profile with the expiry date
- Employees are notified when enrolled, when a program is cancelled, and when evaluated

### Payroll (HR/Payroll Team)

The payroll hub has 5 tabs for HR/payroll staff plus the universal "My Payslips":

| Tab | Who Sees It |
|---|---|
| Payroll Structure | `hr.payroll.view` |
| Tax Definitions | `hr.payroll.view` |
| Payslips | `hr.payroll.view` |
| Payroll Runs | `hr.payroll.view` |
| Statutory Configuration | `hr.payroll.view` |
| My Payslips | Everyone |

Key rules:
- The person who generates a payroll run **cannot** approve it
- Statutory config versions must be confirmed by the accountant before they go live
- Approving a run automatically posts ledger entries to Finance

### Grievances & Discipline

HR creates disciplinary cases, progresses them through `Start Review → Resolve → Close`, and adds notes at each stage with a live stat dashboard.

### HR Requests

Administrative requests with a 4-step approval chain. HR can create, track, approve, or reject requests.

### HR Documents

Document management with a full state machine:
`Upload → Submit → Approve/Reject → Checkout/Checkin → Archive/Restore → Download`

Live stat tiles show document status counts.

### Reports

HR analytics page with headcount trend charts and dynamic KPI tiles.

---

## The Key Distinction

An employee logs in and sees only what they need: their clock-in button, their leave application, their payslips. An HR manager logs in to the same platform and the same pages show the full management view — the org-wide attendance table, the full leave queue with approve/decline buttons, the payroll run controls — all because of the permissions attached to their role. No separate portal, no separate login.
