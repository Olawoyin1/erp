import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical,
  FiCheck, FiX, FiPlus, FiAlertCircle, FiEdit2, FiMessageSquare, FiPaperclip, FiUpload,
  FiList, FiAlertTriangle, FiCheckCircle, FiInfo,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input, FormField, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import {
  fetchCases, fetchCaseStats, createCase, updateCase,
  startReview, resolveCase, closeCase, addNote,
  selectCases, selectCasesMeta, selectCasesLoading,
  selectCaseStats, selectCasesStatsLoading, selectCasesError,
} from '../../../store/hr/grievanceSlice';
import { grievanceService } from '../../../services/hr.service';
import { apiError, titleCase, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { errorInfo, fieldErrorsOf, fullName, saveBlob, blobErrorMessage, ymd } from '../hrUtils';
import { CaseFileDialog } from '../FileUploadDialogs';
import EmployeePicker from '../EmployeePicker';

const ITEMS_PER_PAGE = 10;

const CASE_TYPES = ['Late Attendance', 'Absenteeism', 'Misconduct', 'Harassment', 'Payroll', 'Safety Violation', 'Insubordination', 'Other'];
const CATEGORIES = [{ value: 'disciplinary', label: 'Disciplinary' }, { value: 'grievance', label: 'Grievance' }];
const SEVERITIES = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }];
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITY_STYLES = {
  high:   { color: '#DC2626', bg: '#FEF2F2' },
  medium: { color: '#EA580C', bg: '#FFF7ED' },
  low:    { color: '#2563EB', bg: '#EFF6FF' },
};

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '70%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

function SeverityPill({ value }) {
  const s = SEVERITY_STYLES[value] || {};
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
      {titleCase(value)}
    </span>
  );
}

function RowMenu({ items, row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 180 }}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.action} onClick={() => { onAction(item.action, row); setOpen(false); }}
                className="menu-item-hover"
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color,
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={13} /> {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Create / Edit Case Drawer ────────────────────────────────────────────────
function CaseDrawer({ onClose, editItem, onSaved }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const editing = !!editItem?._id;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [file, setFile] = useState(null);
  const [employee, setEmployee] = useState(editing && typeof editItem.employeeId === 'object' ? editItem.employeeId : null);
  const [officer, setOfficer] = useState(editing && typeof editItem.assignedOfficerId === 'object' ? editItem.assignedOfficerId : null);
  const [form, setForm] = useState(() => ({
    category:          editItem?.category || 'disciplinary',
    caseType:          editItem?.caseType || '',
    severity:          editItem?.severity || 'medium',
    incidentDate:      ymd(editItem?.incidentDate),
    caseTitle:         editItem?.caseTitle || '',
    description:       editItem?.description || '',
    employeeId:        idOf(editItem?.employeeId) || '',
    assignedOfficerId: idOf(editItem?.assignedOfficerId) || '',
    internalNote:      '',
  }));

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.employeeId) next.employeeId = 'Choose the employee';
    if (!form.caseType) next.caseType = 'Choose a case type';
    if (!form.incidentDate) next.incidentDate = 'Enter the incident date';
    else if (form.incidentDate > new Date().toISOString().slice(0, 10)) next.incidentDate = 'The incident date cannot be in the future';
    if (!form.caseTitle.trim()) next.caseTitle = 'Enter a case title';
    if (!form.assignedOfficerId) next.assignedOfficerId = 'Choose the officer handling this case';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    const body = {
      category: form.category,
      caseType: form.caseType,
      severity: form.severity,
      incidentDate: form.incidentDate,
      caseTitle: form.caseTitle.trim(),
      assignedOfficerId: form.assignedOfficerId,
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
    };
    try {
      if (editing) {
        await dispatch(updateCase({ id: editItem._id, data: body })).unwrap();
        showToast('Case updated', 'success');
      } else {
        const created = await dispatch(createCase({ ...body, employeeId: form.employeeId })).unwrap();
        const problems = [];
        if (file) {
          try { await grievanceService.uploadDocument(created._id, file); } catch (err) { problems.push(apiError(err, 'The document could not be attached')); }
        }
        if (form.internalNote.trim()) {
          try { await dispatch(addNote({ id: created._id, note: form.internalNote.trim() })).unwrap(); } catch (err) { problems.push(err?.message || 'The note could not be saved'); }
        }
        showToast(problems.length ? `Case logged, but ${problems.join('; ')}` : 'Case logged successfully', problems.length ? 'info' : 'success');
      }
      onSaved();
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err?.details) }));
      setFormError(err?.message || 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = form.caseType && !CASE_TYPES.includes(form.caseType) ? [form.caseType, ...CASE_TYPES] : CASE_TYPES;

  return (
    <Drawer isOpen onClose={onClose} title={editing ? 'Edit Disciplinary Case' : 'Log Disciplinary Case'} width="520px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Log Disciplinary Case')}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Employee" required error={errors.employeeId}>
            <EmployeePicker value={form.employeeId} selected={employee} disabled={editing} error={!!errors.employeeId}
              onChange={(id, emp) => { set('employeeId', id); setEmployee(emp); }} />
          </FormField>
          <FormField label="Employee ID">
            <Input value={employee?.employeeId || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
          </FormField>
          <FormField label="Department">
            <Input value={employee?.departmentId?.name || editItem?.departmentId?.name || ''} readOnly disabled style={{ backgroundColor: '#F1F5F9' }} />
          </FormField>
          <FormField label="Category" required>
            <Select value={form.category} onChange={(e) => set('category', e.target.value)} options={CATEGORIES} />
          </FormField>
          <FormField label="Case type" required error={errors.caseType}>
            <Select value={form.caseType} placeholder="Select case type" error={!!errors.caseType} onChange={(e) => set('caseType', e.target.value)} options={typeOptions} />
          </FormField>
          <FormField label="Severity level" required error={errors.severity}>
            <Select value={form.severity} onChange={(e) => set('severity', e.target.value)} options={SEVERITIES} />
          </FormField>
        </div>
        <FormField label="Incident date" required error={errors.incidentDate}>
          <DatePicker value={form.incidentDate} max={new Date().toISOString().slice(0, 10)} error={!!errors.incidentDate} onChange={(e) => set('incidentDate', e.target.value)} />
        </FormField>
        <FormField label="Case title" required error={errors.caseTitle}>
          <Input value={form.caseTitle} error={!!errors.caseTitle} onChange={(e) => set('caseTitle', e.target.value)} placeholder="e.g. Repeated late attendance" />
        </FormField>
        <FormField label="Assigned officer" required error={errors.assignedOfficerId} helpText="The HR officer handling this case">
          <EmployeePicker value={form.assignedOfficerId} selected={officer} error={!!errors.assignedOfficerId} params={{ activeOnly: 'true' }}
            onChange={(id, emp) => { set('assignedOfficerId', id); setOfficer(emp); }} />
        </FormField>
        <FormField label="Description (optional)" error={errors.description}>
          <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        {!editing && (
          <>
            <FormField label="Attach documents (optional)">
              <FileUpload value={file} onChange={setFile} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.dwg" maxSizeText="Up to 50MB" subtext="PDF, DOCX, DWG, PNG. Up to 50MB" />
            </FormField>
            <FormField label="Internal notes (optional)">
              <Textarea rows={3} value={form.internalNote} onChange={(e) => set('internalNote', e.target.value)} />
            </FormField>
          </>
        )}
      </div>
    </Drawer>
  );
}

// ─── Raise Grievance Drawer (staff self-service) ──────────────────────────────
const GRIEVANCE_TYPES = ['Workplace conditions', 'Payroll', 'Harassment', 'Safety', 'Management', 'Other'];

function RaiseGrievanceDrawer({ onClose, onSaved }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ caseType: '', severity: 'medium', incidentDate: '', caseTitle: '', description: '' });
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleSave = async () => {
    setFormError('');
    const next = {};
    if (!form.caseType) next.caseType = 'Choose what this is about';
    if (!form.incidentDate) next.incidentDate = 'Enter when it happened';
    else if (form.incidentDate > new Date().toISOString().slice(0, 10)) next.incidentDate = 'The date cannot be in the future';
    if (!form.caseTitle.trim()) next.caseTitle = 'Give the grievance a title';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await grievanceService.raise({
        caseType: form.caseType,
        severity: form.severity,
        incidentDate: form.incidentDate,
        caseTitle: form.caseTitle.trim(),
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      showToast('Grievance submitted. HR will review it.', 'success');
      onSaved();
    } catch (err) {
      const info = errorInfo(err, 'Failed to submit the grievance');
      setErrors((e) => ({ ...e, ...info.fields }));
      setFormError(info.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Raise a Grievance" subtitle="Tell HR about a concern. Only you and HR can see it." width="480px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Grievance'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        <FormField label="Title" required error={errors.caseTitle}>
          <Input value={form.caseTitle} error={!!errors.caseTitle} onChange={(e) => set('caseTitle', e.target.value)} placeholder="e.g. Broken air conditioning in the office" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="What is it about?" required error={errors.caseType}>
            <Select value={form.caseType} placeholder="Select a type" error={!!errors.caseType} onChange={(e) => set('caseType', e.target.value)} options={GRIEVANCE_TYPES} />
          </FormField>
          <FormField label="How serious is it?" required>
            <Select value={form.severity} onChange={(e) => set('severity', e.target.value)} options={SEVERITIES} />
          </FormField>
        </div>
        <FormField label="When did it happen?" required error={errors.incidentDate}>
          <DatePicker value={form.incidentDate} max={new Date().toISOString().slice(0, 10)} error={!!errors.incidentDate} onChange={(e) => set('incidentDate', e.target.value)} />
        </FormField>
        <FormField label="Details (optional)" error={errors.description}>
          <Textarea rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe what happened and what you would like done." />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
function AddNoteModal({ caseItem, onClose, onSaved }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!note.trim()) { setError('Note text is required'); return; }
    setSaving(true);
    try {
      await dispatch(addNote({ id: caseItem._id, note: note.trim() })).unwrap();
      showToast('Note added', 'success');
      onSaved();
    } catch (err) {
      setError(err?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Internal Note" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Note" required error={error}>
          <Textarea rows={4} value={note} onChange={(e) => { setNote(e.target.value); setError(''); }} placeholder="Add context or progress notes…" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── View Case Drawer ─────────────────────────────────────────────────────────
function ViewCaseDrawer({ caseId, onClose, perms, onAction, refreshToken }) {
  const { showToast } = useToast();
  const [state, setState] = useState({ id: null, record: null, files: [], error: '' });
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([grievanceService.get(caseId), grievanceService.documents(caseId).catch(() => ({ data: { data: [] } }))])
      .then(([caseRes, fileRes]) => {
        if (!cancelled) setState({ id: caseId, record: caseRes.data?.data, files: fileRes.data?.data || [], error: '' });
      })
      .catch((err) => { if (!cancelled) setState({ id: caseId, record: null, files: [], error: apiError(err, 'Could not load this case') }); });
    return () => { cancelled = true; };
  }, [caseId, refreshToken, reloadKey]);

  const loading = state.id !== caseId;
  const record = loading ? null : state.record;

  const download = async (file) => {
    try {
      const res = await grievanceService.documentUrl(caseId, file.id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const upload = async (picked) => {
    if (!picked) return;
    setUploading(true);
    try {
      await grievanceService.uploadDocument(caseId, picked);
      showToast('Document attached', 'success');
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(apiError(err, 'The document could not be attached'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const employee = record?.employeeId && typeof record.employeeId === 'object' ? record.employeeId : null;
  const actions = [];
  if (record) {
    if (record.status === 'open' && perms.update) actions.push({ key: 'startReview', label: 'Start Review', primary: true, icon: FiCheck });
    if (record.status === 'under_review' && perms.resolve) actions.push({ key: 'resolve', label: 'Mark as Resolved', primary: true, icon: FiCheck });
    if (record.status === 'resolved' && perms.resolve) actions.push({ key: 'close', label: 'Close Case', primary: true, icon: FiCheck });
    if (record.status !== 'closed' && perms.update) actions.push({ key: 'edit', label: 'Edit Case', icon: FiEdit2 });
  }

  return (
    <Drawer isOpen onClose={onClose} title={record ? record.caseId : 'Case'} width="520px">
      {loading && <div style={{ padding: 24, color: '#94A3B8', fontSize: '0.85rem' }}>Loading…</div>}
      {!loading && state.error && (
        <div style={{ padding: 16, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.85rem' }}>{state.error}</div>
      )}
      {record && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>
              Severity: <SeverityPill value={record.severity} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {actions.map((a) => {
                const Icon = a.icon;
                return (
                  <button key={a.key} onClick={() => onAction(a.key, record)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', borderRadius: 6, cursor: 'pointer',
                      backgroundColor: a.primary ? '#10B981' : '#fff', color: a.primary ? '#fff' : '#334155', border: a.primary ? 'none' : '1px solid #E2E8F0' }}>
                    <Icon size={14} /> {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            {[
              ['Employee', fullName(record.employeeId)],
              ['Employee ID', employee?.employeeId || '—'],
              ['Department', record.departmentId?.name || '—'],
              ['Position', employee?.position || '—'],
              ['Category', titleCase(record.category)],
              ['Case type', record.caseType],
              ['Severity level', titleCase(record.severity)],
              ['Incident date', formatDate(record.incidentDate)],
              ['Date reported', formatDate(record.createdAt)],
              ['Case title', record.caseTitle],
              ['Status', <Badge key="s" status={titleCase(record.status)} />],
              ['Assigned officer', record.assignedOfficerId ? fullName(record.assignedOfficerId) : 'Not assigned yet'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
            <div style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{record.description || 'No description provided.'}</div>
          </div>

          <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Document uploads</div>
              {perms.update && record.status !== 'closed' && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#1D4ED8', cursor: uploading ? 'wait' : 'pointer' }}>
                  <FiUpload size={13} /> {uploading ? 'Uploading…' : 'Upload'}
                  <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
            {state.files.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No documents attached.</div>
            ) : state.files.map((f) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#0F172A' }}><FiPaperclip size={14} /> {f.fileName}</span>
                <button onClick={() => download(f)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: '#1D4ED8', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <FiDownload size={13} /> Download
                </button>
              </div>
            ))}
          </div>

          {Array.isArray(record.internalNotes) && (
          <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>Internal notes</div>
            {(record.internalNotes || []).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No notes yet.</div>
            ) : record.internalNotes.map((n, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i === record.internalNotes.length - 1 ? 'none' : '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.875rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{n.note}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{fullName(n.addedBy)} · {formatDate(n.addedAt)}</div>
              </div>
            ))}
          </div>
          )}
          {perms.update && Array.isArray(record.internalNotes) && (
            <div>
              <button onClick={() => onAction('addNote', record)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiPlus size={14} /> Add Note
              </button>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ─── Filter drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter cases" width="380px"
      footer={
        <>
          <button onClick={() => { onApply({ status: '', category: '', severity: '' }); onClose(); }}
            style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Status">
          <Select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} options={STATUS_OPTIONS} />
        </FormField>
        <FormField label="Category">
          <Select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            options={[{ value: '', label: 'All categories' }, ...CATEGORIES]} />
        </FormField>
        <FormField label="Severity">
          <Select value={draft.severity} onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value }))}
            options={[{ value: '', label: 'All severities' }, ...SEVERITIES]} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrievancesDiscipline() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();

  const items        = useSelector(selectCases);
  const meta         = useSelector(selectCasesMeta);
  const loading      = useSelector(selectCasesLoading);
  const stats        = useSelector(selectCaseStats);
  const statsLoading = useSelector(selectCasesStatsLoading);
  const loadError    = useSelector(selectCasesError);

  const canCreate  = usePermission('hr.disciplinarycase.create');
  const canUpdate  = usePermission('hr.disciplinarycase.update');
  const canResolve = usePermission('hr.disciplinarycase.resolve');
  const canViewAll = usePermission('hr.disciplinarycase.view-all');
  const [raiseOpen, setRaiseOpen] = useState(false);
  const perms = { update: canUpdate, resolve: canResolve };

  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', severity: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawer, setDrawer]       = useState(null);
  const [viewId, setViewId]       = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [noteTarget, setNoteTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const debounceRef = useRef(null);

  const query = useCallback((p, q, f) => {
    const params = { page: p, limit: ITEMS_PER_PAGE };
    if (q) params.q = q;
    Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
    return params;
  }, []);

  useEffect(() => {
    dispatch(fetchCases(query(page, activeSearch, filters)));
  }, [dispatch, query, page, activeSearch, filters]);

  useEffect(() => { dispatch(fetchCaseStats()); }, [dispatch]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(val.trim()); }, 400);
  };

  const refreshAll = () => {
    dispatch(fetchCases(query(page, activeSearch, filters)));
    dispatch(fetchCaseStats());
    setRefreshToken((t) => t + 1);
  };

  const handleAction = async (action, row) => {
    try {
      if (action === 'startReview') {
        await dispatch(startReview(row._id)).unwrap();
        showToast('Case moved to Under Review', 'success');
      } else if (action === 'resolve') {
        await dispatch(resolveCase(row._id)).unwrap();
        showToast('Case marked as resolved', 'success');
      } else if (action === 'close') {
        await dispatch(closeCase(row._id)).unwrap();
        showToast('Case closed', 'success');
      } else if (action === 'edit') {
        setDrawer({ item: row });
        return;
      } else if (action === 'addNote') {
        setNoteTarget(row);
        return;
      }
      refreshAll();
    } catch (err) {
      showToast(err?.message || 'Action failed', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const params = { format: 'csv' };
      if (activeSearch) params.q = activeSearch;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await grievanceService.exportList(params);
      saveBlob(res.data, 'disciplinary-cases.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const statValue = (key) => stats.find((s) => s.key === key)?.value ?? 0;
  const tiles = [
    { label: 'OPEN CASES', value: statValue('open'), subtitle: 'Current active cases', icon: FiList, bg: '#D1FAE5', color: '#065F46' },
    { label: 'UNDER REVIEW', value: statValue('under_review'), subtitle: 'Cases being investigated', icon: FiAlertTriangle, bg: '#FFEDD5', color: '#C2410C' },
    { label: 'RESOLVED CASES', value: statValue('resolved') + statValue('closed'), subtitle: 'Closed and resolved cases', icon: FiCheckCircle, bg: '#D1FAE5', color: '#065F46' },
    { label: 'DISCIPLINARY ACTIONS', value: statValue('disciplinary_active'), subtitle: 'Active disciplinary records', icon: FiInfo, bg: '#EFF6FF', color: '#1D4ED8' },
  ];

  const menuItems = (row) => {
    const out = [];
    if (row.status === 'open' && canUpdate) out.push({ label: 'Start Review', icon: FiCheck, color: '#1D4ED8', action: 'startReview' });
    if (row.status === 'under_review' && canResolve) out.push({ label: 'Mark as Resolved', icon: FiCheck, color: '#10B981', action: 'resolve' });
    if (row.status === 'resolved' && canResolve) out.push({ label: 'Close Case', icon: FiX, color: '#64748B', action: 'close' });
    if (row.status !== 'closed' && canUpdate) {
      out.push({ label: 'Add Note', icon: FiMessageSquare, color: '#334155', action: 'addNote' });
      out.push({ label: 'Edit Case', icon: FiEdit2, color: '#334155', action: 'edit' });
    }
    return out;
  };

  const columns = [
    { key: 'caseId', label: 'CASE NO', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName(v)}</span> },
    { key: 'category', label: 'CATEGORY', render: (v) => titleCase(v) },
    { key: 'caseType', label: 'CASE TYPE' },
    { key: 'severity', label: 'SEVERITY', render: (v) => <SeverityPill value={v} /> },
    { key: 'createdAt', label: 'DATE REPORTED', render: (v) => formatDate(v) },
    { key: 'status', label: 'STATUS', render: (v) => <Badge status={titleCase(v)} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewId(row._id)}><FiEye size={15} /></button>
          <RowMenu row={row} items={menuItems(row)} onAction={handleAction} />
        </div>
      ),
    },
  ];

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{canViewAll ? 'Grievances & Discipline' : 'My Grievances'}</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            {canViewAll
              ? 'Track employee complaints, investigations, disciplinary actions, and case resolutions'
              : 'Raise a concern with HR and follow its progress. You only see cases you raised or that concern you.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{t.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={14} /></div>
              </div>
              {statsLoading && stats.length === 0 ? (
                <div style={{ height: 28, width: 40, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
              ) : (
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{t.value}</div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{t.subtitle}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employee, case type…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canUpdate && (
              <button className="btn btn-secondary" onClick={() => setUploadOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Upload <FiUpload size={14} />
              </button>
            )}
            {!canCreate && (
              <button onClick={() => setRaiseOpen(true)} className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiPlus size={14} /> Raise Grievance
              </button>
            )}
            {canCreate && (
              <button onClick={() => setDrawer({ item: null })} className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiPlus size={14} /> Log Disciplinary Case
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError.message}</div>
            <button className="btn btn-secondary" onClick={refreshAll}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map((e) => e._id))}
            keyField="_id"
            emptyMessage={activeSearch || activeFilterCount ? 'No cases match your search or filters.' : (canViewAll ? 'No cases logged yet.' : 'You have not raised any grievances.')}
          />
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
        )}
      </div>

      {drawer && (
        <CaseDrawer
          key={drawer.item?._id || 'new'}
          editItem={drawer.item}
          onClose={() => setDrawer(null)}
          onSaved={() => { setDrawer(null); refreshAll(); }}
        />
      )}

      {raiseOpen && (
        <RaiseGrievanceDrawer onClose={() => setRaiseOpen(false)} onSaved={() => { setRaiseOpen(false); refreshAll(); }} />
      )}

      {viewId && (
        <ViewCaseDrawer
          key={viewId}
          caseId={viewId}
          perms={perms}
          refreshToken={refreshToken}
          onClose={() => setViewId(null)}
          onAction={handleAction}
        />
      )}

      {noteTarget && (
        <AddNoteModal
          caseItem={noteTarget}
          onClose={() => setNoteTarget(null)}
          onSaved={() => { setNoteTarget(null); refreshAll(); }}
        />
      )}

      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={filters} onApply={(f) => { setPage(1); setFilters(f); }} />}
      {uploadOpen && (
        <CaseFileDialog onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); setRefreshToken((t) => t + 1); }} />
      )}
    </div>
  );
}
