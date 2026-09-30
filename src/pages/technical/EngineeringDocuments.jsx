import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';

const mockDocs = [
  { id: 'ED-001', project: 'Chevron Wellhead Upgrade', title: 'Method Statement — Pipe Welding', category: 'Method Statement', preparedBy: 'Chinonso Okafor', version: 'V1.0', lastUpdated: '28/05/25', status: 'Pending' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Site Visit Report — Week 29', category: 'Site Visit Report', preparedBy: 'Fatima Ibrahim', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', project: 'TotalEnergies Earthing Installation', title: 'Progress Report — July', category: 'Progress Report', preparedBy: 'Emmanuel Eze', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Structural Drawing — Rev B', category: 'Drawing', preparedBy: 'Zainab Mohammed', version: 'V1.0', lastUpdated: '28/05/25', status: 'Sent to Client' },
  { id: 'ED-001', project: 'SPDC Pipeline Upgrade', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Adeola Olatunji', version: 'V1.0', lastUpdated: '28/05/25', status: 'Under Review' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Tunde Bakare', version: 'V1.0', lastUpdated: '28/05/25', status: 'Checked' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Amaka Ugochukwu', version: 'V1.0', lastUpdated: '28/05/25', status: 'Pending' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Damilola Adebayo', version: 'V1.0', lastUpdated: '28/05/25', status: 'Approved' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Chidera Nwosu', version: 'V1.0', lastUpdated: '28/05/25', status: 'Returned' },
  { id: 'ED-001', project: 'NLNG Gas Pipeline Maintenance', title: 'Inspection Checklist — Foundation', category: 'Technical Specification', preparedBy: 'Ijeoma Chukwuma', version: 'V1.0', lastUpdated: '28/05/25', status: 'Rejected' },
];

function StatusPill({ status }) {
  const colors = {
    'Pending': { bg: '#FEF3C7', color: '#D97706' },
    'Approved': { bg: '#D1FAE5', color: '#059669' },
    'Sent to Client': { bg: '#EDE9FE', color: '#7C3AED' },
    'Under Review': { bg: '#DBEAFE', color: '#1D4ED8' },
    'Checked': { bg: '#F3E8FF', color: '#9333EA' },
    'Returned': { bg: '#FEF3C7', color: '#D97706' },
    'Rejected': { bg: '#FEE2E2', color: '#DC2626' },
  };
  const c = colors[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ backgroundColor: c.bg, color: c.color, padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>{status}</span>;
}

export default function EngineeringDocuments() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS = 10;
  
  const filtered = mockDocs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.project.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * ITEMS, currentPage * ITEMS);

  const columns = [
    { key: 'id', label: 'DOCUMENT ID', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'project', label: 'PROJECT', render: v => <span style={{ color: '#334155' }}>{v}</span> },
    { key: 'title', label: 'DOCUMENT TITLE', render: v => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span> },
    { key: 'category', label: 'CATEGORY', render: v => <span style={{ color: '#64748B' }}>{v}</span> },
    { key: 'preparedBy', label: 'PREPARED BY' },
    { key: 'version', label: 'VERSION' },
    { key: 'lastUpdated', label: 'LAST UPDATED' },
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Engineering Documents</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage engineering documents, reviews, approvals, and revisions across all projects</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'TOTAL DOCUMENTS', value: '286', sub: 'Across all projects', color: '#DBEAFE' },
          { label: 'APPROVED DOCUMENTS', value: '214', sub: 'Ready for use', color: '#D1FAE5' },
          { label: 'UNDER REVIEW', value: '6', sub: 'Awaiting review', color: '#F3E8FF' },
          { label: 'PENDING DOCUMENTS', value: '482M / ₦615M', sub: 'Awaiting approval', color: '#FEF3C7' }, // Using screenshot data literally
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
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Doc title, Category..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}><FiPlus size={14} /> New Document</button>
          </div>
        </div>
        <DataTable columns={columns} data={paginated} selectable keyField="title" emptyMessage="No documents found." />
        <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length/ITEMS)} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
