import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { FormField, Input, Select } from '../../components/ui/FormField';
import PermissionGate from '../../components/auth/PermissionGate';
import { usePermissions } from '../../hooks/usePermission';
import { downloadCsv } from '../../hooks/downloadBlob';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEdit2, FiEye, FiTrash2 } from 'react-icons/fi';
import {
  fetchRoles, createRole, updateRole, deleteRole, fetchPermissions, fetchDepartments,
} from '../../store/platform/usersSlice';
import ConfirmDialog from '../users/ConfirmDialog';
import RoleFormDrawer from './RoleFormDrawer';
import RoleViewDrawer from './RoleViewDrawer';

const PAGE_SIZE = 10;

function SkeletonRows() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      {[1, 2, 3, 4, 5].map((k) => (
        <div key={k} style={{ height: 44, borderRadius: 8, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </div>
  );
}

function FilterDrawer({ onClose, value, onApply, departments }) {
  const [department, setDepartment] = useState(value.department || '');
  const footer = (
    <>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }} onClick={() => { onApply({}); onClose(); }}>Reset</button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', backgroundColor: '#1D4ED8' }} onClick={() => { onApply({ department }); onClose(); }}>Apply Filters</button>
    </>
  );
  return (
    <Drawer isOpen onClose={onClose} title="Filter Roles" subtitle="Narrow the list by department" width="420px" footer={footer}>
      <FormField label="Department">
        <Select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          options={[{ value: '', label: 'Any department' }, ...departments.map((d) => ({ value: d, label: d }))]}
          searchable
        />
      </FormField>
    </Drawer>
  );
}

export default function RolesPermissions() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { can, isSuperAdmin } = usePermissions();
  const myRoles = useSelector((s) => s.auth.roles);
  const { roles, rolesLoading, rolesError, departments, permissionCatalogue } = useSelector((s) => s.users);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formMode, setFormMode] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [deleteState, setDeleteState] = useState({ role: null, busy: false, error: '' });

  const loadRoles = () => dispatch(fetchRoles());

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
    if (can('core.department.view')) dispatch(fetchDepartments());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const catalogue = permissionCatalogue?.catalogue || null;

  const departmentNames = useMemo(
    () => [...new Set([...departments.filter((d) => d.isActive !== false).map((d) => d.name), ...roles.map((r) => r.department).filter(Boolean)])].sort(),
    [departments, roles],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      if (filters.department && r.department !== filters.department) return false;
      return !q || r.roleCode?.toLowerCase().includes(q) || r.name?.toLowerCase().includes(q) || r.department?.toLowerCase().includes(q);
    });
  }, [roles, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const viewRole = viewId ? roles.find((r) => r._id === viewId) : null;
  const editRole = formMode && formMode !== 'add' ? roles.find((r) => r._id === formMode) : null;

  const handleSave = async (payload) => {
    const result = editRole
      ? await dispatch(updateRole({ id: editRole._id, ...payload }))
      : await dispatch(createRole(payload));
    if (result.meta.requestStatus !== 'fulfilled') return { error: result.payload };
    setFormMode(null);
    showToast(editRole ? 'Role updated' : 'Role created', 'success');
    loadRoles();
    return {};
  };

  const confirmDelete = async () => {
    const { role } = deleteState;
    setDeleteState((s) => ({ ...s, busy: true, error: '' }));
    const result = await dispatch(deleteRole(role._id));
    if (result.meta.requestStatus !== 'fulfilled') {
      setDeleteState((s) => ({ ...s, busy: false, error: result.payload?.message || 'Delete failed' }));
      return;
    }
    setDeleteState({ role: null, busy: false, error: '' });
    showToast(`Role "${role.name}" deleted`, 'success');
    loadRoles();
  };

  const handleExport = () => {
    const rows = (selectedIds.length ? filtered.filter((r) => selectedIds.includes(r._id)) : filtered).map((r) => [
      r.roleCode, r.name, r.department, r.description || '', r.userCount ?? 0, r.isSystem ? 'System' : 'Custom', (r.permissions || []).length,
    ]);
    downloadCsv('roles.csv', ['Role ID', 'Role', 'Department', 'Description', 'Users', 'Type', 'Permissions'], rows);
    showToast(`Exported ${rows.length} role${rows.length === 1 ? '' : 's'}`, 'success');
  };

  const isOwnRole = (role) => !isSuperAdmin && myRoles.includes(role.slug);

  const menuItemsFor = (role) => {
    const items = [];
    if (can('core.role.update')) items.push({ label: 'Edit Role', icon: <FiEdit2 size={13} />, action: () => setFormMode(role._id), color: '#334155' });
    if (can('core.role.delete') && !role.isSystem) {
      items.push({ label: 'Delete Role', icon: <FiTrash2 size={13} />, action: () => setDeleteState({ role, busy: false, error: '' }), color: '#DC2626' });
    }
    return items;
  };

  const columns = [
    { key: 'roleCode', label: 'ROLE ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.813rem' }}>{val}</span> },
    {
      key: 'name', label: 'ROLE',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
          {row.isSystem && <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#EA580C', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 4, padding: '1px 5px' }}>SYSTEM</span>}
        </div>
      ),
    },
    { key: 'department', label: 'DEPARTMENT', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{val || '—'}</span> },
    {
      key: 'description', label: 'DESCRIPTION',
      render: (val) => (
        <span style={{ color: '#475569', fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 340 }}>{val || '—'}</span>
      ),
    },
    { key: 'userCount', label: 'NO OF USERS', render: (val) => <span style={{ fontWeight: 500, color: '#334155' }}>{val ?? 0}</span> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const items = menuItemsFor(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <button className="icon-btn" onClick={() => setViewId(row._id)} title="View Role"><FiEye size={15} /></button>
            {items.length > 0 && <RowMenu items={items} />}
          </div>
        );
      },
    },
  ];

  const deleteRoleTarget = deleteState.role;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Roles &amp; Permissions</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage user roles and control access to ERP modules and actions</p>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Role ID, role name..."
              style={{ paddingLeft: 36 }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiFilter size={14} /> Filter{filters.department ? ' (1)' : ''}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={filtered.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export'} <FiDownload size={14} />
          </button>
          <PermissionGate permission="core.role.create">
            <button
              className="btn btn-primary"
              onClick={() => setFormMode('add')}
              disabled={!catalogue}
              title={catalogue ? undefined : 'The permission catalogue is still loading'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none' }}
            >
              <FiPlus size={14} /> Add Role
            </button>
          </PermissionGate>
        </div>

        {rolesError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Failed to load roles: {rolesError}</span>
            <button onClick={loadRoles} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {rolesLoading && roles.length === 0 ? (
          <SkeletonRows />
        ) : (
          <div style={{ opacity: rolesLoading ? 0.6 : 1 }}>
            <DataTable
              columns={columns}
              data={pageRows}
              selectable
              selectedIds={selectedIds}
              onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))}
              onSelectAll={() => setSelectedIds(pageRows.every((r) => selectedIds.includes(r._id)) ? [] : pageRows.map((r) => r._id))}
              keyField="_id"
              emptyMessage={rolesError ? 'Roles could not be loaded.' : search || filters.department ? 'No roles match your search or filters.' : 'No roles yet.'}
            />
          </div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={filters} onApply={(next) => { setFilters(next); setPage(1); }} departments={departmentNames} />}

      {formMode && (formMode === 'add' || editRole) && catalogue && (
        <RoleFormDrawer
          key={formMode}
          role={editRole}
          catalogue={catalogue}
          departmentNames={departmentNames}
          ownRole={!!editRole && isOwnRole(editRole)}
          onClose={() => setFormMode(null)}
          onSubmit={handleSave}
        />
      )}

      {viewRole && (
        <RoleViewDrawer
          role={viewRole}
          catalogue={catalogue}
          onClose={() => setViewId(null)}
          onEdit={() => { setFormMode(viewRole._id); setViewId(null); }}
          canEdit={can('core.role.update')}
          canAudit={can('core.auditlog.view')}
        />
      )}

      <ConfirmDialog
        open={!!deleteRoleTarget}
        title="Delete Role?"
        description={
          deleteRoleTarget?.userCount > 0
            ? `${deleteRoleTarget.userCount} user${deleteRoleTarget.userCount === 1 ? ' holds' : 's hold'} this role. A role in use cannot be deleted: assign those users another role first.`
            : 'This permanently deletes the role. It cannot be undone.'
        }
        subject={deleteRoleTarget?.name}
        subjectDetail={deleteRoleTarget?.roleCode}
        confirmLabel="Delete Role"
        icon={<FiTrash2 size={14} />}
        tone="danger"
        busy={deleteState.busy}
        error={deleteState.error}
        onConfirm={confirmDelete}
        onClose={() => setDeleteState({ role: null, busy: false, error: '' })}
      />
    </div>
  );
}
