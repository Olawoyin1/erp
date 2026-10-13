import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus,
  FiEye, FiMoreVertical, FiCheck, FiX, FiEdit2,
  FiFileText, FiArrowLeft, FiUsers, FiBookOpen, FiAlertCircle
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, DatePicker, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import {
  fetchTrainingPrograms, createTrainingProgram, updateTrainingProgram,
  setTrainingStatus, cancelTraining, fetchParticipants, enrollParticipants,
  selectTrainingPrograms, selectTrainingMeta, selectTrainingLoading,
  selectTrainingError, selectParticipants, selectParticipantsLoading,
  clearTrainingError,
} from '../../../store/hr/trainingSlice';
import { employeeService } from '../../../services/hr.service';

const ROWS_PER_PAGE = 10;

const STATUS_STYLES = {
  scheduled:  { bg: '#EFF6FF', color: '#1D4ED8' },
  active:     { bg: '#D1FAE5', color: '#065F46' },
  completed:  { bg: '#F0FDF4', color: '#15803D' },
  evaluation: { bg: '#FEF9C3', color: '#92400E' },
  cancelled:  { bg: '#FEF2F2', color: '#991B1B' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status?.toLowerCase()] || { bg: '#F1F5F9', color: '#64748B' };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: 500, backgroundColor: s.bg, color: s.color }}>
      {label}
    </span>
  );
}

function RowMenu({ item, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!options?.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
        <FiMoreVertical size={18} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, backgroundColor: '#fff',
          border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: 8,
          padding: 4, minWidth: 180 }}>
          {options.map((opt, idx) => {
            const Icon = opt.icon;
            return (
              <div key={idx} onClick={(e) => { e.stopPropagation(); opt.onClick(); setOpen(false); }}
                style={{ padding: '8px 12px', fontSize: '0.8rem', color: opt.color || '#334155',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 4 }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <Icon size={14} /> {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '80%' : '60%',
            animation: 'pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Participants Sub-Page ─────────────────────────────────────────────────────
function ParticipantsView({ training, onBack }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const participants = useSelector(selectParticipants(training._id));
  const loading = useSelector(selectParticipantsLoading);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [enrollDrawerOpen, setEnrollDrawerOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => { dispatch(fetchParticipants(training._id)); }, [dispatch, training._id]);

  const openEnrollDrawer = async () => {
    try {
      const res = await employeeService.list({ limit: 200 });
      setEmployees(res.data.data || []);
    } catch {
      setEmployees([]);
    }
    setEnrollSearch('');
    setSelectedIds([]);
    setEnrollDrawerOpen(true);
  };

  const handleEnroll = async () => {
    if (!selectedIds.length) return;
    setEnrolling(true);
    try {
      await dispatch(enrollParticipants({ id: training._id, employeeIds: selectedIds })).unwrap();
      addToast(`${selectedIds.length} participant(s) enrolled`, 'success');
      setEnrollDrawerOpen(false);
    } catch (err) {
      addToast(err?.message || 'Failed to enroll', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  const filteredEmps = employees.filter(e => {
    const q = enrollSearch.toLowerCase();
    return !q || e.fullName?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q);
  });

  const enrolledIds = new Set(participants.map(p => p.employeeId?._id || p.employeeId));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
          <FiArrowLeft size={16} /> Back to Training List
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{training.title}</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
            {training.trainingId} &nbsp;·&nbsp; <StatusBadge status={training.status} />
          </p>
        </div>
        <button className="btn btn-primary" onClick={openEnrollDrawer}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
          <FiPlus size={14} /> Add Participants
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>Loading participants…</div>
        ) : participants.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>No participants enrolled yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                {['Employee', 'Position', 'Attendance', 'Outcome'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => {
                const emp = p.employeeId;
                const name = emp?.fullName || '—';
                const pos = emp?.position || '—';
                return (
                  <tr key={p._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ margin: 0, fontWeight: 500, color: '#0F172A' }}>{name}</p>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>{emp?.employeeId || ''}</p>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{pos}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500,
                        backgroundColor: p.attended ? '#D1FAE5' : '#F1F5F9', color: p.attended ? '#065F46' : '#64748B' }}>
                        {p.attended ? 'Attended' : 'Not marked'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500,
                        backgroundColor: p.outcomeStatus === 'value_created' ? '#D1FAE5' : '#F1F5F9',
                        color: p.outcomeStatus === 'value_created' ? '#065F46' : '#64748B' }}>
                        {p.outcomeStatus ? p.outcomeStatus.replace(/_/g, ' ') : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Enroll Drawer */}
      <Drawer isOpen={enrollDrawerOpen} onClose={() => setEnrollDrawerOpen(false)} title="Add Participants" width="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 0' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={15} />
            <input value={enrollSearch} onChange={(e) => setEnrollSearch(e.target.value)}
              placeholder="Search employee name or ID..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ border: '1px solid #F1F5F9', borderRadius: 8, maxHeight: 320, overflowY: 'auto' }}>
            {filteredEmps.map((emp) => {
              const alreadyIn = enrolledIds.has(emp._id);
              const checked = selectedIds.includes(emp._id);
              return (
                <div key={emp._id} onClick={() => !alreadyIn && setSelectedIds(prev => prev.includes(emp._id) ? prev.filter(x => x !== emp._id) : [...prev, emp._id])}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                    borderBottom: '1px solid #F1F5F9', cursor: alreadyIn ? 'default' : 'pointer',
                    opacity: alreadyIn ? 0.5 : 1 }}>
                  <input type="checkbox" checked={checked || alreadyIn} readOnly
                    style={{ width: 15, height: 15, accentColor: '#3B82F6' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{emp.fullName}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>{emp.position} · {emp.employeeId}</p>
                  </div>
                  {alreadyIn && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94A3B8' }}>Enrolled</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn btn-outline" onClick={() => setEnrollDrawerOpen(false)} style={{ padding: '8px 20px' }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEnroll} disabled={!selectedIds.length || enrolling}
              style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: !selectedIds.length ? 0.6 : 1 }}>
              {enrolling ? 'Enrolling…' : `Enroll ${selectedIds.length || ''}`}
            </button>
          </div>
        </div>
      </Drawer>
      <Toast />
    </div>
  );
}

// ─── Schedule / Edit Drawer Form ──────────────────────────────────────────────
function ScheduleDrawer({ isOpen, onClose, editItem, onSaved }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(editItem ? {
        title: editItem.title || '',
        providerType: editItem.providerType || 'external',
        providerName: editItem.providerName || '',
        startDate: editItem.startDate?.slice(0, 10) || '',
        endDate: editItem.endDate?.slice(0, 10) || '',
        startTime: editItem.startTime || '',
        endTime: editItem.endTime || '',
        trainingType: editItem.trainingType || 'in_person',
        locationOrPlatform: editItem.locationOrPlatform || '',
        validityPeriod: editItem.validityPeriod || '',
        description: editItem.description || '',
      } : {
        title: '', providerType: 'external', providerName: '',
        startDate: '', endDate: '', startTime: '', endTime: '',
        trainingType: 'in_person', locationOrPlatform: '', validityPeriod: '', description: '',
      });
    }
  }, [isOpen, editItem]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.endDate) {
      addToast('Title, start date, and end date are required', 'error'); return;
    }
    setSaving(true);
    try {
      if (editItem?._id) {
        await dispatch(updateTrainingProgram({ id: editItem._id, data: form })).unwrap();
        addToast('Training updated', 'success');
      } else {
        await dispatch(createTrainingProgram(form)).unwrap();
        addToast('Training scheduled', 'success');
      }
      onSaved();
    } catch (err) {
      addToast(err?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose}
      title={editItem?._id ? 'Edit Training' : 'Schedule Training'}
      subtitle="Schedule a training session for employees"
      width="650px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="TRAINING TITLE *">
            <Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} />
          </FormField>
          <FormField label="PROVIDER TYPE *">
            <Select value={form.providerType || 'external'}
              options={[{ value: 'external', label: 'External' }, { value: 'internal', label: 'Internal' }]}
              onChange={(v) => set('providerType', v)} />
          </FormField>
          <FormField label="PROVIDER NAME *">
            <Input value={form.providerName || ''} onChange={(e) => set('providerName', e.target.value)} />
          </FormField>
          <FormField label="START DATE *">
            <DatePicker value={form.startDate || ''} onChange={(v) => set('startDate', v)} />
          </FormField>
          <FormField label="END DATE *">
            <DatePicker value={form.endDate || ''} onChange={(v) => set('endDate', v)} />
          </FormField>
          <FormField label="START TIME">
            <input type="time" value={form.startTime || ''} onChange={(e) => set('startTime', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }} />
          </FormField>
          <FormField label="END TIME">
            <input type="time" value={form.endTime || ''} onChange={(e) => set('endTime', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.85rem', outline: 'none' }} />
          </FormField>
          <FormField label="TRAINING TYPE *">
            <Select value={form.trainingType || 'in_person'}
              options={[{ value: 'in_person', label: 'In Person' }, { value: 'virtual', label: 'Virtual' }]}
              onChange={(v) => set('trainingType', v)} />
          </FormField>
          <FormField label="LOCATION / PLATFORM">
            <Input value={form.locationOrPlatform || ''} onChange={(e) => set('locationOrPlatform', e.target.value)} />
          </FormField>
          <FormField label="VALIDITY PERIOD">
            <Input value={form.validityPeriod || ''} onChange={(e) => set('validityPeriod', e.target.value)} placeholder="e.g. 3 years" />
          </FormField>
        </div>
        <FormField label="DESCRIPTION">
          <Textarea rows={3} value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '8px 20px' }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600 }}>
            {saving ? 'Saving…' : (editItem?._id ? 'Save Changes' : 'Schedule Training')}
          </button>
        </div>
      </div>
    </Drawer>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({ isOpen, onClose, training, onCancelled }) {
  const dispatch = useDispatch();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCancel = async () => {
    setSaving(true);
    try {
      await dispatch(cancelTraining({ id: training._id, reason })).unwrap();
      addToast('Training cancelled', 'success');
      onCancelled();
    } catch (err) {
      addToast(err?.message || 'Failed to cancel', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Training" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
          Are you sure you want to cancel <strong>{training?.title}</strong>? Enrolled participants will be notified.
        </p>
        <FormField label="REASON (OPTIONAL)">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Trainer unavailable — rescheduling" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '8px 20px' }}>Back</button>
          <button onClick={handleCancel} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Cancelling…' : 'Cancel Training'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TrainingCertifications() {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const items = useSelector(selectTrainingPrograms);
  const meta = useSelector(selectTrainingMeta);
  const loading = useSelector(selectTrainingLoading);
  const apiError = useSelector(selectTrainingError);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [viewCourse, setViewCourse] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cancelItem, setCancelItem] = useState(null);
  const [participantsTraining, setParticipantsTraining] = useState(null);

  const debounceRef = useRef(null);

  const load = useCallback((p, q, s) => {
    const params = { page: p, limit: ROWS_PER_PAGE };
    if (q) params.q = q;
    if (s) params.status = s;
    dispatch(fetchTrainingPrograms(params));
  }, [dispatch]);

  useEffect(() => { load(page, search, statusFilter); }, [page, statusFilter]); // eslint-disable-line

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, val, statusFilter); }, 400);
  };

  const handleSetStatus = async (item, status) => {
    try {
      await dispatch(setTrainingStatus({ id: item._id, status })).unwrap();
      addToast('Status updated', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed', 'error');
    }
  };

  const getMenuOptions = (item) => {
    const opts = [
      { label: 'View Participants', icon: FiUsers, onClick: () => setParticipantsTraining(item) },
    ];
    if (item.status === 'scheduled') {
      opts.unshift(
        { label: 'Edit', icon: FiEdit2, onClick: () => { setEditItem(item); setScheduleOpen(true); } },
        { label: 'Start Training', icon: FiCheck, onClick: () => handleSetStatus(item, 'active') },
        { label: 'Cancel Training', icon: FiX, color: '#EF4444', onClick: () => setCancelItem(item) },
      );
    } else if (item.status === 'active') {
      opts.unshift({ label: 'Mark as Completed', icon: FiCheck, color: '#10B981', onClick: () => handleSetStatus(item, 'completed') });
    } else if (item.status === 'completed') {
      opts.unshift({ label: 'Start Evaluation', icon: FiFileText, onClick: () => handleSetStatus(item, 'evaluation') });
    }
    return opts;
  };

  const columns = [
    { label: 'TRAINING ID', key: 'trainingId', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600 }}>{v}</span> },
    { label: 'TITLE', key: 'title', render: (v) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{v}</span> },
    { label: 'PROVIDER', key: 'providerName' },
    { label: 'TYPE', key: 'trainingType', render: (v) => v ? v.replace('_', ' ') : '—' },
    { label: 'VALIDITY', key: 'validityPeriod', render: (v) => v || '—' },
    { label: 'PARTICIPANTS', key: 'participantCount', render: (v) => v ?? 0 },
    { label: 'STATUS', key: 'status', render: (v) => <StatusBadge status={v} /> },
    {
      label: 'ACTIONS', key: 'actions', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
          <button onClick={() => setViewCourse(row)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <FiEye size={17} />
          </button>
          <RowMenu item={row} options={getMenuOptions(row)} />
        </div>
      )
    }
  ];

  if (participantsTraining) {
    return <ParticipantsView training={participantsTraining} onBack={() => setParticipantsTraining(null)} />;
  }

  const totalPages = meta ? meta.totalPages : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Training & Certifications</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 2, margin: 0 }}>Track employee training and certification programs</p>
        </div>
      </div>

      {apiError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem' }}>
          <FiAlertCircle size={16} /> {apiError.message}
        </div>
      )}

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search training title or ID..."
              style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <Select value={statusFilter}
              options={[
                { value: '', label: 'All Status' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'evaluation', label: 'Evaluation' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <button className="btn btn-primary"
              onClick={() => { setEditItem(null); setScheduleOpen(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px',
                backgroundColor: '#1D4ED8', color: '#fff', borderRadius: 6, fontWeight: 600, border: 'none' }}>
              <FiPlus size={14} /> Schedule Training
            </button>
          </div>
        </div>

        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable columns={columns} data={items} selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(i => i._id))}
            keyField="_id" emptyMessage="No training programs found." />
        )}

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); }} />
        )}
      </div>

      {/* View Course Drawer */}
      <Drawer isOpen={!!viewCourse} onClose={() => setViewCourse(null)}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiBookOpen color="#3B82F6" /><span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B' }}>{viewCourse?.title}</span></div>}
        subtitle={viewCourse?.trainingId} width="650px">
        {viewCourse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusBadge status={viewCourse.status} />
              {viewCourse.status === 'scheduled' && (
                <button className="btn btn-primary" onClick={() => { handleSetStatus(viewCourse, 'active'); setViewCourse(null); }}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>Start Training</button>
              )}
              {viewCourse.status === 'active' && (
                <button onClick={() => { handleSetStatus(viewCourse, 'completed'); setViewCourse(null); }}
                  style={{ backgroundColor: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <FiCheck size={16} /> Mark as Completed
                </button>
              )}
            </div>
            <div style={{ border: '1px solid #3B82F6', borderRadius: 8, padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
              {[
                ['TRAINING ID', viewCourse.trainingId],
                ['PROVIDER TYPE', viewCourse.providerType],
                ['PROVIDER NAME', viewCourse.providerName],
                ['START DATE', viewCourse.startDate?.slice(0, 10)],
                ['END DATE', viewCourse.endDate?.slice(0, 10)],
                ['START TIME', viewCourse.startTime || '—'],
                ['END TIME', viewCourse.endTime || '—'],
                ['TRAINING TYPE', viewCourse.trainingType?.replace('_', ' ')],
                ['LOCATION / PLATFORM', viewCourse.locationOrPlatform || '—'],
                ['VALIDITY PERIOD', viewCourse.validityPeriod || '—'],
                ['PARTICIPANTS', `${viewCourse.participantCount ?? 0} Employees`],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{val || '—'}</p>
                </div>
              ))}
            </div>
            {viewCourse.description && (
              <div style={{ border: '1px dashed #3B82F6', padding: 20, borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DESCRIPTION</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>{viewCourse.description}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <ScheduleDrawer isOpen={scheduleOpen} onClose={() => { setScheduleOpen(false); setEditItem(null); }}
        editItem={editItem} onSaved={() => { setScheduleOpen(false); setEditItem(null); load(page, search, statusFilter); }} />

      {cancelItem && (
        <CancelModal isOpen={!!cancelItem} onClose={() => setCancelItem(null)} training={cancelItem}
          onCancelled={() => { setCancelItem(null); load(page, search, statusFilter); }} />
      )}
      <Toast />
    </div>
  );
}
