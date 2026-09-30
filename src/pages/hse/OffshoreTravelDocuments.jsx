import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiAlertTriangle } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockOffshoreTravel } from '../../data/mockHSE';

const ITEMS_PER_PAGE = 10;

export default function OffshoreTravelDocuments() {
  const [data] = useState(mockOffshoreTravel);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.employee.toLowerCase().includes(q) || item.department.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'sn', label: 'S/N', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'employee', label: 'EMPLOYEE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'department', label: 'DEPARTMENT' },
    { key: 'documentType', label: 'DOCUMENT TYPE' },
    { key: 'issuingBody', label: 'ISSUING BODY', render: (val) => <span style={{ color: '#3B82F6' }}>{val}</span> },
    { key: 'issueDate', label: 'ISSUE DATE' },
    { key: 'expiry', label: 'EXPIRY' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View"><FiEye size={15} /></button>
          <button className="icon-btn" title="Download"><FiDownload size={15} /></button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Off-Shore Travel Documents</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage and monitor personnel documents required for offshore travel and mobilisation
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertTriangle size={16} color="#EA580C" />
          <span style={{ fontSize: '0.875rem', color: '#92400E' }}>
            3 Off-Shore Travel certificates have expired. Affected staff must not be mobilised until certificates are renewed.
          </span>
        </div>
        <button style={{ fontSize: '0.875rem', color: '#EA580C', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          View Expired →
        </button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search Certificate No, Employee..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Add Travel Document
            </button>
          </div>
        </div>

        <DataTable
          columns={columns} data={paginated} selectable selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.sn))}
          keyField="sn" emptyMessage="No travel documents found."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
