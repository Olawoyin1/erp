import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiBox, FiAlertTriangle, FiArrowDownCircle, FiArrowUpCircle,
  FiEdit2, FiRepeat, FiMapPin, FiTruck
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockInventory, INVENTORY_CATEGORIES } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;
const fmt = n => '₦' + n.toLocaleString();

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

const invStatusStyle = {
  'In Stock':     { bg: '#DCFCE7', color: '#14532D' },
  'Low Stock':    { bg: '#FEF3C7', color: '#92400E' },
  'Critical':     { bg: '#FFEDD5', color: '#9A3412' },
  'Out of Stock': { bg: '#FEE2E2', color: '#991B1B' },
};

function StatusPill({ status }) {
  const s = invStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>;
}

function ItemDrawer({ item, onClose, onShowToast }) {
  if (!item) return null;
  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Stock issued', 'success')}>
        <FiArrowUpCircle size={14} /> Issue Stock
      </button>
      <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        onClick={() => onShowToast('Stock received', 'success')}>
        <FiArrowDownCircle size={14} /> Receive Stock
      </button>
    </div>
  );
  return (
    <Drawer isOpen={!!item} onClose={onClose} title="Inventory Item Details" footer={footer} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'monospace', marginBottom: '4px' }}>{item.id}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
            </div>
            <StatusPill status={item.status} />
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B' }}>In Stock</div>
               <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8' }}>{item.quantityInStock} <span style={{fontSize: '0.8rem', fontWeight: 500, color: '#94A3B8'}}>{item.unit}</span></div>
            </div>
            <div>
               <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Unit Cost</div>
               <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>{fmt(item.unitCost)}</div>
            </div>
          </div>
        </div>

        {[
          { label: 'Category', value: item.category },
          { label: 'Reorder Level', value: `${item.reorderLevel} ${item.unit}` },
          { label: 'On Order', value: `${item.quantityOnOrder} ${item.unit}` },
          { label: 'Store Location', value: item.location, icon: <FiMapPin size={13} /> },
          { label: 'Primary Supplier', value: item.supplier, icon: <FiTruck size={13} /> },
          { label: 'Last Restocked', value: item.lastRestocked },
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

export default function InventoryStore() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const categoryFilters = ['All', ...INVENTORY_CATEGORIES];

  const filtered = mockInventory.filter(i => {
    const q = search.toLowerCase();
    const matchQ = !q || i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    const matchC = categoryFilter === 'All' || i.category === categoryFilter;
    return matchQ && matchC;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const totalItems = mockInventory.length;
  const lowStock = mockInventory.filter(i => ['Low Stock', 'Critical'].includes(i.status)).length;
  const outOfStock = mockInventory.filter(i => i.status === 'Out of Stock').length;
  const totalValue = mockInventory.reduce((s, i) => s + (i.quantityInStock * i.unitCost), 0);

  const columns = [
    { key: 'id', label: 'ITEM ID', render: v => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748B' }}>{v}</span> },
    { key: 'name', label: 'ITEM NAME', render: (v, row) => (
      <div>
        <div style={{ fontWeight: 600, color: '#0F172A', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={v}>{v}</div>
        <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{row.category}</div>
      </div>
    )},
    { key: 'quantityInStock', label: 'STOCK', render: (v, row) => <span style={{ fontWeight: 700 }}>{v} <span style={{fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500}}>{row.unit}</span></span> },
    { key: 'reorderLevel', label: 'REORDER LVL', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'unitCost', label: 'UNIT COST', render: v => fmt(v) },
    { key: 'location', label: 'LOCATION', render: v => <span style={{ fontSize: '0.75rem', color: '#475569' }}>{v}</span> },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: (_, row) => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
        <button className="icon-btn" onClick={() => setSelectedItem(row)}><FiEye size={15} /></button>
        <RowMenu items={[
          { label: 'Receive Stock', icon: <FiArrowDownCircle size={13} />, color: '#16A34A', action: () => showToast('Stock received', 'success') },
          { label: 'Issue Stock', icon: <FiArrowUpCircle size={13} />, color: '#D97706', action: () => showToast('Stock issued', 'success') },
          { label: 'Reorder', icon: <FiRepeat size={13} />, color: '#1D4ED8', action: () => showToast('PR created', 'success') },
          { label: 'Edit Item', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
        ]} />
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ItemDrawer item={selectedItem} onClose={() => setSelectedItem(null)} onShowToast={showToast} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Inventory & Store</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage stock levels, locations, and reorder points</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiDownload size={14} /> Export</button>
          <button onClick={() => setAddModal(true)} className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Add Item
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiBox size={20} />} label="Unique Items" value={totalItems} sub="Tracked in store" accent="#1D4ED8" />
        <StatCard icon={<FiAlertTriangle size={20} />} label="Low Stock" value={lowStock} sub="Below reorder level" accent="#D97706" />
        <StatCard icon={<FiAlertTriangle size={20} />} label="Out of Stock" value={outOfStock} sub="Needs urgent restock" accent="#DC2626" />
        <StatCard icon={<FiBox size={20} />} label="Inventory Value" value={fmt(totalValue)} sub="Current stock valuation" accent="#16A34A" />
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
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search items..." style={{ paddingLeft: '34px', width: '240px' }} />
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          </div>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable columns={columns} data={paginated} keyField="id" emptyMessage="No items found." />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Inventory Item" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Item Name"><Input placeholder="e.g. Safety Helmets (Yellow)" /></FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Category">
              <select className="form-input">{INVENTORY_CATEGORIES.map(o => <option key={o}>{o}</option>)}</select>
            </FormField>
            <FormField label="Unit of Measurement"><Input placeholder="e.g. Units, Kg, Litres" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Initial Quantity"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Reorder Level"><Input type="number" placeholder="0" /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Unit Cost (₦)"><Input type="number" placeholder="0" /></FormField>
            <FormField label="Store Location"><Input placeholder="e.g. Store A - Shelf 2" /></FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => { setAddModal(false); showToast('Item added to inventory', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>Add Item</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
