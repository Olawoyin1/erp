import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical, FiCheck, FiEdit2,
  FiPauseCircle, FiPlayCircle, FiUsers, FiActivity, FiClock, FiBarChart2, FiFileText, FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchDeployments, fetchDeploymentStats, createDeployment, updateDeployment, setDeploymentStatus,
  ALLOWED_TRANSITIONS, STATUS_STYLES,
} from '../../../store/hr/deploymentSlice';
import { deploymentService, employeeService } from '../../../services/hr.service';
import { apiError, formatDate, titleCase } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, fullName, saveBlob, blobErrorMessage, ymd } from '../hrUtils';
import ImportDialog from '../ImportDialog';
import EmployeePicker from '../EmployeePicker';

const ROWS_PER_PAGE = 10;

const DEPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'rotation', label: 'Rotation' },
  { value: 'temporary', label: 'Temporary' },
];
const TYPE_COLORS = { full_time: '#1D4ED8', rotation: '#1D4ED8', temporary: '#1D4ED8' };
const STATUS_FILTERS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_STYLES).map(([value, s]) => ({ value, label: s.label }))];

const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);
const siteName = (site) => (site && typeof site === 'object' ? site.name : '') || '—';

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: titleCase(status) };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 6 }}>{sub}</div>}
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} color={iconColor} />
      </div>
    </div>
  );
}

const ACTION_ICONS = { edit: FiEdit2, hold: FiPauseCircle, active: FiPlayCircle, complete: FiCheck, download: FiDownload };

function RowActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!actions?.length) return null;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 1200, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', minWidth: 200, padding: 6 }}>
          {actions.map((act) => {
            const Icon = ACTION_ICONS[act.icon];
            return (
              <button key={act.action} type="button" className="menu-item-hover"
                onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, color: act.icon === 'active' || act.icon === 'complete' ? '#059669' : '#1E293B', fontFamily: 'var(--font)', textAlign: 'left' }}>
                {Icon && <Icon size={14} />}
                {act.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────
function ViewDeploymentDrawer({ deployment, onClose, onEdit, onStatusChange, onDownloadReport, canUpdate }) {
  const status = deployment.status;
  const next = ALLOWED_TRANSITIONS[status] || [];
  const dept = deployment.employeeId?.departmentId;

  return (
    <Drawer isOpen onClose={onClose} title={fullName(deployment.employeeId)} subtitle={`${deployment.deploymentId} · ${siteName(deployment.siteId)}`} width="500px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <StatusPill status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {canUpdate && next.includes('active') && (
            <button onClick={() => onStatusChange(deployment, 'active')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#16A34A', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiPlayCircle size={13} /> Mark as Active
            </button>
          )}
          {canUpdate && next.includes('on_hold') && (
            <button onClick={() => onStatusChange(deployment, 'on_hold')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiPauseCircle size={13} /> Put on Hold
            </button>
          )}
          {canUpdate && next.includes('completed') && (
            <button onClick={() => onStatusChange(deployment, 'completed')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiCheck size={13} /> Complete Deployment
            </button>
          )}
          {status === 'completed' && (
            <button onClick={() => onDownloadReport(deployment)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiFileText size={13} /> Download Report
            </button>
          )}
          {canUpdate && status !== 'completed' && (
            <button onClick={() => onEdit(deployment)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiEdit2 size={13} /> Edit Deployment
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <InfoItem label="EMPLOYEE" value={fullName(deployment.employeeId)} />
        <InfoItem label="EMPLOYEE ID" value={deployment.employeeId?.employeeId} />
        <InfoItem label="DEPLOYMENT ID" value={deployment.deploymentId} />
        <InfoItem label="DEPARTMENT" value={dept && typeof dept === 'object' ? dept.name : ''} />
        <InfoItem label="PROJECT" value={deployment.projectRef} />
        <InfoItem label="ROLE" value={deployment.role} />
        <InfoItem label="SITE" value={siteName(deployment.siteId)} />
        <InfoItem label="DEPLOYMENT TYPE" value={DEPLOYMENT_TYPES.find((t) => t.value === deployment.deploymentType)?.label} />
        <InfoItem label="START DATE" value={formatDate(deployment.startDate)} />
        <InfoItem label="EXPECTED END" value={formatDate(deployment.expectedEndDate)} />
        <InfoItem label="SUPERVISOR" value={deployment.supervisorRef} />
        <InfoItem label="STATUS" value={STATUS_STYLES[status]?.label} />
      </div>

      {deployment.notes && (
        <div style={{ marginTop: 20, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>DEPLOYMENT NOTES</div>
          <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{deployment.notes}</p>
        </div>
      )}
    </Drawer>
  );
}

// ─── Deploy / Edit ────────────────────────────────────────────────────────────
function DeployDrawer({ editDeployment, presetEmployeeId, lookups, onClose, onSave }) {
  const isEdit = !!editDeployment;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [employee, setEmployee] = useState(isEdit && typeof editDeployment.employeeId === 'object' ? editDeployment.employeeId : null);
  const [form, setForm] = useState(() => ({
    employeeId: idOf(editDeployment?.employeeId) || presetEmployeeId || '',
    siteId: idOf(editDeployment?.siteId) || '',
    projectRef: editDeployment?.projectRef || '',
    role: editDeployment?.role || '',
    deploymentType: editDeployment?.deploymentType || 'full_time',
    startDate: ymd(editDeployment?.startDate),
    expectedEndDate: ymd(editDeployment?.expectedEndDate),
    supervisorRef: editDeployment?.supervisorRef || '',
    notes: editDeployment?.notes || '',
    activateNow: false,
  }));

  useEffect(() => {
    if (!presetEmployeeId || isEdit) return undefined;
    let cancelled = false;
    employeeService.get(presetEmployeeId)
      .then((res) => { if (!cancelled) setEmployee(res.data?.data || null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [presetEmployeeId, isEdit]);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const next = {};
    if (!form.employeeId) next.employeeId = 'Choose the employee';
    if (!form.siteId) next.siteId = 'Choose the project location';
    if (!form.projectRef.trim()) next.projectRef = 'Enter the project';
    if (!form.role.trim()) next.role = 'Enter the assigned project role';
    if (!form.startDate) next.startDate = 'Enter the start date';
    if (form.expectedEndDate && form.startDate && form.expectedEndDate < form.startDate) next.expectedEndDate = 'Must not be before the start date';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    const project = lookups.projects.find((p) => p.projectName === form.projectRef.trim());
    const body = {
      projectRef: form.projectRef.trim(),
      siteId: form.siteId,
      role: form.role.trim(),
      deploymentType: form.deploymentType,
      startDate: form.startDate,
      ...(project ? { projectId: project._id } : {}),
      ...(form.expectedEndDate ? { expectedEndDate: form.expectedEndDate } : {}),
      ...(form.supervisorRef.trim() ? { supervisorRef: form.supervisorRef.trim() } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };
    const failure = await onSave(isEdit ? body : { ...body, employeeId: form.employeeId }, form.activateNow);
    setSaving(false);
    if (failure) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title={isEdit ? 'Edit Deployment' : 'Deploy Employee for Project'}
      subtitle={isEdit ? 'Update deployment record details' : 'Assign an employee to a project or site'} width="520px"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '9px 16px' }}>Cancel</button>
          <button onClick={submit} disabled={saving}
            style={{ flex: 1, padding: '9px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font)', fontSize: '0.875rem' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Confirm Mobilisation'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(formError || lookups.error) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '12px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem', lineHeight: 1.5 }}>
            <FiAlertCircle size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600 }}>{formError ? 'This deployment cannot be saved' : 'Could not load sites and projects'}</div>
              <div>{formError || lookups.error}</div>
              {Object.values(errors).filter(Boolean).length > 0 && formError && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {[...new Set(Object.values(errors).filter(Boolean))].map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}
        <FormField label="Select employee" required error={isEdit ? undefined : errors.employeeId}>
          <EmployeePicker value={form.employeeId} selected={employee} disabled={isEdit} params={{ activeOnly: 'true' }} error={!!errors.employeeId}
            onChange={(id, emp) => { set('employeeId', id); setEmployee(emp); }} />
        </FormField>
        <FormField label="Project location" required error={errors.siteId}>
          <Select value={form.siteId} searchable error={!!errors.siteId} placeholder={lookups.loading ? 'Loading…' : 'Select project location'}
            onChange={(e) => set('siteId', e.target.value)} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} />
        </FormField>
        <FormField label="Project" required error={errors.projectRef} helpText="Pick a project or type a reference">
          <Input list="deployment-projects" value={form.projectRef} error={!!errors.projectRef} onChange={(e) => set('projectRef', e.target.value)} placeholder="e.g. Lekki Phase 2 Expansion" />
          <datalist id="deployment-projects">
            {lookups.projects.map((p) => <option key={p._id} value={p.projectName} />)}
          </datalist>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Assigned project role" required error={errors.role}>
            <Input value={form.role} error={!!errors.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Site Engineer" />
          </FormField>
          <FormField label="Deployment start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} error={!!errors.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </FormField>
          <FormField label="Deployment type" required>
            <Select value={form.deploymentType} onChange={(e) => set('deploymentType', e.target.value)} options={DEPLOYMENT_TYPES} />
          </FormField>
          <FormField label="Expected end date" error={errors.expectedEndDate}>
            <DatePicker value={form.expectedEndDate} min={form.startDate || undefined} error={!!errors.expectedEndDate} onChange={(e) => set('expectedEndDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Supervisor">
          <Input value={form.supervisorRef} onChange={(e) => set('supervisorRef', e.target.value)} placeholder="e.g. Engr. Kola Williams" />
        </FormField>
        {!isEdit && (
          <FormField label="Status" required>
            <Select value={form.activateNow ? 'active' : 'pending'} onChange={(e) => set('activateNow', e.target.value === 'active')}
              options={[{ value: 'pending', label: 'Pending (awaiting mobilisation)' }, { value: 'active', label: 'Active (starts now)' }]} />
          </FormField>
        )}
        <FormField label="Deployment notes">
          <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Additional notes or instructions…" rows={3} />
        </FormField>
      </div>
    </Drawer>
  );
}

function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter deployments" width="380px"
      footer={
        <>
          <button onClick={() => { onApply(''); onClose(); }} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <FormField label="Status">
        <Select value={draft} onChange={(e) => setDraft(e.target.value)} options={STATUS_FILTERS} />
      </FormField>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Deployment() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const { records, meta, stats, statsLoading, loading, error: loadError } = useSelector((s) => s.deployments);

  const canCreate = usePermission('hr.deployment.create');
  const canUpdate = usePermission('hr.deployment.update');

  const [presetEmployeeId] = useState(() => location.state?.deployEmployeeId || '');

  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [drawer, setDrawer] = useState(presetEmployeeId && canCreate ? { deployment: null } : null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [lookups, setLookups] = useState({ loading: true, error: '', locations: [], projects: [] });
  const debounceRef = useRef(null);

  const params = useCallback(() => ({ page, limit: ROWS_PER_PAGE, ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) }), [page, activeSearch, status]);
  const reload = useCallback(() => dispatch(fetchDeployments(params())), [dispatch, params]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { dispatch(fetchDeploymentStats()); }, [dispatch]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (location.state?.deployEmployeeId) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    deploymentService.lookups()
      .then((res) => {
        const d = res.data?.data;
        if (!cancelled) setLookups({ loading: false, error: '', locations: d.locations, projects: d.projects });
      })
      .catch((err) => { if (!cancelled) setLookups({ loading: false, error: apiError(err, 'Sites and projects could not be loaded'), locations: [], projects: [] }); });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleSave = async (body, activateNow) => {
    if (drawer?.deployment) {
      const result = await dispatch(updateDeployment({ id: drawer.deployment._id, data: body }));
      if (updateDeployment.fulfilled.match(result)) {
        showToast('Deployment updated successfully', 'success');
        setDrawer(null);
        reload();
        return undefined;
      }
      return failureOf(result.payload);
    }
    const result = await dispatch(createDeployment(body));
    if (!createDeployment.fulfilled.match(result)) return failureOf(result.payload);
    let message = 'Employee successfully deployed';
    if (activateNow) {
      const activated = await dispatch(setDeploymentStatus({ id: result.payload._id, status: 'active' }));
      if (!setDeploymentStatus.fulfilled.match(activated)) message = `Deployment ${result.payload.deploymentId} was created but could not be activated: ${activated.payload?.message || 'try again from the list'}`;
    }
    showToast(message, message.startsWith('Deployment') ? 'info' : 'success');
    setDrawer(null);
    setPage(1);
    reload();
    dispatch(fetchDeploymentStats());
    return undefined;
  };

  const handleStatusChange = async (dep, newStatus) => {
    const result = await dispatch(setDeploymentStatus({ id: dep._id, status: newStatus }));
    if (setDeploymentStatus.fulfilled.match(result)) {
      showToast(`Deployment ${dep.deploymentId} is now ${STATUS_STYLES[newStatus]?.label || newStatus}`, 'success');
      reload();
      dispatch(fetchDeploymentStats());
    } else {
      showToast(result.payload?.message || 'Status update failed', 'error');
    }
  };

  const handleDownloadReport = async (dep) => {
    try {
      const res = await deploymentService.reportPdf(dep._id);
      saveBlob(res.data, `${dep.deploymentId}-report.pdf`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Report not available'), 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await deploymentService.exportList({ format: 'csv', ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) });
      saveBlob(res.data, 'deployments.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const getRowActions = (dep) => {
    const next = ALLOWED_TRANSITIONS[dep.status] || [];
    const acts = [];
    if (canUpdate && dep.status !== 'completed') acts.push({ label: 'Edit Deployment', icon: 'edit', action: 'edit' });
    if (canUpdate && next.includes('on_hold')) acts.push({ label: 'Put on Hold', icon: 'hold', action: 'hold' });
    if (canUpdate && next.includes('active')) acts.push({ label: 'Mark as Active', icon: 'active', action: 'activate' });
    if (canUpdate && next.includes('completed')) acts.push({ label: 'Complete Deployment', icon: 'complete', action: 'complete' });
    if (dep.status === 'completed') acts.push({ label: 'Download Report', icon: 'download', action: 'download' });
    return acts;
  };

  const handleRowAction = (action, row) => {
    if (action === 'edit') setDrawer({ deployment: row });
    if (action === 'hold') handleStatusChange(row, 'on_hold');
    if (action === 'activate') handleStatusChange(row, 'active');
    if (action === 'complete') handleStatusChange(row, 'completed');
    if (action === 'download') handleDownloadReport(row);
  };

  const viewRecord = records.find((r) => r._id === viewId);

  const columns = [
    { key: 'deploymentId', label: 'DEPLOYMENT ID', nowrap: true, render: (v) => <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{fullName(v)}</span> },
    { key: 'role', label: 'ROLE', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'projectRef', label: 'PROJECT', render: (v) => <span style={{ color: '#475569' }}>{v || '—'}</span> },
    { key: 'siteId', label: 'SITE', render: (v) => <span style={{ color: '#475569' }}>{siteName(v)}</span> },
    { key: 'startDate', label: 'START DATE', nowrap: true, render: (v) => <span style={{ color: '#475569' }}>{formatDate(v)}</span> },
    { key: 'deploymentType', label: 'DEPLOYMENT TYPE', render: (v) => <span style={{ color: TYPE_COLORS[v] || '#1D4ED8', fontWeight: 600, fontSize: '0.78rem' }}>{DEPLOYMENT_TYPES.find((t) => t.value === v)?.label || titleCase(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <button className="icon-btn" onClick={() => setViewId(row._id)} title="View"><FiEye size={15} /></button>
          <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RowActionsMenu actions={getRowActions(row)} onAction={(action) => handleRowAction(action, row)} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Deployment</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>Track and manage employee assignments across projects and locations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total deployed employees" value={statsLoading && !stats.length ? '…' : (statMap.deployed_employees ?? 0)} sub="Active workforce on projects" icon={FiUsers} iconBg="#EFF6FF" iconColor="#2563EB" />
        <StatCard label="Active deployments" value={statsLoading && !stats.length ? '…' : (statMap.active ?? 0)} sub="Currently working on assigned projects" icon={FiActivity} iconBg="#F0FDF4" iconColor="#16A34A" />
        <StatCard label="Pending deployment" value={statsLoading && !stats.length ? '…' : (statMap.pending ?? 0)} sub="Awaiting mobilisation or site assignment" icon={FiClock} iconBg="#FFF7ED" iconColor="#EA580C" />
        <StatCard label="Utilisation rate" value={statsLoading && !stats.length ? '…' : `${statMap.utilisation_rate ?? 0}%`} sub="Percentage of workforce actively deployed" icon={FiBarChart2} iconBg="#F5F3FF" iconColor="#7C3AED" />
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search deployment id, name, project…" style={{ paddingLeft: 36, width: '100%' }} />
            <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{status ? ' (1)' : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canCreate && (
              <button className="btn btn-secondary" onClick={() => setImportOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Upload <FiUpload size={14} />
              </button>
            )}
            {canCreate && (
              <button onClick={() => setDrawer({ deployment: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.875rem' }}>
                <FiPlus size={14} /> Deploy Employee
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError}</div>
            <button className="btn btn-secondary" onClick={reload}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>)}</tr>
            ))}</tbody>
          </table>
        ) : (
          <DataTable columns={columns} data={records} selectable selectedIds={selectedIds} keyField="_id"
            onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            emptyMessage={activeSearch || status ? 'No deployments match your search or filter.' : 'No deployment records yet.'} />
        )}
        {meta?.totalPages > 1 && <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />}
      </div>

      {viewRecord && (
        <ViewDeploymentDrawer deployment={viewRecord} canUpdate={canUpdate} onClose={() => setViewId(null)}
          onEdit={(dep) => { setViewId(null); setDrawer({ deployment: dep }); }}
          onStatusChange={handleStatusChange}
          onDownloadReport={handleDownloadReport} />
      )}

      {drawer && (
        <DeployDrawer key={drawer.deployment?._id || 'new'} editDeployment={drawer.deployment} presetEmployeeId={drawer.deployment ? '' : presetEmployeeId}
          lookups={lookups} onClose={() => setDrawer(null)} onSave={handleSave} />
      )}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={status} onApply={(v) => { setPage(1); setStatus(v); }} />}
      {importOpen && (
        <ImportDialog entity="deployments" title="Upload deployments" description="Deploy many employees to projects and sites from a CSV or Excel file"
          onClose={() => setImportOpen(false)}
          onImported={(report) => { showToast(`${report.created} deployment(s) imported`, 'success'); setPage(1); reload(); dispatch(fetchDeploymentStats()); }} />
      )}
    </div>
  );
}
