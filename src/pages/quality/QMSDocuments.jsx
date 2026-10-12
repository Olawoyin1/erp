import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiX,
  FiUploadCloud,
  FiFileText,
  FiAlertTriangle,
  FiPaperclip,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import { mockQmsDocuments } from '../../data/mockQuality';

export default function QMSDocuments() {
  const [documents, setDocuments] = useState(mockQmsDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeDocToRetrieve, setActiveDocToRetrieve] = useState(null);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Filter logic
  const filteredData = useMemo(() => {
    return documents.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = !categoryFilter || item.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [documents, searchTerm, categoryFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map((d) => d.sn));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (sn) => {
    setSelectedIds((prev) =>
      prev.includes(sn) ? prev.filter((i) => i !== sn) : [...prev, sn]
    );
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadDocName) return;

    const newDoc = {
      sn: documents.length + 1,
      title: uploadDocName,
      uploadedBy: 'Chioma Davids',
      uploadDate: new Date().toLocaleDateString('en-GB'),
      fileName: `${uploadDocName.replace(/\s+/g, '_')}.pdf`,
      size: '2.5MB',
      category: 'Procedures',
    };

    setDocuments([newDoc, ...documents]);
    setUploadDocName('');
    setUploadedFile(null);
    setIsUploadModalOpen(false);
  };

  const openRetrieveModal = (doc) => {
    setActiveDocToRetrieve(doc);
    setIsRetrieveModalOpen(true);
  };

  const handleConfirmRetrieve = () => {
    if (!activeDocToRetrieve) return;
    setDocuments((prev) => prev.filter((d) => d.sn !== activeDocToRetrieve.sn));
    setIsRetrieveModalOpen(false);
    setActiveDocToRetrieve(null);
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            paginatedData.length > 0 &&
            selectedIds.length === paginatedData.length
          }
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.sn)}
          onChange={() => handleSelectOne(row.sn)}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      key: 'sn',
      label: 'S/N',
      render: (v) => (
        <span style={{ color: '#64748B', fontSize: '0.875rem' }}>{v}</span>
      ),
    },
    {
      key: 'title',
      label: 'DOCUMENT TITLE',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'uploadedBy',
      label: 'UPLOADED BY',
      render: (v) => (
        <span style={{ color: '#0F172A', fontSize: '0.875rem' }}>{v}</span>
      ),
    },
    {
      key: 'uploadDate',
      label: 'UPLOAD DATE',
      render: (v) => (
        <span style={{ color: '#64748B', fontSize: '0.875rem' }}>{v}</span>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
          }}
        >
          <button
            onClick={() => alert(`Downloading: ${row.fileName}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <FiDownload size={14} /> Download
          </button>
          <button
            onClick={() => openRetrieveModal(row)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              background: 'none',
              color: '#EF4444',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <FiX size={15} /> Retrieve
          </button>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
            margin: 0,
          }}
        >
          QMS Documents
        </h1>
        <p
          style={{
            color: '#64748B',
            fontSize: '0.875rem',
            margin: '4px 0 0 0',
          }}
        >
          Manage QMS documents for regulatory compliance and staff reference
        </p>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsFilterOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: categoryFilter ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${categoryFilter ? '#3B82F6' : '#E2E8F0'}`,
                color: categoryFilter ? '#1D4ED8' : '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiFilter size={15} />
              Filter {categoryFilter ? '(Active)' : ''}
            </button>

            <button
              onClick={() => alert('Exporting QMS document catalogue...')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiDownload size={15} />
              Export
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiPlus size={16} />
              Upload Document
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          rowKey="sn"
          emptyMessage="No documents found."
        />

        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Documents"
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Categories</option>
              <option value="Procedures">Procedures</option>
              <option value="Audit">Audit</option>
              <option value="CAPA">CAPA</option>
              <option value="Policy">Policy</option>
              <option value="Forms">Forms</option>
              <option value="Calibration">Calibration</option>
              <option value="Supply Chain QA">Supply Chain QA</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setCategoryFilter('');
                setIsFilterOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px 14px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              style={{
                flex: 1,
                padding: '8px 14px',
                border: 'none',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </Drawer>

      {/* Upload QS Document Modal */}
      {isUploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Upload QS Document
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Upload a new Quality System document for employee reference and compliance
                </p>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Document Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g Internal Audit Procedure"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  ATTACH DOCUMENTS
                </label>
                <div
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                  onClick={() => setUploadedFile('Internal_Audit_Procedure_2026.pdf')}
                >
                  <FiUploadCloud size={28} color="#1D4ED8" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    PDF, DOCX, DWG, PNG. up to 50MB
                  </p>
                </div>

                {uploadedFile && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{uploadedFile}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Retrieve Document Dialog */}
      {isRetrieveModalOpen && activeDocToRetrieve && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '420px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
              Retrieve Document?
            </h3>
            <p style={{ margin: '8px 0 16px', fontSize: '0.875rem', color: '#64748B', lineHeight: '1.5' }}>
              Are you sure you want to retrieve this document? This will remove the document from the active Quality System Documents list.
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
              {activeDocToRetrieve.fileName}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsRetrieveModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRetrieve}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                <FiX size={15} /> Retrieve Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
