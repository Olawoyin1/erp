import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import { employeeService } from '../../../services/hr.service';
import { apiError, titleCase } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, ymd } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';
import Avatar from '../Avatar';

const CONTRACT_TYPES = ['permanent', 'contract', 'temporary'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time'];

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);
const NAIRA = /^\d+(\.\d{1,2})?$/;

function initialForm(employee) {
  const kin = employee?.nextOfKin || {};
  return {
    fullName: employee?.fullName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    departmentId: idOf(employee?.departmentId) || '',
    employmentType: employee?.employmentType || 'Full-time',
    contractType: employee?.contractType || 'permanent',
    grade: employee?.grade || '',
    reportingManagerId: idOf(employee?.reportingManagerId) || '',
    hireDate: ymd(employee?.hireDate),
    probationEndDate: ymd(employee?.probationEndDate),
    contractEndDate: ymd(employee?.contractEndDate),
    baseSalary: employee?.baseSalary != null ? String(employee.baseSalary / 100) : '',
    notes: employee?.notes || '',
    dateOfBirth: ymd(employee?.dateOfBirth),
    nationality: employee?.nationality || '',
    state: employee?.state || '',
    address: employee?.address || '',
    kinName: kin.name || '',
    kinRelation: kin.relation || '',
    kinPhone: kin.phone || '',
  };
}

const textPayloadFields = ['fullName', 'phone', 'position', 'employmentType', 'notes', 'nationality', 'state', 'address'];

/**
 * Register (mode "add") or edit an employee. `onSubmit(payload)` resolves to nothing on success or to
 * `{ message, details }` when the server refuses; the form shows the message and the field errors.
 */
function PhotoField({ editing, employee, pendingFile, onPick, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState(employee?.photoUrl || null);
  const [preview, setPreview] = useState(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const shown = pendingFile ? preview : currentUrl;
  const name = employee?.fullName || '';

  const choose = async (file) => {
    if (!file) return;
    setError('');
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setError('Use a PNG or JPG image'); return; }
    if (!editing) { setPreview(URL.createObjectURL(file)); onPick(file); return; }
    setBusy(true);
    try {
      const res = await employeeService.uploadPhoto(employee._id, file);
      setCurrentUrl(res.data?.data?.photoUrl || null);
      onChanged();
    } catch (err) {
      setError(apiError(err, 'The photo could not be uploaded'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing) { setPreview(null); onPick(null); return; }
    setBusy(true);
    setError('');
    try {
      await employeeService.removePhoto(employee._id);
      setCurrentUrl(null);
      onChanged();
    } catch (err) {
      setError(apiError(err, 'The photo could not be removed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormField label="Profile photo" error={error} helpText="PNG or JPG">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar name={name} url={shown} size={56} />
        <label className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Working…' : shown ? 'Change photo' : 'Upload photo'}
          <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} disabled={busy}
            onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
        {shown && !busy && (
          <button type="button" onClick={remove} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
        )}
      </div>
    </FormField>
  );
}

export default function EmployeeForm({ mode, employee, onClose, onSubmit, onPhotoChanged }) {
  const editing = mode === 'edit';
  const [photoFile, setPhotoFile] = useState(null);
  const canUpdatePayroll = usePermission('hr.payroll.update');
  const canSeeSensitive = usePermission('hr.employee.view-sensitive');
  const canViewPayroll = usePermission('hr.payroll.view');
  const sensitiveVisible = canSeeSensitive || canViewPayroll;

  const [initial] = useState(() => initialForm(employee));
  const [form, setForm] = useState(initial);
  const [manager, setManager] = useState(editing && employee && typeof employee.reportingManagerId === 'object' ? employee.reportingManagerId : null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState({ loading: true, error: '', departments: [], grades: [] });
  const [showPersonal, setShowPersonal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    employeeService.lookups()
      .then((res) => {
        if (!cancelled) setLookups({ loading: false, error: '', departments: res.data?.data?.departments || [], grades: res.data?.data?.grades || [] });
      })
      .catch((err) => {
        if (!cancelled) setLookups({ loading: false, error: apiError(err, 'Could not load departments'), departments: [], grades: [] });
      });
    return () => { cancelled = true; };
  }, []);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const departmentOptions = lookups.departments
    .filter((d) => d.isActive || d._id === initial.departmentId)
    .map((d) => ({ value: d._id, label: d.name }));
  const gradeOptions = [{ value: '', label: 'No grade' }, ...(form.grade && !lookups.grades.includes(form.grade) ? [form.grade] : []), ...lookups.grades];

  const showSalary = !editing || employee?.baseSalary !== undefined;
  const salaryLocked = editing && !canUpdatePayroll;
  const gradeLocked = editing && !canUpdatePayroll;
  const showNotes = !editing || employee?.notes !== undefined || sensitiveVisible;
  const showPersonalSection = !editing || sensitiveVisible;

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter the full name';
    if (!editing && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Enter a phone number';
    if (!form.position.trim()) next.position = 'Enter the position';
    if (!form.departmentId) next.departmentId = 'Choose a department';
    if (!form.hireDate) next.hireDate = 'Enter the date joined';
    if (form.probationEndDate && form.hireDate && form.probationEndDate < form.hireDate) next.probationEndDate = 'Must be on or after the date joined';
    if (form.contractEndDate && form.hireDate && form.contractEndDate < form.hireDate) next.contractEndDate = 'Must be on or after the date joined';
    if (form.contractType !== 'permanent' && form.contractEndDate === '' && initial.contractEndDate) next.contractEndDate = 'An end date cannot be cleared once set';
    if (showSalary && form.baseSalary !== '' && !NAIRA.test(form.baseSalary.trim())) next.baseSalary = 'Use a plain naira amount such as 450000 or 450000.50';
    const kin = [form.kinName, form.kinRelation, form.kinPhone].filter((v) => v.trim());
    if (kin.length > 0 && kin.length < 3) next.nextOfKin = 'Enter the name, relationship and phone of the next of kin, or leave all three empty';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildPayload = () => {
    const payload = {};
    const consider = (key, value, previous) => {
      if (editing && value === previous) return;
      payload[key] = value;
    };
    textPayloadFields.forEach((key) => {
      const value = form[key].trim();
      if (!editing && value === '') return;
      if (editing && value === '' && !initial[key]) return;
      consider(key, value, initial[key]);
    });
    if (!editing) payload.email = form.email.trim().toLowerCase();
    consider('departmentId', form.departmentId, initial.departmentId);
    consider('contractType', form.contractType, initial.contractType);
    if (form.hireDate) consider('hireDate', form.hireDate, initial.hireDate);
    if (form.probationEndDate) consider('probationEndDate', form.probationEndDate, initial.probationEndDate);
    if (form.contractEndDate && form.contractType !== 'permanent') consider('contractEndDate', form.contractEndDate, initial.contractEndDate);
    if (form.reportingManagerId) consider('reportingManagerId', form.reportingManagerId, initial.reportingManagerId);
    if (form.dateOfBirth) consider('dateOfBirth', form.dateOfBirth, initial.dateOfBirth);
    if (form.grade && !gradeLocked) consider('grade', form.grade, initial.grade);
    if (showSalary && form.baseSalary !== '' && !salaryLocked) {
      const kobo = Math.round(parseFloat(form.baseSalary) * 100);
      if (!editing || kobo !== Math.round(parseFloat(initial.baseSalary || '0') * 100)) payload.baseSalary = kobo;
    }
    const kinChanged = ['kinName', 'kinRelation', 'kinPhone'].some((k) => form[k] !== initial[k]);
    if (form.kinName.trim() && (!editing || kinChanged)) {
      payload.nextOfKin = { name: form.kinName.trim(), relation: form.kinRelation.trim(), phone: form.kinPhone.trim() };
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    const payload = buildPayload();
    if (editing && Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    const failure = await onSubmit(payload, photoFile);
    setSaving(false);
    if (failure) {
      setErrors((current) => ({ ...current, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message || 'The employee could not be saved');
    }
  };

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}
        style={{ padding: '8px 16px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#475569', borderRadius: 6, fontSize: '0.85rem', fontWeight: 500 }}>
        Cancel
      </button>
      <button type="submit" form="employee-form" disabled={saving || lookups.loading}
        style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#FFFFFF', border: 'none', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>
        {saving ? 'Saving…' : editing ? 'Save Changes' : 'Register Personnel'}
      </button>
    </>
  );

  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };

  return (
    <Drawer isOpen onClose={onClose}
      title={editing ? 'Edit Staff Credential' : 'Register New Personnel Member'}
      subtitle={editing ? 'Modify personnel profile details and assignments' : 'Fill out official personnel profile credentials for PGSL ERP'}
      width="560px" footer={footer}>
      <form id="employee-form" onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(formError || lookups.error) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError || lookups.error}</span>
          </div>
        )}

        <PhotoField editing={editing} employee={employee} pendingFile={photoFile} onPick={setPhotoFile} onChanged={() => onPhotoChanged && onPhotoChanged()} />

        <FormField label="Full legal name" required error={errors.fullName}>
          <Input value={form.fullName} error={!!errors.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="e.g. Angela Amara Davids" />
        </FormField>

        <div style={row}>
          <FormField label="Generated ID">
            <Input value={editing ? employee.employeeId : 'Assigned on save'} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
          </FormField>
          <FormField label="Email address" required={!editing} error={errors.email} helpText={editing ? 'The email cannot be changed here' : undefined}>
            <Input type="email" value={form.email} error={!!errors.email} readOnly={editing} disabled={editing}
              style={editing ? { backgroundColor: '#F1F5F9' } : undefined}
              onChange={(e) => set('email', e.target.value)} placeholder="angela@pgsl.ng" />
          </FormField>
        </div>

        <div style={row}>
          <FormField label="Phone number" required error={errors.phone}>
            <Input value={form.phone} error={!!errors.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+234…" />
          </FormField>
          <FormField label="Assigned position" required error={errors.position}>
            <Input value={form.position} error={!!errors.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Senior Mechanical Engineer" />
          </FormField>
        </div>

        <div style={row}>
          <FormField label="Department" required error={errors.departmentId}>
            <Select value={form.departmentId} searchable error={!!errors.departmentId} disabled={lookups.loading}
              placeholder={lookups.loading ? 'Loading departments…' : 'Select department'}
              onChange={(e) => set('departmentId', e.target.value)} options={departmentOptions} />
          </FormField>
          <FormField label="Employment type" error={errors.employmentType}>
            <Select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} options={EMPLOYMENT_TYPES} />
          </FormField>
        </div>

        <div style={row}>
          <FormField label="Contract type" required error={errors.contractType}>
            <Select value={form.contractType} onChange={(e) => set('contractType', e.target.value)}
              options={CONTRACT_TYPES.map((t) => ({ value: t, label: titleCase(t) }))} />
          </FormField>
          <FormField label="Grade" error={errors.grade} helpText={gradeLocked ? 'Changing the grade needs payroll authority' : 'From the active salary structures'}>
            <Select value={form.grade} disabled={gradeLocked || lookups.loading} placeholder="No grade"
              onChange={(e) => set('grade', e.target.value)} options={gradeOptions} />
          </FormField>
        </div>

        <FormField label="Hiring / reporting manager" error={errors.reportingManagerId}>
          <EmployeePicker value={form.reportingManagerId} selected={manager} params={{ activeOnly: 'true' }}
            excludeIds={editing ? [employee._id] : []} error={!!errors.reportingManagerId}
            onChange={(id, emp) => { set('reportingManagerId', id); setManager(emp); }} />
        </FormField>

        <div style={row}>
          <FormField label="Date joined" required error={errors.hireDate}>
            <DatePicker value={form.hireDate} error={!!errors.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
          </FormField>
          <FormField label="Probation end date" error={errors.probationEndDate} helpText="Drives the confirmation reminder">
            <DatePicker value={form.probationEndDate} min={form.hireDate || undefined} error={!!errors.probationEndDate} onChange={(e) => set('probationEndDate', e.target.value)} />
          </FormField>
        </div>

        <div style={row}>
          {form.contractType !== 'permanent' ? (
            <FormField label="Contract end date" error={errors.contractEndDate} helpText="Drives the contract-expiry reminder">
              <DatePicker value={form.contractEndDate} min={form.hireDate || undefined} error={!!errors.contractEndDate} onChange={(e) => set('contractEndDate', e.target.value)} />
            </FormField>
          ) : <div />}
          {showSalary && (
            <FormField label="Official base salary (₦)" error={errors.baseSalary} helpText={salaryLocked ? 'Changing salary needs payroll authority' : undefined}>
              <Input type="number" min="0" step="0.01" value={form.baseSalary} disabled={salaryLocked} error={!!errors.baseSalary}
                onChange={(e) => set('baseSalary', e.target.value)} placeholder="e.g. 850000" />
            </FormField>
          )}
        </div>

        <FormField label="Status">
          <Input value={editing ? titleCase(employee.status) : 'Probation (every new hire starts on probation)'} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
        </FormField>

        {showNotes && (
          <FormField label="General notes" error={errors.notes}>
            <Textarea rows={3} value={form.notes} error={!!errors.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Enter basic evaluation commentary…" />
          </FormField>
        )}

        {showPersonalSection && (
          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <button type="button" onClick={() => setShowPersonal((v) => !v)}
              style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              {showPersonal ? 'Hide' : 'Add'} personal details (optional)
            </button>
            {showPersonal && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 14px 14px' }}>
                <div style={row}>
                  <FormField label="Date of birth" error={errors.dateOfBirth}>
                    <DatePicker value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('dateOfBirth', e.target.value)} />
                  </FormField>
                  <FormField label="Nationality" error={errors.nationality}>
                    <Input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
                  </FormField>
                </div>
                <div style={row}>
                  <FormField label="State" error={errors.state}>
                    <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
                  </FormField>
                  <FormField label="Address" error={errors.address}>
                    <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
                  </FormField>
                </div>
                <FormField label="Next of kin" error={errors.nextOfKin}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <Input value={form.kinName} placeholder="Name" onChange={(e) => set('kinName', e.target.value)} />
                    <Input value={form.kinRelation} placeholder="Relationship" onChange={(e) => set('kinRelation', e.target.value)} />
                    <Input value={form.kinPhone} placeholder="Phone" onChange={(e) => set('kinPhone', e.target.value)} />
                  </div>
                </FormField>
              </div>
            )}
          </div>
        )}
      </form>
    </Drawer>
  );
}
