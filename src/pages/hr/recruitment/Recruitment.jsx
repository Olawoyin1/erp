import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiUpload,
  FiEye, FiMoreVertical, FiCheck, FiX, FiEdit2,
  FiPauseCircle, FiPlayCircle, FiFileText, FiCheckCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  fetchJobPostings, createJobPosting, updateJobPosting,
  pauseJobPosting, resumeJobPosting, closeJobPosting,
  fetchCandidates, advanceCandidateStage, rejectCandidateAction,
} from '../../../store/hr/recruitmentSlice';

const ROWS_PER_PAGE = 10;

// ─── Static options (no API endpoint) ────────────────────────────────────────
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

// ─── Status style maps ────────────────────────────────────────────────────────
const JOB_STATUS_STYLES = {
  open:         { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Open' },
  paused:       { bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A', label: 'Paused' },
  interviewing: { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA', label: 'Interviewing' },
  closed:       { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Closed' },
};

const STAGE_STYLES = {
  applied:    { bg: '#F1F5F9', color: '#475569',  border: '#E2E8F0' },
  screening:  { bg: '#FFF7ED', color: '#EA580C',  border: '#FED7AA' },
  assessment: { bg: '#EFF6FF', color: '#2563EB',  border: '#BFDBFE' },
  interview:  { bg: '#F5F3FF', color: '#7C3AED',  border: '#DDD6FE' },
  offer:      { bg: '#FEFCE8', color: '#CA8A04',  border: '#FDE68A' },
  hired:      { bg: '#F0FDF4', color: '#16A34A',  border: '#BBF7D0' },
  rejected:   { bg: '#FEF2F2', color: '#DC2626',  border: '#FECACA' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getName(f) {
  if (!f) return '—';
  return typeof f === 'string' ? f : f.fullName || f.name || '—';
}

function getDept(f) {
  if (!f) return '—';
  return typeof f === 'string' ? f : f.name || '—';
}

function getLocation(f) {
  if (!f) return '—';
  return typeof f === 'string' ? f : f.name || '—';
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function StatusPill({ status, styles }) {
  const key = status?.toLowerCase().replace(/_/g, '') || '';
  const s = styles[key] || styles[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: status };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label || status}
    </span>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #F1F5F9' }}>{label}</div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '0.84rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────
const btnPrimary = { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '7px', border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' };
const btnCancel  = { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '7px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#64748B', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' };
function btnOutline(color, bg, border) { return { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '7px', border: `1px solid ${border}`, backgroundColor: bg, color, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }; }

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  if (!actions?.length) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '34px', zIndex: 1200, backgroundColor: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)', minWidth: '180px', padding: '6px' }}>
          {actions.map((act) => (
            <button key={act.action} type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, color: act.danger ? '#DC2626' : '#1E293B', fontFamily: 'var(--font)', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = act.danger ? '#FEF2F2' : '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {act.icon === 'check'  && <FiCheckCircle size={14} />}
              {act.icon === 'x'     && <FiX size={14} />}
              {act.icon === 'pause' && <FiPauseCircle size={14} />}
              {act.icon === 'play'  && <FiPlayCircle size={14} />}
              {act.icon === 'edit'  && <FiEdit2 size={14} />}
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View Job Drawer ──────────────────────────────────────────────────────────
function ViewJobDrawer({ job, onClose, onEdit, onPause, onResume, onCloseJob }) {
  if (!job) return null;

  const footer = (
    <>
      {job.status === 'open' && (
        <button onClick={() => onPause(job)} style={btnOutline('#EA580C', '#FFF7ED', '#FED7AA')}>
          <FiPauseCircle size={14} /> Pause Recruitment
        </button>
      )}
      {job.status === 'paused' && (
        <button onClick={() => onResume(job)} style={btnOutline('#16A34A', '#F0FDF4', '#BBF7D0')}>
          <FiPlayCircle size={14} /> Continue Recruitment
        </button>
      )}
      {['open', 'paused', 'interviewing'].includes(job.status) && (
        <button onClick={() => onCloseJob(job)} style={btnOutline('#DC2626', '#FEF2F2', '#FECACA')}>
          <FiX size={14} /> Close Job Opening
        </button>
      )}
      <button onClick={() => onEdit(job)} style={btnPrimary}>
        <FiEdit2 size={14} /> Edit Position
      </button>
    </>
  );

  return (
    <Drawer isOpen={!!job} onClose={onClose} title="Job Details" subtitle={job.jobId} footer={footer} width="480px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
        <StatusPill status={job.status} styles={JOB_STATUS_STYLES} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {[
          ['POSITION', job.position],
          ['DEPARTMENT', getDept(job.departmentId)],
          ['LOCATION', getLocation(job.locationId)],
          ['APPLICATIONS', job.applicationsReceived ?? 0],
          ['TYPE', job.employmentType],
          ['HIRING SUPERVISOR', getName(job.hiringSupervisorId)],
          ['OPENING DATE', fmtDate(job.createdAt)],
          ['CLOSING DATE', fmtDate(job.closingDate)],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{value || '—'}</div>
          </div>
        ))}
      </div>
      {job.salaryRange && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>SALARY RANGE</div>
          <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{job.salaryRange}</div>
        </div>
      )}
      {job.jobDescription && (
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>JOB DESCRIPTION</div>
          <p style={{ fontSize: '0.83rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>{job.jobDescription}</p>
        </div>
      )}
      {job.mandatoryRequirements && (
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>MANDATORY REQUIREMENTS</div>
          <pre style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font)' }}>{job.mandatoryRequirements}</pre>
        </div>
      )}
    </Drawer>
  );
}

// ─── View Candidate Drawer ────────────────────────────────────────────────────
const STAGE_ORDER = ['applied', 'screening', 'assessment', 'interview', 'offer', 'hired'];

function ViewCandidateDrawer({ candidate, onClose, onAdvance, onReject }) {
  if (!candidate) return null;
  const isTerminal = candidate.stage === 'hired' || candidate.stage === 'rejected';
  const isHired    = candidate.stage === 'hired';

  const footer = !isTerminal ? (
    <>
      <button onClick={() => onReject(candidate)} style={btnOutline('#DC2626', '#FEF2F2', '#FECACA')}>
        <FiX size={14} /> Reject
      </button>
      <button onClick={() => onAdvance(candidate._id)} style={btnPrimary}>
        <FiCheck size={14} /> Advance to {STAGE_ORDER[STAGE_ORDER.indexOf(candidate.stage) + 1] || 'Next'}
      </button>
    </>
  ) : null;

  return (
    <Drawer isOpen={!!candidate} onClose={onClose} title={candidate.fullName} subtitle={candidate.candidateId} footer={footer} width="480px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Stage:</span>
        <StatusPill status={candidate.stage} styles={STAGE_STYLES} />
      </div>

      <Section label="CANDIDATE PROFILE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <InfoItem label="FULL NAME"      value={candidate.fullName} />
          <InfoItem label="CANDIDATE ID"   value={candidate.candidateId} />
          <InfoItem label="EMAIL"          value={candidate.email} />
          <InfoItem label="PHONE NUMBER"   value={candidate.phone} />
          <InfoItem label="LOCATION"       value={candidate.location} />
        </div>
      </Section>

      <Section label="APPLICATION DETAILS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <InfoItem label="APPLIED POSITION" value={candidate.appliedPositionId?.position || '—'} />
          <InfoItem label="DEPARTMENT"       value={getDept(candidate.appliedPositionId?.departmentId)} />
          <InfoItem label="RECRUITER"        value={getName(candidate.recruiterId)} />
          <InfoItem label="EXPERIENCE"       value={candidate.experience} />
          <InfoItem label="APPLICATION DATE" value={fmtDate(candidate.applicationDate || candidate.createdAt)} />
          <InfoItem label="STAGE"            value={candidate.stage} />
        </div>
      </Section>

      {candidate.professionalSummary && (
        <Section label="PROFESSIONAL SUMMARY">
          <p style={{ fontSize: '0.83rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{candidate.professionalSummary}</p>
        </Section>
      )}

      {candidate.documents?.length > 0 && (
        <Section label="UPLOADED DOCUMENTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {candidate.documents.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiFileText size={15} color="#64748B" />
                  <span style={{ fontSize: '0.83rem', color: '#1E293B', fontWeight: 500 }}>{doc.originalName || doc.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 500 }}>Uploaded</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </Drawer>
  );
}

// ─── Create/Edit Job Opening Drawer ──────────────────────────────────────────
function JobOpeningDrawer({ isOpen, onClose, onSave, editJob, saving }) {
  const isEdit = !!editJob;
  const [form, setForm] = useState({ position: '', employmentType: 'Full-time', salaryRange: '', closingDate: '', jobDescription: '', mandatoryRequirements: '' });

  useEffect(() => {
    if (editJob) {
      setForm({
        position: editJob.position || '',
        employmentType: editJob.employmentType || 'Full-time',
        salaryRange: editJob.salaryRange || '',
        closingDate: editJob.closingDate ? editJob.closingDate.split('T')[0] : '',
        jobDescription: editJob.jobDescription || '',
        mandatoryRequirements: editJob.mandatoryRequirements || '',
      });
    } else {
      setForm({ position: '', employmentType: 'Full-time', salaryRange: '', closingDate: '', jobDescription: '', mandatoryRequirements: '' });
    }
  }, [editJob, isOpen]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  const footer = (
    <>
      <button onClick={onClose} style={btnCancel}>Cancel</button>
      <button onClick={() => onSave(form)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Job Opening'}
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Job Opening' : 'Create Job Opening'} subtitle="Set position details, requirements, and closing date" width="540px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="Position" required>
          <Input value={form.position} onChange={set('position')} placeholder="e.g. Structural Engineer" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Employment Type" required>
            <Select value={form.employmentType} onChange={set('employmentType')} options={EMPLOYMENT_TYPES} />
          </FormField>
          <FormField label="Salary Range">
            <Input value={form.salaryRange} onChange={set('salaryRange')} placeholder="₦350,000 – ₦500,000 / month" />
          </FormField>
        </div>
        <FormField label="Closing Date">
          <DatePicker value={form.closingDate} onChange={set('closingDate')} />
        </FormField>
        <FormField label="Job Description">
          <Textarea value={form.jobDescription} onChange={set('jobDescription')} placeholder="Describe the role responsibilities..." rows={4} />
        </FormField>
        <FormField label="Mandatory Requirements">
          <Textarea value={form.mandatoryRequirements} onChange={set('mandatoryRequirements')} placeholder="List mandatory qualifications..." rows={4} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Pause / Close reason modals ──────────────────────────────────────────────
function ReasonModal({ isOpen, onClose, onConfirm, title, subtitle, placeholder, btnLabel, btnColor = '#DC2626' }) {
  const [reason, setReason] = useState('');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px"
      footer={
        <>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={() => { onConfirm(reason); setReason(''); }} disabled={!reason.trim()}
            style={{ ...btnPrimary, backgroundColor: btnColor, opacity: reason.trim() ? 1 : 0.5, cursor: reason.trim() ? 'pointer' : 'not-allowed' }}>
            {btnLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>{subtitle}</p>
      <FormField label="Reason" required>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} rows={3} />
      </FormField>
    </Modal>
  );
}

// ─── Job Postings Tab ─────────────────────────────────────────────────────────
function JobPostingsTab({ showToast }) {
  const dispatch = useDispatch();
  const { jobs, jobsMeta, jobsLoading } = useSelector((s) => s.recruitment);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewJob, setViewJob]   = useState(null);
  const [editJob, setEditJob]   = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [pauseTarget, setPauseTarget]   = useState(null);
  const [closeTarget, setCloseTarget]   = useState(null);

  const load = useCallback(() => {
    dispatch(fetchJobPostings({ page, limit: ROWS_PER_PAGE, ...(search ? { q: search } : {}) }));
  }, [dispatch, page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    if (editJob) {
      const result = await dispatch(updateJobPosting({ id: editJob._id, ...form }));
      if (result.meta.requestStatus === 'fulfilled') { showToast('Job opening updated', 'success'); setEditJob(null); }
      else showToast(result.payload || 'Update failed', 'error');
    } else {
      const result = await dispatch(createJobPosting(form));
      if (result.meta.requestStatus === 'fulfilled') { showToast('Job opening created', 'success'); setCreateOpen(false); }
      else showToast(result.payload || 'Create failed', 'error');
    }
    setSaving(false);
  };

  const handlePause = async (reason) => {
    const result = await dispatch(pauseJobPosting({ id: pauseTarget._id, reason }));
    if (result.meta.requestStatus === 'fulfilled') { showToast('Recruitment paused', 'success'); setViewJob(null); }
    else showToast(result.payload || 'Pause failed', 'error');
    setPauseTarget(null);
  };

  const handleResume = async (job) => {
    const result = await dispatch(resumeJobPosting(job._id));
    if (result.meta.requestStatus === 'fulfilled') { showToast('Recruitment resumed', 'success'); setViewJob(null); }
    else showToast(result.payload || 'Resume failed', 'error');
  };

  const handleClose = async (reason) => {
    const result = await dispatch(closeJobPosting({ id: closeTarget._id, reason }));
    if (result.meta.requestStatus === 'fulfilled') { showToast('Job opening closed', 'success'); setViewJob(null); }
    else showToast(result.payload || 'Close failed', 'error');
    setCloseTarget(null);
  };

  const columns = [
    { key: 'jobId', label: 'JOB ID', nowrap: true, render: (v) => <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>{v}</span> },
    { key: 'position', label: 'POSITION', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { key: 'departmentId', label: 'DEPARTMENT', render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{getDept(v)}</span> },
    { key: 'locationId', label: 'LOCATION', render: (v) => <span style={{ color: '#475569' }}>{getLocation(v)}</span> },
    { key: 'applicationsReceived', label: 'APPLICATIONS', align: 'center', render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v ?? 0}</span> },
    { key: 'employmentType', label: 'TYPE', render: (v) => <span style={{ color: '#7C3AED', fontWeight: 600, fontSize: '0.78rem' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: (v) => <StatusPill status={v} styles={JOB_STATUS_STYLES} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => {
        const acts = [];
        if (row.status === 'open') { acts.push({ label: 'Edit Position', icon: 'edit', action: 'edit' }); acts.push({ label: 'Pause Recruitment', icon: 'pause', action: 'pause' }); }
        if (row.status === 'paused') { acts.push({ label: 'Edit Position', icon: 'edit', action: 'edit' }); acts.push({ label: 'Continue Recruitment', icon: 'play', action: 'resume' }); }
        if (['open', 'paused', 'interviewing'].includes(row.status)) acts.push({ label: 'Close Job Opening', icon: 'x', action: 'close', danger: true });
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <button onClick={() => setViewJob(row)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <FiEye size={15} />
            </button>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {acts.length > 0 && <RowActionsMenu actions={acts} onAction={(action) => {
                if (action === 'edit')   { setViewJob(null); setEditJob(row); }
                if (action === 'pause')  { setViewJob(null); setPauseTarget(row); }
                if (action === 'resume') handleResume(row);
                if (action === 'close')  { setViewJob(null); setCloseTarget(row); }
              }} />}
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
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search job ID, position..." style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div className="table-toolbar-actions">
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font)' }}><FiFilter size={14} /> Filter</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font)' }}><FiDownload size={14} /> Export</button>
          <button onClick={() => setCreateOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}><FiPlus size={15} /> Create Job Opening</button>
        </div>
      </div>

      {jobsLoading ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading job postings…</div>
      ) : (
        <DataTable columns={columns} data={jobs} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === jobs.length ? [] : jobs.map((r) => r._id))}
          emptyMessage="No job postings found." />
      )}
      <Pagination currentPage={page} totalPages={jobsMeta?.totalPages || 1} onPageChange={setPage} />

      {/* View Job Drawer */}
      {viewJob && (
        <ViewJobDrawer job={jobs.find((j) => j._id === viewJob._id) || viewJob} onClose={() => setViewJob(null)}
          onEdit={(j) => { setViewJob(null); setEditJob(j); }}
          onPause={(j) => { setViewJob(null); setPauseTarget(j); }}
          onResume={handleResume}
          onCloseJob={(j) => { setViewJob(null); setCloseTarget(j); }}
        />
      )}

      {/* Create/Edit Drawer */}
      <JobOpeningDrawer isOpen={createOpen || !!editJob} onClose={() => { setCreateOpen(false); setEditJob(null); }} onSave={handleSave} editJob={editJob} saving={saving} />

      {/* Pause reason modal */}
      <ReasonModal isOpen={!!pauseTarget} onClose={() => setPauseTarget(null)} onConfirm={handlePause} title="Pause Recruitment?" subtitle="Please provide a reason for pausing this recruitment." placeholder="e.g. Budget review in progress" btnLabel="Pause Recruitment" btnColor="#EA580C" />

      {/* Close reason modal */}
      <ReasonModal isOpen={!!closeTarget} onClose={() => setCloseTarget(null)} onConfirm={handleClose} title="Close Job Opening?" subtitle="This will close the job opening and notify all pending candidates." placeholder="e.g. Position filled" btnLabel="Close Job Opening" />
    </>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────
function CandidatesTab({ showToast }) {
  const dispatch = useDispatch();
  const { candidates, candidatesMeta, candidatesLoading } = useSelector((s) => s.recruitment);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewCand, setViewCand] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchCandidates({ page, limit: ROWS_PER_PAGE, ...(search ? { q: search } : {}) }));
  }, [dispatch, page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  const handleAdvance = async (id) => {
    const result = await dispatch(advanceCandidateStage(id));
    if (result.meta.requestStatus === 'fulfilled') { showToast('Candidate advanced to next stage', 'success'); setViewCand(null); }
    else showToast(result.payload || 'Advance failed', 'error');
  };

  const handleRejectConfirm = async (reason) => {
    const result = await dispatch(rejectCandidateAction({ id: rejectTarget._id, reason }));
    if (result.meta.requestStatus === 'fulfilled') { showToast('Candidate rejected', 'success'); setRejectTarget(null); }
    else showToast(result.payload || 'Reject failed', 'error');
  };

  const columns = [
    { key: 'candidateId', label: 'CANDIDATE ID', nowrap: true, render: (v) => <span style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>{v}</span> },
    { key: 'fullName', label: 'CANDIDATE', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { key: 'appliedPositionId', label: 'APPLIED POSITION', render: (v) => <span style={{ color: '#475569' }}>{v?.position || '—'}</span> },
    { key: 'recruiterId', label: 'RECRUITER', render: (v) => <span style={{ color: '#475569' }}>{getName(v)}</span> },
    { key: 'experience', label: 'EXPERIENCE', align: 'center', render: (v) => <span style={{ color: '#475569' }}>{v || '—'}</span> },
    { key: 'applicationDate', label: 'APPLICATION DATE', nowrap: true, render: (v, row) => <span style={{ color: '#475569' }}>{fmtDate(v || row.createdAt)}</span> },
    { key: 'stage', label: 'STAGE', render: (v) => <StatusPill status={v} styles={STAGE_STYLES} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => {
        const isTerminal = row.stage === 'hired' || row.stage === 'rejected';
        const acts = !isTerminal ? [
          { label: 'Advance Stage', icon: 'check', action: 'advance' },
          { label: 'Reject',        icon: 'x',     action: 'reject', danger: true },
        ] : [];
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <button onClick={() => setViewCand(row)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F1F5F9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <FiEye size={15} />
            </button>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {acts.length > 0 && <RowActionsMenu actions={acts} onAction={(action) => {
                if (action === 'advance') handleAdvance(row._id);
                if (action === 'reject')  { setViewCand(null); setRejectTarget(row); }
              }} />}
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
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, position, ID..." style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div className="table-toolbar-actions">
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font)' }}><FiFilter size={14} /> Filter</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', cursor: 'pointer', fontFamily: 'var(--font)' }}><FiDownload size={14} /> Export</button>
        </div>
      </div>

      {candidatesLoading ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading candidates…</div>
      ) : (
        <DataTable columns={columns} data={candidates} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === candidates.length ? [] : candidates.map((r) => r._id))}
          emptyMessage="No candidates found." />
      )}
      <Pagination currentPage={page} totalPages={candidatesMeta?.totalPages || 1} onPageChange={setPage} />

      {/* View Candidate Drawer */}
      {viewCand && (
        <ViewCandidateDrawer
          candidate={candidates.find((c) => c._id === viewCand._id) || viewCand}
          onClose={() => setViewCand(null)}
          onAdvance={handleAdvance}
          onReject={(c) => { setViewCand(null); setRejectTarget(c); }}
        />
      )}

      {/* Reject Modal */}
      <ReasonModal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleRejectConfirm}
        title="Reject Candidate?" subtitle={`Are you sure you want to reject ${rejectTarget?.fullName}? This action will be recorded for audit purposes.`}
        placeholder="Enter reason for rejection..." btnLabel="Reject Candidate" />
    </>
  );
}

// ─── Main Recruitment Page ────────────────────────────────────────────────────
export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('jobPostings');
  const { toast, showToast, hideToast } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Recruitment</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Oversee recruitment activities, job postings, and candidate selection workflows
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Main Content Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: '8px' }}>
          {[{ key: 'jobPostings', label: 'Job Postings' }, { key: 'candidates', label: 'Candidates' }].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                style={{ padding: '10px 16px', fontFamily: 'var(--font)', fontSize: '0.875rem', fontWeight: isActive ? 600 : 500, background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#1D4ED8' : '#64748B', borderBottom: isActive ? '2px solid #1D4ED8' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s ease' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'jobPostings' && <JobPostingsTab showToast={showToast} />}
        {activeTab === 'candidates'  && <CandidatesTab showToast={showToast} />}
      </div>
    </div>
  );
}
