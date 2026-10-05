import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiShoppingCart, FiCheckCircle, FiPackage, FiDollarSign,
  FiEdit2, FiPrinter, FiAlertTriangle, FiUser, FiCalendar, FiSend,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockPurchaseOrders } from '../../data/mockProcurement';

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

const poStatusStyle = {
  'Confirmed':  { bg: '#DBEAFE', color: '#1E40AF' },
  'Delivered':  { bg: '#DCFCE7', color: '#14532D' },
  'Cancelled':  { bg: '#FEE2E2', color: '#991B1B' },
  'Draft':      { bg: '#F1F5F9', color: '#475569' },
};

const payStatusStyle = {
  'Paid':    { bg: '#DCFCE7', color: '#14532D' },
  'Partial': { bg: '#FEF3C7', color: '#92400E' },
  'Unpaid':  { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusPill({ status, styleMap }) {
  const s = (styleMap || poStatusStyle)[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function PODrawer({ po, onClose, onShowToast }) {
  if (!po) return null;
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('PO printed', 'success')}>
        <FiPrinter size={14} /> Print PO
      </button>
      {po.status === 'Confirmed' && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Delivery confirmed', 'success')}>
          <FiPackage size={14} /> Confirm Delivery
        </button>
      )}
    </div>
  );
  return (
    <Drawer isOpen={!!po} onClose={onClose} title="Purchase Order" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* PO Header */}
        <div style={{ backgroundColor: '#0F172A', borderRadius: '12px', padding: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '4px' }}>PURCHASE ORDER</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.05em' }}>{po.id}</div>
            </div>
            <StatusPill status={po.status} />
          </div>
          <div style={{ fontSize: '0.85rem', color: '#CBD5E1', marginBottom: '4px' }}>{po.title}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#60A5FA', marginTop: '8px' }}>{fmt(po.amount)}</div>
        </div>

        {[
          { label: 'Vendor', value: po.vendor },
          { label: 'Department', value: po.department },
          { label: 'Approved By', value: po.approvedBy, icon: <FiUser size={13} /> },
          { label: 'Issue Date', value: po.issuedDate, icon: <FiCalendar size={13} /> },
          { label: 'Delivery Date', value: po.deliveryDate, icon: <FiCalendar size={13} /> },
          ...(po.prRef ? [{ label: 'PR Reference', value: po.prRef }] : []),
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        {/* Payment Status */}
        <div style={{ padding: '14px 16px', borderRadius: '8px', backgroundColor: payStatusStyle[po.paymentStatus]?.bg || '#F1F5F9', border: `1px solid ${payStatusStyle[po.paymentStatus]?.color || '#E2E8F0'}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.83rem', fontWeight: 600, color: payStatusStyle[po.paymentStatus]?.color || '#64748B' }}>Payment Status</span>
          <StatusPill status={po.paymentStatus} styleMap={payStatusStyle} />
        </div>

        {po.paymentStatus !== 'Paid' && (
          <button className="btn btn-primary" onClick={() => onShowToast('Payment record updated', 'success')}
            style={{ backgroundColor: '#16A34A', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FiDollarSign size={14} /> Record Payment
          </button>
        )}
      </div>
    </Drawer>
  );
}

export default function PurchaseOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const statusFilters = ['All', 'Draft', 'Confirmed', 'Delivered', 'Cancelled'];

  const filtered = mockPurchaseOrders.filter(po => {
    const q = search.toLowerCase();
    const matchQ = !q || po.title.toLowerCase().includes(q) || po.vendor.toLowerCase().includes(q) || po.id.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || po.status === statusFilter;
    return matchQ && matchS;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const confirmed = mockPurchaseOrders.filter(p => p.status === 'Confirmed').length;
  const delivered = mockPurchaseOrders.filter(p => p.status === 'Delivered').length;
  const unpaid = mockPurchaseOrders.filter(p => p.paymentStatus !== 'Paid').length;
  const totalSpend = mockPurchaseOrders.reduce((s, p) => s + p.amount, 0);

  const columns = [
    { key: 'id', label: 'PO NUMBER', render: v => <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: '#1D4ED8' }}>{v}</span> },
    { key: 'title', label: 'DESCRIPTION', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: 240 }}>{v}</div>
        <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{row.prRef ? `PR: ${row.prRef}` : 'Direct PO'}</div>
      </div>
    )},
    { key: 'vendor', label: 'VENDOR' },
    { key: 'department', label: 'DEPT.' },
    { key: 'amount', label: 'AMOUNT', render: v => <span style={{ fontWeight: 700, color: '#1D4ED8' }}>{fmtK(v)}</span> },
    { key: 'issuedDate', label: 'ISSUED' },
    { key: 'deliveryDate', label: 'DELIVERY' },
    { key: 'paymentStatus', label: 'PAYMENT', render: v => <StatusPill status={v} styleMap={payStatusStyle} /> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <button className="icon-btn" onClick={() => setSelectedPO(row)}><FiEye size={15} /></button>
        <RowMenu items={[
          { label: 'Print PO', icon: <FiPrinter size={13} />, action: () => showToast('PO printed', 'success') },
          ...(row.status === 'Confirmed' ? [{ label: 'Confirm Delivery', icon: <FiPackage size={13} />, color: '#16A34A', action: () => showToast('Delivery confirmed', 'success') }] : []),
          ...(row.paymentStatus !== 'Paid' ? [{ label: 'Record Payment', icon: <FiDollarSign size={13} />, color: '#D97706', action: () => showToast('Payment recorded', 'success') }] : []),
          { label: 'Edit PO', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
        ]} />
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <PODrawer po={selectedPO} onClose={() => setSelectedPO(null)} onShowToast={showToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Purchase Orders</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Track issued purchase orders, delivery confirmations, and payment status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Create PO
          </button>
        </div>
      </div>

      {unpaid > 0 && (
        <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiAlertTriangle size={16} color="#EA580C" />
            <span style={{ fontSize: '0.875rem', color: '#92400E' }}><strong>{unpaid} PO{unpaid > 1 ? 's' : ''}</strong> have outstanding payments. Review and settle promptly.</span>
          </div>
          <button style={{ fontSize: '0.875rem', color: '#EA580C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>View Unpaid →</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiShoppingCart size={20} />} label="Total POs" value={mockPurchaseOrders.length} sub="Issued to date" accent="#1D4ED8" />
        <StatCard icon={<FiSend size={20} />} label="Confirmed" value={confirmed} sub="Awaiting delivery" accent="#7C3AED" />
        <StatCard icon={<FiPackage size={20} />} label="Delivered" value={delivered} sub="Received in full" accent="#16A34A" />
        <StatCard icon={<FiDollarSign size={20} />} label="Total Spend" value={fmtK(totalSpend)} sub="Across all POs" accent="#0891B2" />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {statusFilters.map(f => (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', backgroundColor: statusFilter === f ? '#1D4ED8' : '#F1F5F9', color: statusFilter === f ? '#fff' : '#64748B' }}>
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search PO, vendor..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No purchase orders found." />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Create Purchase Order" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="PR Reference (Optional)"><Input placeholder="e.g. PR-2026-004" /></FormField>
          <FormField label="Item / Service Description"><Input placeholder="What is being purchased?" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Vendor"><Input placeholder="Vendor name" /></FormField>
            <FormField label="Department">
              <select className="form-input">{['Administration', 'HSE', 'Technical', 'IT', 'Finance', 'HR', 'Procurement'].map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="PO Amount (₦)"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Expected Delivery Date"><Input type="date" /></FormField>
          </div>
          <FormField label="Approved By"><Input placeholder="Authorising officer" /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Purchase order created', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>Create PO</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


