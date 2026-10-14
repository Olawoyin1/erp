import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiDownload, FiEye, FiCheck, FiX, FiFileText, FiPlus, FiUpload, FiAlertCircle, FiUserPlus,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import { FormField, Input, Select, Textarea } from '../../../components/ui/FormField';
import {
  fetchCandidates, advanceCandidateStage, rejectCandidateAction, createCandidateAction, convertCandidateAction,
} from '../../../store/hr/recruitmentSlice';
import { recruitmentService } from '../../../services/hr.service';
import { apiError, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { fieldErrorsOf, fullName, saveBlob, blobErrorMessage } from '../hrUtils';
import EmployeePicker from '../EmployeePicker';
import ImportDialog from '../ImportDialog';
import ConvertCandidateDrawer from './ConvertCandidateDrawer';
import { StatusPill, Section, InfoItem, RowActionsMenu, ReasonModal } from './recruitmentUi';
import { STAGE_STYLES, ADVANCE_LABEL, btnOutline, btnPrimary, btnCancel } from './recruitmentConstants';

const ROWS_PER_PAGE = 10;
const nameOf = (ref) => (ref && typeof ref === 'object' ? ref.name : '') || '—';
const canReject = (stage) => ['applied', 'screening', 'assessment', 'interview', 'offer'].includes(stage);
const isConverted = (c) => !!c.employeeId;

const STAGE_FILTERS = [
  { value: '', label: 'All stages' },
  ...Object.entries(STAGE_STYLES).map(([value, s]) => ({ value, label: s.label })),
];

function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter candidates" width="380px"
      footer={
        <>
          <button onClick={() => { onApply(''); onClose(); }} style={{ ...btnCancel, border: 'none' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={btnPrimary}>Apply</button>
        </>
      }>
      <FormField label="Stage">
        <Select value={draft} onChange={(e) => setDraft(e.target.value)} options={STAGE_FILTERS} />
      </FormField>
    </Drawer>
  );
}

// ─── Add candidate ────────────────────────────────────────────────────────────
function AddCandidateDrawer({ onClose, onSave }) {
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [recruiter, setRecruiter] = useState(null);
  const [postings, setPostings] = useState({ loading: true, items: [], error: '' });
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', location: '', appliedPositionId: '', recruiterId: '', experience: '', professionalSummary: '' });

  useEffect(() => {
    let cancelled = false;
    recruitmentService.listJobPostings({ limit: 100, status: 'open' })
      .then((res) => { if (!cancelled) setPostings({ loading: false, items: res.data?.data || [], error: '' }); })
      .catch((err) => { if (!cancelled) setPostings({ loading: false, items: [], error: apiError(err, 'Open job postings could not be loaded') }); });
    return () => { cancelled = true; };
  }, []);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const submit = async () => {
    setFormError('');
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Enter the candidate name';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.phone.trim()) next.phone = 'Enter a phone number';
    if (!form.appliedPositionId) next.appliedPositionId = 'Choose the position applied for';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const body = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      appliedPositionId: form.appliedPositionId,
      ...(form.location.trim() ? { location: form.location.trim() } : {}),
      ...(form.recruiterId ? { recruiterId: form.recruiterId } : {}),
      ...(form.experience.trim() ? { experience: form.experience.trim() } : {}),
      ...(form.professionalSummary.trim() ? { professionalSummary: form.professionalSummary.trim() } : {}),
    };
    const failure = await onSave(body);
    setSaving(false);
    if (failure) {
      setErrors((e) => ({ ...e, ...fieldErrorsOf(failure.details) }));
      setFormError(failure.message);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} title="Add Candidate" subtitle="Record an applicant against an open job posting" width="520px"
      footer={
        <>
          <button onClick={onClose} style={btnCancel}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : 'Add Candidate'}</button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {(formError || postings.error) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#991B1B', fontSize: '0.8rem' }}>
            <FiAlertCircle size={15} style={{ marginTop: 2 }} /> <span>{formError || postings.error}</span>
          </div>
        )}
        <FormField label="Applied position" required error={errors.appliedPositionId} helpText={!postings.loading && postings.items.length === 0 ? 'There are no open job postings' : undefined}>
          <Select value={form.appliedPositionId} searchable error={!!errors.appliedPositionId} placeholder={postings.loading ? 'Loading…' : 'Select open position'}
            onChange={(e) => set('appliedPositionId', e.target.value)} options={postings.items.map((p) => ({ value: p._id, label: `${p.jobId} - ${p.position}` }))} />
        </FormField>
        <FormField label="Full name" required error={errors.fullName}>
          <Input value={form.fullName} error={!!errors.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Email" required error={errors.email}>
            <Input type="email" value={form.email} error={!!errors.email} onChange={(e) => set('email', e.target.value)} />
          </FormField>
          <FormField label="Phone number" required error={errors.phone}>
            <Input value={form.phone} error={!!errors.phone} onChange={(e) => set('phone', e.target.value)} />
          </FormField>
          <FormField label="Location" error={errors.location}>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Lagos, Nigeria" />
          </FormField>
          <FormField label="Experience" error={errors.experience}>
            <Input value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 8 years" />
          </FormField>
        </div>
        <FormField label="Recruiter" error={errors.recruiterId}>
          <EmployeePicker value={form.recruiterId} selected={recruiter} params={{ activeOnly: 'true' }}
            onChange={(id, emp) => { set('recruiterId', id); setRecruiter(emp); }} />
        </FormField>
        <FormField label="Professional summary" error={errors.professionalSummary}>
          <Textarea rows={4} value={form.professionalSummary} onChange={(e) => set('professionalSummary', e.target.value)} />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── View candidate ───────────────────────────────────────────────────────────
function ViewCandidateDrawer({ candidateId, listRow, onClose, perms, onAdvance, onReject, onConvert, showToast, refreshToken }) {
  const [state, setState] = useState({ id: null, detail: null, error: '' });
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    recruitmentService.getCandidate(candidateId)
      .then((res) => { if (!cancelled) setState({ id: candidateId, detail: res.data?.data, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ id: candidateId, detail: null, error: apiError(err, 'Could not load this candidate') }); });
    return () => { cancelled = true; };
  }, [candidateId, refreshToken, reloadKey]);

  const loaded = state.id === candidateId;
  const candidate = (loaded && state.detail) || listRow;
  const documents = (loaded && state.detail?.documents) || [];
  const stage = candidate.stage;
  const next = ADVANCE_LABEL[stage];
  const posting = candidate.appliedPositionId && typeof candidate.appliedPositionId === 'object' ? candidate.appliedPositionId : null;

  const download = async (doc) => {
    try {
      const res = await recruitmentService.candidateDocumentUrl(candidateId, doc._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await recruitmentService.uploadCandidateDocument(candidateId, file);
      showToast('Document uploaded', 'success');
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast(apiError(err, 'The document could not be uploaded'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const footer = perms.update || perms.convert ? (
    <>
      {perms.convert && stage === 'hired' && !isConverted(candidate) && (
        <button onClick={() => onConvert(candidate)} style={btnPrimary}><FiUserPlus size={14} /> Convert to Employee</button>
      )}
      {perms.update && canReject(stage) && (
        <button onClick={() => onReject(candidate)} style={btnOutline('#DC2626', '#FEF2F2', '#FECACA')}><FiX size={14} /> Reject Candidate</button>
      )}
      {perms.update && next && (
        <button onClick={() => onAdvance(candidate)} style={btnPrimary}><FiCheck size={14} /> {next}</button>
      )}
    </>
  ) : null;

  return (
    <Drawer isOpen onClose={onClose} title={candidate.fullName} subtitle={candidate.candidateId} footer={footer} width="500px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Stage:</span>
        <StatusPill status={stage} styles={STAGE_STYLES} />
      </div>

      {state.error && <div style={{ padding: 12, marginBottom: 16, color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem' }}>{state.error}</div>}

      {isConverted(candidate) && (
        <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: '0.82rem', color: '#166534' }}>
          Registered as employee{' '}
          {typeof candidate.employeeId === 'object'
            ? <Link to={`/hr/employees/${candidate.employeeId._id}`} style={{ color: '#166534', fontWeight: 700 }}>{candidate.employeeId.employeeId}</Link>
            : null}
          {typeof candidate.employeeId === 'object' && candidate.employeeId.fullName ? ` (${candidate.employeeId.fullName})` : ''}.
        </div>
      )}
      {candidate.stage === 'rejected' && candidate.rejectionReason && (
        <div style={{ padding: '10px 14px', marginBottom: 16, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '0.82rem', color: '#991B1B' }}>
          Rejected: {candidate.rejectionReason}
        </div>
      )}

      <Section label="CANDIDATE PROFILE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoItem label="FULL NAME" value={candidate.fullName} />
          <InfoItem label="CANDIDATE ID" value={candidate.candidateId} />
          <InfoItem label="EMAIL" value={candidate.email} />
          <InfoItem label="PHONE NUMBER" value={candidate.phone} />
          <InfoItem label="LOCATION" value={candidate.location} />
        </div>
      </Section>

      <Section label="CANDIDATE INFORMATION">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <InfoItem label="APPLIED POSITION" value={posting?.position} />
          <InfoItem label="DEPARTMENT" value={nameOf(posting?.departmentId)} />
          <InfoItem label="RECRUITER" value={fullName(candidate.recruiterId)} />
          <InfoItem label="EXPERIENCE" value={candidate.experience} />
          <InfoItem label="APPLICATION DATE" value={formatDate(candidate.applicationDate || candidate.createdAt)} />
          <InfoItem label="STAGE" value={STAGE_STYLES[stage]?.label || stage} />
        </div>
      </Section>

      {candidate.professionalSummary && (
        <Section label="PROFESSIONAL SUMMARY">
          <p style={{ fontSize: '0.83rem', color: '#475569', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{candidate.professionalSummary}</p>
        </Section>
      )}

      <Section label="UPLOADED DOCUMENTS">
        {perms.update && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#1D4ED8', cursor: uploading ? 'wait' : 'pointer', marginBottom: 10 }}>
            <FiUpload size={13} /> {uploading ? 'Uploading…' : 'Upload document'}
            <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        )}
        {documents.length === 0 ? (
          <div style={{ fontSize: '0.82rem', color: '#94A3B8' }}>{loaded ? 'No documents uploaded.' : 'Loading…'}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {documents.map((doc) => (
              <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <FiFileText size={15} color="#64748B" />
                  <span style={{ fontSize: '0.83rem', color: '#1E293B', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.originalName}</span>
                </div>
                <button onClick={() => download(doc)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', color: '#1D4ED8', cursor: 'pointer', fontSize: '0.78rem' }}>
                  <FiDownload size={13} /> Download
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </Drawer>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
export default function CandidatesTab({ showToast }) {
  const dispatch = useDispatch();
  const { candidates, candidatesMeta, candidatesLoading, candidatesError } = useSelector((s) => s.recruitment);
  const perms = {
    create: usePermission('hr.candidate.create'),
    update: usePermission('hr.candidate.update'),
    convert: usePermission('hr.candidate.convert'),
  };

  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewId, setViewId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const debounceRef = useRef(null);

  const params = useCallback(() => ({ page, limit: ROWS_PER_PAGE, ...(activeSearch ? { q: activeSearch } : {}), ...(stage ? { stage } : {}) }), [page, activeSearch, stage]);
  const reload = useCallback(() => dispatch(fetchCandidates(params())), [dispatch, params]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const failureOf = (payload) => ({ message: payload?.message || 'The request failed', details: payload?.details || [] });

  const handleAdvance = async (candidate) => {
    const result = await dispatch(advanceCandidateStage(candidate._id));
    if (advanceCandidateStage.fulfilled.match(result)) {
      showToast(`${candidate.fullName}: ${ADVANCE_LABEL[candidate.stage]}`, 'success');
      setRefreshToken((t) => t + 1);
      reload();
    } else {
      showToast(result.payload?.message || 'Advance failed', 'error');
    }
  };

  const handleRejectConfirm = async (reason) => {
    const result = await dispatch(rejectCandidateAction({ id: rejectTarget._id, reason }));
    if (rejectCandidateAction.fulfilled.match(result)) {
      showToast('Candidate rejected', 'success');
      setRejectTarget(null);
      setRefreshToken((t) => t + 1);
      reload();
      return '';
    }
    return result.payload?.message || 'Reject failed';
  };

  const handleAdd = async (body) => {
    const result = await dispatch(createCandidateAction(body));
    if (createCandidateAction.fulfilled.match(result)) {
      showToast(`Candidate ${result.payload.candidateId} added`, 'success');
      setAddOpen(false);
      setPage(1);
      reload();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleConvert = async (body) => {
    const result = await dispatch(convertCandidateAction({ id: convertTarget._id, data: body }));
    if (convertCandidateAction.fulfilled.match(result)) {
      showToast(`${convertTarget.fullName} registered as employee ${result.payload.employeeId}`, 'success');
      setConvertTarget(null);
      setRefreshToken((t) => t + 1);
      reload();
      return undefined;
    }
    return failureOf(result.payload);
  };

  const handleExport = async () => {
    try {
      const res = await recruitmentService.exportCandidates({ ...(activeSearch ? { q: activeSearch } : {}), ...(stage ? { stage } : {}) });
      saveBlob(res.data, 'candidates.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const viewRow = candidates.find((c) => c._id === viewId);

  const columns = [
    { key: 'candidateId', label: 'CANDIDATE ID', nowrap: true, render: (v) => <span style={{ color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>{v}</span> },
    { key: 'fullName', label: 'CANDIDATE', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { key: 'appliedPositionId', label: 'APPLIED POSITION', render: (v) => <span style={{ color: '#475569' }}>{v?.position || '—'}</span> },
    { key: 'recruiterId', label: 'RECRUITER', render: (v) => <span style={{ color: '#475569' }}>{fullName(v)}</span> },
    { key: 'experience', label: 'EXPERIENCE', render: (v) => <span style={{ color: '#475569' }}>{v || '—'}</span> },
    { key: 'applicationDate', label: 'APPLICATION DATE', nowrap: true, render: (v, row) => <span style={{ color: '#475569' }}>{formatDate(v || row.createdAt)}</span> },
    { key: 'stage', label: 'STAGE', render: (v) => <StatusPill status={v} styles={STAGE_STYLES} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'center',
      render: (_, row) => {
        const acts = [];
        if (perms.update && ADVANCE_LABEL[row.stage]) acts.push({ label: ADVANCE_LABEL[row.stage], icon: row.stage === 'interview' ? 'send' : 'check', action: 'advance' });
        if (perms.convert && row.stage === 'hired' && !isConverted(row)) acts.push({ label: 'Convert to Employee', icon: 'convert', action: 'convert' });
        if (perms.update && canReject(row.stage)) acts.push({ label: 'Reject Candidate', icon: 'x', action: 'reject', danger: true });
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <button className="icon-btn" onClick={() => setViewId(row._id)} title="View"><FiEye size={15} /></button>
            <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RowActionsMenu actions={acts} onAction={(action) => {
                if (action === 'advance') handleAdvance(row);
                if (action === 'reject') setRejectTarget(row);
                if (action === 'convert') setConvertTarget(row);
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
          <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search name, position, ID…" style={{ paddingLeft: 36, width: '100%' }} />
        </div>
        <div className="table-toolbar-actions">
          <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}>
            <FiFilter size={14} /> Filter{stage ? ' (1)' : ''}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}>
            <FiDownload size={14} /> Export
          </button>
          {perms.create && (
            <button className="btn btn-secondary" onClick={() => setImportOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px' }}>
              <FiUpload size={14} /> Upload
            </button>
          )}
          {perms.create && <button onClick={() => setAddOpen(true)} style={{ ...btnPrimary, padding: '9px 18px' }}><FiPlus size={15} /> Add Candidate</button>}
        </div>
      </div>

      {candidatesError ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>{candidatesError}</div>
          <button className="btn btn-secondary" onClick={reload}>Try again</button>
        </div>
      ) : candidatesLoading ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>{Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>{Array.from({ length: 8 }).map((__, j) => <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>)}</tr>
          ))}</tbody>
        </table>
      ) : (
        <DataTable columns={columns} data={candidates} selectable selectedIds={selectedIds} keyField="_id"
          onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onSelectAll={() => setSelectedIds(selectedIds.length === candidates.length ? [] : candidates.map((r) => r._id))}
          emptyMessage={activeSearch || stage ? 'No candidates match your search or filter.' : 'No candidates yet.'} />
      )}
      {candidatesMeta?.totalPages > 1 && <Pagination currentPage={page} totalPages={candidatesMeta.totalPages} onPageChange={setPage} />}

      {viewId && viewRow && (
        <ViewCandidateDrawer key={viewId} candidateId={viewId} listRow={viewRow} perms={perms} refreshToken={refreshToken} showToast={showToast}
          onClose={() => setViewId(null)}
          onAdvance={handleAdvance}
          onReject={(c) => setRejectTarget(c)}
          onConvert={(c) => setConvertTarget(c)} />
      )}

      {addOpen && <AddCandidateDrawer onClose={() => setAddOpen(false)} onSave={handleAdd} />}
      {importOpen && (
        <ImportDialog entity="candidates" title="Upload candidates" description="Record many applicants against open job postings from a CSV or Excel file"
          onClose={() => setImportOpen(false)}
          onImported={(report) => { showToast(`${report.created} candidate(s) imported`, 'success'); setPage(1); reload(); }} />
      )}
      {convertTarget && <ConvertCandidateDrawer candidate={convertTarget} onClose={() => setConvertTarget(null)} onConvert={handleConvert} />}
      {rejectTarget && (
        <ReasonModal onClose={() => setRejectTarget(null)} onConfirm={handleRejectConfirm} title="Reject Candidate?"
          subtitle={`${rejectTarget.fullName} will be removed from the active recruitment pipeline and marked as rejected. This action is recorded for audit purposes.`}
          placeholder="Enter commentary…" btnLabel="Reject Candidate" />
      )}
      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={stage} onApply={(v) => { setPage(1); setStage(v); }} />}
    </>
  );
}
