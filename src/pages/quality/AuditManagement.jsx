import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiMoreVertical,
  FiAlertCircle,
  FiUploadCloud,
  FiCalendar,
  FiX,
  FiCheck,
  FiClock,
  FiFileText,
  FiEdit,
  FiPaperclip,
  FiTrash2,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import { mockAudits } from '../../data/mockQuality';

function StatusBadge({ status }) {
  const styles = {
    Scheduled: { bg: '#F3E8FF', color: '#7E22CE' },
    'In Progress': { bg: '#EFF6FF', color: '#1D4ED8' },
    Completed: { bg: '#DCFCE7', color: '#15803D' },
    Closed: { bg: '#F1F5F9', color: '#475569' },
    Overdue: { bg: '#FEE2E2', color: '#B91C1C' },
  };
  const s = styles[status] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
}

export default function AuditManagement() {
  const [audits, setAudits] = useState(mockAudits);
  const [activeTab, setActiveTab] = useState('Audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals & Drawers
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState(false);

  const [activeAudit, setActiveAudit] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Schedule/Edit Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    type: 'Internal Quality Audit',
    department: 'Administration',
    location: 'Lagos Head Office',
    leadAuditor: 'Nafisat Abubakar',
    startDate: '28/05/25',
    endDate: '29/05/25',
    objective: '',
    checklist: '',
  });

  const [reportFileName, setReportFileName] = useState('');

  // Filter logic
  const filteredAudits = useMemo(() => {
    return audits.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.leadAuditor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesType = !typeFilter || item.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [audits, searchTerm, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredAudits.length / pageSize) || 1;
  const paginatedAudits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAudits.slice(start, start + pageSize);
  }, [filteredAudits, currentPage, pageSize]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedAudits.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openScheduleModal = () => {
    const nextNum = audits.length + 1;
    setFormData({
      id: `AUD-25-0${nextNum < 10 ? '0' + nextNum : nextNum}`,
      title: '',
      type: 'Internal Quality Audit',
      department: 'Administration',
      location: 'Lagos Head Office',
      leadAuditor: 'Nafisat Abubakar',
      startDate: '28/05/25',
      endDate: '29/05/25',
      objective:
        'Evaluate compliance with HSE procedures, permit-to-work requirements, emergency preparedness, and waste management practices.',
      checklist: 'Q3_HSE_Audit_Checklist.pdf (25MB)',
    });
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    const newAudit = {
      ...formData,
      status: 'Scheduled',
      report: null,
    };
    setAudits([newAudit, ...audits]);
    setIsScheduleModalOpen(false);
  };

  const openEditModal = (audit) => {
    setActiveAudit(audit);
    setFormData({
      id: audit.id,
      title: audit.title,
      type: audit.type,
      department: audit.department,
      location: audit.location,
      leadAuditor: audit.leadAuditor,
      startDate: audit.startDate,
      endDate: audit.endDate,
      objective: audit.objective,
      checklist: audit.checklist || 'Q3_HSE_Audit_Checklist.pdf (25MB)',
    });
    setOpenActionMenuId(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setAudits((prev) =>
      prev.map((item) =>
        item.id === activeAudit.id ? { ...item, ...formData } : item
      )
    );
    if (activeAudit && activeAudit.id === formData.id) {
      setActiveAudit((prev) => ({ ...prev, ...formData }));
    }
    setIsEditModalOpen(false);
  };

  const openViewDrawer = (audit) => {
    setActiveAudit(audit);
    setOpenActionMenuId(null);
    setIsViewDrawerOpen(true);
  };

  const handleStatusChange = (auditId, nextStatus) => {
    setAudits((prev) =>
      prev.map((item) =>
        item.id === auditId ? { ...item, status: nextStatus } : item
      )
    );
    if (activeAudit && activeAudit.id === auditId) {
      setActiveAudit((prev) => ({ ...prev, status: nextStatus }));
    }
    setOpenActionMenuId(null);
  };

  const handleUploadReport = (e) => {
    e.preventDefault();
    if (!reportFileName) return;
    setAudits((prev) =>
      prev.map((item) =>
        item.id === activeAudit.id
          ? { ...item, report: `${reportFileName} (25MB)`, status: 'Completed' }
          : item
      )
    );
    if (activeAudit) {
      setActiveAudit((prev) => ({
        ...prev,
        report: `${reportFileName} (25MB)`,
        status: 'Completed',
      }));
    }
    setIsUploadReportModalOpen(false);
    setReportFileName('');
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            paginatedAudits.length > 0 &&
            selectedIds.length === paginatedAudits.length
          }
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectOne(row.id)}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      key: 'id',
      label: 'AUDIT ID',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'TITLE',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (v) => (
        <span style={{ color: '#0284C7', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'location',
      label: 'LOCATION',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'leadAuditor',
      label: 'LEAD AUDITOR',
      render: (v) => (
        <span style={{ color: '#0F172A', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'auditDate',
      label: 'AUDIT DATE ⇅',
      render: (_, row) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>
          {row.startDate} to {row.endDate}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => <StatusBadge status={v} />,
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
            gap: '8px',
            position: 'relative',
          }}
        >
          <button
            className="icon-btn"
            title="View Audit"
            onClick={() => openViewDrawer(row)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <FiEye size={16} />
          </button>

          {row.report ? (
            <button
              className="icon-btn"
              title="Download Report"
              onClick={() =>
                alert(`Downloading audit report: ${row.report}`)
              }
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              <FiDownload size={16} />
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                title="More Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionMenuId(
                    openActionMenuId === row.id ? null : row.id
                  );
                }}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                <FiMoreVertical size={16} />
              </button>

              {openActionMenuId === row.id && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    zIndex: 50,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                    border: '1px solid #E2E8F0',
                    width: '180px',
                    padding: '6px 0',
                    textAlign: 'left',
                  }}
                >
                  {row.status === 'Scheduled' && (
                    <>
                      <button
                        onClick={() => openEditModal(row)}
                        style={{
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          background: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#1E293B',
                          cursor: 'pointer',
                        }}
                      >
                        <FiEdit size={14} /> Edit Audit
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.id, 'In Progress')}
                        style={{
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          background: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#1D4ED8',
                          cursor: 'pointer',
                        }}
                      >
                        <FiCheck size={14} /> Mark In Progress
                      </button>
                    </>
                  )}

                  {row.status === 'In Progress' && (
                    <button
                      onClick={() => handleStatusChange(row.id, 'Completed')}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        color: '#16A34A',
                        cursor: 'pointer',
                      }}
                    >
                      <FiCheck size={14} /> Mark as Completed
                    </button>
                  )}

                  {row.status === 'Completed' && (
                    <button
                      onClick={() => {
                        setActiveAudit(row);
                        setOpenActionMenuId(null);
                        setIsUploadReportModalOpen(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        color: '#1D4ED8',
                        cursor: 'pointer',
                      }}
                    >
                      <FiUploadCloud size={14} /> Upload Report
                    </button>
                  )}

                  {row.status === 'Overdue' && (
                    <>
                      <button
                        onClick={() => openEditModal(row)}
                        style={{
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          background: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        <FiCalendar size={14} /> Reschedule
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.id, 'Completed')}
                        style={{
                          width: '100%',
                          padding: '8px 14px',
                          border: 'none',
                          background: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.85rem',
                          color: '#16A34A',
                          cursor: 'pointer',
                        }}
                      >
                        <FiCheck size={14} /> Mark as Completed
                      </button>
                    </>
                  )}

                  {row.status === 'Closed' && (
                    <button
                      onClick={() => openViewDrawer(row)}
                      style={{
                        width: '100%',
                        padding: '8px 14px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <FiEye size={14} /> View Details
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
      onClick={() => setOpenActionMenuId(null)}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            Audit Management
          </h1>
          <p
            style={{
              color: '#64748B',
              fontSize: '0.875rem',
              margin: '4px 0 0 0',
            }}
          >
            Plan, schedule, and track quality system audits across projects and operations
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={() => alert('Bulk upload audit schedules feature initiated')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#1E293B',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <FiUploadCloud size={16} /> Upload ↑
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        {['Audit', 'Schedule'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 0',
              border: 'none',
              background: 'none',
              fontSize: '0.9rem',
              fontWeight: activeTab === tab ? 600 : 500,
              color: activeTab === tab ? '#1D4ED8' : '#64748B',
              borderBottom:
                activeTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alert Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          backgroundColor: '#FFF1F2',
          border: '1px solid #FFE4E6',
          borderRadius: '8px',
          color: '#BE123C',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertCircle size={18} color="#E11D48" />
          <span>
            <strong>1 audit is overdue.</strong> Schedule immediately to maintain QMS compliance.
          </span>
        </div>
        <button
          onClick={() => setStatusFilter('Overdue')}
          style={{
            border: 'none',
            background: 'none',
            color: '#BE123C',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            textDecoration: 'underline',
          }}
        >
          View Overdue →
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {/* Table Toolbar */}
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
              placeholder="Search Audit ID, Type ..."
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
                backgroundColor: statusFilter || typeFilter ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${statusFilter || typeFilter ? '#3B82F6' : '#E2E8F0'}`,
                color: statusFilter || typeFilter ? '#1D4ED8' : '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiFilter size={15} />
              Filter {statusFilter || typeFilter ? '(Active)' : ''}
            </button>

            <button
              onClick={() => alert('Exporting audit log to CSV/Excel...')}
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
              onClick={openScheduleModal}
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
              Schedule Audit
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedAudits}
          rowKey="id"
          emptyMessage="No audits found matching your criteria."
        />

        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAudits.length}
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
        title="Filter Audits"
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Audit Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Types</option>
              <option value="Internal Quality Audit">Internal Quality Audit</option>
              <option value="External Client Audit">External Client Audit</option>
              <option value="Supplier/Vendor Audit">Supplier/Vendor Audit</option>
              <option value="ISO Audit">ISO Audit</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
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

      {/* Schedule Audit Modal */}
      {isScheduleModalOpen && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                  Schedule Audit
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Create an audit schedule and assign the responsible auditor
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    AUDIT ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#475569',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    AUDIT TYPE <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Internal Quality Audit">Internal Quality Audit</option>
                    <option value="External Client Audit">External Client Audit</option>
                    <option value="Supplier/Vendor Audit">Supplier/Vendor Audit</option>
                    <option value="ISO Audit">ISO Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT TITLE <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Internal Quality Audit — Welding Processes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    DEPARTMENT <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Administration">Administration</option>
                    <option value="Operations">Operations</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Technical">Technical</option>
                    <option value="HSE">HSE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    LOCATION <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Lagos Head Office">Lagos Head Office</option>
                    <option value="Port Harcourt Site">Port Harcourt Site</option>
                    <option value="Warri Yard">Warri Yard</option>
                    <option value="Offshore Field">Offshore Field</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    LEAD AUDITOR <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.leadAuditor}
                    onChange={(e) => setFormData({ ...formData, leadAuditor: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    START DATE <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  END DATE <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT OBJECTIVE
                </label>
                <textarea
                  rows={3}
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Evaluate compliance with HSE procedures, permit-to-work requirements..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT CHECKLIST
                </label>
                <div
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      checklist: 'Q3_HSE_Audit_Checklist.pdf (25MB)',
                    })
                  }
                >
                  <FiUploadCloud size={24} color="#1D4ED8" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    PDF, DOCX, DWG, PNG up to 50MB
                  </p>
                </div>

                {formData.checklist && (
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
                      <span>{formData.checklist}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checklist: '' })}
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
                  marginTop: '10px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
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
                  Schedule Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Audit Modal */}
      {isEditModalOpen && (
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
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
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
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Edit Audit
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    AUDIT ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#475569',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    AUDIT TYPE <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Internal Quality Audit">Internal Quality Audit</option>
                    <option value="External Client Audit">External Client Audit</option>
                    <option value="Supplier/Vendor Audit">Supplier/Vendor Audit</option>
                    <option value="ISO Audit">ISO Audit</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT TITLE <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    DEPARTMENT <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Administration">Administration</option>
                    <option value="Operations">Operations</option>
                    <option value="Procurement">Procurement</option>
                    <option value="Technical">Technical</option>
                    <option value="HSE">HSE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    LOCATION <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Lagos Head Office">Lagos Head Office</option>
                    <option value="Port Harcourt Site">Port Harcourt Site</option>
                    <option value="Warri Yard">Warri Yard</option>
                    <option value="Offshore Field">Offshore Field</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    LEAD AUDITOR <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.leadAuditor}
                    onChange={(e) => setFormData({ ...formData, leadAuditor: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    START DATE <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  END DATE <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT OBJECTIVE
                </label>
                <textarea
                  rows={3}
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  AUDIT CHECKLIST
                </label>
                {formData.checklist && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{formData.checklist}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, checklist: '' })}
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
                  marginTop: '10px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Audit Drawer */}
      <Drawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={activeAudit?.title || 'Audit Details'}
        subtitle={`${activeAudit?.department || 'Operations'} • ${activeAudit?.id || ''}`}
        width={580}
      >
        {activeAudit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Status & Main Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '16px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                  Status:
                </span>
                <StatusBadge status={activeAudit.status} />
              </div>

              {activeAudit.status === 'Scheduled' && (
                <button
                  onClick={() => handleStatusChange(activeAudit.id, 'In Progress')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiCheck size={14} /> Mark as In Progress
                </button>
              )}

              {activeAudit.status === 'Completed' && !activeAudit.report && (
                <button
                  onClick={() => setIsUploadReportModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiUploadCloud size={14} /> Upload Report
                </button>
              )}

              {activeAudit.status === 'Overdue' && (
                <button
                  onClick={() => openEditModal(activeAudit)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiCalendar size={14} /> Reschedule
                </button>
              )}
            </div>

            {/* Audit Details Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  AUDIT TITLE
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  {activeAudit.title}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    AUDIT ID
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    AUDIT TYPE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0284C7', marginTop: '2px', fontWeight: 500 }}>
                    {activeAudit.type}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    DEPARTMENT
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.department}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    LOCATION
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.location}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    LEAD AUDITOR
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.leadAuditor}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    START DATE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.startDate}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    END DATE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.endDate || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    STATUS
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeAudit.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Objective Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                AUDIT OBJECTIVE
              </div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#334155',
                  marginTop: '8px',
                  lineHeight: '1.5',
                  marginBottom: 0,
                }}
              >
                {activeAudit.objective}
              </p>
            </div>

            {/* Attached Documents Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px' }}>
                ATTACHED DOCUMENTS
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeAudit.checklist && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FiPaperclip size={16} color="#64748B" />
                      <span style={{ color: '#1E293B', fontWeight: 500 }}>
                        {activeAudit.checklist}
                      </span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading: ${activeAudit.checklist}`)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      <FiDownload size={16} />
                    </button>
                  </div>
                )}

                {activeAudit.report && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FiPaperclip size={16} color="#15803D" />
                      <span style={{ color: '#1E293B', fontWeight: 500 }}>
                        {activeAudit.report}
                      </span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading: ${activeAudit.report}`)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      <FiDownload size={16} />
                    </button>
                  </div>
                )}

                {!activeAudit.checklist && !activeAudit.report && (
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                    No documents attached yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Upload Report Modal */}
      {isUploadReportModalOpen && (
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
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                padding: '20px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                Upload Audit Report
              </h3>
              <button
                onClick={() => setIsUploadReportModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadReport} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Report File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Audit Report 2026.pdf"
                  value={reportFileName}
                  onChange={(e) => setReportFileName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div
                style={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  cursor: 'pointer',
                }}
                onClick={() => setReportFileName('Audit Report 2026.pdf')}
              >
                <FiUploadCloud size={24} color="#1D4ED8" style={{ marginBottom: '6px' }} />
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                  Click to choose signed audit report
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                  PDF up to 50MB
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadReportModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  Upload & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
