import {
  FiGrid,
  FiTrendingUp,
  FiUsers,
  FiSettings,
  FiDollarSign,
  FiTool,
  FiCheckCircle,
  FiAlertTriangle,
  FiShoppingCart,
  FiLock,
} from 'react-icons/fi';

/**
 * Single source of truth for the sidebar, the route gate and the post-login landing page.
 *
 * Every entry names the permission that opens its page: `permission` (one key) or `anyOf`
 * (several keys, for pages that show more than one resource). The key is the `.view` key of the
 * page's main resource from docs/RBAC-MATRIX.md. An entry with neither is open to every signed-in user.
 *
 * Baseline: the self-service pages (My Payslips, Leave, Attendance, Grievances, Training, Travel & Logistics,
 * Memos, Requests) are gated by keys that every role carries (the baseline "Staff (All Employees)" role and the
 * Manager/Staff role of each module hold them, see docs/api/platform-core.md section 4.0), and the server limits
 * every one of those pages to the person's own data. So a user whose only role is the baseline role sees exactly
 * these pages plus Dashboard, Settings and the Tasks/Documents entries of the modules they can open.
 *
 * A `Requests` entry in a module other than Administration is the SAME Administrative Requests page and data as
 * Administration > Administrative Requests (one shared component). It is `shared`, so it only shows in a module the
 * user can already open: nobody gets a whole module in the sidebar just because of Requests.
 *
 * A new page needs one line here (and its <Route> in App.jsx); the sidebar, the "no access" page and the
 * landing redirect then pick it up with no further change.
 */
export const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', icon: FiGrid, path: '/dashboard', permission: 'dashboard.overview.view' },
    ],
  },
  {
    section: 'Operations',
    items: [
      {
        label: 'Administration',
        icon: FiSettings,
        path: '/administration',
        children: [
          { label: 'EDMS', path: '/administration/edms', permission: 'core.document.view', shared: true },
          {
            label: 'Assets & Supplies',
            path: '/administration/assets',
            anyOf: ['administration.asset.view', 'administration.supplyitem.view'],
          },
          { label: 'Administrative Requests', path: '/administration/requests', permission: 'administration.adminrequest.view' },
          { label: 'Facility Maintenance', path: '/administration/maintenance', permission: 'administration.facilitymaintenance.view' },
          {
            label: 'Travel & Logistics',
            path: '/administration/travels',
            anyOf: ['administration.travelrequest.view', 'administration.movement.view'],
          },
          { label: 'Memos', path: '/administration/memos', permission: 'administration.memo.view' },
          { label: 'Waste & Disposal', path: '/administration/waste', permission: 'administration.disposal.view' },
          { label: 'Tasks', path: '/administration/tasks', permission: 'core.task.view', shared: true },
          { label: 'Admin Documents', path: '/administration/documents', permission: 'core.document.view', shared: true },
          {
            label: 'Reports',
            path: '/administration/reports',
            anyOf: [
              'administration.asset.view',
              'administration.supplyitem.view',
              'administration.adminrequest.view-all',
              'administration.adminrequest.update',
              'administration.adminrequest.decide',
              'administration.travelrequest.view-all',
              'administration.travelrequest.update',
              'administration.travelrequest.decide',
              'administration.facilitymaintenance.view',
              'administration.disposal.view',
            ],
          },
        ],
      },
      {
        label: 'Human Resources',
        icon: FiUsers,
        path: '/hr',
        children: [
          { label: 'Employees', path: '/hr/employees', permission: 'hr.employee.view' },
          { label: 'Recruitment', path: '/hr/recruitment', anyOf: ['hr.jobposting.view', 'hr.candidate.view'] },
          { label: 'Onboarding', path: '/hr/onboarding', permission: 'hr.onboarding.view' },
          { label: 'Deployment', path: '/hr/deployment', permission: 'hr.deployment.view' },
          { label: 'Training & Certifications', path: '/hr/certifications', permission: 'hr.training.view' },
          { label: 'Leave Management', path: '/hr/leave', permission: 'hr.leave.view' },
          { label: 'Attendance & Timesheets', path: '/hr/attendance', permission: 'hr.attendance.view' },
          { label: 'Payroll Inputs', path: '/hr/payroll', permission: 'hr.payroll.view' },
          { label: 'My Payslips', path: '/hr/my-payslips', selfService: true },
          { label: 'Grievances & Discipline', path: '/hr/grievances', permission: 'hr.disciplinarycase.view' },
          { label: 'Requests', path: '/hr/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/hr/tasks', permission: 'core.task.view', shared: true },
          { label: 'HR Documents', path: '/hr/documents', permission: 'core.document.view', shared: true },
          { label: 'Reports', path: '/hr/reports', permission: 'hr.reports.view' },
        ],
      },
      {
        label: 'Accounts & Finance',
        icon: FiDollarSign,
        path: '/finance',
        children: [
          {
            label: 'General Ledger',
            path: '/finance/ledger',
            anyOf: ['finance.account.view', 'finance.journalentry.view', 'finance.ledger.view'],
          },
          { label: 'Budgeting & Forecasting', path: '/finance/budget', permission: 'finance.budget.view' },
          { label: 'Payables & Receivables', path: '/finance/ap-ar', anyOf: ['finance.payable.view', 'finance.invoice.view'] },
          { label: 'Invoicing & Billing', path: '/finance/invoicing', permission: 'finance.invoice.view' },
          {
            label: 'Contracts & Claims',
            path: '/finance/contracts-claims',
            anyOf: ['finance.contract.view', 'finance.contractvariation.view', 'finance.contractclaim.view'],
          },
          {
            label: 'Commercial Risks & Insurance',
            path: '/finance/risks-insurance',
            anyOf: ['finance.commercialrisk.view', 'finance.insurancepolicy.view'],
          },
          { label: 'Bank Reconciliation', path: '/finance/bank-reconciliation', permission: 'finance.bankreconciliation.view' },
          { label: 'Tax Management', path: '/finance/tax', permission: 'finance.taxrecord.view' },
          { label: 'Finance Requests & Forms', path: '/finance/forms', permission: 'finance.financeform.view' },
          { label: 'Requests', path: '/finance/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/finance/tasks', permission: 'core.task.view', shared: true },
          { label: 'Financial Reports', path: '/finance/reports', permission: 'finance.reports.view' },
        ],
      },
      {
        label: 'Business Development',
        icon: FiTrendingUp,
        path: '/bizdev',
        children: [
          { label: 'Client Pipeline', path: '/bizdev/pipeline', permission: 'businessdev.client.view' },
          { label: 'RFQs & Tenders', path: '/bizdev/tenders', anyOf: ['businessdev.tender.view', 'businessdev.rfq.view'] },
          { label: 'Proposals', path: '/bizdev/proposals', permission: 'businessdev.opportunity.view' },
          { label: 'CRM Contacts', path: '/bizdev/crm', permission: 'businessdev.interaction.view' },
          { label: 'Requests', path: '/bizdev/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Reports', path: '/bizdev/reports', permission: 'businessdev.reports.view' },
        ],
      },
      {
        label: 'Technical',
        icon: FiTool,
        path: '/technical',
        children: [
          { label: 'Projects', path: '/technical/projects', permission: 'technical.project.view' },
          { label: 'Engineering Documents', path: '/technical/engineering-docs', permission: 'technical.engineeringdocument.view' },
          { label: 'Calibration Records', path: '/technical/calibration', permission: 'technical.calibrationrecord.view' },
          { label: 'Resource Allocation', path: '/technical/resources', permission: 'technical.resourcerequest.view' },
          { label: 'Requests', path: '/technical/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/technical/tasks', permission: 'core.task.view', shared: true },
          { label: 'Technical Reports', path: '/technical/reports', permission: 'technical.reports.view' },
        ],
      },
    ],
  },
  {
    section: 'Compliance',
    items: [
      {
        label: 'Quality System',
        icon: FiCheckCircle,
        path: '/quality',
        children: [
          { label: 'Audit Management', path: '/quality/audits', permission: 'quality.audit.view' },
          { label: 'Calibration Records', path: '/quality/calibration', permission: 'quality.calibrationrecord.view' },
          { label: 'Materials Inspection', path: '/quality/inspections', permission: 'quality.goodsreceipt.view' },
          { label: 'Requests', path: '/quality/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/quality/tasks', permission: 'core.task.view', shared: true },
          { label: 'QMS Documents', path: '/quality/documents', permission: 'core.document.view', shared: true },
          { label: 'Reports', path: '/quality/reports', permission: 'quality.reports.view' },
        ],
      },
      {
        label: 'HSE',
        icon: FiAlertTriangle,
        path: '/hse',
        children: [
          { label: 'Offshore Travel Documents', path: '/hse/offshore-travel', permission: 'hse.offshoretraveldocument.view' },
          { label: 'Emergency Preparedness', path: '/hse/emergency', anyOf: ['hse.emergencyplan.view', 'hse.emergencycontact.view'] },
          { label: 'Requests', path: '/hse/requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/hse/tasks', permission: 'core.task.view', shared: true },
          { label: 'HSE Documents', path: '/hse/documents', permission: 'core.document.view', shared: true },
          { label: 'Reports', path: '/hse/reports', permission: 'hse.reports.view' },
        ],
      },
    ],
  },
  {
    section: 'Supply Chain',
    items: [
      {
        label: 'Procurement',
        icon: FiShoppingCart,
        path: '/procurement',
        children: [
          { label: 'Requisition Tracker', path: '/procurement/requests', permission: 'procurement.requisition.view' },
          { label: 'RFQ / RFP Management', path: '/procurement/rfq', permission: 'procurement.rfq.view' },
          { label: 'Purchase Order Tracking', path: '/procurement/orders', permission: 'procurement.purchaseorder.view' },
          { label: 'Expediting & Delivery', path: '/procurement/expediting', permission: 'procurement.delivery.view' },
          { label: 'Vendor Management', path: '/procurement/vendors', permission: 'procurement.vendor.view' },
          { label: 'Inventory & Warehouse', path: '/procurement/inventory', permission: 'procurement.inventoryitem.view' },
          { label: 'Requests', path: '/procurement/admin-requests', permission: 'administration.adminrequest.view', shared: true },
          { label: 'Tasks', path: '/procurement/tasks', permission: 'core.task.view', shared: true },
          { label: 'Procurement Documents', path: '/procurement/documents', permission: 'core.document.view', shared: true },
          { label: 'Reports', path: '/procurement/reports', permission: 'procurement.reports.view' },
        ],
      },
    ],
  },
  {
    section: 'User Management',
    items: [
      { label: 'Users', icon: FiUsers, path: '/users', permission: 'core.user.view' },
      { label: 'Roles & Permissions', icon: FiLock, path: '/roles', permission: 'core.role.view' },
    ],
  },
  {
    section: 'System',
    items: [{ label: 'Settings', icon: FiSettings, path: '/settings' }],
  },
];

/** Does `can(key)` satisfy this entry's access rule? An entry with no rule is open. */
export function allows(entry, can) {
  if (entry.permission) return can(entry.permission);
  if (entry.anyOf) return entry.anyOf.some((key) => can(key));
  return true;
}

/**
 * Tasks and documents pages exist in several modules but need the same platform key (`core.task.view`,
 * `core.document.view`). A `shared` page therefore also needs a page of its own module: a user who can only
 * open HR pages does not get a Tasks entry under Finance.
 */
function moduleOpen(group, can) {
  return !!group?.children?.some((child) => !child.shared && !child.selfService && allows(child, can));
}

/** Can the user open this leaf? `group` is the module entry that contains it (none for a top-level page). */
export function canOpen(leaf, group, can) {
  if (!allows(leaf, can)) return false;
  return !leaf.shared || moduleOpen(group, can);
}

/** The menu the user may see: leaves they cannot open are dropped, and so are sections left empty. */
export function filterNav(nav, can) {
  return nav
    .map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (!item.children) return allows(item, can) ? item : null;
          const children = item.children.filter((child) => canOpen(child, item, can));
          return children.length ? { ...item, children } : null;
        })
        .filter(Boolean),
    }))
    .filter((section) => section.items.length > 0);
}

const LEAVES = NAV.flatMap((section) =>
  section.items.flatMap((item) =>
    item.children ? item.children.map((leaf) => ({ leaf, group: item })) : [{ leaf: item, group: null }],
  ),
);

/** Leaves ordered so the longest path matches first (`/hr/employees/12` resolves to `/hr/employees`). */
const BY_PATH_LENGTH = [...LEAVES].sort((a, b) => b.leaf.path.length - a.leaf.path.length);

/** The page entry (and its module) at `pathname`, as `{ leaf, group }`, or null when the path is not a gated page. */
export function findAccess(pathname) {
  return (
    BY_PATH_LENGTH.find(({ leaf }) => pathname === leaf.path || pathname.startsWith(`${leaf.path}/`)) || null
  );
}

/** Can the user open the page at `pathname`? Paths that are not gated pages are open. */
export function canOpenPath(pathname, can) {
  const found = findAccess(pathname);
  return !found || canOpen(found.leaf, found.group, can);
}

/** First page of a section the user may open (`/hr` becomes `/hr/employees`), or null. */
export function firstPathInSection(sectionPath, can) {
  const item = NAV.flatMap((section) => section.items).find((entry) => entry.path === sectionPath);
  const child = item?.children?.find((leaf) => canOpen(leaf, item, can));
  return child ? child.path : null;
}

/** Where to send a user after sign-in: the dashboard when allowed, else the first module page they may open. */
export function getLandingPath(can) {
  const dashboard = LEAVES.find(({ leaf }) => leaf.path === '/dashboard');
  if (dashboard && canOpen(dashboard.leaf, dashboard.group, can)) return dashboard.leaf.path;
  const first = LEAVES.find(({ leaf, group }) => leaf.path !== '/settings' && canOpen(leaf, group, can));
  return first ? first.leaf.path : '/settings';
}

/** Flat list of the pages the user may open, for the header's page search. */
export function searchablePages(can) {
  return filterNav(NAV, can).flatMap((section) =>
    section.items.flatMap((item) =>
      item.children
        ? item.children.map((child) => ({ label: child.label, group: item.label, path: child.path }))
        : [{ label: item.label, group: section.section, path: item.path }],
    ),
  );
}
