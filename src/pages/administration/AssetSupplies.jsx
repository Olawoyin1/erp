import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheckCircle, FiEdit2, FiTrash2, FiBox } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { mockFixedAssets, mockOfficeSupplies } from '../../data/mockAdmin';

const conditionColor = { 'Good': '#15803D', 'Fair': '#B45309', 'Poor': '#DC2626', 'Excellent': '#2563EB' };
const conditionBg    = { 'Good': '#DCFCE7', 'Fair': '#FEF3C7', 'Poor': '#FEE2E2', 'Excellent': '#EFF6FF' };

const assetStatusStyle = {
  'Active':        { bg: '#DCFCE7', color: '#15803D' },
  'In Maintenance':{ bg: '#EFF6FF', color: '#1D4ED8' },
  'On Loan':       { bg: '#FEF9C3', color: '#854D0E' },
  'Retired':       { bg: '#F1F5F9', color: '#64748B' },
  'In Stock':      { bg: '#DCFCE7', color: '#15803D' },
  'Low Stock':     { bg: '#FEF3C7', color: '#B45309' },
  'Out of Stock':  { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusPill({ status }) {
  const s = assetStatusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function AssetSupplies() {
  const [tab, setTab] = useState('fixed');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const tabStyle = (t) => ({
    padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
    color: tab === t ? '#1D4ED8' : '#64748B',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
  });

  const menuItems = (item) => [
    { label: 'View Details', icon: <FiEye size={14} />, action: () => setSelected(item) },
    { label: 'Edit', icon: <FiEdit2 size={14} />, action: () => showToast(`Edit ${item.id}...`) },
    { label: 'Retire/Delete', icon: <FiTrash2 size={14} />, color: '#EF4444', action: () => showToast(`Deleted ${item.id}.`) },
  ];

  const data = tab === 'fixed' ? mockFixedAssets : mockOfficeSupplies;
  const filtered = data.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const fixedCols = [
    { key: 'id', label: 'ASSET TAG', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'name', label: 'ASSET NAME', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500 }}>{val}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'custodian', label: 'CUSTODIAN' },
    { key: 'location', label: 'LOCATION' },
    { key: 'condition', label: 'CONDITION', render: (val) => <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 600, background: conditionBg[val] || '#F1F5F9', color: conditionColor[val] || '#64748B' }}>{val}</span> },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    ) },
  ];

  const supplyCols = [
    { key: 'id', label: 'ITEM CODE', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'name', label: 'ITEM NAME', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500 }}>{val}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'unit', label: 'UNIT' },
    { key: 'qty', label: 'QTY', render: (val) => <span style={{ color: '#0F172A', fontWeight: 600 }}>{val}</span> },
    { key: 'reorderLevel', label: 'REORDER LEVEL', render: (val, row) => <span style={{ color: row.qty <= row.reorderLevel ? '#DC2626' : '#64748B', fontWeight: row.qty <= row.reorderLevel ? 700 : 400 }}>{val}</span> },
    { key: 'location', label: 'LOCATION' },
    { key: 'lastRestocked', label: 'LAST RESTOCKED' },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Assets & Supplies</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Track fixed assets and office supplies across all PGSL locations</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', gap: '0' }}>
        <button style={tabStyle('fixed')} onClick={() => { setTab('fixed'); setSelectedIds([]); }}>Fixed Assets</button>
        <button style={tabStyle('supplies')} onClick={() => { setTab('supplies'); setSelectedIds([]); }}>Office Supplies</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input
            placeholder={tab === 'fixed' ? 'Search by tag, name, custodian...' : 'Search by code, name...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting data...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> {tab === 'fixed' ? 'Register Asset' : 'Add Item'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={tab === 'fixed' ? fixedCols : supplyCols}
          data={filtered}
          selectable={true}
          selectedIds={selectedIds}
          onSelectRow={toggleSelectRow}
          onSelectAll={toggleSelectAll}
          keyField="id"
        />
        <Pagination
          currentPage={1}
          totalPages={8}
          totalItems={filtered.length}
          onPageChange={() => {}}
        />
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle={selected?.name}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => { showToast('Saved.'); setSelected(null); }} style={{ flex: 1, padding: '9px 16px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Save Details
            </button>
            <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '9px 16px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Close
            </button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <FiBox size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · {selected.category}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Item ID', selected.id],
                ['Category', selected.category],
                ['Location', selected.location],
                ...(tab === 'fixed' ? [
                  ['Custodian', selected.custodian],
                  ['Condition', selected.condition],
                ] : [
                  ['Unit', selected.unit],
                  ['Quantity', selected.qty],
                  ['Reorder Level', selected.reorderLevel],
                  ['Last Restocked', selected.lastRestocked],
                ])
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Item Drawer */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title={tab === 'fixed' ? 'Register Asset' : 'Add Item'} subtitle={tab === 'fixed' ? 'Add a new fixed asset to the registry' : 'Add a new office supply item to inventory'} width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label={tab === 'fixed' ? 'ASSET NAME' : 'ITEM NAME'} required>
            <Input placeholder={tab === 'fixed' ? 'e.g. Dell Latitude 7420' : 'e.g. A4 Printer Paper'} />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="CATEGORY" required>
              <Select>
                {tab === 'fixed' ? (
                  <>
                    <option>IT Equipment</option>
                    <option>Furniture</option>
                    <option>Vehicles</option>
                    <option>Machinery</option>
                  </>
                ) : (
                  <>
                    <option>Stationery</option>
                    <option>Cleaning</option>
                    <option>Pantry</option>
                    <option>IT Peripherals</option>
                  </>
                )}
              </Select>
            </FormField>
            <FormField label="LOCATION" required>
              <Input placeholder="e.g. HQ - Floor 3" />
            </FormField>
          </div>

          {tab === 'fixed' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="CUSTODIAN">
                <Input placeholder="Staff name..." />
              </FormField>
              <FormField label="CONDITION" required>
                <Select>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </Select>
              </FormField>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="QUANTITY" required>
                <Input type="number" placeholder="e.g. 50" />
              </FormField>
              <FormField label="UNIT">
                <Input placeholder="e.g. Reams, Boxes, Units" />
              </FormField>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {tab === 'fixed' ? (
              <FormField label="PURCHASE DATE">
                <Input type="date" />
              </FormField>
            ) : (
              <FormField label="REORDER LEVEL">
                <Input type="number" placeholder="e.g. 10" />
              </FormField>
            )}
            <FormField label="STATUS">
              <Select>
                {tab === 'fixed' ? (
                  <>
                    <option>Active</option>
                    <option>In Maintenance</option>
                    <option>On Loan</option>
                    <option>Retired</option>
                  </>
                ) : (
                  <>
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Out of Stock</option>
                  </>
                )}
              </Select>
            </FormField>
          </div>

          <FormField label="NOTES">
            <Textarea rows={3} placeholder="Any additional information..." />
          </FormField>
        </div>
        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Added successfully!'); }}>
            Save Item
          </button>
        </div>
      </Drawer>

    </div>
  );
}
