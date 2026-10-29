import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, DatePicker } from '../../../components/ui/FormField';
import { employeeService } from '../../../services/hr.service';
import { titleCase } from '../../../services/apiHelpers';
import { fieldErrorsOf, fullName } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';
import { btnCancel, btnPrimary } from './recruitmentConstants';

const NAIRA = /^\d+(\.\d{1,2})?$/;
const CONTRACT_TYPES = ['permanent', 'contract', 'temporary'];

/**
 * Turns a hired candidate whose onboarding is completed into an employee. Opened from the Onboarding page.
 * `onConvert(body)` resolves to nothing on success or `{ message, details }` when the server refuses.
 */
export default function ConvertCandidateDrawer({ candidate, onClose, onConvert }) {
  const posting = candidate.appliedPositionId && typeof candidate.appliedPositionId === 'object' ? candidate.appliedPositionId : null;
  const [lookups, setLookups] = useState({ grades: [], error: '' });
  const [manager, setManager] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPersonal, setShowPersonal] = useState(false);
  const [form, setForm] = useState(() => ({
    position: posting?.position || '',
    contractType: 'permanent',
    employmentType: 'Full-time',
    grade: '',
    reportingManagerId: '',
    hireDate: new Date().toISOString().slice(0, 10),
    baseSalary: '',
    dateOfBirth: '',
    nationality: '',
    state: '',
    address: '',
  }));

  useEffect(() => {
    let cancelled = false;
    employeeService.lookups()
      .then((res) => { if (!cancelled) setLookups({ grades: res.data?.data?.grades || [], error: '' }); })
      .catch(() => { if (!cancelled) setLookups({ grades: [], error: 'Salary grades could not be loaded' }); });
    return () => { cancelled = true; };
  }, []);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const next = {};
    if (!form.hireDate) next.hireDate = 'Enter the hire date';
    if (!form.baseSalary.trim() || !NAIRA.test(form.baseSalary.trim())) next.baseSalary = 'Enter the monthly salary in naira, for example 450000';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    const body = {
      contractType: form.contractType,
      hireDate: form.hireDate,
      baseSalary: Math.round(parseFloat(form.baseSalary) * 100),
      ...(form.position.trim() && form.position.trim() !== posting?.position ? { position: form.position.trim() } : {}),
      ...(form.employmentType ? { employmentType: form.employmentType } : {}),
      ...(form.grade ? { grade: form.grade } : {}),
      ...(form.reportingManagerId ? { reportingManagerId: form.reportingManagerId } : {}),
      ...(form.dateOfBirth ? { dateOfBirth: form.dateOfBirth } : {}),
      ...(form.nationality.trim() ? { nationality: form.nationality.trim() } : {}),
      ...(form.state.trim() ? { state: form.state.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
    };
    const failure = await onConvert(body);
    setSaving(false);
    if (failure) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  const supervisor = posting?.hiringSupervisorId;

  return (
    <Drawer isOpen onClose={onClose} title="Convert to Employee" subtitle={`${candidate.fullName} (${candidate.candidateId})`} width="520px"
      footer={
        <>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Converting…' : 'Convert to Employee'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
          Onboarding is complete. Name, email, phone and department carry over from the application, the onboarding documents move to the new employee, and the employee starts on probation.
        </p>
        {(formError || lookups.error) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError || lookups.error}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Position" error={errors.position}>
            <Input value={form.position} onChange={(e) => set('position', e.target.value)} />
          </FormField>
          <FormField label="Contract type" required error={errors.contractType}>
            <Select value={form.contractType} onChange={(e) => set('contractType', e.target.value)} options={CONTRACT_TYPES.map((t) => ({ value: t, label: titleCase(t) }))} />
          </FormField>
          <FormField label="Hire date" required error={errors.hireDate}>
            <DatePicker value={form.hireDate} error={!!errors.hireDate} onChange={(e) => set('hireDate', e.target.value)} />
          </FormField>
          <FormField label="Base salary (₦ per month)" required error={errors.baseSalary}>
            <Input type="number" min="0" step="0.01" value={form.baseSalary} error={!!errors.baseSalary} onChange={(e) => set('baseSalary', e.target.value)} placeholder="e.g. 450000" />
          </FormField>
          <FormField label="Employment type" error={errors.employmentType}>
            <Select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} options={['Full-time', 'Part-time', 'Contract', 'Internship']} />
          </FormField>
          <FormField label="Grade" error={errors.grade}>
            <Select value={form.grade} placeholder="No grade" onChange={(e) => set('grade', e.target.value)} options={[{ value: '', label: 'No grade' }, ...lookups.grades]} />
          </FormField>
        </div>
        <FormField label="Reporting manager" error={errors.reportingManagerId}
          helpText={supervisor ? `Defaults to the hiring supervisor, ${fullName(supervisor)}` : undefined}>
          <EmployeePicker value={form.reportingManagerId} selected={manager} params={{ activeOnly: 'true' }}
            placeholder={supervisor ? fullName(supervisor) : 'Search employee by name or ID…'}
            onChange={(id, emp) => { set('reportingManagerId', id); setManager(emp); }} />
        </FormField>

        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
          <button type="button" onClick={() => setShowPersonal((v) => !v)}
            style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            {showPersonal ? 'Hide' : 'Add'} personal details (optional)
          </button>
          {showPersonal && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: '0 14px 14px' }}>
              <FormField label="Date of birth" error={errors.dateOfBirth}>
                <DatePicker value={form.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </FormField>
              <FormField label="Nationality" error={errors.nationality}>
                <Input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
              </FormField>
              <FormField label="State" error={errors.state}>
                <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
              </FormField>
              <FormField label="Address" error={errors.address}>
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
              </FormField>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
