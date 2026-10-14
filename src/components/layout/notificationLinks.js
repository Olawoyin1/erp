import apiClient from '../../services/apiClient';

export function notifDotColor(priority) {
  if (priority === 'P0') return '#DC2626';
  if (priority === 'P1') return '#F59E0B';
  return '#1D4ED8';
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * The backend writes `link` as a path in its own vocabulary (`/hr/leave/<id>`, `/finance/invoices/<id>`,
 * `/business-dev/tenders/<id>` ...). This table maps each backend prefix to the page that shows that kind of
 * record in this app. Only two screens have a per-record route (`/hr/employees/:id`, `/technical/projects/:id`);
 * every other record opens its list page.
 */
const OBJECT_ID = /^[0-9a-f]{24}$/i;

const PREFIXES = [
  ['/hr/recruitment', '/hr/recruitment'],
  ['/hr/leave', '/hr/leave'],
  ['/hr/training', '/hr/certifications'],
  ['/hr/payroll', '/hr/payroll'],
  ['/hr/disciplinary', '/hr/grievances'],
  ['/hr/deployments', '/hr/deployment'],
  ['/hr/attendance', '/hr/attendance'],
  ['/hr/onboarding', '/hr/onboarding'],
  ['/administration/requests', '/administration/requests'],
  ['/administration/travel', '/administration/travels'],
  ['/administration/movements', '/administration/travels'],
  ['/administration/maintenance', '/administration/maintenance'],
  ['/administration/disposals', '/administration/waste'],
  ['/administration/memos', '/administration/memos'],
  ['/administration/assets', '/administration/assets'],
  ['/administration/supplies', '/administration/assets'],
  ['/business-dev/clients', '/bizdev/pipeline'],
  ['/business-dev/tenders', '/bizdev/tenders'],
  ['/business-dev/rfqs', '/bizdev/tenders'],
  ['/business-dev/opportunities', '/bizdev/proposals'],
  ['/technical/resource-requests', '/technical/resources'],
  ['/technical/engineering-documents', '/technical/engineering-docs'],
  ['/technical/calibration', '/technical/calibration'],
  ['/technical/logs', '/technical/projects'],
  ['/technical/site-diary', '/technical/projects'],
  ['/technical/timesheets', '/technical/projects'],
  ['/procurement/requisitions', '/procurement/requests'],
  ['/procurement/rfqs', '/procurement/rfq'],
  ['/procurement/purchase-orders', '/procurement/orders'],
  ['/procurement/deliveries', '/procurement/expediting'],
  ['/procurement/goods-receipts', '/procurement/expediting'],
  ['/procurement/vendors', '/procurement/vendors'],
  ['/procurement/prequalification', '/procurement/vendors'],
  ['/procurement/stock-movements', '/procurement/inventory'],
  ['/procurement/inventory', '/procurement/inventory'],
  ['/hse/offshore-documents', '/hse/offshore-travel'],
  ['/hse/emergency-plans', '/hse/emergency'],
  ['/quality/audits', '/quality/audits'],
  ['/finance/invoices', '/finance/invoicing'],
  ['/finance/payables', '/finance/ap-ar'],
  ['/finance/forms', '/finance/forms'],
  ['/finance/contracts', '/finance/contracts-claims'],
  ['/finance/variations', '/finance/contracts-claims'],
  ['/finance/claims', '/finance/contracts-claims'],
  ['/finance/budgets', '/finance/budget'],
  ['/finance/journal-entries', '/finance/ledger'],
  ['/finance/tax', '/finance/tax'],
  ['/finance/insurance', '/finance/risks-insurance'],
  ['/finance/risks', '/finance/risks-insurance'],
  ['/finance/reconciliations', '/finance/bank-reconciliation'],
  ['/admin/users', '/users'],
  ['/admin/system/email', '/settings?tab=email'],
  ['/admin/system/jobs', '/settings?tab=audit'],
  ['/settings/company', '/settings?tab=company'],
  ['/notifications', '/notifications'],
  ['/login', '/auth/login'],
  ['/forgot-password', '/auth/forgot-password'],
];

const DOCUMENT_PAGES = {
  hr: '/hr/documents',
  administration: '/administration/documents',
  procurement: '/procurement/documents',
  hse: '/hse/documents',
  quality: '/quality/documents',
  technical: '/technical/engineering-docs',
};

const TASK_PAGES = {
  hr: '/hr/tasks',
  administration: '/administration/tasks',
  finance: '/finance/tasks',
  technical: '/technical/tasks',
  procurement: '/procurement/tasks',
  quality: '/quality/tasks',
  hse: '/hse/tasks',
};

function split(link) {
  let value = String(link || '').trim();
  value = value.replace(/^https?:\/\/[^/]+/i, '');
  const [path, query] = value.split('?');
  return { path: path.replace(/\/+$/, '') || '/', query: query ? `?${query}` : '' };
}

/**
 * Synchronous resolution. Returns `{ to }` for a known page, `{ lookup: 'task'|'document', id }` when the
 * record's module must be fetched first, or `null` when the link is not understood.
 */
export function resolveNotificationLink(link) {
  if (!link) return null;
  const { path, query } = split(link);

  const record = /^\/(tasks|documents)\/([^/]+)$/.exec(path);
  if (record) return { lookup: record[1] === 'tasks' ? 'task' : 'document', id: record[2] };

  const employee = /^\/hr\/employees(?:\/([^/]+))?$/.exec(path);
  if (employee) return { to: `/hr/employees${OBJECT_ID.test(employee[1] || '') ? `/${employee[1]}` : ''}${query}` };

  const project = /^\/technical\/projects(?:\/([^/]+))?(?:\/wbs)?$/.exec(path);
  if (project) return { to: `/technical/projects${OBJECT_ID.test(project[1] || '') ? `/${project[1]}` : ''}${query}` };

  const hit = PREFIXES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  if (!hit) return null;
  const target = hit[1];
  // A target that already carries its own query keeps it; otherwise keep the backend's filter query.
  return { to: target.includes('?') ? target : `${target}${query}` };
}

/** Resolves a link to a path, fetching the record when its module decides the page. Null when unknown. */
export async function resolveNotificationTarget(link) {
  const result = resolveNotificationLink(link);
  if (!result) return null;
  if (result.to) return result.to;
  try {
    if (result.lookup === 'task') {
      const { data } = await apiClient.get(`/tasks/${result.id}`);
      return TASK_PAGES[String(data?.data?.module || '').toLowerCase()] || null;
    }
    const { data } = await apiClient.get(`/documents/${result.id}`);
    return DOCUMENT_PAGES[String(data?.data?.module || '').toLowerCase()] || null;
  } catch {
    return null;
  }
}
