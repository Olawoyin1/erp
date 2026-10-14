import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Modal from '../../components/ui/Modal';
import { FormField, Input, Select, DatePicker, FileUpload } from '../../components/ui/FormField';
import { employeeService, grievanceService } from '../../services/hr.service';
import { apiError, titleCase } from '../../services/apiHelpers';
import { fieldErrorsOf } from './hrUtils';
import EmployeePicker from './EmployeePicker';

const primary = { padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' };

function Banner({ message }) {
  if (!message) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem' }}>
      <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{message}</span>
    </div>
  );
}

function Footer({ onClose, onSubmit, saving, label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
      <button onClick={onSubmit} disabled={saving} style={{ ...primary, opacity: saving ? 0.7 : 1 }}>{saving ? 'Uploading…' : label}</button>
    </div>
  );
}

/**
 * Header "Upload" on Onboarding and Training: pick an employee, then attach either a personnel
 * document (POST /employees/:id/documents) or a certification (POST /employees/:id/certifications).
 */
export function EmployeeFileDialog({ kind, onClose, onDone }) {
  const certification = kind === 'certification';
  const [employee, setEmployee] = useState(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ certificateName: '', issuedDate: '', expiryDate: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (key, value) => { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: undefined })); };

  const submit = async () => {
    const next = {};
    if (!employee) next.employee = 'Choose the employee';
    if (!file) next.file = 'Choose a file';
    if (certification) {
      if (!form.certificateName.trim()) next.certificateName = 'Enter the certificate name';
      if (!form.issuedDate) next.issuedDate = 'Enter the issue date';
      if (form.expiryDate && form.issuedDate && form.expiryDate < form.issuedDate) next.expiryDate = 'Expiry cannot be before the issue date';
    }
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      if (certification) {
        await employeeService.uploadCertification(employee._id, { certificateName: form.certificateName.trim(), issuedDate: form.issuedDate, expiryDate: form.expiryDate, file });
      } else {
        await employeeService.uploadDocument(employee._id, file);
      }
      onDone(certification ? `Certification added for ${employee.fullName}` : `Document uploaded for ${employee.fullName}`, employee);
    } catch (err) {
      const fields = fieldErrorsOf(err);
      if (Object.keys(fields).length) setErrors((e) => ({ ...e, ...fields }));
      setFormError(apiError(err, certification ? 'The certification could not be uploaded' : 'The document could not be uploaded'));
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="560px"
      title={certification ? 'Upload certification' : 'Upload employee document'}
      subtitle={certification ? 'Attach a certificate to an employee record' : 'Attach a personnel document to an employee record'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner message={formError} />
        <FormField label="Employee" required error={errors.employee}>
          <EmployeePicker value={employee?._id || ''} selected={employee} error={!!errors.employee} params={{ activeOnly: 'true' }} onChange={(id, emp) => { setEmployee(emp); setErrors((e) => ({ ...e, employee: undefined })); }} />
        </FormField>
        {certification && (
          <>
            <FormField label="Certificate name" required error={errors.certificateName}>
              <Input value={form.certificateName} error={!!errors.certificateName} placeholder="e.g. BOSIET" onChange={(e) => set('certificateName', e.target.value)} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <FormField label="Issued" required error={errors.issuedDate}>
                <DatePicker value={form.issuedDate} error={!!errors.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} />
              </FormField>
              <FormField label="Expires" error={errors.expiryDate} helpText="Leave empty if it does not expire">
                <DatePicker value={form.expiryDate} min={form.issuedDate || undefined} error={!!errors.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
              </FormField>
            </div>
          </>
        )}
        <FormField label="File" required error={errors.file}>
          <FileUpload value={file} onChange={(f) => { setFile(f); setErrors((e) => ({ ...e, file: undefined })); }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" maxSizeText="Up to 50MB" subtext="PDF, DOCX, PNG or JPG" error={!!errors.file} />
        </FormField>
        <Footer onClose={onClose} onSubmit={submit} saving={saving} label={certification ? 'Add certification' : 'Upload document'} />
      </div>
    </Modal>
  );
}

/** Header "Upload" on Grievances & Discipline: attach a document to one of the open cases. */
export function CaseFileDialog({ onClose, onDone }) {
  const [cases, setCases] = useState({ loading: true, items: [], error: '' });
  const [caseId, setCaseId] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    grievanceService.list({ limit: 100 })
      .then((res) => { if (!cancelled) setCases({ loading: false, items: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setCases({ loading: false, items: [], error: apiError(err, 'Could not load cases') }); });
    return () => { cancelled = true; };
  }, []);

  const options = cases.items
    .filter((c) => c.status !== 'closed')
    .map((c) => ({ value: c._id, label: `${c.caseId} - ${c.caseTitle} (${titleCase(c.status)})` }));

  const submit = async () => {
    const next = {};
    if (!caseId) next.caseId = 'Choose the case';
    if (!file) next.file = 'Choose a file';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await grievanceService.uploadDocument(caseId, file);
      onDone('Document attached to the case');
    } catch (err) {
      setFormError(apiError(err, 'The document could not be attached'));
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} maxWidth="560px" title="Upload case document" subtitle="Attach evidence or correspondence to an open case">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Banner message={formError || cases.error} />
        <FormField label="Case" required error={errors.caseId} helpText={!cases.loading && !cases.error && options.length === 0 ? 'There are no open cases' : undefined}>
          <Select value={caseId} placeholder={cases.loading ? 'Loading cases…' : 'Select a case'} error={!!errors.caseId} options={options}
            onChange={(e) => { setCaseId(e.target.value); setErrors((x) => ({ ...x, caseId: undefined })); }} />
        </FormField>
        <FormField label="File" required error={errors.file}>
          <FileUpload value={file} onChange={(f) => { setFile(f); setErrors((e) => ({ ...e, file: undefined })); }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.dwg" maxSizeText="Up to 50MB" subtext="PDF, DOCX, DWG, PNG" error={!!errors.file} />
        </FormField>
        <Footer onClose={onClose} onSubmit={submit} saving={saving} label="Attach document" />
      </div>
    </Modal>
  );
}
