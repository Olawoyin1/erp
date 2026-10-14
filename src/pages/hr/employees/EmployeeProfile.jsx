import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Toast, { useToast } from '../../../components/ui/Toast';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, DatePicker, FileUpload } from '../../../components/ui/FormField';
import EditEmployeeModal from './EditEmployeeModal';
import Avatar from '../Avatar';
import AssignManagerDrawer from './AssignManagerDrawer';
import DeactivateModal from './DeactivateModal';
import { koboToNaira } from '../../../hooks/useKobo';
import { usePermission } from '../../../hooks/usePermission';
import { employeeService, payrollService } from '../../../services/hr.service';
import { apiError, titleCase, formatDate } from '../../../services/apiHelpers';
import { saveBlob, blobErrorMessage, fieldErrorsOf } from '../hrUtils';

import {
  fetchEmployee,
  fetchEmployeeCertifications,
  fetchEmployeeLeaveHistory,
  fetchEmployeeProjects,
  fetchEmployeeDocuments,
  fetchEmployeePayroll,
  updateEmployee,
  assignManager,
  deactivateEmployee,
  confirmEmployee,
  reactivateEmployee,
  linkEmployeeUser,
  selectEmployeeProfile,
  selectProfileLoading,
  selectProfileError,
  selectEmployeeSub,
  selectSubLoading,
  selectSubError,
  clearProfile,
} from '../../../store/hr/employeesSlice';

import {
  FiArrowLeft, FiMail, FiEdit2, FiAward, FiFileText, FiDownload, FiUpload, FiCheck, FiUser, FiLink, FiRotateCcw, FiX, FiBriefcase, FiShield,
} from 'react-icons/fi';

const RESTRICTED = 'Restricted';

function InfoCell({ label, value }) {
  return (
    <div style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: value === RESTRICTED ? '#94A3B8' : '#1E293B', fontStyle: value === RESTRICTED ? 'italic' : 'normal' }}>{value || '—'}</div>
    </div>
  );
}

function InfoGrid({ rows }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', borderBottom: ri < rows.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
          {row.map((cell) => <InfoCell key={cell.label} label={cell.label} value={cell.value} />)}
        </div>
      ))}
    </div>
  );
}

function TabSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: 52, borderRadius: 6, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
    </div>
  );
}

function TabError({ message, onRetry }) {
  return (
    <div style={{ padding: 16, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span>{message}</span>
      <button className="btn btn-secondary" onClick={onRetry}>Try again</button>
    </div>
  );
}

const statusStyle = (status) => {
  if (status === 'active' || status === 'valid' || status === 'approved') return { bg: '#DCFCE7', color: '#166534' };
  if (status === 'probation' || status === 'pending') return { bg: '#FEF9C3', color: '#854D0E' };
  if (status === 'on_leave') return { bg: '#DBEAFE', color: '#1E40AF' };
  return { bg: '#FEE2E2', color: '#991B1B' };
};

function Pill({ text, bg, color }) {
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, backgroundColor: bg, color }}>{text}</span>;
}

const th = { padding: '10px 12px', color: '#94A3B8', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'left' };

// ─── Add certification ────────────────────────────────────────────────────────
function CertificationModal({ employeeId, onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ certificateName: '', issuedDate: '', expiryDate: '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const submit = async () => {
    const next = {};
    if (!form.certificateName.trim()) next.certificateName = 'Enter the certificate name';
    if (!form.issuedDate) next.issuedDate = 'Enter the issue date';
    if (form.expiryDate && form.issuedDate && form.expiryDate < form.issuedDate) next.expiryDate = 'Must be after the issue date';
    if (!file) next.file = 'Attach the certificate';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError('');
    try {
      await employeeService.uploadCertification(employeeId, { ...form, certificateName: form.certificateName.trim(), file });
      showToast('Certification added', 'success');
      onSaved();
    } catch (err) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(err) }));
      setFormError(apiError(err, 'The certification could not be saved'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add Certification" maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{formError}</div>}
        <FormField label="Certificate name" required error={errors.certificateName}>
          <Input value={form.certificateName} error={!!errors.certificateName} onChange={(e) => set('certificateName', e.target.value)} placeholder="e.g. NEBOSH International General Certificate" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Issued" required error={errors.issuedDate}>
            <DatePicker value={form.issuedDate} max={new Date().toISOString().slice(0, 10)} error={!!errors.issuedDate} onChange={(e) => set('issuedDate', e.target.value)} />
          </FormField>
          <FormField label="Expires" error={errors.expiryDate}>
            <DatePicker value={form.expiryDate} min={form.issuedDate || undefined} error={!!errors.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Certificate file" required error={errors.file}>
          <FileUpload value={file} onChange={(f) => { setFile(f); setErrors((e) => ({ ...e, file: undefined })); }} error={!!errors.file} accept=".pdf,.png,.jpg,.jpeg" maxSizeText="Up to 50MB" subtext="PDF, PNG or JPG" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add Certification'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Link user account ────────────────────────────────────────────────────────
function LinkUserModal({ employee, onClose, onLink }) {
  const [term, setTerm] = useState('');
  const [state, setState] = useState({ users: [], loading: true, error: '' });
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      employeeService.linkableUsers(term.trim())
        .then((res) => { if (!cancelled) setState({ users: res.data?.data || [], loading: false, error: '' }); })
        .catch((err) => { if (!cancelled) setState({ users: [], loading: false, error: apiError(err, 'Could not load user accounts') }); });
    }, term ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [term]);

  const submit = async () => {
    if (!userId) { setError('Choose a user account'); return; }
    setSaving(true);
    const message = await onLink(userId);
    setSaving(false);
    if (message) setError(message);
  };

  return (
    <Modal isOpen onClose={onClose} title="Link User Account" subtitle={`Connect a login to ${employee.fullName}`} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
          Clocking in, deactivation and most HR notifications depend on this link. Only accounts not yet tied to an employee are listed.
        </p>
        <FormField label="Search accounts">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Name or email" />
        </FormField>
        <FormField label="User account" required error={error || state.error}>
          <Select value={userId} searchable placeholder={state.loading ? 'Loading…' : 'Select account'}
            onChange={(e) => { setUserId(e.target.value); setError(''); }}
            options={state.users.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving || !userId}
            style={{ padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving || !userId ? 0.6 : 1 }}>
            {saving ? 'Linking…' : 'Link account'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ title, body, confirmLabel, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const run = async () => {
    setSaving(true);
    const message = await onConfirm();
    setSaving(false);
    if (message) setError(message);
  };
  return (
    <Modal isOpen title={title} onClose={onClose} maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{body}</p>
        {error && <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{error}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={run} disabled={saving} style={{ padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const canUpdate     = usePermission('hr.employee.update');
  const canConfirm    = usePermission('hr.employee.confirm');
  const canDeactivate = usePermission('hr.employee.deactivate');
  const canReactivate = usePermission('hr.employee.reactivate');
  const canSeeSensitive = usePermission('hr.employee.view-sensitive');
  const canViewPayroll = usePermission('hr.payroll.view');
  const canVerifyDoc  = usePermission('hr.onboarding.verify');
  const canDeploy     = usePermission('hr.deployment.create');
  const sensitiveVisible = canSeeSensitive || canViewPayroll;

  const [activeTab, setActiveTab] = useState('personal');
  const [dialog, setDialog] = useState(null);
  const [busyDoc, setBusyDoc] = useState('');

  const employee       = useSelector(selectEmployeeProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError   = useSelector(selectProfileError);

  const certs      = useSelector(selectEmployeeSub('certifications', id));
  const leave      = useSelector(selectEmployeeSub('leaveHistory', id));
  const projects   = useSelector(selectEmployeeSub('projects', id));
  const documents  = useSelector(selectEmployeeSub('documents', id));
  const payroll    = useSelector(selectEmployeeSub('payroll', id));

  const certsLoading = useSelector(selectSubLoading('certifications', id));
  const leaveLoading = useSelector(selectSubLoading('leaveHistory', id));
  const projLoading  = useSelector(selectSubLoading('projects', id));
  const docsLoading  = useSelector(selectSubLoading('documents', id));
  const payLoading   = useSelector(selectSubLoading('payroll', id));
  const certsError = useSelector(selectSubError('certifications', id));
  const leaveError = useSelector(selectSubError('leaveHistory', id));
  const projError  = useSelector(selectSubError('projects', id));
  const docsError  = useSelector(selectSubError('documents', id));
  const payError   = useSelector(selectSubError('payroll', id));

  useEffect(() => {
    dispatch(fetchEmployee(id));
    dispatch(fetchEmployeeProjects(id));
    return () => { dispatch(clearProfile()); };
  }, [dispatch, id]);

  useEffect(() => {
    if (activeTab === 'certifications' && !certs && !certsLoading && !certsError) dispatch(fetchEmployeeCertifications(id));
    if (activeTab === 'leave' && !leave && !leaveLoading && !leaveError) dispatch(fetchEmployeeLeaveHistory(id));
    if (activeTab === 'documents' && !documents && !docsLoading && !docsError) dispatch(fetchEmployeeDocuments(id));
    if (activeTab === 'payroll' && canViewPayroll && !payroll && !payLoading && !payError) dispatch(fetchEmployeePayroll(id));
  }, [activeTab, id, dispatch, canViewPayroll, certs, certsLoading, certsError, leave, leaveLoading, leaveError, documents, docsLoading, docsError, payroll, payLoading, payError]);

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleEditSave = async (data) => {
    const result = await dispatch(updateEmployee({ id: employee._id, data }));
    if (updateEmployee.fulfilled.match(result)) {
      setDialog(null);
      showToast('Profile updated successfully', 'success');
      dispatch(fetchEmployee(id));
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleAssign = async (managerId) => {
    const result = await dispatch(assignManager({ id: employee._id, reportingManagerId: managerId }));
    if (assignManager.fulfilled.match(result)) {
      setDialog(null);
      showToast('Supervisor updated successfully', 'success');
      dispatch(fetchEmployee(id));
      return '';
    }
    return result.payload?.message || 'Assignment failed';
  };

  const handleDeactivate = async (reason) => {
    const result = await dispatch(deactivateEmployee({ id: employee._id, reason }));
    if (deactivateEmployee.fulfilled.match(result)) {
      setDialog(null);
      showToast('Employee deactivated', 'success');
      dispatch(fetchEmployee(id));
      return undefined;
    }
    const blockers = (result.payload?.details || []).filter((d) => d.field === 'blockers').map((d) => d.message);
    return { message: result.payload?.message || 'Deactivation failed', blockers };
  };

  const runLifecycle = (thunk, success, fallback) => async () => {
    const result = await dispatch(thunk(employee._id));
    if (thunk.fulfilled.match(result)) {
      setDialog(null);
      showToast(success, 'success');
      dispatch(fetchEmployee(id));
      return '';
    }
    return result.payload?.message || fallback;
  };

  const handleLink = async (userId) => {
    const result = await dispatch(linkEmployeeUser({ id: employee._id, userId }));
    if (linkEmployeeUser.fulfilled.match(result)) {
      setDialog(null);
      showToast('User account linked', 'success');
      return '';
    }
    return result.payload?.message || 'Could not link the account';
  };

  const downloadDocument = async (doc) => {
    try {
      const res = await employeeService.documentUrl(employee._id, doc._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const uploadDocument = async (file) => {
    if (!file) return;
    setBusyDoc('upload');
    try {
      await employeeService.uploadDocument(employee._id, file);
      showToast('Document uploaded', 'success');
      dispatch(fetchEmployeeDocuments(id));
    } catch (err) {
      showToast(apiError(err, 'The document could not be uploaded'), 'error');
    } finally {
      setBusyDoc('');
    }
  };

  const verifyDocument = async (doc) => {
    setBusyDoc(doc._id);
    try {
      await employeeService.verifyDocument(employee._id, doc._id);
      showToast('Document verified', 'success');
      dispatch(fetchEmployeeDocuments(id));
    } catch (err) {
      showToast(apiError(err, 'Could not verify the document'), 'error');
    } finally {
      setBusyDoc('');
    }
  };

  const downloadPayslip = async (slip) => {
    try {
      const res = await payrollService.downloadPayslip(slip._id);
      saveBlob(res.data, `payslip-${slip.payslipId}.pdf`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Could not download the payslip'), 'error');
    }
  };

  if (profileLoading && !employee) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        {[100, 200, 120].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: 12, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        ))}
      </div>
    );
  }

  if (profileError) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: '#DC2626', marginBottom: 12 }}>{profileError.message || 'Failed to load employee profile.'}</div>
        <Link to="/hr/employees" className="btn btn-secondary">Back to Directory</Link>
      </div>
    );
  }

  if (!employee) return null;

  const name        = employee.fullName ?? '—';
  const empId       = employee.employeeId ?? '—';
  const status      = employee.status ?? 'active';
  const email       = employee.email ?? '';
  const activeDeployment = (projects || []).find((d) => d.status === 'active');
  const location    = activeDeployment?.siteId?.name || '—';
  const sensitive   = (value, formatter = (v) => v) => {
    if (value === undefined || value === null || value === '') return sensitiveVisible ? '—' : RESTRICTED;
    return formatter(value);
  };

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'certifications', label: 'Certification & Training' },
    { id: 'leave', label: 'Leave History' },
    ...(canViewPayroll ? [{ id: 'payroll', label: 'Payroll' }] : []),
    { id: 'projects', label: 'Projects' },
    { id: 'documents', label: 'Documents' },
  ];

  const st = statusStyle(status);
  const salaryStructure = payroll?.salaryStructure;
  const recentPayslips  = payroll?.recentPayslips ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'var(--font)' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Employees</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>Manage employee records, roles, departments, and employment status</p>
        <div style={{ marginTop: 12 }}>
          <Link to="/hr/employees" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.813rem', color: '#64748B', fontWeight: 500, textDecoration: 'none' }}>
            <FiArrowLeft size={14} /> Back to Directory
          </Link>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar name={name} url={employee.photoUrl} size={68} />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{name}</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 2 }}>{employee.position} &bull; {empId}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Pill text={status === 'on_leave' ? 'On Leave' : titleCase(status)} bg={st.bg} color={st.color} />
                {employee.departmentId?.name && <Pill text={employee.departmentId.name} bg="#E0E7FF" color="#3730A3" />}
                <Pill text={titleCase(employee.contractType)} bg="#DBEAFE" color="#1E40AF" />
                {employee.grade && <Pill text={`Grade ${employee.grade}`} bg="#F1F5F9" color="#475569" />}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href={`mailto:${email}`} className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#FFF', border: '1px solid #E2E8F0', color: '#334155', padding: '7px 14px', fontSize: '0.813rem', fontWeight: 500, borderRadius: 6 }}>
              <FiMail size={14} /> Email
            </a>
            {canDeploy && status !== 'deactivated' && (
              <button className="btn btn-secondary" onClick={() => navigate('/hr/deployment', { state: { deployEmployeeId: employee._id } })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: '0.813rem', borderRadius: 6 }}>
                <FiBriefcase size={14} /> Deploy
              </button>
            )}
            {canUpdate && status !== 'deactivated' && (
              <button className="btn btn-primary" onClick={() => setDialog('edit')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#1D4ED8', color: '#FFF', padding: '7px 16px', fontSize: '0.813rem', fontWeight: 600, borderRadius: 6, border: 'none' }}>
                <FiEdit2 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canUpdate && status !== 'deactivated' && (
            <button className="btn btn-secondary" onClick={() => setDialog('assign')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}>
              <FiUser size={13} /> Assign Manager
            </button>
          )}
          {canUpdate && !employee.userId && status !== 'deactivated' && (
            <button className="btn btn-secondary" onClick={() => setDialog('link')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem' }}>
              <FiLink size={13} /> Link User Account
            </button>
          )}
          {canConfirm && status === 'probation' && (
            <button className="btn btn-secondary" onClick={() => setDialog('confirm')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem', color: '#059669' }}>
              <FiCheck size={13} /> Confirm Probation
            </button>
          )}
          {canDeactivate && status !== 'deactivated' && (
            <button className="btn btn-secondary" onClick={() => setDialog('deactivate')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem', color: '#DC2626' }}>
              <FiX size={13} /> Deactivate
            </button>
          )}
          {canReactivate && status === 'deactivated' && (
            <button className="btn btn-secondary" onClick={() => setDialog('reactivate')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.8rem', color: '#059669' }}>
              <FiRotateCcw size={13} /> Reactivate
            </button>
          )}
        </div>

        {status === 'deactivated' && (
          <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
            Deactivated on {formatDate(employee.deactivatedAt)}{employee.deactivationReason ? `: ${employee.deactivationReason}` : ''}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, backgroundColor: '#FAFAFA', padding: '16px 20px', borderRadius: 8, border: '1px solid #F1F5F9' }}>
          {[
            ['EMAIL', email],
            ['PHONE', employee.phone],
            ['LOCATION', location],
            ['CURRENT PROJECT', employee.currentProjectRef],
            ['HIRE DATE', formatDate(employee.hireDate)],
            ['MANAGER', employee.reportingManagerId?.fullName],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginTop: 4, wordBreak: 'break-word' }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 28, overflowX: 'auto', padding: '0 4px' }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '0.85rem', fontWeight: active ? 600 : 500, color: active ? '#1D4ED8' : '#64748B', borderBottom: active ? '2.5px solid #1D4ED8' : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

        {activeTab === 'personal' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Personal Information</h3>
            <InfoGrid rows={[
              [{ label: 'FULL NAME', value: name }, { label: 'EMPLOYEE ID', value: empId }, { label: 'EMAIL', value: email }],
              [
                { label: 'PHONE', value: employee.phone },
                { label: 'DATE OF BIRTH', value: sensitive(employee.dateOfBirth, formatDate) },
                { label: 'NATIONALITY', value: sensitive(employee.nationality) },
              ],
              [
                { label: 'STATE', value: sensitive(employee.state) },
                { label: 'ADDRESS', value: sensitive(employee.address) },
                { label: 'NEXT OF KIN', value: sensitive(employee.nextOfKin, (k) => `${k.name}, ${k.relation} (${k.phone})`) },
              ],
            ]} />
            {!sensitiveVisible && (
              <p style={{ margin: '12px 0 0', fontSize: '0.78rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiShield size={13} /> Personal details are only shown to people with sensitive-data access.
              </p>
            )}
          </div>
        )}

        {activeTab === 'employment' && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Employment Information</h3>
            <InfoGrid rows={[
              [{ label: 'POSITION', value: employee.position }, { label: 'DEPARTMENT', value: employee.departmentId?.name }, { label: 'GRADE', value: employee.grade }],
              [{ label: 'CONTRACT TYPE', value: titleCase(employee.contractType) }, { label: 'HIRE DATE', value: formatDate(employee.hireDate) }, { label: 'REPORTING TO', value: employee.reportingManagerId?.fullName }],
              [{ label: 'LOCATION', value: location }, { label: 'CURRENT PROJECT', value: employee.currentProjectRef }, { label: 'EMPLOYMENT STATUS', value: status === 'on_leave' ? 'On Leave' : titleCase(status) }],
              [
                { label: 'EMPLOYMENT TYPE', value: employee.employmentType },
                { label: 'PROBATION END DATE', value: employee.probationEndDate ? formatDate(employee.probationEndDate) : status === 'probation' ? 'Not set' : '—' },
                { label: 'CONTRACT END DATE', value: employee.contractEndDate ? formatDate(employee.contractEndDate) : employee.contractType === 'permanent' ? 'Not applicable' : 'Not set' },
              ],
              [
                { label: 'CONFIRMED ON', value: employee.confirmedAt ? formatDate(employee.confirmedAt) : '—' },
                { label: 'LOGIN ACCOUNT', value: employee.userId ? 'Linked' : 'Not linked' },
                { label: 'GENERAL NOTES', value: employee.notes !== undefined ? employee.notes : (sensitiveVisible ? '—' : RESTRICTED) },
              ],
            ]} />
          </div>
        )}

        {activeTab === 'certifications' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Certification &amp; Training</h3>
              {canUpdate && (
                <button className="btn btn-secondary" onClick={() => setDialog('certification')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#FFF', border: '1px solid #E2E8F0', color: '#334155', padding: '6px 14px', fontSize: '0.813rem', borderRadius: 6 }}>
                  <FiAward size={13} /> Add Certification
                </button>
              )}
            </div>
            {certsError ? <TabError message={certsError} onRetry={() => dispatch(fetchEmployeeCertifications(id))} /> : certsLoading || !certs ? <TabSkeleton /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead><tr style={{ borderBottom: '1px solid #F1F5F9' }}>{['CERTIFICATE', 'ISSUED', 'EXPIRES', 'SOURCE', 'STATUS'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {certs.length > 0 ? certs.map((c) => {
                    const cs = statusStyle(c.status);
                    return (
                      <tr key={c._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{c.certificateName}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{formatDate(c.issuedDate)}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{c.expiryDate ? formatDate(c.expiryDate) : 'No expiry'}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{c.source === 'training' ? 'Training' : 'Uploaded'}</td>
                        <td style={{ padding: '14px 12px' }}><Pill text={titleCase(c.status)} bg={cs.bg} color={cs.color} /></td>
                      </tr>
                    );
                  }) : <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No certifications found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'leave' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Leave History</h3>
            {leaveError ? <TabError message={leaveError} onRetry={() => dispatch(fetchEmployeeLeaveHistory(id))} /> : leaveLoading || !leave ? <TabSkeleton /> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                <thead><tr style={{ borderBottom: '1px solid #F1F5F9' }}>{['TYPE', 'FROM', 'TO', 'DAYS', 'STATUS'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {leave.length > 0 ? leave.map((lh) => {
                    const ls = statusStyle(lh.status);
                    return (
                      <tr key={lh._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 500, color: '#1E293B' }}>{lh.leaveTypeId?.name ?? '—'}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{formatDate(lh.startDate)}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{formatDate(lh.endDate)}</td>
                        <td style={{ padding: '14px 12px', color: '#475569' }}>{lh.durationDays ?? '—'}</td>
                        <td style={{ padding: '14px 12px' }}><Pill text={titleCase(lh.status)} bg={ls.bg} color={ls.color} /></td>
                      </tr>
                    );
                  }) : <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No leave history found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'payroll' && canViewPayroll && (
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: '0 0 20px' }}>Payroll Information</h3>
            {payError ? <TabError message={payError} onRetry={() => dispatch(fetchEmployeePayroll(id))} /> : payLoading || !payroll ? <TabSkeleton /> : (
              <>
                <InfoGrid rows={[
                  [
                    { label: 'BASE SALARY', value: employee.baseSalary !== undefined ? koboToNaira(employee.baseSalary) : '—' },
                    { label: 'GRADE', value: employee.grade },
                    { label: 'SALARY STRUCTURE', value: salaryStructure ? `${salaryStructure.jobTitle} (${salaryStructure.level})` : employee.grade ? 'No active structure for this grade' : 'No grade assigned' },
                  ],
                  ...(salaryStructure ? [[
                    { label: 'BASIC', value: koboToNaira(salaryStructure.basicSalary) },
                    { label: 'HOUSING', value: koboToNaira(salaryStructure.housingAllowance) },
                    { label: 'TRANSPORT', value: koboToNaira(salaryStructure.transportAllowance) },
                  ]] : []),
                ]} />
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>Recent payslips</div>
                  {recentPayslips.length === 0 ? (
                    <div style={{ color: '#94A3B8', fontSize: '0.85rem', padding: '12px 0' }}>No payslips generated yet.</div>
                  ) : recentPayslips.map((ps) => (
                    <div key={ps._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.813rem', gap: 12 }}>
                      <span style={{ color: '#1E293B' }}>{ps.payslipId} &bull; {new Date(ps.periodYear, (ps.periodMonth || 1) - 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{koboToNaira(ps.netSalary)}</span>
                        <button className="icon-btn" title="Download payslip" onClick={() => downloadPayslip(ps)}><FiDownload size={15} /></button>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Project Assignments</h3>
            {projError ? <TabError message={projError} onRetry={() => dispatch(fetchEmployeeProjects(id))} /> : projLoading || !projects ? <TabSkeleton /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {projects.length > 0 ? projects.map((dep) => (
                  <div key={dep._id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFF' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{dep.projectRef}</div>
                    <div style={{ fontSize: '0.781rem', color: '#64748B', marginTop: 4 }}>
                      {dep.deploymentId} &bull; {titleCase(dep.status)} &bull; {dep.role}{dep.siteId?.name ? ` • ${dep.siteId.name}` : ''} &bull; {formatDate(dep.startDate)}{dep.expectedEndDate ? ` to ${formatDate(dep.expectedEndDate)}` : ''}
                    </div>
                  </div>
                )) : <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No project assignments found.</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Uploaded Documents</h3>
              {canUpdate && (
                <label className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.813rem', borderRadius: 6, cursor: busyDoc === 'upload' ? 'wait' : 'pointer' }}>
                  <FiUpload size={13} /> {busyDoc === 'upload' ? 'Uploading…' : 'Upload document'}
                  <input type="file" style={{ display: 'none' }} disabled={busyDoc === 'upload'} onChange={(e) => { uploadDocument(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
            {docsError ? <TabError message={docsError} onRetry={() => dispatch(fetchEmployeeDocuments(id))} /> : docsLoading || !documents ? <TabSkeleton /> : (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                {documents.length > 0 ? documents.map((doc, i, arr) => (
                  <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < arr.length - 1 ? '1px solid #E2E8F0' : 'none', backgroundColor: '#fff', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <FiFileText size={16} color="#64748B" />
                      <span style={{ fontSize: '0.875rem', color: '#1E293B' }}>{doc.originalName}</span>
                      {doc.verified ? <Pill text="Verified" bg="#DCFCE7" color="#166534" /> : <Pill text="Not verified" bg="#F1F5F9" color="#64748B" />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {canVerifyDoc && !doc.verified && (
                        <button onClick={() => verifyDocument(doc)} disabled={busyDoc === doc._id}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: '#059669', cursor: 'pointer', fontSize: '0.813rem', fontWeight: 500 }}>
                          <FiCheck size={14} /> {busyDoc === doc._id ? 'Verifying…' : 'Verify'}
                        </button>
                      )}
                      <button onClick={() => downloadDocument(doc)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', fontSize: '0.813rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                        <FiDownload size={14} /> Download
                      </button>
                    </div>
                  </div>
                )) : <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>No documents uploaded yet.</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {dialog === 'edit' && <EditEmployeeModal employee={employee} onClose={() => setDialog(null)} onSave={handleEditSave} onPhotoChanged={() => dispatch(fetchEmployee(id))} />}
      {dialog === 'assign' && <AssignManagerDrawer employee={employee} onClose={() => setDialog(null)} onAssign={handleAssign} />}
      {dialog === 'deactivate' && <DeactivateModal employee={employee} onClose={() => setDialog(null)} onDeactivate={handleDeactivate} />}
      {dialog === 'confirm' && (
        <ConfirmModal title="Confirm probation" confirmLabel="Confirm employee" onClose={() => setDialog(null)}
          onConfirm={runLifecycle(confirmEmployee, 'Probation confirmed. The employee is now active.', 'Could not confirm probation')}
          body={`${name} will move from probation to active and the confirmation date is recorded.`} />
      )}
      {dialog === 'reactivate' && (
        <ConfirmModal title="Reactivate employee" confirmLabel="Reactivate" onClose={() => setDialog(null)}
          onConfirm={runLifecycle(reactivateEmployee, 'Employee reactivated', 'Could not reactivate')}
          body={`${name} will be marked active again. Their login stays disabled until an administrator re-enables it under User Management.`} />
      )}
      {dialog === 'link' && <LinkUserModal employee={employee} onClose={() => setDialog(null)} onLink={handleLink} />}
      {dialog === 'certification' && (
        <CertificationModal employeeId={employee._id} onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); dispatch(fetchEmployeeCertifications(id)); }} />
      )}
    </div>
  );
}
