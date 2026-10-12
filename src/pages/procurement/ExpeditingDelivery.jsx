import React, { useState } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiEye, FiMoreVertical,
  FiTruck, FiCheckCircle, FiClock, FiAlertTriangle, FiPaperclip, FiDownloadCloud
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockDeliveries } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;

const deliveryStatusStyles = {
  'In Transit':          { bg: '#E0F2FE', color: '#0284C7' },
  'Delivered':           { bg: '#DCFCE7', color: '#16A34A' },
  'In Production':       { bg: '#FEF3C7', color: '#D97706' },
  'Delayed':             { bg: '#FEE2E2', color: '#DC2626' },
  'Ready for Shipment':  { bg: '#EDE9FE', color: '#7C3AED' },
  'Customs Clearance':   { bg: '#FEF3C7', color: '#D97706' }
};

export default function ExpeditingDelivery() {
  const [data, setData] = useState(mockDeliveries);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers state
  const [statusUpdateItem, setStatusUpdateItem] = useState(null);
  const [newStatus, setNewStatus] = useState('In Production');
  const [statusNote, setStatusNote] = useState('');

  const [viewItem, setViewItem] = useState(null);
  const [viewTab, setViewTab] = useState('details'); // 'details' | 'timeline' | 'documents'

  const { toast, showToast, hideToast } = useToast();

  const activeDeliveries = data.filter(d => d.status !== 'Delivered').length;
  const dueThisWeek = 8;
  const onTimeRate = '91%';
  const delayedDeliveries = data.filter(d => d.status === 'Delayed').length || 3;

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return !q ||
      item.deliveryRef.toLowerCase().includes(q) ||
      item.poNo.toLowerCase().includes(q) ||
      item.vendor.toLowerCase().includes(q) ||
      item.material.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleUpdateStatus = () => {
    if (!statusUpdateItem) return;

    const updated = data.map(d => {
      if (d.deliveryRef === statusUpdateItem.deliveryRef) {
        const newEntry = {
          status: newStatus,
          date: `28/05/2025 • Just now — ${statusNote || 'Status updated'}`,
          done: true
        };
        const currentTimeline = d.timeline || [];
        return {
          ...d,
          status: newStatus,
          timeline: [...currentTimeline, newEntry]
        };
      }
      return d;
    });

    setData(updated);
    if (viewItem && viewItem.deliveryRef === statusUpdateItem.deliveryRef) {
      setViewItem(prev => ({ ...prev, status: newStatus }));
    }
    setStatusUpdateItem(null);
    setStatusNote('');
    showToast(`Delivery status updated to ${newStatus}`, 'success');
  };

  const columns = [
    {
      key: 'deliveryRef',
      label: 'DELIVERY REF',
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
      key: 'expectedDelivery',
      label: 'EXPECTED DELIVERY',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = deliveryStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
            onClick={() => { setViewItem(row); setViewTab('details'); }}
            title="View Delivery Details"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setStatusUpdateItem(row);
              setNewStatus(row.status || 'In Production');
            }}
            title="Update Delivery Status"
            style={{ color: '#1E3A8A', cursor: 'pointer' }}
          >
            <FiMoreVertical size={16} />
          </button>
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Expediting & Delivery</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track vendor fulfilment, shipment progress, and scheduled deliveries to ensure materials arrive on time
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Delivery tracking file imported', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Metric Cards matching screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>ACTIVE DELIVERIES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{activeDeliveries}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Deliveries currently being monitored</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiTruck size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>DUE THIS WEEK</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{dueThisWeek}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Scheduled to arrive within next 7 days</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiClock size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>ON-TIME DELIVERY RATE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{onTimeRate}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Deliveries completed on schedule</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>DELAYED DELIVERIES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{delayedDeliveries}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>Past the expected delivery date</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <FiAlertTriangle size={18} />
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
              placeholder="Search Delivery Ref, Type ..."
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
              onClick={() => showToast('Exporting delivery status logs...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
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
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.deliveryRef))}
            keyField="deliveryRef"
            emptyMessage="No delivery tracking records found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── UPDATE DELIVERY STATUS MODAL ── */}
      {statusUpdateItem && (
        <Modal
          isOpen={!!statusUpdateItem}
          onClose={() => setStatusUpdateItem(null)}
          title="Update Delivery Status"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.813rem', color: '#64748B' }}>
              Current Status: <strong style={{ color: '#D97706' }}>{statusUpdateItem.status}</strong>
            </div>

            <FormField label="DELIVERY STATUS *" required>
              <select
                className="form-input"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {['In Production', 'Ready for Shipment', 'Customs Clearance', 'In Transit', 'Delivered', 'Delayed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>

            <FormField label="UPDATE NOTE">
              <textarea
                className="form-input"
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Enter update details..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setStatusUpdateItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateStatus}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '6px' }}
              >
                Update
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW DELIVERY DETAILS MODAL (3 Tabs: Delivery Details, Delivery Timeline, Documents) ── */}
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
                  <FiTruck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {viewItem.vendor}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    {viewItem.deliveryRef} • {viewItem.poNo}
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Status:</span>
                <span style={{
                  backgroundColor: deliveryStatusStyles[viewItem.status]?.bg || '#F1F5F9',
                  color: deliveryStatusStyles[viewItem.status]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewItem.status}
                </span>
              </div>
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
                Delivery Details
              </button>
              <button
                onClick={() => setViewTab('timeline')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'timeline' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewTab === 'timeline' ? '#1E3A8A' : '#64748B'
                }}
              >
                Delivery Timeline
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

            {/* Tab 1: Delivery Details */}
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
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERY REFERENCE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.deliveryRef}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PURCHASE ORDER NO</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.poNo}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED RFQ NO</div>
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
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>MATERIAL</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.material}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>QUANTITY</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.quantity || '120 Pieces'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EXPECTED DELIVERY DATE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.expectedDelivery}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERY LOCATION</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.deliveryLocation || 'PGSL Port Harcourt Yard'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATUS</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.status}</div>
                </div>
              </div>
            )}

            {/* Tab 2: Delivery Timeline matching screenshot */}
            {viewTab === 'timeline' && (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '24px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '16px' }}>
                  DELIVERY TIMELINE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {(viewItem.timeline || []).map((tl, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%',
                        backgroundColor: tl.done ? '#10B981' : tl.active ? '#3B82F6' : tl.delayed ? '#EF4444' : '#E2E8F0',
                        marginTop: '4px', flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>
                          {tl.status}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          {tl.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
}
