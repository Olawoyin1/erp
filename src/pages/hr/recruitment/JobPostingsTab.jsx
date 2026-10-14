import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiPauseCircle, FiPlayCircle, FiX, FiEdit2, FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchJobPostings, createJobPosting, updateJobPosting,
  pauseJobPosting, resumeJobPosting, closeJobPosting,
} from '../../../store/hr/recruitmentSlice';
import { recruitmentService } from '../../../services/hr.service';
import { formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, fullName, saveBlob, blobErrorMessage, ymd } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';
import { StatusPill, RowActionsMenu, ReasonModal } from './recruitmentUi';
import { JOB_STATUS_STYLES, btnOutline, btnPrimary, btnCancel } from './recruitmentConstants';

const ROWS_PER_PAGE = 10;
const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);
const nameOf = (ref) => (ref && typeof ref === 'object' ? ref.name : '') || '—';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(JOB_STATUS_STYLES).map(([value, s]) => ({ value, label: s.label })),
];

function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter job postings" width="380px"
      footer={
        <>
          <button onClick={() => { onApply(''); onClose(); }} style={{ ...btnCancel, border: 'none' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={btnPrimary}>Apply</button>
        </>
      }>
      <FormField label="Status">
        <Select value={draft} onChange={(e) => setDraft(e.target.value)} options={STATUS_FILTERS} />
      </FormField>
    </Drawer>
  );
}

// ─── View ─────────────────────────────────────────────────────────────────────
function ViewJobDrawer({ job, onClose, onEdit, onPause, onResume, onCloseJob, canUpdate }) {
  const footer = canUpdate ? (
    <>
      {job.status === 'open' && (
        <button onClick={() => onPause(job)} style={btnOutline('#EA580C', '#FFF7ED', '#FED7AA')}><FiPauseCircle size={14} /> Pause Recruitment</button>
      )}
      {job.status === 'paused' && (
        <button onClick={() => onResume(job)} style={btnOutline('#16A34A', '#F0FDF4', '#BBF7D0')}><FiPlayCircle size={14} /> Continue Recruitment</button>
      )}
      {['open', 'paused', 'interviewing'].includes(job.status) && (
        <button onClick={() => onCloseJob(job)} style={btnOutline('#DC2626', '#FEF2F2', '#FECACA')}><FiX size={14} /> Close Job Opening</button>
      )}
      {job.status !== 'closed' && <button onClick={() => onEdit(job)} style={btnPrimary}><FiEdit2 size={14} /> Edit Position</button>}
    </>
  ) : null;

  return (
    <Drawer isOpen onClose={onClose} title="Job Details" subtitle={job.jobId} footer={footer} width="480px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
        <StatusPill status={job.status} styles={JOB_STATUS_STYLES} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          ['POSITION', job.position],
          ['DEPARTMENT', nameOf(job.departmentId)],
          ['LOCATION', nameOf(job.locationId)],
          ['RECEIVED APPLICATIONS', job.applicationsReceived ?? 0],
          ['TYPE', job.employmentType],
          ['HIRING SUPERVISOR', fullName(job.hiringSupervisorId)],
          ['VACANCIES', `${job.filledCount ?? 0} filled of ${job.vacancies ?? 1}`],
          ['OPENED', formatDate(job.createdAt)],
          ['CLOSING', formatDate(job.closingDate)],
          ['SALARY RANGE', job.salaryRange],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
          </div>
        ))}
      </div>
      {job.jobDescription && (
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>JOB DESCRIPTION DETAILS</div>
          <p style={{ fontSize: '0.83rem', color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{job.jobDescription}</p>
        </div>
      )}
      {job.mandatoryRequirements && (
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>MANDATORY REQUIREMENTS</div>
          <pre style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font)' }}>{job.mandatoryRequirements}</pre>
        </div>
      )}
    </Drawer>
  );
}

// ─── Create / edit ────────────────────────────────────────────────────────────
function JobOpeningDrawer({ onClose, onSave, editJob, lookups }) {
  const isEdit = !!editJob;
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [supervisor, setSupervisor] = useState(editJob && typeof editJob.hiringSupervisorId === 'object' ? editJob.hiringSupervisorId : null);
  const [form, setForm] = useState(() => ({
    position: editJob?.position || '',
    departmentId: idOf(editJob?.departmentId) || '',
    hiringSupervisorId: idOf(editJob?.hiringSupervisorId) || '',
    employmentType: editJob?.employmentType || 'Full-time',
    locationId: idOf(editJob?.locationId) || '',
    salaryRange: editJob?.salaryRange || '',
    closingDate: ymd(editJob?.closingDate),
    vacancies: String(editJob?.vacancies ?? 1),
    jobDescription: editJob?.jobDescription || '',
    mandatoryRequirements: editJob?.mandatoryRequirements || '',
  }));

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const next = {};
    if (!form.position.trim()) next.position = 'Enter the position';
    if (!form.departmentId) next.departmentId = 'Choose a department';
    if (!form.hiringSupervisorId) next.hiringSupervisorId = 'Choose the hiring supervisor';
    if (!form.employmentType) next.employmentType = 'Choose an employment type';
    if (!form.locationId) next.locationId = 'Choose a location';
    if (!form.salaryRange.trim()) next.salaryRange = 'Enter the salary range';
    const vacancies = Number(form.vacancies);
    if (!Number.isInteger(vacancies) || vacancies < 1) next.vacancies = 'Enter a whole number of 1 or more';
    else if (isEdit && vacancies < (editJob.filledCount ?? 0)) next.vacancies = `${editJob.filledCount} hire(s) already made`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    setFormError('');
    if (!validate()) return;
    setSaving(true);
    const body = {
      position: form.position.trim(),
      departmentId: form.departmentId,
      hiringSupervisorId: form.hiringSupervisorId,
      employmentType: form.employmentType,
      locationId: form.locationId,
      salaryRange: form.salaryRange.trim(),
      vacancies: Number(form.vacancies),
      ...(form.closingDate ? { closingDate: form.closingDate } : {}),
      ...(form.jobDescription.trim() ? { jobDescription: form.jobDescription.trim() } : {}),
      ...(form.mandatoryRequirements.trim() ? { mandatoryRequirements: form.mandatoryRequirements.trim() } : {}),
    };
    const failure = await onSave(body);
    setSaving(false);
    if (failure) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  const typeOptions = lookups.employmentTypes.includes(form.employmentType) ? lookups.employmentTypes : [form.employmentType, ...lookups.employmentTypes];

  return (
    <Drawer isOpen onClose={onClose} title={isEdit ? 'Edit Job Opening' : 'Create Job Opening'} subtitle="Set position details, requirements, and closing date" width="560px"
      footer={
        <>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Job Opening'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(formError || lookups.error) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError || lookups.error}</span>
          </div>
        )}
        <FormField label="Position" required error={errors.position}>
          <Input value={form.position} error={!!errors.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Structural Engineer" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Department" required error={errors.departmentId}>
            <Select value={form.departmentId} searchable error={!!errors.departmentId} placeholder={lookups.loading ? 'Loading…' : 'Select department'}
              onChange={(e) => set('departmentId', e.target.value)} options={lookups.departments.map((d) => ({ value: d._id, label: d.name }))} />
          </FormField>
          <FormField label="Hiring supervisor" required error={errors.hiringSupervisorId}>
            <EmployeePicker value={form.hiringSupervisorId} selected={supervisor} params={{ activeOnly: 'true' }} error={!!errors.hiringSupervisorId}
              onChange={(id, emp) => { set('hiringSupervisorId', id); setSupervisor(emp); }} />
          </FormField>
          <FormField label="Employment type" required error={errors.employmentType}>
            <Select value={form.employmentType} onChange={(e) => set('employmentType', e.target.value)} options={typeOptions} />
          </FormField>
          <FormField label="Location" required error={errors.locationId}>
            <Select value={form.locationId} searchable error={!!errors.locationId} placeholder={lookups.loading ? 'Loading…' : 'Select location'}
              onChange={(e) => set('locationId', e.target.value)} options={lookups.locations.map((l) => ({ value: l._id, label: l.name }))} />
          </FormField>
          <FormField label="Salary range" required error={errors.salaryRange}>
            <Input value={form.salaryRange} error={!!errors.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} placeholder="₦350,000 – ₦500,000 / month" />
          </FormField>
          <FormField label="Closing date" error={errors.closingDate}>
            <DatePicker value={form.closingDate} onChange={(e) => set('closingDate', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Vacancies" required error={errors.vacancies} helpText="The opening closes by itself once this many hires are made">
          <Input type="number" min="1" value={form.vacancies} error={!!errors.vacancies} onChange={(e) => set('vacancies', e.target.value)} style={{ maxWidth: 140 }} />
        </FormField>
        <FormField label="Job description details" error={errors.jobDescription}>
          <Textarea value={form.jobDescription} onChange={(e) => set('jobDescription', e.target.value)} placeholder="Enter the job position details…" rows={5} />
        </FormField>
        <FormField label="Mandatory requirements" error={errors.mandatoryRequirements}>
          <Textarea value={form.mandatoryRequirements} onChange={(e) => set('mandatoryRequirements', e.target.value)} placeholder="Enter requirements for this position…" rows={5} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
export default function JobPostingsTab({ showToast }) {
  const dispatch = useDispatch();
  const { jobs, jobsMeta, jobsLoading, jobsError } = useSelector((s) => s.recruitment);
  const canCreate = usePermission('hr.jobposting.create');
  const canUpdate = usePermission('hr.jobposting.update');

  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [pauseTarget, setPauseTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [lookups, setLookups] = useState({ loading: true, error: '', departments: [], locations: [], employmentTypes: ['Full-time', 'Part-time', 'Contract', 'Internship'] });
  const debounceRef = useRef(null);

  const params = useCallback(() => ({ page, limit: ROWS_PER_PAGE, ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) }), [page, activeSearch, status]);
  const reload = useCallback(() => dispatch(fetchJobPostings(params())), [dispatch, params]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (!canCreate && !canUpdate) return undefined;
    let cancelled = false;
    recruitmentService.jobLookups()
      .then((res) => {
        const d = res.data?.data;
        if (!cancelled) setLookups((l) => ({ ...l, loading: false, error: '', departments: d.departments, locations: d.locations, employmentTypes: d.employmentTypes }));
      })
      .catch(() => { if (!cancelled) setLookups((l) => ({ ...l, loading: false, error: 'Departments and locations could not be loaded' })); });
    return () => { cancelled = true; };
  }, [canCreate, canUpdate]);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleSave = async (body) => {
    if (drawer?.job) {
      const result = await dispatch(updateJobPosting({ id: drawer.job._id, data: body }));
      if (updateJobPosting.fulfilled.match(result)) {
        showToast('Job opening updated', 'success');
        setDrawer(null);
        reload();
        return undefined;
      }
      return failureOf(result.payload);
    }
    const result = await dispatch(createJobPosting(body));
    if (createJobPosting.fulfilled.match(result)) {
      showToast(`Job opening ${result.payload.jobId} created`, 'success');
      setDrawer(null);
      setPage(1);
      reload();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handlePause = async (reason) => {
    const result = await dispatch(pauseJobPosting({ id: pauseTarget._id, reason }));
    if (pauseJobPosting.fulfilled.match(result)) {
      showToast(`Job opening (${pauseTarget.jobId}) successfully paused`, 'success');
      setPauseTarget(null);
      return '';
    }
    return result.payload?.message || 'Pause failed';
  };

  const handleResume = async (job) => {
    const result = await dispatch(resumeJobPosting(job._id));
    if (resumeJobPosting.fulfilled.match(result)) showToast('Recruitment resumed', 'success');
    else showToast(result.payload?.message || 'Resume failed', 'error');
  };

  const handleClose = async (reason) => {
    const result = await dispatch(closeJobPosting({ id: closeTarget._id, reason }));
    if (closeJobPosting.fulfilled.match(result)) {
      showToast('Job opening closed', 'success');
      setCloseTarget(null);
      return '';
    }
    return result.payload?.message || 'Close failed';
  };

  const handleExport = async () => {
    try {
      const res = await recruitmentService.exportJobs({ ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) });
      saveBlob(res.data, 'job-postings.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const viewJob = jobs.find((j) => j._id === viewId);

  const columns = [
    { key: 'jobId', label: 'JOB ID', nowrap: true, render: (v) => <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>{v}</span> },
    { key: 'position', label: 'POSITION', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (v) => <span style={{ color: '#475569' }}>{nameOf(v)}</span> },
    { key: 'locationId', label: 'LOCATION', render: (v) => <span style={{ color: '#475569' }}>{nameOf(v)}</span> },
    { key: 'applicationsReceived', label: 'APPLICATIONS RECEIVED', align: 'center', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v ?? 0}</span> },
    { key: 'vacancies', label: 'FILLED', align: 'center', render: (v, row) => <span style={{ color: '#334155' }}>{row.filledCount ?? 0} / {v ?? 1}</span> },
    { key: 'employmentType', label: 'TYPE', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} styles={JOB_STATUS_STYLES} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => {
        const acts = [];
        if (canUpdate) {
          if (row.status !== 'closed') acts.push({ label: 'Edit Position', icon: 'edit', action: 'edit' });
          if (row.status === 'open') acts.push({ label: 'Pause Recruitment', icon: 'pause', action: 'pause' });
          if (row.status === 'paused') acts.push({ label: 'Continue Recruitment', icon: 'play', action: 'resume' });
          if (['open', 'paused', 'interviewing'].includes(row.status)) acts.push({ label: 'Close Job Opening', icon: 'x', action: 'close', danger: true });
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <button className="icon-btn" onClick={() => setViewId(row._id)} title="View"><FiEye size={15} /></button>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RowActionsMenu actions={acts} onAction={(action) => {
                if (action === 'edit') setDrawer({ job: row });
                if (action === 'pause') setPauseTarget(row);
                if (action === 'resume') handleResume(row);
                if (action === 'close') setCloseTarget(row);
              }} />
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="table-toolbar" style={{ marginBottom: 16 }}>
        <div className="table-toolbar-search">
          <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search job id, position…" style={{ paddingLeft: 36, width: '100%' }} />
        </div>
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}>
            <FiFilter size={14} /> Filter{status ? ' (1)' : ''}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}>
            <FiDownload size={14} /> Export
          </button>
          {canCreate && (
            <button onClick={() => setDrawer({ job: null })} style={{ ...btnPrimary, padding: '9px 18px' }}><FiPlus size={15} /> Create Job Opening</button>
          )}
        </div>
      </div>

      {jobsError ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>{jobsError}</div>
          <button className="btn btn-secondary" onClick={reload}>Try again</button>
        </div>
      ) : jobsLoading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>{Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>{Array.from({ length: 9 }).map((__, j) => <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>)}</tr>
          ))}</tbody>
        </table>
      ) : (
        <DataTable columns={columns} data={jobs} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === jobs.length ? [] : jobs.map((r) => r._id))}
          emptyMessage={activeSearch || status ? 'No job postings match your search or filter.' : 'No job postings yet.'} />
      )}
      {jobsMeta?.totalPages > 1 && <Pagination currentPage={page} totalPages={jobsMeta.totalPages} onPageChange={setPage} />}

      {viewJob && (
        <ViewJobDrawer job={viewJob} canUpdate={canUpdate} onClose={() => setViewId(null)}
          onEdit={(j) => { setViewId(null); setDrawer({ job: j }); }}
          onPause={(j) => { setViewId(null); setPauseTarget(j); }}
          onResume={handleResume}
          onCloseJob={(j) => { setViewId(null); setCloseTarget(j); }} />
      )}

      {drawer && <JobOpeningDrawer key={drawer.job?._id || 'new'} editJob={drawer.job} lookups={lookups} onClose={() => setDrawer(null)} onSave={handleSave} />}

      {pauseTarget && (
        <ReasonModal onClose={() => setPauseTarget(null)} onConfirm={handlePause} title="Pause Recruitment?" subtitle="Please provide a reason for pausing this recruitment."
          placeholder="e.g. Budget review in progress" btnLabel="Pause Recruitment" btnColor="#EA580C" />
      )}
      {closeTarget && (
        <ReasonModal onClose={() => setCloseTarget(null)} onConfirm={handleClose} title="Close Job Opening?" subtitle="This closes the job opening. Candidates already in the pipeline stay on record."
          placeholder="e.g. Position filled" btnLabel="Close Job Opening" />
      )}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={status} onApply={(v) => { setPage(1); setStatus(v); }} />}
    </>
  );
}
