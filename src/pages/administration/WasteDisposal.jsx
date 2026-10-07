import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { mockWasteDisposal, mockWasteStats } from '../../data/mockAdmin';

const statusStyle = {
  'Completed': { bg: '#DCFCE7', color: '#15803D' },
  'Pending':   { bg: '#FEF3C7', color: '#B45309' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function WasteDisposal() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const openEdit = (row) => {
    setEditRow(row);
    setEditForm({ ...row });
  };

  const handleSaveEdit = () => {
    showToast(`Log ${editForm.id} updated successfully.`);
    setEditRow(null);
  };

  const filtered = mockWasteDisposal.filter(r =>
    r.description.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { label: 'TOTAL WASTE GENERATED', value: mockWasteStats.totalGenerated, sub: '+8% via last month', icon: '🗑️' },
    { label: 'WASTE DISPOSED',         value: mockWasteStats.totalDisposed,  sub: '81% Disposal Rate',            icon: '♻️' },
    { label: 'AWAITING MANIFEST CERTS',value: `${mockWasteStats.awaitingManifest} Records`, sub: 'Action required for compliance', icon: '📋' },
    { label: 'COMPLIANCE RATE',        value: mockWasteStats.complianceRate, sub: 'Target: 100% compliance',       icon: '✅' },
  ];

  const menuItems = (r) => [
    { label: 'View Details',      icon: <FiEye size={14} />,   action: () => setSelected(r) },
    { label: 'Edit Log',          icon: <FiEdit2 size={14} />, action: () => openEdit(r) },
    { label: 'Mark as Completed', icon: <FiCheck size={14} />, action: () => showToast(`Marked ${r.id} as Completed`) },
  ];

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const columns = [
    { key: 'id',          label: 'DISPOSAL ID',  render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'description', label: 'DESCRIPTION',  render: (val) => <span style={{ color: '#0F172A', maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span> },
    { key: 'type',        label: 'TYPE' },
    { key: 'qty',         label: 'QTY' },
    { key: 'method',      label: 'METHOD' },
    { key: 'date',        label: 'DATE' },
    { key: 'disposedBy',  label: 'DISPOSED BY',  render: (val) => <span style={{ color: '#0F172A' }}>{val}</span> },
    { key: 'vendor',      label: 'VENDOR' },
    { key: 'status',      label: 'STATUS',        render: (val) => <StatusPill status={val} /> },
    { key: 'actions',     label: 'ACTIONS',       render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Waste &amp; Disposal</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Manage waste generation, disposal records, and compliance certificates</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statCards.map((s) => (
          <div key={s.label} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: '20px' }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input placeholder="Search disposals..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => openEdit({ id: '', description: '', type: '', qty: '', method: '', date: '', disposedBy: '', vendor: '', status: 'Pending' })}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> Log Disposal
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable
          columns={columns}
          data={filtered}
          selectable={true}
          selectedIds={selectedIds}
          onSelectRow={toggleSelectRow}
          onSelectAll={toggleSelectAll}
          keyField="id"
        />
        <Pagination currentPage={1} totalPages={8} totalItems={filtered.length} onPageChange={() => {}} />
      </div>

      {/* ── View Details Drawer ── */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id || ''}
        subtitle={selected?.description}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => openEdit(selected)} style={{ flex: 1, padding: '9px 16px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <FiEdit2 size={13} /> Edit Log
            </button>
            <button onClick={() => { showToast('Marked as Completed!'); setSelected(null); }} style={{ flex: 1, padding: '9px 16px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <FiCheck size={13} /> Mark Completed
            </button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <FiTrash2 size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.description}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · {selected.type}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Disposal ID', selected.id],
                ['Type', selected.type],
                ['Quantity', selected.qty],
                ['Method', selected.method],
                ['Date', selected.date],
                ['Disposed By', selected.disposedBy],
                ['Vendor', selected.vendor],
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* ── Edit Log / Log Disposal Drawer ── */}
      <Drawer
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title={editForm.id ? `Edit Log — ${editForm.id}` : 'Log New Disposal'}
        subtitle="Update the disposal record details below"
        width="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="DESCRIPTION" required>
            <Textarea
              rows={2}
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the waste disposed..."
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="WASTE TYPE" required>
              <Select
                value={editForm.type}
                onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
              >
                <option>Hazardous</option>
                <option>Non-Hazardous</option>
                <option>Recyclable</option>
                <option>Electronic</option>
                <option>Medical</option>
                <option>Chemical</option>
              </Select>
            </FormField>
            <FormField label="DISPOSAL METHOD" required>
              <Select
                value={editForm.method}
                onChange={e => setEditForm(f => ({ ...f, method: e.target.value }))}
              >
                <option>Incineration</option>
                <option>Landfill</option>
                <option>Recycling</option>
                <option>Treatment</option>
                <option>Composting</option>
                <option>Third-party Vendor</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="QUANTITY" required>
              <Input
                value={editForm.qty}
                onChange={e => setEditForm(f => ({ ...f, qty: e.target.value }))}
                placeholder="e.g. 120 kg"
              />
            </FormField>
            <FormField label="DATE" required>
              <Input
                type="date"
                value={editForm.date}
                onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="DISPOSED BY" required>
              <Input
                value={editForm.disposedBy}
                onChange={e => setEditForm(f => ({ ...f, disposedBy: e.target.value }))}
                placeholder="Staff name..."
              />
            </FormField>
            <FormField label="VENDOR">
              <Input
                value={editForm.vendor}
                onChange={e => setEditForm(f => ({ ...f, vendor: e.target.value }))}
                placeholder="Vendor name..."
              />
            </FormField>
          </div>

          <FormField label="STATUS" required>
            <Select
              value={editForm.status}
              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
            >
              <option>Pending</option>
              <option>Completed</option>
            </Select>
          </FormField>
        </div>

        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setEditRow(null)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={handleSaveEdit}>
            Save Changes
          </button>
        </div>
      </Drawer>

    </div>
  );
}
