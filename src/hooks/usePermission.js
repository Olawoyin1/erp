import { useSelector } from 'react-redux';
import { selectPermissions, selectRoles } from '../store/authSlice';

/** Role slug that bypasses every permission check (same constant as the backend's SUPER_ADMIN_SLUG). */
export const SUPER_ADMIN_SLUG = 'super-admin';

export const isSuperAdminRole = (roles) => Array.isArray(roles) && roles.includes(SUPER_ADMIN_SLUG);

/** Plain (non-hook) check, used by navigation helpers: `can` is the function returned by `usePermissions`. */
export const holds = (permissions, roles, key) =>
  !!key && (isSuperAdminRole(roles) || (Array.isArray(permissions) && permissions.includes(key)));

/**
 * Returns true if the current user holds the given permission key, or is a Super Admin.
 *
 *   const canView = usePermission('hr.employee.view');
 */
export function usePermission(permissionKey) {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  return holds(permissions, roles, permissionKey);
}

/** Returns true if the user holds ANY of the given keys (arrays are accepted too). */
export function useAnyPermission(...keys) {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  const list = keys.flat();
  if (isSuperAdminRole(roles)) return list.length > 0;
  return list.some((key) => holds(permissions, roles, key));
}

/** Returns true if the user holds EVERY given key. */
export function useAllPermissions(...keys) {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  const list = keys.flat();
  return list.length > 0 && list.every((key) => holds(permissions, roles, key));
}

/** `{ can(key), canAny(keys), isSuperAdmin }` for code that checks many keys (navigation, menus). */
export function usePermissions() {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);
  return {
    isSuperAdmin: isSuperAdminRole(roles),
    can: (key) => holds(permissions, roles, key),
    canAny: (keys) => (keys || []).some((key) => holds(permissions, roles, key)),
  };
}
