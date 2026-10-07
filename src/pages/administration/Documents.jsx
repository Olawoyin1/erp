import React, { useState } from 'react';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiDownloadCloud, FiCheckCircle, FiXCircle, FiFile } from 'react-icons/fi';
import Drawer from '../../components/ui/Drawer';
import RowMenu from '../../components/ui/RowMenu';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import { FormField, Input, Select, Textarea, FileUpload } from '../../components/ui/FormField';
import { mockAdminDocuments } from '../../data/mockAdmin';

const statusStyle = {
  'Approved':    { bg: '#DCFCE7', color: '#15803D' },
  'Under Review':{ bg: '#FEF3C7', color: '#B45309' },
  'Draft':       { bg: '#F1F5F9', color: '#64748B' },
  'Checked Out': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Archived':    { bg: '#F1F5F9', color: '#475569' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || { bg: '#F1F5F9', color: '#64748B' };
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function Documents() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = mockAdminDocuments.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const menuItems = (doc) => {
    const items = [
      { label: 'View Details', icon: <FiEye size={14} />, action: () => setSelected(doc) },
      { label: 'Download', icon: <FiDownloadCloud size={14} />, action: () => showToast(`Downloading ${doc.id}...`) },
    ];
    if (doc.status === 'Checked Out') {
      items.push({ label: 'Check In', icon: <FiCheckCircle size={14} />, action: () => showToast(`${doc.id} checked in.`) });
    }
    if (doc.status !== 'Archived') {
      items.push({ label: 'Archive', icon: <FiXCircle size={14} />, color: '#EF4444', action: () => showToast(`${doc.id} archived.`) });
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
    { key: 'id', label: 'DOC NO', render: (val) => <span style={{ color: '#3B82F6', fontWeight: 500 }}>{val}</span> },
    { key: 'title', label: 'DOCUMENT TITLE', render: (val) => <span style={{ color: '#0F172A', fontWeight: 500, maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{val}</span> },
    { key: 'category', label: 'CATEGORY' },
    { key: 'version', label: 'VERSION' },
    { key: 'uploadedBy', label: 'UPLOADED BY', render: (val) => <span style={{ color: '#0F172A' }}>{val}</span> },
    { key: 'status', label: 'STATUS', render: (val) => <StatusPill status={val} /> },
    { key: 'lastUpdated', label: 'LAST UPDATED' },
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
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Admin Documents</h2>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: '14px' }}>Manage company policies, administrative procedures, templates, and official documents</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <Input placeholder="Search by Doc title, Category..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiFilter size={15} /> Filter
          </button>
          <button onClick={() => showToast('Exporting...')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', background: '#fff', color: '#374151', fontSize: '14px', cursor: 'pointer' }}>
            <FiDownload size={15} /> Export
          </button>
          <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', border: 'none', borderRadius: '8px', background: '#1E3A5F', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
            <FiPlus size={15} /> Upload Document
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

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.id || ''} subtitle={selected?.title}
        footer={
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button onClick={() => showToast('Downloading...')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 16px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              <FiDownloadCloud size={14} /> Download
            </button>
            <button onClick={() => { showToast('Checked out.'); setSelected(null); }} style={{ flex: 1, padding: '9px 16px', background: '#fff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              Check Out
            </button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, padding: '14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <FiFile size={20} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{selected.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>{selected.id} · {selected.category}</p>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                ['Document ID', selected.id],
                ['Version', selected.version],
                ['Uploaded By', selected.uploadedBy],
                ['Last Updated', selected.lastUpdated],
              ].map(([label, val]) => (
                <FormField key={label} label={label}>
                  <Input value={val || ''} readOnly style={{ backgroundColor: '#F8FAFC', color: '#334155' }} />
                </FormField>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload Document Drawer */}
      <Drawer isOpen={showNew} onClose={() => setShowNew(false)} title="Upload Document" subtitle="Add a new administrative document to the repository" width="500px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="DOCUMENT TITLE" required>
            <Input placeholder="e.g. Employee Handbook 2025" />
          </FormField>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="CATEGORY" required>
              <Select>
                <option>Policy</option>
                <option>Procedure</option>
                <option>Template</option>
                <option>Form</option>
                <option>Report</option>
              </Select>
            </FormField>
            <FormField label="VERSION" required>
              <Input placeholder="e.g. v1.0" />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="UPLOADED BY" required>
              <Input placeholder="Staff name..." />
            </FormField>
            <FormField label="STATUS">
              <Select>
                <option>Draft</option>
                <option>Under Review</option>
                <option>Approved</option>
              </Select>
            </FormField>
          </div>

          <FormField label="DESCRIPTION">
            <Textarea rows={3} placeholder="Brief description or notes about this document..." />
          </FormField>
          
          <FormField label="UPLOAD FILE" required>
            <FileUpload onFileSelect={() => {}} />
          </FormField>
        </div>
        <div style={{ padding: '20px 0 0 0', marginTop: 8, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => { setShowNew(false); showToast('Document uploaded successfully!'); }}>
            Upload
          </button>
        </div>
      </Drawer>

    </div>
  );
}
