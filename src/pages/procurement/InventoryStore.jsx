import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiCheckCircle, FiPaperclip, FiDownloadCloud, FiBox,
  FiTruck, FiAlertTriangle, FiRepeat, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockGoodsReceipts, mockInventoryStock, mockStockMovements } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;

const inspectionStatusStyles = {
  'Passed':   { bg: '#DCFCE7', color: '#16A34A' },
  'Pending':  { bg: '#FEF3C7', color: '#D97706' },
  'Failed':   { bg: '#FEE2E2', color: '#DC2626' }
};

const stockStatusStyles = {
  'In Stock':     { bg: '#DCFCE7', color: '#16A34A' },
  'Low Stock':    { bg: '#FEF3C7', color: '#D97706' },
  'Out of stock': { bg: '#FEE2E2', color: '#DC2626' }
};

const movementStatusStyles = {
  'Completed': { bg: '#DCFCE7', color: '#16A34A' },
  'Pending':   { bg: '#FEF3C7', color: '#D97706' },
  'Cancelled': { bg: '#FEE2E2', color: '#DC2626' }
};

export default function InventoryStore() {
  const [activeTab, setActiveTab] = useState('receiving'); // 'receiving' | 'inventory' | 'movements'
  const [receiptsList, setReceiptsList] = useState(mockGoodsReceipts);
  const [inventoryList, setInventoryList] = useState(mockInventoryStock);
  const [movementsList, setMovementsList] = useState(mockStockMovements);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [viewReceiptModal, setViewReceiptModal] = useState(null);
  const [viewReceiptTab, setViewReceiptTab] = useState('details'); // 'details' | 'materials' | 'documents'

  const [viewInventoryModal, setViewInventoryModal] = useState(null);
  const [viewInventoryTab, setViewInventoryTab] = useState('info'); // 'info' | 'history'

  const [stockAdjustmentModal, setStockAdjustmentModal] = useState(null);
  const [adjustmentForm, setAdjustmentForm] = useState({ newStock: '25', reason: 'Five structural steels were damaged during unloading and removed from inventory.' });

  const [newMovementModal, setNewMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState({
    movementId: 'SM-25-001',
    itemName: 'Reinforcement Bars',
    movementType: 'Material Issue',
    fromLocation: 'Main Warehouse',
    toLocation: 'LNG Pipeline Project',
    quantity: '200',
    unit: 'Pieces',
    movementDate: '12/02/24',
    remarks: 'Issued reinforcement bars for foundation works at the LNG Pipeline Project.'
  });

  const [viewMovementModal, setViewMovementModal] = useState(null);
  const [cancelMovementModal, setCancelMovementModal] = useState(null);
  const [cancelMovementReason, setCancelMovementReason] = useState('Material request withdrawn by the project team.');

  const [handoverNoteModal, setHandoverNoteModal] = useState(false);

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

  // Top Metrics
  const totalStockItems = '2,845';
  const goodsReceivedMonth = '186';
  const lowStockItems = '24';
  const stockMovementToday = '37';

  // Filter current tab data
  const filteredReceipts = receiptsList.filter(r => {
    const q = search.toLowerCase();
    return !q || r.mrnNo.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || r.material.toLowerCase().includes(q);
  });

  const filteredInventory = inventoryList.filter(i => {
    const q = search.toLowerCase();
    return !q || i.itemCode.toLowerCase().includes(q) || i.itemName.toLowerCase().includes(q) || i.warehouse.toLowerCase().includes(q);
  });

  const filteredMovements = movementsList.filter(m => {
    const q = search.toLowerCase();
    return !q || m.movementNo.toLowerCase().includes(q) || m.itemName.toLowerCase().includes(q) || m.from.toLowerCase().includes(q) || m.to.toLowerCase().includes(q);
  });

  const currentData = activeTab === 'receiving' ? filteredReceipts : activeTab === 'inventory' ? filteredInventory : filteredMovements;
  const totalPages = Math.max(1, Math.ceil(currentData.length / ITEMS_PER_PAGE));
  const paginated = currentData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStockAdjustmentSubmit = () => {
    if (!stockAdjustmentModal) return;
    setInventoryList(inventoryList.map(item => {
      if (item.itemCode === stockAdjustmentModal.itemCode) {
        const newStockVal = Number(adjustmentForm.newStock) || item.availableStock;
        const newHist = {
          date: '28/05/25',
          activity: 'Stock Adjustment',
          reference: `SA-25-00${(item.history || []).length + 1}`,
          qty: `${newStockVal - item.availableStock}`,
          updatedBy: 'Chioma Davids'
        };
        return {
          ...item,
          availableStock: newStockVal,
          history: [...(item.history || []), newHist]
        };
      }
      return item;
    }));

    if (viewInventoryModal && viewInventoryModal.itemCode === stockAdjustmentModal.itemCode) {
      setViewInventoryModal(prev => ({
        ...prev,
        availableStock: Number(adjustmentForm.newStock) || prev.availableStock
      }));
    }

    setStockAdjustmentModal(null);
    showToast('Stock balance adjusted and ledger updated', 'success');
  };

  const handleCreateMovementSubmit = () => {
    const created = {
      movementNo: movementForm.movementId || `SM-25-00${movementsList.length + 1}`,
      itemName: movementForm.itemName,
      movementType: movementForm.movementType,
      from: movementForm.fromLocation,
      to: movementForm.toLocation,
      qty: Number(movementForm.quantity) || 1,
      unit: movementForm.unit,
      movementDate: movementForm.movementDate,
      status: 'Pending',
      reorderLevel: '200 Pieces',
      remarks: movementForm.remarks,
      attachments: []
    };

    setMovementsList([created, ...movementsList]);
    setNewMovementModal(false);
    showToast('Stock movement voucher logged successfully', 'success');
  };

  const handleConfirmMovement = (movementNo) => {
    setMovementsList(movementsList.map(m => m.movementNo === movementNo ? { ...m, status: 'Completed' } : m));
    if (viewMovementModal && viewMovementModal.movementNo === movementNo) {
      setViewMovementModal(prev => ({ ...prev, status: 'Completed' }));
    }
    setActiveMenuId(null);
    showToast(`Stock movement ${movementNo} marked as Completed`, 'success');
  };

  const handleConfirmCancelMovement = () => {
    if (!cancelMovementModal) return;
    setMovementsList(movementsList.map(m => m.movementNo === cancelMovementModal.movementNo ? { ...m, status: 'Cancelled' } : m));
    if (viewMovementModal && viewMovementModal.movementNo === cancelMovementModal.movementNo) {
      setViewMovementModal(prev => ({ ...prev, status: 'Cancelled' }));
    }
    setCancelMovementModal(null);
    showToast(`Stock movement ${cancelMovementModal.movementNo} cancelled`, 'warning');
  };

  // Tab 1 Columns: Material Receiving (MRN / Goods Receipts)
  const receivingColumns = [
    {
      key: 'mrnNo',
      label: 'MRN NO',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'poNo',
      label: 'PO NO',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'material',
      label: 'MATERIAL',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'warehouse',
      label: 'WAREHOUSE',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'receiptDate',
      label: 'RECEIPT DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'inspectionStatus',
      label: 'INSPECTION STATUS',
      render: (v) => {
        const style = inspectionStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '4px 14px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            className="icon-btn"
            onClick={() => { setViewReceiptModal(row); setViewReceiptTab('details'); }}
            title="View Goods Receipt Details"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>
        </div>
      )
    }
  ];

  // Tab 2 Columns: Inventory
  const inventoryColumns = [
    {
      key: 'itemCode',
      label: 'ITEM CODE',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'itemName',
      label: 'ITEM NAME',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'availableStock',
      label: 'AVAILABLE STOCK',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'reorderLevel',
      label: 'REORDER LEVEL',
      align: 'center',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'warehouse',
      label: 'WAREHOUSE',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'unit',
      label: 'UNIT',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'lastRestocked',
      label: 'LAST RESTOCKED',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = stockStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '4px 14px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => { setViewInventoryModal(row); setViewInventoryTab('info'); }}
            title="View Stock Details"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => setActiveMenuId(activeMenuId === row.itemCode ? null : row.itemCode)}
              style={{ color: '#64748B', cursor: 'pointer' }}
            >
              <FiMoreVertical size={16} />
            </button>

            {activeMenuId === row.itemCode && (
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
                  width: '160px',
                  textAlign: 'left'
                }}
              >
                <div
                  onClick={() => {
                    setStockAdjustmentModal(row);
                    setAdjustmentForm({ newStock: String(row.availableStock), reason: '' });
                    setActiveMenuId(null);
                  }}
                  style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  className="menu-item-hover"
                >
                  <FiRepeat size={14} color="#1E3A8A" /> Stock Adjustment
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  // Tab 3 Columns: Stock Movements
  const movementColumns = [
    {
      key: 'movementNo',
      label: 'MOVEMENT NO.',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'itemName',
      label: 'ITEM NAME',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'movementType',
      label: 'MOVEMENT TYPE',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'from',
      label: 'FROM',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'to',
      label: 'TO',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'qty',
      label: 'QTY',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'movementDate',
      label: 'MOVEMENT DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = movementStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '4px 14px',
            borderRadius: '14px',
            fontSize: '0.75rem',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setViewMovementModal(row)}
            title="View Movement Voucher"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

          {row.status === 'Pending' && (
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                onClick={() => setActiveMenuId(activeMenuId === row.movementNo ? null : row.movementNo)}
                style={{ color: '#64748B', cursor: 'pointer' }}
              >
                <FiMoreVertical size={16} />
              </button>

              {activeMenuId === row.movementNo && (
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
                    onClick={() => handleConfirmMovement(row.movementNo)}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiCheck size={14} color="#16A34A" /> Complete Movement
                  </div>
                  <div
                    onClick={() => { setCancelMovementModal(row); setActiveMenuId(null); }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiX size={14} color="#DC2626" /> Cancel Movement
                  </div>
                </div>
              )}
            </div>
          )}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Inventory & Warehouse</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage goods receipt, monitor inventory levels, and track warehouse stock movements across all storage locations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setHandoverNoteModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', color: '#2563EB', fontWeight: 600 }}
          >
            QHSE Handover Info
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Stock ledger imported', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Stat Cards matching screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL STOCK ITEMS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{totalStockItems}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Currently available across all warehouses</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiBox size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>GOODS RECEIVED THIS MONTH</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{goodsReceivedMonth}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Receipts successfully posted this month</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>LOW STOCK ITEMS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{lowStockItems}</div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px' }}>Items below their reorder level</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiAlertTriangle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>STOCK MOVEMENT TODAY</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{stockMovementToday}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Recorded today</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
            <FiRepeat size={18} />
          </div>
        </div>
      </div>

      {/* 3 Main Tabs Switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '4px' }}>
        <button
          onClick={() => { setActiveTab('receiving'); setPage(1); }}
          style={{
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'receiving' ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: activeTab === 'receiving' ? '#1E3A8A' : '#64748B'
          }}
        >
          Material Receiving
        </button>
        <button
          onClick={() => { setActiveTab('inventory'); setPage(1); }}
          style={{
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'inventory' ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: activeTab === 'inventory' ? '#1E3A8A' : '#64748B'
          }}
        >
          Inventory
        </button>
        <button
          onClick={() => { setActiveTab('movements'); setPage(1); }}
          style={{
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'movements' ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: activeTab === 'movements' ? '#1E3A8A' : '#64748B'
          }}
        >
          Stock Movements
        </button>
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
              placeholder={
                activeTab === 'receiving' ? 'Search GRN No, Vendor ...' :
                activeTab === 'inventory' ? 'Search by Item code, name...' : 'Search by code, name...'
              }
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
              onClick={() => showToast('Exporting data sheet...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
            </button>

            {activeTab === 'movements' && (
              <button
                className="btn btn-primary"
                onClick={() => setNewMovementModal(true)}
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
                <FiPlus size={16} /> New Stock Movement
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={
              activeTab === 'receiving' ? receivingColumns :
              activeTab === 'inventory' ? inventoryColumns : movementColumns
            }
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.mrnNo || e.itemCode || e.movementNo))}
            keyField={activeTab === 'receiving' ? 'mrnNo' : activeTab === 'inventory' ? 'itemCode' : 'movementNo'}
            emptyMessage="No records found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── VIEW GOODS RECEIPT DETAILS (3 Tabs) ── */}
      {viewReceiptModal && (
        <Modal
          isOpen={!!viewReceiptModal}
          onClose={() => setViewReceiptModal(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewReceiptModal.vendor}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewReceiptModal.mrnNo} • {viewReceiptModal.poNo}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Status:</span>
                <span style={{
                  backgroundColor: inspectionStatusStyles[viewReceiptModal.inspectionStatus]?.bg || '#F1F5F9',
                  color: inspectionStatusStyles[viewReceiptModal.inspectionStatus]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewReceiptModal.inspectionStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '6px' }}>
              <button
                onClick={() => setViewReceiptTab('details')}
                style={{
                  padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: viewReceiptTab === 'details' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewReceiptTab === 'details' ? '#1E3A8A' : '#64748B'
                }}
              >
                Receipt Details
              </button>
              <button
                onClick={() => setViewReceiptTab('materials')}
                style={{
                  padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: viewReceiptTab === 'materials' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewReceiptTab === 'materials' ? '#1E3A8A' : '#64748B'
                }}
              >
                Materials Received
              </button>
              <button
                onClick={() => setViewReceiptTab('documents')}
                style={{
                  padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: viewReceiptTab === 'documents' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewReceiptTab === 'documents' ? '#1E3A8A' : '#64748B'
                }}
              >
                Documents
              </button>
            </div>

            {viewReceiptTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERY REFERENCE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.deliveryRef}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PURCHASE ORDER NO</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.poNo}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED RFQ NO</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.linkedRFQ}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.vendor}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED PROJECT</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.linkedProject}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MATERIAL</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.material}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>WAREHOUSE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.warehouse}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>RECEIPT DATE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewReceiptModal.receiptDate}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                    INSPECTION NOTES
                  </div>
                  <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                    {viewReceiptModal.inspectionNotes}
                  </p>
                </div>
              </div>
            )}

            {viewReceiptTab === 'materials' && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Ordered Qty</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Received Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewReceiptModal.materialsReceived || []).map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 500 }}>{m.description}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', color: '#334155' }}>{m.orderedQty}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', color: '#16A34A', fontWeight: 700 }}>{m.receivedQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewReceiptTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(viewReceiptModal.documents || []).map((doc, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.813rem', color: '#334155' }}>
                      <FiPaperclip size={16} color="#64748B" />
                      <span>{doc.name} ({doc.size})</span>
                    </div>
                    <button className="icon-btn" onClick={() => showToast(`Downloading ${doc.name}`, 'success')}>
                      <FiDownloadCloud size={16} color="#2563EB" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── VIEW INVENTORY DETAILS (Stock Info & Inventory History Tabs) ── */}
      {viewInventoryModal && (
        <Modal
          isOpen={!!viewInventoryModal}
          onClose={() => setViewInventoryModal(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewInventoryModal.itemName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewInventoryModal.itemCode} • PO-25-001
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Status:</span>
                <span style={{
                  backgroundColor: stockStatusStyles[viewInventoryModal.status]?.bg || '#F1F5F9',
                  color: stockStatusStyles[viewInventoryModal.status]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewInventoryModal.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '6px' }}>
              <button
                onClick={() => setViewInventoryTab('info')}
                style={{
                  padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: viewInventoryTab === 'info' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewInventoryTab === 'info' ? '#1E3A8A' : '#64748B'
                }}
              >
                Stock Information
              </button>
              <button
                onClick={() => setViewInventoryTab('history')}
                style={{
                  padding: '10px 24px', fontWeight: 600, fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer',
                  borderBottom: viewInventoryTab === 'history' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewInventoryTab === 'history' ? '#1E3A8A' : '#64748B'
                }}
              >
                Inventory History
              </button>
            </div>

            {viewInventoryTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px',
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ITEM CODE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.itemCode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ITEM NAME</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.itemName}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CATEGORY</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.category}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>WAREHOUSE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.warehouse}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CURRENT STOCK</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3A8A', marginTop: '4px' }}>{viewInventoryModal.availableStock} {viewInventoryModal.unit}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REORDER LEVEL</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.reorderLevel} {viewInventoryModal.unit}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATUS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.status}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LAST UPDATED</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewInventoryModal.lastRestocked}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
                    ATTACHMENTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(viewInventoryModal.attachments || []).map((att, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                          <FiPaperclip size={14} color="#64748B" />
                          <span>{att.name}</span>
                        </div>
                        <button className="icon-btn" onClick={() => showToast(`Downloading ${att.name}`, 'success')}>
                          <FiDownloadCloud size={15} color="#2563EB" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewInventoryTab === 'history' && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Activity</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Reference</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Qty.</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Updated By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewInventoryModal.history || []).map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{h.date}</td>
                        <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 500 }}>{h.activity}</td>
                        <td style={{ padding: '12px 16px', color: '#1E3A8A', fontWeight: 600 }}>{h.reference}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 700, color: h.qty.startsWith('+') ? '#16A34A' : '#DC2626' }}>
                          {h.qty}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 16px', color: '#475569' }}>{h.updatedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── STOCK ADJUSTMENT MODAL ── */}
      {stockAdjustmentModal && (
        <Modal
          isOpen={!!stockAdjustmentModal}
          onClose={() => setStockAdjustmentModal(null)}
          title="Stock Adjustment"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
              Update the available stock for {stockAdjustmentModal.itemCode}
            </p>

            <FormField label="ITEM NAME *">
              <Input value={stockAdjustmentModal.itemName} disabled />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <FormField label="CURRENT STOCK *">
                <Input value={stockAdjustmentModal.availableStock} disabled />
              </FormField>
              <FormField label="NEW STOCK *" required>
                <Input
                  type="number"
                  value={adjustmentForm.newStock}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, newStock: e.target.value })}
                />
              </FormField>
              <FormField label="UNIT *">
                <Input value={stockAdjustmentModal.unit} disabled />
              </FormField>
            </div>

            <FormField label="REASON FOR ADJUSTMENT *">
              <textarea
                className="form-input"
                rows={3}
                value={adjustmentForm.reason}
                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
              />
            </FormField>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
                ATTACH DOCUMENT (OPTIONAL)
              </label>
              <div
                style={{
                  border: '1.5px dashed #CBD5E1', borderRadius: '8px', padding: '18px',
                  textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer'
                }}
                onClick={() => showToast('Attachment dialog open', 'info')}
              >
                <FiUpload size={20} color="#64748B" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setStockAdjustmentModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStockAdjustmentSubmit}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── NEW STOCK MOVEMENT MODAL ── */}
      <Modal
        isOpen={newMovementModal}
        onClose={() => setNewMovementModal(false)}
        title="New Stock Movement"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Track material movements across warehouses and project sites
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="MOVEMENT ID *" required>
              <Input
                value={movementForm.movementId}
                onChange={(e) => setMovementForm({ ...movementForm, movementId: e.target.value })}
              />
            </FormField>
            <FormField label="ITEM NAME *" required>
              <Input
                value={movementForm.itemName}
                onChange={(e) => setMovementForm({ ...movementForm, itemName: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="MOVEMENT TYPE *" required>
              <select
                className="form-input"
                value={movementForm.movementType}
                onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value })}
              >
                <option value="Material Issue">Material Issue</option>
                <option value="Warehouse Transfer">Warehouse Transfer</option>
                <option value="Material Return">Material Return</option>
              </select>
            </FormField>
            <FormField label="FROM LOCATION *" required>
              <select
                className="form-input"
                value={movementForm.fromLocation}
                onChange={(e) => setMovementForm({ ...movementForm, fromLocation: e.target.value })}
              >
                {['Main Warehouse', 'Port Harcourt Yard', 'Warri Yard A'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
            <FormField label="TO LOCATION *" required>
              <select
                className="form-input"
                value={movementForm.toLocation}
                onChange={(e) => setMovementForm({ ...movementForm, toLocation: e.target.value })}
              >
                {['LNG Pipeline Project', 'Port Harcourt Yard', 'Main Warehouse', 'Project Site A', 'Warri Yard A'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </FormField>
            <FormField label="QUANTITY *" required>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
              />
            </FormField>
            <FormField label="UNIT *" required>
              <select
                className="form-input"
                value={movementForm.unit}
                onChange={(e) => setMovementForm({ ...movementForm, unit: e.target.value })}
              >
                {['Pieces', 'Tonnes', 'Units', 'Bags'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="MOVEMENT DATE *">
            <Input
              value={movementForm.movementDate}
              onChange={(e) => setMovementForm({ ...movementForm, movementDate: e.target.value })}
              placeholder="DD/MM/YY"
            />
          </FormField>

          <FormField label="REMARKS">
            <textarea
              className="form-input"
              rows={3}
              value={movementForm.remarks}
              onChange={(e) => setMovementForm({ ...movementForm, remarks: e.target.value })}
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #F1F5F9' }}>
            <button className="btn btn-secondary" onClick={() => setNewMovementModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateMovementSubmit}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
            >
              Save Movement
            </button>
          </div>
        </div>
      </Modal>

      {/* ── VIEW MOVEMENT DETAILS MODAL ── */}
      {viewMovementModal && (
        <Modal
          isOpen={!!viewMovementModal}
          onClose={() => setViewMovementModal(null)}
          title=""
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewMovementModal.itemName}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewMovementModal.movementNo}
                </div>
              </div>

              <span style={{
                backgroundColor: movementStatusStyles[viewMovementModal.status]?.bg || '#F1F5F9',
                color: movementStatusStyles[viewMovementModal.status]?.color || '#64748B',
                padding: '4px 14px',
                borderRadius: '14px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                {viewMovementModal.status}
              </span>
            </div>

            <div style={{
              backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '20px',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MOVEMENT ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.movementNo}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ITEM NAME</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.itemName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MOVEMENT TYPE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.movementType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>FROM LOCATION</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.from}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>TO LOCATION</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.to}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REORDER LEVEL</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.reorderLevel || '200 Pieces'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MOVEMENT DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.movementDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATUS</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewMovementModal.status}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                REMARKS
              </div>
              <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                {viewMovementModal.remarks || 'No remarks entered.'}
              </p>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '10px' }}>
                ATTACHMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {([
                  { name: 'Material_Issue_Voucher_MI-25-011.pdf' },
                  { name: 'Approved_Material_Request_Form.pdf' }
                ]).map((att, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{att.name}</span>
                    </div>
                    <button className="icon-btn" onClick={() => showToast(`Downloading ${att.name}`, 'success')}>
                      <FiDownloadCloud size={15} color="#2563EB" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── CANCEL STOCK MOVEMENT MODAL ── */}
      {cancelMovementModal && (
        <Modal
          isOpen={!!cancelMovementModal}
          onClose={() => setCancelMovementModal(null)}
          title=""
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '-10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Cancel Stock Movement
            </h3>
            <p style={{ margin: 0, fontSize: '0.813rem', color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to cancel this stock movement? This movement will not affect inventory balances.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#334155' }}>
              <div><strong>MOVEMENT ID:</strong> {cancelMovementModal.movementNo}</div>
              <div><strong>ITEM NAME:</strong> {cancelMovementModal.itemName}</div>
            </div>

            <FormField label="REASON FOR CANCELLATION">
              <textarea
                className="form-input"
                rows={2}
                value={cancelMovementReason}
                onChange={(e) => setCancelMovementReason(e.target.value)}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setCancelMovementModal(null)}>
                Cancel
              </button>
              <button
                onClick={handleConfirmCancelMovement}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── QHSE / DEVELOPER HANDOVER NOTE MODAL ── */}
      {handoverNoteModal && (
        <Modal
          isOpen={handoverNoteModal}
          onClose={() => setHandoverNoteModal(false)}
          title="Developer Handover Note"
          size="md"
        >
          <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong>Materials Received & QHSE Inspection:</strong>
              <p style={{ margin: '4px 0 0 0' }}>
                Materials Received is recorded under Procurement as a view/repository of incoming deliveries. The QHSE team is responsible for the physical quantity and quality inspection at the delivery location and for recording the inspection outcome, notes, and supporting documents.
              </p>
            </div>

            <div>
              <strong>Inspection Outcomes:</strong>
              <ul style={{ paddingLeft: '20px', margin: '6px 0 0 0' }}>
                <li><strong>Pending</strong> → inspection has not been completed.</li>
                <li><strong>Passed</strong> → quantity and quality requirements are satisfied. Accepted materials automatically become available for Inventory/Warehouse.</li>
                <li><strong>Failed</strong> → quantity or quality requirements are not satisfied. Materials are not added to available inventory.</li>
              </ul>
            </div>

            <p style={{ margin: 0 }}>
              QHSE inspection records, including notes and supporting evidence, remain permanently linked to the original Materials Received/delivery record for end-to-end traceability.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
              <button className="btn btn-primary" onClick={() => setHandoverNoteModal(false)} style={{ backgroundColor: '#1E3A8A' }}>
                Close Handover Note
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
