import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiCheckCircle, FiPaperclip, FiDownloadCloud, FiAward,
  FiShield, FiClock, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockVendorPrequalification, mockApprovedVendors } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;

const preqStatusStyles = {
  'Approved':         { bg: '#DCFCE7', color: '#16A34A' },
  'Pending Approval': { bg: '#FEF3C7', color: '#D97706' },
  'Rejected':         { bg: '#FEE2E2', color: '#DC2626' }
};

const avlStatusStyles = {
  'Active':    { bg: '#DCFCE7', color: '#16A34A' },
  'Suspended': { bg: '#FEF3C7', color: '#D97706' },
  'Inactive':  { bg: '#F1F5F9', color: '#64748B' }
};

export default function VendorManagement() {
  const [activeTab, setActiveTab] = useState('prequalification'); // 'prequalification' | 'avl'
  const [preqList, setPreqList] = useState(mockVendorPrequalification);
  const [avlList, setAvlList] = useState(mockApprovedVendors);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [createModal, setCreateModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewPreqItem, setViewPreqItem] = useState(null);
  const [viewAvlItem, setViewAvlItem] = useState(null);
  const [viewAvlTab, setViewAvlTab] = useState('details'); // 'details' | 'history'
  const [approveConfirmModal, setApproveConfirmModal] = useState(null);
  const [approvalRemarks, setApprovalRemarks] = useState('Vendor meets all required qualification criteria. Approved for inclusion in the Approved Vendor List.');

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

  // Form states for New Vendor Prequalification
  const [newVendor, setNewVendor] = useState({
    vendor: 'EnviroSafe Nigeria Ltd',
    rcNumber: 'RC-4187',
    category: 'Waste Disposal',
    assessmentType: 'Full Prequalification',
    evaluator: 'Chinonso Okafor',
    email: 'procurement@ecowaste.com',
    phone: '+234 803 456 7890',
    address: '12 Industrial Estate Road, Ikeja, Lagos',
    productsServices: 'Licensed environmental services company specializing in industrial waste collection, transportation, recycling, and disposal.',
    score: 9,
    documents: [
      { name: 'CAC_Certificate.pdf', size: '25MB' },
      { name: 'Vendor_Quality_Assessment_Report.pdf', size: '25MB' },
      { name: 'HSE_Compliance_Assessment.pdf', size: '25MB' }
    ]
  });

  // Top KPIs
  const totalRequests = 42;
  const approvedVendorsCount = 186;
  const pendingReviewsCount = 8;
  const suspendedVendorsCount = 24;

  const filteredPreq = preqList.filter(v => {
    const q = search.toLowerCase();
    return !q ||
      v.id.toLowerCase().includes(q) ||
      v.vendor.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.status.toLowerCase().includes(q);
  });

  const filteredAvl = avlList.filter(v => {
    const q = search.toLowerCase();
    return !q ||
      v.id.toLowerCase().includes(q) ||
      v.vendor.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.status.toLowerCase().includes(q);
  });

  const currentList = activeTab === 'prequalification' ? filteredPreq : filteredAvl;
  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const paginated = currentList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreateSubmit = () => {
    const created = {
      id: `VEN-00${preqList.length + 1}`,
      vendor: newVendor.vendor,
      rcNumber: newVendor.rcNumber,
      category: newVendor.category,
      score: `${newVendor.score}/10`,
      numericScore: newVendor.score,
      status: 'Pending Approval',
      assessmentType: newVendor.assessmentType,
      evaluator: newVendor.evaluator,
      email: newVendor.email,
      phone: newVendor.phone,
      address: newVendor.address,
      screeningDate: '28/05/25',
      productsServices: newVendor.productsServices,
      approvalRemarks: '',
      documents: newVendor.documents,
      procurementHistory: []
    };

    setPreqList([created, ...preqList]);
    setCreateModal(false);
    showToast('Vendor prequalification registered', 'success');
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setPreqList(preqList.map(v => v.id === editItem.id ? editItem : v));
    setEditItem(null);
    showToast('Vendor details updated', 'success');
  };

  const handleConfirmApproval = () => {
    if (!approveConfirmModal) return;
    const vendorId = approveConfirmModal.id;

    // Update in Prequalification
    setPreqList(preqList.map(v => v.id === vendorId ? {
      ...v,
      status: 'Approved',
      approvalDate: '28/05/25',
      approvalRemarks: approvalRemarks
    } : v));

    // Add / Update in AVL
    const existing = avlList.find(v => v.id === vendorId);
    if (!existing) {
      setAvlList([{
        id: approveConfirmModal.id,
        vendor: approveConfirmModal.vendor,
        category: approveConfirmModal.category,
        approvalDate: '28/05/25',
        status: 'Active',
        rcNumber: approveConfirmModal.rcNumber || 'RC-0000',
        evaluator: approveConfirmModal.evaluator,
        phone: approveConfirmModal.phone,
        email: approveConfirmModal.email,
        address: approveConfirmModal.address
      }, ...avlList]);
    } else {
      setAvlList(avlList.map(v => v.id === vendorId ? { ...v, status: 'Active' } : v));
    }

    if (viewPreqItem && viewPreqItem.id === vendorId) {
      setViewPreqItem(prev => ({ ...prev, status: 'Approved', approvalRemarks }));
    }

    setApproveConfirmModal(null);
    showToast(`${approveConfirmModal.vendor} approved and added to AVL`, 'success');
  };

  const handleRejectVendor = (vendorId) => {
    setPreqList(preqList.map(v => v.id === vendorId ? { ...v, status: 'Rejected' } : v));
    if (viewPreqItem && viewPreqItem.id === vendorId) {
      setViewPreqItem(prev => ({ ...prev, status: 'Rejected' }));
    }
    setActiveMenuId(null);
    showToast('Vendor prequalification rejected', 'error');
  };

  const handleUpdateAvlStatus = (vendorId, status) => {
    setAvlList(avlList.map(v => v.id === vendorId ? { ...v, status } : v));
    if (viewAvlItem && viewAvlItem.id === vendorId) {
      setViewAvlItem(prev => ({ ...prev, status }));
    }
    setActiveMenuId(null);
    showToast(`Vendor status marked as ${status}`, 'info');
  };

  // Columns for Tab 1: Vendor Prequalification
  const preqColumns = [
    {
      key: 'id',
      label: 'VENDOR ID',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'category',
      label: 'VENDOR CATEGORY',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'score',
      label: 'SCORE',
      align: 'center',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = preqStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
            onClick={() => setViewPreqItem(row)}
            title="View Prequalification"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

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
                  width: '170px',
                  textAlign: 'left'
                }}
              >
                <div
                  onClick={() => { setEditItem(row); setActiveMenuId(null); }}
                  style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  className="menu-item-hover"
                >
                  <FiEdit size={14} color="#64748B" /> Edit Vendor
                </div>
                {row.status !== 'Approved' && (
                  <div
                    onClick={() => { setApproveConfirmModal(row); setActiveMenuId(null); }}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiCheck size={14} color="#16A34A" /> Approve Vendor
                  </div>
                )}
                {row.status !== 'Rejected' && (
                  <div
                    onClick={() => handleRejectVendor(row.id)}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiX size={14} color="#DC2626" /> Reject Vendor
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  // Columns for Tab 2: Approved Vendor List (AVL)
  const avlColumns = [
    {
      key: 'id',
      label: 'VENDOR ID',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'vendor',
      label: 'VENDOR',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'category',
      label: 'VENDOR CATEGORY',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'approvalDate',
      label: 'APPROVAL DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = avlStatusStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
            onClick={() => {
              const fullRecord = preqList.find(p => p.id === row.id) || row;
              setViewAvlItem(fullRecord);
              setViewAvlTab('details');
            }}
            title="View Vendor Profile"
            style={{ color: '#64748B', cursor: 'pointer' }}
          >
            <FiEye size={16} />
          </button>

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
                  width: '170px',
                  textAlign: 'left'
                }}
              >
                {row.status === 'Active' && (
                  <>
                    <div
                      onClick={() => handleUpdateAvlStatus(row.id, 'Suspended')}
                      style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      className="menu-item-hover"
                    >
                      <FiShield size={14} color="#D97706" /> Suspend Vendor
                    </div>
                    <div
                      onClick={() => handleUpdateAvlStatus(row.id, 'Inactive')}
                      style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      className="menu-item-hover"
                    >
                      <FiX size={14} color="#DC2626" /> Mark Inactive
                    </div>
                  </>
                )}

                {row.status === 'Suspended' && (
                  <>
                    <div
                      onClick={() => handleUpdateAvlStatus(row.id, 'Active')}
                      style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      className="menu-item-hover"
                    >
                      <FiCheck size={14} color="#16A34A" /> Mark Active
                    </div>
                    <div
                      onClick={() => handleUpdateAvlStatus(row.id, 'Inactive')}
                      style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                      className="menu-item-hover"
                    >
                      <FiX size={14} color="#DC2626" /> Mark Inactive
                    </div>
                  </>
                )}

                {row.status === 'Inactive' && (
                  <div
                    onClick={() => handleUpdateAvlStatus(row.id, 'Active')}
                    style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    className="menu-item-hover"
                  >
                    <FiCheck size={14} color="#16A34A" /> Mark Active
                  </div>
                )}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Vendor Management</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage vendor prequalification and approved supplier records
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Vendor registry file imported', 'info')}
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
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL REQUESTS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{totalRequests}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Vendor applications under review</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
            <FiFileText size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>APPROVED VENDORS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{approvedVendorsCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Available for procurement activities</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>PENDING REVIEWS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{pendingReviewsCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Awaiting Quality and HSE assessments</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiClock size={18} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>SUSPENDED VENDORS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{suspendedVendorsCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px' }}>Temporarily restricted from procurement</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <FiShield size={18} />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Vendor Prequalification vs Approved Vendor List (AVL) */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '4px' }}>
        <button
          onClick={() => { setActiveTab('prequalification'); setPage(1); }}
          style={{
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'prequalification' ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: activeTab === 'prequalification' ? '#1E3A8A' : '#64748B'
          }}
        >
          Vendor Prequalification
        </button>
        <button
          onClick={() => { setActiveTab('avl'); setPage(1); }}
          style={{
            padding: '12px 24px',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'avl' ? '2.5px solid #1E3A8A' : '2.5px solid transparent',
            color: activeTab === 'avl' ? '#1E3A8A' : '#64748B'
          }}
        >
          Approved Vendor List (AVL)
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
              placeholder={activeTab === 'prequalification' ? 'Search by Preq. ID ...' : 'Search by Vendor ID, Name ...'}
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
              onClick={() => showToast('Exporting vendor list...', 'success')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px' }}
            >
              <FiDownload size={15} /> Export
            </button>
            {activeTab === 'prequalification' && (
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
                <FiPlus size={16} /> New Prequalification
              </button>
            )}
          </div>
        </div>

        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={activeTab === 'prequalification' ? preqColumns : avlColumns}
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id"
            emptyMessage={activeTab === 'prequalification' ? 'No vendor prequalifications found.' : 'No vendors found in AVL.'}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── NEW VENDOR PREQUALIFICATION MODAL ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="New Vendor Prequalification"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Register a new vendor for procurement and service management
          </p>

          <FormField label="VENDOR *" required>
            <Input
              value={newVendor.vendor}
              onChange={(e) => setNewVendor({ ...newVendor, vendor: e.target.value })}
              placeholder="e.g. EnviroSafe Nigeria Ltd"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="VENDOR RC NUMBER *" required>
              <Input
                value={newVendor.rcNumber}
                onChange={(e) => setNewVendor({ ...newVendor, rcNumber: e.target.value })}
                placeholder="e.g RC-4187"
              />
            </FormField>

            <FormField label="VENDOR CATEGORY *" required>
              <select
                className="form-input"
                value={newVendor.category}
                onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              >
                {['Waste Disposal', 'Cement Supplier', 'Steel Supplier', 'Equipment Supplier', 'Calibration Services', 'Inspection & Certification', 'Electrical & Instrumentation'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="ASSESSMENT TYPE *" required>
              <select
                className="form-input"
                value={newVendor.assessmentType}
                onChange={(e) => setNewVendor({ ...newVendor, assessmentType: e.target.value })}
              >
                <option value="Full Prequalification">Full Prequalification</option>
                <option value="Desktop Assessment">Desktop Assessment</option>
              </select>
            </FormField>

            <FormField label="EVALUATOR *" required>
              <select
                className="form-input"
                value={newVendor.evaluator}
                onChange={(e) => setNewVendor({ ...newVendor, evaluator: e.target.value })}
              >
                {['Chinonso Okafor', 'Zainab Mohammed', 'Tunde Bakare', 'Adaobi Udo'].map(ev => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="EMAIL ADDRESS *" required>
              <Input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              />
            </FormField>

            <FormField label="PHONE NUMBER *" required>
              <Input
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="PHYSICAL ADDRESS *" required>
            <Input
              value={newVendor.address}
              onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
            />
          </FormField>

          <FormField label="PRODUCTS/SERVICES *" required>
            <textarea
              className="form-input"
              rows={2}
              value={newVendor.productsServices}
              onChange={(e) => setNewVendor({ ...newVendor, productsServices: e.target.value })}
            />
          </FormField>

          {/* Scoring Checklist */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.813rem', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
              :: Scoring Checklist (1-10 Index)
            </div>
            <FormField label="Score *">
              <Input
                type="number"
                min="1"
                max="10"
                value={newVendor.score}
                onChange={(e) => setNewVendor({ ...newVendor, score: e.target.value })}
              />
            </FormField>
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
              onClick={() => showToast('Attachment file dialog triggered', 'info')}
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
              Add Vendor
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT DETAILS MODAL ── */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit Details"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label="VENDOR *" required>
              <Input
                value={editItem.vendor}
                onChange={(e) => setEditItem({ ...editItem, vendor: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="VENDOR RC NUMBER *" required>
                <Input
                  value={editItem.rcNumber || ''}
                  onChange={(e) => setEditItem({ ...editItem, rcNumber: e.target.value })}
                />
              </FormField>

              <FormField label="VENDOR CATEGORY *" required>
                <Input
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="EMAIL ADDRESS *" required>
                <Input
                  value={editItem.email || ''}
                  onChange={(e) => setEditItem({ ...editItem, email: e.target.value })}
                />
              </FormField>
              <FormField label="PHONE NUMBER *" required>
                <Input
                  value={editItem.phone || ''}
                  onChange={(e) => setEditItem({ ...editItem, phone: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="PHYSICAL ADDRESS *">
              <Input
                value={editItem.address || ''}
                onChange={(e) => setEditItem({ ...editItem, address: e.target.value })}
              />
            </FormField>

            <FormField label="PRODUCTS/SERVICES *">
              <textarea
                className="form-input"
                rows={2}
                value={editItem.productsServices || ''}
                onChange={(e) => setEditItem({ ...editItem, productsServices: e.target.value })}
              />
            </FormField>

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

      {/* ── APPROVE VENDOR CONFIRMATION MODAL ── */}
      {approveConfirmModal && (
        <Modal
          isOpen={!!approveConfirmModal}
          onClose={() => setApproveConfirmModal(null)}
          title=""
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '-10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Approve Vendor?
            </h3>
            <p style={{ margin: 0, fontSize: '0.813rem', color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to approve this vendor? Once approved, the vendor will be added to the Approved Vendor List (AVL) and will be available for procurement activities.
            </p>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#334155' }}>
              <div><strong>Vendor ID:</strong> {approveConfirmModal.id}</div>
              <div><strong>Vendor:</strong> {approveConfirmModal.vendor}</div>
            </div>

            <FormField label="APPROVAL REMARKS">
              <textarea
                className="form-input"
                rows={3}
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setApproveConfirmModal(null)}>
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                style={{
                  backgroundColor: '#1E3A8A',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FiCheck size={14} /> Approve Vendor
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── VIEW PREQUALIFICATION MODAL ── */}
      {viewPreqItem && (
        <Modal
          isOpen={!!viewPreqItem}
          onClose={() => setViewPreqItem(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewPreqItem.vendor}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewPreqItem.id} • {viewPreqItem.rcNumber}
                </div>
              </div>

              {viewPreqItem.status === 'Pending Approval' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setApproveConfirmModal(viewPreqItem); setViewPreqItem(null); }}
                    style={{
                      backgroundColor: '#1E3A8A', color: '#fff', border: 'none', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                      alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <FiCheck size={14} /> Approve Vendor
                  </button>
                  <button
                    onClick={() => handleRejectVendor(viewPreqItem.id)}
                    style={{
                      backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                      alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <FiX size={14} /> Reject
                  </button>
                </div>
              )}
            </div>

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
              <span>Status:</span>
              <span style={{
                backgroundColor: preqStatusStyles[viewPreqItem.status]?.bg || '#F1F5F9',
                color: preqStatusStyles[viewPreqItem.status]?.color || '#64748B',
                padding: '3px 12px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {viewPreqItem.status}
              </span>
            </div>

            {/* Details Grid */}
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
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR RC NUMBER</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.rcNumber}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR CATEGORY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.category}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ASSESSMENT TYPE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.assessmentType}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EVALUATOR</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.evaluator}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EMAIL ADDRESS</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.email}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PHONE NUMBER</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>SCREENING DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.screeningDate}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PHYSICAL ADDRESS</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewPreqItem.address}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>SCORE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3A8A', marginTop: '4px' }}>{viewPreqItem.score}</div>
              </div>
            </div>

            {/* Products / Services */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                PRODUCTS/SERVICES
              </div>
              <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                {viewPreqItem.productsServices}
              </p>
            </div>

            {/* Approval remarks if present */}
            {viewPreqItem.approvalRemarks && (
              <div style={{ backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #DCFCE7', padding: '16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  APPROVAL REMARKS
                </div>
                <p style={{ margin: 0, fontSize: '0.813rem', color: '#166534', lineHeight: 1.5 }}>
                  {viewPreqItem.approvalRemarks}
                </p>
              </div>
            )}

            {/* Documents */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
                ATTACHED DOCUMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(viewPreqItem.documents || []).map((doc, i) => (
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
        </Modal>
      )}

      {/* ── VIEW AVL VENDOR PROFILE MODAL (Details & Procurement History Tabs) ── */}
      {viewAvlItem && (
        <Modal
          isOpen={!!viewAvlItem}
          onClose={() => setViewAvlItem(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '-10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {viewAvlItem.vendor}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                  {viewAvlItem.id} • {viewAvlItem.rcNumber || 'RC-4187'}
                </div>
              </div>

              {/* Status bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
                <span>Status:</span>
                <span style={{
                  backgroundColor: avlStatusStyles[viewAvlItem.status]?.bg || '#F1F5F9',
                  color: avlStatusStyles[viewAvlItem.status]?.color || '#64748B',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {viewAvlItem.status}
                </span>
              </div>
            </div>

            {/* 2 Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginTop: '6px' }}>
              <button
                onClick={() => setViewAvlTab('details')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewAvlTab === 'details' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewAvlTab === 'details' ? '#1E3A8A' : '#64748B'
                }}
              >
                Details
              </button>
              <button
                onClick={() => setViewAvlTab('history')}
                style={{
                  padding: '10px 24px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: viewAvlTab === 'history' ? '2px solid #1E3A8A' : '2px solid transparent',
                  color: viewAvlTab === 'history' ? '#1E3A8A' : '#64748B'
                }}
              >
                Procurement History
              </button>
            </div>

            {viewAvlTab === 'details' && (
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
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR ID</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR RC NUMBER</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.rcNumber || 'RC-4187'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>VENDOR CATEGORY</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ASSESSMENT TYPE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>Full Prequalification</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EVALUATOR</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.evaluator || 'Chinonso Okafor'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>EMAIL ADDRESS</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.email || 'procurement@ecowaste.com'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PHONE NUMBER</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewAvlItem.phone || '+234 803 456 7890'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>SCREENING DATE</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>12/02/26</div>
                </div>
              </div>
            )}

            {viewAvlTab === 'history' && (
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.813rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Reference</th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Date</th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', color: '#475569', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      { ref: 'RFQ-2026-031', description: 'Lagos Terminal Upgrade', date: '22/06/26', status: 'Awarded' },
                      { ref: 'PO-2026-0142', description: 'Escravos Flow Station', date: '22/06/26', status: 'Delivered' },
                      { ref: 'PO-2026-0118', description: 'Bonny Gas Expansion', date: '24/07/26', status: 'Closed' }
                    ]).map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1E3A8A' }}>{h.ref}</td>
                        <td style={{ padding: '12px 16px', color: '#0F172A' }}>{h.description}</td>
                        <td style={{ textAlign: 'center', padding: '12px 16px', color: '#64748B' }}>{h.date}</td>
                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                          <span style={{ backgroundColor: '#DCFCE7', color: '#16A34A', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600 }}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
