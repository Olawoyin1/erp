import { useState } from 'react';
import { FiLock } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { PermissionMatrix, PlatformPermissions } from './PermissionEditor';
import { PLATFORM_NAMESPACES, deriveGrid, gridToPresets } from './permissionPresets';

const PSEUDO_DEPARTMENTS = ['System-wide', 'Cross-department'];

const notice = (tone, children) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 6, fontSize: '0.813rem',
      backgroundColor: tone === 'error' ? '#FEF2F2' : '#FFF7ED',
      border: `1px solid ${tone === 'error' ? '#FECACA' : '#FED7AA'}`,
      color: tone === 'error' ? '#B91C1C' : '#C2410C',
    }}
    role={tone === 'error' ? 'alert' : undefined}
  >
    {tone !== 'error' && <FiLock size={14} />} {children}
  </div>
);

/**
 * Add / Edit Role drawer. The checkbox grid is drawn from the role's real permission keys and saved as
 * `modulePresets`; the Platform permissions panel and any fine-grained keys the grid cannot express are
 * sent as `permissions`, so saving never drops a permission the user did not untick.
 */
export default function RoleFormDrawer({ role, catalogue, departmentNames, ownRole, onClose, onSubmit }) {
  const isEditing = !!role;
  const isSystem = !!role?.isSystem;
  const locked = isSystem || ownRole;

  const [initial] = useState(() => {
    const derived = deriveGrid(catalogue, role?.permissions || []);
    return {
      grid: derived.grid,
      partial: derived.partial,
      platform: (role?.permissions || []).filter((k) => PLATFORM_NAMESPACES.includes(k.split('.')[0])),
    };
  });

  const [form, setForm] = useState({
    name: role?.name || '',
    department: role?.department || '',
    description: role?.description || '',
  });
  const [grid, setGrid] = useState(initial.grid);
  const [platform, setPlatform] = useState(initial.platform);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: '' }));
    setFormError('');
  };

  const deptOptions = [...new Set([...PSEUDO_DEPARTMENTS, ...departmentNames, ...(role?.department ? [role.department] : [])])];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Role name is required';
    if (!form.department) errs.department = 'Select a department';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = { name: form.name.trim(), department: form.department, description: form.description.trim() };
    if (isSystem) {
      delete payload.name;
    } else if (!locked) {
      payload.modulePresets = gridToPresets(grid);
      payload.permissions = [...new Set([...platform, ...initial.partial])];
    }

    setSaving(true);
    const result = await onSubmit(payload);
    setSaving(false);
    if (result?.error) {
      setErrors(result.error.fieldErrors || {});
      setFormError(result.error.message);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
        Cancel
      </button>
      <button type="submit" form="role-form" disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Role'}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen
      onClose={onClose}
      title={isEditing ? 'Edit Role' : 'Add Role'}
      subtitle={isEditing ? 'Update role details and module permissions.' : 'Define a new role and set exactly what it can see and do across the ERP'}
      width="560px"
      footer={footer}
    >
      <form id="role-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && notice('error', formError)}
        {isSystem && notice('warn', 'System role: the name and permissions cannot be changed.')}
        {!isSystem && ownRole && notice('warn', 'You hold this role, so its permissions cannot be changed by you. Ask another administrator.')}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Role ID">
            <Input value={role?.roleCode || 'Auto-generated'} readOnly style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Role Name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="HR - Staff" disabled={isSystem} error={!!errors.name} maxLength={100} />
          </FormField>
        </div>
        <FormField label="Department" required error={errors.department}>
          <Select value={form.department} onChange={(e) => set('department', e.target.value)} options={deptOptions} placeholder="Select department" searchable error={!!errors.department} />
        </FormField>
        <FormField label="Description" required error={errors.description}>
          <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What this role is for" rows={3} maxLength={500} error={!!errors.description} />
        </FormField>

        <FormField label="Module Access & Permissions" required={!locked} error={errors.modulePresets || errors.permissions}>
          <PermissionMatrix grid={grid} onChange={setGrid} readOnly={locked} />
        </FormField>
        <FormField
          label="Platform Permissions"
          helpText="Users, roles, settings, documents, tasks, audit log and the dashboard are granted here, not by the module grid."
        >
          <PlatformPermissions catalogue={catalogue} selected={platform} onChange={setPlatform} readOnly={locked} />
        </FormField>
        {initial.partial.length > 0 && (
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            {initial.partial.length} fine-grained module permission{initial.partial.length === 1 ? '' : 's'} on this role are kept as they are.
          </div>
        )}
      </form>
    </Drawer>
  );
}
