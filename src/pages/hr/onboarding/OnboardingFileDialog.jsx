import { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { FormField, Select, FileUpload } from '../../../components/ui/FormField';
import { onboardingService } from '../../../services/hr.service';
import { apiError } from '../../../services/apiHelpers';

/** Header "Upload" on Onboarding: attach a document to one of the onboarding cases (POST /onboarding/:id/documents). */
export default function OnboardingFileDialog({ onClose, onDone }) {
  const [cases, setCases] = useState({ loading: true, items: [], error: '' });
  const [caseId, setCaseId] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    onboardingService.list({ limit: 100 })
      .then((res) => { if (!cancelled) setCases({ loading: false, items: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setCases({ loading: false, items: [], error: apiError(err, 'Could not load onboarding cases') }); });
    return () => { cancelled = true; };
  }, []);

  const options = cases.items.map((c) => ({
    value: c._id,
    label: `${c.person?.code || '—'} - ${c.person?.fullName || 'Unknown'}${c.person?.kind === 'candidate' ? ' (candidate)' : ''}`,
  }));

  const submit = async () => {
    const next = {};
    if (!caseId) next.caseId = 'Choose who the document is for';
    if (!file) next.file = 'Choose a file';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await onboardingService.uploadDocument(caseId, file);
      const chosen = cases.items.find((c) => c._id === caseId);
      onDone(`Document uploaded for ${chosen?.person?.fullName || 'the onboarding case'}`, caseId);
    } catch (err) {
      setFormError(apiError(err, 'The document could not be uploaded'));
      setSaving(false);
    }
  };

  const message = formError || cases.error;

  return (
    <Modal isOpen onClose={onClose} maxWidth="560px" title="Upload onboarding document" subtitle="Attach a document to a candidate's or employee's onboarding record">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {message && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{message}</span>
          </div>
        )}
        <FormField label="Onboarding record" required error={errors.caseId} helpText={!cases.loading && !cases.error && options.length === 0 ? 'There are no onboarding records yet' : undefined}>
          <Select value={caseId} searchable placeholder={cases.loading ? 'Loading…' : 'Select a candidate or employee'} error={!!errors.caseId} options={options}
            onChange={(e) => { setCaseId(e.target.value); setErrors((x) => ({ ...x, caseId: undefined })); }} />
        </FormField>
        <FormField label="File" required error={errors.file}>
          <FileUpload value={file} onChange={(f) => { setFile(f); setErrors((e) => ({ ...e, file: undefined })); }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" maxSizeText="Up to 50MB" subtext="PDF, DOCX, PNG or JPG" error={!!errors.file} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Uploading…' : 'Upload document'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
