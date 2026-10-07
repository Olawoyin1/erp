import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheck, FiX, FiRefreshCw, FiEdit2, FiBriefcase } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea } from '../../components/ui/FormField';
import { mockTravelRequests } from '../../data/mockAdmin';

const statusStyle = {
  'Approved': { bg: '#DCFCE7', color: '#15803D' },
  'Pending':  { bg: '#FEF3C7', color: '#B45309' },
  'Rejected': { bg: '#FEE2E2', color: '#DC2626' },
  'Draft':    { bg: '#F1F5F9', color: '#64748B' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function TravelsLogistics() {
  const [tab, setTab] = useState('requests');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockTravelRequests.filter(r =>
    r.traveler.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const tabStyle = (t) => ({
    padding: '10px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
    color: tab === t ? '#1D4ED8' : '#64748B',
    borderBottom: tab === t ? '2px solid #1D4ED8' : '2px solid transparent',
  });

  const menuItems = (r) => {
    let items = [
      { label: 'View Details', icon: <FiEye size={14} />, action: () => setSelected(r) },
    ];
    if (r.status === 'Draft' || r.status === 'Pending') {
      items.push({ label: 'Edit Request', icon: <FiEdit2 size={14} />, action: () => showToast(`Edit ${r.id}`) });
    }
    if (r.status === 'Pending') {
      items.push({ label: 'Approve Request', icon: <FiCheck size={14} />, action: () => showToast(`Approved ${r.id}`) });
      items.push({ label: 'Reject Request', icon: <FiX size={14} />, color: '#EF4444', action: () => showToast(`Rejected ${r.id}`) });
    }
    return items;
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const columns = [
    { key: 'id', label: 'REQUEST ID', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'traveler', label: 'TRAVELER', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500 }}>{val}</span> },
    { key: 'from', label: 'FROM' },
    { key: 'to', label: 'TO', render: (val) => <span style={{ maxWidth: 140, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span> },
    { key: 'departure', label: 'DEPARTURE' },
    { key: 'returnDate', label: 'RETURN', render: (val, row) => <span style={{ color: row.status === 'Pending' ? '#3B82F6' : '#64748B', fontWeight: row.status === 'Pending' ? 600 : 400 }}>{val}</span> },
    { key: 'mode', label: 'MODE' },
    { key: 'accommodation', label: 'ACCOM.' },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setSelected(row)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        {row.status !== 'Approved' && <RowMenu items={menuItems(row)} />}
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

      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Travel & Logistics</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Track travel, movements and allowances</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        <button style={tabStyle('requests')} onClick={() => { setTab('requests'); setSelectedIds([]); }}>Travel Requests</button>
        <button style={tabStyle('equipment')} onClick={() => { setTab('equipment'); setSelectedIds([]); }}>Equipment Movement</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input placeholder="Search by Id, traveler, destination..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> New Travel Request
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

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle="Travel Request Details"
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            {selected?.status === 'Pending' && (
              <>
                <button onClick={() => { showToast('Approved!'); setSelected(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <FiCheck size={14} /> Approve
                </button>
                <button onClick={() => { showToast('Rejected.'); setSelected(null); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  <FiX size={14} /> Reject
                </button>
              </>
            )}
            {selected?.status !== 'Pending' && (
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '9px 16px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                Close
              </button>
            )}
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <FiBriefcase size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.from} → {selected.to}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · {selected.traveler}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Request ID', selected.id],
                ['Traveler', selected.traveler],
                ['From', selected.from],
                ['To', selected.to],
                ['Departure', selected.departure],
                ['Return', selected.returnDate],
                ['Mode of Travel', selected.mode],
                ['Accommodation', selected.accommodation],
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* New Travel Request Drawer */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title="New Travel Request" subtitle="Submit a request for upcoming travel and logistics" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="TRAVELER" required>
            <Select>
              <option>Nafisat Abubakar</option>
              <option>Emeka Okafor</option>
              <option>Tunde Bakare</option>
              <option>Aisha Mohammed</option>
            </Select>
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="FROM (ORIGIN)" required>
              <Input placeholder="e.g. Lagos HQ" />
            </FormField>
            <FormField label="TO (DESTINATION)" required>
              <Input placeholder="e.g. Abuja Office" />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="DEPARTURE DATE" required>
              <Input type="date" />
            </FormField>
            <FormField label="RETURN DATE" required>
              <Input type="date" />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="MODE OF TRAVEL" required>
              <Select>
                <option>Flight</option>
                <option>Company Vehicle</option>
                <option>Train</option>
                <option>Personal Vehicle</option>
              </Select>
            </FormField>
            <FormField label="ACCOMMODATION">
              <Select>
                <option>Company Guesthouse</option>
                <option>Hotel</option>
                <option>Not Required</option>
              </Select>
            </FormField>
          </div>

          <FormField label="PURPOSE OF TRAVEL">
            <Textarea rows={3} placeholder="Provide details on why this travel is necessary..." />
          </FormField>
        </div>
        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Travel request submitted!'); }}>
            Submit Request
          </button>
        </div>
      </Drawer>

    </div>
  );
}
