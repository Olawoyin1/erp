import { usePermission, useAnyPermission, useAllPermissions } from '../../hooks/usePermission';

/**
 * Conditionally renders children based on permission.
 *
 * <PermissionGate permission="hr.employee.create"><button>Add Employee</button></PermissionGate>
 * <PermissionGate anyOf={['finance.invoice.decide', 'finance.payable.decide']}>...</PermissionGate>
 * <PermissionGate allOf={['core.user.view', 'core.role.view']}>...</PermissionGate>
 *
 * With no prop the children render. Super Admin always passes.
 */
export default function PermissionGate({ permission, anyOf, allOf, fallback = null, children }) {
  const single = usePermission(permission);
  const some = useAnyPermission(...(anyOf ?? []));
  const every = useAllPermissions(...(allOf ?? []));

  let allowed = true;
  if (permission) allowed = single;
  else if (anyOf) allowed = some;
  else if (allOf) allowed = every;

  return allowed ? children : fallback;
}
