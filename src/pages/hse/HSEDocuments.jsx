import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus } from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { Input } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockHSEDocuments } from '../../data/mockHSE';

const ITEMS_PER_PAGE = 10;

export default function HSEDocuments() {
  const [data] = useState(mockHSEDocuments);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.title.toLowerCase().includes(q) || item.uploadedBy.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'sn', label: 'S/N', render: (val) => <span style={{ color: '#64748B' }}>{val}</span> },
    { key: 'title', label: 'DOCUMENT TITLE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'uploadedBy', label: 'UPLOADED BY' },
    { key: 'uploadDate', label: 'UPLOAD DATE' },
    {
      key: 'actions', label: 'ACTIONS', align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
          <button onClick={() => showToast('Downloading...', 'info')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
            <FiDownload size={14} /> Download
          </button>
          <button onClick={() => showToast('Retrieving document...', 'info')} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            ✕ Retrieve
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>HSE Documents</h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Manage HSE documents for regulatory compliance and staff reference</p>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search documents..." style={{ paddingLeft: '36px', width: '100%' }} />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}><FiSearch size={15} /></div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}><FiFilter size={14} /> Filter</button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>Export <FiDownload size={14} /></button>
            <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Upload Document
            </button>
          </div>
        </div>

        <DataTable columns={columns} data={paginated} selectable selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.sn))}
          keyField="sn" emptyMessage="No HSE documents found."
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
