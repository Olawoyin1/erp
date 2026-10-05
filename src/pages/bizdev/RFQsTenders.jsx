import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiFileText, FiClock, FiCheckCircle, FiAlertTriangle, FiXCircle,
  FiEdit2, FiCalendar, FiDollarSign, FiSend, FiInbox,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockTenders } from '../../data/mockBizDev';

const ITEMS_PER_PAGE = 8;
const fmt = (n) => '₦' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1_000).toFixed(0) + 'K');

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen(v => !v)}><FiMoreVertical size={16} /></button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '170px' }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { item.action(); setOpen(false); }} className="menu-item-hover"
              style={{ padding: '8px 14px', fontSize: '0.813rem', color: item.color || '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              {item.icon}{item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

const tenderStatusStyle = {
  'Received':    { bg: '#EFF6FF', color: '#1D4ED8' },
  'In Progress': { bg: '#FEF3C7', color: '#92400E' },
  'Submitted':   { bg: '#EDE9FE', color: '#5B21B6' },
  'Awarded':     { bg: '#DCFCE7', color: '#14532D' },
  'Lost':        { bg: '#FEE2E2', color: '#991B1B' },
  'Missed':      { bg: '#FFF1F2', color: '#BE123C' },
};

function StatusPill({ status }) {
  const s = tenderStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function DeadlineBadge({ deadline }) {
  const today = new Date('2026-10-05');
  const d = new Date(deadline);
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>Overdue</span>;
  if (diff <= 7) return <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.8rem' }}>In {diff}d ⚠</span>;
  return <span style={{ fontSize: '0.83rem', color: '#475569' }}>{deadline}</span>;
}

function TenderDrawer({ tender, onClose, onShowToast }) {
  if (!tender) return null;
  const s = tenderStatusStyle[tender.status] || { bg: '#F1F5F9', color: '#64748B' };
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600 }} onClick={() => onShowToast('Document downloaded', 'success')}>
        <FiDownload size={14} style={{ marginRight: 6 }} /> Download RFQ
      </button>
      {tender.status === 'In Progress' && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}
          onClick={() => onShowToast('Marked as submitted', 'success')}>
          <FiSend size={14} style={{ marginRight: 6 }} /> Mark Submitted
        </button>
      )}
    </div>
  );

  return (
    <Drawer isOpen={!!tender} onClose={onClose} title="Tender Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '6px' }}>{tender.ref}</div>
            <StatusPill status={tender.status} />
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{tender.title}</div>
          <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{tender.client}</div>
        </div>

        {[
          { label: 'Tender ID', value: tender.id },
          { label: 'Category', value: tender.category },
          { label: 'Estimated Value', value: fmt(tender.estimatedValue), icon: <FiDollarSign size={13} /> },
          { label: 'Date Issued', value: tender.issuedDate, icon: <FiCalendar size={13} /> },
          { label: 'Submission Deadline', value: tender.deadline, icon: <FiClock size={13} /> },
          { label: 'Date Submitted', value: tender.submittedDate || '—', icon: <FiSend size={13} /> },
          { label: 'BD Owner', value: tender.owner },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

export default function RFQsTenders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTender, setSelectedTender] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const statusFilters = ['All', 'Received', 'In Progress', 'Submitted', 'Awarded', 'Lost', 'Missed'];

  const filtered = mockTenders.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || t.client.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || t.status === statusFilter;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const columns = [
    { key: 'ref', label: 'TENDER REF', render: v => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748B' }}>{v}</span> },
    {
      key: 'title', label: 'TENDER TITLE',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: 280 }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{row.client}</div>
        </div>
      )
    },
    { key: 'category', label: 'CATEGORY' },
    { key: 'estimatedValue', label: 'EST. VALUE', render: v => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmt(v)}</span> },
    { key: 'issuedDate', label: 'ISSUED' },
    { key: 'deadline', label: 'DEADLINE', render: v => <DeadlineBadge deadline={v} /> },
    { key: 'owner', label: 'OWNER' },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedTender(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Record', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            ...(row.status === 'In Progress' ? [{ label: 'Mark Submitted', icon: <FiSend size={13} />, color: '#7C3AED', action: () => showToast('Marked as submitted', 'success') }] : []),
            ...(row.status === 'Submitted' ? [{ label: 'Mark Awarded', icon: <FiCheckCircle size={13} />, color: '#16A34A', action: () => showToast('Marked as awarded', 'success') }] : []),
            { label: 'Mark as Lost', icon: <FiXCircle size={13} />, color: '#DC2626', action: () => showToast('Marked as lost', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const received = mockTenders.filter(t => t.status === 'Received').length;
  const inProgress = mockTenders.filter(t => t.status === 'In Progress').length;
  const awarded = mockTenders.filter(t => t.status === 'Awarded').length;
  const totalEstimated = mockTenders.reduce((s, t) => s + t.estimatedValue, 0);

  // Upcoming deadlines alert
  const today = new Date('2026-10-05');
  const urgent = mockTenders.filter(t => {
    const diff = Math.ceil((new Date(t.deadline) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 10 && ['Received', 'In Progress'].includes(t.status);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <TenderDrawer tender={selectedTender} onClose={() => setSelectedTender(null)} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>RFQs & Tenders</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track incoming tender invitations, submission deadlines, and award outcomes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Log Tender
          </button>
        </div>
      </div>

      {/* Urgent deadline alert */}
      {urgent.length > 0 && (
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle size={16} color="#EA580C" />
            <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
              <strong>{urgent.length} tender{urgent.length > 1 ? 's' : ''}</strong> {urgent.length > 1 ? 'have' : 'has'} a submission deadline within 10 days. Ensure timely responses.
            </span>
          </div>
          <button style={{ fontSize: '0.875rem', color: '#EA580C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View Urgent →
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiInbox size={20} />} label="Total Tenders" value={mockTenders.length} sub="Received this year" accent="#1D4ED8" />
        <StatCard icon={<FiClock size={20} />} label="In Progress" value={inProgress + received} sub="Awaiting submission" accent="#D97706" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Awarded" value={awarded} sub="Contracts won" accent="#16A34A" />
        <StatCard icon={<FiDollarSign size={20} />} label="Total Value" value={fmt(totalEstimated)} sub="Estimated opportunity" accent="#7C3AED" />
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {statusFilters.map(f => (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                  backgroundColor: statusFilter === f ? '#1D4ED8' : '#F1F5F9', color: statusFilter === f ? '#fff' : '#64748B' }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search tender, client, ref..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No tenders found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Log Tender Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Log New Tender" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Tender Reference"><Input placeholder="e.g. TEN/TOT/2026/099" /></FormField>
          <FormField label="Tender Title"><Input placeholder="Description of works/services required" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Client"><Input placeholder="Company name" /></FormField>
            <FormField label="Category">
              <select className="form-input">{['Engineering', 'Maintenance', 'HSE', 'Civil', 'Instrumentation', 'Project Management', 'Inspection', 'Other'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Date Issued"><Input type="date" /></FormField>
            <FormField label="Submission Deadline"><Input type="date" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Estimated Value (₦)"><Input type="number" placeholder="0" /></FormField>
            <FormField label="BD Owner"><Input placeholder="Responsible team member" /></FormField>
          </div>
          <FormField label="Notes"><Textarea placeholder="Additional context or requirements..." rows={2} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Tender logged successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Log Tender
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
