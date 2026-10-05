import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiShoppingCart, FiClock, FiCheckCircle, FiPackage, FiAlertCircle,
  FiEdit2, FiSend, FiUser, FiCalendar, FiTag, FiFileText,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockPurchaseRequests } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;
const fmt = n => '₦' + n.toLocaleString();
const fmtK = n => '₦' + (n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : (n / 1_000).toFixed(0) + 'K');

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

const prStatusStyle = {
  'Pending':      { bg: '#FEF3C7', color: '#92400E' },
  'Pending HOD':  { bg: '#FFF7ED', color: '#C2410C' },
  'Approved':     { bg: '#DBEAFE', color: '#1E40AF' },
  'PO Raised':    { bg: '#EDE9FE', color: '#5B21B6' },
  'Delivered':    { bg: '#DCFCE7', color: '#14532D' },
  'Rejected':     { bg: '#FEE2E2', color: '#991B1B' },
};

const priorityColor = { High: '#DC2626', Medium: '#D97706', Low: '#64748B' };

function StatusPill({ status }) {
  const s = prStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function PRDrawer({ pr, onClose, onShowToast }) {
  if (!pr) return null;
  const canApprove = ['Pending', 'Pending HOD'].includes(pr.status);
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {canApprove && <>
        <button style={{ flex: 1, padding: '9px', backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Purchase request rejected', 'success')}>Reject</button>
        <button style={{ flex: 2, padding: '9px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Request approved', 'success')}>
          <FiCheckCircle size={14} /> Approve Request
        </button>
      </>}
      {pr.status === 'Approved' && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('PO raised successfully', 'success')}>
          <FiSend size={14} /> Raise Purchase Order
        </button>
      )}
    </div>
  );
  return (
    <Drawer isOpen={!!pr} onClose={onClose} title="Purchase Request" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace', marginBottom: '4px' }}>{pr.id}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{pr.title}</div>
            </div>
            <StatusPill status={pr.status} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8' }}>{fmt(pr.estimatedCost)}</div>
        </div>

        {[
          { label: 'Department', value: pr.department },
          { label: 'Requested By', value: pr.requestedBy, icon: <FiUser size={13} /> },
          { label: 'Date Raised', value: pr.date, icon: <FiCalendar size={13} /> },
          { label: 'Required By', value: pr.requiredDate, icon: <FiCalendar size={13} /> },
          { label: 'Quantity', value: `${pr.quantity} ${pr.unit}` },
          { label: 'Priority', value: pr.priority },
          ...(pr.poRef ? [{ label: 'PO Reference', value: pr.poRef }] : []),
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        {/* Approval timeline */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Flow</div>
          {[
            { step: 'Submitted', done: true, date: pr.date },
            { step: 'HOD Approval', done: !['Pending', 'Pending HOD'].includes(pr.status), date: pr.status !== 'Pending' ? pr.date : null },
            { step: 'Procurement Review', done: ['Approved', 'PO Raised', 'Delivered'].includes(pr.status), date: null },
            { step: 'PO Raised', done: ['PO Raised', 'Delivered'].includes(pr.status), date: pr.poRef ? pr.date : null },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: step.done ? '#16A34A' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {step.done ? <FiCheckCircle size={13} color="#fff" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#94A3B8' }} />}
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: step.done ? '#0F172A' : '#94A3B8' }}>{step.step}</div>
                {step.date && <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{step.date}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

export default function PurchaseRequests() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPR, setSelectedPR] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const statusFilters = ['All', 'Pending', 'Pending HOD', 'Approved', 'PO Raised', 'Delivered', 'Rejected'];

  const filtered = mockPurchaseRequests.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.title.toLowerCase().includes(q) || r.requestedBy.toLowerCase().includes(q) || r.department.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || r.status === statusFilter;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const pending = mockPurchaseRequests.filter(r => ['Pending', 'Pending HOD'].includes(r.status)).length;
  const approved = mockPurchaseRequests.filter(r => r.status === 'Approved').length;
  const totalValue = mockPurchaseRequests.reduce((s, r) => s + r.estimatedCost, 0);

  const columns = [
    { key: 'id', label: 'PR NO.', render: v => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748B' }}>{v}</span> },
    { key: 'title', label: 'ITEM / SERVICE', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div>
        <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{row.department}</div>
      </div>
    )},
    { key: 'requestedBy', label: 'REQUESTED BY', render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><FiUser size={13} style={{ color: '#94A3B8' }} />{v}</span> },
    { key: 'quantity', label: 'QTY', render: (v, row) => `${v} ${row.unit}` },
    { key: 'estimatedCost', label: 'EST. COST', render: v => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmtK(v)}</span> },
    { key: 'requiredDate', label: 'REQUIRED BY' },
    { key: 'priority', label: 'PRIORITY', render: v => <span style={{ color: priorityColor[v] || '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <button className="icon-btn" onClick={() => setSelectedPR(row)}><FiEye size={15} /></button>
        <RowMenu items={[
          ...((['Pending', 'Pending HOD'].includes(row.status)) ? [{ label: 'Approve', icon: <FiCheckCircle size={13} />, color: '#16A34A', action: () => showToast('Request approved', 'success') }] : []),
          ...(row.status === 'Approved' ? [{ label: 'Raise PO', icon: <FiSend size={13} />, color: '#7C3AED', action: () => showToast('PO raised', 'success') }] : []),
          { label: 'Edit', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
        ]} />
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PRDrawer pr={selectedPR} onClose={() => setSelectedPR(null)} onShowToast={showToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Purchase Requests</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage internal purchase requests, approvals, and conversion to purchase orders</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> New Request
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiFileText size={20} />} label="Total Requests" value={mockPurchaseRequests.length} sub="All time" accent="#1D4ED8" />
        <StatCard icon={<FiClock size={20} />} label="Pending Approval" value={pending} sub="Awaiting action" accent="#D97706" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Approved" value={approved} sub="Ready for PO" accent="#16A34A" />
        <StatCard icon={<FiShoppingCart size={20} />} label="Total Value" value={fmtK(totalValue)} sub="Estimated spend" accent="#7C3AED" />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {statusFilters.map(f => (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', backgroundColor: statusFilter === f ? '#1D4ED8' : '#F1F5F9', color: statusFilter === f ? '#fff' : '#64748B' }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search requests..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No purchase requests found." />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Purchase Request" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Item / Service Description"><Input placeholder="What is being requested?" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Department">
              <select className="form-input">{['Administration', 'HSE', 'Technical', 'IT', 'Finance', 'HR', 'Procurement'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
            <FormField label="Priority">
              <select className="form-input">{['High', 'Medium', 'Low'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <FormField label="Quantity"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Unit"><Input placeholder="e.g. Units, Kgs, Litres" /></FormField>
            <FormField label="Estimated Cost (₦)"><Input type="number" placeholder="0" /></FormField>
          </div>
          <FormField label="Required By Date"><Input type="date" /></FormField>
          <FormField label="Justification"><Textarea placeholder="Why is this item needed?" rows={2} /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Purchase request submitted', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>Submit Request</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
