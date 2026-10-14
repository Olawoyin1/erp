import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical, FiCheck, FiX, FiEdit2,
  FiFileText, FiUsers, FiBookOpen, FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, DatePicker, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import {
  fetchTrainingPrograms, createTrainingProgram, updateTrainingProgram, setTrainingStatus, cancelTraining,
  selectTrainingPrograms, selectTrainingMeta, selectTrainingLoading, selectTrainingError,
} from '../../../store/hr/trainingSlice';
import { trainingService } from '../../../services/hr.service';
import { apiError, formatDate, titleCase } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, saveBlob, blobErrorMessage, ymd } from '../hrUtils';
import MultiEmployeePicker from '../MultiEmployeePicker';
import { EmployeeFileDialog } from '../FileUploadDialogs';
import TrainingParticipants from './TrainingParticipants';
import { StatusBadge } from './trainingUi';
import { STATUS_STYLES, durationLabel } from './trainingConstants';

const ROWS_PER_PAGE = 10;
const STATUS_FILTERS = [{ value: '', label: 'All statuses' }, ...Object.entries(STATUS_STYLES).map(([value, s]) => ({ value, label: s.label }))];
const timeInput = { width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: '0.85rem', outline: 'none', backgroundColor: '#F8FAFC', boxSizing: 'border-box' };

function RowMenu({ options }) {
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
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="icon-btn"><FiMoreVertical size={18} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, backgroundColor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: 8, padding: 4, minWidth: 190 }}>
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <div key={opt.label} className="menu-item-hover" onClick={(e) => { e.stopPropagation(); opt.onClick(); setOpen(false); }}
                style={{ padding: '8px 12px', fontSize: '0.8rem', color: opt.color || '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderRadius: 4 }}>
                <Icon size={14} /> {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Schedule / edit ──────────────────────────────────────────────────────────
function ScheduleDrawer({ editItem, onClose, onSave }) {
  const editing = !!editItem?._id;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [selected, setSelected] = useState({});
  const [form, setForm] = useState(() => ({
    title: editItem?.title || '',
    providerType: editItem?.providerType || 'external',
    providerName: editItem?.providerName || '',
    startDate: ymd(editItem?.startDate),
    endDate: ymd(editItem?.endDate),
    startTime: editItem?.startTime || '',
    endTime: editItem?.endTime || '',
    trainingType: editItem?.trainingType || 'in_person',
    locationOrPlatform: editItem?.locationOrPlatform || '',
    validityPeriod: editItem?.validityPeriod || '',
    description: editItem?.description || '',
    renewalRequirements: editItem?.renewalRequirements || '',
  }));

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Enter the training title';
    if (!form.providerName.trim()) next.providerName = 'Enter the provider name';
    if (!form.startDate) next.startDate = 'Enter the start date';
    if (!form.endDate) next.endDate = 'Enter the end date';
    if (form.startDate && form.endDate && form.endDate < form.startDate) next.endDate = 'Must not be before the start date';
    if (!editing && Object.keys(selected).length === 0) next.participants = 'Select at least one participant';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    const body = {
      title: form.title.trim(),
      providerType: form.providerType,
      providerName: form.providerName.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      trainingType: form.trainingType,
      ...(form.startTime ? { startTime: form.startTime } : {}),
      ...(form.endTime ? { endTime: form.endTime } : {}),
      ...(form.locationOrPlatform.trim() ? { locationOrPlatform: form.locationOrPlatform.trim() } : {}),
      ...(form.validityPeriod.trim() ? { validityPeriod: form.validityPeriod.trim() } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(form.renewalRequirements.trim() ? { renewalRequirements: form.renewalRequirements.trim() } : {}),
    };
    const failure = await onSave(body, Object.keys(selected));
    setSaving(false);
    if (failure) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title={editing ? 'Edit Training' : 'Schedule Training'}
      subtitle={editing ? 'Update the training schedule' : 'Schedule a training session and assign participants'} width="650px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1, padding: '9px 16px' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '9px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Schedule Training'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {formError && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError}</span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="Training" required error={errors.title}>
            <Input value={form.title} error={!!errors.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. BOSIET" />
          </FormField>
          <FormField label="Provider type" required>
            <Select value={form.providerType} onChange={(e) => set('providerType', e.target.value)} options={[{ value: 'external', label: 'External' }, { value: 'internal', label: 'Internal' }]} />
          </FormField>
          <FormField label="Provider name" required error={errors.providerName}>
            <Input value={form.providerName} error={!!errors.providerName} onChange={(e) => set('providerName', e.target.value)} />
          </FormField>
          <FormField label="Training type" required>
            <Select value={form.trainingType} onChange={(e) => set('trainingType', e.target.value)} options={[{ value: 'in_person', label: 'In Person' }, { value: 'virtual', label: 'Virtual' }]} />
          </FormField>
          <FormField label="Start date" required error={errors.startDate}>
            <DatePicker value={form.startDate} error={!!errors.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </FormField>
          <FormField label="End date" required error={errors.endDate}>
            <DatePicker value={form.endDate} min={form.startDate || undefined} error={!!errors.endDate} onChange={(e) => set('endDate', e.target.value)} />
          </FormField>
          <FormField label="Start time" error={errors.startTime}>
            <input type="time" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} style={timeInput} />
          </FormField>
          <FormField label="End time" error={errors.endTime}>
            <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} style={timeInput} />
          </FormField>
          <FormField label="Location / platform" error={errors.locationOrPlatform}>
            <Input value={form.locationOrPlatform} onChange={(e) => set('locationOrPlatform', e.target.value)} placeholder="e.g. Google Meet" />
          </FormField>
          <FormField label="Validity period" error={errors.validityPeriod} helpText="How long the certification remains valid">
            <Input value={form.validityPeriod} onChange={(e) => set('validityPeriod', e.target.value)} placeholder="e.g. 2 Years" />
          </FormField>
        </div>
        {!editing && (
          <FormField label="Add participants (select at least 1)" required error={errors.participants}>
            <MultiEmployeePicker selected={selected} onChange={(s) => { setSelected(s); setErrors((e) => ({ ...e, participants: undefined })); }} />
          </FormField>
        )}
        <FormField label="Description (optional)" error={errors.description}>
          <Textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </FormField>
        <FormField label="Renewal requirements (optional)" error={errors.renewalRequirements}>
          <Textarea rows={2} value={form.renewalRequirements} onChange={(e) => set('renewalRequirements', e.target.value)} placeholder="e.g. Employees must renew this certification every 2 years." />
        </FormField>
      </div>
    </Drawer>
  );
}

function CancelModal({ training, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!reason.trim()) { setError('A reason is required'); return; }
    setSaving(true);
    const message = await onConfirm(reason.trim());
    setSaving(false);
    if (message) setError(message);
  };
  return (
    <Modal isOpen onClose={onClose} title="Cancel Training" maxWidth="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
          Cancel <strong>{training.title}</strong>? Enrolled participants will be notified.
        </p>
        <FormField label="Reason" required error={error}>
          <Textarea rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError(''); }} placeholder="e.g. Trainer unavailable, rescheduling" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Back</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Cancelling…' : 'Cancel Training'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter training" width="380px"
      footer={
        <>
          <button onClick={() => { onApply(''); onClose(); }} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <FormField label="Status"><Select value={draft} onChange={(e) => setDraft(e.target.value)} options={STATUS_FILTERS} /></FormField>
    </Drawer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TrainingCertifications() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();

  const items = useSelector(selectTrainingPrograms);
  const meta = useSelector(selectTrainingMeta);
  const loading = useSelector(selectTrainingLoading);
  const loadError = useSelector(selectTrainingError);

  const canCreate = usePermission('hr.training.create');
  const canUpdate = usePermission('hr.training.update');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [cancelItem, setCancelItem] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const canUploadCert = usePermission('hr.employee.update');
  const [participantsId, setParticipantsId] = useState(null);
  const debounceRef = useRef(null);

  const params = useCallback(() => ({ page, limit: ROWS_PER_PAGE, ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) }), [page, activeSearch, status]);
  const reload = useCallback(() => dispatch(fetchTrainingPrograms(params())), [dispatch, params]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleSave = async (body, employeeIds) => {
    if (drawer?.item) {
      const result = await dispatch(updateTrainingProgram({ id: drawer.item._id, data: body }));
      if (updateTrainingProgram.fulfilled.match(result)) {
        showToast('Training updated', 'success');
        setDrawer(null);
        reload();
        return undefined;
      }
      return failureOf(result.payload);
    }
    const result = await dispatch(createTrainingProgram(body));
    if (!createTrainingProgram.fulfilled.match(result)) return failureOf(result.payload);
    let message = `Training ${result.payload.trainingId} scheduled`;
    let kind = 'success';
    try {
      await trainingService.enroll(result.payload._id, employeeIds);
      message += ` with ${employeeIds.length} participant(s)`;
    } catch (err) {
      message += `, but the participants could not be enrolled: ${apiError(err, 'add them from View Participants')}`;
      kind = 'info';
    }
    showToast(message, kind);
    setDrawer(null);
    setPage(1);
    reload();
    return undefined;
  };

  const handleSetStatus = async (item, next) => {
    const result = await dispatch(setTrainingStatus({ id: item._id, status: next }));
    if (setTrainingStatus.fulfilled.match(result)) {
      showToast(`${item.title} is now ${STATUS_STYLES[next]?.label || titleCase(next)}`, 'success');
      reload();
    } else {
      showToast(result.payload?.message || 'The status could not be changed', 'error');
    }
  };

  const handleCancel = async (reason) => {
    const result = await dispatch(cancelTraining({ id: cancelItem._id, reason }));
    if (cancelTraining.fulfilled.match(result)) {
      showToast('Training cancelled', 'success');
      setCancelItem(null);
      reload();
      return '';
    }
    return result.payload?.message || 'Failed to cancel';
  };

  const handleExport = async () => {
    try {
      const res = await trainingService.exportList({ format: 'csv', ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) });
      saveBlob(res.data, 'training-programs.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const getMenuOptions = (item) => {
    const opts = [];
    if (canUpdate && item.status === 'scheduled') {
      opts.push({ label: 'Edit Schedule', icon: FiEdit2, onClick: () => setDrawer({ item }) });
    }
    opts.push({ label: 'View Participants', icon: FiUsers, onClick: () => setParticipantsId(item._id) });
    if (canUpdate) {
      if (item.status === 'scheduled') {
        opts.push({ label: 'Start Training', icon: FiCheck, onClick: () => handleSetStatus(item, 'active') });
        opts.push({ label: 'Cancel Training', icon: FiX, color: '#EF4444', onClick: () => setCancelItem(item) });
      } else if (item.status === 'active') {
        opts.push({ label: 'Mark as Completed', icon: FiCheck, color: '#10B981', onClick: () => handleSetStatus(item, 'completed') });
      } else if (item.status === 'completed') {
        opts.push({ label: 'Start Evaluation', icon: FiFileText, onClick: () => handleSetStatus(item, 'evaluation') });
      }
    }
    return opts;
  };

  const participantsTraining = items.find((i) => i._id === participantsId);
  if (participantsTraining) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        <TrainingParticipants training={participantsTraining} showToast={showToast} onBack={() => setParticipantsId(null)} onChanged={reload} />
      </div>
    );
  }

  const columns = [
    { label: 'TRAINING ID', key: 'trainingId', render: (v) => <span style={{ color: '#475569', fontWeight: 600 }}>{v}</span> },
    { label: 'TRAINING', key: 'title', render: (v) => <span style={{ fontWeight: 500, color: '#0F172A' }}>{v}</span> },
    { label: 'PROVIDER', key: 'providerName' },
    { label: 'DURATION', key: 'startDate', render: (_, row) => durationLabel(row.startDate, row.endDate) },
    { label: 'VALIDITY PERIOD', key: 'validityPeriod', render: (v) => v || 'No Expiry' },
    { label: 'PARTICIPANTS', key: 'participantCount', render: (v) => v ?? 0 },
    { label: 'STATUS', key: 'status', render: (v) => <StatusBadge status={v} /> },
    {
      label: 'ACTIONS', key: 'actions', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button className="icon-btn" onClick={() => setViewId(row._id)} title="View"><FiEye size={17} /></button>
          <RowMenu options={getMenuOptions(row)} />
        </div>
      ),
    },
  ];

  const viewCourse = items.find((i) => i._id === viewId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Training &amp; Certifications</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>Track employee training and certification programs</p>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search training, id, provider…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{status ? ' (1)' : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canUploadCert && (
              <button className="btn btn-secondary" onClick={() => setUploadOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Upload <FiUpload size={14} />
              </button>
            )}
            {canCreate && (
              <button onClick={() => setDrawer({ item: null })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', backgroundColor: '#1D4ED8', color: '#fff', borderRadius: 6, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                <FiPlus size={14} /> Schedule Training
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
              <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>)}</tr>
            ))}</tbody>
          </table>
        ) : (
          <DataTable columns={columns} data={items} selectable selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map((i) => i._id))}
            keyField="_id" emptyMessage={activeSearch || status ? 'No training programs match your search or filter.' : 'No training programs scheduled yet.'} />
        )}

        {meta?.totalPages > 1 && <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />}
      </div>

      {viewCourse && (
        <Drawer isOpen onClose={() => setViewId(null)}
          title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiBookOpen color="#3B82F6" /><span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1E293B' }}>{viewCourse.title}</span></div>}
          subtitle={viewCourse.trainingId} width="650px">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#64748B' }}>Status: <StatusBadge status={viewCourse.status} /></div>
              {canUpdate && viewCourse.status === 'scheduled' && (
                <button onClick={() => { handleSetStatus(viewCourse, 'active'); setViewId(null); }} style={{ padding: '8px 16px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Start Training</button>
              )}
              {canUpdate && viewCourse.status === 'active' && (
                <button onClick={() => { handleSetStatus(viewCourse, 'completed'); setViewId(null); }} style={{ backgroundColor: '#10B981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <FiCheck size={16} /> Mark as Completed
                </button>
              )}
            </div>
            <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
              {[
                ['TRAINING', viewCourse.title], ['TRAINING ID', viewCourse.trainingId], ['PROVIDER TYPE', titleCase(viewCourse.providerType)],
                ['PROVIDER NAME', viewCourse.providerName], ['START DATE', formatDate(viewCourse.startDate)], ['END DATE', formatDate(viewCourse.endDate)],
                ['START TIME', viewCourse.startTime], ['END TIME', viewCourse.endTime], ['DURATION', durationLabel(viewCourse.startDate, viewCourse.endDate)],
                ['TRAINING TYPE', titleCase(viewCourse.trainingType)], ['LOCATION / PLATFORM', viewCourse.locationOrPlatform], ['PARTICIPANTS', `${viewCourse.participantCount ?? 0} Employees`],
                ['VALIDITY PERIOD', viewCourse.validityPeriod || 'No Expiry'], ['STATUS', STATUS_STYLES[viewCourse.status]?.label],
                ...(viewCourse.cancellationReason ? [['CANCELLED BECAUSE', viewCourse.cancellationReason]] : []),
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{label}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 500, color: '#1E293B' }}>{val || '—'}</p>
                </div>
              ))}
            </div>
            {viewCourse.description && (
              <div style={{ padding: 18, borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>DESCRIPTION</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{viewCourse.description}</p>
              </div>
            )}
            {viewCourse.renewalRequirements && (
              <div style={{ padding: 18, borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>RENEWAL REQUIREMENTS</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{viewCourse.renewalRequirements}</p>
              </div>
            )}
            <div>
              <button className="btn btn-secondary" onClick={() => { setViewId(null); setParticipantsId(viewCourse._id); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FiUsers size={14} /> View Participants
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {drawer && <ScheduleDrawer key={drawer.item?._id || 'new'} editItem={drawer.item} onClose={() => setDrawer(null)} onSave={handleSave} />}
      {cancelItem && <CancelModal training={cancelItem} onClose={() => setCancelItem(null)} onConfirm={handleCancel} />}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={status} onApply={(v) => { setPage(1); setStatus(v); }} />}
      {uploadOpen && (
        <EmployeeFileDialog kind="certification" onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); }} />
      )}
    </div>
  );
}
