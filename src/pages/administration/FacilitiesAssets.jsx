import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiTool, FiMapPin, FiBox, FiCheckCircle, FiAlertTriangle,
  FiEdit2, FiTrash2, FiGrid, FiList,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import { Input, FormField, Select, Textarea } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockAssets, mockFacilities } from '../../data/mockAdmin';

const ITEMS_PER_PAGE = 10;

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
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
              {item.icon} {item.label}
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
      <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>{sub}</div>}
      </div>
    </div>
  );
}

function AssetDetailDrawer({ asset, onClose }) {
  if (!asset) return null;
  const conditionColor = { Excellent: '#16A34A', Good: '#1D4ED8', Fair: '#D97706', Poor: '#DC2626' };
  return (
    <Drawer isOpen={!!asset} onClose={onClose} title="Asset Details" size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '20px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{asset.name}</div>
            <Badge status={asset.status === 'In Use' ? 'Active' : asset.status === 'Available' ? 'Current' : 'Pending'} text={asset.status} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{asset.id}</div>
        </div>

        {[
          { label: 'Category', value: asset.category },
          { label: 'Location', value: asset.location, icon: <FiMapPin size={13} /> },
          { label: 'Assigned To', value: asset.assignedTo },
          { label: 'Purchase Date', value: asset.purchaseDate },
          { label: 'Condition', value: asset.condition, color: conditionColor[asset.condition] },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '0.85rem', color: color || '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {icon}{value}
            </span>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '9px', fontWeight: 600 }}>
            Request Maintenance
          </button>
          <button className="btn btn-primary" style={{ flex: 1, padding: '9px', backgroundColor: '#1D4ED8', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
            Edit Asset
          </button>
        </div>
      </div>
    </Drawer>
  );
}

export default function FacilitiesAssets() {
  const [activeTab, setActiveTab] = useState('assets');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const tabs = [
    { key: 'assets', label: 'Asset Register', icon: <FiBox size={15} /> },
    { key: 'facilities', label: 'Facilities', icon: <FiGrid size={15} /> },
  ];

  const data = activeTab === 'assets' ? mockAssets : mockFacilities;
  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return !q || JSON.stringify(item).toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const assetColumns = [
    { key: 'id', label: 'ASSET ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'name', label: 'ASSET NAME', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'location', label: 'LOCATION', render: v => <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiMapPin size={12} style={{ color: '#94A3B8' }} />{v}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO' },
    { key: 'purchaseDate', label: 'PURCHASE DATE' },
    {
      key: 'condition', label: 'CONDITION',
      render: v => {
        const colors = { Excellent: '#16A34A', Good: '#2563EB', Fair: '#D97706', Poor: '#DC2626' };
        return <span style={{ color: colors[v] || '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{v}</span>;
      }
    },
    {
      key: 'status', label: 'STATUS',
      render: v => <Badge status={v === 'In Use' ? 'Active' : v === 'Available' ? 'Current' : 'Pending'} text={v} />
    },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View" onClick={() => setSelectedAsset(row)}><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Edit Asset', icon: <FiEdit2 size={13} />, action: () => showToast('Edit mode', 'info') },
            { label: 'Request Maintenance', icon: <FiTool size={13} />, action: () => showToast('Maintenance request logged', 'success') },
            { label: 'Decommission', icon: <FiTrash2 size={13} />, color: '#DC2626', action: () => showToast('Asset decommissioned', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const facilityColumns = [
    { key: 'id', label: 'FAC ID', render: v => <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</span> },
    { key: 'name', label: 'FACILITY NAME', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'type', label: 'TYPE' },
    {
      key: 'capacity', label: 'CAPACITY',
      render: v => v ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{v} persons</span> : <span style={{ color: '#94A3B8' }}>N/A</span>
    },
    { key: 'manager', label: 'MANAGED BY' },
    { key: 'lastInspection', label: 'LAST INSPECTION' },
    { key: 'nextInspection', label: 'NEXT INSPECTION' },
    { key: 'status', label: 'STATUS', render: v => <Badge status={v === 'Operational' ? 'Active' : 'Pending'} text={v} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View"><FiEye size={15} /></button>
          <RowMenu items={[
            { label: 'Schedule Inspection', icon: <FiCheckCircle size={13} />, action: () => showToast('Inspection scheduled', 'success') },
            { label: 'Log Issue', icon: <FiAlertTriangle size={13} />, color: '#D97706', action: () => showToast('Issue logged', 'success') },
          ]} />
        </div>
      )
    },
  ];

  const inUse = mockAssets.filter(a => a.status === 'In Use').length;
  const maintenance = mockAssets.filter(a => a.status === 'Under Maintenance').length;
  const available = mockAssets.filter(a => a.status === 'Available').length;
  const operational = mockFacilities.filter(f => f.status === 'Operational').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <AssetDetailDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Facilities & Assets</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track company assets, manage facilities, and schedule maintenance activities
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FiDownload size={14} /> Export
          </button>
          <button onClick={() => setAddModal(true)}
            className="btn btn-primary"
            style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
            <FiPlus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard icon={<FiBox size={20} />} label="Total Assets" value={mockAssets.length} sub="Registered assets" accent="#1D4ED8" />
        <StatCard icon={<FiCheckCircle size={20} />} label="In Use" value={inUse} sub="Currently deployed" accent="#16A34A" />
        <StatCard icon={<FiTool size={20} />} label="Under Maintenance" value={maintenance} sub="Being serviced" accent="#D97706" />
        <StatCard icon={<FiMapPin size={20} />} label="Facilities" value={`${operational}/${mockFacilities.length}`} sub="Operational" accent="#7C3AED" />
      </div>

      {/* Tab + Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); setPage(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', fontSize: '0.85rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab.key ? '2px solid #1D4ED8' : '2px solid transparent', color: activeTab === tab.key ? '#1D4ED8' : '#64748B', marginBottom: '-1px', transition: 'all 150ms ease' }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="table-toolbar">
            <div className="table-toolbar-search" style={{ position: 'relative' }}>
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeTab}...`} style={{ paddingLeft: '36px', width: '100%' }} />
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
            </div>
            <div className="table-toolbar-actions">
              <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
                <FiFilter size={14} /> Filter
              </button>
            </div>
          </div>

          <DataTable
            columns={activeTab === 'assets' ? assetColumns : facilityColumns}
            data={paginated}
            selectable selectedIds={selectedIds}
            onSelectRow={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id"
            emptyMessage="No records found."
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Add Asset Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Register New Asset" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="Asset Name">
            <Input placeholder="e.g. Dell OptiPlex 7090 Desktop" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Category">
              <select className="form-input">
                {['IT Equipment', 'Furniture', 'Electrical', 'HVAC', 'AV Equipment', 'Safety Equipment', 'Appliances', 'Security', 'Other'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
            <FormField label="Condition">
              <select className="form-input">
                {['Excellent', 'Good', 'Fair', 'Poor'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="Location">
            <Input placeholder="e.g. Admin Block – Office 12" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Assigned To">
              <Input placeholder="Person or department" />
            </FormField>
            <FormField label="Purchase Date">
              <Input type="date" />
            </FormField>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setAddModal(false)}>Cancel</button>
            <button className="btn btn-primary"
              onClick={() => { setAddModal(false); showToast('Asset registered successfully', 'success'); }}
              style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 600 }}>
              Register Asset
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
