import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiCheckCircle, FiPaperclip, FiDownloadCloud, FiFileText,
  FiShoppingBag, FiTruck, FiAlertTriangle
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockPurchaseOrderTracking } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;
const fmtCurrency = (n) => '₦' + Number(n).toLocaleString();

const poStatusStyles = {
  'Awarded':       { bg: '#EDE9FE', color: '#7C3AED' },
  'Acknowledged':  { bg: '#DCFCE7', color: '#16A34A' },
  'Cancelled':     { bg: '#FEE2E2', color: '#DC2626' },
  'Issued':        { bg: '#E0F2FE', color: '#0284C7' }
};

export default function PurchaseOrders() {
  const [data, setData] = useState(mockPurchaseOrderTracking);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewTab, setViewTab] = useState('details'); // 'details' | 'items' | 'documents'
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

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

  // Form states for New PO
  const [newPO, setNewPO] = useState({
    poNo: 'PO-25-010',
    linkedRFQ: 'P-RFQ-25-001',
    vendor: 'Prime Steel Solutions',
    linkedProject: 'LNG Expansion Project',
    category: 'Office Supplies',
    poValue: '45200000',
    poDate: '29/04/26',
    deliveryDue: '29/05/26',
    deliveryLocation: 'PGSL Port Harcourt Yard',
    paymentTerms: 'Advanced Payment',
    items: [
      { item: 'Structural Steel Beam IPE300', quantity: 25, unit: 'Tonnes' }
    ],
    documents: [
      { name: 'Technical Specification.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' }
    ]
  });

  const totalActivePOs = data.filter(p => p.status !== 'Cancelled').length;
  const pendingAcceptance = 8;
  const deliveredOrders = 17;
  const overdueDeliveries = 3;

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return !q ||
      item.poNo.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreateSubmit = () => {
    const created = {
      poNo: newPO.poNo || `PO-25-0${data.length + 1}`,
      vendor: newPO.vendor,
      linkedRFQ: newPO.linkedRFQ,
      category: newPO.category,
      poValue: Number(newPO.poValue) || 0,
      poDate: newPO.poDate,
      deliveryDue: newPO.deliveryDue,
      status: 'Issued',
      linkedProject: newPO.linkedProject,
      deliveryLocation: newPO.deliveryLocation,
      paymentTerms: newPO.paymentTerms,
      orderedItems: newPO.items.map(it => ({
        description: it.item,
        qty: Number(it.quantity) || 1,
        unit: it.unit,
        unitPrice: 1200000,
        total: (Number(it.quantity) || 1) * 1200000
      })),
      documents: newPO.documents
    };

    setData([created, ...data]);
    setCreateModal(false);
    showToast('Purchase Order created and issued to vendor', 'success');
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setData(data.map(p => p.poNo === editItem.poNo ? editItem : p));
    setEditItem(null);
    showToast('Purchase Order updated successfully', 'success');
  };

  const handleMarkAcknowledged = (poNo) => {
    setData(data.map(p => p.poNo === poNo ? { ...p, status: 'Acknowledged' } : p));
    if (viewItem && viewItem.poNo === poNo) {
      setViewItem(prev => ({ ...prev, status: 'Acknowledged' }));
    }
    setActiveMenuId(null);
    showToast(`Purchase Order ${poNo} marked as acknowledged by vendor`, 'success');
  };

  const handleConfirmCancel = () => {
    if (!cancelModal) return;
    setData(data.map(p => p.poNo === cancelModal.poNo ? { ...p, status: 'Cancelled' } : p));
    if (viewItem && viewItem.poNo === cancelModal.poNo) {
      setViewItem(prev => ({ ...prev, status: 'Cancelled' }));
    }
    setCancelModal(null);
    setCancelReason('');
    showToast(`Purchase Order ${cancelModal.poNo} cancelled`, 'warning');
  };

  const columns = [
    {
      key: 'poNo',
      label: 'PO NO',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'linkedRFQ',
      label: 'LINKED RFQ / RFP',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'poValue',
      label: 'PO VALUE',
      render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{fmtCurrency(v)}</span>
    },
    {
      key: 'poDate',
      label: 'PO DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'deliveryDue',
      label: 'DELIVERY DUE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = poStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
            onClick={() => { setViewItem(row); setViewTab('details'); }}
            title="View Purchase Order"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

          {row.status !== 'Cancelled' && (
            <div style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                onClick={() => setActiveMenuId(activeMenuId === row.poNo ? null : row.poNo)}
                style={{ color: '#64748B', cursor: 'pointer' }}
              >
                <FiMoreVertical size={16} />
              </button>

              {activeMenuId === row.poNo && (
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
                    width: '190px',
                    textAlign: 'left'
                  }}
                >
                  <div
                    onClick={() => { setEditItem(row); setActiveMenuId(null); }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiEdit size={14} color="#64748B" /> Edit Purchase Order
                  </div>
                  {row.status !== 'Acknowledged' && (
                    <div
                      onClick={() => handleMarkAcknowledged(row.poNo)}
                      style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      className="menu-item-hover"
                    >
                      <FiCheck size={14} color="#16A34A" /> Mark as Acknowledged
                    </div>
                  )}
                  <div
                    onClick={() => { setCancelModal(row); setActiveMenuId(null); }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiX size={14} color="#DC2626" /> Cancel Purchase Order
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Purchase Order Tracking</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track purchase orders from issuance to vendor delivery and completion
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Import template ready', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE PURCHASE ORDER</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{totalActivePOs}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>+4 this week</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiFileText size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>PENDING VENDOR ACCEPTANCE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{pendingAcceptance}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Awaiting confirmation</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiAlertTriangle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>DELIVERED ORDERS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{deliveredOrders}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Completed this month</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>OVERDUE DELIVERIES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{overdueDeliveries}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>Require follow-up</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <FiX size={18} />
          </div>
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
              placeholder="Search PO No, Type ..."
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
              onClick={() => showToast('Exporting PO register...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCreateModal(true)}
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
              <FiPlus size={16} /> Create PO
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
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.poNo))}
            keyField="poNo"
            emptyMessage="No purchase orders found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── CREATE PURCHASE ORDER MODAL ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create Purchase Order"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Create a purchase order for goods or services.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="PURCHASE ORDER NO">
              <Input
                value={newPO.poNo}
                onChange={(e) => setNewPO({ ...newPO, poNo: e.target.value })}
              />
            </FormField>
            <FormField label="LINKED RFQ (OPTIONAL)">
              <Input
                value={newPO.linkedRFQ}
                onChange={(e) => setNewPO({ ...newPO, linkedRFQ: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="VENDOR *" required>
            <select
              className="form-input"
              value={newPO.vendor}
              onChange={(e) => setNewPO({ ...newPO, vendor: e.target.value })}
            >
              {['Prime Steel Solutions', 'Dangote Steel Ltd.', 'Universal Steel Ltd.', 'African Industries Group', 'Flowline Engineering Ltd.'].map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </FormField>

          <FormField label="LINKED PROJECT *" required>
            <select
              className="form-input"
              value={newPO.linkedProject}
              onChange={(e) => setNewPO({ ...newPO, linkedProject: e.target.value })}
            >
              {['LNG Expansion Project', 'Offshore Safety Upgrade', 'HQ Facility Upgrade', 'Bonny Terminal Operations'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
            <FormField label="PROCUREMENT CATEGORY *" required>
              <select
                className="form-input"
                value={newPO.category}
                onChange={(e) => setNewPO({ ...newPO, category: e.target.value })}
              >
                {['Materials', 'Equipment', 'Services', 'Office Supplies', 'Spare Parts', 'IT Equipment'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="PURCHASE ORDER VALUE (₦) *" required>
              <Input
                type="number"
                value={newPO.poValue}
                onChange={(e) => setNewPO({ ...newPO, poValue: e.target.value })}
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="PURCHASE ORDER DATE *" required>
              <Input
                value={newPO.poDate}
                onChange={(e) => setNewPO({ ...newPO, poDate: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>
            <FormField label="EXPECTED DELIVERY DATE *" required>
              <Input
                value={newPO.deliveryDue}
                onChange={(e) => setNewPO({ ...newPO, deliveryDue: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="DELIVERY LOCATION *" required>
              <Input
                value={newPO.deliveryLocation}
                onChange={(e) => setNewPO({ ...newPO, deliveryLocation: e.target.value })}
              />
            </FormField>
            <FormField label="PAYMENT TERMS *" required>
              <Input
                value={newPO.paymentTerms}
                onChange={(e) => setNewPO({ ...newPO, paymentTerms: e.target.value })}
              />
            </FormField>
          </div>

          {/* Specifications */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>Material / Service Specification</span>
              <button
                type="button"
                onClick={() => setNewPO({ ...newPO, items: [...newPO.items, { item: 'Item Name', quantity: 10, unit: 'Pieces' }] })}
                style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                + Add Item
              </button>
            </div>
            {newPO.items.map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <Input
                  value={it.item}
                  onChange={(e) => {
                    const items = [...newPO.items];
                    items[idx].item = e.target.value;
                    setNewPO({ ...newPO, items });
                  }}
                  placeholder="Item description"
                />
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => {
                    const items = [...newPO.items];
                    items[idx].quantity = e.target.value;
                    setNewPO({ ...newPO, items });
                  }}
                  placeholder="Qty"
                />
                <select
                  className="form-input"
                  value={it.unit}
                  onChange={(e) => {
                    const items = [...newPO.items];
                    items[idx].unit = e.target.value;
                    setNewPO({ ...newPO, items });
                  }}
                >
                  <option value="Tonnes">Tonnes</option>
                  <option value="Pieces">Pieces</option>
                  <option value="Units">Units</option>
                </select>
              </div>
            ))}
          </div>

          {/* Attach Document */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
              ATTACH DOCUMENT (OPTIONAL)
            </label>
            <div
              style={{
                border: '1.5px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer'
              }}
              onClick={() => showToast('Attachment browser open', 'info')}
            >
              <FiUpload size={22} color="#64748B" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG. up to 50MB</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateSubmit}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '8px' }}
            >
              Create PO
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT PURCHASE ORDER MODAL ── */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit Purchase Order"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="PURCHASE ORDER NO">
                <Input value={editItem.poNo} disabled />
              </FormField>
              <FormField label="LINKED RFQ">
                <Input
                  value={editItem.linkedRFQ || ''}
                  onChange={(e) => setEditItem({ ...editItem, linkedRFQ: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="VENDOR *" required>
              <Input
                value={editItem.vendor}
                onChange={(e) => setEditItem({ ...editItem, vendor: e.target.value })}
              />
            </FormField>

            <FormField label="LINKED PROJECT">
              <Input
                value={editItem.linkedProject || ''}
                onChange={(e) => setEditItem({ ...editItem, linkedProject: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="PROCUREMENT CATEGORY">
                <Input
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                />
              </FormField>
              <FormField label="PURCHASE ORDER VALUE (₦)">
                <Input
                  type="number"
                  value={editItem.poValue}
                  onChange={(e) => setEditItem({ ...editItem, poValue: Number(e.target.value) })}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="EXPECTED DELIVERY DATE">
                <Input
                  value={editItem.deliveryDue}
                  onChange={(e) => setEditItem({ ...editItem, deliveryDue: e.target.value })}
                />
              </FormField>
              <FormField label="DELIVERY LOCATION">
                <Input
                  value={editItem.deliveryLocation || ''}
                  onChange={(e) => setEditItem({ ...editItem, deliveryLocation: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSave}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '8px' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW PURCHASE ORDER MODAL (3 Tabs: PO Details, Ordered Items, Documents) ── */}
      {viewItem && (
        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '10px', backgroundColor: '#EFF6FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8'
                }}>
                  <FiShoppingBag size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {viewItem.vendor}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    {viewItem.poNo} • {viewItem.linkedRFQ || 'Direct PO'}
                  </div>
                </div>
              </div>

              {/* Status Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {viewItem.status !== 'Acknowledged' && viewItem.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleMarkAcknowledged(viewItem.poNo)}
                    style={{
                      backgroundColor: '#16A34A', color: '#fff', border: 'none', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                      alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <FiCheck size={14} /> Acknowledged
                  </button>
                )}
                {viewItem.status !== 'Cancelled' && (
                  <>
                    <button
                      onClick={() => setCancelModal(viewItem)}
                      style={{
                        backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiX size={14} /> Cancel PO
                    </button>
                    <button
                      onClick={() => { setEditItem(viewItem); setViewItem(null); }}
                      style={{
                        backgroundColor: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiEdit size={14} /> Edit PO
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
              <span>Status:</span>
              <span style={{
                backgroundColor: poStatusStyles[viewItem.status]?.bg || '#F1F5F9',
                color: poStatusStyles[viewItem.status]?.color || '#64748B',
                padding: '3px 12px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {viewItem.status}
              </span>
            </div>

            {/* 3 Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '6px' }}>
              <button
                onClick={() => setViewTab('details')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'details' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewTab === 'details' ? '#1E3A8A' : '#64748B'
                }}
              >
                PO Details
              </button>
              <button
                onClick={() => setViewTab('items')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'items' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewTab === 'items' ? '#1E3A8A' : '#64748B'
                }}
              >
                Ordered Items
              </button>
              <button
                onClick={() => setViewTab('documents')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'documents' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewTab === 'documents' ? '#1E3A8A' : '#64748B'
                }}
              >
                Documents
              </button>
            </div>

            {/* Tab 1: PO Details */}
            {viewTab === 'details' && (
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PURCHASE ORDER NO</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.poNo}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED RFQ</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.linkedRFQ || '—'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.vendor}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED PROJECT</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.linkedProject || 'LNG Expansion Project'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PROCUREMENT CATEGORY</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PURCHASE ORDER VALUE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3A8A', marginTop: '4px' }}>{fmtCurrency(viewItem.poValue)}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ISSUE DATE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.poDate}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EXPECTED DELIVERY DATE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.deliveryDue}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERY LOCATION</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.deliveryLocation || 'PGSL Port Harcourt Yard'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PAYMENT TERMS</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.paymentTerms || '30 Days After Invoice'}</div>
                </div>
              </div>
            )}

            {/* Tab 2: Ordered Items */}
            {viewTab === 'items' && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Qty</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Unit</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Unit Price</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewItem.orderedItems && viewItem.orderedItems.length > 0) ? (
                      viewItem.orderedItems.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 500 }}>{it.description}</td>
                          <td style={{ textAlign: 'center', padding: '12px 16px', color: '#334155' }}>{it.qty}</td>
                          <td style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B' }}>{it.unit}</td>
                          <td style={{ textAlign: 'right', padding: '12px 16px', color: '#334155' }}>{fmtCurrency(it.unitPrice)}</td>
                          <td style={{ textAlign: 'right', padding: '12px 16px', color: '#0F172A', fontWeight: 600 }}>{fmtCurrency(it.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No line items recorded.</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                      <td colSpan={4} style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase' }}>TOTAL PO VALUE</td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 800, color: '#1E3A8A', fontSize: '0.95rem' }}>
                        {fmtCurrency(viewItem.poValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Tab 3: Documents */}
            {viewTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(viewItem.documents && viewItem.documents.length > 0) ? (
                  viewItem.documents.map((doc, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.813rem', color: '#334155' }}>
                        <FiPaperclip size={16} color="#64748B" />
                        <span>{doc.name} ({doc.size})</span>
                      </div>
                      <button
                        className="icon-btn"
                        onClick={() => showToast(`Downloading ${doc.name}`, 'success')}
                      >
                        <FiDownloadCloud size={16} color="#2563EB" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>No attached documents.</div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── CANCEL PURCHASE ORDER CONFIRMATION MODAL ── */}
      {cancelModal && (
        <Modal
          isOpen={!!cancelModal}
          onClose={() => setCancelModal(null)}
          title=""
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '-10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Cancel Purchase Order?
            </h3>
            <p style={{ margin: 0, fontSize: '0.813rem', color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to cancel {cancelModal.poNo}? This purchase order will be marked as cancelled and can no longer be used for procurement or warehouse processing.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#334155' }}>
              <div><strong>Vendor:</strong> {cancelModal.vendor}</div>
              <div><strong>PO NO:</strong> {cancelModal.poNo}</div>
            </div>

            <FormField label="REASON FOR DEACTIVATION">
              <textarea
                className="form-input"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter commentary..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setCancelModal(null)}>
                Cancel
              </button>
              <button
                onClick={handleConfirmCancel}
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
    </div>
  );
}
