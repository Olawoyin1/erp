import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiUpload,
  FiEye, FiClock, FiCheckCircle, FiAlertCircle,
  FiUsers, FiActivity,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchAttendance,
  fetchAttendanceStats,
  clockIn,
  clockOut,
  logAttendance,
  approveOvertime,
} from '../../../store/hr/attendanceSlice';

const ITEMS_PER_PAGE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '--:--';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function todayLabel() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getName(field) {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.fullName || field.name || '—';
}

function getLocation(field) {
  if (!field) return '—';
  if (typeof field === 'string') return field;
  return field.name || '—';
}

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

// ─── Status colour mapping ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  present:   { color: '#16A34A', bg: '#DCFCE7', label: 'Present' },
  late:      { color: '#D97706', bg: '#FEF3C7', label: 'Late' },
  completed: { color: '#1D4ED8', bg: '#EFF6FF', label: 'Completed' },
  absent:    { color: '#DC2626', bg: '#FEF2F2', label: 'Absent' },
  on_leave:  { color: '#7C3AED', bg: '#F5F3FF', label: 'On Leave' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#64748B', bg: '#F1F5F9', label: capitalize(status) };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
      color: cfg.color, backgroundColor: cfg.bg, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Log Attendance Drawer ────────────────────────────────────────────────────
function LogAttendanceDrawer({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    employeeId: '', locationId: '', date: todayISO(),
    clockIn: '', clockOut: '', status: 'completed', remarks: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.date || !form.status) return;
    setSubmitting(true);
    const payload = {
      employeeId: form.employeeId,
      date: form.date,
      status: form.status,
      ...(form.locationId && { locationId: form.locationId }),
      ...(form.clockIn && { clockIn: `${form.date}T${form.clockIn}:00.000Z` }),
      ...(form.clockOut && { clockOut: `${form.date}T${form.clockOut}:00.000Z` }),
      ...(form.remarks && { remarks: form.remarks }),
    };
    await onSubmit(payload);
    setSubmitting(false);
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#475569', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      <button type="submit" form="log-att-form" disabled={submitting} style={{ padding: '8px 22px', borderRadius: 6, border: 'none', backgroundColor: '#1D4ED8', color: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
        {submitting ? 'Logging…' : 'Log Attendance'}
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Log Attendance" subtitle="Manually record attendance for an employee" width="480px" footer={footer}>
      <form id="log-att-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Employee ID" required>
          <Input value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)} placeholder="MongoDB _id of employee" required />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Date" required>
            <DatePicker value={form.date} onChange={(e) => set('date', e.target.value)} />
          </FormField>
          <FormField label="Status" required>
            <Select value={form.status} onChange={(e) => set('status', e.target.value)}
              options={[
                { value: 'present', label: 'Present' },
                { value: 'late', label: 'Late' },
                { value: 'completed', label: 'Completed' },
                { value: 'absent', label: 'Absent' },
                { value: 'on_leave', label: 'On Leave' },
              ]}
            />
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Clock In (local)">
            <Input type="time" value={form.clockIn} onChange={(e) => set('clockIn', e.target.value)} />
          </FormField>
          <FormField label="Clock Out (local)">
            <Input type="time" value={form.clockOut} onChange={(e) => set('clockOut', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Remarks">
          <Textarea rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="e.g. Approved late start — generator maintenance delay" />
        </FormField>
      </form>
    </Drawer>
  );
}

// ─── Record Detail Modal ───────────────────────────────────────────────────────
function RecordDetailModal({ record, onClose, onApproveOvertime }) {
  if (!record) return null;
  const hasOvertime = record.overtimeHours > 0;
  const overtimeApproved = record.overtimeApproved;

  return (
    <Modal isOpen={true} onClose={onClose} title="Attendance Record" subtitle={`${getName(record.employeeId)} · ${fmtDate(record.date)}`} maxWidth="480px"
      footer={
        hasOvertime && !overtimeApproved ? (
          <button onClick={() => onApproveOvertime(record._id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: '#16A34A', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
            <FiCheckCircle size={14} /> Approve Overtime
          </button>
        ) : null
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          {[
            ['Employee',   getName(record.employeeId)],
            ['Date',       fmtDate(record.date)],
            ['Status',     <StatusBadge status={record.status} />],
            ['Location',   getLocation(record.locationId)],
            ['Clock In',   fmtTime(record.clockIn)],
            ['Clock Out',  fmtTime(record.clockOut)],
            ['Hours Worked', record.hoursWorked != null ? `${record.hoursWorked} hrs` : '—'],
            ['Overtime',   record.overtimeHours > 0 ? `${record.overtimeHours} hrs` : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
        {hasOvertime && (
          <div style={{ padding: '10px 14px', borderRadius: 6, backgroundColor: overtimeApproved ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${overtimeApproved ? '#BBF7D0' : '#FDE68A'}`, fontSize: '0.813rem', color: overtimeApproved ? '#166534' : '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            {overtimeApproved ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
            {overtimeApproved ? 'Overtime approved' : 'Overtime pending approval'}
          </div>
        )}
        {record.remarks && (
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Remarks</div>
            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{record.remarks}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendanceTimesheets() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { user } = useSelector((s) => s.auth);
  const { records, meta, stats, statsLoading, loading, clockedIn, clockedOut, todayRecord, clockLoading } = useSelector((s) => s.attendance);

  const [search, setSearch]         = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [logOpen, setLogOpen]       = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [dateFilter, setDateFilter] = useState(todayISO());

  // Load today's stats + today's attendance list on mount
  const loadData = useCallback(() => {
    dispatch(fetchAttendanceStats(dateFilter));
    dispatch(fetchAttendance({ page: currentPage, limit: ITEMS_PER_PAGE, date: dateFilter, ...(search ? { q: search } : {}) }));
  }, [dispatch, dateFilter, currentPage, search]);

  useEffect(() => {
    const t = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadData]);

  // ─── Clock In / Out ──────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    const result = await dispatch(clockIn());
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Clocked in successfully', 'success');
      loadData();
    } else {
      showToast(result.payload || 'Clock-in failed', 'error');
    }
  };

  const handleClockOut = async () => {
    const result = await dispatch(clockOut());
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Clocked out successfully', 'success');
      loadData();
    } else {
      showToast(result.payload || 'Clock-out failed', 'error');
    }
  };

  // ─── Log Attendance ──────────────────────────────────────────────────────────
  const handleLogSubmit = async (payload) => {
    const result = await dispatch(logAttendance(payload));
    if (result.meta.requestStatus === 'fulfilled') {
      setLogOpen(false);
      showToast('Attendance logged successfully', 'success');
      loadData();
    } else {
      showToast(result.payload || 'Log failed', 'error');
    }
  };

  // ─── Approve Overtime ────────────────────────────────────────────────────────
  const handleApproveOvertime = async (id) => {
    const result = await dispatch(approveOvertime(id));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Overtime approved', 'success');
      setViewRecord(null);
      loadData();
    } else {
      showToast(result.payload || 'Approval failed', 'error');
    }
  };

  // ─── Stat cards from API ─────────────────────────────────────────────────────
  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const statCards = [
    { title: 'PRESENT TODAY',  value: statMap.present ?? '—',   subtitle: 'Employees clocked in today',      icon: <FiUsers size={14} />,    color: '#16A34A', bg: '#D1FAE5' },
    { title: 'LATE ARRIVALS',  value: statMap.late ?? '—',      subtitle: 'Clocked in after scheduled time',  icon: <FiClock size={14} />,    color: '#D97706', bg: '#FEF3C7' },
    { title: 'ABSENT TODAY',   value: statMap.absent ?? '—',    subtitle: 'No attendance record for today',   icon: <FiAlertCircle size={14} />, color: '#DC2626', bg: '#FEE2E2' },
    { title: 'OVERTIME HOURS', value: statMap.overtime_hours != null ? `${statMap.overtime_hours} hrs` : '—',
      subtitle: 'Total approved overtime hours', icon: <FiActivity size={14} />, color: '#1D4ED8', bg: '#DBEAFE' },
  ];

  // ─── My status panel (current user) ─────────────────────────────────────────
  const myClockInTime  = todayRecord?.clockIn  ? fmtTime(todayRecord.clockIn)  : '--:--';
  const myClockOutTime = todayRecord?.clockOut ? fmtTime(todayRecord.clockOut) : '--:--';
  const myHoursWorked  = todayRecord?.hoursWorked != null ? `${todayRecord.hoursWorked} hrs` : '0 hrs';
  const myStatus       = todayRecord?.status || (clockedIn ? 'present' : null);

  // ─── Clock button state ──────────────────────────────────────────────────────
  let clockBtnLabel = 'Clock In';
  let clockBtnColor = '#10B981';
  let clockBtnHandler = handleClockIn;
  let clockBtnDisabled = clockLoading;
  if (clockedIn && !clockedOut) {
    clockBtnLabel = clockLoading ? 'Clocking Out…' : 'Clock Out';
    clockBtnColor = '#EF4444';
    clockBtnHandler = handleClockOut;
  } else if (clockedOut) {
    clockBtnLabel = 'Completed';
    clockBtnColor = '#64748B';
    clockBtnDisabled = true;
  } else if (clockLoading) {
    clockBtnLabel = 'Clocking In…';
  }

  // ─── Table columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'employeeId', label: 'EMPLOYEE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{getName(val)}</span>,
    },
    {
      key: 'employeeId', label: 'EMP ID',
      render: (val) => <span style={{ color: '#64748B', fontSize: '0.78rem' }}>{val?.employeeId || '—'}</span>,
    },
    {
      key: 'locationId', label: 'LOCATION',
      render: (val) => <span style={{ color: '#475569' }}>{getLocation(val)}</span>,
    },
    {
      key: 'clockIn', label: 'CLOCK IN', nowrap: true,
      render: (val) => <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem' }}>{fmtTime(val)}</span>,
    },
    {
      key: 'clockOut', label: 'CLOCK OUT', nowrap: true,
      render: (val) => <span style={{ color: '#475569', fontFamily: 'monospace', fontSize: '0.85rem' }}>{fmtTime(val)}</span>,
    },
    {
      key: 'hoursWorked', label: 'HRS WORKED',
      render: (val) => <span style={{ color: '#334155', fontWeight: 500 }}>{val != null ? `${val} hrs` : '—'}</span>,
    },
    {
      key: 'overtimeHours', label: 'OVERTIME',
      render: (val, row) => (
        <span style={{ color: val > 0 ? '#D97706' : '#94A3B8', fontWeight: val > 0 ? 600 : 400 }}>
          {val > 0 ? `${val} hrs${row.overtimeApproved ? ' ✓' : ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'STATUS',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: '__actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <button className="icon-btn" onClick={() => setViewRecord(row)} title="View Details">
          <FiEye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Attendance & Timesheets</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Monitor employee attendance, working hours, overtime, and site-based timesheet records
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      {/* My Attendance Panel (for current user's own clock-in) */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              Today's Attendance
            </span>
            <span style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 500 }}>{todayLabel()}</span>
          </div>
          <button
            onClick={clockBtnHandler}
            disabled={clockBtnDisabled}
            style={{ backgroundColor: clockBtnColor, color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '6px', fontWeight: 600, cursor: clockBtnDisabled ? 'not-allowed' : 'pointer', opacity: clockBtnDisabled && !clockedOut ? 0.7 : 1, fontSize: '0.875rem', transition: 'all 0.2s' }}
          >
            <FiClock size={15} /> {clockBtnLabel}
          </button>
        </div>

        <div style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: 16 }}>
          <span style={{ fontWeight: 600 }}>Staff Profile: </span>
          {user ? `${user.firstName} ${user.lastName}` : 'Current User'}
          <span style={{ color: '#94A3B8' }}> ({user?.roles?.[0] || '—'})</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Current Status',    value: myStatus ? <StatusBadge status={myStatus} /> : <span style={{ color: '#94A3B8' }}>Not Clocked In</span> },
            { label: 'Clock-In Time',     value: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: myClockInTime === '--:--' ? '#94A3B8' : '#0F172A' }}>{myClockInTime}</span> },
            { label: 'Clock-Out Time',    value: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: myClockOutTime === '--:--' ? '#94A3B8' : '#0F172A' }}>{myClockOutTime}</span> },
            { label: 'Total Hours Worked', value: <span style={{ fontWeight: 600, color: '#0F172A' }}>{myHoursWorked}</span> },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
              <div>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statCards.map((stat) => (
          <div key={stat.title} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.title}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
              {statsLoading ? '…' : stat.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
            Site Attendance — {fmtDate(dateFilter + 'T00:00:00.000Z')}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Date filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.813rem', color: '#334155', fontFamily: 'var(--font)', outline: 'none', cursor: 'pointer' }}
            />
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search employee, location..." style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }} onClick={() => showToast('Exporting…', 'info')}>
              Export <FiDownload size={14} />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setLogOpen(true)}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <FiClock size={14} /> Log Attendance
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading attendance records…</div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            keyField="_id"
            emptyMessage="No attendance records found for this date."
          />
        )}

        <Pagination currentPage={currentPage} totalPages={meta?.totalPages || 1} onPageChange={setCurrentPage} />
      </div>

      {/* Log Attendance Drawer */}
      <LogAttendanceDrawer isOpen={logOpen} onClose={() => setLogOpen(false)} onSubmit={handleLogSubmit} />

      {/* Record Detail Modal */}
      {viewRecord && (
        <RecordDetailModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onApproveOvertime={handleApproveOvertime}
        />
      )}
    </div>
  );
}
