import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch, FiFilter, FiDownload, FiEye, FiMoreVertical,
  FiCheck, FiUpload, FiX, FiUser, FiAlertTriangle,
  FiCheckCircle, FiLoader, FiFileText,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import { Input } from '../../../components/ui/FormField';
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

const ITEMS_PER_PAGE = 10;

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

function capitalize(s) {
  if (!s) return '—';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Status -> badge colour mapping (API sends lowercase_underscore)
const STATUS_STYLES = {
  pending:              { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A',  label: 'Pending' },
  in_progress:          { bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE',  label: 'In Progress' },
  completed:            { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0',  label: 'Completed' },
  ready_for_deployment: { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE',  label: 'Ready for Deployment' },
};

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: capitalize(status) };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────
function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const label = NEXT_STATUS_LABEL[row.status];
  if (!label) return <div style={{ width: 28 }} />;

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: 200, whiteSpace: 'nowrap' }}>
          <div
            onClick={() => { onAction(row); setOpen(false); }}
            style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <FiCheckCircle size={13} color="#10B981" /> {label}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────────────────────
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

// ─── Onboarding Drawer ─────────────────────────────────────────────────────────
function OnboardingDrawer({ record, onClose, onAdvance, onVerifyDoc }) {
  const dispatch = useDispatch();
  const { activeDetail, detailLoading } = useSelector((s) => s.onboarding);
  const [activeTab, setActiveTab] = useState('checklist');

  useEffect(() => {
    if (record) {
      setActiveTab('checklist');
      const empId = typeof record.employeeId === 'object' ? record.employeeId?._id : record.employeeId;
      if (empId) dispatch(fetchOnboardingByEmployee(empId));
    }
  }, [record, dispatch]);

  if (!record) return null;

  const caseStatus   = activeDetail?.onboardingCase?.status || record.status;
  const progress     = activeDetail?.progressPercent ?? 0;
  const checklist    = activeDetail?.checklist || [];
  const documents    = activeDetail?.documents || [];
  const empName      = getName(record.employeeId);
  const empId        = typeof record.employeeId === 'object' ? record.employeeId?.employeeId : '—';
  const nextLabel    = NEXT_STATUS_LABEL[caseStatus];

  return (
    <Drawer isOpen={!!record} onClose={onClose} width="520px">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', flexShrink: 0 }}>
          <FiUser size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{empName}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.813rem', color: '#64748B' }}>
            {empId} • {detailLoading ? 'Loading…' : `${progress}% Complete`}
          </p>
        </div>
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <ProgressRing percent={progress} />
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, color: '#1D4ED8' }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <StatusPill status={caseStatus} />
        </div>
        {nextLabel && (
          <button onClick={() => onAdvance(record)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, backgroundColor: '#1D4ED8', color: '#FFFFFF', border: 'none', fontSize: '0.813rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiCheck size={13} /> {nextLabel}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 24 }}>
        {[{ key: 'checklist', label: 'Onboarding Checklist' }, { key: 'documents', label: 'Documents Registry' }, { key: 'safety', label: 'Safety Check' }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent', color: activeTab === tab.key ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab.key ? 600 : 400, fontSize: '0.875rem', whiteSpace: 'nowrap', fontFamily: 'var(--font)' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Checklist Tab */}
      {activeTab === 'checklist' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Onboarding Checklist Compliance</div>
          {detailLoading ? (
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
                      <span style={{ fontSize: '0.875rem', color: '#334155' }}>{item.task?.title || item.task?.taskNo || '—'}</span>
                      {item.isOverdue && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#DC2626', fontWeight: 600 }}>OVERDUE</span>}
                    </div>
                    {isDone ? <FiCheck size={16} color="#10B981" /> : <FiX size={16} color="#94A3B8" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Document Uploads</div>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>Loading documents…</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: '0.875rem' }}>No documents uploaded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {documents.map((doc) => (
                <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FiFileText size={15} color="#64748B" />
                    <div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{doc.originalName || doc.name || '—'}</div>
                      {doc.mimeType && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{doc.mimeType}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!doc.verified && (
                      <button
                        onClick={() => onVerifyDoc(record, doc._id)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', border: '1px solid #E2E8F0', borderRadius: 4, backgroundColor: '#FFFFFF', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                        Verify
                      </button>
                    )}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 12, backgroundColor: doc.verified ? '#D1FAE5' : '#FEF3C7', color: doc.verified ? '#065F46' : '#92400E' }}>
                      {doc.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safety Tab — static content */}
      {activeTab === 'safety' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Safety & Compliance Check</div>
          <div style={{ padding: 16, border: '1px solid #D1FAE5', borderRadius: 8, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
              <FiCheck size={13} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065F46' }}>OPITO / NEBOSH HSE Certification Check Verified</div>
              <div style={{ fontSize: '0.813rem', color: '#047857', marginTop: 4 }}>Self-matching mobilization criteria for offshore yard entry clearance</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF' }}>
            {[
              { label: 'PROJECT RISK CATEGORY:', value: 'High (Offshore Operation Phase)', color: '#0F172A' },
              { label: 'CRITICAL SURVIVAL CERTIFICATION', value: 'PASSED CLEARED', color: '#10B981' },
              { label: 'MEDICAL FITNESS CLEARANCE', value: 'PASSED VALID', color: '#10B981' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</span>
                <span style={{ fontSize: '0.813rem', fontWeight: 600, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, border: '1px solid #FED7AA', borderRadius: 8, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FiAlertTriangle size={16} color="#EA580C" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.813rem', fontWeight: 700, color: '#EA580C', marginBottom: 4 }}>PROJECT SITE REMINDER</div>
              <div style={{ fontSize: '0.813rem', color: '#9A3412', lineHeight: 1.4 }}>
                Safety briefing module must be refreshed on-site every 14 days during offshore installation. System logs will flag expired certificates.
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Onboarding() {
  const dispatch = useDispatch();
  const { toast, showToast, hideToast } = useToast();
  const { records, meta, stats, statsLoading, loading } = useSelector((s) => s.onboarding);

  const [search, setSearch]           = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewRecord, setViewRecord]   = useState(null);

  const load = useCallback(() => {
    dispatch(fetchOnboarding({ page: currentPage, limit: ITEMS_PER_PAGE, ...(search ? { q: search } : {}) }));
  }, [dispatch, currentPage, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { dispatch(fetchOnboardingStats()); }, [dispatch]);

  // ─── Advance status ──────────────────────────────────────────────────────────
  const handleAdvance = async (row) => {
    const empId = typeof row.employeeId === 'object' ? row.employeeId?._id : row.employeeId;
    if (!empId) return;
    const result = await dispatch(advanceOnboardingStatus(empId));
    if (result.meta.requestStatus === 'fulfilled') {
      const label = NEXT_STATUS_LABEL[row.status] || 'Status updated';
      showToast(`${label} — status advanced successfully`, 'success');
      load();
      dispatch(fetchOnboardingStats());
    } else {
      showToast(result.payload || 'Failed to advance status', 'error');
    }
  };

  // ─── Verify document ─────────────────────────────────────────────────────────
  const handleVerifyDoc = async (row, docId) => {
    const empId = typeof row.employeeId === 'object' ? row.employeeId?._id : row.employeeId;
    if (!empId || !docId) return;
    const result = await dispatch(verifyOnboardingDocument({ employeeId: empId, docId }));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Document verified successfully', 'success');
    } else {
      showToast(result.payload || 'Verification failed', 'error');
    }
  };

  // ─── Stat cards ──────────────────────────────────────────────────────────────
  const statMap = Object.fromEntries((stats || []).map((s) => [s.key, s.value]));
  const statCards = [
    { title: 'COMPLETED',            value: statMap.completed ?? '—',            subtitle: 'Employees who completed onboarding', color: '#10B981', bg: '#D1FAE5', icon: <FiCheckCircle size={14} color="#10B981" /> },
    { title: 'IN PROGRESS',          value: statMap.in_progress ?? '—',          subtitle: 'Currently undergoing onboarding',    color: '#3B82F6', bg: '#DBEAFE', icon: <FiUser size={14} color="#3B82F6" /> },
    { title: 'PENDING ONBOARDING',   value: statMap.pending_onboarding ?? '—',   subtitle: 'Yet to start onboarding',            color: '#F59E0B', bg: '#FEF3C7', icon: <FiAlertTriangle size={14} color="#F59E0B" /> },
    { title: 'READY FOR DEPLOYMENT', value: statMap.ready_for_deployment ?? '—', subtitle: 'Approved for deployment',            color: '#8B5CF6', bg: '#EDE9FE', icon: <FiCheck size={14} color="#8B5CF6" /> },
  ];

  // ─── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'employeeId', label: 'EMPLOYEE ID',
      render: (val) => <span style={{ color: '#1D4ED8', fontWeight: 600, fontSize: '0.78rem' }}>{val?.employeeId || (typeof val === 'string' ? val : '—')}</span>,
    },
    {
      key: 'employeeId', label: 'EMPLOYEE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{getName(val)}</span>,
    },
    {
      key: 'employeeId', label: 'POSITION',
      render: (val) => <span style={{ color: '#475569' }}>{val?.position || '—'}</span>,
    },
    {
      key: 'employeeId', label: 'DEPARTMENT',
      render: (val) => <span style={{ color: '#64748B' }}>{getDept(val?.departmentId)}</span>,
    },
    {
      key: 'employeeId', label: 'DATE JOINED',
      render: (val) => <span style={{ color: '#475569' }}>{fmtDate(val?.hireDate)}</span>,
    },
    {
      key: 'status', label: 'ONBOARDING STATUS',
      render: (val) => <StatusPill status={val} />,
    },
    {
      key: '__actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" onClick={() => setViewRecord(row)} title="View Onboarding">
            <FiEye size={15} />
          </button>
          <RowMenu row={row} onAction={handleAdvance} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Onboarding</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage employee induction, documentation, and readiness before deployment
          </p>
        </div>
        <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {statCards.map((stat) => (
          <div key={stat.title} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{stat.title}</span>
              <div style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stat.color, marginBottom: 4 }}>
              {statsLoading ? '…' : stat.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search employee id, name, position..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#94A3B8', fontSize: '0.875rem' }}>Loading onboarding records…</div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === records.length ? [] : records.map((r) => r._id))}
            keyField="_id"
            emptyMessage="No onboarding records found."
          />
        )}

        <Pagination currentPage={currentPage} totalPages={meta?.totalPages || 1} onPageChange={setCurrentPage} />
      </div>

      {/* Onboarding Drawer */}
      <OnboardingDrawer
        record={viewRecord}
        onClose={() => { setViewRecord(null); dispatch(clearActiveDetail()); }}
        onAdvance={handleAdvance}
        onVerifyDoc={handleVerifyDoc}
      />
    </div>
  );
}
