import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiUpload,
  FiEye, FiMoreVertical, FiCheck, FiX, FiAlertCircle,
  FiUser, FiCalendar, FiEdit2,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker, FileUpload } from '../../../components/ui/FormField';
import {
  fetchLeaves,
  fetchLeaveStats,
  fetchLeaveBalances,
  approveLeave,
  declineLeave as declineLeaveThunk,
  requestLeaveChanges,
  createLeave,
} from '../../../store/hr/leaveSlice';

const ROWS_PER_PAGE = 10;

// ─── Leave type display colors ────────────────────────────────────────────────
const LEAVE_TYPE_COLORS = {
  Annual:         '#1D4ED8',
  'Sick':         '#DC2626',
  'Maternity':    '#7C3AED',
  'Paternity':    '#0891B2',
  Emergency:      '#EA580C',
  Compassionate:  '#B45309',
  Study:          '#059669',
  Unpaid:         '#64748B',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Resolve a populated field — API may return an object or just an id string
function getName(field) {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.fullName || field.name || '—';
}

function getLeaveTypeName(field) {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.name || '—';
}

function getDeptName(emp) {
  if (!emp) return '—';
  const dept = emp.departmentId;
  if (!dept) return '—';
  if (typeof dept === 'string') return dept;
  return dept.name || '—';
}

// ─── Leave Request Details Modal ──────────────────────────────────────────────
function LeaveDetailsModal({ leave, onClose, onApprove, onDecline, onRequestChanges }) {
  const [changesMsg, setChangesMsg] = useState('');
  const [showChanges, setShowChanges] = useState(false);
  const isPending = leave.status === 'pending';

  const handleRequestChanges = () => {
    if (!changesMsg.trim()) return;
    onRequestChanges(leave._id, changesMsg);
    setShowChanges(false);
    setChangesMsg('');
  };

  const approvalHistory = [];
  if (leave.createdAt) {
    approvalHistory.push({
      date: fmtDate(leave.createdAt),
      title: 'Leave Requested',
      description: `By ${getName(leave.employeeId)}`,
      color: '#1D4ED8',
    });
  }
  if (leave.decidedAt) {
    approvalHistory.push({
      date: fmtDate(leave.decidedAt),
      title: leave.status === 'approved' ? 'Approved' : 'Declined',
      description: `By ${getName(leave.decidedBy)}`,
      color: leave.status === 'approved' ? '#16A34A' : '#DC2626',
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15,23,42,0.45)' }} />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 1001,
        width: '100%', maxWidth: '500px',
        backgroundColor: '#fff', borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: 'var(--font)', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUser size={16} color="#1D4ED8" />
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>Leave Request Details</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '1px' }}>
                  {getName(leave.employeeId)} &bull; {leave.leaveId}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}>
              <FiX size={18} />
            </button>
          </div>

          {/* Status + Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
            <span style={{
              padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
              backgroundColor: leave.status === 'approved' ? '#DCFCE7' : leave.status === 'declined' ? '#FEE2E2' : '#FEF9C3',
              color: leave.status === 'approved' ? '#166534' : leave.status === 'declined' ? '#991B1B' : '#854D0E',
            }}>
              {capitalize(leave.status)}
            </span>

            {isPending && (
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                <button onClick={() => onApprove(leave._id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '0.81rem', fontWeight: 600, borderRadius: '6px', border: 'none', backgroundColor: '#16A34A', color: '#fff', cursor: 'pointer' }}>
                  <FiCheck size={13} /> Approve
                </button>
                <button onClick={() => onDecline(leave)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '0.81rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #FECACA', backgroundColor: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}>
                  <FiX size={13} /> Reject
                </button>
                <button onClick={() => setShowChanges((v) => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 14px', fontSize: '0.81rem', fontWeight: 500, borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}>
                  <FiEdit2 size={13} /> Request Changes
                </button>
              </div>
            )}
          </div>

          {/* Request Changes inline form */}
          {showChanges && (
            <div style={{ marginTop: 12, padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <textarea
                value={changesMsg}
                onChange={(e) => setChangesMsg(e.target.value)}
                placeholder="Describe what changes are needed..."
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.813rem', fontFamily: 'var(--font)', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => setShowChanges(false)} style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleRequestChanges} disabled={!changesMsg.trim()} style={{ padding: '5px 12px', borderRadius: 5, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: changesMsg.trim() ? 1 : 0.5 }}>Send</button>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            {[
              { label: 'EMPLOYEE',   value: getName(leave.employeeId) },
              { label: 'LEAVE TYPE', value: getLeaveTypeName(leave.leaveTypeId) },
              { label: 'START DATE', value: fmtDate(leave.startDate) },
              { label: 'END DATE',   value: fmtDate(leave.endDate) },
              { label: 'DURATION',   value: leave.durationDays ? `${leave.durationDays} day${leave.durationDays !== 1 ? 's' : ''}` : '—' },
              { label: 'STATUS',     value: capitalize(leave.status) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 400 }}>{value}</div>
              </div>
            ))}
          </div>

          {leave.reason && (
            <div>
              <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>REASON</div>
              <div style={{ padding: '12px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                {leave.reason}
              </div>
            </div>
          )}

          {/* Approval History */}
          <div>
            <div style={{ fontSize: '0.688rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>APPROVAL HISTORY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '12px' }}>
              <div style={{ position: 'absolute', left: '5px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#E2E8F0' }} />
              {approvalHistory.length === 0 && (
                <div style={{ fontSize: '0.813rem', color: '#94A3B8', paddingLeft: 4 }}>No history yet.</div>
              )}
              {approvalHistory.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0, marginTop: '3px', backgroundColor: item.color }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.date}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A', marginTop: '1px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '1px' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Decline Leave Modal ──────────────────────────────────────────────────────
function DeclineLeaveModal({ leave, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const footer = (
    <>
      <button onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.84rem', fontWeight: 500, borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
      <button
        onClick={() => reason.trim() && onConfirm(reason)}
        disabled={!reason.trim()}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '6px', border: 'none', backgroundColor: '#DC2626', color: '#fff', cursor: reason.trim() ? 'pointer' : 'not-allowed', opacity: reason.trim() ? 1 : 0.5, fontFamily: 'var(--font)' }}
      >
        <FiX size={14} /> Decline Request
      </button>
    </>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Decline Leave Request?" subtitle={`Employee: ${getName(leave.employeeId)} • ${getLeaveTypeName(leave.leaveTypeId)}`} maxWidth="460px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
          Requested Dates: <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmtDate(leave.startDate)} – {fmtDate(leave.endDate)}</span>
        </div>
        <FormField label="Reason for Declining" required>
          <Textarea rows={4} placeholder="Enter reason for declining this request..." value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Apply for Leave Drawer ───────────────────────────────────────────────────
function ApplyForLeaveDrawer({ onClose, onSubmit, balances, balancesLoading, authEmployee }) {
  const [form, setForm] = useState({
    leaveTypeId: '',
    leaveTypeName: '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [file, setFile] = useState(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Build leave type options from balances (which carry leaveTypeId)
  const typeOptions = balances.map((b) => ({
    value: b.leaveTypeId?._id || b.leaveTypeId,
    label: b.leaveTypeId?.name || b.leaveTypeId || '—',
    remaining: b.remainingDays,
  }));

  const selectedBalance = balances.find((b) => (b.leaveTypeId?._id || b.leaveTypeId) === form.leaveTypeId);

  const handleSubmit = () => {
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason) return;
    onSubmit({
      employeeId: authEmployee?._id || authEmployee,
      leaveTypeId: form.leaveTypeId,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    });
  };

  const footer = (
    <>
      <button onClick={onClose} style={{ padding: '9px 18px', fontSize: '0.84rem', fontWeight: 500, borderRadius: '7px', border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
      <button onClick={handleSubmit} style={{ padding: '9px 20px', fontSize: '0.84rem', fontWeight: 600, borderRadius: '7px', border: 'none', backgroundColor: '#1D4ED8', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font)' }}>
        Submit Request
      </button>
    </>
  );

  return (
    <Drawer isOpen={true} onClose={onClose} title="Apply for Leave" subtitle="Submit a new leave application" width="540px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Leave Type */}
        <FormField label="Leave Type" required>
          {balancesLoading ? (
            <div style={{ padding: '10px', color: '#94A3B8', fontSize: '0.813rem' }}>Loading your leave balances…</div>
          ) : typeOptions.length > 0 ? (
            <Select
              value={form.leaveTypeId}
              onChange={(e) => {
                const opt = typeOptions.find((o) => o.value === e.target.value);
                set('leaveTypeId', e.target.value);
                set('leaveTypeName', opt?.label || '');
              }}
              options={[{ value: '', label: 'Select leave type' }, ...typeOptions.map((o) => ({ value: o.value, label: `${o.label} (${o.remaining} days remaining)` }))]}
            />
          ) : (
            <Select
              value={form.leaveTypeId}
              onChange={(e) => set('leaveTypeId', e.target.value)}
              options={['Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Study', 'Unpaid', 'Compassionate']}
              placeholder="Select leave type"
            />
          )}
        </FormField>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="Start Date" required>
            <DatePicker value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </FormField>
          <FormField label="End Date" required>
            <DatePicker value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </FormField>
        </div>

        {/* Balance display */}
        {selectedBalance && (
          <div style={{ padding: '10px 14px', backgroundColor: '#EFF6FF', borderRadius: 6, border: '1px solid #BFDBFE', fontSize: '0.813rem', color: '#1D4ED8' }}>
            <strong>{selectedBalance.remainingDays}</strong> of <strong>{selectedBalance.allocatedDays}</strong> days remaining — <strong>{selectedBalance.usedDays}</strong> used
          </div>
        )}

        {/* Reason */}
        <FormField label="Reason for Leave" required>
          <Textarea rows={3} placeholder="Provide a brief explanation for your leave request..." value={form.reason} onChange={(e) => set('reason', e.target.value)} />
        </FormField>

        {/* File Upload */}
        <FormField label="Attach Documents (Optional)">
          <FileUpload value={file} onChange={(f) => setFile(f)} subtext="Medical certificate, flight tickets, or travel clearance" />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────
function RowActions({ leave, onView, onApprove, onDecline }) {
  const [open, setOpen] = useState(false);
  const isPending = leave.status === 'pending';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', width: '60px' }}>
      <button onClick={() => onView(leave)} title="View Details"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', transition: 'all 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#1D4ED8'; e.currentTarget.style.backgroundColor = '#EFF6FF'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <FiEye size={16} />
      </button>

      {isPending ? (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', transition: 'all 0.15s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <FiMoreVertical size={16} />
          </button>
          {open && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={() => setOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 950, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', padding: '4px', minWidth: '140px' }}>
                <button onClick={() => { setOpen(false); onApprove(leave._id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '0.82rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: '#16A34A', borderRadius: '6px', fontFamily: 'var(--font)', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FiCheck size={14} /> Approve
                </button>
                <button onClick={() => { setOpen(false); onDecline(leave); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', fontSize: '0.82rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', borderRadius: '6px', fontFamily: 'var(--font)', textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <FiX size={14} /> Decline
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ width: '28px', height: '28px', flexShrink: 0 }} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeaveManagement() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useSelector((s) => s.auth);
  const { leaves, meta, stats, balances, loading, balancesLoading } = useSelector((s) => s.leave);

  const [search, setSearch]               = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [detailsLeave, setDetailsLeave]   = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Load leave requests (server-side search + pagination)
  const loadLeaves = useCallback(() => {
    dispatch(fetchLeaves({ page: currentPage, limit: ROWS_PER_PAGE, q: search || undefined }));
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    const t = setTimeout(loadLeaves, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLeaves]);

  // Stats on mount
  useEffect(() => {
    dispatch(fetchLeaveStats());
  }, [dispatch]);

  // Load balances when the apply form opens (for the leave type picker)
  useEffect(() => {
    if (showApplyModal && user?.employeeId) {
      dispatch(fetchLeaveBalances({ employeeId: user.employeeId, year: new Date().getFullYear() }));
    }
  }, [showApplyModal, dispatch, user]);

  // Approve
  const handleApprove = async (id) => {
    setDetailsLeave(null);
    const result = await dispatch(approveLeave(id));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Leave approved successfully', 'success');
      loadLeaves();
    } else {
      showToast(result.payload || 'Approval failed', 'error');
    }
  };

  // Initiate decline
  const handleDeclineInit = (leave) => {
    setDetailsLeave(null);
    setDeclineTarget(leave);
  };

  // Confirm decline
  const handleDeclineConfirm = async (reason) => {
    const result = await dispatch(declineLeaveThunk({ id: declineTarget._id, reason }));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Leave declined successfully', 'success');
      setDeclineTarget(null);
      loadLeaves();
    } else {
      showToast(result.payload || 'Decline failed', 'error');
      setDeclineTarget(null);
    }
  };

  // Request changes
  const handleRequestChanges = async (id, message) => {
    const result = await dispatch(requestLeaveChanges({ id, message }));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Change request sent to employee', 'success');
      setDetailsLeave(null);
    } else {
      showToast(result.payload || 'Failed to send request', 'error');
    }
  };

  // Submit new leave request
  const handleApplySubmit = async (payload) => {
    const result = await dispatch(createLeave(payload));
    if (result.meta.requestStatus === 'fulfilled') {
      setShowApplyModal(false);
      showToast('Leave request submitted successfully', 'success');
      loadLeaves();
    } else {
      showToast(result.payload || 'Submission failed', 'error');
    }
  };

  const handleSelectAll  = () => selectedIds.length === leaves.length ? setSelectedIds([]) : setSelectedIds(leaves.map((r) => r._id));
  const handleSelectRow  = (id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ─── Stat cards ───────────────────────────────────────────────────────────
  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const statCards = [
    { label: 'Pending',  value: statMap.pending  ?? '—', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Approved', value: statMap.approved ?? '—', color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Declined', value: statMap.declined ?? '—', color: '#DC2626', bg: '#FEF2F2' },
  ];

  // ─── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'leaveId', label: 'Leave ID', nowrap: true,
      render: (val) => <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>{val}</span>,
    },
    {
      key: 'employeeId', label: 'Employee',
      render: (val) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{getName(val)}</span>,
    },
    {
      key: 'employeeId', label: 'Department',
      render: (val) => <span style={{ color: '#475569' }}>{getDeptName(val)}</span>,
    },
    {
      key: 'leaveTypeId', label: 'Leave Type',
      render: (val) => {
        const name = getLeaveTypeName(val);
        return <span style={{ fontWeight: 500, color: LEAVE_TYPE_COLORS[name] || '#1D4ED8' }}>{name}</span>;
      },
    },
    {
      key: 'startDate', label: 'Start Date', nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{fmtDate(val)}</span>,
    },
    {
      key: 'endDate', label: 'End Date', nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{fmtDate(val)}</span>,
    },
    {
      key: 'durationDays', label: 'Duration', nowrap: true,
      render: (val) => <span style={{ color: '#475569' }}>{val ? `${val} day${val !== 1 ? 's' : ''}` : '—'}</span>,
    },
    {
      key: 'decidedBy', label: 'Approved By',
      render: (val) => <span style={{ color: '#475569' }}>{getName(val) !== '—' ? getName(val) : 'Pending Review'}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (val) => <Badge status={capitalize(val)} />,
    },
    {
      key: '__actions', label: 'Actions', align: 'right',
      render: (_, row) => (
        <RowActions leave={row} onView={setDetailsLeave} onApprove={handleApprove} onDecline={handleDeclineInit} />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Leave Management</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Track, approve, and manage employee leave requests and absence records
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {statCards.map((s) => (
          <div key={s.label} style={{ backgroundColor: s.bg, border: `1px solid ${s.color}22`, borderRadius: 10, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search employee, type, status..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
            <button className="btn btn-primary" onClick={() => setShowApplyModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none' }}>
              <FiPlus size={14} /> Apply for Leave
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading leave requests…</div>
        ) : (
          <DataTable
            columns={columns}
            data={leaves}
            selectable
            selectedIds={selectedIds}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            keyField="_id"
            emptyMessage="No leave requests found."
          />
        )}

        <Pagination currentPage={currentPage} totalPages={meta?.totalPages || 1} onPageChange={setCurrentPage} />
      </div>

      {/* Details Modal */}
      {detailsLeave && (
        <LeaveDetailsModal
          leave={detailsLeave}
          onClose={() => setDetailsLeave(null)}
          onApprove={handleApprove}
          onDecline={handleDeclineInit}
          onRequestChanges={handleRequestChanges}
        />
      )}

      {/* Decline Confirmation */}
      {declineTarget && (
        <DeclineLeaveModal
          leave={declineTarget}
          onClose={() => setDeclineTarget(null)}
          onConfirm={handleDeclineConfirm}
        />
      )}

      {/* Apply for Leave Drawer */}
      {showApplyModal && (
        <ApplyForLeaveDrawer
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
          balances={balances}
          balancesLoading={balancesLoading}
          authEmployee={user?.employeeId}
        />
      )}
    </div>
  );
}
