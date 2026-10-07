import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical, FiEdit2, FiCheck, FiX, FiArchive, FiRefreshCw, FiUnlock, FiFileText } from 'react-icons/fi';
import DataTable from '../../../components/ui/DataTable';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Drawer from '../../../components/ui/Drawer';
import Modal from '../../../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../../../components/ui/FormField';
import Toast, { useToast } from '../../../components/ui/Toast';
import { mockDocuments } from '../../../data/mockDocuments';

const ITEMS_PER_PAGE = 10;

function RowMenu({ row, onAction }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAction = (actionName) => {
    onAction(actionName);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px'
        }}>
          {row.status === 'Draft' && (
            <>
              <div onClick={() => handleAction('Edit')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiEdit2 size={13} /> Edit File
              </div>
              <div onClick={() => handleAction('Submit')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiUpload size={13} /> Submit for Review
              </div>
            </>
          )}
          {row.status === 'Under Review' && (
            <>
              <div onClick={() => handleAction('Approve')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiCheck size={13} /> Approve File
              </div>
              <div onClick={() => handleAction('Reject')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiX size={13} /> Reject File
              </div>
            </>
          )}
          {row.status === 'Approved' && (
            <>
              <div onClick={() => handleAction('Download')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiDownload size={13} /> Download File
              </div>
              <div onClick={() => handleAction('Checkout')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiUnlock size={13} /> Check-Out File
              </div>
              <div onClick={() => handleAction('Archive')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiArchive size={13} /> Archive File
              </div>
            </>
          )}
          {row.status === 'Checked Out' && (
            <>
              <div onClick={() => handleAction('Download')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiDownload size={13} /> Download File
              </div>
              <div onClick={() => handleAction('UploadNew')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <FiUpload size={13} /> Upload New Version
              </div>
            </>
          )}
          {row.status === 'Archived' && (
            <div onClick={() => handleAction('Restore')} className="menu-item-hover" style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <FiRefreshCw size={13} /> Restore File
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HRDocuments() {
  const [data, setData] = useState(mockDocuments);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewDoc, setViewDoc] = useState(null);
  
  const [modalMode, setModalMode] = useState(null);
  const [modalDoc, setModalDoc] = useState(null);

  const { toast, showToast, hideToast } = useToast();

  const handleAction = (action, doc) => {
    if (action === 'Edit') { setModalMode('edit'); setModalDoc(doc); return; }
    if (action === 'UploadNew') { setModalMode('replace'); setModalDoc(doc); return; }

    let newStatus = doc.status;
    if (action === 'Submit') newStatus = 'Under Review';
    if (action === 'Approve') newStatus = 'Approved';
    if (action === 'Reject') newStatus = 'Draft';
    if (action === 'Archive') newStatus = 'Archived';
    if (action === 'Restore') newStatus = 'Draft';
    if (action === 'Checkout') newStatus = 'Checked Out';
    
    if (['Download'].includes(action)) {
      showToast(`${action} action triggered for ${doc.id}`, 'info');
      return;
    }

    if (newStatus !== doc.status) {
      setData(prev => prev.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
      showToast(`Document status updated to ${newStatus}`, 'success');
    }
  };

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return !q || item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const columns = [
    { key: 'id', label: 'DOC NO' },
    { key: 'title', label: 'DOCUMENT TITLE', render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span> },
    { key: 'category', label: 'CATEGORY', render: (val) => <span style={{ color: '#3B82F6' }}>{val}</span> },
    { key: 'version', label: 'VERSION' },
    { key: 'uploadedBy', label: 'UPLOADED BY' },
    { key: 'status', label: 'STATUS', render: (val) => <Badge status={val} /> },
    { key: 'lastUpdated', label: 'LAST UPDATED' },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" title="View Details" onClick={() => setViewDoc(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu row={row} onAction={(action) => handleAction(action, row)} />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>HR Documents</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Access and manage HR forms used for employee and workforce processes
          </p>
        </div>
        <button onClick={() => { setModalMode('upload'); setModalDoc(null); }} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}>
          Upload <FiUpload size={14} />
        </button>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Doc title, Category..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>
          <div className="table-toolbar-actions">
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              <FiFilter size={14} /> Filter
            </button>
            <button className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
              Export <FiDownload size={14} />
            </button>
            <button onClick={() => { setModalMode('upload'); setModalDoc(null); }} className="btn btn-primary" style={{ backgroundColor: '#1D4ED8', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', fontWeight: 600 }}>
              <FiPlus size={14} /> Upload Document
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
          onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
          keyField="id"
          emptyMessage="No documents found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <ViewDocumentDrawer doc={viewDoc} onClose={() => setViewDoc(null)} onAction={handleAction} />
      <DocumentFormDrawer
        isOpen={!!modalMode}
        mode={modalMode}
        initialData={modalDoc}
        onClose={() => { setModalMode(null); setModalDoc(null); }}
        onSave={(form) => {
          showToast(`Document ${modalMode} action completed`, 'success');
          setModalMode(null); setModalDoc(null);
        }}
      />
    </div>
  );
}

function ViewDocumentDrawer({ doc, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!doc) return null;

  return (
    <Drawer isOpen={!!doc} onClose={onClose} title={doc.title} subtitle={`${doc.category} • ${doc.version}`} width="560px">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.813rem', color: '#64748B' }}>Status:</span>
          <Badge status={doc.status} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onAction('Checkout', doc)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#334155', fontSize: '0.813rem', fontWeight: 500, cursor: 'pointer' }}
          >
            <FiUnlock size={14} /> Check Out
          </button>
          <button
            onClick={() => onAction('Archive', doc)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#64748B', cursor: 'pointer' }}
            title="Archive"
          >
            <FiArchive size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
        {['Document Details', 'Revision History', 'Access Log'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab === 'Document Details' ? 'details' : tab === 'Revision History' ? 'history' : 'log')}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: activeTab === (tab === 'Document Details' ? 'details' : tab === 'Revision History' ? 'history' : 'log') ? '2px solid #1D4ED8' : '2px solid transparent',
              color: activeTab === (tab === 'Document Details' ? 'details' : tab === 'Revision History' ? 'history' : 'log') ? '#1D4ED8' : '#64748B',
              fontSize: '0.875rem',
              fontWeight: activeTab === (tab === 'Document Details' ? 'details' : tab === 'Revision History' ? 'history' : 'log') ? 600 : 500,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <InfoItem label="DOCUMENT NAME" value={doc.title} />
            <InfoItem label="DOCUMENT CATEGORY" value={doc.category} />
            <InfoItem label="VERSION" value={doc.version} />
            <InfoItem label="UPLOADED BY" value={doc.uploadedBy} />
            <InfoItem label="ACCESS LEVEL" value="All Staff" />
            <InfoItem label="DATE UPLOADED" value="12/02/2024" />
            <InfoItem label="LAST MODIFIED" value={doc.lastUpdated} />
            <InfoItem label="STATUS" value={<Badge status={doc.status} />} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>DESCRIPTION</div>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', fontSize: '0.875rem', color: '#334155' }}>
              Checklist outlining the required documents, tasks and steps for onboarding a new employee.
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>ATTACHED DOCUMENTS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText size={16} color="#64748B" />
                <span style={{ fontSize: '0.875rem', color: '#334155' }}>{doc.title.replace(/ /g, '_')}.pdf (25MB)</span>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.813rem', color: '#1E293B', fontWeight: 600, marginBottom: '8px' }}>REVISION TIMELINE (3)</div>
          {[
            { rev: 'REV 3', date: '13/04/2024', desc: 'Updated to current standard; clarified responsibilities.', user: doc.uploadedBy },
            { rev: 'REV 2', date: '13/04/2024', desc: 'Minor revisions; corrected references.', user: doc.uploadedBy },
            { rev: 'REV 1', date: '13/04/2024', desc: 'Initial issue', user: doc.uploadedBy },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', backgroundColor: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>{item.rev}</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.date}</span>
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0F172A', fontWeight: 500, marginBottom: '4px' }}>{item.desc}</div>
              <div style={{ fontSize: '0.813rem', color: '#64748B' }}>Changed by: {item.user}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.813rem', color: '#1E293B', fontWeight: 600, marginBottom: '8px' }}>SYSTEM INTERACTION LOGS (4)</div>
          {[
            { action: 'CHECKED-OUT', color: '#DC2626', bg: '#FEF2F2', date: '13/04/2024 • 14:22', user: 'Chioma Daniels' },
            { action: 'VIEWED', color: '#334155', bg: '#F1F5F9', date: '13/04/2024 • 14:22', user: 'Chioma Daniels' },
            { action: 'DOWNLOADED', color: '#334155', bg: '#F1F5F9', date: '13/04/2024 • 14:22', user: doc.uploadedBy },
            { action: 'VIEWED', color: '#334155', bg: '#F1F5F9', date: '13/04/2024 • 14:22', user: doc.uploadedBy },
          ].map((item, i) => (
            <div key={i} style={{ padding: '16px', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.color, backgroundColor: item.bg, padding: '4px 8px', borderRadius: '4px' }}>{item.action}</span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{item.date}</span>
              </div>
              <div style={{ fontSize: '0.813rem', color: '#64748B' }}>User: <span style={{ color: '#0F172A', fontWeight: 500 }}>{item.user}</span></div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#1E293B', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function DocumentFormDrawer({ isOpen, onClose, mode, initialData, onSave }) {
  const [form, setForm] = useState({ title: '', category: '', accessLevel: 'All Staff', description: '' });
  
  useEffect(() => {
    if (initialData && mode !== 'upload') {
      setForm({
        title: initialData.title || '',
        category: initialData.category || '',
        accessLevel: 'All Staff',
        description: ''
      });
    } else {
      setForm({ title: '', category: '', accessLevel: 'All Staff', description: '' });
    }
  }, [initialData, mode, isOpen]);

  const title = mode === 'edit' ? 'Edit Document' : mode === 'replace' ? 'Replace Document' : 'Upload HR Document';
  const subtitle = mode === 'edit' ? '' : mode === 'replace' ? 'Upload a new version of this document' : 'Upload HR forms for employee use and internal processes';
  const submitText = mode === 'edit' ? 'Save Changes' : mode === 'replace' ? 'Replace Document' : 'Upload File';

  const footer = (
    <>
      <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: 'none', color: '#64748B', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
      {mode === 'upload' && <button style={{ padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#FFFFFF', color: '#334155', fontWeight: 500, cursor: 'pointer', marginRight: '8px' }}>Save as Draft</button>}
      <button onClick={() => onSave(form)} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#1D4ED8', color: '#FFFFFF', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{submitText}</button>
    </>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} width="560px" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <FormField label="DOCUMENT TITLE" required>
          <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g Employee Onboarding Checklist" />
        </FormField>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField label="DOCUMENT CATEGORY" required>
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})} options={['Employee Records', 'Travel & Logistics', 'Onboarding', 'Recruitment', 'Deployment']} placeholder="Select" />
          </FormField>
          <FormField label="ACCESS LEVEL" required>
            <Select value={form.accessLevel} onChange={e => setForm({...form, accessLevel: e.target.value})} options={['All Staff', 'Managers Only', 'HR Only']} />
          </FormField>
        </div>

        {mode === 'replace' && (
          <FormField label="CURRENT FILE">
            <div style={{ padding: '10px 12px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '0.875rem', color: '#334155' }}>
              {initialData?.title.replace(/ /g, '_')}_v1.0.pdf
            </div>
          </FormField>
        )}

        <FormField label="DESCRIPTION (OPTIONAL)">
          <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder={mode === 'replace' ? "Updated to current standard; clarified responsibilities." : mode === 'edit' ? "Checklist outlining the required documents, tasks and steps for onboarding a new employee." : "Add context..."} rows={4} />
        </FormField>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>ATTACH DOCUMENTS</div>
          <div style={{ border: '1px dashed #CBD5E1', borderRadius: '8px', padding: '24px', textAlign: 'center', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <FiUpload size={20} color="#64748B" />
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Drop file here or click to browse</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
          </div>
          {(mode === 'edit' || mode === 'replace') && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiFileText size={16} color="#64748B" />
                <span style={{ fontSize: '0.875rem', color: '#64748B' }}>{initialData?.title.replace(/ /g, '_')}_{mode === 'replace' ? 'v2.0' : ''}.pdf (25MB)</span>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>
                <FiX size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function FiPlus(props) {
  return (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={props.size} width={props.size} xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
  );
}
