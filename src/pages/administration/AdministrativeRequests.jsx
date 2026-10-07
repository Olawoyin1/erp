import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiCheck, FiX, FiFile, FiDownloadCloud } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea, FileUpload } from '../../components/ui/FormField';
import { mockAdminRequests } from '../../data/mockAdmin';

const urgencyStyle = {
  'Routine':  { bg: '#F1F5F9', color: '#475569' },
  'Urgent':   { bg: '#FEF3C7', color: '#B45309' },
  'Critical': { bg: '#FEE2E2', color: '#DC2626' },
};

const statusStyle = {
  'Issued':          { bg: '#DCFCE7', color: '#15803D' },
  'HOD Reviewing':   { bg: '#FEF9C3', color: '#854D0E' },
  'HOD Approved':    { bg: '#DCFCE7', color: '#15803D' },
  'Store Reviewing': { bg: '#E0E7FF', color: '#4338CA' },
  'Returned':        { bg: '#FEE2E2', color: '#DC2626' },
  'Unavailable':     { bg: '#F1F5F9', color: '#64748B' },
  'Cancelled':       { bg: '#F1F5F9', color: '#64748B' },
  'Rejected by HOD': { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

function MetaGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
      {items.map(([label, val]) => (
        <FormField key={label} label={label}>
          <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
        </FormField>
      ))}
    </div>
  );
}

export default function AdministrativeRequests() {
  const [search, setSearch] = useState('');
  const [viewRecord, setViewRecord] = useState(null);
  const [viewTab, setViewTab] = useState('details');
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockAdminRequests.filter(r =>
    r.request.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = (r) => [
    { label: 'View Details', icon: <FiEye size={14} />, action: () => { setViewRecord(r); setViewTab('details'); } },
    { label: 'Approve', icon: <FiCheck size={14} />, action: () => showToast(`Approved ${r.id}`) },
    { label: 'Reject', icon: <FiX size={14} />, color: '#EF4444', action: () => showToast(`Rejected ${r.id}`) },
  ];

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(r => r.id));
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const columns = [
    { key: 'id', label: 'REQUEST ID', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'type', label: 'REQUEST TYPE' },
    { key: 'request', label: 'REQUEST', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500 }}>{val}</span> },
    { key: 'qty', label: 'QTY' },
    { key: 'requestedBy', label: 'REQUESTED BY' },
    { key: 'date', label: 'DATE' },
    { key: 'urgency', label: 'URGENCY', render: (val) => {
      const s = urgencyStyle[val] || { bg: '#F1F5F9', color: '#64748B' };
      return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{val}</span>;
    }},
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'actions', label: 'ACTIONS', render: (_, row) => (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => { setViewRecord(row); setViewTab('details'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}><FiEye size={16} /></button>
        <RowMenu items={menuItems(row)} />
      </div>
    )},
  ];

  const canApprove = viewRecord && ['HOD Reviewing', 'Store Reviewing', 'HOD Approved'].includes(viewRecord.status);
  const tabStyle = (t) => ({
    padding: '10px 0', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
    color: viewTab === t ? '#1D4ED8' : '#64748B',
    borderBottom: viewTab === t ? '2px solid #1D4ED8' : '2px solid transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#0F172A', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Requests</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Submit and track requests for materials, equipment, or supplies from the store</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input placeholder="Search by id, request..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> New Request
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <DataTable columns={columns} data={filtered} selectable={true} selectedIds={selectedIds}
          onSelectRow={toggleSelectRow} onSelectAll={toggleSelectAll} keyField="id" />
        <Pagination currentPage={1} totalPages={8} totalItems={filtered.length} onPageChange={() => {}} />
      </div>

      {/* ── View Request Drawer ── */}
      <Drawer isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="" width="500px">
        {viewRecord && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ color: '#1D4ED8', marginTop: 2 }}>
                  <FiFile size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{viewRecord.request}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{viewRecord.requestedBy} · {viewRecord.id}</p>
                </div>
              </div>
            </div>

            {/* Status + Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Status:</span>
              <StatusPill status={viewRecord.status} />
              {canApprove && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button onClick={() => { showToast(`Approved ${viewRecord.id}`); setViewRecord(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <FiCheck size={12} /> Approve
                  </button>
                  <button onClick={() => { showToast(`Rejected ${viewRecord.id}`); setViewRecord(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    <FiX size={12} /> Reject
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E2E8F0', marginBottom: 20 }}>
              <button style={tabStyle('details')} onClick={() => setViewTab('details')}>Details</button>
              <button style={tabStyle('history')} onClick={() => setViewTab('history')}>Approval History</button>
            </div>

            {viewTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <MetaGrid items={[
                  ['Request ID', viewRecord.id],
                  ['Request', viewRecord.request],
                  ['Request Type', viewRecord.type],
                  ['Quantity', viewRecord.qty],
                  ['Requested By', viewRecord.requestedBy],
                  ['Request Date', viewRecord.date],
                  ['Urgency', viewRecord.urgency],
                  ['Status', viewRecord.status],
                ]} />
                {viewRecord.purpose && (
                  <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Purpose</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{viewRecord.purpose || 'Current stationery stock is insufficient for ongoing administrative activities.'}</p>
                  </div>
                )}
                <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Attached Documents</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiFile size={14} style={{ color: '#64748B' }} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>Office_Supplies_List.pdf (25MB)</span>
                    </div>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><FiDownloadCloud size={16} /></button>
                  </div>
                </div>
              </div>
            )}

            {viewTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Approval History</p>
                {[
                  { date: '28/05/2025 · 9:45', title: 'Request Submitted', desc: `Form submitted by ${viewRecord.requestedBy}`, color: '#1D4ED8' },
                  { date: '28/05/2025 · 9:45', title: viewRecord.status, desc: 'Waiting for reviewer', color: '#F59E0B' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: step.color, flexShrink: 0, marginTop: 4 }} />
                      {i === 0 && <div style={{ width: 1, flex: 1, background: '#E2E8F0', marginTop: 4 }} />}
                    </div>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94A3B8' }}>{step.date}</p>
                      <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{step.title}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ── New Request Drawer ── */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title="New Request" subtitle="Submit a request for review and approval" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label="REQUEST" required>
            <Input placeholder="e.g. A4 Printing Paper" />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <FormField label="REQUEST CATEGORY" required>
              <Select>
                <option>Office Supplies</option>
                <option>IT Equipment</option>
                <option>Furniture</option>
                <option>Safety Equipment</option>
              </Select>
            </FormField>
            <FormField label="QUANTITY" required>
              <Input type="number" defaultValue={0} />
            </FormField>
            <FormField label="UNIT" required>
              <Select>
                <option>Units</option>
                <option>Packs</option>
                <option>Boxes</option>
                <option>Reams</option>
              </Select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <FormField label="REQUESTED BY">
              <Input defaultValue="Nafisat Abubakar" readOnly style={{ backgroundColor: '#F8FAFC' }} />
            </FormField>
            <FormField label="REQUIRED DATE" required>
              <Input type="date" />
            </FormField>
          </div>

          <FormField label="URGENCY" required>
            <Select>
              <option>Routine</option>
              <option>Urgent</option>
              <option>Critical</option>
            </Select>
          </FormField>

          <FormField label="PURPOSE" required>
            <Textarea rows={4} placeholder="e.g. Current stationery stock is insufficient..." />
          </FormField>

          <FormField label="ATTACH DOCUMENT (OPTIONAL)">
            <FileUpload onFileSelect={() => {}} />
          </FormField>
        </div>

        <div style={{ padding: '20px 0 0 0', marginTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Request submitted successfully!'); }}>
            Submit Request
          </button>
        </div>
      </Drawer>

    </div>
  );
}
