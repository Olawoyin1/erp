import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiClock, FiCheckCircle, FiAlertCircle, FiUsers, FiActivity, FiLogIn, FiLogOut } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, DatePicker } from '../../../components/ui/FormField';
import {
  fetchAttendance, fetchAttendanceStats, clockIn, clockOut, logAttendance, approveOvertime,
} from '../../../store/hr/attendanceSlice';
import { attendanceService } from '../../../services/hr.service';
import { selectCurrentUser } from '../../../store/authSlice';
import { apiError, titleCase } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { saveBlob, blobErrorMessage, fullName } from '../hrUtils';
import ImportDialog from '../ImportDialog';
import LogAttendanceDrawer from './LogAttendanceDrawer';
import { lagosToday, fmtTime, fmtDay, fmtHours, longDay } from './attendanceUtils';

const ITEMS_PER_PAGE = 10;
const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

const STATUS_CONFIG = {
  present:   { color: '#16A34A', bg: '#DCFCE7', label: 'Present' },
  late:      { color: '#D97706', bg: '#FEF3C7', label: 'Late' },
  completed: { color: '#1D4ED8', bg: '#EFF6FF', label: 'Completed' },
  absent:    { color: '#DC2626', bg: '#FEF2F2', label: 'Absent' },
  on_leave:  { color: '#7C3AED', bg: '#F5F3FF', label: 'On Leave' },
};
const STATUS_FILTERS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_CONFIG).map(([value, c]) => ({ value, label: c.label }))];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#64748B', bg: '#F1F5F9', label: titleCase(status) };
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, color: cfg.color, backgroundColor: cfg.bg, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
}

function RecordDetailModal({ record, canApprove, ownRecord, onClose, onApproveOvertime }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasOvertime = record.overtimeHours > 0;
  const emp = record.employeeId || {};

  const approve = async () => {
    setBusy(true);
    setError('');
    const message = await onApproveOvertime(record._id);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <Modal isOpen onClose={onClose} title={fullName(emp)} subtitle={emp.employeeId} maxWidth="520px"
      footer={hasOvertime && !record.overtimeApproved && canApprove && !ownRecord ? (
        <button onClick={approve} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 6, border: 'none', backgroundColor: '#16A34A', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
          <FiCheckCircle size={14} /> {busy ? 'Approving…' : 'Approve Overtime'}
        </button>
      ) : null}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Status: <StatusBadge status={record.status} /></div>
        {error && <div style={{ padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
          {[
            ['EMPLOYEE', fullName(emp)], ['EMPLOYEE ID', emp.employeeId],
            ['DEPARTMENT', record.departmentName || emp.departmentId?.name], ['POSITION', emp.position],
            ['DATE', fmtDay(record.date)], ['LOCATION', record.locationId?.name],
            ['CLOCK IN', fmtTime(record.clockIn)], ['CLOCK OUT', fmtTime(record.clockOut)],
            ['HOURS WORKED', fmtHours(record.hoursWorked)], ['OVERTIME', hasOvertime ? fmtHours(record.overtimeHours) : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value || '—'}</div>
            </div>
          ))}
        </div>
        {hasOvertime && (
          <div style={{ padding: '10px 14px', borderRadius: 6, backgroundColor: record.overtimeApproved ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${record.overtimeApproved ? '#BBF7D0' : '#FDE68A'}`, fontSize: '0.813rem', color: record.overtimeApproved ? '#166534' : '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            {record.overtimeApproved ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
            {record.overtimeApproved ? 'Overtime approved' : ownRecord ? 'Overtime pending approval by someone else' : 'Overtime pending approval'}
          </div>
        )}
        {record.remarks && (
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6 }}>REMARKS</div>
            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>{record.remarks}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function FilterDrawer({ onClose, value, locations, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter attendance" width="380px"
      footer={
        <>
          <button onClick={() => { onApply({ status: '', locationId: '' }); onClose(); }} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Status"><Select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} options={STATUS_FILTERS} /></FormField>
        <FormField label="Location">
          <Select value={draft.locationId} searchable onChange={(e) => setDraft((d) => ({ ...d, locationId: e.target.value }))}
            options={[{ value: '', label: 'All locations' }, ...locations.map((l) => ({ value: l._id, label: l.name }))]} />
        </FormField>
      </div>
    </Drawer>
  );
}

export default function AttendanceTimesheets() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const user = useSelector(selectCurrentUser);
  const { records, meta, stats, statsLoading, loading, error: loadError } = useSelector((s) => s.attendance);
  const ownEmployeeId = idOf(user?.employeeId) || '';

  const canClock = usePermission('hr.attendance.create');
  const canLog = usePermission('hr.attendance.log');
  const canApprove = usePermission('hr.attendance.approve');

  const today = lagosToday();
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [logOpen, setLogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [dateFilter, setDateFilter] = useState(today);
  const [filters, setFilters] = useState({ status: '', locationId: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [clockLocation, setClockLocation] = useState('');
  const [clockBusy, setClockBusy] = useState(false);
  const [mine, setMine] = useState({ record: null, loading: !!ownEmployeeId, error: '' });
  const [mineTick, setMineTick] = useState(0);
  const debounceRef = useRef(null);

  const listParams = useCallback(() => ({
    page: currentPage, limit: ITEMS_PER_PAGE, date: dateFilter,
    ...(activeSearch ? { q: activeSearch } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.locationId ? { locationId: filters.locationId } : {}),
  }), [currentPage, dateFilter, activeSearch, filters]);

  const reload = useCallback(() => {
    dispatch(fetchAttendance(listParams()));
    dispatch(fetchAttendanceStats(dateFilter));
    setMineTick((n) => n + 1);
  }, [dispatch, listParams, dateFilter]);

  useEffect(() => { dispatch(fetchAttendance(listParams())); }, [dispatch, listParams]);
  useEffect(() => { dispatch(fetchAttendanceStats(dateFilter)); }, [dispatch, dateFilter]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    let cancelled = false;
    attendanceService.locations()
      .then((res) => { if (!cancelled) setLocations(res.data?.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ownEmployeeId) return undefined;
    let cancelled = false;
    attendanceService.list({ employeeId: ownEmployeeId, date: today, limit: 1 })
      .then((res) => { if (!cancelled) setMine({ record: res.data?.data?.[0] || null, loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setMine({ record: null, loading: false, error: apiError(err, 'Your attendance could not be loaded') }); });
    return () => { cancelled = true; };
  }, [ownEmployeeId, today, mineTick]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setCurrentPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const myRecord = mine.record;
  const clockedIn = !!myRecord?.clockIn;
  const clockedOut = !!myRecord?.clockOut;

  const handleClock = async () => {
    setClockBusy(true);
    if (clockedIn && !clockedOut) {
      const result = await dispatch(clockOut());
      if (clockOut.fulfilled.match(result)) showToast('Clocked out successfully', 'success');
      else showToast(result.payload?.message || 'Clock-out failed', 'error');
    } else {
      if (!clockLocation) { showToast('Choose your location before clocking in', 'error'); setClockBusy(false); return; }
      const result = await dispatch(clockIn(clockLocation));
      if (clockIn.fulfilled.match(result)) showToast('Clocked in successfully', 'success');
      else showToast(result.payload?.message || 'Clock-in failed', 'error');
    }
    setClockBusy(false);
    reload();
  };

  const handleLog = async (body) => {
    const result = await dispatch(logAttendance(body));
    if (logAttendance.fulfilled.match(result)) {
      setLogOpen(false);
      showToast('Attendance logged successfully', 'success');
      reload();
      return undefined;
    }
    return result.payload || { message: 'Log failed', details: [] };
  };

  const handleApproveOvertime = async (id) => {
    const result = await dispatch(approveOvertime(id));
    if (approveOvertime.fulfilled.match(result)) {
      showToast('Overtime approved', 'success');
      setViewId(null);
      reload();
      return '';
    }
    return result.payload?.message || 'Approval failed';
  };

  const handleExport = async () => {
    try {
      const params = { date: dateFilter };
      if (activeSearch) params.q = activeSearch;
      if (filters.status) params.status = filters.status;
      if (filters.locationId) params.locationId = filters.locationId;
      const res = await attendanceService.exportList(params);
      saveBlob(res.data, `attendance-${dateFilter}.csv`);
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const isToday = dateFilter === today;
  const statCards = [
    { title: isToday ? 'PRESENT TODAY' : 'PRESENT', value: statMap.present, subtitle: 'Employees successfully clocked in', icon: <FiUsers size={14} />, color: '#16A34A', bg: '#D1FAE5' },
    { title: 'LATE ARRIVALS', value: statMap.late, subtitle: 'Clocked in after scheduled start time', icon: <FiClock size={14} />, color: '#D97706', bg: '#FEF3C7' },
    { title: isToday ? 'ABSENT TODAY' : 'ABSENT', value: statMap.absent, subtitle: 'Recorded as absent', icon: <FiAlertCircle size={14} />, color: '#DC2626', bg: '#FEE2E2' },
    { title: 'OVERTIME HOURS', value: statMap.overtime_hours != null ? `${statMap.overtime_hours} hrs` : undefined, subtitle: 'Total approved overtime hours', icon: <FiActivity size={14} />, color: '#1D4ED8', bg: '#DBEAFE' },
  ];

  const viewRecord = records.find((r) => r._id === viewId);
  const filterCount = Object.values(filters).filter(Boolean).length;

  const columns = [
    { key: 'emp', label: 'EMPLOYEE ID', render: (_, row) => <span style={{ color: '#475569', fontSize: '0.78rem' }}>{row.employeeId?.employeeId || '—'}</span> },
    { key: 'name', label: 'EMPLOYEE', render: (_, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName(row.employeeId)}</span> },
    { key: 'locationId', label: 'LOCATION', render: (v) => <span style={{ color: '#475569' }}>{v?.name || '—'}</span> },
    { key: 'clockIn', label: 'CLOCK IN', nowrap: true, render: (v) => <span style={{ color: '#0F172A', fontSize: '0.85rem' }}>{v ? fmtTime(v) : '-'}</span> },
    { key: 'clockOut', label: 'CLOCK OUT', nowrap: true, render: (v) => <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v ? fmtTime(v) : '-'}</span> },
    { key: 'hoursWorked', label: 'HOURS WORKED', render: (v) => <span style={{ color: '#334155', fontWeight: 500 }}>{v != null ? fmtHours(v) : '—'}</span> },
    {
      key: 'overtimeHours', label: 'OVERTIME',
      render: (v, row) => <span style={{ color: v > 0 ? '#D97706' : '#94A3B8', fontWeight: v > 0 ? 600 : 400 }}>{v > 0 ? `${fmtHours(v)}${row.overtimeApproved ? ' (approved)' : ''}` : '—'}</span>,
    },
    { key: 'status', label: 'STATUS', render: (v) => <StatusBadge status={v} /> },
    { key: '__actions', label: 'ACTIONS', align: 'right', render: (_, row) => <button className="icon-btn" onClick={() => setViewId(row._id)} title="View Details"><FiEye size={15} /></button> },
  ];

  let clockLabel = 'Clock In';
  let clockColor = '#059669';
  let ClockIcon = FiLogIn;
  if (clockedIn && !clockedOut) { clockLabel = 'Clock Out'; clockColor = '#EF4444'; ClockIcon = FiLogOut; }
  if (clockedOut) { clockLabel = 'Completed for today'; clockColor = '#64748B'; }
  const clockDisabled = clockBusy || mine.loading || clockedOut;
  const myStatus = myRecord?.status;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Attendance &amp; Timesheets</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Monitor employee attendance, working hours, overtime, and site-based timesheet records</p>
      </div>

      {canClock && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 12px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Today&apos;s Attendance</span>
              <span style={{ color: '#0F172A', fontSize: '0.875rem', fontWeight: 500 }}>{longDay(today)}</span>
            </div>
            {ownEmployeeId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {!clockedIn && (
                  <div style={{ width: 220 }}>
                    <Select value={clockLocation} searchable placeholder="Your location" onChange={(e) => setClockLocation(e.target.value)} options={locations.map((l) => ({ value: l._id, label: l.name }))} />
                  </div>
                )}
                <button onClick={handleClock} disabled={clockDisabled}
                  style={{ backgroundColor: clockColor, color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: clockDisabled ? 'not-allowed' : 'pointer', opacity: clockDisabled && !clockedOut ? 0.7 : 1, fontSize: '0.875rem' }}>
                  <ClockIcon size={15} /> {clockBusy ? 'Please wait…' : clockLabel}
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#B45309' }}>Your login is not linked to an employee record, so you cannot clock in. Ask HR to link it.</span>
            )}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0F172A', marginBottom: 16 }}>
            <span style={{ fontWeight: 600 }}>Staff Profile: </span>{user ? `${user.firstName} ${user.lastName}` : 'Current user'}
          </div>
          {mine.error && <div style={{ fontSize: '0.8rem', color: '#991B1B', marginBottom: 10 }}>{mine.error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 }}>
            {[
              ['Current Attendance Status', myStatus ? <StatusBadge status={myStatus} /> : <span style={{ color: '#94A3B8' }}>Not Clocked In</span>],
              ['Clock-In Time', <span key="i" style={{ fontWeight: 600, color: clockedIn ? '#0F172A' : '#94A3B8' }}>{clockedIn ? fmtTime(myRecord.clockIn) : '--:--'}</span>],
              ['Clock-Out Time', <span key="o" style={{ fontWeight: 600, color: clockedOut ? '#0F172A' : '#94A3B8' }}>{clockedOut ? fmtTime(myRecord.clockOut) : '--:--'}</span>],
              ['Total Hours Worked', <span key="h" style={{ fontWeight: 600, color: '#0F172A' }}>{myRecord?.hoursWorked != null ? fmtHours(myRecord.hoursWorked) : '0 hrs'}</span>],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map((stat) => (
          <div key={stat.title} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>{stat.title}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color, marginBottom: 4 }}>
              {statsLoading && stat.value === undefined ? '…' : (stat.value ?? 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Site Attendance &middot; {fmtDay(`${dateFilter}T12:00:00+01:00`)}</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 160 }}>
              <DatePicker value={dateFilter} max={today} onChange={(e) => { if (e.target.value) { setDateFilter(e.target.value); setCurrentPage(1); } }} />
            </div>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search employee, location…" style={{ paddingLeft: 36, width: '100%' }} />
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canLog && (
              <button className="btn btn-secondary" onClick={() => setImportOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Upload <FiUpload size={14} />
              </button>
            )}
            {canLog && (
              <button onClick={() => setLogOpen(true)} style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <FiClock size={14} /> Log Attendance
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError}</div>
            <button className="btn btn-secondary" onClick={reload}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>)}</tr>
            ))}</tbody>
          </table>
        ) : (
          <DataTable columns={columns} data={records} selectable selectedIds={selectedIds} keyField="_id"
            onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            emptyMessage={activeSearch || filterCount ? 'No attendance records match your search or filters.' : 'No attendance records for this date.'} />
        )}

        {meta?.totalPages > 1 && <Pagination currentPage={currentPage} totalPages={meta.totalPages} onPageChange={setCurrentPage} />}
      </div>

      {importOpen && (
        <ImportDialog entity="attendance" title="Upload attendance" description="Log many attendance records from a CSV or Excel file. Times are Lagos time."
          onClose={() => setImportOpen(false)}
          onImported={(report) => { showToast(`${report.created} attendance record(s) imported`, 'success'); setCurrentPage(1); reload(); }} />
      )}
      {logOpen && <LogAttendanceDrawer locations={locations} onClose={() => setLogOpen(false)} onSubmit={handleLog} />}
      {viewRecord && (
        <RecordDetailModal record={viewRecord} canApprove={canApprove} ownRecord={!!ownEmployeeId && idOf(viewRecord.employeeId) === ownEmployeeId}
          onClose={() => setViewId(null)} onApproveOvertime={handleApproveOvertime} />
      )}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={filters} locations={locations} onApply={(f) => { setCurrentPage(1); setFilters(f); }} />}
    </div>
  );
}
