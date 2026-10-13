import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import Toast, { useToast } from '../../components/ui/Toast';
import { FormField, Input, Select } from '../../components/ui/FormField';
import PermissionGate from '../../components/auth/PermissionGate';
import { usePermissions } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { downloadBlob, downloadCsv, filenameFromResponse, blobErrorMessage } from '../../hooks/downloadBlob';
import { userService } from '../../services/platform.service';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEdit2, FiEye, FiMail, FiKey, FiUserX, FiUserCheck, FiX,
} from 'react-icons/fi';
import {
  fetchUsers, inviteUser, updateUser, setUserStatus, setUserRoles, sendPasswordReset,
  resendUserInvite, cancelUserInvite, fetchRoles, fetchDepartments, fetchLocations,
} from '../../store/platform/usersSlice';
import StatusPill from './StatusPill';
import ConfirmDialog from './ConfirmDialog';
import UserFormDrawer from './UserFormDrawer';
import UserViewDrawer from './UserViewDrawer';
import { formatDateTime } from './auditFormat';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
];

const ACTIONS = {
  suspend: {
    title: 'Suspend User?',
    desc: 'This prevents the user from signing in to PGSL ERP and ends their current sessions. Their account and records stay in the system.',
    label: 'Suspend User', tone: 'danger', icon: <FiUserX size={14} />, requireReason: true,
  },
  deactivate: {
    title: 'Deactivate User?',
    desc: "This deactivates the user's account, ends their sessions and prevents access to PGSL ERP.",
    label: 'Deactivate User', tone: 'danger', icon: <FiUserX size={14} />, requireReason: true,
  },
  cancelInvite: {
    title: 'Cancel Invitation?',
    desc: 'This deletes the pending account. The invitation link stops working and the user cannot activate the account.',
    label: 'Cancel Invitation', tone: 'danger', icon: <FiX size={14} />, requireReason: true,
  },
  resend: {
    title: 'Resend Invitation?',
    desc: "A new invitation link is sent to the user's work email so they can finish setting up their account.",
    label: 'Resend Invite', tone: 'primary', icon: <FiMail size={14} />,
  },
  reactivate: {
    title: 'Reactivate User?',
    desc: "This restores the user's access to PGSL ERP.",
    label: 'Reactivate User', tone: 'success', icon: <FiUserCheck size={14} />,
  },
  resetPwd: {
    title: 'Send Password Reset?',
    desc: "A password reset link (valid for 60 minutes) is sent to the user's work email.",
    label: 'Send Reset Link', tone: 'primary', icon: <FiKey size={14} />,
  },
};

function SkeletonRows() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      {[1, 2, 3, 4, 5, 6].map((k) => (
        <div key={k} style={{ height: 44, borderRadius: 8, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
      <style>{'@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}'}</style>
    </div>
  );
}

function FilterDrawer({ isOpen, onClose, value, onApply, departments, roles }) {
  const [draft, setDraft] = useState(value);
  const set = (k, v) => setDraft((p) => ({ ...p, [k]: v }));

  const footer = (
    <>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }} onClick={() => { onApply({}); onClose(); }}>Reset</button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', backgroundColor: '#1D4ED8' }} onClick={() => { onApply(draft); onClose(); }}>Apply Filters</button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filter Users" subtitle="Narrow the list by status, department or role" width="420px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Status">
          <Select value={draft.status || ''} onChange={(e) => set('status', e.target.value)} options={STATUS_OPTIONS} />
        </FormField>
        <FormField label="Department">
          <Select
            value={draft.departmentId || ''}
            onChange={(e) => set('departmentId', e.target.value)}
            options={[{ value: '', label: 'Any department' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]}
            searchable
          />
        </FormField>
        <FormField label="Role">
          <Select
            value={draft.roleId || ''}
            onChange={(e) => set('roleId', e.target.value)}
            options={[{ value: '', label: 'Any role' }, ...roles.map((r) => ({ value: r._id, label: r.name }))]}
            searchable
          />
        </FormField>
      </div>
    </Drawer>
  );
}

export default function UserManagement() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { can, isSuperAdmin } = usePermissions();
  const myPermissions = useSelector((s) => s.auth.permissions);
  const myId = useSelector((s) => s.auth.user?._id);
  const { users, meta, usersLoading, usersError, roles, rolesError, departments, departmentsError, locations } = useSelector((s) => s.users);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [action, setAction] = useState({ user: null, key: null, busy: false, error: '' });

  const query = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: debouncedSearch || undefined,
      status: filters.status || undefined,
      departmentId: filters.departmentId || undefined,
      roleId: filters.roleId || undefined,
    }),
    [page, debouncedSearch, filters],
  );

  const loadUsers = useCallback(() => dispatch(fetchUsers(query)), [dispatch, query]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (can('core.role.view')) dispatch(fetchRoles());
    if (can('core.department.view')) dispatch(fetchDepartments());
    if (can('core.location.view')) dispatch(fetchLocations());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const grantCeiling = useCallback(
    (role) => {
      if (isSuperAdmin) return { ok: true };
      if (role.slug === 'super-admin') return { ok: false, reason: 'Only a Super Admin can grant the Super Admin role' };
      const missing = (role.permissions || []).some((p) => !myPermissions.includes(p));
      return missing ? { ok: false, reason: 'This role includes permissions you do not hold, so you cannot grant it' } : { ok: true };
    },
    [isSuperAdmin, myPermissions],
  );

  const viewUser = viewId ? users.find((u) => u._id === viewId) : null;
  const editUser = formMode && formMode !== 'add' ? users.find((u) => u._id === formMode) : null;

  const activeFilterCount = ['status', 'departmentId', 'roleId'].filter((k) => filters[k]).length;

  // ── Save (invite or edit) ───────────────────────────────────────────────────
  const handleSave = async (payload) => {
    const { roleIds, ...profile } = payload;
    if (!editUser) {
      const result = await dispatch(inviteUser({ ...profile, roleIds }));
      if (result.meta.requestStatus !== 'fulfilled') return { error: result.payload };
      setFormMode(null);
      showToast('Invitation sent', 'success');
      setPage(1);
      loadUsers();
      return {};
    }

    const updated = await dispatch(updateUser({ id: editUser._id, ...profile }));
    if (updated.meta.requestStatus !== 'fulfilled') return { error: updated.payload };

    const before = (editUser.roles || []).map((r) => r?._id || r).sort().join(',');
    const after = [...roleIds].sort().join(',');
    if (before !== after && can('core.user.update')) {
      const rolesResult = await dispatch(setUserRoles({ id: editUser._id, roleIds }));
      if (rolesResult.meta.requestStatus !== 'fulfilled') {
        loadUsers();
        return { error: { ...rolesResult.payload, message: `Details saved, but roles were not changed: ${rolesResult.payload.message}` } };
      }
    }
    setFormMode(null);
    showToast('User updated', 'success');
    loadUsers();
    return {};
  };

  // ── Status / invite actions ─────────────────────────────────────────────────
  const runAction = async (reason) => {
    const { user, key } = action;
    const name = `${user.firstName} ${user.lastName}`;
    setAction((a) => ({ ...a, busy: true, error: '' }));

    let result;
    if (key === 'suspend') result = await dispatch(setUserStatus({ id: user._id, status: 'suspended', reason }));
    if (key === 'deactivate') result = await dispatch(setUserStatus({ id: user._id, status: 'deactivated', reason }));
    if (key === 'reactivate') result = await dispatch(setUserStatus({ id: user._id, status: 'active' }));
    if (key === 'resend') result = await dispatch(resendUserInvite(user._id));
    if (key === 'cancelInvite') result = await dispatch(cancelUserInvite({ id: user._id, reason }));
    if (key === 'resetPwd') result = await dispatch(sendPasswordReset(user._id));

    if (result.meta.requestStatus !== 'fulfilled') {
      setAction((a) => ({ ...a, busy: false, error: result.payload?.message || 'Action failed' }));
      return;
    }
    const messages = {
      suspend: `${name} has been suspended`,
      deactivate: `${name} has been deactivated`,
      cancelInvite: `Invitation cancelled for ${name}`,
      resend: `Invitation resent to ${user.email}`,
      reactivate: `${name} has been reactivated`,
      resetPwd: `Password reset link sent to ${user.email}`,
    };
    showToast(messages[key], 'success');
    setAction({ user: null, key: null, busy: false, error: '' });
    if (key === 'cancelInvite') setViewId(null);
    loadUsers();
  };

  const menuItemsFor = (user) => {
    const open = (key) => () => setAction({ user, key, busy: false, error: '' });
    const items = [];
    const isSelf = user._id === myId;
    if (can('core.user.update')) items.push({ label: 'Edit User', icon: <FiEdit2 size={13} />, action: () => setFormMode(user._id), color: '#334155' });
    if (user.status === 'active') {
      if (can('core.user.reset-password')) items.push({ label: 'Reset Password', icon: <FiKey size={13} />, action: open('resetPwd'), color: '#334155' });
      if (can('core.user.suspend') && !isSelf) {
        items.push({ label: 'Suspend User', icon: <FiUserX size={13} />, action: open('suspend'), color: '#DC2626' });
        items.push({ label: 'Deactivate User', icon: <FiUserX size={13} />, action: open('deactivate'), color: '#DC2626' });
      }
    }
    if (user.status === 'invited') {
      if (can('core.user.resend-invite')) items.push({ label: 'Resend Invite', icon: <FiMail size={13} />, action: open('resend'), color: '#334155' });
      if (can('core.user.cancel-invite')) items.push({ label: 'Cancel Invite', icon: <FiX size={13} />, action: open('cancelInvite'), color: '#DC2626' });
    }
    if (user.status === 'suspended' && can('core.user.suspend')) {
      items.push({ label: 'Reactivate User', icon: <FiUserCheck size={13} />, action: open('reactivate'), color: '#16A34A' });
      items.push({ label: 'Deactivate User', icon: <FiUserX size={13} />, action: open('deactivate'), color: '#DC2626' });
    }
    if (user.status === 'deactivated' && can('core.user.suspend')) {
      items.push({ label: 'Reactivate User', icon: <FiUserCheck size={13} />, action: open('reactivate'), color: '#16A34A' });
    }
    return items;
  };

  // ── Export: ticked rows as CSV, or everything matching the filters from the server ──
  const handleExport = async () => {
    const roleNames = (u) => (u.roles || []).map((r) => r?.name || r).join('; ');
    if (selectedIds.length > 0) {
      const rows = users
        .filter((u) => selectedIds.includes(u._id))
        .map((u) => [u.userCode, u.firstName, u.lastName, u.email, u.phoneNumber || '', u.jobTitle || '', u.departmentId?.name || '', roleNames(u), u.status, u.lastLoginAt || '', u.createdAt]);
      downloadCsv('users-selected.csv', ['User ID', 'First name', 'Last name', 'Email', 'Phone', 'Job title', 'Department', 'Roles', 'Status', 'Last login', 'Created'], rows);
      showToast(`Exported ${rows.length} selected user${rows.length === 1 ? '' : 's'}`, 'success');
      return;
    }
    try {
      const { q, status, departmentId, roleId } = query;
      const res = await userService.exportCsv({ q, status, departmentId, roleId });
      downloadBlob(res.data, filenameFromResponse(res, 'users.csv'));
      showToast('Users exported', 'success');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const columns = [
    { key: 'userCode', label: 'USER ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.813rem' }}>{val}</span> },
    { key: 'firstName', label: 'NAME', render: (_, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{row.firstName} {row.lastName}</span> },
    { key: 'email', label: 'EMAIL', render: (val) => <span style={{ color: '#475569' }}>{val}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{val?.name || '—'}</span> },
    { key: 'roles', label: 'ROLE', render: (val) => <span>{(val || []).map((r) => r?.name || r).join(', ') || '—'}</span> },
    { key: 'lastLoginAt', label: 'LAST ACTIVE', nowrap: true, render: (val) => <span style={{ color: '#475569' }}>{val ? formatDateTime(val) : '—'}</span> },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => {
        const items = menuItemsFor(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <button className="icon-btn" onClick={() => setViewId(row._id)} title="View User"><FiEye size={15} /></button>
            {items.length > 0 && <RowMenu items={items} />}
          </div>
        );
      },
    },
  ];

  const cfg = ACTIONS[action.key];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Users</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage user accounts, roles, and access to the PGSL ERP.</p>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); setSelectedIds([]); }}
              placeholder="Search User ID, name or email..."
              style={{ paddingLeft: 36 }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
            <FiFilter size={14} /> Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <PermissionGate permission="core.user.export">
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export'} <FiDownload size={14} />
            </button>
          </PermissionGate>
          <PermissionGate permission="core.user.create">
            <button
              className="btn btn-primary"
              onClick={() => setFormMode('add')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none' }}
            >
              <FiPlus size={14} /> Add User
            </button>
          </PermissionGate>
        </div>

        {usersError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{usersError}</span>
            <button onClick={loadUsers} style={{ background: 'none', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {usersLoading && users.length === 0 ? (
          <SkeletonRows />
        ) : (
          <div style={{ opacity: usersLoading ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
            <DataTable
              columns={columns}
              data={users}
              selectable
              selectedIds={selectedIds}
              onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))}
              onSelectAll={() => setSelectedIds(selectedIds.length === users.length ? [] : users.map((u) => u._id))}
              keyField="_id"
              emptyMessage={usersError ? 'Users could not be loaded.' : debouncedSearch || activeFilterCount ? 'No users match your search or filters.' : 'No users yet. Use Add User to invite the first one.'}
            />
          </div>
        )}
        <Pagination currentPage={meta?.page || page} totalPages={meta?.totalPages || 1} onPageChange={(p) => { setPage(p); setSelectedIds([]); }} />
      </div>

      {filterOpen && (
        <FilterDrawer
          isOpen
          onClose={() => setFilterOpen(false)}
          value={filters}
          onApply={(next) => { setFilters(next); setPage(1); setSelectedIds([]); }}
          departments={departments}
          roles={roles}
        />
      )}

      {formMode && (formMode === 'add' || editUser) && (
        <UserFormDrawer
          key={formMode}
          isOpen
          onClose={() => setFormMode(null)}
          onSubmit={handleSave}
          user={editUser}
          roles={roles}
          rolesError={rolesError}
          departments={departments}
          departmentsError={departmentsError}
          locations={locations}
          canGrant={grantCeiling}
          canAssignRoles={can('core.user.update') && can('core.role.view')}
        />
      )}

      {viewUser && (
        <UserViewDrawer
          user={viewUser}
          onClose={() => setViewId(null)}
          onEdit={() => { setFormMode(viewUser._id); setViewId(null); }}
          menuItems={menuItemsFor(viewUser).filter((i) => i.label !== 'Edit User')}
          canEdit={can('core.user.update')}
          canAudit={can('core.auditlog.view')}
        />
      )}

      <ConfirmDialog
        open={!!cfg}
        title={cfg?.title}
        description={cfg?.desc}
        subject={action.user ? `${action.user.firstName} ${action.user.lastName}` : ''}
        subjectDetail={action.user?.email}
        confirmLabel={cfg?.label}
        icon={cfg?.icon}
        tone={cfg?.tone}
        requireReason={!!cfg?.requireReason}
        busy={action.busy}
        error={action.error}
        onConfirm={runAction}
        onClose={() => setAction({ user: null, key: null, busy: false, error: '' })}
      />
    </div>
  );
}
