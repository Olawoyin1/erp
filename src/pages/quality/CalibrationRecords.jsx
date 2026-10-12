import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiUploadCloud,
  FiPlus,
  FiX,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import { mockCalibrations } from '../../data/mockQuality';

function StatusBadge({ status }) {
  const styles = {
    Valid: { bg: '#DCFCE7', color: '#15803D' },
    'Due Soon': { bg: '#FEF3C7', color: '#B45309' },
    Overdue: { bg: '#FEE2E2', color: '#B91C1C' },
    'Out of Service': { bg: '#F1F5F9', color: '#64748B' },
  };
  const s = styles[status] || { bg: '#F1F5F9', color: '#64748B' };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '3px 12px',
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

export default function CalibrationRecords() {
  const [instruments, setInstruments] = useState(mockCalibrations);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // View Instrument Drawer
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [activeInstrument, setActiveInstrument] = useState(null);
  const [drawerTab, setDrawerTab] = useState('Details');

  // Schedule / Log Calibration Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [calibFormData, setCalibFormData] = useState({
    date: '28/05/26',
    calibratedBy: 'SGS Nigeria Calibration Lab',
    result: 'Passed',
    certificateNo: 'MC-2026-9041',
    loggedBy: 'Quality Inspector',
  });

  // Filter logic
  const filteredData = useMemo(() => {
    return instruments.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.custodian.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesLocation = !locationFilter || item.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [instruments, searchTerm, statusFilter, locationFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openViewDrawer = (item) => {
    setActiveInstrument(item);
    setDrawerTab('Details');
    setIsViewDrawerOpen(true);
  };

  const handleScheduleCalibrationSubmit = (e) => {
    e.preventDefault();
    if (!activeInstrument) return;

    const newHistoryEntry = {
      date: calibFormData.date,
      calibratedBy: calibFormData.calibratedBy,
      result: calibFormData.result,
      certificateNo: calibFormData.certificateNo,
      loggedBy: calibFormData.loggedBy,
    };

    const updatedInstrument = {
      ...activeInstrument,
      status: 'Valid',
      lastCalibrated: calibFormData.date,
      nextDue: '28/11/26',
      history: [newHistoryEntry, ...(activeInstrument.history || [])],
    };

    setInstruments((prev) =>
      prev.map((ins) => (ins.id === activeInstrument.id ? updatedInstrument : ins))
    );
    setActiveInstrument(updatedInstrument);
    setIsScheduleModalOpen(false);
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
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectOne(row.id)}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      key: 'id',
      label: 'INSTRUMENT ID',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'NAME',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          {v}
        </span>
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
      key: 'custodian',
      label: 'CUSTODIAN',
      render: (v) => (
        <span style={{ color: '#0F172A', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'lastCalibrated',
      label: 'LAST CALIBRATED',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'nextDue',
      label: 'NEXT DUE',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
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
        <button
          className="icon-btn"
          title="View Instrument"
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
            Calibration Records
          </h1>
          <p
            style={{
              color: '#64748B',
              fontSize: '0.875rem',
              margin: '4px 0 0 0',
            }}
          >
            Register of measuring and test instruments with calibration status
          </p>
        </div>
        <button
          onClick={() => alert('Bulk upload calibration records initiated')}
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
              placeholder="Search by Instrument ID ..."
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
                backgroundColor: statusFilter || locationFilter ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${statusFilter || locationFilter ? '#3B82F6' : '#E2E8F0'}`,
                color: statusFilter || locationFilter ? '#1D4ED8' : '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiFilter size={15} />
              Filter {statusFilter || locationFilter ? '(Active)' : ''}
            </button>

            <button
              onClick={() => alert('Exporting calibration registry...')}
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
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          rowKey="id"
          emptyMessage="No calibration records found."
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
        title="Filter Instruments"
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Calibration Status
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
              <option value="Valid">Valid</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Overdue">Overdue</option>
              <option value="Out of Service">Out of Service</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Location
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Locations</option>
              <option value="Warri Yard">Warri Yard</option>
              <option value="Port Harcourt Site">Port Harcourt Site</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setStatusFilter('');
                setLocationFilter('');
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

      {/* View Instrument Drawer */}
      <Drawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={activeInstrument?.name || 'Instrument Details'}
        subtitle={`Used Oil • DSP-25-018`}
        width={580}
      >
        {activeInstrument && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                Status:
              </span>
              <StatusBadge status={activeInstrument.status} />
            </div>

            {/* Sub-tabs: Details | History */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              {['Details', 'History'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrawerTab(tab)}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.875rem',
                    fontWeight: drawerTab === tab ? 600 : 500,
                    color: drawerTab === tab ? '#1D4ED8' : '#64748B',
                    borderBottom:
                      drawerTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Details */}
            {drawerTab === 'Details' && (
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      INSTRUMENT ID
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.id}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      SERIAL NUMBER
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.serialNumber}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    INSTRUMENT NAME
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                    {activeInstrument.name}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      TYPE
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.type}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      MANUFACTURER / MODEL
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.manufacturerModel}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      STORAGE LOCATION
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.location}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      LAST CALIBRATED
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.lastCalibrated}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      CALIBRATION DATE
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.lastCalibrated}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      NEXT DUE
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeInstrument.nextDue}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    STATUS
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeInstrument.status}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: History */}
            {drawerTab === 'History' && (
              <div>
                {activeInstrument.history && activeInstrument.history.length > 0 ? (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                          <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748B' }}>Date</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748B' }}>Calibrated by</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748B' }}>Result</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748B' }}>Certificate No.</th>
                          <th style={{ padding: '10px 12px', fontWeight: 600, color: '#64748B' }}>Logged By</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeInstrument.history.map((hist, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{hist.date}</td>
                            <td style={{ padding: '10px 12px', color: '#0F172A', fontWeight: 500 }}>
                              {hist.calibratedBy}
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ color: '#15803D', fontWeight: 600 }}>{hist.result}</span>
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>
                              {hist.certificateNo}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{hist.loggedBy}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              <button
                                onClick={() => alert(`Downloading Certificate: ${hist.certificateNo}`)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  color: '#64748B',
                                  cursor: 'pointer',
                                }}
                              >
                                <FiDownload size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Empty state matching Screenshot 2026-10-12 132252.png */
                  <div
                    style={{
                      padding: '40px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        color: '#1D4ED8',
                      }}
                    >
                      <FiFileText size={24} />
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      No Calibration History
                    </h3>
                    <p
                      style={{
                        margin: '6px 0 20px',
                        fontSize: '0.875rem',
                        color: '#64748B',
                      }}
                    >
                      Full calibration history with certificates appears here.
                    </p>
                    <button
                      onClick={() => setIsScheduleModalOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#1D4ED8',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <FiPlus size={16} />
                      Schedule Calibration
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Schedule / Log Calibration Modal */}
      {isScheduleModalOpen && activeInstrument && (
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
              maxWidth: '500px',
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
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                  Log Calibration Result
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  {activeInstrument.id} — {activeInstrument.name}
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleCalibrationSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Calibration Date
                </label>
                <input
                  type="text"
                  value={calibFormData.date}
                  onChange={(e) => setCalibFormData({ ...calibFormData, date: e.target.value })}
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
                  Calibrated By (Laboratory)
                </label>
                <input
                  type="text"
                  value={calibFormData.calibratedBy}
                  onChange={(e) => setCalibFormData({ ...calibFormData, calibratedBy: e.target.value })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Result
                  </label>
                  <select
                    value={calibFormData.result}
                    onChange={(e) => setCalibFormData({ ...calibFormData, result: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Passed">Passed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Certificate Number
                  </label>
                  <input
                    type="text"
                    value={calibFormData.certificateNo}
                    onChange={(e) => setCalibFormData({ ...calibFormData, certificateNo: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
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
                  Save Calibration Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
