import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  FiLock,
} from 'react-icons/fi';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  fetchPermissions,
} from '../../store/platform/usersSlice';

// ─── Constants ────────────────────────────────────────────────────────────────
// Role.department is free text — real dept names + two fixed pseudo-values per API docs
const DEPT_PSEUDO = ['System-wide', 'Cross-department'];
const STATIC_DEPARTMENTS = [
  ...DEPT_PSEUDO,
  'Human Resources', 'Finance & Accounts', 'Accounts & Finance',
  'Business Development', 'Administration', 'Technical',
  'HSE', 'Quality System', 'Procurement',
];

// 8 UI module rows — labels must match exactly what the API's modulePresets keys expect
const MODULES = [
  { label: 'Administration' },
  { label: 'Human Resources' },
  { label: 'Accounts & Finance' },
  { label: 'Business Development' },
  { label: 'Procurement' },
  { label: 'Quality System' },
  { label: 'HSE' },
  { label: 'Technical' },
];

const PERMISSION_KEYS = ['view', 'create', 'approve', 'configure'];
const PERMISSION_LABELS = { view: 'View', create: 'Create', approve: 'Approve', configure: 'Configure' };

const ITEMS_PER_PAGE = 10;

// ─── Preset <-> UI conversion helpers ────────────────────────────────────────
// API format:  { "Human Resources": ["view", "create"] }
// UI format:   { "Human Resources": { view: true, create: true, approve: false, configure: false } }

function emptyUiPerms() {
  const p = {};
  MODULES.forEach((m) => {
    p[m.label] = { view: false, create: false, approve: false, configure: false };
  });
  return p;
}

function apiPresetsToUi(modulePresets = {}) {
  const result = emptyUiPerms();
  Object.entries(modulePresets).forEach(([label, actions]) => {
    if (result[label]) {
      actions.forEach((action) => {
        if (action in result[label]) result[label][action] = true;
      });
    }
  });
  return result;
}

function uiPresetsToApi(uiPerms) {
  const result = {};
  MODULES.forEach((m) => {
    const actions = PERMISSION_KEYS.filter((k) => uiPerms[m.label]?.[k]);
    if (actions.length > 0) result[m.label] = actions;
  });
  return result;
}

// ─── Permission Matrix ────────────────────────────────────────────────────────
function PermissionMatrix({ permissions, onChange, readOnly = false }) {
  const toggle = (label, key) => {
    if (readOnly) return;
    onChange({
      ...permissions,
      [label]: { ...permissions[label], [key]: !permissions[label]?.[key] },
    });
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px 90px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8' }}>Module</div>
        {PERMISSION_KEYS.map((k) => (
          <div key={k} style={{ padding: '8px 0', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', color: '#1D4ED8', textAlign: 'center' }}>
            {PERMISSION_LABELS[k]}
          </div>
        ))}
      </div>
      {MODULES.map((mod, idx) => (
        <div key={mod.label} style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px 90px',
          alignItems: 'center',
          borderBottom: idx === MODULES.length - 1 ? 'none' : '1px solid #F1F5F9',
          backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFBFC',
        }}>
          <div style={{ padding: '9px 14px', fontSize: '0.85rem', color: '#0F172A' }}>{mod.label}</div>
          {PERMISSION_KEYS.map((pKey) => (
            <div key={pKey} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!permissions[mod.label]?.[pKey]}
                onChange={() => toggle(mod.label, pKey)}
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
function RoleFormDrawer({ isOpen, onClose, onSave, role, departments }) {
  const isEditing = !!role;
  const isSystem = role?.isSystem;

  const [form, setForm] = useState({
    name: '', department: 'Human Resources', description: '', uiPerms: emptyUiPerms(),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role) {
      setForm({
        name: role.name,
        department: role.department,
        description: role.description || '',
        uiPerms: apiPresetsToUi(role.modulePresets || {}),
      });
    } else {
      setForm({ name: '', department: 'Human Resources', description: '', uiPerms: emptyUiPerms() });
    }
  }, [role, isOpen]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      department: form.department,
      description: form.description,
      modulePresets: uiPresetsToApi(form.uiPerms),
    };
    await onSave(payload);
    setSaving(false);
  };

  // Dept options: real depts from API + pseudo values
  const deptOptions = departments.length > 0
    ? [...DEPT_PSEUDO, ...departments.map((d) => d.name)]
    : STATIC_DEPARTMENTS;

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>
        Cancel
      </button>
      <button type="submit" form="role-form" disabled={saving} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Role'}
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
        {isSystem && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, fontSize: '0.813rem', color: '#C2410C' }}>
            <FiLock size={14} /> System role — name and permissions cannot be changed.
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Role ID">
            <Input value={role?.roleCode || 'Auto-generated'} readOnly style={{ backgroundColor: '#F8FAFC', color: '#94A3B8' }} />
          </FormField>
          <FormField label="Role Name" required>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="HR — Staff"
              required
              disabled={isSystem}
            />
          </FormField>
        </div>
        <FormField label="Department" required>
          <Select
            value={form.department}
            onChange={(e) => set('department', e.target.value)}
            options={deptOptions}
          />
        </FormField>
        <FormField label="Description" required>
          <Textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Full access to all modules and system configuration"
            rows={3}
            required
          />
        </FormField>
        <FormField label="Module Access & Permissions" required>
          <PermissionMatrix
            permissions={form.uiPerms}
            onChange={(p) => set('uiPerms', p)}
            readOnly={isSystem}
          />
        </FormField>
      </form>
    </Drawer>
  );
}

// ─── View Role Drawer ─────────────────────────────────────────────────────────
function ViewRoleDrawer({ isOpen, onClose, role, onEdit }) {
  const [tab, setTab] = useState('details');
  if (!role) return null;

  const uiPerms = apiPresetsToUi(role.modulePresets || {});

  const tabStyle = (t) => ({
    padding: '10px 0', fontSize: '0.875rem',
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? '#1D4ED8' : '#64748B',
    border: 'none',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
    backgroundColor: 'transparent', cursor: 'pointer', marginBottom: -1,
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
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{role.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>
              {role.roleCode} · {role.department}
              {role.isSystem && <span style={{ marginLeft: 6, color: '#EA580C', fontSize: '0.7rem', fontWeight: 600 }}>SYSTEM</span>}
            </div>
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
        <button style={tabStyle('permissions')} onClick={() => setTab('permissions')}>Permissions</button>
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            {[
              ['ROL ID', role.roleCode],
              ['Role Name', role.name],
              ['Department', role.department],
              ['Users Assigned', role.userCount ?? '—'],
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
            <div style={{ fontSize: '0.875rem', color: '#0F172A', fontStyle: 'italic' }}>{role.description || '—'}</div>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {tab === 'permissions' && (
        <PermissionMatrix permissions={uiPerms} onChange={() => {}} readOnly />
      )}
    </Drawer>
  );
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────
function DeleteRoleDialog({ role, onClose, onConfirm }) {
  if (!role) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'var(--font)' }}>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)' }} />
      <div style={{ position: 'relative', zIndex: 2001, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Delete Role?</div>
        <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
          Are you sure you want to delete <strong>{role.name}</strong>? This action cannot be undone.
          The role must have no users assigned before it can be deleted.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={onConfirm} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 6, border: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiTrash2 size={14} /> Delete Role
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RoleRowMenu({ role, onEdit, onDelete }) {
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
          <div
            onClick={() => { onEdit(); setOpen(false); }}
            style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiEdit2 size={13} /> Edit Role
          </div>
          {!role.isSystem && (
            <div
              onClick={() => { onDelete(); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <FiTrash2 size={13} /> Delete Role
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RolesPermissions() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();

  // Redux state — roles list is NOT paginated (full list from API)
  const { roles, rolesLoading, rolesError, departments } = useSelector((s) => s.users);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch roles + permissions catalogue on mount
  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  // Client-side filter (GET /roles returns full list)
  const filtered = roles.filter((r) => {
    const q = search.toLowerCase();
    return !q
      || r.roleCode?.toLowerCase().includes(q)
      || r.name?.toLowerCase().includes(q)
      || r.department?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);
  const handleSelectAll = () => selectedIds.length === paginated.length ? setSelectedIds([]) : setSelectedIds(paginated.map((r) => r._id));

  // Create / Edit
  const handleSave = async (payload) => {
    if (editTarget) {
      const result = await dispatch(updateRole({ id: editTarget._id, ...payload }));
      if (result.meta.requestStatus === 'fulfilled') {
        setEditTarget(null);
        showToast('Role updated successfully', 'success');
      } else {
        showToast(result.payload || 'Update failed', 'error');
      }
    } else {
      const result = await dispatch(createRole(payload));
      if (result.meta.requestStatus === 'fulfilled') {
        setAddOpen(false);
        showToast('Role created successfully', 'success');
      } else {
        showToast(result.payload || 'Create failed', 'error');
      }
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    const result = await dispatch(deleteRole(deleteTarget._id));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast(`Role "${deleteTarget.name}" deleted`, 'success');
    } else {
      showToast(result.payload || 'Delete failed — role may still have users assigned', 'error');
    }
    setDeleteTarget(null);
  };

  const columns = [
    {
      key: 'roleCode', label: 'ROLE ID',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.813rem' }}>{val}</span>,
    },
    {
      key: 'name', label: 'ROLE',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
          {row.isSystem && (
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#EA580C', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 4, padding: '1px 5px' }}>SYSTEM</span>
          )}
        </div>
      ),
    },
    {
      key: 'department', label: 'DEPARTMENT',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{val}</span>,
    },
    {
      key: 'description', label: 'DESCRIPTION',
      render: (val) => (
        <span style={{ color: '#475569', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 340 }}>
          {val || '—'}
        </span>
      ),
    },
    {
      key: 'userCount', label: 'NO OF USERS',
      render: (val) => <span style={{ fontWeight: 500, color: '#334155' }}>{val ?? '—'}</span>,
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <button className="icon-btn" onClick={() => setViewTarget(row)} title="View Role"><FiEye size={15} /></button>
          <RoleRowMenu
            role={row}
            onEdit={() => setEditTarget(row)}
            onDelete={() => setDeleteTarget(row)}
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
              placeholder="Search Role ID, Role name..."
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

        {rolesError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: '0.85rem' }}>
            Failed to load roles: {rolesError}
          </div>
        )}

        {rolesLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading roles...</div>
        ) : (
          <DataTable
            columns={columns}
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            keyField="_id"
            emptyMessage="No roles found matching your search."
          />
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Drawers */}
      <RoleFormDrawer
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
        role={null}
        departments={departments}
      />
      {editTarget && (
        <RoleFormDrawer
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSave}
          role={editTarget}
          departments={departments}
        />
      )}
      <ViewRoleDrawer
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        role={viewTarget}
        onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
      />

      {/* Delete confirmation */}
      <DeleteRoleDialog
        role={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
