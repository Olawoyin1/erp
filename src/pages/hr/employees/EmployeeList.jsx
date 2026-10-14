import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select } from '../../../components/ui/FormField';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import AssignManagerDrawer from './AssignManagerDrawer';
import DeactivateModal from './DeactivateModal';
import ImportDialog from '../ImportDialog';

import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  assignManager,
  deactivateEmployee,
  confirmEmployee,
  reactivateEmployee,
  selectEmployees,
  selectEmployeesMeta,
  selectEmployeesLoading,
  selectEmployeesError,
} from '../../../store/hr/employeesSlice';
import { employeeService } from '../../../services/hr.service';
import { titleCase, formatDate, apiError } from '../../../services/apiHelpers';
import Avatar from '../Avatar';
import { usePermission } from '../../../hooks/usePermission';
import { saveBlob, blobErrorMessage } from '../hrUtils';

import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus,
  FiEye, FiMoreVertical, FiEdit2, FiUser, FiX, FiCheck, FiRotateCcw,
} from 'react-icons/fi';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'probation', label: 'Probation' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'deactivated', label: 'Deactivated' },
];

const STATUS_BADGE = { on_leave: 'On Leave' };
const statusLabel = (s) => STATUS_BADGE[s] || titleCase(s);

// ─── Filter Drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ onClose, value, departments, departmentsError, onApply }) {
  const [draft, setDraft] = useState(value);
  const footer = (
    <>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem' }}
        onClick={() => { onApply({ status: '', departmentId: '' }); onClose(); }}>Reset</button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', backgroundColor: '#1D4ED8', color: '#fff', border: 'none' }}
        onClick={() => { onApply(draft); onClose(); }}>Apply Filters</button>
    </>
  );
  return (
    <Drawer isOpen onClose={onClose} title="Filter Records"
      subtitle="Refine employee directory view by status and department" width="420px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormField label="Status">
          <Select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} options={STATUS_FILTERS} />
        </FormField>
        <FormField label="Department" error={departmentsError}>
          <Select value={draft.departmentId} searchable onChange={(e) => setDraft((d) => ({ ...d, departmentId: e.target.value }))}
            options={[{ value: '', label: 'All departments' }, ...departments.map((d) => ({ value: d._id, label: d.name }))]} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────
function RowMenu({ items }) {
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
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: 200 }}>
          {items.map(({ label, icon, action, color }) => (
            <div key={label} onClick={() => { action(); setOpen(false); }} className="menu-item-hover"
              style={{ padding: '8px 14px', fontSize: '0.813rem', color, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              {icon} {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
      {[120, 160, 140, 120, 160, 140, 80, 100, 70].map((w, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div style={{ height: 12, width: w, borderRadius: 4, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
  );
}

function ConfirmModal({ title, body, confirmLabel, tone = 'primary', onClose, onConfirm }) {
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
          <button onClick={run} disabled={saving}
            style={{ padding: '8px 18px', backgroundColor: tone === 'danger' ? '#DC2626' : '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

export default function EmployeeList() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { toast, showToast, hideToast } = useToast();

  const employees = useSelector(selectEmployees);
  const meta      = useSelector(selectEmployeesMeta);
  const loading   = useSelector(selectEmployeesLoading);
  const loadError = useSelector(selectEmployeesError);

  const canCreate     = usePermission('hr.employee.create');
  const canUpdate     = usePermission('hr.employee.update');
  const canConfirm    = usePermission('hr.employee.confirm');
  const canDeactivate = usePermission('hr.employee.deactivate');
  const canReactivate = usePermission('hr.employee.reactivate');
  const canExport     = usePermission('hr.employee.export');

  const [search, setSearch]           = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage]               = useState(1);
  const [filters, setFilters]         = useState({ status: '', departmentId: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [lookups, setLookups]         = useState({ departments: [], error: '' });

  const [addOpen, setAddOpen]               = useState(false);
  const [importOpen, setImportOpen]         = useState(false);
  const [editTarget, setEditTarget]         = useState(null);
  const [assignTarget, setAssignTarget]     = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [confirmTarget, setConfirmTarget]   = useState(null);
  const [reactivateTarget, setReactivateTarget] = useState(null);

  const debounceRef = useRef(null);

  const queryParams = useCallback((p, q, f) => {
    const params = { page: p, limit: ITEMS_PER_PAGE };
    if (q) params.q = q;
    if (f.status) params.status = f.status;
    if (f.departmentId) params.departmentId = f.departmentId;
    return params;
  }, []);

  useEffect(() => {
    dispatch(fetchEmployees(queryParams(page, activeSearch, filters)));
  }, [dispatch, queryParams, page, activeSearch, filters]);

  useEffect(() => {
    let cancelled = false;
    employeeService.lookups()
      .then((res) => { if (!cancelled) setLookups({ departments: res.data?.data?.departments || [], error: '' }); })
      .catch(() => { if (!cancelled) setLookups({ departments: [], error: 'Departments could not be loaded' }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 400);
  };

  const refresh = () => dispatch(fetchEmployees(queryParams(page, activeSearch, filters)));

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleAdd = async (formData, photoFile) => {
    const result = await dispatch(createEmployee(formData));
    if (createEmployee.fulfilled.match(result)) {
      setAddOpen(false);
      let photoNote = '';
      if (photoFile) {
        try {
          await employeeService.uploadPhoto(result.payload._id, photoFile);
        } catch (err) {
          photoNote = ` The photo could not be uploaded: ${apiError(err, 'try again from the profile')}`;
        }
      }
      showToast(`Employee ${result.payload.employeeId} registered. Onboarding has started.${photoNote}`, photoNote ? 'info' : 'success');
      setPage(1);
      refresh();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleEdit = async (formData) => {
    const result = await dispatch(updateEmployee({ id: editTarget._id, data: formData }));
    if (updateEmployee.fulfilled.match(result)) {
      setEditTarget(null);
      showToast('Changes successfully saved', 'success');
      refresh();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleAssign = async (reportingManagerId) => {
    const result = await dispatch(assignManager({ id: assignTarget._id, reportingManagerId }));
    if (assignManager.fulfilled.match(result)) {
      setAssignTarget(null);
      showToast('Supervisor updated successfully', 'success');
      refresh();
      return '';
    }
    return result.payload?.message || 'Assignment failed';
  };

  const handleDeactivate = async (reason) => {
    const result = await dispatch(deactivateEmployee({ id: deactivateTarget._id, reason }));
    if (deactivateEmployee.fulfilled.match(result)) {
      setDeactivateTarget(null);
      showToast('Employee deactivated', 'success');
      refresh();
      return undefined;
    }
    const payload = result.payload;
    const blockers = (payload?.details || []).filter((d) => d.field === 'blockers').map((d) => d.message);
    return { message: payload?.message || 'Deactivation failed', blockers };
  };

  const handleConfirm = async () => {
    const result = await dispatch(confirmEmployee(confirmTarget._id));
    if (confirmEmployee.fulfilled.match(result)) {
      setConfirmTarget(null);
      showToast('Probation confirmed. The employee is now active.', 'success');
      refresh();
      return '';
    }
    return result.payload?.message || 'Could not confirm probation';
  };

  const handleReactivate = async () => {
    const result = await dispatch(reactivateEmployee(reactivateTarget._id));
    if (reactivateEmployee.fulfilled.match(result)) {
      setReactivateTarget(null);
      showToast('Employee reactivated. Their login stays off until an administrator re-enables it.', 'success');
      refresh();
      return '';
    }
    return result.payload?.message || 'Could not reactivate';
  };

  const handleExport = async () => {
    try {
      const params = { format: 'csv' };
      if (activeSearch) params.q = activeSearch;
      if (filters.status) params.status = filters.status;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      const res = await employeeService.exportList(params);
      saveBlob(res.data, 'employees.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const handleSelectRow = (id) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
  const handleSelectAll = () => setSelectedIds(selectedIds.length === employees.length ? [] : employees.map((e) => e._id));

  const menuFor = (row) => {
    const items = [];
    if (canUpdate && row.status !== 'deactivated') {
      items.push({ label: 'Edit Employee', icon: <FiEdit2 size={13} />, action: () => setEditTarget(row), color: '#334155' });
      items.push({ label: 'Assign Manager', icon: <FiUser size={13} />, action: () => setAssignTarget(row), color: '#334155' });
    }
    if (canConfirm && row.status === 'probation') {
      items.push({ label: 'Confirm Probation', icon: <FiCheck size={13} />, action: () => setConfirmTarget(row), color: '#059669' });
    }
    if (canDeactivate && row.status !== 'deactivated') {
      items.push({ label: 'Deactivate Employee', icon: <FiX size={13} />, action: () => setDeactivateTarget(row), color: '#DC2626' });
    }
    if (canReactivate && row.status === 'deactivated') {
      items.push({ label: 'Reactivate Employee', icon: <FiRotateCcw size={13} />, action: () => setReactivateTarget(row), color: '#059669' });
    }
    return items;
  };

  const columns = [
    {
      key: 'employeeId', label: 'EMPLOYEE ID',
      render: (val, row) => (
        <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/hr/employees/${row._id}`)}>{val}</span>
      ),
    },
    {
      key: 'fullName', label: 'EMPLOYEE',
      render: (val, row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, color: '#0F172A' }}>
          <Avatar name={val} url={row.photoUrl} size={28} /> {val}
        </span>
      ),
    },
    { key: 'position', label: 'POSITION' },
    { key: 'departmentId', label: 'DEPARTMENT', render: (val) => val?.name ?? '—' },
    {
      key: 'currentProjectRef', label: 'PROJECT',
      render: (val) => <div style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</div>,
    },
    { key: 'reportingManagerId', label: 'REPORTING MANAGER', render: (val) => val?.fullName ?? '—' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={statusLabel(val)} /> },
    { key: 'hireDate', label: 'DATE JOINED', render: (val) => formatDate(val) },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" onClick={() => navigate(`/hr/employees/${row._id}`)} title="View Profile"><FiEye size={15} /></button>
          <RowMenu items={menuFor(row)} />
        </div>
      ),
    },
  ];

  const filterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Employees</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
            Manage employee records, roles, departments, and employment status
          </p>
        </div>
        {canCreate && (
          <button className="btn btn-secondary" onClick={() => setImportOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}>
            Upload <FiUpload size={13} />
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search employees, ID, position…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}
            </button>
            {canExport && (
              <button className="btn btn-secondary" onClick={handleExport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Export <FiDownload size={14} />
              </button>
            )}
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setAddOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: 6, fontWeight: 600, border: 'none' }}>
                <FiPlus size={14} /> Employee
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError.message}</div>
            <button className="btn btn-secondary" onClick={refresh}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
            <tbody>{[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={employees}
            selectable
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            keyField="_id"
            emptyMessage={activeSearch || filterCount ? 'No employees match your search or filters.' : 'No employees yet.'}
          />
        )}

        {meta && meta.totalPages > 1 && <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />}
      </div>

      {filterOpen && (
        <FilterDrawer onClose={() => setFilterOpen(false)} value={filters} departments={lookups.departments} departmentsError={lookups.error}
          onApply={(f) => { setPage(1); setFilters(f); }} />
      )}
      {addOpen && <AddEmployeeModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}
      {editTarget && <EditEmployeeModal employee={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} onPhotoChanged={refresh} />}
      {assignTarget && <AssignManagerDrawer employee={assignTarget} onClose={() => setAssignTarget(null)} onAssign={handleAssign} />}
      {deactivateTarget && <DeactivateModal employee={deactivateTarget} onClose={() => setDeactivateTarget(null)} onDeactivate={handleDeactivate} />}
      {confirmTarget && (
        <ConfirmModal title="Confirm probation" confirmLabel="Confirm employee" onClose={() => setConfirmTarget(null)} onConfirm={handleConfirm}
          body={`${confirmTarget.fullName} will move from probation to active and the confirmation date is recorded.`} />
      )}
      {reactivateTarget && (
        <ConfirmModal title="Reactivate employee" confirmLabel="Reactivate" onClose={() => setReactivateTarget(null)} onConfirm={handleReactivate}
          body={`${reactivateTarget.fullName} will be marked active again. Their login stays disabled until an administrator re-enables it under User Management.`} />
      )}
      {importOpen && (
        <ImportDialog entity="employees" title="Upload personnel" description="Register many employees from a CSV or Excel file"
          onClose={() => setImportOpen(false)}
          onImported={(report) => { showToast(`${report.created} employee(s) imported`, 'success'); setPage(1); refresh(); }} />
      )}
    </div>
  );
}
