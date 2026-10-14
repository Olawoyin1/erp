/**
 * Mirror of the backend's permission presets (src/lib/permissionPresets.ts): the Roles screen shows an
 * 8 module x 4 action grid and the server expands each checked box into the real `module.resource.action`
 * keys. The catalogue itself always comes from `GET /permissions`; only the module labels and the
 * action classification are repeated here so the grid can be drawn from a role's real permission keys.
 */
export const UI_MODULES = [
  { label: 'Administration', namespace: 'administration' },
  { label: 'Human Resources', namespace: 'hr' },
  { label: 'Accounts & Finance', namespace: 'finance' },
  { label: 'Business Development', namespace: 'businessdev' },
  { label: 'Procurement', namespace: 'procurement' },
  { label: 'Quality System', namespace: 'quality' },
  { label: 'HSE', namespace: 'hse' },
  { label: 'Technical', namespace: 'technical' },
];

export const UI_ACTIONS = ['view', 'create', 'approve', 'configure'];
export const ACTION_LABELS = { view: 'View', create: 'Create', approve: 'Approve', configure: 'Configure' };

/** Namespaces that the grid never grants (assigned through the Platform permissions panel instead). */
export const PLATFORM_NAMESPACES = ['core', 'dashboard'];

const APPROVE_ACTIONS = new Set([
  'decide', 'decide-tier2', 'decide-tier3', 'approve', 'reject', 'resolve', 'verify', 'evaluate',
  'transition', 'restock', 'send', 'checkout', 'checkin', 'assign',
]);

export function classifyAction(action) {
  if (action === 'view') return 'view';
  if (action === 'create') return 'create';
  return APPROVE_ACTIONS.has(action) ? 'approve' : 'configure';
}

/** Every real key a module's checked actions expand to. */
export function expandModule(catalogue, namespace, actions) {
  const keys = [];
  const resources = catalogue?.[namespace] || {};
  Object.entries(resources).forEach(([resource, list]) => {
    list.forEach((action) => {
      if (actions.includes(classifyAction(action))) keys.push(`${namespace}.${resource}.${action}`);
    });
  });
  return keys;
}

export function emptyGrid() {
  const grid = {};
  UI_MODULES.forEach((m) => {
    grid[m.label] = { view: false, create: false, approve: false, configure: false };
  });
  return grid;
}

/** Grid -> `{ "Human Resources": ["view", "create"] }` for the API. */
export function gridToPresets(grid) {
  const out = {};
  UI_MODULES.forEach((m) => {
    const actions = UI_ACTIONS.filter((a) => grid[m.label]?.[a]);
    if (actions.length) out[m.label] = actions;
  });
  return out;
}

/**
 * Draws the grid from the role's real permission keys: a box is ticked when the role holds every key of
 * that module in that bucket. Keys that do not make up a whole bucket are returned as `partial` so saving
 * the grid does not silently drop them.
 */
export function deriveGrid(catalogue, permissions) {
  const held = new Set(permissions || []);
  const grid = emptyGrid();
  UI_MODULES.forEach((m) => {
    UI_ACTIONS.forEach((action) => {
      const keys = expandModule(catalogue, m.namespace, [action]);
      grid[m.label][action] = keys.length > 0 && keys.every((k) => held.has(k));
    });
  });
  const covered = new Set(
    UI_MODULES.flatMap((m) => expandModule(catalogue, m.namespace, UI_ACTIONS.filter((a) => grid[m.label][a]))),
  );
  const moduleNamespaces = new Set(UI_MODULES.map((m) => m.namespace));
  const partial = (permissions || []).filter((key) => {
    const namespace = key.split('.')[0];
    return moduleNamespaces.has(namespace) && !covered.has(key);
  });
  return { grid, partial };
}

/** Real keys of the platform namespaces (core.*, dashboard.*) in catalogue order, grouped by resource. */
export function platformGroups(catalogue) {
  return PLATFORM_NAMESPACES.flatMap((namespace) =>
    Object.entries(catalogue?.[namespace] || {}).map(([resource, actions]) => ({
      namespace,
      resource,
      keys: actions.map((action) => ({ action, key: `${namespace}.${resource}.${action}` })),
    })),
  );
}

export const RESOURCE_LABELS = {
  'core.user': 'Users',
  'core.role': 'Roles',
  'core.department': 'Departments',
  'core.location': 'Locations',
  'core.settings': 'Settings',
  'core.document': 'Documents',
  'core.task': 'Tasks',
  'core.notification': 'Notifications',
  'core.auditlog': 'Audit log and activity feed',
  'dashboard.overview': 'Dashboard overview',
};
