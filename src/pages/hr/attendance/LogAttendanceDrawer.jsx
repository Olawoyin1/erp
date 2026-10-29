import { useState } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import { fieldErrorsOf } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';
import { lagosToday, lagosInstant, hoursBetween, fmtHours, attendanceZone } from './attendanceUtils';

const STATUSES = [
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'completed', label: 'Completed' },
  { value: 'absent', label: 'Absent' },
  { value: 'on_leave', label: 'On Leave' },
];

const nextDay = (ymd) => new Date(new Date(`${ymd}T12:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);

/**
 * Manual attendance entry (needs hr.attendance.log). Times are typed in the company time zone. When a record already exists
 * for that employee and day the server asks for a correction reason; the field then appears and the form is sent again.
 * `onSubmit(body)` resolves to nothing on success or `{ message, details, code }`.
 */
export default function LogAttendanceDrawer({ locations, onClose, onSubmit }) {
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({ employeeId: '', locationId: '', date: lagosToday(), clockIn: '', clockOut: '', status: 'present', remarks: '', correctionReason: '' });
  const [needsReason, setNeedsReason] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const worked = hoursBetween(form.clockIn, form.clockOut);

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!form.employeeId) next.employeeId = 'Choose the employee';
    if (!form.locationId) next.locationId = 'Choose the location';
    if (!form.date) next.date = 'Choose the date';
    if (form.clockOut && !form.clockIn) next.clockIn = 'Enter the clock-in time';
    if (needsReason && form.correctionReason.trim().length < 3) next.correctionReason = 'Give the reason for replacing the record (at least 3 characters)';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const overnight = form.clockIn && form.clockOut && form.clockOut <= form.clockIn;
    const body = {
      employeeId: form.employeeId,
      locationId: form.locationId,
      date: form.date,
      status: form.status,
      ...(form.clockIn ? { clockIn: lagosInstant(form.date, form.clockIn) } : {}),
      ...(form.clockOut ? { clockOut: lagosInstant(overnight ? nextDay(form.date) : form.date, form.clockOut) } : {}),
      ...(form.remarks.trim() ? { remarks: form.remarks.trim() } : {}),
      ...(needsReason ? { correctionReason: form.correctionReason.trim() } : {}),
    };
    const failure = await onSubmit(body);
    setSaving(false);
    if (failure) {
      if (failure.status === 409 && !needsReason) {
        setNeedsReason(true);
        setFormError('A record already exists for this employee on this day. Give a correction reason to replace it; the change is audited and overtime approval is reset.');
        return;
      }
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Log Attendance" subtitle="Manually record attendance for an employee" width="520px"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 20px' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Logging…' : needsReason ? 'Replace Record' : 'Log Attendance'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', backgroundColor: needsReason ? '#FFFBEB' : '#FEF2F2', border: `1px solid ${needsReason ? '#FDE68A' : '#FECACA'}`, borderRadius: 8, color: needsReason ? '#92400E' : '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2, flexShrink: 0 }} /> <span>{formError}</span>
          </div>
        )}
        <FormField label="Employee" required error={errors.employeeId}>
          <EmployeePicker value={form.employeeId} selected={employee} params={{ activeOnly: 'true' }} error={!!errors.employeeId}
            onChange={(id, emp) => { set('employeeId', id); setEmployee(emp); }} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Employee ID"><Input value={employee?.employeeId || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Department"><Input value={employee?.departmentId?.name || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Position"><Input value={employee?.position || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Date" required error={errors.date}>
            <DatePicker value={form.date} max={lagosToday()} error={!!errors.date} onChange={(e) => set('date', e.target.value)} />
          </FormField>
          <FormField label={`Clock in (${attendanceZone()} time)`} error={errors.clockIn} helpText="Late arrival is worked out from the work schedule">
            <Input type="time" value={form.clockIn} error={!!errors.clockIn} onChange={(e) => set('clockIn', e.target.value)} />
          </FormField>
          <FormField label={`Clock out (${attendanceZone()} time)`} error={errors.clockOut} helpText="Within 24 hours of clock-in; overtime and early leave follow the work schedule">
            <Input type="time" value={form.clockOut} error={!!errors.clockOut} onChange={(e) => set('clockOut', e.target.value)} />
          </FormField>
          <FormField label="Hours worked"><Input value={worked == null ? '' : fmtHours(worked)} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          <FormField label="Status" required error={errors.status}>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)} options={STATUSES} />
          </FormField>
        </div>
        <FormField label="Location" required error={errors.locationId}>
          <Select value={form.locationId} searchable placeholder="Select location" error={!!errors.locationId}
            onChange={(e) => set('locationId', e.target.value)} options={locations.map((l) => ({ value: l._id, label: l.name }))} />
        </FormField>
        <FormField label="Remarks" error={errors.remarks}>
          <Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="e.g. Approved late start, generator maintenance delay" />
        </FormField>
        {needsReason && (
          <FormField label="Correction reason" required error={errors.correctionReason}>
            <Textarea rows={2} value={form.correctionReason} error={!!errors.correctionReason} onChange={(e) => set('correctionReason', e.target.value)} placeholder="Why is the existing record being replaced?" />
          </FormField>
        )}
      </div>
    </Drawer>
  );
}
