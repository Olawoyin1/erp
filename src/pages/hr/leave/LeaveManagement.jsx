import { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical, FiCheck, FiX, FiCalendar } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchLeaves, fetchLeaveStats, approveLeave, declineLeave, requestLeaveChanges, createLeave,
  selectLeaveRequests, selectLeaveMeta, selectLeaveStats, selectLeaveLoading, selectLeaveError,
} from '../../../store/hr/leaveSlice';
import { leaveService } from '../../../services/hr.service';
import { selectCurrentUser } from '../../../store/authSlice';
import { formatDate, titleCase } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { saveBlob, blobErrorMessage, fullName } from '../hrUtils';
import ApplyLeaveDrawer from './ApplyLeaveDrawer';
import LeaveDetailsDrawer from './LeaveDetailsModal';
import HolidaysDrawer from './HolidaysDrawer';

const ROWS_PER_PAGE = 10;
const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
];

const STATUS_STYLE = {
  pending:  { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#DCFCE7', color: '#166534' },
  declined: { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}>{titleCase(status)}</span>;
}

function FilterDrawer({ onClose, value, leaveTypes, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter leave requests" width="400px"
      footer={
        <>
          <button onClick={() => { onApply({ status: '', leaveTypeId: '', from: '', to: '' }); onClose(); }} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="Status"><Select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} options={STATUS_FILTERS} /></FormField>
        <FormField label="Leave type">
          <Select value={draft.leaveTypeId} onChange={(e) => setDraft((d) => ({ ...d, leaveTypeId: e.target.value }))}
            options={[{ value: '', label: 'All leave types' }, ...leaveTypes.map((t) => ({ value: t._id, label: t.name }))]} />
        </FormField>
        <FormField label="Leave falls on or after"><DatePicker value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} /></FormField>
        <FormField label="Leave starts on or before"><DatePicker value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} /></FormField>
      </div>
    </Drawer>
  );
}

function DeclineModal({ leave, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!reason.trim()) { setError('A reason is required'); return; }
    setSaving(true);
    const message = await onConfirm(leave, reason.trim());
    setSaving(false);
    if (message) setError(message);
  };
  return (
    <Modal isOpen onClose={onClose} title="Decline Leave Request?" maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.7 }}>
          <div>Employee: <strong>{fullName(leave.employeeId)}</strong></div>
          <div>Leave type: <strong>{leave.leaveTypeId?.name}</strong></div>
          <div>Requested dates: <strong>{formatDate(leave.startDate)} to {formatDate(leave.endDate)}</strong></div>
        </div>
        <FormField label="Reason for declining" required error={error}>
          <Textarea rows={4} placeholder="Enter commentary…" value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontWeight: 600, borderRadius: 6, border: 'none', backgroundColor: '#DC2626', color: '#fff', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            <FiX size={14} /> {saving ? 'Declining…' : 'Decline Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return <div style={{ width: 28 }} />;
  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}><FiMoreVertical size={16} /></button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 900 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 950, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', padding: 4, minWidth: 140 }}>
            {items.map((item) => (
              <button key={item.label} className="menu-item-hover" onClick={() => { setOpen(false); item.onClick(); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', fontSize: '0.82rem', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', color: item.color, borderRadius: 6, textAlign: 'left' }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function LeaveManagement() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const items = useSelector(selectLeaveRequests);
  const meta = useSelector(selectLeaveMeta);
  const stats = useSelector(selectLeaveStats);
  const loading = useSelector(selectLeaveLoading);
  const loadError = useSelector(selectLeaveError);
  const user = useSelector(selectCurrentUser);
  const ownEmployeeId = idOf(user?.employeeId) || '';

  const canApply = usePermission('hr.leave.create');
  const canOnBehalf = usePermission('hr.leave.create-on-behalf');
  const canDecide = usePermission('hr.leave.decide');
  const canSeeHolidays = usePermission('hr.holiday.view');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', leaveTypeId: '', from: '', to: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [holidaysOpen, setHolidaysOpen] = useState(false);
  const debounceRef = useRef(null);

  const queryParams = useCallback(() => {
    const p = { page, limit: ROWS_PER_PAGE };
    if (activeSearch) p.q = activeSearch;
    Object.entries(filters).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [page, activeSearch, filters]);

  const reload = useCallback(() => {
    dispatch(fetchLeaves(queryParams()));
    dispatch(fetchLeaveStats());
  }, [dispatch, queryParams]);

  useEffect(() => { dispatch(fetchLeaves(queryParams())); }, [dispatch, queryParams]);
  useEffect(() => { dispatch(fetchLeaveStats()); }, [dispatch]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    let cancelled = false;
    leaveService.types()
      .then((res) => { if (!cancelled) setLeaveTypes(res.data?.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleApply = async (body) => {
    const result = await dispatch(createLeave(body));
    if (createLeave.fulfilled.match(result)) {
      const r = result.payload;
      showToast(`Leave ${r.leaveId} submitted: ${r.durationDays} working day${r.durationDays === 1 ? '' : 's'}`, 'success');
      setApplyOpen(false);
      setPage(1);
      reload();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleApprove = async (leave) => {
    const result = await dispatch(approveLeave(leave._id));
    if (approveLeave.fulfilled.match(result)) {
      showToast('Leave request approved', 'success');
      reload();
      return '';
    }
    showToast(result.payload?.message || 'Approval failed', 'error');
    return result.payload?.message || 'Approval failed';
  };

  const handleDecline = async (leave, reason) => {
    const result = await dispatch(declineLeave({ id: leave._id, reason }));
    if (declineLeave.fulfilled.match(result)) {
      showToast('Leave request declined', 'success');
      setDeclineTarget(null);
      reload();
      return '';
    }
    return result.payload?.message || 'Decline failed';
  };

  const handleRequestChanges = async (leave, message) => {
    const result = await dispatch(requestLeaveChanges({ id: leave._id, message }));
    if (requestLeaveChanges.fulfilled.match(result)) {
      showToast('Change request sent to the employee', 'success');
      return '';
    }
    return result.payload?.message || 'Could not send the request';
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (activeSearch) params.q = activeSearch;
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await leaveService.exportList(params);
      saveBlob(res.data, 'leave-requests.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const isOwn = (leave) => !!ownEmployeeId && idOf(leave.employeeId) === ownEmployeeId;
  const mayDecide = (leave) => canDecide && !isOwn(leave);

  const viewLeave = items.find((l) => l._id === viewId);
  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const filterCount = Object.values(filters).filter(Boolean).length;

  const columns = [
    { key: 'leaveId', label: 'LEAVE ID', render: (v) => <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> },
    { key: 'employeeId', label: 'EMPLOYEE', render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName(v)}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (v) => <span style={{ color: '#64748B' }}>{v?.name || '—'}</span> },
    { key: 'leaveTypeId', label: 'LEAVE TYPE', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{v?.name || '—'}</span> },
    { key: 'startDate', label: 'START DATE', render: (v) => formatDate(v) },
    { key: 'endDate', label: 'END DATE', render: (v) => formatDate(v) },
    { key: 'durationDays', label: 'DURATION', render: (v) => (v != null ? `${v} ${v === 1 ? 'Day' : 'Days'}` : '—') },
    { key: 'decidedBy', label: 'APPROVED BY', render: (v) => (v ? fullName(v) : '—') },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewId(row._id)}><FiEye size={16} /></button>
          <RowMenu items={row.status === 'pending' && mayDecide(row) ? [
            { label: 'Approve', color: '#16A34A', icon: <FiCheck size={14} />, onClick: () => handleApprove(row) },
            { label: 'Decline', color: '#DC2626', icon: <FiX size={14} />, onClick: () => setDeclineTarget(row) },
          ] : []} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Leave Management</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Track, approve, and manage employee leave requests and absence records</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[['PENDING', statMap.pending, '#92400E'], ['APPROVED', statMap.approved, '#166534'], ['DECLINED', statMap.declined, '#991B1B']].map(([label, value, color]) => (
          <div key={label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value ?? 0}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search employee, type, status…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            {canSeeHolidays && (
              <button className="btn btn-secondary" onClick={() => setHolidaysOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                <FiCalendar size={14} /> Public Holidays
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{filterCount ? ` (${filterCount})` : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canApply && (
              <button onClick={() => setApplyOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <FiPlus size={14} /> Apply for Leave
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
          <DataTable columns={columns} data={items} selectable selectedIds={selectedIds} keyField="_id"
            onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map((r) => r._id))}
            emptyMessage={activeSearch || filterCount ? 'No leave requests match your search or filters.' : 'No leave requests yet.'} />
        )}

        {meta?.totalPages > 1 && <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />}
      </div>

      {viewLeave && (
        <LeaveDetailsDrawer leave={viewLeave} canDecide={mayDecide(viewLeave)} ownRequest={isOwn(viewLeave) && canDecide} showToast={showToast}
          onClose={() => setViewId(null)} onApprove={handleApprove}
          onDecline={(l) => { setViewId(null); setDeclineTarget(l); }} onRequestChanges={handleRequestChanges} />
      )}
      {declineTarget && <DeclineModal leave={declineTarget} onClose={() => setDeclineTarget(null)} onConfirm={handleDecline} />}
      {applyOpen && (
        <ApplyLeaveDrawer ownEmployeeId={ownEmployeeId} canActOnBehalf={canOnBehalf} leaveTypes={leaveTypes} onClose={() => setApplyOpen(false)} onSubmit={handleApply} />
      )}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={filters} leaveTypes={leaveTypes} onApply={(f) => { setPage(1); setFilters(f); }} />}
      {holidaysOpen && <HolidaysDrawer onClose={() => setHolidaysOpen(false)} showToast={showToast} />}
    </div>
  );
}
