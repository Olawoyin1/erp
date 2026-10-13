import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiX, FiCheck, FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { Input, FormField, Select, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { adminRequestService } from '../../../services/admin.service';
import { employeeService } from '../../../services/hr.service';

const ITEMS_PER_PAGE = 10;

const STEP_LABELS = {
  admin_review:       'Admin Review',
  procurement_review: 'Procurement Review',
  finance_approval:   'Finance Approval',
  final_approval:     'Final Approval',
};

const URGENCY_STYLES = {
  critical: { bg: '#FEE2E2', color: '#DC2626' },
  urgent:   { bg: '#FEF3C7', color: '#D97706' },
  routine:  { bg: '#F1F5F9', color: '#64748B' },
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} style={{ padding: '12px 16px' }}>
          <div style={{ height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, width: i === 1 ? '70%' : '55%' }} />
        </td>
      ))}
    </tr>
  );
}

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const items = [];
  if (row.status === 'pending') {
    items.push({ label: 'Approve', icon: FiCheck, color: '#10B981', action: 'approve' });
    items.push({ label: 'Reject',  icon: FiX,     color: '#DC2626', action: 'reject' });
  }
  if (row.status === 'approved') {
    items.push({ label: 'Mark Completed', icon: FiCheck, color: '#10B981', action: 'complete' });
  }

  if (!items.length) return <div style={{ width: 24 }} />;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, backgroundColor: '#fff',
          borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0',
          padding: '6px 0', zIndex: 50, width: 190 }}>
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} onClick={() => { onAction(item.action, row); setOpen(false); }}
                className="menu-item-hover"
                style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color,
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Icon size={13} /> {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Create Request Drawer ────────────────────────────────────────────────────
function CreateRequestDrawer({ isOpen, onClose, employees, onSaved }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (isOpen) setForm({ requestType: '', urgency: 'routine', requestTitle: '', description: '', requestedBy: '' });
  }, [isOpen]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.requestType || !form.requestedBy || !form.description) {
      addToast('Request type, employee, and description are required', 'error'); return;
    }
    setSaving(true);
    try {
      await adminRequestService.create(form);
      addToast('Request submitted', 'success');
      onSaved();
    } catch (err) {
      addToast(err?.response?.data?.error?.message || 'Failed to submit request', 'error');
    } finally {
      setSaving(false);
    }
  };

  const empOptions = [{ value: '', label: 'Select employee…' }, ...employees.map(e => ({ value: e._id, label: `${e.fullName} (${e.employeeId})` }))];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Request"
      subtitle="Submit a request for review and approval" width="500px"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ padding: '8px 20px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </button>
        </>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="REQUEST TITLE (OPTIONAL)">
          <Input value={form.requestTitle || ''} onChange={e => set('requestTitle', e.target.value)} placeholder="e.g. Replacement laptop for site engineer" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <FormField label="REQUEST TYPE *">
            <Input value={form.requestType || ''} onChange={e => set('requestType', e.target.value)} placeholder="e.g. Office Equipment" />
          </FormField>
          <FormField label="URGENCY">
            <Select value={form.urgency || 'routine'} onChange={v => set('urgency', v)}
              options={[{ value: 'routine', label: 'Routine' }, { value: 'urgent', label: 'Urgent' }, { value: 'critical', label: 'Critical' }]} />
          </FormField>
        </div>
        <FormField label="REQUESTED BY (EMPLOYEE) *">
          <Select value={form.requestedBy || ''} onChange={v => set('requestedBy', v)} options={empOptions} />
        </FormField>
        <FormField label="DESCRIPTION *">
          <Textarea rows={4} value={form.description || ''} onChange={e => set('description', e.target.value)}
            placeholder="e.g. Current laptop no longer boots reliably; needed before next site visit." />
        </FormField>
      </div>
    </Drawer>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ isOpen, request, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);
  const handleConfirm = async () => { setSaving(true); await onConfirm(reason); setSaving(false); };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Request" width="440px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
          Reject <strong>{request?.requestTitle || request?.requestType}</strong>?
        </p>
        <FormField label="REASON *">
          <Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this request is being rejected…" />
        </FormField>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={handleConfirm} disabled={saving || !reason.trim()}
            style={{ padding: '8px 20px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', opacity: (saving || !reason.trim()) ? 0.7 : 1 }}>
            {saving ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── View Request Drawer ──────────────────────────────────────────────────────
function ViewRequestDrawer({ isOpen, record, onClose, onApprove, onReject }) {
  const [activeTab, setActiveTab] = useState('details');
  useEffect(() => { if (isOpen) setActiveTab('details'); }, [isOpen]);
  if (!record) return null;

  const urgency = record.urgency?.charAt(0).toUpperCase() + record.urgency?.slice(1);
  const chainSteps = ['admin_review', 'procurement_review', 'finance_approval', 'final_approval'];
  const currentIdx = chainSteps.indexOf(record.currentStep);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="View Request" width="500px">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>{record.requestTitle || record.requestType}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748B' }}>
            {record.requestedBy?.fullName || '—'} &bull; {record.requestId}
          </p>
        </div>
        {record.status === 'pending' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onApprove(record)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#10B981', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              <FiCheck size={14} /> Approve
            </button>
            <button onClick={() => onReject(record)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: '0.85rem', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: 6, border: '1px solid #FECACA', cursor: 'pointer' }}>
              <FiX size={14} /> Reject
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
        {['details', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === tab ? '#1D4ED8' : '#64748B', fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer', fontSize: '0.9rem' }}>
            {tab === 'details' ? 'Details' : 'Approval History'}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            {[
              ['REQUEST ID', record.requestId],
              ['REQUEST TYPE', record.requestType],
              ['URGENCY', urgency],
              ['REQUESTED BY', record.requestedBy?.fullName || '—'],
              ['SUBMITTED', record.submittedAt?.slice(0, 10) || '—'],
              ['CURRENT STEP', STEP_LABELS[record.currentStep] || (record.status === 'approved' ? 'Approved' : '—')],
              ['STATUS', <Badge key="s" status={record.status} />],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          {record.description && (
            <div style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>DESCRIPTION</div>
              <div style={{ fontSize: '0.875rem', color: '#334155' }}>{record.description}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ position: 'relative', borderLeft: '2px solid #E2E8F0', paddingLeft: 16, marginLeft: 8, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Always show submission as first step */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: -25, top: 0, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#10B981', border: '3px solid #fff' }} />
            <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>Request Submitted</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>By {record.requestedBy?.fullName || '—'}</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{record.submittedAt?.slice(0, 10) || '—'}</div>
          </div>
          {/* Show approval steps */}
          {record.approvals?.map((approval, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: -25, top: 0, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#10B981', border: '3px solid #fff' }} />
              <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{STEP_LABELS[approval.step] || approval.step}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Approved by {approval.by?.fullName || '—'}</div>
              <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>{approval.at?.slice(0, 10) || '—'}</div>
            </div>
          ))}
          {/* Show current pending step */}
          {record.status === 'pending' && record.currentStep && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: -25, top: 0, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#F59E0B', border: '3px solid #fff' }} />
              <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{STEP_LABELS[record.currentStep]}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Pending</div>
            </div>
          )}
          {/* Rejection */}
          {record.status === 'rejected' && (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: -25, top: 0, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#EF4444', border: '3px solid #fff' }} />
              <div style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>Rejected</div>
              {record.rejectionReason && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{record.rejectionReason}</div>}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Requests() {
  const { addToast } = useToast();

  const [items, setItems]     = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [employees, setEmployees]     = useState([]);

  const [createOpen, setCreateOpen]       = useState(false);
  const [viewRecord, setViewRecord]       = useState(null);
  const [rejectTarget, setRejectTarget]   = useState(null);

  const debounceRef = useRef(null);

  const load = useCallback(async (p, q) => {
    setLoading(true);
    try {
      const params = { page: p, limit: ITEMS_PER_PAGE };
      if (q) params.q = q;
      const r = await adminRequestService.list(params);
      setItems(r.data.data || []);
      setMeta(r.data.meta || null);
    } catch {
      addToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    load(1, '');
    employeeService.list({ limit: 200 }).then(r => setEmployees(r.data.data || [])).catch(() => {});
  }, [load]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, val), 400);
  };

  const handlePageChange = (p) => { setPage(p); load(p, search); };

  const handleApprove = async (row) => {
    try {
      await adminRequestService.approve(row._id);
      addToast('Request approved — advanced to next step', 'success');
      load(page, search);
      if (viewRecord?._id === row._id) setViewRecord(null);
    } catch (err) {
      addToast(err?.response?.data?.error?.message || 'Failed to approve', 'error');
    }
  };

  const handleReject = (row) => { setRejectTarget(row); };

  const handleRejectConfirm = async (reason) => {
    try {
      await adminRequestService.reject(rejectTarget._id, reason);
      addToast('Request rejected', 'success');
      setRejectTarget(null);
      if (viewRecord?._id === rejectTarget._id) setViewRecord(null);
      load(page, search);
    } catch (err) {
      addToast(err?.response?.data?.error?.message || 'Failed to reject', 'error');
    }
  };

  const handleAction = async (action, row) => {
    if (action === 'approve') handleApprove(row);
    else if (action === 'reject') handleReject(row);
    else if (action === 'complete') {
      try {
        await adminRequestService.approve(row._id); // backend uses same approve endpoint to advance
        addToast('Request marked as completed', 'success');
        load(page, search);
      } catch (err) {
        addToast(err?.response?.data?.error?.message || 'Failed', 'error');
      }
    }
  };

  const columns = [
    { key: 'requestId',    label: 'REQUEST ID',   render: (v) => <span style={{ color: '#64748B' }}>{v || '—'}</span> },
    { key: 'requestType',  label: 'REQUEST TYPE' },
    { key: 'requestTitle', label: 'REQUEST',       render: (v, row) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v || row.requestType}</span> },
    { key: 'requestedBy',  label: 'REQUESTED BY',  render: (v) => v?.fullName || '—' },
    { key: 'submittedAt',  label: 'REQUEST DATE',  render: (v) => v?.slice(0, 10) || '—' },
    { key: 'urgency',      label: 'URGENCY',
      render: (v) => {
        const s = URGENCY_STYLES[v] || URGENCY_STYLES.routine;
        const label = v?.charAt(0).toUpperCase() + v?.slice(1);
        return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>{label}</span>;
      }
    },
    { key: 'currentStep',  label: 'CURRENT STEP', render: (v, row) => row.status === 'pending' ? (STEP_LABELS[v] || '—') : '—' },
    { key: 'status',       label: 'STATUS',        render: (v) => <Badge status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewRecord(row)}><FiEye size={15} /></button>
          <RowMenu row={row} onAction={handleAction} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Toast />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Requests</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Submit and track requests for materials, equipment, or supplies
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)} className="btn btn-primary"
          style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiPlus size={14} /> New Request
        </button>
      </div>

      <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by ID, type, employee…" style={{ paddingLeft: 36, width: '100%' }} />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
          </table>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(e => e._id))}
            keyField="_id"
            emptyMessage="No requests found."
          />
        )}

        {meta && meta.totalPages > 1 && (
          <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      <CreateRequestDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        employees={employees}
        onSaved={() => { setCreateOpen(false); load(page, search); }}
      />

      <ViewRequestDrawer
        isOpen={!!viewRecord}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <RejectModal
        isOpen={!!rejectTarget}
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}
