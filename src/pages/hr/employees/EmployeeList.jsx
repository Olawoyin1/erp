import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Badge from '../../../components/ui/Badge';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select } from '../../../components/ui/FormField';
import AddEmployeeModal from './AddEmployeeModal';
import EditEmployeeModal from './EditEmployeeModal';
import AssignManagerDrawer from './AssignManagerDrawer';
import DeactivateModal from './DeactivateModal';

import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  assignManager,
  deactivateEmployee,
  selectEmployees,
  selectEmployeesMeta,
  selectEmployeesLoading,
  selectEmployeesError,
} from '../../../store/hr/employeesSlice';

import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus,
  FiEye, FiMoreVertical, FiEdit2, FiUser, FiX,
} from 'react-icons/fi';

// ─── Status options for the filter (matches API values) ──────────────────────
const STATUS_OPTIONS = ['active', 'probation', 'on_leave', 'deactivated'];

const FILTER_DEPTS = [
  'Human Resources', 'Finance & Accounts', 'Procurement', 'Administration',
  'Mechanical Engineering', 'Civil Engineering', 'HSE', 'Quality Assurance', 'Engineering', 'Operations',
];

// ─── Filter Drawer ────────────────────────────────────────────────────────────
function FilterDrawer({ isOpen, onClose, onApply }) {
  const [statuses, setStatuses] = useState([]);
  const [depts, setDepts]       = useState([]);

  const toggle = (arr, setArr, val) =>
    setArr((p) => (p.includes(val) ? p.filter((v) => v !== val) : [...p, val]));

  const handleReset = () => { setStatuses([]); setDepts([]); onApply({}); onClose(); };
  const handleApply = () => { onApply({ status: statuses[0], departmentId: undefined }); onClose(); };

  const footer = (
    <>
      <button className="btn btn-secondary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
        onClick={handleReset}>Reset</button>
      <button className="btn btn-primary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
        onClick={handleApply}>Apply Filters</button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Filter Records"
      subtitle="Refine employee directory view by status and department"
      width="420px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <FormField label="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer', textTransform: 'capitalize' }}>
                <input type="checkbox" checked={statuses.includes(s)}
                  onChange={() => toggle(statuses, setStatuses, s)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }} />
                {s.replace('_', ' ')}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Department">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {FILTER_DEPTS.map((d) => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input type="checkbox" checked={depts.includes(d)}
                  onChange={() => toggle(depts, setDepts, d)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }} />
                {d}
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────
function RowMenu({ employee, onEdit, onAssign, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isDeactivated = employee.status === 'deactivated';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px' }}>
          {[
            { label: 'Edit Employee', icon: <FiEdit2 size={13} />, action: onEdit, color: '#334155', hover: '#F8FAFC' },
            { label: 'Assign Manager', icon: <FiUser size={13} />, action: onAssign, color: '#334155', hover: '#F8FAFC' },
            ...(!isDeactivated ? [{ label: 'Deactivate', icon: <FiX size={13} />, action: onDeactivate, color: '#DC2626', hover: '#FEE2E2' }] : []),
          ].map(({ label, icon, action, color, hover }) => (
            <div key={label} onClick={() => { action(); setOpen(false); }}
              style={{ padding: '8px 14px', fontSize: '0.813rem', color, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hover)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}>
              {icon} {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
      {[180, 140, 140, 120, 160, 140, 80, 100, 70].map((w, i) => (
        <td key={i} style={{ padding: '14px 12px' }}>
          <div style={{ height: 12, width: w, borderRadius: 4, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
        </td>
      ))}
    </tr>
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
  const apiError  = useSelector(selectEmployeesError);

  const [search,      setSearch]      = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const [addOpen,          setAddOpen]          = useState(false);
  const [editTarget,       setEditTarget]        = useState(null);
  const [assignTarget,     setAssignTarget]      = useState(null);
  const [deactivateTarget, setDeactivateTarget]  = useState(null);

  // Debounced search fetch
  const load = useCallback((page = 1, q = search, filters = activeFilters) => {
    dispatch(fetchEmployees({ page, limit: ITEMS_PER_PAGE, q: q || undefined, ...filters }));
  }, [dispatch, search, activeFilters]);

  // Initial load
  useEffect(() => { load(1); }, []);   // eslint-disable-line

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); load(1, search, activeFilters); }, 400);
    return () => clearTimeout(t);
  }, [search]);   // eslint-disable-line

  const handlePageChange = (p) => { setCurrentPage(p); load(p); };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setCurrentPage(1);
    load(1, search, filters);
  };

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    const result = await dispatch(createEmployee(formData));
    if (createEmployee.fulfilled.match(result)) {
      setAddOpen(false);
      showToast('Employee registered successfully', 'success');
      load(1);
    } else {
      showToast(result.payload?.message || 'Registration failed', 'error');
    }
  };

  const handleEdit = async (formData) => {
    const result = await dispatch(updateEmployee({ id: editTarget._id, data: formData }));
    if (updateEmployee.fulfilled.match(result)) {
      setEditTarget(null);
      showToast('Employee updated successfully', 'success');
    } else {
      showToast(result.payload?.message || 'Update failed', 'error');
    }
  };

  const handleAssign = async (reportingManagerId) => {
    const result = await dispatch(assignManager({ id: assignTarget._id, reportingManagerId }));
    if (assignManager.fulfilled.match(result)) {
      setAssignTarget(null);
      showToast('Reporting manager assigned', 'success');
    } else {
      showToast(result.payload?.message || 'Assignment failed', 'error');
    }
  };

  const handleDeactivate = async (reason) => {
    const result = await dispatch(deactivateEmployee({ id: deactivateTarget._id, reason }));
    if (deactivateEmployee.fulfilled.match(result)) {
      setDeactivateTarget(null);
      showToast('Employee deactivated', 'error');
    } else {
      showToast(result.payload?.message || 'Deactivation failed', 'error');
    }
  };

  // ── Selection ──────────────────────────────────────────────────────────────
  const handleSelectRow = (id) =>
    setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]));
  const handleSelectAll = () =>
    setSelectedIds(selectedIds.length === employees.length ? [] : employees.map((e) => e._id));

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'employeeId',
      label: 'EMPLOYEE ID',
      render: (val, row) => (
        <span style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate(`/hr/employees/${row._id}`)}>
          {val}
        </span>
      ),
    },
    {
      key: 'fullName',
      label: 'EMPLOYEE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>,
    },
    { key: 'position',    label: 'POSITION' },
    {
      key: 'departmentId',
      label: 'DEPARTMENT',
      render: (val) => val?.name ?? val ?? '—',
    },
    {
      key: 'currentProjectRef',
      label: 'PROJECT',
      render: (val) => (
        <div style={{ maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'reportingManagerId',
      label: 'REPORTING MANAGER',
      render: (val) => val?.fullName ?? '—',
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />,
    },
    {
      key: 'hireDate',
      label: 'DATE JOINED',
      render: (val) => val ? new Date(val).toLocaleDateString('en-GB') : '—',
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => navigate(`/hr/employees/${row._id}`)} title="View Profile">
            <FiEye size={15} />
          </button>
          <RowMenu
            employee={row}
            onEdit={() => setEditTarget(row)}
            onAssign={() => setAssignTarget(row)}
            onDeactivate={() => setDeactivateTarget(row)}
          />
        </div>
      ),
    },
  ];

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Employees</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Manage employee records, roles, departments, and employment status
          </p>
        </div>
        <button className="btn btn-secondary"
          onClick={() => showToast('Bulk personnel upload coming soon', 'info')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Error banner */}
      {apiError && (
        <div style={{ padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#DC2626' }}>
          {apiError.message}
        </div>
      )}

      {/* Table card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search name, ID, position…"
              style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary"
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary"
              onClick={() => showToast('Export coming soon', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiDownload size={14} /> Export
            </button>
            <button className="btn btn-primary"
              onClick={() => setAddOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none' }}>
              <FiPlus size={14} /> Employee
            </button>
          </div>
        </div>

        {/* Table — show skeletons while first load */}
        {loading && employees.length === 0 ? (
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
            emptyMessage="No employees found."
          />
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      {/* Drawers & Modals */}
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={handleApplyFilters} />
      <AddEmployeeModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      {editTarget && (
        <EditEmployeeModal isOpen={!!editTarget} employee={editTarget}
          onClose={() => setEditTarget(null)} onSave={handleEdit} />
      )}
      <AssignManagerDrawer isOpen={!!assignTarget} employee={assignTarget}
        onClose={() => setAssignTarget(null)} onAssign={handleAssign} />
      {deactivateTarget && (
        <DeactivateModal employee={deactivateTarget}
          onClose={() => setDeactivateTarget(null)} onDeactivate={handleDeactivate} />
      )}
    </div>
  );
}
