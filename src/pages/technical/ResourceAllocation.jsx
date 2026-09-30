import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';
import { mockResourceRequests } from '../../data/mockTechnical';

function StatusPill({ status }) {
  const colors = {
    'Issued': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Technical Reviewing': { bg: '#FEF3C7', color: '#D97706' },
    'Technical Approved': { bg: '#D1FAE5', color: '#059669' },
    'Store Reviewing': { bg: '#FEF3C7', color: '#D97706' },
    'Returned': { bg: '#F3E8FF', color: '#9333EA' },
    'Unavailable': { bg: '#FEE2E2', color: '#DC2626' },
    'Cancelled': { bg: '#F1F5F9', color: '#64748B' },
    'Rejected by Technical': { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

export default function ResourceAllocation() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;
  
  const filtered = mockResourceRequests.filter(d => !search || d.request.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const columns = [
    { key: 'id', label: 'REQUEST ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'request', label: 'REQUEST', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'project', label: 'PROJECT', render: (_, row) => <span style={{ color: '#334155' }}>Chevron Wellhead Upgrade</span> }, // Using mock directly
    { key: 'qty', label: 'QTY' },
    { key: 'requestedBy', label: 'REQUESTED BY' },
    { key: 'requestDate', label: 'REQUEST DATE' },
    { key: 'status', label: 'STATUS', render: v => <StatusPill status={v} /> },
    { key: 'actions', label: 'ACTIONS', align: 'right', render: () => (
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
        <button className="icon-btn"><FiEye size={14} /></button>
        <button className="icon-btn"><FiMoreVertical size={14} /></button>
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Resource Allocation</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage resource requests, approvals, allocations, and returns across all projects</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'TOTAL REQUESTS', value: '18', sub: 'Resources requested for this project', color: '#DBEAFE' },
          { label: 'APPROVED', value: '15', sub: 'Approved and ready for issue', color: '#D1FAE5' },
          { label: 'ISSUED', value: '12', sub: 'Currently allocated to site', color: '#F3E8FF' },
          { label: 'PENDING APPROVAL', value: '3', sub: 'Awaiting store review', color: '#FEF3C7' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>{s.label}</span>
              <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: s.color }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Project ID, Project name..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> Request Resource</button>
          </div>
        </div>
        <DataTable columns={columns} data={paginated} selectable keyField="request" emptyMessage="No resources found." />
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length/ITEMS) || 1} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
