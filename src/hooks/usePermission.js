import { useSelector } from 'react-redux';
import { selectPermissions, selectRoles } from '../store/authSlice';

/**
 * Returns true if the current user holds the given permission key,
 * or if they are a super-admin (which bypasses all permission checks).
 *
 * Usage:
 *   const canView = usePermission('hr.employee.view');
 *   const canCreate = usePermission('hr.employee.create');
 */
export function usePermission(permissionKey) {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);

  const isSuperAdmin = roles.includes('super-admin');
  if (isSuperAdmin) return true;

  return permissions.includes(permissionKey);
}

/**
 * Returns true if the user holds ANY of the given permission keys.
 */
export function useAnyPermission(...keys) {
  const permissions = useSelector(selectPermissions);
  const roles = useSelector(selectRoles);

  const isSuperAdmin = roles.includes('super-admin');
  if (isSuperAdmin) return true;

  return keys.some((key) => permissions.includes(key));
}
