import React, { useState, useRef, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import Toast, { useToast } from '../../components/ui/Toast';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiMoreVertical,
  FiEdit2,
  FiEye,
  FiTrash2,
  FiShield,
} from 'react-icons/fi';

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  'System-Wide', 'Cross-department', 'Human Resources', 'Finance & Accounts',
  'Accounts & Finance', 'Business Development', 'Administration', 'Technical',
  'HSE', 'Quality System', 'Procurement',
];

const MODULES = [
  { id: 'administration', label: 'Administration' },
  { id: 'hr',            label: 'Human Resources' },
  { id: 'finance',       label: 'Accounts & Finance' },
  { id: 'bizdev',        label: 'Business Development' },
  { id: 'procurement',   label: 'Procurement' },
  { id: 'quality',       label: 'Quality System' },
  { id: 'hse',           label: 'HSE' },
  { id: 'technical',     label: 'Technical' },
];

const PERMISSION_KEYS = ['view', 'create', 'approve', 'configure'];
const PERMISSION_LABELS = { view: 'View', create: 'Create', approve: 'Approve', configure: 'Configure' };

function emptyPermissions() {
  const p = {};
  MODULES.forEach((m) => { p[m.id] = { view: false, create: false, approve: false, configure: false }; });
  return p;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const AUDIT_LOGS = [
  { date: '27 Aug 2026, 3:45 PM', action: 'Role Created', by: 'Super Admin' },
  { date: '27 Aug 2026, 3:45 PM', action: 'Permissions Edited', by: 'Super Admin' },
];

const mockRoles = [
  {
    id: 'ROL-001', role: 'Super Admin', department: 'System-wide',
    description: 'Full access to all modules and system configuration',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Adaeze Chukwu', email: 'a.chukwu@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); MODULES.forEach((m) => { Object.keys(p[m.id]).forEach((k) => { p[m.id][k] = true; }); }); return p; })(),
  },
  {
    id: 'ROL-002', role: 'MD/CEO', department: 'Cross-department',
    description: 'Final approver for high-value Fund Requests and top-level executive decisions',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Chioma Davids', email: 'chioma.davids@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); MODULES.forEach((m) => { p[m.id].view = true; p[m.id].approve = true; }); return p; })(),
  },
  {
    id: 'ROL-003', role: 'HR — HOD', department: 'Human Resources',
    description: 'Approves HR requests, manages recruitment, training, and attendance records',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Grace Mensah', email: 'grace.mensah@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); p['hr'].view = true; p['hr'].create = true; p['hr'].approve = true; return p; })(),
  },
  {
    id: 'ROL-004', role: 'HR — Staff', department: 'Human Resources',
    description: 'Submits requests, views HR documents and records',
    noOfUsers: 8,
    assignedUsers: Array.from({ length: 8 }, (_, i) => ({ name: `HR Staff ${i + 1}`, email: `hrstaff${i + 1}@pgsl.com`, status: 'Active' })),
    permissions: (() => { const p = emptyPermissions(); p['hr'].view = true; p['hr'].create = true; return p; })(),
  },
  {
    id: 'ROL-005', role: 'Finance — Line Manager', department: 'Accounts & Finance',
    description: 'First-level approver for Fund Requests within Threshold 1',
    noOfUsers: 2,
    assignedUsers: [{ name: 'Zainab Mohammed', email: 'zainab.m@pgsl.com', status: 'Active' }, { name: 'John Afolabi', email: 'john.a@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); p['finance'].view = true; p['finance'].approve = true; return p; })(),
  },
  {
    id: 'ROL-006', role: 'Finance — HOD', department: 'Accounts & Finance',
    description: 'Approves Fund Requests within Threshold 2, oversees Finance team operations',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Emmanuel Eze', email: 'emmanuel.e@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); p['finance'].view = true; p['finance'].create = true; p['finance'].approve = true; return p; })(),
  },
  {
    id: 'ROL-007', role: 'Finance — Manager/CFO', department: 'Accounts & Finance',
    description: 'Approves Fund Requests within Threshold 3, oversees financial reporting and closing',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Bello Adeleke', email: 'bello.a@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); p['finance'].view = true; p['finance'].create = true; p['finance'].approve = true; p['finance'].configure = true; return p; })(),
  },
  {
    id: 'ROL-008', role: 'Finance — Staff', department: 'Accounts & Finance',
    description: 'Submits Fund Requests, manages invoicing, AP/AR, and ledger entries',
    noOfUsers: 5,
    assignedUsers: Array.from({ length: 5 }, (_, i) => ({ name: `Finance Staff ${i + 1}`, email: `finstaff${i + 1}@pgsl.com`, status: 'Active' })),
    permissions: (() => { const p = emptyPermissions(); p['finance'].view = true; p['finance'].create = true; return p; })(),
  },
  {
    id: 'ROL-009', role: 'Technical Director', department: 'Technical',
    description: 'Approves resource allocation, project timelines, and technical decisions',
    noOfUsers: 1,
    assignedUsers: [{ name: 'Bamidele Olayiwola', email: 'bamidele.o@pgsl.com', status: 'Active' }],
    permissions: (() => { const p = emptyPermissions(); p['technical'].view = true; p['technical'].approve = true; return p; })(),
  },
  {
    id: 'ROL-010', role: 'Technical — Staff', department: 'Technical',
    description: 'Manages project tasks, site diaries, engineering documents, and site inspections',
    noOfUsers: 8,
    assignedUsers: Array.from({ length: 8 }, (_, i) => ({ name: `Tech Staff ${i + 1}`, email: `techstaff${i + 1}@pgsl.com`, status: 'Active' })),
    permissions: (() => { const p = emptyPermissions(); p['technical'].view = true; p['technical'].create = true; return p; })(),
  },
];

const ITEMS_PER_PAGE = 10;

// ─── Permission Matrix ────────────────────────────────────────────────────────
function PermissionMatrix({ permissions, onChange, readOnly = false }) {
  const togglePerm = (moduleId, permKey) => {
    if (readOnly) return;
    onChange({ ...permissions, [moduleId]: { ...permissions[moduleId], [permKey]: !permissions[moduleId]?.[permKey] } });
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px 90px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8' }}>Module</div>
        {PERMISSION_KEYS.map((k) => (
          <div key={k} style={{ padding: '8px 0', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8', textAlign: 'center' }}>{PERMISSION_LABELS[k]}</div>
        ))}
      </div>
      {MODULES.map((mod, idx) => (
        <div key={mod.id} style={{
          display: 'grid',
          gridTemplateColumns: '1fr 70px 70px 80px 90px',
          alignItems: 'center',
          borderBottom: idx === MODULES.length - 1 ? 'none' : '1px solid #F1F5F9',
          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
        }}>
          <div style={{ padding: '9px 14px', fontSize: '0.85rem', color: '#0F172A' }}>{mod.label}</div>
          {PERMISSION_KEYS.map((pKey) => (
            <div key={pKey} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!permissions[mod.id]?.[pKey]}
                onChange={() => togglePerm(mod.id, pKey)}
                disabled={readOnly}
                style={{ accentColor: '#1D4ED8', cursor: readOnly ? 'default' : 'pointer', width: 15, height: 15 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Add / Edit Role Drawer ───────────────────────────────────────────────────
function RoleFormDrawer({ isOpen, onClose, onSave, role }) {
  const isEditing = !!role;
  const [form, setForm] = useState({ role: '', department: 'Human Resources', description: '', permissions: emptyPermissions() });

  useEffect(() => {
    if (role) setForm({ role: role.role, department: role.department, description: role.description, permissions: JSON.parse(JSON.stringify(role.permissions)) });
    else setForm({ role: '', department: 'Human Resources', description: '', permissions: emptyPermissions() });
  }, [role, isOpen]);

  const handleChange = (e) => { const { name, value } = e.target; setForm((p) => ({ ...p, [name]: value })); };
  const handleSubmit = (e) => { e.preventDefault(); onSave(form); };

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      <button type="submit" form="role-form" style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
        {isEditing ? 'Save Changes' : 'Create Role'}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Role' : 'Add Role'}
      subtitle={isEditing ? 'Update role details and module permissions.' : 'Define a new role and set exactly what it can see and do across the ERP'}
      width="560px"
      footer={footer}
    >
      <form id="role-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Role ID" required>
            <Input value={role?.id || 'ROL-001'} readOnly style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Role" required>
            <Input name="role" value={form.role} onChange={handleChange} placeholder="HR — Staff" required />
          </FormField>
        </div>
        <FormField label="Department" required>
          <Select name="department" value={form.department} onChange={handleChange} options={DEPARTMENTS} />
        </FormField>
        <FormField label="Description" required>
          <Textarea name="description" value={form.description} onChange={handleChange} placeholder="Full access to all modules and system configuration" rows={3} required />
        </FormField>
        <FormField label="Module Access & Permissions" required>
          <PermissionMatrix permissions={form.permissions} onChange={(p) => setForm((prev) => ({ ...prev, permissions: p }))} />
        </FormField>
      </form>
    </Drawer>
  );
}

// ─── View Role Drawer ─────────────────────────────────────────────────────────
function ViewRoleDrawer({ isOpen, onClose, role, onEdit }) {
  const [tab, setTab] = useState('details');
  if (!role) return null;

  const tabStyle = (t) => ({
    padding: '10px 0',
    fontSize: '0.875rem',
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? '#1D4ED8' : '#64748B',
    border: 'none',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    marginBottom: -1,
    transition: 'color 0.15s ease',
  });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiShield size={20} color="#1D4ED8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{role.role}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>{role.id} · {role.department}</div>
          </div>
        </div>
      }
      width="540px"
    >
      {/* Edit button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
          <FiEdit2 size={13} /> Edit Role
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <button style={tabStyle('details')} onClick={() => setTab('details')}>Details</button>
        <button style={tabStyle('audit')} onClick={() => setTab('audit')}>Audit Trail</button>
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            {[
              ['ROL ID', role.id],
              ['Role', role.role],
              ['Department', role.department],
              ['Users Assigned', role.noOfUsers],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8' }}>{label}</span>
                <span style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8', marginBottom: 6 }}>Description</div>
            <div style={{ fontSize: '0.875rem', color: '#0F172A', fontStyle: 'italic' }}>{role.description}</div>
          </div>

          {/* Users assigned */}
          {role.assignedUsers?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94A3B8', marginBottom: 10 }}>Users Assigned To This Role</div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', backgroundColor: '#EFF6FF', padding: '8px 14px' }}>
                  {['Name', 'Calibrated by', 'Status'].map((h) => (
                    <span key={h} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8' }}>{h}</span>
                  ))}
                </div>
                {role.assignedUsers.slice(0, 5).map((u, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px', padding: '10px 14px', borderBottom: i === Math.min(role.assignedUsers.length, 5) - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.813rem' }}>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{u.name}</span>
                    <span style={{ color: '#64748B' }}>{u.email}</span>
                    <span style={{ color: '#16A34A', fontWeight: 500 }}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail Tab */}
      {tab === 'audit' && (
        <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 14px' }}>
            {['Date & Time', 'Action', 'Changed By'].map((h) => (
              <span key={h} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B' }}>{h}</span>
            ))}
          </div>
          {AUDIT_LOGS.map((log, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '12px 14px', borderBottom: i === AUDIT_LOGS.length - 1 ? 'none' : '1px solid #F1F5F9', fontSize: '0.813rem' }}>
              <span style={{ color: '#475569' }}>{log.date}</span>
              <span style={{ color: '#0F172A', fontWeight: 500 }}>{log.action}</span>
              <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{log.by}</span>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RoleRowMenu({ role, onView, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 100, width: 160 }}>
          <div onClick={() => { onEdit(); setOpen(false); }}
            style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiEdit2 size={13} /> Edit Role
          </div>
          <div onClick={() => { onDelete(); setOpen(false); }}
            style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiTrash2 size={13} /> Delete role
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RolesPermissions() {
  const { toast, showToast, hideToast } = useToast();
  const [roles, setRoles] = useState(mockRoles);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.id.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const handleSelectAll = () => selectedIds.length === paginated.length ? setSelectedIds([]) : setSelectedIds(paginated.map((r) => r.id));

  const handleSave = (form) => {
    if (editTarget) {
      setRoles((p) => p.map((r) => r.id === editTarget.id ? { ...r, ...form } : r));
      setEditTarget(null);
      showToast('Role updated successfully', 'success');
    } else {
      const newRole = {
        ...form,
        id: `ROL-${String(roles.length + 1).padStart(3, '0')}`,
        noOfUsers: 0,
        assignedUsers: [],
      };
      setRoles((p) => [...p, newRole]);
      setAddOpen(false);
      showToast('Role successfully created', 'success');
    }
  };

  const handleDelete = (role) => {
    setRoles((p) => p.filter((r) => r.id !== role.id));
    showToast(`Role "${role.role}" deleted`, 'error');
  };

  const columns = [
    {
      key: 'id', label: 'ROLE ID',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.813rem' }}>{val}</span>,
    },
    {
      key: 'role', label: 'ROLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>,
    },
    {
      key: 'department', label: 'DEPARTMENT',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'description', label: 'DESCRIPTION',
      render: (val) => (
        <span style={{ color: '#475569', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 340 }}>
          {val}
        </span>
      ),
    },
    {
      key: 'noOfUsers', label: 'NO OF USERS',
      render: (val) => <span style={{ fontWeight: 500, color: '#334155' }}>{val}</span>,
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <button className="icon-btn" onClick={() => setViewTarget(row)} title="View Role"><FiEye size={15} /></button>
          <RoleRowMenu
            role={row}
            onView={() => setViewTarget(row)}
            onEdit={() => setEditTarget(row)}
            onDelete={() => handleDelete(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Roles & Permissions</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Manage user roles and control access to ERP modules and actions
        </p>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search Role ID, Role..."
              style={{ paddingLeft: 36 }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiFilter size={14} /> Filter
          </button>
          <button className="btn btn-secondary" onClick={() => showToast('Exporting roles...', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            Export <FiDownload size={14} />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none' }}
          >
            <FiPlus size={14} /> Add Role
          </button>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No roles found matching your search."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Drawers */}
      <RoleFormDrawer isOpen={addOpen} onClose={() => setAddOpen(false)} onSave={handleSave} role={null} />
      {editTarget && (
        <RoleFormDrawer isOpen={!!editTarget} onClose={() => setEditTarget(null)} onSave={handleSave} role={editTarget} />
      )}
      <ViewRoleDrawer
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        role={viewTarget}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
      />
    </div>
  );
}
