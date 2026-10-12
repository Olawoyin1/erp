import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiUpload, FiPlus, FiEye, FiMoreVertical,
  FiEdit, FiCheck, FiX, FiArrowRight, FiFileText, FiPaperclip, FiDownloadCloud
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockRequisitions } from '../../data/mockProcurement';

const ITEMS_PER_PAGE = 8;
const fmtCurrency = (n) => '₦' + Number(n).toLocaleString();

// Status styling according to screenshots
const statusBadgeStyles = {
  'Pending Approval': { bg: '#FEF3C7', color: '#D97706', border: 'none' },
  'Draft':            { bg: '#F1F5F9', color: '#64748B', border: 'none' },
  'Converted to RFQ': { bg: '#E0F2FE', color: '#0284C7', border: 'none' },
  'Approved':         { bg: '#DCFCE7', color: '#16A34A', border: 'none' },
  'Rejected':         { bg: '#FEE2E2', color: '#DC2626', border: 'none' }
};

const priorityStyles = {
  'Hot':    { bg: '#FEE2E2', color: '#DC2626' },
  'High':   { bg: '#FEE2E2', color: '#DC2626' },
  'Medium': { bg: '#FEF3C7', color: '#D97706' },
  'Low':    { bg: '#E0F2FE', color: '#0284C7' }
};

export default function PurchaseRequests() {
  const [data, setData] = useState(mockRequisitions);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modals state
  const [createModal, setCreateModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef();

  const { toast, showToast, hideToast } = useToast();

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Form states for New Requisition
  const [formData, setFormData] = useState({
    materials: 'Structural Steel Beams (IPE 300)',
    category: 'Materials',
    department: 'HSE',
    quantity: '25',
    unit: 'Pieces',
    estimatedBudget: '12500000',
    project: 'LNG Expansion Project',
    priority: 'High',
    requestedBy: 'Chinonso Okafor',
    requestDate: '22/05/26',
    requiredDate: '29/05/26',
    justification: 'Steel beams are required to complete the structural framework for Area B before mechanical installation begins.',
    documents: [
      { name: 'BOQ_Revision_03.pdf', size: '25MB' },
      { name: 'Structural_Drawing.pdf', size: '25MB' }
    ]
  });

  const categories = [
    'Materials', 'Equipment', 'Services', 'PPE', 'Spare Parts', 'Office Supplies', 'IT Equipment', 'Consumables'
  ];

  const filtered = data.filter(item => {
    const q = search.toLowerCase();
    return !q ||
      item.id.toLowerCase().includes(q) ||
      item.materials.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.requestedBy.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleCreateSubmit = (asDraft = false) => {
    const newReq = {
      id: `PR-25-0${data.length + 1}`,
      materials: formData.materials,
      department: formData.department,
      requestedBy: formData.requestedBy,
      priority: formData.priority,
      requestDate: formData.requestDate || '28/05/25',
      requiredDate: formData.requiredDate || '10/06/25',
      status: asDraft ? 'Draft' : 'Pending Approval',
      category: formData.category,
      quantity: Number(formData.quantity) || 1,
      unit: formData.unit,
      estimatedBudget: Number(formData.estimatedBudget) || 0,
      project: formData.project,
      justification: formData.justification,
      documents: formData.documents
    };

    setData([newReq, ...data]);
    setCreateModal(false);
    showToast(asDraft ? 'Requisition saved as draft' : 'Requisition submitted successfully', 'success');
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setData(data.map(item => item.id === editItem.id ? editItem : item));
    setEditItem(null);
    showToast('Requisition updated successfully', 'success');
  };

  const handleStatusChange = (id, newStatus, message) => {
    setData(data.map(item => item.id === id ? { ...item, status: newStatus } : item));
    setActiveMenuId(null);
    if (viewItem && viewItem.id === id) {
      setViewItem(prev => ({ ...prev, status: newStatus }));
    }
    showToast(message || `Requisition status updated to ${newStatus}`, 'success');
  };

  const handleDelete = (id) => {
    setData(data.filter(item => item.id !== id));
    setActiveMenuId(null);
    showToast('Requisition deleted successfully', 'success');
  };

  const columns = [
    {
      key: 'id',
      label: 'REQUISITION ID',
      render: (v) => <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
    },
    {
      key: 'materials',
      label: 'REQUESTED MATERIALS',
      render: (v) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{v}</span>
    },
    {
      key: 'department',
      label: 'DEPARTMENT',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>
    },
    {
      key: 'requestedBy',
      label: 'REQUESTED BY',
      render: (v) => <span style={{ color: '#334155' }}>{v}</span>
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (v) => {
        const style = priorityStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.color,
            padding: '3px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 500
          }}>
            {v}
          </span>
        );
      }
    },
    {
      key: 'requestDate',
      label: 'REQUEST DATE',
      render: (v) => <span style={{ color: '#64748B' }}>{v}</span>
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (v) => {
        const style = statusBadgeStyles[v] || { bg: '#F1F5F9', color: '#64748B' };
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
        const isPending = row.status === 'Pending Approval';
        const isApproved = row.status === 'Approved';

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', position: 'relative' }}>
            {/* View Icon */}
            <button
              className="icon-btn"
              title="View Requisition"
              onClick={() => setViewItem(row)}
              style={{ color: '#64748B', cursor: 'pointer' }}
            >
              <FiEye size={16} />
            </button>

            {/* Context Action Menu */}
            {(isDraft || isPending || isApproved) && (
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
                          <FiEdit size={14} color="#64748B" /> Edit Requisition
                        </div>
                        <div
                          onClick={() => handleStatusChange(row.id, 'Pending Approval', 'Requisition submitted for approval')}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiCheck size={14} color="#16A34A" /> Submit Requisition
                        </div>
                        <div
                          onClick={() => handleDelete(row.id)}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiX size={14} color="#DC2626" /> Delete Requisition
                        </div>
                      </>
                    )}

                    {isPending && (
                      <>
                        <div
                          onClick={() => handleStatusChange(row.id, 'Approved', 'Requisition approved successfully')}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiCheck size={14} color="#16A34A" /> Approve Requisition
                        </div>
                        <div
                          onClick={() => handleStatusChange(row.id, 'Rejected', 'Requisition rejected')}
                          style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                          className="menu-item-hover"
                        >
                          <FiX size={14} color="#DC2626" /> Reject Requisition
                        </div>
                      </>
                    )}

                    {isApproved && (
                      <div
                        onClick={() => handleStatusChange(row.id, 'Converted to RFQ', 'Requisition converted to RFQ')}
                        style={{ padding: '8px 14px', fontSize: '0.813rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        className="menu-item-hover"
                      >
                        <FiArrowRight size={14} color="#2563EB" /> Convert to RFQ/RFP
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

      {/* Header bar matching exact screenshot */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Requisition Tracker</h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Track and manage procurement requests submitted across all departments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Import / Upload ready', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px' }}
          >
            <FiUpload size={15} /> Upload
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
        {/* Search & Actions Bar */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search Requisition ID, Department ..."
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
              onClick={() => showToast('Exporting requisitions report...', 'success')}
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
              <FiPlus size={16} /> New Requisition
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ padding: '0 24px 16px' }}>
          <DataTable
            columns={columns}
            data={paginated}
            selectable
            selectedIds={selectedIds}
            onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onSelectAll={() => setSelectedIds(selectedIds.length === paginated.length ? [] : paginated.map(e => e.id))}
            keyField="id"
            emptyMessage="No requisitions found matching search."
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── NEW REQUISITION MODAL ── */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="New Requisition"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: '-8px 0 8px 0', fontSize: '0.813rem', color: '#64748B' }}>
            Submit a new procurement request for review and approval
          </p>

          <FormField label="REQUESTED MATERIAL/SERVICE *" required>
            <Input
              value={formData.materials}
              onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              placeholder="e.g. Structural Steel Beams (IPE 300)"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="CATEGORY *" required>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="DEPARTMENT *" required>
              <select
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                {['HSE', 'Technical', 'Administration', 'Finance', 'Operations', 'Quality'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px' }}>
            <FormField label="QUANTITY *" required>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </FormField>

            <FormField label="UNIT *" required>
              <select
                className="form-input"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {['Pieces', 'Tonnes', 'Units', 'Sets', 'Litres', 'Bags', 'Lots'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </FormField>

            <FormField label="ESTIMATED BUDGET (₦) *" required>
              <Input
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="PROJECT *" required>
            <select
              className="form-input"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            >
              {['LNG Expansion Project', 'Offshore Safety Upgrade', 'HQ Facility Upgrade', 'Bonny Terminal Operations', 'Warri Base Camp'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              ⓘ Select a project if this request is project-specific.
            </span>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="PRIORITY *" required>
              <select
                className="form-input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {['High', 'Medium', 'Low', 'Hot'].map(pr => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </FormField>

            <FormField label="REQUESTED BY *" required>
              <select
                className="form-input"
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
              >
                {['Chinonso Okafor', 'Chijioke Okafor', 'Zainab Mohammed', 'Obinna Nwosu', 'Adaobi Udo'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="REQUEST DATE">
              <Input
                type="text"
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
              />
            </FormField>

            <FormField label="REQUIRED DATE">
              <Input
                type="text"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                placeholder="DD/MM/YY"
              />
            </FormField>
          </div>

          <FormField label="JUSTIFICATION">
            <textarea
              className="form-input"
              rows={3}
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            />
          </FormField>

          {/* Upload Dropzone */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
              ATTACH DOCUMENT (OPTIONAL)
            </label>
            <div
              style={{
                border: '1.5px dashed #CBD5E1',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                cursor: 'pointer'
              }}
              onClick={() => showToast('Document selector triggered', 'info')}
            >
              <FiUpload size={24} color="#64748B" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>PDF, DOCX, DWG, PNG, up to 50MB</div>
            </div>

            {/* Uploaded attachments preview */}
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {formData.documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#334155' }}>
                    <FiPaperclip size={14} color="#64748B" />
                    <span>{doc.name} ({doc.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, documents: formData.documents.filter((_, i) => i !== idx) })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleCreateSubmit(true)}
              style={{ fontWeight: 600 }}
            >
              Save as Draft
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleCreateSubmit(false)}
              style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF', fontWeight: 600, padding: '9px 20px', borderRadius: '8px' }}
            >
              Submit Requisition
            </button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT REQUISITION MODAL ── */}
      {editItem && (
        <Modal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          title="Edit Requisition"
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label="REQUESTED MATERIAL/SERVICE *" required>
              <Input
                value={editItem.materials}
                onChange={(e) => setEditItem({ ...editItem, materials: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="CATEGORY *" required>
                <select
                  className="form-input"
                  value={editItem.category || 'Materials'}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>

              <FormField label="DEPARTMENT *" required>
                <Input
                  value={editItem.department}
                  onChange={(e) => setEditItem({ ...editItem, department: e.target.value })}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px' }}>
              <FormField label="QUANTITY *" required>
                <Input
                  type="number"
                  value={editItem.quantity || 1}
                  onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                />
              </FormField>

              <FormField label="UNIT *" required>
                <Input
                  value={editItem.unit || 'Pieces'}
                  onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                />
              </FormField>

              <FormField label="ESTIMATED BUDGET (₦) *" required>
                <Input
                  type="number"
                  value={editItem.estimatedBudget || 0}
                  onChange={(e) => setEditItem({ ...editItem, estimatedBudget: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="PROJECT *" required>
              <Input
                value={editItem.project || 'LNG Expansion Project'}
                onChange={(e) => setEditItem({ ...editItem, project: e.target.value })}
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="PRIORITY *" required>
                <select
                  className="form-input"
                  value={editItem.priority}
                  onChange={(e) => setEditItem({ ...editItem, priority: e.target.value })}
                >
                  {['High', 'Medium', 'Low', 'Hot'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="REQUESTED BY *" required>
                <Input
                  value={editItem.requestedBy}
                  onChange={(e) => setEditItem({ ...editItem, requestedBy: e.target.value })}
                />
              </FormField>
            </div>

            <FormField label="JUSTIFICATION">
              <textarea
                className="form-input"
                rows={3}
                value={editItem.justification || ''}
                onChange={(e) => setEditItem({ ...editItem, justification: e.target.value })}
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

      {/* ── VIEW REQUISITION DETAILS MODAL ── */}
      {viewItem && (
        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title=""
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '-10px' }}>
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
                    {viewItem.materials}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    {viewItem.requestedBy} • {viewItem.id}
                  </div>
                </div>
              </div>

              {/* Status Header Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {viewItem.status === 'Pending Approval' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(viewItem.id, 'Approved', 'Requisition approved')}
                      style={{
                        backgroundColor: '#16A34A', color: '#fff', border: 'none', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiCheck size={14} /> Approve Requisition
                    </button>
                    <button
                      onClick={() => handleStatusChange(viewItem.id, 'Rejected', 'Requisition rejected')}
                      style={{
                        backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '8px 16px',
                        borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                        alignItems: 'center', gap: '6px', cursor: 'pointer'
                      }}
                    >
                      <FiX size={14} /> Reject
                    </button>
                  </>
                )}
                {viewItem.status === 'Approved' && (
                  <button
                    onClick={() => handleStatusChange(viewItem.id, 'Converted to RFQ', 'Requisition converted to RFQ')}
                    style={{
                      backgroundColor: '#1E3A8A', color: '#fff', border: 'none', padding: '8px 16px',
                      borderRadius: '6px', fontWeight: 600, fontSize: '0.813rem', display: 'flex',
                      alignItems: 'center', gap: '6px', cursor: 'pointer'
                    }}
                  >
                    <FiArrowRight size={14} /> Convert to RFQ/RFP
                  </button>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#64748B' }}>
              <span>Status:</span>
              <span style={{
                backgroundColor: statusBadgeStyles[viewItem.status]?.bg || '#F1F5F9',
                color: statusBadgeStyles[viewItem.status]?.color || '#64748B',
                padding: '3px 12px',
                borderRadius: '12px',
                fontWeight: 600
              }}>
                {viewItem.status}
              </span>
            </div>

            {/* Requisition Details Grid */}
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
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REQUESTED MATERIAL/SERVICE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.materials}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>CATEGORY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.category || 'Materials'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REQUISITION ID</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>DEPARTMENT</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.department}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>QUANTITY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.quantity} {viewItem.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>ESTIMATED BUDGET</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3A8A', marginTop: '4px' }}>{fmtCurrency(viewItem.estimatedBudget || 0)}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PRIORITY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.priority}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>PROJECT</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.project || 'General'}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REQUESTED BY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.requestedBy}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REQUEST DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.requestDate}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>REQUIRED DATE</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.requiredDate}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>STATUS</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>{viewItem.status}</div>
              </div>
            </div>

            {/* Justification Box */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                JUSTIFICATION
              </div>
              <p style={{ margin: 0, fontSize: '0.813rem', color: '#334155', lineHeight: 1.5 }}>
                {viewItem.justification || 'No justification entered.'}
              </p>
            </div>

            {/* Attached Documents */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '12px' }}>
                ATTACHED DOCUMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(viewItem.documents || []).length > 0 ? (
                  viewItem.documents.map((doc, i) => (
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
                        title="Download attachment"
                      >
                        <FiDownloadCloud size={15} color="#2563EB" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.813rem', color: '#94A3B8' }}>No attached documents.</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
