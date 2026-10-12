import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical,
  FiPaperclip, FiDownloadCloud, FiFileText, FiTrash2, FiRefreshCw
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockProcurementDocuments } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;

export default function ProcurementDocuments() {
  const [data, setData] = useState(mockProcurementDocuments);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [uploadModal, setUploadModal] = useState(false);
  const [replaceModal, setReplaceModal] = useState(null);
  const [viewDocModal, setViewDocModal] = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef();
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Requisition',
    accessLevel: 'All Staff',
    description: '',
    file: null
  });

  // Replace Form
  const [replaceFile, setReplaceFile] = useState(null);

  const filtered = data.filter(doc => {
    const q = search.toLowerCase();
    return !q ||
      doc.docNo.toLowerCase().includes(q) ||
      doc.documentTitle.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.uploadedBy.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleUploadSubmit = () => {
    if (!uploadForm.title) {
      showToast('Please enter document title', 'error');
      return;
    }
    const created = {
      docNo: `PD-00${data.length + 1}`,
      documentTitle: uploadForm.title,
      category: uploadForm.category,
      uploadedBy: 'Chioma Davids',
      version: 'V1.0',
      lastUpdated: '28/05/25',
      description: uploadForm.description || 'Standard procurement document.',
      accessLevel: uploadForm.accessLevel,
      fileName: `${uploadForm.title.replace(/\s+/g, '_')}_v1.0.pdf`,
      fileSize: '25MB'
    };

    setData([created, ...data]);
    setUploadModal(false);
    setUploadForm({ title: '', category: 'Requisition', accessLevel: 'All Staff', description: '', file: null });
    showToast('Procurement document uploaded successfully', 'success');
  };

  const handleReplaceSubmit = () => {
    if (!replaceModal) return;
    setData(data.map(d => d.docNo === replaceModal.docNo ? {
      ...d,
      version: 'V2.0',
      lastUpdated: '28/05/25',
      fileName: 'Updated_' + d.fileName
    } : d));
    setReplaceModal(null);
    showToast(`New version uploaded for ${replaceModal.documentTitle}`, 'success');
  };

  const handleDelete = (docNo) => {
    setData(data.filter(d => d.docNo !== docNo));
    setActiveMenuId(null);
    showToast('Document deleted permanently', 'success');
  };

  const columns = [
    {
      key: 'docNo',
      label: 'DOC NO',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'documentTitle',
      label: 'DOCUMENT TITLE',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'uploadedBy',
      label: 'UPLOADED BY',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'version',
      label: 'VERSION',
      render: (v) => <span style={{ color: '#64748B', fontWeight: 600 }}>{v}</span>
    },
    {
      key: 'lastUpdated',
      label: 'LAST UPDATED',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setViewDocModal(row)}
            title="View Document Details"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => setActiveMenuId(activeMenuId === row.docNo ? null : row.docNo)}
              style={{ color: '#64748B', cursor: 'pointer' }}
            >
              <FiMoreVertical size={16} />
            </button>

            {activeMenuId === row.docNo && (
              <div
                ref={menuRef}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '4px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '1px solid #E2E8F0',
                  padding: '6px 0',
                  zIndex: 60,
                  width: '180px',
                  textAlign: 'left'
                }}
              >
                <div
                  onClick={() => { setReplaceModal(row); setActiveMenuId(null); }}
                  style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  className="menu-item-hover"
                >
                  <FiRefreshCw size={14} color="#64748B" /> Replace Document
                </div>
                <div
                  onClick={() => { showToast(`Downloading ${row.fileName}`, 'success'); setActiveMenuId(null); }}
                  style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  className="menu-item-hover"
                >
                  <FiDownloadCloud size={14} color="#2563EB" /> Download File
                </div>
                <div
                  onClick={() => handleDelete(row.docNo)}
                  style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  className="menu-item-hover"
                >
                  <FiTrash2 size={14} color="#DC2626" /> Delete File
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Procurement Documents</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Access and manage procurement forms used across purchasing and vendor processes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Batch upload documents ready', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Doc title, Category..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '0.813rem',
                backgroundColor: '#FFFFFF',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Filters applied', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiFilter size={15} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting document catalog...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setUploadModal(true)}
              style={{
                backgroundColor: '#1E3A8A',
                color: '#FFFFFF',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FiUpload size={16} /> Upload Document
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns}
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.docNo))}
            keyField="docNo"
            emptyMessage="No procurement documents found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── UPLOAD PROCUREMENT DOCUMENT MODAL ── */}
      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Upload Procurement Document"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Upload procurement forms for team access and download
          </p>

          <FormField label="DOCUMENT TITLE *" required>
            <Input
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g Purchase Requisition Form"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="DOCUMENT CATEGORY *" required>
              <select
                className="form-input"
                value={uploadForm.category}
                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              >
                {['Requisition', 'Vendor Management', 'Tendering', 'Purchasing', 'Inventory', 'Compliance'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="ACCESS LEVEL *" required>
              <select
                className="form-input"
                value={uploadForm.accessLevel}
                onChange={(e) => setUploadForm({ ...uploadForm, accessLevel: e.target.value })}
              >
                <option value="All Staff">All Staff</option>
                <option value="Procurement Team">Procurement Team</option>
                <option value="Managers Only">Managers Only</option>
              </select>
            </FormField>
          </div>

          <FormField label="DESCRIPTION (OPTIONAL)">
            <textarea
              className="form-input"
              rows={3}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Add context..."
            />
          </FormField>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
              ATTACH DOCUMENTS
            </label>
            <div
              style={{
                border: '1.5px dashed #CBD5E1', borderRadius: '8px', padding: '24px',
                textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer'
              }}
              onClick={() => showToast('File selector opened', 'info')}
            >
              <FiUpload size={24} color="#64748B" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <button className="btn btn-secondary" onClick={() => setUploadModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUploadSubmit}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
            >
              Upload Procedure
            </button>
          </div>
        </div>
      </Modal>

      {/* ── REPLACE DOCUMENT MODAL ── */}
      {replaceModal && (
        <Modal
          isOpen={!!replaceModal}
          onClose={() => setReplaceModal(null)}
          title="Replace Document"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
              Upload a new version of this document
            </p>

            <FormField label="DOCUMENT NAME *">
              <Input value={replaceModal.documentTitle} disabled />
            </FormField>

            <FormField label="DOCUMENT CATEGORY *">
              <Input value={replaceModal.category} disabled />
            </FormField>

            <FormField label="CURRENT FILE">
              <Input value={replaceModal.fileName} disabled />
            </FormField>

            <FormField label="DESCRIPTION (OPTIONAL)">
              <textarea
                className="form-input"
                rows={2}
                value={replaceModal.description}
                disabled
              />
            </FormField>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
                ATTACH DOCUMENTS
              </label>
              <div
                style={{
                  border: '1.5px dashed #CBD5E1', borderRadius: '8px', padding: '20px',
                  textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer'
                }}
                onClick={() => showToast('New revision file selected', 'info')}
              >
                <FiUpload size={22} color="#64748B" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setReplaceModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleReplaceSubmit}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
              >
                Replace Document
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW DOCUMENT MODAL ── */}
      {viewDocModal && (
        <Modal
          isOpen={!!viewDocModal}
          onClose={() => setViewDocModal(null)}
          title=""
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiFileText size={22} color="#1E3A8A" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewDocModal.documentTitle}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => showToast(`Downloading ${viewDocModal.fileName}`, 'success')}
                  style={{
                    backgroundColor: '#1E3A8A', color: '#FFFFFF', border: 'none',
                    padding: '8px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <FiDownloadCloud size={14} /> Download
                </button>
                <button
                  onClick={() => { setReplaceModal(viewDocModal); setViewDocModal(null); }}
                  style={{
                    backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0',
                    padding: '8px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                  }}
                >
                  <FiRefreshCw size={14} /> Replace
                </button>
              </div>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DOCUMENT NAME</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewDocModal.documentTitle}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DOCUMENT CATEGORY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewDocModal.category}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VERSION</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewDocModal.version}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>UPLOADED BY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewDocModal.uploadedBy}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LAST UPDATED</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewDocModal.lastUpdated}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                DESCRIPTION
              </div>
              <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                {viewDocModal.description}
              </p>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                ATTACHED DOCUMENTS
              </div>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                  <FiPaperclip size={14} color="#64748B" />
                  <span>{viewDocModal.fileName} ({viewDocModal.fileSize})</span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => showToast(`Downloading ${viewDocModal.fileName}`, 'success')}
                >
                  <FiDownloadCloud size={15} color="#2563EB" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
