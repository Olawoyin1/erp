import { useState } from 'react';
import Drawer from '../../components/ui/Drawer';
import { FormField, Input, Select } from '../../components/ui/FormField';
import { FiLock } from 'react-icons/fi';

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

function RolePicker({ roles, selected, onToggle, canGrant, error, disabled }) {
  if (disabled) {
    return <div style={{ fontSize: '0.8rem', color: '#B45309' }}>{disabled}</div>;
  }
  return (
    <div style={{ border: error ? '1px solid #DC2626' : '1px solid #E2E8F0', borderRadius: 6, backgroundColor: '#F8FAFC', maxHeight: 190, overflowY: 'auto', padding: '6px 4px' }}>
      {roles.length === 0 && <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#94A3B8' }}>No roles available.</div>}
      {roles.map((role) => {
        const grant = canGrant(role);
        const checked = selected.includes(role._id);
        return (
          <label
            key={role._id}
            title={grant.ok ? role.description || '' : grant.reason}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: '0.83rem', color: grant.ok || checked ? '#1E293B' : '#94A3B8', cursor: grant.ok ? 'pointer' : 'not-allowed' }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!grant.ok && !checked}
              onChange={() => onToggle(role._id)}
              style={{ accentColor: '#1D4ED8' }}
            />
            <span style={{ flex: 1 }}>{role.name}</span>
            {!grant.ok && !checked && <FiLock size={12} />}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Add / Edit User drawer. `onSubmit(payload)` returns `{ error }` on failure (`error.message`, `error.fieldErrors`)
 * so the form can show the server's refusal against the right field.
 */
export default function UserFormDrawer({
  isOpen,
  onClose,
  onSubmit,
  user,
  roles,
  rolesError,
  departments,
  departmentsError,
  locations,
  canGrant,
  canAssignRoles,
}) {
  const isEditing = !!user;

  const initial = () => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    departmentId: idOf(user?.departmentId),
    locationId: idOf(user?.locationId),
    jobTitle: user?.jobTitle || '',
    phoneNumber: user?.phoneNumber || '',
    roleIds: (user?.roles || []).map(idOf).filter(Boolean),
  });

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
    setFormError('');
  };

  const toggleRole = (id) => set('roleIds', form.roleIds.includes(id) ? form.roleIds.filter((r) => r !== id) : [...form.roleIds, id]);

  const activeDepartments = departments.filter((d) => d.isActive !== false || d._id === form.departmentId);
  const departmentOptions = activeDepartments.map((d) => ({ value: d._id, label: d.name }));
  const locationOptions = [{ value: '', label: 'No location' }, ...locations.map((l) => ({ value: l._id, label: l.name }))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!isEditing && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid work email';
    if (!form.departmentId) errs.departmentId = 'Select a department';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      departmentId: form.departmentId,
      phoneNumber: isEditing ? form.phoneNumber.trim() : form.phoneNumber.trim() || undefined,
      locationId: form.locationId || (isEditing ? null : undefined),
      roleIds: form.roleIds,
    };
    if (isEditing) payload.jobTitle = form.jobTitle.trim();
    else payload.email = form.email.trim();

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
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      <button type="submit" form="user-form" disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Send Invite'}
      </button>
    </>
  );

  const rolesDisabled = !canAssignRoles
    ? 'Your role cannot change user roles.'
    : rolesError
      ? `Roles could not be loaded: ${rolesError}`
      : '';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Add User'}
      subtitle={isEditing ? 'Update user account details.' : 'Create a user account and assign their department and role.'}
      width="520px"
      footer={footer}
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div role="alert" style={{ marginBottom: 16, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: '0.83rem', lineHeight: 1.5 }}>
            {formError}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="User ID">
            <Input value={user?.userCode || 'Assigned on save'} readOnly style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }} />
          </FormField>
          <FormField label="First Name" required error={errors.firstName}>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Aminat" error={!!errors.firstName} />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Yusuf" error={!!errors.lastName} />
          </FormField>
          <FormField label="Work Email" required error={errors.email} helpText={isEditing ? 'The email is the sign-in name and cannot be changed.' : undefined}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="amina.yusuf@pgsl.com"
              readOnly={isEditing}
              error={!!errors.email}
              style={isEditing ? { backgroundColor: '#F1F5F9', color: '#94A3B8' } : undefined}
            />
          </FormField>
          <FormField label="Department" required error={errors.departmentId} helpText={departmentsError || undefined}>
            <Select
              value={form.departmentId}
              onChange={(e) => set('departmentId', e.target.value)}
              options={departmentOptions}
              placeholder="Select department"
              searchable
              error={!!errors.departmentId}
            />
          </FormField>
          <FormField label="Location (Optional)" error={errors.locationId}>
            <Select value={form.locationId} onChange={(e) => set('locationId', e.target.value)} options={locationOptions} placeholder="No location" />
          </FormField>
          {isEditing && (
            <FormField label="Job Title (Optional)" error={errors.jobTitle}>
              <Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} placeholder="Head of Finance" maxLength={150} />
            </FormField>
          )}
          <FormField label="Phone Number (Optional)" error={errors.phoneNumber}>
            <Input value={form.phoneNumber} onChange={(e) => set('phoneNumber', e.target.value)} placeholder="0803 456 7890" />
          </FormField>
          <FormField label="Role" style={{ gridColumn: '1 / -1' }} error={errors.roleIds} helpText="Roles that grant more access than you hold are locked. Leave empty to give the baseline Staff (All Employees) role.">
            <RolePicker roles={roles} selected={form.roleIds} onToggle={toggleRole} canGrant={canGrant} error={!!errors.roleIds} disabled={rolesDisabled} />
          </FormField>
        </div>
      </form>
    </Drawer>
  );
}
