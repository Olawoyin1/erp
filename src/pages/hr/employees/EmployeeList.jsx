import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { mockEmployees } from '../../../data/mockEmployees';

import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiUpload,
  FiPlus,
  FiEye,
  FiMoreVertical,
  FiEdit2,
  FiUser,
  FiX,
} from 'react-icons/fi';

// ─── Filter Drawer ───────────────────────────────────────────────────────
const LEAVE_TYPES = [
  'All Leave Types',
  'Annual Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Study Leave',
  'Unpaid Leave',
  'Compassionate Leave',
];

const FILTER_STATUSES = ['All Statuses', 'Pending Approval', 'Approved', 'Declined', 'Cancelled'];

const FILTER_DEPTS = [
  'All Departments',
  'Human Resources',
  'Finance & Accounts',
  'Procurement',
  'Administration',
  'Mechanical Engineering',
  'Civil Engineering',
  'HSE',
  'Quality Assurance',
];

function FilterDrawer({ isOpen, onClose, onApply }) {
  const [leaveTypes, setLeaveTypes] = useState(['All Leave Types']);
  const [statuses, setStatuses] = useState(['All Statuses']);
  const [depts, setDepts] = useState(['All Departments']);

  const toggle = (arr, setArr, val) => {
    setArr((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  };

  const handleReset = () => {
    setLeaveTypes(['All Leave Types']);
    setStatuses(['All Statuses']);
    setDepts(['All Departments']);
    onApply({});
    onClose();
  };

  const handleApply = () => {
    onApply({ leaveTypes, statuses, depts });
    onClose();
  };

  const footer = (
    <>
      <button
        className="btn btn-secondary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
        onClick={handleReset}
      >
        Reset
      </button>
      <button
        className="btn btn-primary"
        style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
        onClick={handleApply}
      >
        Apply Filters
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Records"
      subtitle="Refine employee directory view by status, department, and types"
      width="420px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <FormField label="Leave Type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {LEAVE_TYPES.map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={leaveTypes.includes(t)}
                  onChange={() => toggle(leaveTypes, setLeaveTypes, t)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                />
                {t}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {FILTER_STATUSES.map((s) => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={statuses.includes(s)}
                  onChange={() => toggle(statuses, setStatuses, s)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                />
                {s}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Department">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {FILTER_DEPTS.map((d) => (
              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={depts.includes(d)}
                  onChange={() => toggle(depts, setDepts, d)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                />
                {d}
              </label>
            ))}
          </div>
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row Menu Component ─────────────────────────────────────────────────
function RowMenu({ employee, onEdit, onAssign, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            border: '1px solid #E2E8F0',
            padding: '6px 0',
            zIndex: 50,
            width: '180px',
          }}
        >
          <div
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            style={{
              padding: '8px 14px',
              fontSize: '0.813rem',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiEdit2 size={13} /> Edit Employee
          </div>
          <div
            onClick={() => {
              onAssign();
              setOpen(false);
            }}
            style={{
              padding: '8px 14px',
              fontSize: '0.813rem',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiUser size={13} /> Assign Manager
          </div>
          <div
            onClick={() => {
              onDeactivate();
              setOpen(false);
            }}
            style={{
              padding: '8px 14px',
              fontSize: '0.813rem',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
          >
            <FiX size={13} /> Deactivate Employee
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Employee List Component ──────────────────────────────────────
const ITEMS_PER_PAGE = 10;

export default function EmployeeList() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const [employees, setEmployees] = useState(mockEmployees);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // Modals / Drawers State
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  // Filter logic
  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    if (q && !emp.name.toLowerCase().includes(q) && !emp.id.toLowerCase().includes(q) && !emp.position.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((e) => e.id));
  };

  const handleAdd = (newEmp) => {
    setEmployees((prev) => [newEmp, ...prev]);
    setAddOpen(false);
    showToast('Employee registered successfully', 'success');
  };

  const handleEdit = (updated) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setEditTarget(null);
    showToast('Employee credentials updated successfully', 'success');
  };

  const handleAssign = (manager) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === assignTarget.id ? { ...e, manager, reportingManager: manager } : e))
    );
    setAssignTarget(null);
    showToast('Reporting supervisor assigned', 'success');
  };

  const handleDeactivate = () => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === deactivateTarget.id ? { ...e, status: 'Inactive', employmentStatus: 'Inactive' } : e))
    );
    setDeactivateTarget(null);
    showToast('Employee deactivated', 'error');
  };

  // Table Columns Definition for base DataTable component
  const columns = [
    {
      key: 'id',
      label: 'EMPLOYEE ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => navigate(`/hr/employees/${val}`)}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'EMPLOYEE',
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
      ),
    },
    { key: 'position', label: 'POSITION' },
    { key: 'department', label: 'DEPARTMENT' },
    {
      key: 'project',
      label: 'PROJECT',
      render: (val) => (
        <div style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {val}
        </div>
      ),
    },
    { key: 'reportingManager', label: 'REPORTING MANAGER' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />,
    },
    { key: 'dateJoined', label: 'DATE JOINED' },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button
            className="icon-btn"
            onClick={() => navigate(`/hr/employees/${row.id}`)}
            title="View Employee Profile"
          >
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Employees</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Manage employee records, roles, departments, and employment status
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => showToast('Bulk personnel upload', 'info')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Table Action Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          {/* Search Box */}
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search employees, ID, position..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiFilter size={14} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting employee directory CSV...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setAddOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontWeight: 600,
                border: 'none',
              }}
            >
              <FiPlus size={14} /> Employee
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No employees found matching query."
        />

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Drawers & Modals */}
      <FilterDrawer isOpen={filterOpen} onClose={() => setFilterOpen(false)} onApply={() => {}} />

      <AddEmployeeModal isOpen={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />

      {editTarget && (
        <EditEmployeeModal
          isOpen={!!editTarget}
          employee={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      <AssignManagerDrawer
        isOpen={!!assignTarget}
        employee={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssign={handleAssign}
      />

      {deactivateTarget && (
        <DeactivateModal
          employee={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onDeactivate={handleDeactivate}
        />
      )}
    </div>
  );
}
