import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  FiMail,
  FiEdit2,
  FiPauseCircle,
  FiPlayCircle,
  FiUser,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiFileText,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Drawer from '../../../components/ui/Drawer';
import Toast, { useToast } from '../../../components/ui/Toast';
import { FormField, Input, Select, Textarea, DatePicker } from '../../../components/ui/FormField';
import {
  mockJobPostings,
  mockCandidates,
  DEPARTMENTS,
  LOCATIONS,
  EMPLOYMENT_TYPES,
  HIRING_SUPERVISORS,
  STAGE_ACTIONS,
} from '../../../data/mockRecruitment';

const ROWS_PER_PAGE = 10;

// ─── Status badge colors ──────────────────────────────────────────────────────
const JOB_STATUS_STYLES = {
  Open:         { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Paused:       { bg: '#FEF9C3', color: '#CA8A04', border: '#FDE68A' },
  Interviewing: { bg: '#FFF7ED', color: '#EA580C', border: '#FED7AA' },
  Closed:       { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
};

const STAGE_STYLES = {
  Applied:    { bg: '#F1F5F9', color: '#475569',  border: '#E2E8F0' },
  Screening:  { bg: '#FFF7ED', color: '#EA580C',  border: '#FED7AA' },
  Assessment: { bg: '#EFF6FF', color: '#2563EB',  border: '#BFDBFE' },
  Interview:  { bg: '#F5F3FF', color: '#7C3AED',  border: '#DDD6FE' },
  Offer:      { bg: '#FEFCE8', color: '#CA8A04',  border: '#FDE68A' },
  Hired:      { bg: '#F0FDF4', color: '#16A34A',  border: '#BBF7D0' },
  Rejected:   { bg: '#FEF2F2', color: '#DC2626',  border: '#FECACA' },
};

const TYPE_COLORS = {
  'Full-Time':  '#1D4ED8',
  'Contract':   '#7C3AED',
  'Part-Time':  '#0891B2',
  'Internship': '#059669',
};

function StatusPill({ status, styles }) {
  const s = styles[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {status}
    </span>
  );
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────
function RowActionsMenu({ actions, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!actions || actions.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          width: '28px', height: '28px', borderRadius: '6px',
          border: 'none', backgroundColor: 'transparent',
          color: '#64748B', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title="Actions"
      >
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '34px', zIndex: 1200,
          backgroundColor: '#FFFFFF', borderRadius: '10px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(15,23,42,0.12)',
          minWidth: '180px', padding: '6px', animation: 'slideInUp 0.15s ease',
        }}>
          {actions.map((act) => (
            <button
              key={act.action}
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction(act.action); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '9px 12px', borderRadius: '6px',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 500,
                color: act.danger ? '#DC2626' : '#1E293B',
                fontFamily: 'var(--font)', textAlign: 'left',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = act.danger ? '#FEF2F2' : '#F8FAFC'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {act.icon === 'check' && <FiCheckCircle size={14} />}
              {act.icon === 'x'     && <FiX size={14} />}
              {act.icon === 'mail'  && <FiMail size={14} />}
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View Job Drawer ──────────────────────────────────────────────────────────
function ViewJobDrawer({ job, onClose, onEdit, onPause, onContinue, onCloseJob }) {
  if (!job) return null;
  const statusStyle = JOB_STATUS_STYLES[job.status] || {};

  const footer = (
    <>
      {job.status === 'Open' && (
        <button onClick={() => onPause(job)} style={btnOutline('#EA580C','#FFF7ED','#FED7AA')}>
          <FiPauseCircle size={14} /> Pause Recruitment
        </button>
      )}
      {job.status === 'Paused' && (
        <button onClick={() => onContinue(job)} style={btnOutline('#16A34A','#F0FDF4','#BBF7D0')}>
          <FiPlayCircle size={14} /> Continue Recruitment
        </button>
      )}
      {(job.status === 'Open' || job.status === 'Paused' || job.status === 'Interviewing') && (
        <button onClick={() => onCloseJob(job)} style={btnOutline('#DC2626','#FEF2F2','#FECACA')}>
          <FiX size={14} /> Close Job Opening
        </button>
      )}
      <button onClick={() => onEdit(job)} style={btnPrimary}>
        <FiEdit2 size={14} /> Edit Position
      </button>
    </>
  );

  return (
    <Drawer isOpen={!!job} onClose={onClose} title="Job Details" subtitle={job.id} footer={footer} width="480px">
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Status:</span>
        <StatusPill status={job.status} styles={JOB_STATUS_STYLES} />
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {[
          ['POSITION', job.position],
          ['DEPARTMENT', job.department],
          ['LOCATION', job.location],
          ['RECEIVED APPLICATIONS', job.applicationsReceived],
          ['TYPE', job.type],
          ['STATUS', job.status],
          ['OPENED', job.openedDate],
          ['CLOSING', job.closingDate],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>SALARY RANGE</div>
        <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>{job.salaryRange}</div>
      </div>

      {/* Job description */}
      <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>JOB DESCRIPTION DETAILS</div>
        <p style={{ fontSize: '0.83rem', color: '#334155', lineHeight: 1.6, margin: '0 0 12px 0' }}>{job.jobDescription}</p>
        {job.keyResponsibilities?.length > 0 && (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', marginBottom: '6px' }}>Key Responsibilities</div>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#475569', fontSize: '0.82rem', lineHeight: 1.7 }}>
              {job.keyResponsibilities.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </>
        )}
      </div>

      {/* Mandatory requirements */}
      <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '14px' }}>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>MANDATORY REQUIREMENTS</div>
        <pre style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'var(--font)' }}>{job.mandatoryRequirements}</pre>
      </div>
    </Drawer>
  );
}

// ─── View Candidate Drawer ────────────────────────────────────────────────────
function ViewCandidateDrawer({ candidate, onClose, onAction }) {
  if (!candidate) return null;
  const actions = STAGE_ACTIONS[candidate.stage] || [];
  const primaryAction = actions.find(a => !a.danger);
  const rejectAction = actions.find(a => a.danger);

  const footer = actions.length > 0 ? (
    <>
      {rejectAction && (
        <button onClick={() => onAction(rejectAction.action, candidate)} style={btnOutline('#DC2626','#FEF2F2','#FECACA')}>
          <FiX size={14} /> {rejectAction.label}
        </button>
      )}
      {primaryAction && (
        <button onClick={() => onAction(primaryAction.action, candidate)} style={btnPrimary}>
          <FiCheck size={14} /> {primaryAction.label}
        </button>
      )}
    </>
  ) : null;

  return (
    <Drawer isOpen={!!candidate} onClose={onClose} title={candidate.candidateName} subtitle={candidate.id} footer={footer} width="480px">
      {/* Stage badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Stage:</span>
        <StatusPill status={candidate.stage} styles={STAGE_STYLES} />
      </div>

      {/* Candidate Profile */}
      <Section label="CANDIDATE PROFILE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <InfoItem label="FULL NAME" value={candidate.candidateName} />
          <InfoItem label="CANDIDATE ID" value={candidate.id} />
          <InfoItem label="EMAIL" value={candidate.email} />
          <InfoItem label="PHONE NUMBER" value={candidate.phone} />
          <InfoItem label="LOCATION" value={candidate.location} />
        </div>
      </Section>

      {/* Candidate Information */}
      <Section label="CANDIDATE INFORMATION">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <InfoItem label="APPLIED POSITION" value={candidate.appliedPosition} />
          <InfoItem label="DEPARTMENT" value={candidate.department} />
          <InfoItem label="RECRUITER" value={candidate.recruiter} />
          <InfoItem label="CANDIDATE NAME" value={candidate.candidateName} />
          <InfoItem label="EXPERIENCE" value={candidate.experience} />
          <InfoItem label="APPLICATION DATE" value={candidate.applicationDate} />
          <InfoItem label="STAGE" value={candidate.stage} />
        </div>
      </Section>

      {/* Professional Summary */}
      {candidate.professionalSummary && (
        <Section label="PROFESSIONAL SUMMARY">
          <p style={{ fontSize: '0.83rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {candidate.professionalSummary}
          </p>
        </Section>
      )}

      {/* Uploaded Documents */}
      {candidate.documents?.length > 0 && (
        <Section label="UPLOADED DOCUMENTS">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {candidate.documents.map((doc, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '8px',
                border: '1px solid #E2E8F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiFileText size={15} color="#64748B" />
                  <span style={{ fontSize: '0.83rem', color: '#1E293B', fontWeight: 500 }}>{doc.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: doc.status === 'Uploaded' ? '#16A34A' : '#94A3B8', fontWeight: 500 }}>
                    {doc.status}
                  </span>
                  {doc.status === 'Uploaded' && (
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1D4ED8', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font)', padding: 0 }}>
                      <FiDownload size={13} /> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </Drawer>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #F1F5F9' }}>
        {label}
      </div>
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

// ─── Create / Edit Job Opening Drawer ────────────────────────────────────────
function JobOpeningDrawer({ isOpen, onClose, onSave, editJob }) {
  const isEdit = !!editJob;
  const [form, setForm] = useState({
    position: '', department: '', hiringSupervisor: '',
    type: 'Full-time', location: '', salaryRange: '',
    closingDate: '', jobDescription: '', mandatoryRequirements: '',
  });

  useEffect(() => {
    if (editJob) {
      setForm({
        position: editJob.position || '',
        department: editJob.department || '',
        hiringSupervisor: editJob.hiringSupervisor || '',
        type: editJob.type || 'Full-Time',
        location: editJob.location || '',
        salaryRange: editJob.salaryRange || '',
        closingDate: editJob.closingDate || '',
        jobDescription: editJob.jobDescription || '',
        mandatoryRequirements: editJob.mandatoryRequirements || '',
      });
    } else {
      setForm({ position: '', department: '', hiringSupervisor: '', type: 'Full-time', location: '', salaryRange: '', closingDate: '', jobDescription: '', mandatoryRequirements: '' });
    }
  }, [editJob, isOpen]);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e?.target ? e.target.value : e }));

  const footer = (
    <>
      <button onClick={onClose} style={btnCancel}>Cancel</button>
      <button onClick={() => onSave(form)} style={btnPrimary}>
        {isEdit ? 'Save Changes' : 'Create Job Opening'}
      </button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Job Opening' : 'Create Job Opening'} subtitle={isEdit ? "Update job opening details" : "Set up requirements and details"} width="540px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="Position" required>
          <Input value={form.position} onChange={set('position')} placeholder="" />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Department" required>
            <Select
              value={form.department}
              onChange={set('department')}
              options={DEPARTMENTS}
              placeholder="Select"
            />
          </FormField>
          <FormField label="Hiring Supervisor" required>
            <Select
              value={form.hiringSupervisor}
              onChange={set('hiringSupervisor')}
              options={HIRING_SUPERVISORS}
              placeholder="Select"
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Employment Type" required>
            <Select
              value={form.type}
              onChange={set('type')}
              options={EMPLOYMENT_TYPES}
              placeholder="Full-time"
            />
          </FormField>
          <FormField label="Location" required>
            <Select
              value={form.location}
              onChange={set('location')}
              options={LOCATIONS}
              placeholder="Select"
            />
          </FormField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FormField label="Salary Range" required>
            <Input value={form.salaryRange} onChange={set('salaryRange')} placeholder="" />
          </FormField>
          <FormField label="Closing Date">
            <DatePicker value={form.closingDate} onChange={set('closingDate')} placeholder="DD/MM/YY" />
          </FormField>
        </div>

        <FormField label="Job Description Details">
          <Textarea value={form.jobDescription} onChange={set('jobDescription')} placeholder="Enter the job position details..." rows={4} />
        </FormField>

        <FormField label="Mandatory Requirements">
          <Textarea value={form.mandatoryRequirements} onChange={set('mandatoryRequirements')} placeholder="Enter requirements for this position..." rows={4} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Reject Candidate Modal ───────────────────────────────────────────────────
function RejectCandidateModal({ isOpen, onClose, onConfirm, candidateName }) {
  const [reason, setReason] = useState('');

  const footer = (
    <>
      <button onClick={onClose} style={btnCancel}>Cancel</button>
      <button onClick={() => { onConfirm(reason); setReason(''); }} style={{ ...btnPrimary, backgroundColor: '#DC2626' }}>
        <FiX size={14} /> Reject Candidate
      </button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Candidate?" maxWidth="440px" footer={footer}>
      <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
        Are you sure you want to reject this candidate? The candidate will be removed from the active recruitment pipeline and marked as Rejected. This action will be recorded for audit purposes.
      </p>
      <FormField label="Reason for Deactivation">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter commentary..." rows={4} />
      </FormField>
    </Modal>
  );
}

// ─── Shared button styles ──────────────────────────────────────────────────────
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', borderRadius: '7px', border: 'none',
  backgroundColor: '#1D4ED8', color: '#FFFFFF',
  fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
  fontFamily: 'var(--font)', transition: 'background 0.15s ease',
};
const btnCancel = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '9px 18px', borderRadius: '7px',
  border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF',
  color: '#64748B', fontSize: '0.84rem', fontWeight: 500,
  cursor: 'pointer', fontFamily: 'var(--font)',
};
function btnOutline(color, bg, border) {
  return {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '7px',
    border: `1px solid ${border}`, backgroundColor: bg,
    color, fontSize: '0.82rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'var(--font)',
  };
}

// ─── Job Postings Tab ─────────────────────────────────────────────────────────
function JobPostingsTab({ showToast }) {
  const [jobs, setJobs] = useState(mockJobPostings);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewJob, setViewJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() =>
    jobs.filter((j) =>
      j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.position.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase())
    ), [jobs, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleAction = (action, job) => {
    if (action === 'edit') { setViewJob(null); setEditJob(job); }
    else if (action === 'pause') {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Paused' } : j));
      showToast(`Job Opening (${job.id}) successfully paused`);
      setViewJob(null);
    } else if (action === 'continue') {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Open' } : j));
      showToast(`Job Opening (${job.id}) successfully continued`, 'info');
      setViewJob(null);
    } else if (action === 'close') {
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'Closed' } : j));
      showToast(`Job Opening (${job.id}) closed`, 'info');
      setViewJob(null);
    }
  };

  const getJobActions = (job) => {
    const acts = [];
    if (job.status === 'Open') acts.push({ label: 'Edit Position', icon: 'edit', action: 'edit' });
    if (job.status === 'Open' || job.status === 'Interviewing') acts.push({ label: 'Pause Recruitment', icon: 'pause', action: 'pause' });
    if (job.status === 'Paused') {
      acts.push({ label: 'Edit Position', icon: 'edit', action: 'edit' });
      acts.push({ label: 'Continue Recruitment', icon: 'play', action: 'continue' });
    }
    if (['Open', 'Paused', 'Interviewing'].includes(job.status))
      acts.push({ label: 'Close Job Opening', icon: 'x', action: 'close', danger: true });
    return acts;
  };

  const columns = [
    { key: 'id', label: 'Job ID', nowrap: true },
    { key: 'position', label: 'Position', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    {
      key: 'department', label: 'Department',
      render: (v) => <span style={{ color: '#1D4ED8', fontWeight: 500 }}>{v}</span>,
    },
    { key: 'location', label: 'Location' },
    { key: 'applicationsReceived', label: 'Applications Received', align: 'center' },
    {
      key: 'type', label: 'Type',
      render: (v) => <span style={{ color: TYPE_COLORS[v] || '#1D4ED8', fontWeight: 600 }}>{v}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <StatusPill status={v} styles={JOB_STATUS_STYLES} />,
    },
    {
      key: 'actions', label: 'Actions', align: 'center',
      headerStyle: { textAlign: 'center' },
      render: (_, row) => {
        const rowActions = getJobActions(row);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setViewJob(row); }}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="View"
            >
              <FiEye size={15} />
            </button>
            {/* Always reserve space for 3-dot, but only show if there are actions */}
            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowActions.length > 0 && (
                <RowActionsMenu
                  actions={rowActions.map(a => ({ ...a, icon: a.action === 'edit' ? 'check' : a.action === 'pause' ? 'x' : a.action === 'continue' ? 'check' : a.action === 'close' ? 'x' : 'check' }))}
                  onAction={(action) => handleAction(action, row)}
                />
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="table-toolbar" style={{ marginBottom: '16px' }}>
        <div className="table-toolbar-search">
          <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search job id, position..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div className="table-toolbar-actions">
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiFilter size={14} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiPlus size={15} /> Create Job Opening
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        selectable
        selectedIds={selectedIds}
        keyField="id"
        onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onSelectAll={() => {
          const allIds = paginated.map(r => r.id);
          setSelectedIds(prev => allIds.every(id => prev.includes(id)) ? prev.filter(id => !allIds.includes(id)) : [...new Set([...prev, ...allIds])]);
        }}
        emptyMessage="No job postings found."
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* View Job Drawer */}
      {viewJob && (
        <ViewJobDrawer
          job={jobs.find(j => j.id === viewJob.id) || viewJob}
          onClose={() => setViewJob(null)}
          onEdit={(job) => { setViewJob(null); setEditJob(job); }}
          onPause={(job) => handleAction('pause', job)}
          onContinue={(job) => handleAction('continue', job)}
          onCloseJob={(job) => handleAction('close', job)}
        />
      )}

      {/* Create/Edit Drawer */}
      <JobOpeningDrawer
        isOpen={showCreateModal || !!editJob}
        onClose={() => { setShowCreateModal(false); setEditJob(null); }}
        editJob={editJob}
        onSave={(form) => {
          if (editJob) {
            setJobs(prev => prev.map(j => j.id === editJob.id ? { ...j, ...form } : j));
            showToast('Job opening updated successfully');
          } else {
            const newId = `PGSL-JB-${String(jobs.length + 1).padStart(3, '0')}`;
            setJobs(prev => [{ id: newId, ...form, applicationsReceived: 0, status: 'Open', openedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }), keyResponsibilities: [] }, ...prev]);
            showToast('Job opening created successfully');
          }
          setShowCreateModal(false); setEditJob(null);
        }}
      />
    </>
  );
}

// ─── Candidates Tab ───────────────────────────────────────────────────────────
function CandidatesTab({ showToast }) {
  const [candidates, setCandidates] = useState(mockCandidates);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewCandidate, setViewCandidate] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const filtered = useMemo(() =>
    candidates.filter((c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      c.appliedPosition.toLowerCase().includes(search.toLowerCase())
    ), [candidates, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const stageOrder = ['Applied', 'Screening', 'Assessment', 'Interview', 'Offer', 'Hired'];
  const advanceStage = (candidate) => {
    const idx = stageOrder.indexOf(candidate.stage);
    if (idx >= 0 && idx < stageOrder.length - 1) {
      const nextStage = stageOrder[idx + 1];
      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: nextStage } : c));
      showToast(`${candidate.candidateName} moved to ${nextStage}`);
    }
  };

  const handleCandidateAction = (action, candidate) => {
    if (action === 'reject') {
      setViewCandidate(null);
      setRejectTarget(candidate);
    } else {
      advanceStage(candidate);
      setViewCandidate(null);
    }
  };

  const getStageActions = (stage) => STAGE_ACTIONS[stage] || [];

  const columns = [
    { key: 'id', label: 'Candidate ID', nowrap: true },
    { key: 'candidateName', label: 'Candidate', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { key: 'appliedPosition', label: 'Applied Position' },
    { key: 'recruiter', label: 'Recruiter' },
    { key: 'experience', label: 'Experience', align: 'center' },
    { key: 'applicationDate', label: 'Application Date', nowrap: true },
    {
      key: 'stage', label: 'Stage',
      render: (v) => <StatusPill status={v} styles={STAGE_STYLES} />,
    },
    {
      key: 'actions', label: 'Actions', align: 'center',
      headerStyle: { textAlign: 'center' },
      render: (_, row) => {
        const rowActions = getStageActions(row.stage);
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setViewCandidate(row); }}
              style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="View"
            >
              <FiEye size={15} />
            </button>
            {/* Always reserve space, show 3-dot only when actions exist */}
            <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {rowActions.length > 0 && (
                <RowActionsMenu
                  actions={rowActions}
                  onAction={(action) => handleCandidateAction(action, row)}
                />
              )}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Toolbar */}
      <div className="table-toolbar" style={{ marginBottom: '16px' }}>
        <div className="table-toolbar-search">
          <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search job id, position..."
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.84rem', fontFamily: 'var(--font)', backgroundColor: '#F8FAFC', color: '#1E293B', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div className="table-toolbar-actions">
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiFilter size={14} /> Filter
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiDownload size={14} /> Export
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#1D4ED8', color: '#FFFFFF', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            <FiPlus size={15} /> Create Job Opening
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        selectable
        selectedIds={selectedIds}
        keyField="id"
        onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
        onSelectAll={() => {
          const allIds = paginated.map(r => r.id);
          setSelectedIds(prev => allIds.every(id => prev.includes(id)) ? prev.filter(id => !allIds.includes(id)) : [...new Set([...prev, ...allIds])]);
        }}
        emptyMessage="No candidates found."
      />
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* View Candidate Drawer */}
      {viewCandidate && (
        <ViewCandidateDrawer
          candidate={candidates.find(c => c.id === viewCandidate.id) || viewCandidate}
          onClose={() => setViewCandidate(null)}
          onAction={handleCandidateAction}
        />
      )}

      {/* Reject Candidate Modal */}
      <RejectCandidateModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        candidateName={rejectTarget?.candidateName}
        onConfirm={(reason) => {
          setCandidates(prev => prev.map(c => c.id === rejectTarget.id ? { ...c, stage: 'Rejected' } : c));
          showToast('Candidate successfully rejected');
          setRejectTarget(null);
        }}
      />
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
        <button
          className="btn btn-secondary"
          onClick={() => showToast('Bulk recruitment document upload', 'info')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
        >
          Upload <FiUpload size={13} />
        </button>
      </div>

      {/* Main Content Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: '8px' }}>
          {[
            { key: 'jobPostings', label: 'Job Postings' },
            { key: 'candidates', label: 'Candidates' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px', fontFamily: 'var(--font)', fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500, background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? '#1D4ED8' : '#64748B',
                  borderBottom: isActive ? '2px solid #1D4ED8' : '2px solid transparent',
                  marginBottom: '-1px', transition: 'color 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'jobPostings' && <JobPostingsTab showToast={showToast} />}
        {activeTab === 'candidates' && <CandidatesTab showToast={showToast} />}
      </div>
    </div>
  );
}
