import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit2,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiUploadCloud,
  FiPaperclip,
  FiFileText,
  FiPackage,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import { mockMaterialInspections } from '../../data/mockQuality';

function StatusBadge({ status }) {
  const styles = {
    Passed: { bg: '#DCFCE7', color: '#15803D' },
    Pending: { bg: '#FFEDD5', color: '#C2410C' },
    Failed: { bg: '#FEE2E2', color: '#B91C1C' },
  };
  const s = styles[status] || { bg: '#F1F5F9', color: '#475569' };
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

export default function MaterialsInspection() {
  const [inspections, setInspections] = useState(mockMaterialInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Filter Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Drawers & Modals
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [viewTab, setViewTab] = useState('Receipt Details');

  // Update Form State
  const [updateStatus, setUpdateStatus] = useState('Pending');
  const [updateNotes, setUpdateNotes] = useState('');
  const [itemQtys, setItemQtys] = useState({});
  const [attachedDoc, setAttachedDoc] = useState('');

  // Filter logic
  const filteredData = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.mrnNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.poNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesWarehouse = !warehouseFilter || item.warehouse === warehouseFilter;

      return matchesSearch && matchesStatus && matchesWarehouse;
    });
  }, [inspections, searchTerm, statusFilter, warehouseFilter]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedData.map((d) => d.mrnNo));
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
    setActiveItem(item);
    setViewTab('Receipt Details');
    setIsViewDrawerOpen(true);
  };

  const openUpdateModal = (item) => {
    setActiveItem(item);
    setUpdateStatus(item.status);
    setUpdateNotes(item.notes || '');
    const qtys = {};
    if (item.items) {
      item.items.forEach((it, index) => {
        qtys[index] = it.receivedQty;
      });
    }
    setItemQtys(qtys);
    setAttachedDoc(item.documents?.[0]?.name || '');
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!activeItem) return;

    const updatedItems = activeItem.items?.map((it, idx) => ({
      ...it,
      receivedQty: itemQtys[idx] !== undefined ? Number(itemQtys[idx]) : it.receivedQty,
    }));

    const updated = {
      ...activeItem,
      status: updateStatus,
      notes: updateNotes,
      items: updatedItems,
      documents: attachedDoc
        ? [
            { name: attachedDoc, size: '2.5MB' },
            ...(activeItem.documents || []),
          ]
        : activeItem.documents,
    };

    setInspections((prev) =>
      prev.map((i) => (i.mrnNo === activeItem.mrnNo ? updated : i))
    );
    setActiveItem(updated);
    setIsUpdateModalOpen(false);
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
          checked={selectedIds.includes(row.mrnNo)}
          onChange={() => handleSelectOne(row.mrnNo)}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      key: 'mrnNo',
      label: 'MRN NO',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'poNo',
      label: 'PO NO',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'material',
      label: 'MATERIAL',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'warehouse',
      label: 'WAREHOUSE',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'receiptDate',
      label: 'RECEIPT DATE ⇅',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'status',
      label: 'INSPECTION STATUS',
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
          }}
        >
          <button
            className="icon-btn"
            title="View Details"
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
          <button
            className="icon-btn"
            title="Update Inspection Status"
            onClick={() => openUpdateModal(row)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <FiEdit2 size={15} />
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
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#0F172A',
            margin: 0,
          }}
        >
          Materials Inspection
        </h1>
        <p
          style={{
            color: '#64748B',
            fontSize: '0.875rem',
            margin: '4px 0 0 0',
          }}
        >
          Inspect received materials and verify their quantity and quality before acceptance
        </p>
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
              placeholder="Search MRN No, Vendor..."
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
                backgroundColor: statusFilter || warehouseFilter ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${statusFilter || warehouseFilter ? '#3B82F6' : '#E2E8F0'}`,
                color: statusFilter || warehouseFilter ? '#1D4ED8' : '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiFilter size={15} />
              Filter {statusFilter || warehouseFilter ? '(Active)' : ''}
            </button>

            <button
              onClick={() => alert('Exporting inspection data to CSV...')}
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedData}
          rowKey="mrnNo"
          emptyMessage="No inspection records found matching your query."
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
        title="Filter Materials"
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Inspection Status
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
              <option value="Passed">Passed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Warehouse Location
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Warehouses</option>
              <option value="Port Harcourt Yard">Port Harcourt Yard</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Warri Yard A">Warri Yard A</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setStatusFilter('');
                setWarehouseFilter('');
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

      {/* View Goods Receipt Details Drawer */}
      <Drawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={activeItem?.vendor || 'Goods Receipt Details'}
        subtitle={`${activeItem?.mrnNo || 'MRN-25-001'} • ${activeItem?.poNo || 'PO-25-001'}`}
        width={580}
      >
        {activeItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status Indicator */}
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
              <StatusBadge status={activeItem.status} />
            </div>

            {/* Sub-tabs: Receipt Details | Materials Received | Documents */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              {['Receipt Details', 'Materials Received', 'Documents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setViewTab(tab)}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.875rem',
                    fontWeight: viewTab === tab ? 600 : 500,
                    color: viewTab === tab ? '#1D4ED8' : '#64748B',
                    borderBottom:
                      viewTab === tab ? '2px solid #1D4ED8' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 1: Receipt Details */}
            {viewTab === 'Receipt Details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        DELIVERY REFERENCE
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.deliveryRef}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        PURCHASE ORDER NO
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.poNo}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        LINKED RFQ NO
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.linkedRfq}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        VENDOR
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px', fontWeight: 500 }}>
                        {activeItem.vendor}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      LINKED PROJECT
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeItem.linkedProject}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        MATERIAL
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.material}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        QUANTITY
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.quantity}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        WAREHOUSE
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.warehouse}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                        RECEIPT DATE
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                        {activeItem.receiptDate}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      STATUS
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                      {activeItem.status}
                    </div>
                  </div>
                </div>

                {/* Inspection Notes Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    INSPECTION NOTES
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
                    {activeItem.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Materials Received */}
            {viewTab === 'Materials Received' && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>
                        Description
                      </th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>
                        Ordered Qty
                      </th>
                      <th style={{ padding: '10px 14px', fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>
                        Received Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItem.items?.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 14px', color: '#0F172A' }}>
                          {it.description}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748B' }}>
                          {it.orderedQty}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#1D4ED8', fontWeight: 600 }}>
                          {it.receivedQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Documents */}
            {viewTab === 'Documents' && (
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeItem.documents?.map((doc, idx) => (
                    <div
                      key={idx}
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
                          {doc.name}
                        </span>
                      </div>
                      <button
                        onClick={() => alert(`Downloading: ${doc.name}`)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                      >
                        <FiDownload size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Update Inspection Status Modal */}
      {isUpdateModalOpen && activeItem && (
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
                  Update Inspection Status
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                  Current Status:{' '}
                  <span
                    style={{
                      color:
                        activeItem.status === 'Passed'
                          ? '#15803D'
                          : activeItem.status === 'Failed'
                          ? '#B91C1C'
                          : '#C2410C',
                      fontWeight: 600,
                    }}
                  >
                    {activeItem.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsUpdateModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Materials Table */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <tr>
                      <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Ordered Qty</th>
                      <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Received Qty</th>
                      <th style={{ padding: '8px 12px', color: '#64748B', fontWeight: 600 }}>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItem.items?.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', color: '#0F172A', fontWeight: 500 }}>
                          {it.description}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748B' }}>
                          {it.orderedQty}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            value={itemQtys[idx] !== undefined ? itemQtys[idx] : it.receivedQty}
                            onChange={(e) =>
                              setItemQtys({ ...itemQtys, [idx]: e.target.value })
                            }
                            style={{
                              width: '80px',
                              padding: '4px 8px',
                              border: '1px solid #CBD5E1',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748B' }}>
                          {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status Select */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  INSPECTION STATUS <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              {/* Inspection Notes */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  INSPECTION NOTES <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter inspection details..."
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  required
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

              {/* Delivery Document Upload */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  ATTACH DELIVERY DOCUMENT <span style={{ color: '#EF4444' }}>*</span>
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
                  onClick={() => setAttachedDoc('Inspection_Certificate_Signed.pdf')}
                >
                  <FiUploadCloud size={24} color="#1D4ED8" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    PDF, DOCX, DWG, PNG up to 50MB
                  </p>
                </div>

                {attachedDoc && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{attachedDoc}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedDoc('')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
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
                  onClick={() => setIsUpdateModalOpen(false)}
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
    </div>
  );
}
