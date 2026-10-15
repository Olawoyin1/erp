import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormField, Input, Select } from '../../components/ui/FormField';
import ImageUpload from './ImageUpload';
import { settingsService } from '../../services/settings.service';
import { departmentService } from '../../services/platform.service';
import { fetchCurrentUser } from '../../store/authSlice';
import { apiError } from '../../services/apiHelpers';
import { useApi } from '../../hooks/useApi';
import { usePermission } from '../../hooks/usePermission';
import Loaded from './Loaded';
import { ErrorBanner, FooterButtons, PanelHeader, SectionCard } from './settingsShared';
import { detailErrors, shallowEqual } from './settingsUtils';

function ProfileForm({ profile, departments, canListDepartments, showToast, onSaved }) {
  const dispatch = useDispatch();
  const authUser = useSelector((s) => s.auth.user);
  const departmentId = typeof profile.departmentId === 'object' ? profile.departmentId?._id : profile.departmentId;
  const initial = {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    jobTitle: profile.jobTitle || '',
    departmentId: departmentId || '',
  };
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const roleNames = (authUser?.roles || []).map((r) => r?.name).filter(Boolean);
  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase();
  const departmentName = departments.find((d) => d._id === form.departmentId)?.name || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), jobTitle: form.jobTitle.trim() };
    if (form.departmentId && form.departmentId !== saved.departmentId) payload.departmentId = form.departmentId;

    setSaving(true);
    setFormError('');
    try {
      await settingsService.updateProfile(payload);
      setSaved({ ...form });
      dispatch(fetchCurrentUser());
      onSaved();
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      setErrors(detailErrors(err));
      setFormError(apiError(err, 'Could not update your profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SectionCard title="Profile Photo">
        <ImageUpload
          imageUrl={profile.photoUrl}
          fallback={initials || '?'}
          onUpload={(file) => settingsService.uploadPhoto(file)}
          onRemove={() => settingsService.removePhoto()}
          onChanged={() => { dispatch(fetchCurrentUser()); onSaved(); }}
          showToast={showToast}
          hint="PNG or JPG, up to 5 MB. Without a photo your initials are shown."
        />
      </SectionCard>

      <SectionCard title="Personal Information">
        <ErrorBanner message={formError} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="First Name" required error={errors.firstName}>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} error={!!errors.firstName} />
          </FormField>
          <FormField label="Last Name" required error={errors.lastName}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} error={!!errors.lastName} />
          </FormField>
          <FormField label="Work Email">
            <Input value={profile.email || ''} readOnly style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Job Title" error={errors.jobTitle}>
            <Input value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} maxLength={150} />
          </FormField>
          <FormField label="Department" error={errors.departmentId} helpText={canListDepartments ? undefined : 'Your role cannot list departments, so this cannot be changed here.'}>
            {canListDepartments ? (
              <Select
                value={form.departmentId}
                onChange={(e) => set('departmentId', e.target.value)}
                options={departments.filter((d) => d.isActive !== false || d._id === form.departmentId).map((d) => ({ value: d._id, label: d.name }))}
                placeholder="Select department"
                searchable
              />
            ) : (
              <Input value={departmentName || (form.departmentId ? 'Assigned' : 'Not assigned')} readOnly style={{ backgroundColor: '#F1F5F9', color: '#94A3B8' }} />
            )}
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <FormField label="Role">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {(roleNames.length ? roleNames : ['No role assigned']).map((name) => (
                <span key={name} style={{ padding: '4px 10px', borderRadius: 4, backgroundColor: '#F1F5F9', fontSize: '0.813rem', fontWeight: 600, color: '#0F172A' }}>{name}</span>
              ))}
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Read-only, managed by an administrator</span>
            </div>
          </FormField>
        </div>
      </SectionCard>

      <FooterButtons
        onDiscard={() => { setForm(saved); setErrors({}); setFormError(''); }}
        saving={saving}
        dirty={!shallowEqual(form, saved)}
      />
    </form>
  );
}

export default function ProfileTab({ showToast }) {
  const canListDepartments = usePermission('core.department.view');
  const api = useApi(() => settingsService.getProfile(), []);
  const departments = useApi(() => (canListDepartments ? departmentService.list() : Promise.resolve({ data: { data: [] } })), [canListDepartments]);

  return (
    <div>
      <PanelHeader title="General" subtitle="Update your personal information" />
      <Loaded api={api} rows={5}>
        {(profile) => (
          <ProfileForm
            key={api.data?.data?._id}
            profile={profile}
            departments={departments.data?.data || []}
            canListDepartments={canListDepartments}
            showToast={showToast}
            onSaved={api.reload}
          />
        )}
      </Loaded>
    </div>
  );
}
