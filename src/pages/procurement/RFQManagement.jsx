import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiCheckCircle, FiPaperclip, FiDownloadCloud, FiAward, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockRFQs } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;
const fmtCurrency = (n) => '₦' + Number(n).toLocaleString();

const rfqStatusStyles = {
  'Under Evaluation': { bg: '#FEF3C7', color: '#D97706' },
  'Draft':            { bg: '#F1F5F9', color: '#64748B' },
  'Issued':           { bg: '#E0F2FE', color: '#0284C7' },
  'Awarded':          { bg: '#DCFCE7', color: '#16A34A' },
  'Cancelled':        { bg: '#FEE2E2', color: '#DC2626' }
};

export default function RFQManagement() {
  const [data, setData] = useState(mockRFQs);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers state
  const [createModal, setCreateModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [viewTab, setViewTab] = useState('details'); // 'details' | 'responses'
  const [logResponseModal, setLogResponseModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'close' | 'award' | 'cancel' | 'delete', item, vendor }

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

  // Form states
  const [newRFQ, setNewRFQ] = useState({
    title: 'Supply of Structural Steel Beams',
    type: 'RFQ',
    category: 'Materials',
    relatedRequisition: 'PR-25-008 — Structural Steel Beams',
    issueDate: '22/05/26',
    linkedProject: 'LNG Expansion Project',
    closingDate: '29/05/26',
    deliveryLocation: 'PGSL Port Harcourt Yard',
    paymentTerms: 'Net 30',
    invitedVendors: ['Dangote Steel Ltd.', 'African Industries'],
    items: [{ item: 'Structural Steel Beam IPE300', quantity: 25, unit: 'Tonnes' }],
    documents: [
      { name: 'Technical Specification.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' }
    ]
  });

  const [vendorResponseForm, setVendorResponseForm] = useState({
    vendor: 'Dangote Steel Ltd.',
    quotationNo: 'DSL/QTN/2026/0417',
    date: '29/05/26',
    amount: '45200000',
    currency: 'NGN',
    deliveryPeriod: '21 Days',
    proposedTerms: 'Advance Payment',
    notes: 'Vendor meets all technical requirements. Delivery schedule aligns with project timeline.',
    documents: [
      { name: 'African_Industries_Quotation.pdf', size: '25MB' },
      { name: 'Product Catalogue.pdf', size: '25MB' }
    ]
  });

  const [confirmationComment, setConfirmationComment] = useState('');

  // Metrics KPI counters
  const totalRFQs = data.length;
  const awaitingEval = data.filter(r => r.status === 'Under Evaluation').length;
  const awardedRFQs = data.filter(r => r.status === 'Awarded').length;
  const overdueRFQs = 3; // matching screenshot display

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return !q ||
      item.id.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreateSubmit = (asDraft = false) => {
    const created = {
      id: `P-RFQ-25-00${data.length + 1}`,
      title: newRFQ.title,
      type: newRFQ.type,
      category: newRFQ.category,
      relatedRequisition: newRFQ.relatedRequisition,
      linkedProject: newRFQ.linkedProject,
      issueDate: newRFQ.issueDate,
      closingDate: newRFQ.closingDate,
      deliveryLocation: newRFQ.deliveryLocation,
      paymentTerms: newRFQ.paymentTerms,
      status: asDraft ? 'Draft' : 'Issued',
      vendorsInvited: newRFQ.invitedVendors.length,
      items: newRFQ.items,
      documents: newRFQ.documents,
      responses: []
    };
    setData([created, ...data]);
    setCreateModal(false);
    showToast(asDraft ? 'RFQ saved as draft' : 'RFQ issued successfully', 'success');
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setData(data.map(r => r.id === editItem.id ? editItem : r));
    setEditItem(null);
    showToast('RFQ details updated', 'success');
  };

  const handleSaveVendorResponse = () => {
    if (!logResponseModal) return;
    const resp = {
      vendor: vendorResponseForm.vendor,
      quotationNo: vendorResponseForm.quotationNo,
      date: vendorResponseForm.date,
      amount: Number(vendorResponseForm.amount),
      currency: vendorResponseForm.currency,
      deliveryPeriod: vendorResponseForm.deliveryPeriod,
      proposedTerms: vendorResponseForm.proposedTerms,
      status: 'Compliant',
      notes: vendorResponseForm.notes,
      documents: vendorResponseForm.documents
    };

    const updated = data.map(r => {
      if (r.id === logResponseModal.id) {
        const currResp = r.responses || [];
        const filteredResp = currResp.filter(x => x.vendor !== resp.vendor);
        return { ...r, responses: [...filteredResp, resp], status: 'Under Evaluation' };
      }
      return r;
    });

    setData(updated);
    if (viewItem && viewItem.id === logResponseModal.id) {
      setViewItem({ ...viewItem, responses: [...(viewItem.responses || []).filter(x => x.vendor !== resp.vendor), resp], status: 'Under Evaluation' });
    }
    setLogResponseModal(null);
    showToast(`Quotation logged from ${resp.vendor}`, 'success');
  };

  const executeConfirmationAction = () => {
    if (!confirmModal) return;
    const { type, item, vendor } = confirmModal;

    if (type === 'award') {
      setData(data.map(r => r.id === item.id ? { ...r, status: 'Awarded', awardedVendor: vendor, dateAwarded: '02/06/26' } : r));
      if (viewItem && viewItem.id === item.id) {
        setViewItem(prev => ({ ...prev, status: 'Awarded', awardedVendor: vendor, dateAwarded: '02/06/26' }));
      }
      showToast(`RFQ awarded to ${vendor}`, 'success');
    } else if (type === 'close') {
      setData(data.map(r => r.id === item.id ? { ...r, status: 'Under Evaluation' } : r));
      if (viewItem && viewItem.id === item.id) {
        setViewItem(prev => ({ ...prev, status: 'Under Evaluation' }));
      }
      showToast(`Bidding closed for ${item.id}`, 'info');
    } else if (type === 'cancel') {
      setData(data.map(r => r.id === item.id ? { ...r, status: 'Cancelled' } : r));
      if (viewItem && viewItem.id === item.id) {
        setViewItem(prev => ({ ...prev, status: 'Cancelled' }));
      }
      showToast(`RFQ ${item.id} cancelled`, 'warning');
    } else if (type === 'delete') {
      setData(data.filter(r => r.id !== item.id));
      if (viewItem && viewItem.id === item.id) setViewItem(null);
      showToast(`RFQ ${item.id} deleted permanently`, 'success');
    }

    setConfirmModal(null);
    setConfirmationComment('');
  };

  const columns = [
    {
      key: 'id',
      label: 'RFQ/RFP ID',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'title',
      label: 'TITLE',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'type',
      label: 'RFQ / RFP',
      render: (v) => <span style={{ color: '#475569', fontWeight: 500 }}>{v}</span>
    },
    {
      key: 'category',
      label: 'CATEGORY',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'vendorsInvited',
      label: 'VENDORS INVITED',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 600, color: '#334155' }}>{v}</span>
    },
    {
      key: 'closingDate',
      label: 'CLOSING DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = rfqStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
      render: (_, row) => {
        const isDraft = row.status === 'Draft';
        const isIssued = row.status === 'Issued';
        const isUnderEval = row.status === 'Under Evaluation';

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
            <button
              className="icon-btn"
              onClick={() => { setViewItem(row); setViewTab('details'); }}
              title="View RFQ"
              style={{ color: '#64748B', cursor: 'pointer' }}
            >
              <FiEye size={16} />
            </button>

            {(isDraft || isIssued || isUnderEval) && (
              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => setActiveMenuId(activeMenuId === row.id ? null : row.id)}
                  style={{ color: '#64748B', cursor: 'pointer' }}
                >
                  <FiMoreVertical size={16} />
                </button>

                {activeMenuId === row.id && (
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
                    {isDraft && (
                      <>
                        <div
                          onClick={() => { setEditItem(row); setActiveMenuId(null); }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiEdit size={14} color="#64748B" /> Edit RFQ / RFP
                        </div>
                        <div
                          onClick={() => {
                            setData(data.map(r => r.id === row.id ? { ...r, status: 'Issued' } : r));
                            setActiveMenuId(null);
                            showToast('RFQ submitted and issued to vendors', 'success');
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiCheck size={14} color="#16A34A" /> Submit RFQ / RFP
                        </div>
                        <div
                          onClick={() => {
                            setConfirmModal({ type: 'delete', item: row });
                            setActiveMenuId(null);
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiX size={14} color="#DC2626" /> Delete RFQ / RFP
                        </div>
                      </>
                    )}

                    {isIssued && (
                      <>
                        <div
                          onClick={() => { setLogResponseModal(row); setActiveMenuId(null); }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiPlus size={14} color="#2563EB" /> Vendor Response
                        </div>
                        <div
                          onClick={() => {
                            setConfirmModal({ type: 'close', item: row });
                            setActiveMenuId(null);
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiCheck size={14} color="#16A34A" /> Close Bidding
                        </div>
                        <div
                          onClick={() => {
                            setConfirmModal({ type: 'cancel', item: row });
                            setActiveMenuId(null);
                          }}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiX size={14} color="#DC2626" /> Cancel RFQ
                        </div>
                      </>
                    )}

                    {isUnderEval && (
                      <div
                        onClick={() => {
                          setConfirmModal({ type: 'cancel', item: row });
                          setActiveMenuId(null);
                        }}
                        style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        className="menu-item-hover"
                      >
                        <FiX size={14} color="#DC2626" /> Cancel RFQ
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>RFQ / RFP Management</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage vendor sourcing, quotations, evaluations, and contract awards from one place
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Import file upload ready', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Stat Cards matching exact screenshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL RFQS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{totalRFQs}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>+3 this week</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiFileText size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>AWAITING EVALUATION</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{awaitingEval}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>2 closed today</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>AWARDED RFQS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{awardedRFQs}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>+5 this month</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiAward size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>OVERDUE RFQS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{overdueRFQs}</div>
            <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>Require attention</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <FiX size={18} />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search RFQ/RFP Id, Title ..."
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
              onClick={() => showToast('Exporting RFQ report...', 'success')}
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
              <FiPlus size={16} /> Create RFQ / RFP
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
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id"
            emptyMessage="No RFQ or RFP records found."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── CREATE RFQ / RFP MODAL ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Create RFQ / RFP"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Create a sourcing request for approved procurement requirements.
          </p>

          <FormField label="RFQ TITLE *" required>
            <Input
              value={newRFQ.title}
              onChange={(e) => setNewRFQ({ ...newRFQ, title: e.target.value })}
              placeholder="e.g. Supply of Structural Steel Beams"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="RFQ / RFP *" required>
              <select
                className="form-input"
                value={newRFQ.type}
                onChange={(e) => setNewRFQ({ ...newRFQ, type: e.target.value })}
              >
                <option value="RFQ">RFQ</option>
                <option value="RFP">RFP</option>
              </select>
            </FormField>

            <FormField label="RELATED REQUISITIONS *" required>
              <select
                className="form-input"
                value={newRFQ.relatedRequisition}
                onChange={(e) => setNewRFQ({ ...newRFQ, relatedRequisition: e.target.value })}
              >
                <option value="PR-25-008 — Structural Steel Beams">PR-25-008 — Structural Steel Beams</option>
                <option value="PR-25-001 — Safety Helmets">PR-25-001 — Safety Helmets</option>
                <option value="PR-25-002 — Pressure Gauges">PR-25-002 — Pressure Gauges</option>
                <option value="PR-25-005 — Office Chairs">PR-25-005 — Office Chairs</option>
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="PROCUREMENT CATEGORY *" required>
              <select
                className="form-input"
                value={newRFQ.category}
                onChange={(e) => setNewRFQ({ ...newRFQ, category: e.target.value })}
              >
                {['Materials', 'Equipment', 'Services', 'PPE', 'Spare Parts', 'Office Supplies', 'IT Equipment'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>

            <FormField label="ISSUE DATE">
              <Input
                value={newRFQ.issueDate}
                onChange={(e) => setNewRFQ({ ...newRFQ, issueDate: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="LINKED PROJECT">
            <select
              className="form-input"
              value={newRFQ.linkedProject}
              onChange={(e) => setNewRFQ({ ...newRFQ, linkedProject: e.target.value })}
            >
              {['LNG Expansion Project', 'Offshore Safety Upgrade', 'HQ Facility Upgrade', 'Bonny Terminal Operations'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              ⓘ Select a project if this request is project-specific.
            </span>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="CLOSING DATE *" required>
              <Input
                value={newRFQ.closingDate}
                onChange={(e) => setNewRFQ({ ...newRFQ, closingDate: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>

            <FormField label="DELIVERY LOCATION *" required>
              <Input
                value={newRFQ.deliveryLocation}
                onChange={(e) => setNewRFQ({ ...newRFQ, deliveryLocation: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="PAYMENT TERMS *" required>
            <Input
              value={newRFQ.paymentTerms}
              onChange={(e) => setNewRFQ({ ...newRFQ, paymentTerms: e.target.value })}
              placeholder="e.g. Net 30"
            />
          </FormField>

          {/* Invite Vendors Checkboxes */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '8px', display: 'block' }}>
              INVITE VENDORS (SELECT MULTIPLE) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {['Dangote Steel Ltd.', 'African Industries', 'NigerSteel Plc.', 'MetalWorks Ltd.'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newRFQ.invitedVendors.includes(v)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewRFQ({ ...newRFQ, invitedVendors: [...newRFQ.invitedVendors, v] });
                      } else {
                        setNewRFQ({ ...newRFQ, invitedVendors: newRFQ.invitedVendors.filter(x => x !== v) });
                      }
                    }}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          {/* Material / Service Specifications */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B' }}>Material / Service Specification</span>
              <button
                type="button"
                onClick={() => setNewRFQ({ ...newRFQ, items: [...newRFQ.items, { item: 'Specification Item', quantity: 1, unit: 'Units' }] })}
                style={{ background: 'none', border: 'none', color: '#1E3A8A', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
              >
                + Add Item
              </button>
            </div>
            {newRFQ.items.map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <Input
                  value={it.item}
                  onChange={(e) => {
                    const items = [...newRFQ.items];
                    items[idx].item = e.target.value;
                    setNewRFQ({ ...newRFQ, items });
                  }}
                  placeholder="Item description"
                />
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) => {
                    const items = [...newRFQ.items];
                    items[idx].quantity = e.target.value;
                    setNewRFQ({ ...newRFQ, items });
                  }}
                  placeholder="Qty"
                />
                <select
                  className="form-input"
                  value={it.unit}
                  onChange={(e) => {
                    const items = [...newRFQ.items];
                    items[idx].unit = e.target.value;
                    setNewRFQ({ ...newRFQ, items });
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
            <button className="btn btn-secondary" onClick={() => handleCreateSubmit(true)}>
              Save as Draft
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleCreateSubmit(false)}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '8px' }}
            >
              Issue RFQ
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT RFQ / RFP MODAL ── */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit RFQ / RFP"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label="RFQ TITLE *" required>
              <Input
                value={editItem.title}
                onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="RFQ / RFP *" required>
                <select
                  className="form-input"
                  value={editItem.type}
                  onChange={(e) => setEditItem({ ...editItem, type: e.target.value })}
                >
                  <option value="RFQ">RFQ</option>
                  <option value="RFP">RFP</option>
                </select>
              </FormField>
              <FormField label="RELATED REQUISITIONS *" required>
                <Input
                  value={editItem.relatedRequisition}
                  onChange={(e) => setEditItem({ ...editItem, relatedRequisition: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="PROCUREMENT CATEGORY *" required>
                <Input
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                />
              </FormField>
              <FormField label="CLOSING DATE *" required>
                <Input
                  value={editItem.closingDate}
                  onChange={(e) => setEditItem({ ...editItem, closingDate: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setEditItem(null)}>
                Cancel
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditItem({ ...editItem, status: 'Issued' });
                  handleEditSave();
                }}
              >
                Submit RFQ / RFP
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

      {/* ── LOG VENDOR RESPONSE MODAL ── */}
      {logResponseModal && (
        <Modal
          isOpen={!!logResponseModal}
          onClose={() => setLogResponseModal(null)}
          title="Log Vendor Response"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
              Record a quotation received from an invited vendor
            </p>

            <FormField label="RFQ TITLE *">
              <Input value={logResponseModal.title} disabled />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="RFQ ID *">
                <Input value={logResponseModal.id} disabled />
              </FormField>
              <FormField label="RELATED REQUISITIONS *">
                <Input value={logResponseModal.relatedRequisition} disabled />
              </FormField>
            </div>

            <FormField label="VENDOR *" required>
              <select
                className="form-input"
                value={vendorResponseForm.vendor}
                onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, vendor: e.target.value })}
              >
                {['Dangote Steel Ltd.', 'African Industries Group', 'MetalBerg Engineering Ltd.', 'Prime Steel Solutions'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="VENDOR QUOTATION NO *" required>
                <Input
                  value={vendorResponseForm.quotationNo}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, quotationNo: e.target.value })}
                />
              </FormField>
              <FormField label="QUOTATION DATE *" required>
                <Input
                  value={vendorResponseForm.date}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, date: e.target.value })}
                  placeholder="DD/MM/YY"
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <FormField label="QUOTED AMOUNT *" required>
                <Input
                  type="number"
                  value={vendorResponseForm.amount}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, amount: e.target.value })}
                />
              </FormField>
              <FormField label="CURRENCY *">
                <select
                  className="form-input"
                  value={vendorResponseForm.currency}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, currency: e.target.value })}
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="DELIVERY PERIOD *">
                <Input
                  value={vendorResponseForm.deliveryPeriod}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, deliveryPeriod: e.target.value })}
                />
              </FormField>
              <FormField label="PROPOSED PAYMENT TERMS *">
                <Input
                  value={vendorResponseForm.proposedTerms}
                  onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, proposedTerms: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="PROCUREMENT NOTES">
              <textarea
                className="form-input"
                rows={2}
                value={vendorResponseForm.notes}
                onChange={(e) => setVendorResponseForm({ ...vendorResponseForm, notes: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button className="btn btn-secondary" onClick={() => setLogResponseModal(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveVendorResponse}
                style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '8px' }}
              >
                Save Response
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW RFQ DETAILS MODAL (Details & Vendor Responses Tabs) ── */}
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
                  <FiFileText size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {viewItem.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    {viewItem.type} • {viewItem.id}
                  </div>
                </div>
              </div>

              {/* Status Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {viewItem.status === 'Issued' && (
                  <>
                    <button
                      onClick={() => setConfirmModal({ type: 'close', item: viewItem })}
                      style={{
                        backgroundColor: '#1E3A8A', color: '#fff', border: 'none', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiCheck size={14} /> Close Bidding
                    </button>
                    <button
                      onClick={() => setConfirmModal({ type: 'cancel', item: viewItem })}
                      style={{
                        backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiX size={14} /> Cancel RFQ
                    </button>
                  </>
                )}
                {viewItem.status === 'Under Evaluation' && (
                  <button
                    onClick={() => setConfirmModal({ type: 'cancel', item: viewItem })}
                    style={{
                      backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                      alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <FiX size={14} /> Cancel RFQ
                  </button>
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
              <span>Status:</span>
              <span style={{
                backgroundColor: rfqStatusStyles[viewItem.status]?.bg || '#F1F5F9',
                color: rfqStatusStyles[viewItem.status]?.color || '#64748B',
                padding: '3px 12px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {viewItem.status}
              </span>
            </div>

            {/* Two Tabs: Details & Vendor Responses */}
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
                Details
              </button>
              <button
                onClick={() => setViewTab('responses')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewTab === 'responses' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewTab === 'responses' ? '#1E3A8A' : '#64748B'
                }}
              >
                Vendor Responses ({ (viewItem.responses || []).length })
              </button>
            </div>

            {/* Tab 1: Details */}
            {viewTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>RFQ TITLE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.title}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>RFQ / RFP</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.type}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>RELATED REQUISITIONS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.relatedRequisition}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PROCUREMENT CATEGORY</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.category}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>LINKED PROJECT</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.linkedProject || 'LNG Expansion Project'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CLOSING DATE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.closingDate}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>INVITED VENDORS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.vendorsInvited} Vendors</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DELIVERY LOCATION</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.deliveryLocation || 'PGSL Port Harcourt Yard'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PAYMENT TERMS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.paymentTerms || 'Net 30'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATUS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.status}</div>
                  </div>
                </div>

                {/* Attached Documents */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
                    ATTACHED DOCUMENTS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(viewItem.documents || []).map((doc, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                          <FiPaperclip size={14} color="#64748B" />
                          <span>{doc.name} ({doc.size})</span>
                        </div>
                        <button
                          className="icon-btn"
                          onClick={() => showToast(`Downloading ${doc.name}`, 'success')}
                        >
                          <FiDownloadCloud size={15} color="#2563EB" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Vendor Responses */}
            {viewTab === 'responses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(viewItem.responses && viewItem.responses.length > 0) ? (
                  viewItem.responses.map((resp, i) => {
                    const isAwarded = viewItem.status === 'Awarded' && viewItem.awardedVendor === resp.vendor;
                    return (
                      <div
                        key={i}
                        style={{
                          border: isAwarded ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                          backgroundColor: isAwarded ? '#F0FDF4' : '#FFFFFF',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{resp.vendor}</span>
                            {isAwarded && (
                              <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 600 }}>
                                Awarded
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                            Delivery Period: <strong>{resp.deliveryPeriod || '21 Days'}</strong> • {resp.status || 'Compliant'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                              {resp.amount ? fmtCurrency(resp.amount) : '—'}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase' }}>QUOTE VALUE</div>
                          </div>

                          {viewItem.status === 'Under Evaluation' && (
                            <button
                              onClick={() => setConfirmModal({ type: 'award', item: viewItem, vendor: resp.vendor })}
                              style={{
                                backgroundColor: '#1E3A8A', color: '#FFFFFF', border: 'none',
                                padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                              }}
                            >
                              <FiCheck size={14} /> Award
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8' }}>
                    No vendor responses logged yet. Use the <strong>+ Vendor Response</strong> action to log quotations.
                  </div>
                )}

                {viewItem.status === 'Issued' && (
                  <button
                    onClick={() => setLogResponseModal(viewItem)}
                    className="btn btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                  >
                    + Log New Quotation
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── CONFIRMATION MODALS (Award / Close Bidding / Cancel / Delete) ── */}
      {confirmModal && (
        <Modal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title=""
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '-10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {confirmModal.type === 'award' && 'Award Vendor?'}
              {confirmModal.type === 'close' && 'Close Bidding?'}
              {confirmModal.type === 'cancel' && 'Cancel RFQ?'}
              {confirmModal.type === 'delete' && 'Delete RFQ?'}
            </h3>

            <p style={{ margin: 0, fontSize: '0.813rem', color: '#64748B', lineHeight: 1.5 }}>
              {confirmModal.type === 'award' && `Are you sure you want to award this RFQ to ${confirmModal.vendor}? Once confirmed, this vendor will become the selected supplier for this procurement and you'll be able to generate a Purchase Order.`}
              {confirmModal.type === 'close' && `Close bidding for ${confirmModal.item.id} — ${confirmModal.item.title}? After bidding is closed: vendors can no longer submit quotations, and Procurement can begin vendor evaluation.`}
              {confirmModal.type === 'cancel' && `Are you sure you want to cancel this RFQ? Cancelled RFQs cannot receive vendor quotations and will be marked as cancelled in procurement records.`}
              {confirmModal.type === 'delete' && `Delete this draft RFQ? This action permanently removes the draft. Drafts that have not been issued can be deleted.`}
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#334155' }}>
              <div><strong>RFQ ID:</strong> {confirmModal.item.id}</div>
              <div><strong>RFQ Title:</strong> {confirmModal.item.title}</div>
            </div>

            <FormField label="REASON FOR DEACTIVATION / ACTION">
              <textarea
                className="form-input"
                rows={2}
                value={confirmationComment}
                onChange={(e) => setConfirmationComment(e.target.value)}
                placeholder="Enter commentary..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                onClick={executeConfirmationAction}
                style={{
                  backgroundColor: confirmModal.type === 'cancel' || confirmModal.type === 'delete' ? '#DC2626' : '#1E3A8A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {confirmModal.type === 'award' && 'Confirm Award'}
                {confirmModal.type === 'close' && 'Close Bidding'}
                {confirmModal.type === 'cancel' && 'Confirm Cancellation'}
                {confirmModal.type === 'delete' && 'Delete Draft'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
