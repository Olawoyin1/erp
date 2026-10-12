import React, { useState, useRef, useEffect } from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiPlus, FiEye, FiMoreVertical,
  FiCheck, FiX, FiPrinter, FiFileText
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import { Input, FormField, Select } from '../../components/ui/FormField';
import Toast, { useToast } from '../../components/ui/Toast';
import { mockFinanceForms } from '../../data/mockFinance';

const ITEMS_PER_PAGE = 10;
const fmt = (n) => '₦' + Number(n).toLocaleString();

const FORM_TYPES = [
  'All Types',
  'CapEx Requisition',
  'Payment Request',
  'Budget Adjustment Request',
  'Vendor Advance Request',
  'Cash Advance'
];
const DEPARTMENTS = ['Procurement', 'Finance', 'Projects', 'Operations', 'Technical', 'HSE'];

function RowMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)}>
        <FiMoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: '4px',
          backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
          border: '1px solid #E2E8F0', padding: '6px 0', zIndex: 50, width: '180px'
        }}>
          {items.map((it, idx) => (
            <div
              key={idx}
              onClick={() => { it.onClick(); setOpen(false); }}
              style={{
                padding: '8px 14px', fontSize: '0.813rem', color: it.danger ? '#DC2626' : '#334155',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = it.danger ? '#FEE2E2' : '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              {it.icon} {it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FinanceForms() {
  const [data, setData] = useState(mockFinanceForms);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All Types');

  const { toast, showToast, hideToast } = useToast();

  // Drawers & Modals
  const [viewItem, setViewItem] = useState(null);
  const [createModal, setCreateModal] = useState(false);

  const [form, setForm] = useState({
    formId: `FIN-0${data.length + 1}`,
    formType: 'Payment Request',
    requestTitle: '',
    department: 'Procurement',
    requestedBy: '',
    vendor: '',
    project: 'Offshore Pipeline Upgrade',
    amount: '',
    requestDate: new Date().toISOString().slice(0, 10),
    justification: ''
  });

  const filteredData = data.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.formId.toLowerCase().includes(q) || r.requestTitle.toLowerCase().includes(q) || r.requestedBy.toLowerCase().includes(q);
    const matchesType = typeFilter === 'All Types' || r.formType === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const paginated = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectRow = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginated.length) setSelectedIds([]);
    else setSelectedIds(paginated.map((item) => item.id));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.requestTitle || !form.amount || !form.requestedBy) {
      showToast('Please fill all required requisition details', 'error');
      return;
    }
    const newEntry = {
      id: Date.now(),
      ...form,
      amount: Number(form.amount),
      status: 'Pending Approval'
    };
    setData([newEntry, ...data]);
    showToast('Payment requisition form submitted for approval', 'success');
    setCreateModal(false);
  };

  const columns = [
    {
      key: 'formId',
      label: 'FORM ID',
      render: (val, row) => (
        <span
          style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => setViewItem(row)}
        >
          {val}
        </span>
      )
    },
    {
      key: 'formType',
      label: 'TYPE',
      render: (val) => (
        <span style={{
          padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
          background: '#EDE9FE', color: '#7C3AED'
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'requestTitle',
      label: 'REQUEST TITLE',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{val}</span>
    },
    { key: 'department', label: 'DEPARTMENT' },
    { key: 'requestedBy', label: 'REQUESTED BY' },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (val) => <span style={{ fontWeight: 600, color: '#0F172A' }}>{fmt(val)}</span>
    },
    { key: 'requestDate', label: 'DATE' },
    {
      key: 'status',
      label: 'STATUS',
      render: (val) => <Badge status={val} />
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          <button className="icon-btn" onClick={() => setViewItem(row)}>
            <FiEye size={15} />
          </button>
          <RowMenu
            items={[
              {
                icon: <FiEye size={14} />,
                label: 'View Voucher',
                onClick: () => setViewItem(row)
              },
              {
                icon: <FiCheck size={14} />,
                label: 'Approve Request',
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Approved' } : d));
                  showToast('Requisition form approved', 'success');
                }
              },
              {
                icon: <FiX size={14} />,
                label: 'Reject Request',
                danger: true,
                onClick: () => {
                  setData(data.map(d => d.id === row.id ? { ...d, status: 'Rejected' } : d));
                  showToast('Requisition form rejected', 'info');
                }
              }
            ]}
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Finance Requests & Forms
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '2px', margin: 0 }}>
            Submit, review, and track internal payment requisitions, cash advances, and budget adjustment forms
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => showToast('Exporting requisitions...', 'info')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <FiDownload size={14} /> Export
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setCreateModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: '#1D4ED8', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, border: 'none'
            }}
          >
            <FiPlus size={14} /> New Request
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="table-toolbar">
          <div className="table-toolbar-search">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search request ID, title, requested by..."
              style={{ paddingLeft: '36px', width: '100%' }}
            />
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
              <FiSearch size={15} />
            </div>
          </div>

          <div className="table-toolbar-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setFilterOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiFilter size={14} /> Filter
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => showToast('Exporting spreadsheet...', 'info')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
            >
              <FiDownload size={14} /> Export
            </button>
          </div>
        </div>

        {/* Base Enterprise DataTable */}
        <DataTable
          columns={columns}
          data={paginated}
          selectable
          selectedIds={selectedIds}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          keyField="id"
          emptyMessage="No finance requisition forms found."
        />

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* ─── SLIDE-OVER DRAWER: REQUISITION VOUCHER DETAILS ─── */}
      <Drawer
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title={viewItem ? `${viewItem.formId} – ${viewItem.formType}` : ''}
        subtitle="Departmental payment requisition review and authorization"
        width="520px"
        footer={(
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 14px' }}
              onClick={() => window.print()}
            >
              <FiPrinter size={14} /> Print Voucher
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 14px', backgroundColor: '#1D4ED8' }}
              onClick={() => setViewItem(null)}
            >
              Close
            </button>
          </div>
        )}
      >
        {viewItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Requested Amount</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {fmt(viewItem.amount)}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Badge status={viewItem.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong style={{ color: '#64748B' }}>Department:</strong> {viewItem.department}</div>
              <div><strong style={{ color: '#64748B' }}>Requested By:</strong> {viewItem.requestedBy}</div>
              <div><strong style={{ color: '#64748B' }}>Vendor / Payee:</strong> {viewItem.vendor || 'N/A'}</div>
              <div><strong style={{ color: '#64748B' }}>Project:</strong> {viewItem.project}</div>
              <div><strong style={{ color: '#64748B' }}>Date:</strong> {viewItem.requestDate}</div>
            </div>

            <div>
              <strong style={{ fontSize: '0.813rem', color: '#64748B', display: 'block', marginBottom: '6px' }}>Justification</strong>
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', fontSize: '0.813rem', color: '#1E293B', lineHeight: 1.5, border: '1px solid #E2E8F0' }}>
                {viewItem.justification || viewItem.requestTitle}
              </div>
            </div>

            {viewItem.doc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#EFF6FF', padding: '10px 14px', borderRadius: '6px', color: '#1D4ED8', fontSize: '0.813rem' }}>
                <FiFileText size={16} />
                <span>Supporting Attachment: {viewItem.doc}</span>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Requisitions"
        subtitle="Filter by internal form type"
        width="420px"
        footer={(
          <>
            <button
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem' }}
              onClick={() => { setTypeFilter('All Types'); setFilterOpen(false); }}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', backgroundColor: '#1D4ED8' }}
              onClick={() => setFilterOpen(false)}
            >
              Apply Filters
            </button>
          </>
        )}
      >
        <FormField label="Form Type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
            {FORM_TYPES.map(t => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.813rem', color: '#1E293B', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="ftype"
                  checked={typeFilter === t}
                  onChange={() => setTypeFilter(t)}
                  style={{ accentColor: '#1D4ED8', cursor: 'pointer' }}
                />
                {t}
              </label>
            ))}
          </div>
        </FormField>
      </Drawer>

      {/* Modal: New Requisition */}
      {createModal && (
        <Modal
          isOpen={true}
          onClose={() => setCreateModal(false)}
          title="Submit Finance Requisition Form"
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Form ID">
                <Input value={form.formId} disabled />
              </FormField>
              <FormField label="Form Type">
                <select
                  value={form.formType}
                  onChange={(e) => setForm({ ...form, formType: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {FORM_TYPES.filter(t => t !== 'All Types').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Request Title / Purpose">
              <Input
                value={form.requestTitle}
                onChange={(e) => setForm({ ...form, requestTitle: e.target.value })}
                placeholder="e.g. Payment for Structural Steel Supply"
                required
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Department">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem' }}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="Requested By">
                <Input
                  value={form.requestedBy}
                  onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
                  placeholder="e.g. Nafisat Abubakar"
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormField label="Vendor / Beneficiary">
                <Input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="e.g. ABC Steel Ltd."
                />
              </FormField>
              <FormField label="Amount (NGN)">
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="25,000,000"
                  required
                />
              </FormField>
            </div>

            <FormField label="Justification & Supporting Details">
              <textarea
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '0.813rem', fontFamily: 'var(--font)' }}
                placeholder="Contract reference, delivery milestone, or urgent operational requirement..."
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ backgroundColor: '#1D4ED8' }}
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
