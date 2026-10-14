import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import { leaveService, employeeService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';
import { fieldErrorsOf } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

/**
 * Apply for leave. Without `canActOnBehalf` the form is for the signed-in user's own employee record
 * (`ownEmployeeId`); with it, an employee can be chosen. The working days are computed by the server.
 */
export default function ApplyLeaveDrawer({ ownEmployeeId, canActOnBehalf, leaveTypes, onClose, onSubmit }) {
  const [employeeId, setEmployeeId] = useState(canActOnBehalf ? '' : ownEmployeeId || '');
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState({ key: '', days: null, error: '' });
  const [balance, setBalance] = useState({ key: '', rows: [], error: '' });

  useEffect(() => {
    if (!ownEmployeeId || canActOnBehalf) return undefined;
    let cancelled = false;
    employeeService.get(ownEmployeeId)
      .then((res) => { if (!cancelled) setEmployee(res.data?.data || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ownEmployeeId, canActOnBehalf]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const datesOk = form.startDate && form.endDate && form.endDate >= form.startDate;
  const previewKey = datesOk ? `${form.startDate}|${form.endDate}` : '';
  useEffect(() => {
    if (!previewKey) return undefined;
    let cancelled = false;
    const [start, end] = previewKey.split('|');
    leaveService.duration(start, end)
      .then((res) => { if (!cancelled) setPreview({ key: previewKey, days: res.data?.data?.durationDays ?? null, error: '' }); })
      .catch((err) => { if (!cancelled) setPreview({ key: previewKey, days: null, error: apiError(err, 'Could not work out the leave days') }); });
    return () => { cancelled = true; };
  }, [previewKey]);

  const year = form.startDate ? new Date(form.startDate).getUTCFullYear() : new Date().getUTCFullYear();
  const balanceKey = employeeId ? `${employeeId}|${year}` : '';
  useEffect(() => {
    if (!balanceKey) return undefined;
    let cancelled = false;
    const [eid, y] = balanceKey.split('|');
    leaveService.balances(eid, y)
      .then((res) => { if (!cancelled) setBalance({ key: balanceKey, rows: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setBalance({ key: balanceKey, rows: [], error: apiError(err, '') }); });
    return () => { cancelled = true; };
  }, [balanceKey]);

  const type = leaveTypes.find((t) => t._id === form.leaveTypeId);
  const balanceRow = balance.key === balanceKey ? balance.rows.find((r) => idOf(r.leaveTypeId) === form.leaveTypeId) : null;
  const balanceLoaded = balance.key === balanceKey && !balance.error;
  const remaining = type && type.paid && balanceLoaded ? (balanceRow ? balanceRow.remainingDays : type.annualAllowanceDays) : null;
  const days = preview.key === previewKey ? preview.days : null;

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!employeeId) next.employeeId = canActOnBehalf ? 'Choose the employee' : 'Your account is not linked to an employee record';
    if (!form.leaveTypeId) next.leaveTypeId = 'Choose the leave type';
    if (!form.startDate) next.startDate = 'Choose the start date';
    if (!form.endDate) next.endDate = 'Choose the end date';
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = 'Must not be before the start date';
    if (!form.reason.trim()) next.reason = 'Give a reason for the leave';
    if (type?.requiresDocument && !file) next.attachmentId = `${type.name} leave needs a supporting document`;
    if (days === 0) next.startDate = 'The selected period has no working days';
    if (remaining != null && days != null && days > remaining) next.leaveTypeId = `Only ${remaining} day(s) remaining for this leave type`;
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      let attachmentId;
      if (file) {
        const up = await leaveService.uploadAttachment(file);
        attachmentId = up.data?.data?._id;
      }
      const failure = await onSubmit({
        employeeId,
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
        ...(attachmentId ? { attachmentId } : {}),
      });
      if (failure) {
        const fields = fieldErrorsOf(failure.details);
        if (fields.durationDays) fields.leaveTypeId = fields.durationDays;
        setErrors((e) => ({ ...e, ...fields }));
        setFormError(failure.message);
      }
    } catch (err) {
      setFormError(apiError(err, 'The supporting document could not be uploaded'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Apply for Leave" subtitle="Submit a new leave application" width="540px"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '9px 18px' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '9px 20px', fontSize: '0.84rem', fontWeight: 600, borderRadius: 7, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        {canActOnBehalf ? (
          <FormField label="Employee" required error={errors.employeeId}>
            <EmployeePicker value={employeeId} selected={employee} params={{ activeOnly: 'true' }} error={!!errors.employeeId}
              onChange={(id, emp) => { setEmployeeId(id); setEmployee(emp); setErrors((e) => ({ ...e, employeeId: undefined })); }} />
          </FormField>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Employee name" error={errors.employeeId}>
              <Input value={employee?.fullName || (ownEmployeeId ? 'Loading…' : 'No employee record linked')} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
            </FormField>
            <FormField label="Employee ID">
              <Input value={employee?.employeeId || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
            </FormField>
          </div>
        )}
        {employee && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <FormField label="Department"><Input value={employee.departmentId?.name || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
            <FormField label="Position"><Input value={employee.position || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} /></FormField>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Leave type" required error={errors.leaveTypeId}>
            <Select value={form.leaveTypeId} placeholder="Select leave type" error={!!errors.leaveTypeId} onChange={(e) => set('leaveTypeId', e.target.value)}
              options={leaveTypes.map((t) => ({ value: t._id, label: t.name }))} />
          </FormField>
          <FormField label="Start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} error={!!errors.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </FormField>
          <FormField label="End date" required error={errors.endDate}>
            <DatePicker value={form.endDate} min={form.startDate || undefined} error={!!errors.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </FormField>
          <FormField label="Leave balance">
            <Input readOnly disabled style={{ backgroundColor: '#F1F5F9' }}
              value={!type ? '' : !type.paid ? 'Unpaid leave (no balance)' : remaining == null ? 'Loading…' : `${remaining} of ${type.annualAllowanceDays} days remaining`} />
          </FormField>
        </div>
        {(days != null || preview.error) && (
          <div style={{ padding: '10px 14px', backgroundColor: preview.error ? '#FEF2F2' : '#EFF6FF', borderRadius: 6, border: `1px solid ${preview.error ? '#FECACA' : '#BFDBFE'}`, fontSize: '0.813rem', color: preview.error ? '#991B1B' : '#1D4ED8' }}>
            {preview.error || <><strong>{days}</strong> working day{days === 1 ? '' : 's'} (weekends and public holidays are not counted)</>}
          </div>
        )}
        <FormField label="Reason for leave" required error={errors.reason}>
          <Textarea rows={3} placeholder="Provide a brief explanation for your leave request…" value={form.reason} error={!!errors.reason} onChange={(e) => set('reason', e.target.value)} />
        </FormField>
        <FormField label={type?.requiresDocument ? 'Supporting document' : 'Attach documents (optional)'} required={!!type?.requiresDocument} error={errors.attachmentId}>
          <FileUpload value={file} onChange={(f) => { setFile(f); setErrors((e) => ({ ...e, attachmentId: undefined })); }} error={!!errors.attachmentId}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" maxSizeText="Up to 50MB" subtext="Medical certificate, flight tickets, or travel clearance" />
        </FormField>
      </div>
    </Drawer>
  );
}
