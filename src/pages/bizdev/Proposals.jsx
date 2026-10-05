import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiFileText, FiCheckCircle, FiXCircle, FiSend, FiEdit2,
  FiDollarSign, FiCalendar, FiUser, FiAlertTriangle,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockProposals } from '../../data/mockBizDev';

const ITEMS_PER_PAGE = 8;
const fmt = (n) => '₦' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1_000).toFixed(0) + 'K');
const fmtFull = (n) => '₦' + n.toLocaleString();

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
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '165px' }}>
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

const proposalStatusStyle = {
  'Draft':        { bg: '#F1F5F9', color: '#475569' },
  'Sent':         { bg: '#DBEAFE', color: '#1E40AF' },
  'Under Review': { bg: '#FEF3C7', color: '#92400E' },
  'Won':          { bg: '#DCFCE7', color: '#14532D' },
  'Lost':         { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusPill({ status }) {
  const s = proposalStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function ValidityBadge({ validity }) {
  if (!validity) return <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>;
  const today = new Date('2026-10-05');
  const d = new Date(validity);
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.8rem' }}>Expired</span>;
  if (diff <= 14) return <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.8rem' }}>{validity} ⚠</span>;
  return <span style={{ fontSize: '0.83rem', color: '#475569' }}>{validity}</span>;
}

function ProposalDrawer({ proposal, onClose, onShowToast }) {
  if (!proposal) return null;
  const s = proposalStatusStyle[proposal.status] || { bg: '#F1F5F9', color: '#64748B' };
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Proposal downloaded', 'success')}>
        <FiDownload size={14} /> Download
      </button>
      {proposal.status === 'Draft' && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Proposal sent to client', 'success')}>
          <FiSend size={14} /> Send Proposal
        </button>
      )}
      {proposal.status === 'Under Review' && (
        <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
          <button style={{ flex: 1, padding: '9px', backgroundColor: '#DCFCE7', color: '#14532D', border: '1px solid #BBF7D0', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => onShowToast('Proposal marked as Won!', 'success')}>
            <FiCheckCircle size={14} /> Won
          </button>
          <button style={{ flex: 1, padding: '9px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => onShowToast('Proposal marked as Lost', 'info')}>
            <FiXCircle size={14} /> Lost
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Drawer isOpen={!!proposal} onClose={onClose} title="Proposal Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8', marginBottom: '6px' }}>{proposal.ref}</div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{proposal.title}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{proposal.client}</div>
            </div>
            <StatusPill status={proposal.status} />
          </div>
          <div style={{ marginTop: '12px', fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8' }}>{fmtFull(proposal.value)}</div>
        </div>

        {[
          { label: 'Proposal ID', value: proposal.id },
          { label: 'Version', value: proposal.version },
          { label: 'Prepared By', value: proposal.preparedBy, icon: <FiUser size={13} /> },
          { label: 'Date Sent', value: proposal.sentDate || '—', icon: <FiCalendar size={13} /> },
          { label: 'Valid Until', value: proposal.validity || '—', icon: <FiCalendar size={13} /> },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        {proposal.status === 'Won' && (
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckCircle size={18} color="#16A34A" />
            <div>
              <div style={{ fontWeight: 700, color: '#14532D', fontSize: '0.85rem' }}>Proposal Accepted</div>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '2px' }}>Contract has been awarded to PGSL</div>
            </div>
          </div>
        )}
        {proposal.status === 'Lost' && (
          <div style={{ backgroundColor: '#FFF1F2', borderRadius: '8px', border: '1px solid #FECDD3', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiXCircle size={18} color="#DC2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.85rem' }}>Proposal Declined</div>
              <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '2px' }}>Contract was awarded to another vendor</div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function Proposals() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const statusFilters = ['All', 'Draft', 'Sent', 'Under Review', 'Won', 'Lost'];

  const filtered = mockProposals.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.title.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || p.status === statusFilter;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Validity alerts
  const today = new Date('2026-10-05');
  const expiringSoon = mockProposals.filter(p => {
    if (!p.validity || !['Sent', 'Under Review'].includes(p.status)) return false;
    const diff = Math.ceil((new Date(p.validity) - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 14;
  });

  const totalValue = mockProposals.filter(p => p.status !== 'Lost').reduce((s, p) => s + p.value, 0);
  const wonValue = mockProposals.filter(p => p.status === 'Won').reduce((s, p) => s + p.value, 0);
  const won = mockProposals.filter(p => p.status === 'Won').length;
  const lost = mockProposals.filter(p => p.status === 'Lost').length;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0;

  const columns = [
    { key: 'id', label: 'PROP ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    {
      key: 'title', label: 'PROPOSAL',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: 270 }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>{row.client}</div>
        </div>
      )
    },
    { key: 'version', label: 'VERSION', render: v => <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.73rem', fontWeight: 700 }}>{v}</span> },
    { key: 'value', label: 'VALUE', render: v => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmt(v)}</span> },
    { key: 'preparedBy', label: 'PREPARED BY', render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FiUser size={13} style={{ color: '#94A3B8' }} />{v}</span> },
    { key: 'sentDate', label: 'DATE SENT', render: v => v || <span style={{ color: '#CBD5E1' }}>—</span> },
    { key: 'validity', label: 'VALID UNTIL', render: v => <ValidityBadge validity={v} /> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedProposal(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Proposal', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            ...(row.status === 'Draft' ? [{ label: 'Send to Client', icon: <FiSend size={13} />, color: '#1D4ED8', action: () => showToast('Proposal sent', 'success') }] : []),
            ...(row.status === 'Under Review' ? [
              { label: 'Mark Won', icon: <FiCheckCircle size={13} />, color: '#16A34A', action: () => showToast('Marked as Won!', 'success') },
              { label: 'Mark Lost', icon: <FiXCircle size={13} />, color: '#DC2626', action: () => showToast('Marked as Lost', 'info') },
            ] : []),
          ]} />
        </div>
      )
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ProposalDrawer proposal={selectedProposal} onClose={() => setSelectedProposal(null)} onShowToast={showToast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Proposals</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage commercial proposals, track versions, client responses, and award outcomes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> New Proposal
          </button>
        </div>
      </div>

      {/* Validity alert */}
      {expiringSoon.length > 0 && (
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle size={16} color="#EA580C" />
            <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
              <strong>{expiringSoon.length} proposal{expiringSoon.length > 1 ? 's' : ''}</strong> expiring within 14 days. Consider following up with clients.
            </span>
          </div>
          <button style={{ fontSize: '0.875rem', color: '#EA580C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            View Expiring →
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiFileText size={20} />} label="Total Proposals" value={mockProposals.length} sub="All time" accent="#1D4ED8" />
        <StatCard icon={<FiDollarSign size={20} />} label="Active Value" value={fmt(totalValue)} sub="Excluding losses" accent="#7C3AED" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Won Value" value={fmt(wonValue)} sub="Contracts secured" accent="#16A34A" />
        <StatCard icon={<FiXCircle size={20} />} label="Win Rate" value={`${winRate}%`} sub={`${won} won, ${lost} lost`} accent="#0891B2" />
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
              placeholder="Search proposals, clients..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No proposals found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* New Proposal Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create New Proposal" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Proposal Title"><Input placeholder="Title of works or services" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Client"><Input placeholder="Company name" /></FormField>
            <FormField label="Tender Reference"><Input placeholder="e.g. TEN/TOT/2026/047" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Proposal Value (₦)"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Prepared By"><Input placeholder="Staff member" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Validity Period (days)"><Input type="number" placeholder="60" /></FormField>
            <FormField label="Status">
              <select className="form-input">{['Draft', 'Sent', 'Under Review'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <FormField label="Notes"><Textarea placeholder="Key proposal notes, assumptions, exclusions..." rows={2} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Proposal created successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Create Proposal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
