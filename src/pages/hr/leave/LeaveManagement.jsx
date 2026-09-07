import React, { useState, useMemo, useRef } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiUpload,
  FiEye,
  FiMoreVertical,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiUploadCloud,
  FiUser,
  FiCalendar,
  FiChevronDown,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import { mockLeaves, LEAVE_TYPES, LEAVE_BALANCES, getApprovalHistory } from '../../../data/mockLeaves';

const ROWS_PER_PAGE = 10;

// ─── Leave Type colored text ──────────────────────────────────────────────────
const LEAVE_TYPE_COLORS = {
  Annual: '#1D4ED8',
  'Sick Leave': '#DC2626',
  'Maternity Leave': '#7C3AED',
  'Paternity Leave': '#0891B2',
  Emergency: '#EA580C',
  Compassionate: '#B45309',
  'Study Leave': '#059669',
  'Unpaid Leave': '#64748B',
};

// ─── Leave Request Details Drawer (Fixed to Right of Page) ─────────────────────
function LeaveDetailsDrawer({ leave, onClose, onApprove, onDecline }) {
  const history = getApprovalHistory(leave);
  const isPending = leave.status === 'Pending';

  const footer = isPending ? (
    <>
      <button
        onClick={() => onDecline(leave)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          fontSize: '0.84rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: '1px solid #FECACA',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        <FiX size={14} />
        Decline Request
      </button>
      <button
        onClick={() => onApprove(leave)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 18px',
          fontSize: '0.84rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#16A34A',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        <FiCheck size={14} />
        Approve Request
      </button>
    </>
  ) : (
    <button
      onClick={onClose}
      style={{
        padding: '8px 18px',
        fontSize: '0.84rem',
        fontWeight: 500,
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#fff',
        color: '#475569',
        cursor: 'pointer',
        fontFamily: 'var(--font)',
      }}
    >
      Close
    </button>
  );

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Leave Application Details"
      subtitle={`${leave.employee} • ${leave.id}`}
      width="540px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Status Bar */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>Current Status:</span>
            <Badge status={leave.status} />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
            Submitted: {leave.startDate}
          </span>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Department</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{leave.department}</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Leave Type</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: LEAVE_TYPE_COLORS[leave.leaveType] || '#1D4ED8', marginTop: '2px' }}>{leave.leaveType}</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Start Date</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{leave.startDate}</div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #F1F5F9', backgroundColor: '#FAFAFA' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>End Date</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>{leave.endDate}</div>
          </div>
        </div>

        {/* Reason Box */}
        {leave.reason && (
          <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Reason for Leave</div>
            <p style={{ fontSize: '0.83rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>{leave.reason}</p>
          </div>
        )}

        {/* Approval History Workflow */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
            Approval Workflow Timeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '16px' }}>
            <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#E2E8F0' }} />
            {history.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: item.status === 'Approved' ? '#16A34A' : item.status === 'Declined' ? '#DC2626' : '#F59E0B', border: '3px solid #FFF', boxShadow: '0 0 0 1px #E2E8F0', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>{item.date}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '1px' }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Decline Leave Modal ──────────────────────────────────────────────────────
function DeclineLeaveModal({ leave, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const footer = (
    <>
      <button
        onClick={onClose}
        style={{
          padding: '8px 16px',
          fontSize: '0.84rem',
          fontWeight: 500,
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#fff',
          color: '#475569',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        Cancel
      </button>
      <button
        onClick={() => onConfirm(reason)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          fontSize: '0.84rem',
          fontWeight: 600,
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#DC2626',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        <FiX size={14} />
        Decline Request
      </button>
    </>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Decline Leave Request?"
      subtitle={`Employee: ${leave.employee} • Leave Type: ${leave.leaveType}`}
      maxWidth="460px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
          Requested Dates: <span style={{ fontWeight: 600, color: '#0F172A' }}>{leave.startDate} – {leave.endDate}</span>
        </div>

        <FormField label="Reason for Declining" required>
          <Textarea
            rows={4}
            placeholder="Enter reason for declining this request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Apply for Leave Modal ────────────────────────────────────────────────────
function ApplyForLeaveModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    employeeName: 'Chioma Davids',
    employeeId: 'PGSL-012',
    department: 'Human Resources',
    position: 'HR Admin',
    leaveType: '',
    startDate: '',
    endDate: '',
    leaveBalance: '',
    reason: '',
  });
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = () => {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) return;
    onSubmit(form);
  };

  const departmentOptions = ['Engineering', 'HSE', 'Operations', 'Administration', 'Human Resources', 'Finance', 'Technical'];
  const positionOptions = ['HR Admin', 'Process Engineer', 'HSE Officer', 'Operations Lead', 'Admin Officer', 'Project Coordinator', 'Field Engineer'];
  const leaveTypeOptions = LEAVE_TYPES;
  const balanceOptions = form.leaveType
    ? [`${LEAVE_BALANCES[form.leaveType] || 0} days remaining`]
    : ['Select leave type first'];

  const footer = (
    <>
      <button
        onClick={onClose}
        style={{
          padding: '9px 18px',
          fontSize: '0.84rem',
          fontWeight: 500,
          borderRadius: '7px',
          border: '1px solid #E2E8F0',
          backgroundColor: '#fff',
          color: '#475569',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        style={{
          padding: '9px 20px',
          fontSize: '0.84rem',
          fontWeight: 600,
          borderRadius: '7px',
          border: 'none',
          backgroundColor: '#1D4ED8',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'var(--font)',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1E40AF')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
      >
        Submit Request
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Apply for Leave"
      subtitle="Submit a new employee leave application with documentation"
      width="540px"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Row 1: Employee Name + ID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Employee Name" required>
            <Input value={form.employeeName} onChange={(e) => set('employeeName', e.target.value)} />
          </FormField>
          <FormField label="Employee ID" required>
            <Input value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} />
          </FormField>
        </div>

        {/* Row 2: Department + Position */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Department" required>
            <Select
              options={departmentOptions}
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
            />
          </FormField>
          <FormField label="Position" required>
            <Select
              options={positionOptions}
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
            />
          </FormField>
        </div>

        {/* Row 3: Leave Type + Start Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Leave Type" required>
            <Select
              options={leaveTypeOptions}
              value={form.leaveType}
              onChange={(e) => set('leaveType', e.target.value)}
              placeholder="Select leave type"
            />
          </FormField>
          <FormField label="Start Date" required>
            <DatePicker
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </FormField>
        </div>

        {/* Row 4: End Date + Leave Balance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="End Date" required>
            <DatePicker
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </FormField>
          <FormField label="Leave Balance" required>
            <Select
              options={balanceOptions}
              value={form.leaveBalance || balanceOptions[0]}
              onChange={(e) => set('leaveBalance', e.target.value)}
              disabled={!form.leaveType}
            />
          </FormField>
        </div>

        {/* Reason */}
        <FormField label="Reason for Leave" required>
          <Textarea
            rows={3}
            placeholder="Provide brief explanation or medical reason for the leave request..."
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
          />
        </FormField>

        {/* File Upload */}
        <FormField label="Attach Documents (Optional)">
          <FileUpload
            value={file}
            onChange={(f) => setFile(f)}
            subtext="Medical certificate, flight tickets, or travel clearance"
          />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
function RowActions({ leave, onView, onApprove, onDecline }) {
  const [open, setOpen] = useState(false);
  const isPending = leave.status === 'Pending';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '4px',
        width: '60px',
      }}
    >
      {/* Left Slot: Eye icon for view details (always in left position) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(leave);
        }}
        title="View Details"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#1D4ED8';
          e.currentTarget.style.backgroundColor = '#EFF6FF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748B';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <FiEye size={16} />
      </button>

      {/* Right Slot: 3-dot menu icon if Pending, otherwise a blank 28px placeholder */}
      {isPending ? (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((p) => !p);
            }}
            title="More Actions"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#0F172A';
              e.currentTarget.style.backgroundColor = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FiMoreVertical size={16} />
          </button>

          {open && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 900 }}
                onClick={() => setOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 4px)',
                  zIndex: 950,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
                  padding: '4px',
                  minWidth: '140px',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onApprove(leave);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#16A34A',
                    borderRadius: '6px',
                    fontFamily: 'var(--font)',
                    transition: 'background 0.12s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FiCheck size={14} />
                  Approve
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onDecline(leave);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#DC2626',
                    borderRadius: '6px',
                    fontFamily: 'var(--font)',
                    transition: 'background 0.12s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FiX size={14} />
                  Decline
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Blank Placeholder preserving position of 3-dot slot */
        <div style={{ width: '28px', height: '28px', flexShrink: 0 }} />
      )}
    </div>
  );
}

// ─── Main Leave Management Page ───────────────────────────────────────────────
export default function LeaveManagement() {
  const [leaves, setLeaves] = useState(mockLeaves);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailsLeave, setDetailsLeave] = useState(null);
  const [declineLeave, setDeclineLeave] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leaves.filter(
      (l) =>
        l.employee.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        l.department.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
    );
  }, [leaves, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  // Approve handler
  const handleApprove = (leave) => {
    setLeaves((prev) =>
      prev.map((l) => (l.id === leave.id && l.employee === leave.employee ? { ...l, status: 'Approved' } : l))
    );
    setDetailsLeave(null);
    showToast('Leave approved successfully', 'success');
  };

  // Initiate decline
  const handleDeclineInit = (leave) => {
    setDetailsLeave(null);
    setDeclineLeave(leave);
  };

  // Confirm decline
  const handleDeclineConfirm = () => {
    if (declineLeave) {
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === declineLeave.id && l.employee === declineLeave.employee
            ? { ...l, status: 'Declined' }
            : l
        )
      );
      setDeclineLeave(null);
      showToast('Leave declined successfully', 'success');
    }
  };

  // Apply for leave submit
  const handleApplySubmit = (formData) => {
    const newLeave = {
      id: `LV-${String(leaves.length + 1).padStart(3, '0')}`,
      employee: formData.employeeName,
      department: formData.department,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration: '—',
      approvedBy: 'Pending Review',
      status: 'Pending',
      reason: formData.reason,
      submittedBy: formData.employeeName,
      employeeId: formData.employeeId,
      position: formData.position,
    };
    setLeaves((prev) => [newLeave, ...prev]);
    setShowApplyModal(false);
    showToast('Leave request submitted successfully', 'success');
  };

  // Select helpers
  const handleSelectAll = () => {
    if (paginated.every((r) => selectedIds.includes(r.id + r.employee))) {
      setSelectedIds((p) => p.filter((id) => !paginated.some((r) => r.id + r.employee === id)));
    } else {
      setSelectedIds((p) => [...new Set([...p, ...paginated.map((r) => r.id + r.employee)])]);
    }
  };
  const handleSelectRow = (id) => {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  // Columns
  const columns = [
    {
      key: 'id',
      label: 'Leave ID',
      nowrap: true,
      render: (val) => (
        <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>{val}</span>
      ),
    },
    {
      key: 'employee',
      label: 'Employee',
      render: (val) => (
        <span style={{ fontWeight: 500, color: '#0F172A' }}>{val}</span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      key: 'leaveType',
      label: 'Leave Type',
      render: (val) => (
        <span
          style={{
            fontWeight: 500,
            color: LEAVE_TYPE_COLORS[val] || '#1D4ED8',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'startDate',
      label: 'Start Date',
      nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      key: 'endDate',
      label: 'End Date',
      nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      key: 'duration',
      label: 'Duration',
      nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      key: 'approvedBy',
      label: 'Approved By',
      render: (val) => <span style={{ color: '#475569' }}>{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <Badge status={val} />,
    },
    {
      key: '__actions',
      label: 'Actions',
      align: 'right',
      render: (_, row) => (
        <RowActions
          leave={row}
          onView={setDetailsLeave}
          onApprove={handleApprove}
          onDecline={handleDeclineInit}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast - top right like in screenshots */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            color: '#166534',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            fontFamily: 'var(--font)',
            fontSize: '0.85rem',
            fontWeight: 500,
            animation: 'slideInRight 0.25s ease',
            minWidth: '260px',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FiCheck size={11} color="#fff" />
          </div>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={hideToast}
            style={{
              background: 'none',
              border: 'none',
              color: '#166534',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <FiX size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Leave Management</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track, approve, and manage employee leave requests and absence records
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Search */}
          <div style={{ position: 'relative', width: '320px' }}>
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search employee, type, status..."
              style={{ paddingLeft: '36px' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiDownload size={14} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowApplyModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none' }}
            >
              <FiPlus size={14} /> Apply for Leave
            </button>
          </div>
        </div>

      {/* Table */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No leave requests found."
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Leave Details Drawer (Right-side slide-over panel) */}
      {detailsLeave && (
        <LeaveDetailsDrawer
          leave={detailsLeave}
          onClose={() => setDetailsLeave(null)}
          onApprove={handleApprove}
          onDecline={handleDeclineInit}
        />
      )}

      {/* Decline Confirmation Modal */}
      {declineLeave && (
        <DeclineLeaveModal
          leave={declineLeave}
          onClose={() => setDeclineLeave(null)}
          onConfirm={handleDeclineConfirm}
        />
      )}

      {/* Apply for Leave Modal */}
      {showApplyModal && (
        <ApplyForLeaveModal
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
}
