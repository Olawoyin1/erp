import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiBriefcase, FiStar, FiFileText, FiShield,
  FiEdit2, FiTrash2, FiUser, FiPhone, FiMail, FiMapPin, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockVendors, VENDOR_CATEGORIES } from '../../data/mockProcurement';

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
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)', border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '160px' }}>
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

function RatingStars({ rating }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar key={i} size={12} fill={i <= rating ? '#EAB308' : 'none'} color={i <= rating ? '#EAB308' : '#CBD5E1'} />
      ))}
    </div>
  );
}

const vendorStatusStyle = {
  'Approved': { bg: '#DCFCE7', color: '#14532D' },
  'Pending Review': { bg: '#FEF3C7', color: '#92400E' },
  'Blacklisted': { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusPill({ status }) {
  const s = vendorStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function VendorDrawer({ vendor, onClose, onShowToast }) {
  if (!vendor) return null;
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      {vendor.status !== 'Approved' && (
        <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Vendor approved', 'success')}>
          <FiCheckCircle size={14} /> Approve Vendor
        </button>
      )}
      {vendor.status !== 'Blacklisted' && (
        <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, color: '#DC2626', borderColor: '#FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => onShowToast('Vendor blacklisted', 'success')}>
          <FiXCircle size={14} /> Blacklist
        </button>
      )}
    </div>
  );
  return (
    <Drawer isOpen={!!vendor} onClose={onClose} title="Vendor Profile" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace', marginBottom: '4px' }}>{vendor.id}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{vendor.name}</div>
            </div>
            <StatusPill status={vendor.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Rating:</span>
            <RatingStars rating={vendor.rating} />
          </div>
        </div>

        {[
          { label: 'Category', value: vendor.category, icon: <FiBriefcase size={13} /> },
          { label: 'Registration No.', value: vendor.registrationNo, icon: <FiShield size={13} /> },
          { label: 'Primary Contact', value: vendor.contact, icon: <FiUser size={13} /> },
          { label: 'Email', value: vendor.email, icon: <FiMail size={13} /> },
          { label: 'Phone', value: vendor.phone, icon: <FiPhone size={13} /> },
          { label: 'Location', value: vendor.location, icon: <FiMapPin size={13} /> },
          { label: 'Tax Clearance Valid', value: vendor.taxClearance },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {icon && <span style={{ color: '#94A3B8' }}>{icon}</span>}{value}
            </span>
          </div>
        ))}

        <div style={{ padding: '16px', backgroundColor: '#F1F5F9', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
           <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Summary</div>
           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Total Orders</div>
               <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{vendor.totalOrders}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Total Spend</div>
               <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1D4ED8' }}>{fmt(vendor.totalSpend)}</div>
             </div>
             <div>
               <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Last Order</div>
               <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>{vendor.lastOrder}</div>
             </div>
           </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function VendorManagement() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const categoryFilters = ['All', ...VENDOR_CATEGORIES];

  const filtered = mockVendors.filter(v => {
    const q = search.toLowerCase();
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.contact.toLowerCase().includes(q);
    const matchC = categoryFilter === 'All' || v.category === categoryFilter;
    return matchQ && matchC;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const approved = mockVendors.filter(v => v.status === 'Approved').length;
  const pending = mockVendors.filter(v => v.status === 'Pending Review').length;
  const blacklisted = mockVendors.filter(v => v.status === 'Blacklisted').length;

  const columns = [
    { key: 'name', label: 'VENDOR NAME', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: '#0F172A' }}>{v}</div>
        <div style={{ fontSize: '0.73rem', color: '#94A3B8', fontFamily: 'monospace' }}>{row.id}</div>
      </div>
    )},
    { key: 'category', label: 'CATEGORY' },
    { key: 'contact', label: 'PRIMARY CONTACT', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 500, color: '#0F172A', fontSize: '0.8rem' }}>{v}</div>
        <div style={{ fontSize: '0.73rem', color: '#1D4ED8' }}>{row.email}</div>
      </div>
    )},
    { key: 'rating', label: 'RATING', render: v => <RatingStars rating={v} /> },
    { key: 'totalOrders', label: 'ORDERS', align: 'center', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'totalSpend', label: 'TOTAL SPEND', render: v => <span style={{ fontWeight: 600, color: '#475569' }}>{fmtK(v)}</span> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <button className="icon-btn" onClick={() => setSelectedVendor(row)}><FiEye size={15} /></button>
        <RowMenu items={[
          { label: 'Edit Profile', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
          ...(row.status !== 'Approved' ? [{ label: 'Approve', icon: <FiCheckCircle size={13} />, color: '#16A34A', action: () => showToast('Vendor approved', 'success') }] : []),
          ...(row.status !== 'Blacklisted' ? [{ label: 'Blacklist', icon: <FiXCircle size={13} />, color: '#DC2626', action: () => showToast('Vendor blacklisted', 'success') }] : []),
        ]} />
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <VendorDrawer vendor={selectedVendor} onClose={() => setSelectedVendor(null)} onShowToast={showToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Vendor Management</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage supplier directory, ratings, and compliance status</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Add Vendor
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiBriefcase size={20} />} label="Total Vendors" value={mockVendors.length} sub="Registered suppliers" accent="#1D4ED8" />
        <StatCard icon={<FiCheckCircle size={20} />} label="Approved" value={approved} sub="Active for sourcing" accent="#16A34A" />
        <StatCard icon={<FiFileText size={20} />} label="Pending Review" value={pending} sub="Awaiting approval" accent="#D97706" />
        <StatCard icon={<FiShield size={20} />} label="Blacklisted" value={blacklisted} sub="Restricted vendors" accent="#DC2626" />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categoryFilters.map(f => {
              const active = categoryFilter === f;
              return (
                <button key={f} onClick={() => { setCategoryFilter(f); setPage(1); }}
                  style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    backgroundColor: active ? '#1D4ED8' : '#F1F5F9', color: active ? '#fff' : '#64748B' }}>
                  {f}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative' }}>
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search vendors..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id" emptyMessage="No vendors found." />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Register New Vendor" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Vendor Name"><Input placeholder="Company name" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Registration No (RC/BN)"><Input placeholder="e.g. RC-123456" /></FormField>
            <FormField label="Category">
              <select className="form-input">{VENDOR_CATEGORIES.map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Primary Contact"><Input placeholder="Contact person name" /></FormField>
            <FormField label="Email"><Input type="email" placeholder="contact@company.com" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Phone"><Input placeholder="+234..." /></FormField>
            <FormField label="Location"><Input placeholder="City, State" /></FormField>
          </div>
          <FormField label="Tax Clearance Expiry Date"><Input type="date" /></FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Vendor registered', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>Register Vendor</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
