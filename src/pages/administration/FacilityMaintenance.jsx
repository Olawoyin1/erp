import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheck, FiEdit2, FiTool, FiX } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { mockFacilityMaintenance } from '../../data/mockAdmin';

const typeStyle = {
  'Preventive': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Corrective': { bg: '#FEF3C7', color: '#B45309' },
};

const statusStyle = {
  'Scheduled':  { bg: '#EFF6FF', color: '#1D4ED8' },
  'In Progress':{ bg: '#FEF9C3', color: '#854D0E' },
  'Completed':  { bg: '#DCFCE7', color: '#15803D' },
  'Overdue':    { bg: '#FEE2E2', color: '#DC2626' },
  'Cancelled':  { bg: '#F1F5F9', color: '#64748B' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function FacilityMaintenance() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockFacilityMaintenance.filter(r =>
    r.facility.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = (r) => [
    { label: 'View Details', icon: <FiEye size={14} />, action: () => setSelected(r) },
    { label: 'Edit Schedule', icon: <FiEdit2 size={14} />, action: () => showToast(`Edit schedule for ${r.id}`) },
    { label: 'Mark Completed', icon: <FiCheck size={14} />, action: () => showToast(`Marked ${r.id} as Completed`) },
    { label: 'Cancel', icon: <FiX size={14} />, color: '#EF4444', action: () => showToast(`Cancelled ${r.id}`) },
  ];

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const columns = [
    { key: 'id', label: 'MAINTENANCE ID', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'facility', label: 'FACILITY/ASSET', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500 }}>{val}</span> },
    { key: 'type', label: 'TYPE', render: (val) => <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: typeStyle[val]?.bg, color: typeStyle[val]?.color, whiteSpace: 'nowrap' }}>{val}</span> },
    { key: 'description', label: 'DESCRIPTION', render: (val) => <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span> },
    { key: 'assignedTo', label: 'ASSIGNED TO', render: (val) => <span style={{ color: '#0F172A' }}>{val}</span> },
    { key: 'frequency', label: 'FREQUENCY' },
    { key: 'dueDate', label: 'DUE DATE' },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    ) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Facility Maintenance</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Planned and active facility maintenance jobs</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input
            placeholder="Search by id, facility, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => showToast('Schedule maintenance...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> Schedule Maintenance
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
        <Pagination
          currentPage={1}
          totalPages={8}
          totalItems={filtered.length}
          onPageChange={() => {}}
        />
      </div>

      {/* View Maintenance Drawer */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle={selected?.facility}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => { showToast('Marked as Completed!'); setSelected(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <FiCheck size={14} /> Mark Completed
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
              <FiTool size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.description}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · {selected.facility}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Maintenance ID', selected.id],
                ['Facility / Asset', selected.facility],
                ['Assigned To', selected.assignedTo],
                ['Frequency', selected.frequency],
                ['Due Date', selected.dueDate],
                ['Type', selected.type],
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* New Maintenance Schedule Drawer */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title="Schedule Maintenance" subtitle="Log a new maintenance task for a facility or asset" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="DESCRIPTION" required>
            <Input placeholder="e.g. Generator monthly service" />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="FACILITY / ASSET" required>
              <Input placeholder="e.g. Generator — Block A" />
            </FormField>
            <FormField label="TYPE" required>
              <Select>
                <option>Preventive</option>
                <option>Corrective</option>
                <option>Predictive</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="ASSIGNED TO" required>
              <Input placeholder="Staff name..." />
            </FormField>
            <FormField label="FREQUENCY">
              <Select>
                <option>One-time</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annually</option>
              </Select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="DUE DATE" required>
              <Input type="date" />
            </FormField>
            <FormField label="STATUS">
              <Select>
                <option>Scheduled</option>
                <option>In Progress</option>
                <option>Completed</option>
              </Select>
            </FormField>
          </div>
          <FormField label="NOTES">
            <Textarea rows={3} placeholder="Additional notes or instructions..." />
          </FormField>
        </div>
        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Maintenance task scheduled!'); }}>
            Save Schedule
          </button>
        </div>
      </Drawer>
    </div>
  );
}
