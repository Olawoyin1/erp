import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiUpload,
  FiEye, FiMoreVertical, FiCheck, FiEdit2,
  FiPauseCircle, FiPlayCircle, FiUsers, FiActivity,
  FiClock, FiBarChart2, FiFileText,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchDeployments, fetchDeploymentStats,
  createDeployment, updateDeployment, setDeploymentStatus,
  fetchDeploymentReport,
  ALLOWED_TRANSITIONS, STATUS_STYLES,
} from '../../../store/hr/deploymentSlice';

const ROWS_PER_PAGE = 10;

// ─── Static options ───────────────────────────────────────────────────────────
const DEPLOYMENT_TYPES_OPTIONS = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'rotation',   label: 'Rotation' },
  { value: 'temporary',  label: 'Temporary' },
];

const TYPE_COLORS = {
  full_time:  '#1D4ED8',
  rotation:   '#7C3AED',
  temporary:  '#0891B2',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getName(f) {
  if (!f) return '—';
  return typeof f === 'string' ? f : f.fullName || f.name || '—';
}

function getSite(f) {
  if (!f) return '—';
  return typeof f === 'string' ? f : f.name || f.location || '—';
}

function capitalize(s) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const key = status?.toLowerCase().replace(/ /g, '_') || '';
  const s = STATUS_STYLES[key] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: capitalize(status) };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label || capitalize(status)}
    </span>
  );
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────
function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flex: 1 }}>
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

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
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
        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 34, zIndex: 1200, backgroundColor: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', minWidth: 190, padding: 6 }}>
          {actions.map((act) => (
            <button key={act.action} type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 6, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, color: '#1E293B', fontFamily: 'var(--font)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {act.icon === 'edit'     && <FiEdit2 size={14} />}
              {act.icon === 'hold'     && <FiPauseCircle size={14} />}
              {act.icon === 'active'   && <FiPlayCircle size={14} />}
              {act.icon === 'complete' && <FiCheck size={14} />}
              {act.icon === 'download' && <FiDownload size={14} />}
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View Deployment Drawer ───────────────────────────────────────────────────
function ViewDeploymentDrawer({ deployment, onClose, onEdit, onStatusChange, onDownloadReport }) {
  if (!deployment) return null;
  const status = deployment.status;
  const next   = ALLOWED_TRANSITIONS[status] || [];

  return (
    <Drawer isOpen={!!deployment} onClose={onClose} title={getName(deployment.employeeId)} subtitle={`${deployment.deploymentId} · ${getSite(deployment.siteId)}`} width="500px">
      {/* Status + Action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <StatusPill status={status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {next.includes('active') && (
            <button onClick={() => onStatusChange(deployment, 'active')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#16A34A', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiPlayCircle size={13} /> {status === 'pending' ? 'Activate' : 'Resume'}
            </button>
          )}
          {next.includes('on_hold') && (
            <button onClick={() => onStatusChange(deployment, 'on_hold')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#CA8A04', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiPauseCircle size={13} /> Put on Hold
            </button>
          )}
          {next.includes('completed') && (
            <button onClick={() => onStatusChange(deployment, 'completed')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiCheck size={13} /> Complete
            </button>
          )}
          {status === 'completed' && (
            <button onClick={() => onDownloadReport(deployment._id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiFileText size={13} /> Report
            </button>
          )}
          {status !== 'completed' && (
            <button onClick={() => onEdit(deployment)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              <FiEdit2 size={13} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <InfoItem label="EMPLOYEE"        value={getName(deployment.employeeId)} />
        <InfoItem label="EMPLOYEE ID"     value={deployment.employeeId?.employeeId || '—'} />
        <InfoItem label="DEPLOYMENT ID"   value={deployment.deploymentId} />
        <InfoItem label="DEPARTMENT"      value={deployment.employeeId?.departmentId ? (typeof deployment.employeeId.departmentId === 'object' ? deployment.employeeId.departmentId.name : deployment.employeeId.departmentId) : '—'} />
        <InfoItem label="PROJECT"         value={deployment.projectRef} />
        <InfoItem label="ROLE"            value={deployment.role} />
        <InfoItem label="SITE"            value={getSite(deployment.siteId)} />
        <InfoItem label="DEPLOYMENT TYPE" value={capitalize(deployment.deploymentType)} />
        <InfoItem label="START DATE"      value={fmtDate(deployment.startDate)} />
        <InfoItem label="EXPECTED END"    value={fmtDate(deployment.expectedEndDate)} />
        <InfoItem label="SUPERVISOR"      value={deployment.supervisorRef || '—'} />
        <InfoItem label="STATUS"          value={STATUS_STYLES[deployment.status]?.label || capitalize(deployment.status)} />
      </div>

      {deployment.notes && (
        <div style={{ marginTop: 20, padding: 14, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>DEPLOYMENT NOTES</div>
          <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{deployment.notes}</p>
        </div>
      )}
    </Drawer>
  );
}

// ─── Deploy / Edit Drawer ─────────────────────────────────────────────────────
function DeployDrawer({ isOpen, onClose, onSave, editDeployment, saving }) {
  const isEdit = !!editDeployment;
  const blankForm = { employeeId: '', projectRef: '', role: '', deploymentType: 'full_time', startDate: '', expectedEndDate: '', supervisorRef: '', notes: '' };
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    if (editDeployment) {
      setForm({
        employeeId:    editDeployment.employeeId?._id || editDeployment.employeeId || '',
        projectRef:    editDeployment.projectRef || '',
        role:          editDeployment.role || '',
        deploymentType: editDeployment.deploymentType || 'full_time',
        startDate:     editDeployment.startDate ? editDeployment.startDate.split('T')[0] : '',
        expectedEndDate: editDeployment.expectedEndDate ? editDeployment.expectedEndDate.split('T')[0] : '',
        supervisorRef: editDeployment.supervisorRef || '',
        notes:         editDeployment.notes || '',
      });
    } else {
      setForm(blankForm);
    }
  }, [editDeployment, isOpen]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  const footer = (
    <>
      <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '9px 16px' }}>Cancel</button>
      <button onClick={() => onSave(form)} disabled={saving}
        style={{ flex: 1, padding: '9px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'var(--font)', fontSize: '0.875rem' }}>
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Confirm Mobilisation'}
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Deployment' : 'Deploy Employee for Project'} subtitle={isEdit ? 'Update deployment record details' : 'Assign an employee to a project or site'} width="520px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Employee ID (MongoDB _id)" required>
          <Input value={form.employeeId} onChange={set('employeeId')} placeholder="65f1a2b3c4d5e6f7a8b9c0d5" />
        </FormField>
        <FormField label="Project Reference" required>
          <Input value={form.projectRef} onChange={set('projectRef')} placeholder="e.g. Lekki Phase 2 Expansion" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Role" required>
            <Input value={form.role} onChange={set('role')} placeholder="e.g. Site Engineer" />
          </FormField>
          <FormField label="Deployment Type" required>
            <Select value={form.deploymentType} onChange={set('deploymentType')} options={DEPLOYMENT_TYPES_OPTIONS} />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Start Date">
            <DatePicker value={form.startDate} onChange={set('startDate')} />
          </FormField>
          <FormField label="Expected End Date">
            <DatePicker value={form.expectedEndDate} onChange={set('expectedEndDate')} />
          </FormField>
        </div>
        <FormField label="Supervisor Reference">
          <Input value={form.supervisorRef} onChange={set('supervisorRef')} placeholder="e.g. Engr. Kola Williams" />
        </FormField>
        <FormField label="Deployment Notes">
          <Textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes or instructions..." rows={3} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Main Deployment Page ─────────────────────────────────────────────────────
export default function Deployment() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { records, meta, stats, statsLoading, loading } = useSelector((s) => s.deployments);

  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewRecord, setViewRecord]   = useState(null);
  const [editRecord, setEditRecord]   = useState(null);
  const [createOpen, setCreateOpen]   = useState(false);
  const [saving, setSaving]           = useState(false);

  const load = useCallback(() => {
    dispatch(fetchDeployments({ page, limit: ROWS_PER_PAGE, ...(search ? { q: search } : {}) }));
  }, [dispatch, page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { dispatch(fetchDeploymentStats()); }, [dispatch]);

  // ─── Stat card values from API ─────────────────────────────────────────────
  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const totalDeployed = (statMap.active ?? 0) + (statMap.pending ?? 0) + (statMap.on_hold ?? 0);
  const utilisationRate = totalDeployed > 0 ? Math.round(((statMap.active ?? 0) / totalDeployed) * 100) : 0;

  // ─── Create / Update ────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    const payload = {
      employeeId:     form.employeeId,
      projectRef:     form.projectRef,
      role:           form.role,
      deploymentType: form.deploymentType,
      ...(form.startDate       && { startDate: form.startDate }),
      ...(form.expectedEndDate && { expectedEndDate: form.expectedEndDate }),
      ...(form.supervisorRef   && { supervisorRef: form.supervisorRef }),
      ...(form.notes           && { notes: form.notes }),
    };

    if (editRecord) {
      const { employeeId: _emp, ...patchPayload } = payload; // employeeId not patchable
      const result = await dispatch(updateDeployment({ id: editRecord._id, ...patchPayload }));
      if (result.meta.requestStatus === 'fulfilled') { showToast('Deployment updated successfully', 'success'); setEditRecord(null); }
      else showToast(result.payload || 'Update failed', 'error');
    } else {
      const result = await dispatch(createDeployment(payload));
      if (result.meta.requestStatus === 'fulfilled') { showToast('Employee deployed successfully', 'success'); setCreateOpen(false); dispatch(fetchDeploymentStats()); }
      else showToast(result.payload || 'Deployment failed', 'error');
    }
    setSaving(false);
  };

  // ─── Status change ──────────────────────────────────────────────────────────
  const handleStatusChange = async (dep, newStatus) => {
    const result = await dispatch(setDeploymentStatus({ id: dep._id, status: newStatus }));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast(`Deployment ${STATUS_STYLES[newStatus]?.label || newStatus}`, 'success');
      setViewRecord(null);
      dispatch(fetchDeploymentStats());
    } else {
      showToast(result.payload || 'Status update failed', 'error');
    }
  };

  // ─── Download report ────────────────────────────────────────────────────────
  const handleDownloadReport = async (id) => {
    const result = await dispatch(fetchDeploymentReport(id));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Deployment report fetched — download would open here', 'info');
    } else {
      showToast(result.payload || 'Report not available', 'error');
    }
  };

  // ─── Row actions ─────────────────────────────────────────────────────────────
  const getRowActions = (dep) => {
    const next = ALLOWED_TRANSITIONS[dep.status] || [];
    const acts = [];
    if (dep.status !== 'completed') acts.push({ label: 'Edit Deployment', icon: 'edit', action: 'edit' });
    if (next.includes('on_hold'))   acts.push({ label: 'Put on Hold',          icon: 'hold',     action: 'hold' });
    if (next.includes('active'))    acts.push({ label: dep.status === 'pending' ? 'Activate' : 'Resume', icon: 'active', action: 'activate' });
    if (next.includes('completed')) acts.push({ label: 'Complete Deployment',  icon: 'complete', action: 'complete' });
    if (dep.status === 'completed') acts.push({ label: 'Download Report',      icon: 'download', action: 'download' });
    return acts;
  };

  const handleRowAction = (action, row) => {
    if (action === 'edit')     { setViewRecord(null); setEditRecord(row); }
    if (action === 'hold')     handleStatusChange(row, 'on_hold');
    if (action === 'activate') handleStatusChange(row, 'active');
    if (action === 'complete') handleStatusChange(row, 'completed');
    if (action === 'download') handleDownloadReport(row._id);
  };

  // ─── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    { key: 'deploymentId', label: 'DEPLOYMENT ID', nowrap: true, render: (v) => <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{getName(v)}</span> },
    { key: 'role', label: 'ROLE', render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'projectRef', label: 'PROJECT', render: (v) => <span style={{ color: '#475569' }}>{v || '—'}</span> },
    { key: 'siteId', label: 'SITE', render: (v) => <span style={{ color: '#475569' }}>{getSite(v)}</span> },
    { key: 'startDate', label: 'START DATE', nowrap: true, render: (v) => <span style={{ color: '#475569' }}>{fmtDate(v)}</span> },
    { key: 'deploymentType', label: 'TYPE', render: (v) => <span style={{ color: TYPE_COLORS[v] || '#1D4ED8', fontWeight: 600, fontSize: '0.78rem' }}>{capitalize(v)}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => {
        const rowActions = getRowActions(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <button onClick={() => setViewRecord(row)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <FiEye size={15} />
            </button>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowActions.length > 0 && <RowActionsMenu actions={rowActions} onAction={(action) => handleRowAction(action, row)} />}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Deployment</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 2, margin: 0 }}>Track and manage employee assignments across projects and locations</p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Total Deployed" value={statsLoading ? '…' : totalDeployed} sub="Active + Pending + On Hold" icon={FiUsers} iconBg="#EFF6FF" iconColor="#2563EB" />
        <StatCard label="Active Deployments" value={statsLoading ? '…' : (statMap.active ?? '—')} sub="Currently working on projects" icon={FiActivity} iconBg="#F0FDF4" iconColor="#16A34A" />
        <StatCard label="Pending Deployment" value={statsLoading ? '…' : (statMap.pending ?? '—')} sub="Awaiting mobilisation" icon={FiClock} iconBg="#FFF7ED" iconColor="#EA580C" />
        <StatCard label="Utilisation Rate" value={statsLoading ? '…' : `${utilisationRate}%`} sub="Active ÷ all non-completed" icon={FiBarChart2} iconBg="#F5F3FF" iconColor="#7C3AED" />
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search deployment ID, name, project..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }} />
            <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
            <button onClick={() => setCreateOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.875rem' }}>
              <FiPlus size={14} /> Deploy Employee
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading deployments…</div>
        ) : (
          <DataTable columns={columns} data={records} selectable selectedIds={selectedIds} keyField="_id"
            onSelectRow={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            emptyMessage="No deployment records found." />
        )}
        <Pagination currentPage={page} totalPages={meta?.totalPages || 1} onPageChange={setPage} />
      </div>

      {/* View Drawer */}
      {viewRecord && (
        <ViewDeploymentDrawer
          deployment={records.find((r) => r._id === viewRecord._id) || viewRecord}
          onClose={() => setViewRecord(null)}
          onEdit={(dep) => { setViewRecord(null); setEditRecord(dep); }}
          onStatusChange={handleStatusChange}
          onDownloadReport={handleDownloadReport}
        />
      )}

      {/* Create / Edit Drawer */}
      <DeployDrawer
        isOpen={createOpen || !!editRecord}
        onClose={() => { setCreateOpen(false); setEditRecord(null); }}
        onSave={handleSave}
        editDeployment={editRecord}
        saving={saving}
      />
    </div>
  );
}
