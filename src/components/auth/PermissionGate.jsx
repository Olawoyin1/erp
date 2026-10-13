import { usePermission, useAnyPermission } from '../../hooks/usePermission';

/**
 * Conditionally renders children based on permission.
 *
 * <PermissionGate permission="hr.employee.create">
 *   <button>Add Employee</button>
 * </PermissionGate>
 *
 * <PermissionGate anyOf={['finance.invoice.decide', 'finance.payable.decide']}>
 *   <ApproveButton />
 * </PermissionGate>
 */
export default function PermissionGate({ permission, anyOf, fallback = null, children }) {
  const single = usePermission(permission ?? '__none__');
  const multi = useAnyPermission(...(anyOf ?? ['__none__']));

  const allowed = permission ? single : anyOf ? multi : true;
  return allowed ? children : fallback;
}
