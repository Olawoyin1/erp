import { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical,
  FiCheck, FiX, FiUser, FiAlertTriangle, FiCheckCircle, FiFileText, FiUpload,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Drawer from '../../../components/ui/Drawer';
import { Input, FormField, Select } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import {
  fetchOnboarding,
  fetchOnboardingStats,
  fetchOnboardingByEmployee,
  advanceOnboardingStatus,
  verifyOnboardingDocument,
  clearActiveDetail,
  NEXT_STATUS_LABEL,
} from '../../../store/hr/onboardingSlice';
import { employeeService, onboardingService } from '../../../services/hr.service';
import { apiError, titleCase, formatDate } from '../../../services/apiHelpers';
import { usePermission } from '../../../hooks/usePermission';
import { saveBlob, blobErrorMessage, fullName } from '../hrUtils';
import { EmployeeFileDialog } from '../FileUploadDialogs';

const ITEMS_PER_PAGE = 10;

const idOfEmployee = (row) => (row?.employeeId && typeof row.employeeId === 'object' ? row.employeeId._id : row?.employeeId);

const STATUS_STYLES = {
  pending:              { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A',  label: 'Pending' },
  in_progress:          { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE',  label: 'In Progress' },
  completed:            { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0',  label: 'Completed' },
  ready_for_deployment: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE',  label: 'Ready for Deployment' },
};

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_STYLES).map(([value, s]) => ({ value, label: s.label })),
];

const SAFETY_STYLES = {
  valid:                { label: 'Valid', color: '#059669' },
  expiring_soon:        { label: 'Expiring soon', color: '#D97706' },
  expired:              { label: 'Expired', color: '#DC2626' },
  pending_verification: { label: 'Pending verification', color: '#D97706' },
  rejected:             { label: 'Rejected', color: '#DC2626' },
  missing:              { label: 'Not recorded', color: '#DC2626' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: titleCase(status) };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function RowMenu({ row, onAction, canAdvance }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const label = NEXT_STATUS_LABEL[row.status];
  if (!label || !canAdvance) return <div style={{ width: 28 }} />;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: 210, whiteSpace: 'nowrap' }}>
          <div onClick={() => { onAction(row); setOpen(false); }} className="menu-item-hover"
            style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <FiCheckCircle size={13} color="#10B981" /> {label}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ percent = 0, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1D4ED8" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
}

function FilterDrawer({ onClose, value, onApply }) {
  const [draft, setDraft] = useState(value);
  return (
    <Drawer isOpen onClose={onClose} title="Filter onboarding" width="380px"
      footer={
        <>
          <button onClick={() => { onApply(''); onClose(); }} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Clear</button>
          <button onClick={() => { onApply(draft); onClose(); }} style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </>
      }>
      <FormField label="Onboarding status">
        <Select value={draft} onChange={(e) => setDraft(e.target.value)} options={STATUS_FILTERS} />
      </FormField>
    </Drawer>
  );
}

// ─── Drawer ────────────────────────────────────────────────────────────────────
function OnboardingDrawer({ record, onClose, onAdvance, onVerifyDoc, canAdvance, canVerify, canUpload, onUploaded }) {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { activeDetail, detailLoading } = useSelector((s) => s.onboarding);
  const [activeTab, setActiveTab] = useState('checklist');
  const [uploading, setUploading] = useState(false);
  const employeeId = idOfEmployee(record);

  useEffect(() => {
    if (employeeId) dispatch(fetchOnboardingByEmployee(employeeId));
  }, [employeeId, dispatch]);

  const caseStatus   = activeDetail?.onboardingCase?.status || record.status;
  const progress     = activeDetail?.progressPercent ?? 0;
  const checklist    = activeDetail?.checklist || [];
  const documents    = activeDetail?.documents || [];
  const safety       = activeDetail?.safety;
  const employee     = activeDetail?.employee || (typeof record.employeeId === 'object' ? record.employeeId : null);
  const nextLabel    = NEXT_STATUS_LABEL[caseStatus];

  const openDocument = async (doc) => {
    try {
      const res = await employeeService.documentUrl(employeeId, doc._id);
      window.open(res.data?.data?.url, '_blank', 'noopener');
    } catch (err) {
      showToast(apiError(err, 'Could not open the document'), 'error');
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await employeeService.uploadDocument(employeeId, file);
      showToast('Document uploaded', 'success');
      dispatch(fetchOnboardingByEmployee(employeeId));
      onUploaded();
    } catch (err) {
      showToast(apiError(err, 'The document could not be uploaded'), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer isOpen onClose={onClose} width="520px">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
          <FiUser size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{fullName(employee)}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.813rem', color: '#64748B' }}>
            {employee?.employeeId || '—'} &bull; {detailLoading ? 'Loading…' : `${progress}% Complete`}
          </p>
        </div>
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <ProgressRing percent={progress} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#1D4ED8' }}>{progress}%</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <StatusPill status={caseStatus} />
        </div>
        {nextLabel && canAdvance && (
          <button onClick={() => onAdvance(record)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, backgroundColor: '#059669', color: '#FFFFFF', border: 'none', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiCheck size={13} /> {nextLabel}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        {[{ key: 'checklist', label: 'Onboarding Checklist' }, { key: 'documents', label: 'Documents Registry' }, { key: 'safety', label: 'Safety Check' }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent', color: activeTab === tab.key ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab.key ? 600 : 400, fontSize: '0.875rem', whiteSpace: 'nowrap', fontFamily: 'var(--font)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'checklist' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Onboarding Checklist Compliance</div>
          {detailLoading && !activeDetail ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>Loading checklist…</div>
          ) : checklist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>No checklist items found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {checklist.map((item, i) => {
                const isDone = item.task?.status === 'done';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: `1px solid ${item.isOverdue ? '#FECACA' : '#E2E8F0'}`, borderRadius: 8, backgroundColor: item.isOverdue ? '#FFF5F5' : '#FFFFFF' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#334155' }}>{(item.task?.title || item.task?.taskNo || '—').replace(/ — .*$/, '')}</span>
                      {item.isOverdue && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#DC2626', fontWeight: 600 }}>OVERDUE</span>}
                    </div>
                    {isDone ? <FiCheck size={16} color="#10B981" /> : <FiX size={16} color="#94A3B8" />}
                  </div>
                );
              })}
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Checklist items are tasks; mark them done from the Tasks page.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document Uploads</div>
            {canUpload && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: '#1D4ED8', cursor: uploading ? 'wait' : 'pointer' }}>
                <FiUpload size={13} /> {uploading ? 'Uploading…' : 'Upload document'}
                <input type="file" style={{ display: 'none' }} disabled={uploading} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            )}
          </div>
          {detailLoading && !activeDetail ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>Loading documents…</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>No documents uploaded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FiFileText size={15} color="#64748B" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.originalName || '—'}</div>
                      {doc.mimeType && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{doc.mimeType}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button className="icon-btn" title="Open" onClick={() => openDocument(doc)}><FiDownload size={14} /></button>
                    {!doc.verified && canVerify && (
                      <button onClick={() => onVerifyDoc(record, doc._id)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: 4, backgroundColor: '#FFFFFF', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                        Verify
                      </button>
                    )}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: doc.verified ? '#D1FAE5' : '#FEF3C7', color: doc.verified ? '#065F46' : '#92400E', whiteSpace: 'nowrap' }}>
                      {doc.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Safety &amp; Compliance Check</div>
          {!safety ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>{detailLoading ? 'Loading…' : 'No safety information available.'}</div>
          ) : (
            <>
              <div style={{ padding: 16, border: `1px solid ${safety.cleared ? '#D1FAE5' : '#FED7AA'}`, borderRadius: 8, backgroundColor: safety.cleared ? '#F0FDF4' : '#FFF7ED', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: safety.cleared ? '#10B981' : '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {safety.cleared ? <FiCheck size={13} color="#FFFFFF" /> : <FiAlertTriangle size={12} color="#FFFFFF" />}
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: safety.cleared ? '#065F46' : '#9A3412' }}>
                    {safety.cleared ? 'Offshore travel documents are in order' : 'Offshore clearance is not yet complete'}
                  </div>
                  <div style={{ fontSize: '0.813rem', color: safety.cleared ? '#047857' : '#9A3412', marginTop: 4 }}>
                    {safety.cleared ? 'Every required document is recorded and valid today.' : safety.issues.join('. ')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF' }}>
                {safety.documents.map((d) => {
                  const s = SAFETY_STYLES[d.status] || { label: titleCase(d.status), color: '#475569' };
                  return (
                    <div key={d.documentType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.documentType}</span>
                      <span style={{ fontSize: '0.813rem', fontWeight: 600, color: s.color, textAlign: 'right' }}>
                        {s.label}{d.expiryDate ? ` • ${d.status === 'expired' ? 'expired' : 'until'} ${formatDate(d.expiryDate)}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>Documents are managed under Training and Certifications.</p>
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { records, meta, stats, statsLoading, loading, error: loadError } = useSelector((s) => s.onboarding);

  const canAdvance = usePermission('hr.onboarding.update');
  const canVerify  = usePermission('hr.onboarding.verify');
  const canUpload  = usePermission('hr.employee.update');

  const [search, setSearch]           = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [status, setStatus]           = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewRecord, setViewRecord]   = useState(null);
  const [filterOpen, setFilterOpen]   = useState(false);
  const [uploadOpen, setUploadOpen]   = useState(false);
  const debounceRef = useRef(null);

  const load = useCallback(() => {
    dispatch(fetchOnboarding({ page: currentPage, limit: ITEMS_PER_PAGE, ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) }));
  }, [dispatch, currentPage, activeSearch, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { dispatch(fetchOnboardingStats()); }, [dispatch]);
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleSearch = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setCurrentPage(1); setActiveSearch(value.trim()); }, 350);
  };

  const handleAdvance = async (row) => {
    const empId = idOfEmployee(row);
    if (!empId) return;
    const result = await dispatch(advanceOnboardingStatus(empId));
    if (advanceOnboardingStatus.fulfilled.match(result)) {
      showToast(`${NEXT_STATUS_LABEL[row.status] || 'Status updated'}: onboarding status advanced`, 'success');
      load();
      dispatch(fetchOnboardingStats());
      if (viewRecord) dispatch(fetchOnboardingByEmployee(empId));
    } else {
      showToast(result.payload || 'Failed to advance status', 'error');
    }
  };

  const handleVerifyDoc = async (row, docId) => {
    const empId = idOfEmployee(row);
    if (!empId || !docId) return;
    const result = await dispatch(verifyOnboardingDocument({ employeeId: empId, docId }));
    if (verifyOnboardingDocument.fulfilled.match(result)) showToast('Document verified successfully', 'success');
    else showToast(result.payload || 'Verification failed', 'error');
  };

  const handleExport = async () => {
    try {
      const res = await onboardingService.exportList({ ...(activeSearch ? { q: activeSearch } : {}), ...(status ? { status } : {}) });
      saveBlob(res.data, 'onboarding.csv');
    } catch (err) {
      showToast(await blobErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const openRecord = (row) => { dispatch(clearActiveDetail()); setViewRecord(row); };

  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const statCards = [
    { title: 'COMPLETED',            value: statMap.completed,            subtitle: 'Employees who completed onboarding', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={14} color="#10B981" /> },
    { title: 'IN PROGRESS',          value: statMap.in_progress,          subtitle: 'Currently undergoing onboarding',    color: '#3B82F6', bg: '#DBEAFE', icon: <FiUser size={14} color="#3B82F6" /> },
    { title: 'PENDING ONBOARDING',   value: statMap.pending_onboarding,   subtitle: 'Yet to start onboarding',            color: '#F59E0B', bg: '#FEF3C7', icon: <FiAlertTriangle size={14} color="#F59E0B" /> },
    { title: 'READY FOR DEPLOYMENT', value: statMap.ready_for_deployment, subtitle: 'Approved for deployment',            color: '#8B5CF6', bg: '#EDE9FE', icon: <FiCheck size={14} color="#8B5CF6" /> },
  ];

  const columns = [
    { key: 'employeeId', label: 'EMPLOYEE ID', render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.78rem' }}>{val?.employeeId || '—'}</span> },
    { key: 'employee', label: 'EMPLOYEE', render: (_, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fullName(row.employeeId)}</span> },
    { key: 'position', label: 'POSITION', render: (_, row) => <span style={{ color: '#475569' }}>{row.employeeId?.position || '—'}</span> },
    { key: 'department', label: 'DEPARTMENT', render: (_, row) => <span style={{ color: '#64748B' }}>{row.employeeId?.departmentId?.name || '—'}</span> },
    { key: 'joined', label: 'DATE JOINED', render: (_, row) => <span style={{ color: '#475569' }}>{formatDate(row.employeeId?.hireDate)}</span> },
    { key: 'status', label: 'ONBOARDING STATUS', render: (val) => <StatusPill status={val} /> },
    {
      key: '__actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" onClick={() => openRecord(row)} title="View Onboarding"><FiEye size={15} /></button>
          <RowMenu row={row} onAction={handleAdvance} canAdvance={canAdvance} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Onboarding</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
          Manage employee induction, documentation, and readiness before deployment
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {statCards.map((stat) => (
          <div key={stat.title} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.title}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stat.icon}</div>
            </div>
            {statsLoading && stat.value === undefined ? (
              <div style={{ height: 28, width: 40, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 6 }} />
            ) : (
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value ?? 0}</div>
            )}
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search employee id, name, position…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" onClick={() => setFilterOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter{status ? ' (1)' : ''}
            </button>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            {canUpload && (
              <button className="btn btn-secondary" onClick={() => setUploadOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
                Upload <FiUpload size={14} />
              </button>
            )}
          </div>
        </div>

        {loadError ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <div style={{ marginBottom: 12 }}>{loadError}</div>
            <button className="btn btn-secondary" onClick={load}>Try again</button>
          </div>
        ) : loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} style={{ padding: '12px 16px' }}><div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: '60%' }} /></td>
                ))}</tr>
              ))}
            </tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            keyField="_id"
            emptyMessage={activeSearch || status ? 'No onboarding records match your search or filter.' : 'No onboarding records yet. A case starts when an employee is registered.'}
          />
        )}

        {meta?.totalPages > 1 && <Pagination currentPage={currentPage} totalPages={meta.totalPages} onPageChange={setCurrentPage} />}
      </div>

      {viewRecord && (
        <OnboardingDrawer
          key={viewRecord._id}
          record={viewRecord}
          onClose={() => { setViewRecord(null); dispatch(clearActiveDetail()); }}
          onAdvance={handleAdvance}
          onVerifyDoc={handleVerifyDoc}
          canAdvance={canAdvance}
          canVerify={canVerify}
          canUpload={canUpload}
          onUploaded={() => {}}
        />
      )}

      {filterOpen && <FilterDrawer onClose={() => setFilterOpen(false)} value={status} onApply={(v) => { setCurrentPage(1); setStatus(v); }} />}
      {uploadOpen && (
        <EmployeeFileDialog kind="document" onClose={() => setUploadOpen(false)}
          onDone={(message) => { setUploadOpen(false); showToast(message, 'success'); load(); dispatch(fetchOnboardingStats()); }} />
      )}
    </div>
  );
}
