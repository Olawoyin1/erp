import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiUpload,
  FiEye, FiMoreVertical, FiCheck, FiX, FiEdit2,
  FiPauseCircle, FiPlayCircle, FiUsers, FiActivity,
  FiClock, FiBarChart2, FiUser, FiFileText,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  mockDeployments,
  getDeploymentStats,
  DEPLOYMENT_STATUSES,
  DEPLOYMENT_TYPES,
  PROJECT_LOCATIONS,
  EMPLOYEES,
} from '../../../data/mockDeployment';

const ROWS_PER_PAGE = 10;

// ─── Status & Type colour maps ────────────────────────────────────────────────
const STATUS_STYLES = {
  Active:    { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Pending:   { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  Completed: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  'On Hold': { bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
};

const TYPE_COLORS = {
  'Full-Time': '#1D4ED8',
  Rotation:    '#7C3AED',
  Temporary:   '#0891B2',
  Contract:    '#059669',
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: 600,
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0',
      padding: '18px 20px', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: '12px', flex: '1',
    }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>{sub}</div>}
      </div>
      <div style={{
        width: '38px', height: '38px', borderRadius: '10px',
        backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
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
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!actions || actions.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Actions"
      >
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '34px', zIndex: 1200,
          backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
          minWidth: '190px', padding: '6px', animation: 'slideInUp 0.15s ease',
        }}>
          {actions.map((act) => (
            <button
              key={act.action}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 500,
                color: act.danger ? '#DC2626' : '#1E293B',
                fontFamily: 'var(--font)', textAlign: 'left', transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = act.danger ? '#FEF2F2' : '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
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
function ViewDeploymentDrawer({ deployment, onClose, onEdit }) {
  if (!deployment) return null;

  return (
    <Drawer isOpen={!!deployment} onClose={onClose} title={deployment.employee} subtitle={`${deployment.id} • ${deployment.department}`} width="500px">
      {/* Status + Action buttons row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
          <StatusPill status={deployment.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {deployment.status === 'Pending' && (
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                borderRadius: '6px', border: 'none', backgroundColor: '#16A34A',
                color: '#fff', cursor: 'pointer'
              }}
            >
              <FiCheck size={13} /> Approve
            </button>
          )}
          <button
            onClick={() => onEdit(deployment)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
              borderRadius: '6px', border: '1px solid #E2E8F0',
              backgroundColor: '#fff', color: '#334155', cursor: 'pointer'
            }}
          >
            <FiEdit2 size={13} /> Edit Deployment
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <InfoItem label="EMPLOYEE" value={deployment.employee} />
        <InfoItem label="EMPLOYEE ID" value={deployment.employeeId} />
        <InfoItem label="DEPLOYMENT ID" value={deployment.id} />
        <InfoItem label="DEPARTMENT" value={deployment.department} />
        <InfoItem label="PROJECT" value={deployment.project} />
        <InfoItem label="ROLE" value={deployment.role} />
        <InfoItem label="SITE" value={deployment.site} />
        <InfoItem label="DEPLOYMENT TYPE" value={deployment.deploymentType?.toUpperCase()} />
        <InfoItem label="START DATE" value={deployment.startDate} />
        <InfoItem label="EXPECTED END DATE" value={deployment.expectedEndDate} />
        <InfoItem label="SUPERVISOR" value={deployment.supervisor} />
        <InfoItem label="STATUS" value={deployment.status} />
      </div>

      {/* Deployment Notes */}
      {deployment.deploymentNotes && (
        <div style={{ marginTop: '20px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>DEPLOYMENT NOTES</div>
          <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{deployment.deploymentNotes}</p>
        </div>
      )}
    </Drawer>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

// ─── Deploy / Edit Drawer ──────────────────────────────────────────────────────
function DeployModal({ isOpen, onClose, onSave, editDeployment }) {
  const isEdit = !!editDeployment;
  const initialForm = {
    employeeId: '', projectLocation: '', assignedProjectRole: '',
    startDate: '', deploymentType: 'Full-Time', status: 'Active', notes: '',
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (editDeployment) {
      setForm({
        employeeId: editDeployment.employeeId || '',
        projectLocation: editDeployment.projectLocation || '',
        assignedProjectRole: editDeployment.role || '',
        startDate: editDeployment.startDate || '',
        deploymentType: editDeployment.deploymentType || 'Full-Time',
        status: editDeployment.status || 'Active',
        notes: editDeployment.deploymentNotes || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [editDeployment, isOpen]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  const employeeOptions = EMPLOYEES.map(e => ({ value: e.id, label: `${e.name} (${e.role})` }));

  const footer = (
    <>
      <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, padding: '9px 16px' }}>Cancel</button>
      <button onClick={() => onSave(form)} className="btn btn-primary" style={{ flex: 1, padding: '9px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
        {isEdit ? 'Save Changes' : 'Confirm Mobilisation'}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Deployment' : 'Deploy Employee for Project'}
      subtitle={isEdit ? 'Update deployment record details' : 'Assign an employee to a project or site'}
      width="520px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="Select Employee" required>
          <Select
            value={form.employeeId}
            onChange={set('employeeId')}
            options={employeeOptions}
            placeholder="Select employee..."
            searchable
          />
        </FormField>

        <FormField label="Project Location" required>
          <Select
            value={form.projectLocation}
            onChange={set('projectLocation')}
            options={PROJECT_LOCATIONS}
            placeholder="Select location..."
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Assigned Project Role" required>
            <Input value={form.assignedProjectRole} onChange={set('assignedProjectRole')} />
          </FormField>
          <FormField label="Deployment Start Date">
            <DatePicker value={form.startDate} onChange={set('startDate')} placeholder="DD/MM/YY" />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Deployment Type" required>
            <Select
              value={form.deploymentType}
              onChange={set('deploymentType')}
              options={DEPLOYMENT_TYPES}
              placeholder="Full-Time"
            />
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status}
              onChange={set('status')}
              options={DEPLOYMENT_STATUSES}
              placeholder="Active"
            />
          </FormField>
        </div>

        <FormField label="Deployment Notes">
          <Textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder=""
            rows={4}
          />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', borderRadius: '7px', border: 'none',
  backgroundColor: '#1D4ED8', color: '#FFFFFF',
  fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font)',
};
const btnCancel = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', borderRadius: '7px',
  border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF',
  color: '#64748B', fontSize: '0.84rem', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font)',
};

// ─── Main Deployment Page ─────────────────────────────────────────────────────
export default function Deployment() {
  const [deployments, setDeployments] = useState(mockDeployments);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewDeployment, setViewDeployment] = useState(null);
  const [editDeployment, setEditDeployment] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const stats = getDeploymentStats(deployments);

  const filtered = useMemo(() =>
    deployments.filter((d) =>
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.employee.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase()) ||
      d.site.toLowerCase().includes(search.toLowerCase())
    ), [deployments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const getRowActions = (dep) => {
    const acts = [];
    if (dep.status !== 'Completed') acts.push({ label: 'Edit Deployment', icon: 'edit', action: 'edit' });
    if (dep.status === 'Active')    acts.push({ label: 'Put on Hold',       icon: 'hold',   action: 'hold' });
    if (dep.status === 'On Hold')   acts.push({ label: 'Mark as Active',    icon: 'active', action: 'activate' });
    if (dep.status === 'Completed') acts.push({ label: 'Download Report',   icon: 'download', action: 'download' });
    if (['Active', 'Pending'].includes(dep.status)) acts.push({ label: 'Complete Deployment', icon: 'complete', action: 'complete' });
    return acts;
  };

  const handleAction = (action, dep) => {
    if (action === 'edit') { setViewDeployment(null); setEditDeployment(dep); }
    else if (action === 'hold') {
      setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'On Hold' } : d));
      showToast(`${dep.employee} deployment put on hold`);
    } else if (action === 'activate') {
      setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'Active' } : d));
      showToast(`${dep.employee} deployment marked as Active`, 'success');
    } else if (action === 'complete') {
      setDeployments(prev => prev.map(d => d.id === dep.id ? { ...d, status: 'Completed' } : d));
      showToast(`${dep.employee} deployment completed`);
    } else if (action === 'download') {
      showToast('Deployment report download started', 'info');
    }
  };

  const columns = [
    { key: 'id', label: 'Deployment ID', nowrap: true, cellStyle: { fontSize: '0.78rem' } },
    {
      key: 'employee', label: 'Employee',
      render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span>,
    },
    {
      key: 'role', label: 'Role',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>,
    },
    { key: 'project', label: 'Project' },
    { key: 'site', label: 'Site' },
    { key: 'startDate', label: 'Start Date', nowrap: true },
    {
      key: 'deploymentType', label: 'Deployment Type',
      render: (v) => <span style={{ color: TYPE_COLORS[v] || '#1D4ED8', fontWeight: 600 }}>{v}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusPill status={v} />,
    },
    {
      key: 'actions', label: 'Actions', align: 'center',
      headerStyle: { textAlign: 'center' },
      render: (_, row) => {
        const rowActions = getRowActions(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            {/* Eye icon */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setViewDeployment(row); }}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="View"
            >
              <FiEye size={15} />
            </button>
            {/* Reserved space for 3-dot */}
            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowActions.length > 0 && (
                <RowActionsMenu
                  actions={rowActions}
                  onAction={(action) => handleAction(action, row)}
                />
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Deployment</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track and manage employee assignments across projects and locations
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          label="Total Deployed Employees"
          value={stats.total}
          sub="Active workforce on projects"
          icon={FiUsers}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
        <StatCard
          label="Active Deployments"
          value={stats.active}
          sub="Currently working on assigned projects"
          icon={FiActivity}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <StatCard
          label="Pending Deployment"
          value={stats.pending}
          sub="Awaiting mobilisation or site assignment"
          icon={FiClock}
          iconBg="#FFF7ED"
          iconColor="#EA580C"
        />
        <StatCard
          label="Utilisation Rate"
          value={`${stats.utilisationRate}%`}
          sub="Percentage of workforce actively deployed"
          icon={FiBarChart2}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
        />
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search deployment id, name, project..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }}
            />
            <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiDownload size={14} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowDeployModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none' }}
            >
              <FiPlus size={14} /> Deploy Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          keyField="id"
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          onSelectAll={() => {
            const allIds = paginated.map(r => r.id);
            setSelectedIds(prev => allIds.every(id => prev.includes(id)) ? prev.filter(id => !allIds.includes(id)) : [...new Set([...prev, ...allIds])]);
          }}
          emptyMessage="No deployment records found."
        />

        {/* Pagination */}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* View Deployment Drawer */}
      {viewDeployment && (
        <ViewDeploymentDrawer
          deployment={deployments.find(d => d.id === viewDeployment.id) || viewDeployment}
          onClose={() => setViewDeployment(null)}
          onEdit={(dep) => { setViewDeployment(null); setEditDeployment(dep); }}
        />
      )}

      {/* Deploy / Edit Modal */}
      <DeployModal
        isOpen={showDeployModal || !!editDeployment}
        onClose={() => { setShowDeployModal(false); setEditDeployment(null); }}
        editDeployment={editDeployment}
        onSave={(form) => {
          const emp = EMPLOYEES.find(e => e.id === form.employeeId);
          if (editDeployment) {
            setDeployments(prev => prev.map(d =>
              d.id === editDeployment.id
                ? { ...d, employeeId: form.employeeId, employee: emp?.name || d.employee, role: form.assignedProjectRole || d.role, projectLocation: form.projectLocation, startDate: form.startDate || d.startDate, deploymentType: form.deploymentType, status: form.status, deploymentNotes: form.notes }
                : d
            ));
            showToast('Deployment updated successfully');
          } else {
            const newId = `PGSL-DEP-${String(deployments.length + 1).padStart(3, '0')}`;
            setDeployments(prev => [{
              id: newId,
              employeeId: form.employeeId,
              employee: emp?.name || 'Unknown',
              role: form.assignedProjectRole,
              project: form.projectLocation,
              site: form.projectLocation,
              startDate: form.startDate,
              expectedEndDate: '',
              deploymentType: form.deploymentType,
              status: form.status,
              department: '',
              supervisor: '',
              deploymentNotes: form.notes,
              projectLocation: form.projectLocation,
            }, ...prev]);
            showToast('Employee successfully deployed');
          }
          setShowDeployModal(false);
          setEditDeployment(null);
        }}
      />
    </div>
  );
}
